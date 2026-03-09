<script setup>
import { reactive, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { PlusOutlined, MinusCircleOutlined, InboxOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import axios from 'axios';

const router = useRouter();
const formRef = ref();

const formState = reactive({
  type: 'SINGLE',
  category: '',
  question_en: '',
  question_ko: '',
  options: [{ en: '', ko: '' }, { en: '', ko: '' }, { en: '', ko: '' }, { en: '', ko: '' }],
  answer: [],
  explanation: '',
  keywords: ''
});

const uploadingImage = ref(false);

const handleImageUpload = async (info) => {
  const file = info.file;
  uploadingImage.value = true;
  
  const formData = new FormData();
  formData.append('image', file);
  
  try {
    const response = await axios.post('/api/ai/analyze-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    const data = response.data;
    message.success('이미지 분석 성공!');
    
    // Populate form
    if (data.type) formState.type = data.type;
    if (data.category) formState.category = data.category;
    if (data.question_en) formState.question_en = data.question_en;
    if (data.question_ko) formState.question_ko = data.question_ko;
    if (data.explanation) formState.explanation = data.explanation;
    if (data.keywords && Array.isArray(data.keywords)) formState.keywords = data.keywords.join(', ');

    // Populate options
    if (data.options && Array.isArray(data.options)) {
      formState.options = data.options.map(opt => {
        if (typeof opt === 'string') return { en: opt, ko: '' };
        return { en: opt.en || '', ko: opt.ko || '' };
      });
    }
    
    // Populate answers
    if (data.answer && Array.isArray(data.answer)) {
      formState.answer = data.answer.map(ans => {
        let idx = -1;
        if (typeof ans === 'string' && ans.match(/^[A-Z]$/i)) {
            idx = ans.toUpperCase().charCodeAt(0) - 65;
        } else if (typeof ans === 'string' && ans.match(/^[0-9]+$/)) {
            idx = parseInt(ans) - 1;
        }
        
        if (idx === -1 || idx >= formState.options.length) {
             const exactIdx = formState.options.findIndex(o => o.en === ans || o.ko === ans || o === ans);
             if (exactIdx !== -1) idx = exactIdx;
        }
        
        return idx !== -1 ? idx.toString() : '0';
      });
      
      if (formState.type === 'SINGLE' && formState.answer.length > 1) {
          formState.answer = [formState.answer[0]];
      }
    }
  } catch (error) {
    console.error('Image Analysis Error:', error);
    const backendMsg = error.response?.data?.error;
    message.error(backendMsg || '이미지 분석 중 오류가 발생했습니다.');
  } finally {
    uploadingImage.value = false;
  }
};

// For single select vs multi select
const isMultiple = computed(() => formState.type === 'MULTIPLE');

// Dynamic options logic
const addOption = () => {
  if (formState.options.length < 5) {
    formState.options.push({ en: '', ko: '' });
  } else {
    message.warning('보기는 최대 5개까지만 추가할 수 있습니다.');
  }
};

const removeOption = (index) => {
  if (formState.options.length > 2) {
    formState.options.splice(index, 1);
    // Remove if answer contains the removed option index (simplified logic for now)
    const val = index.toString();
    if (formState.answer.includes(val)) {
      formState.answer = formState.answer.filter((a) => a !== val);
    }
  } else {
    message.warning('보기는 최소 2개 이상이어야 합니다.');
  }
};

// AI Translate logic
const translating = ref(false);
const handleTranslate = async () => {
  if (!formState.question_en) {
    message.warning('번역할 영어 지문을 먼저 입력해주세요.');
    return;
  }
  
  translating.value = true;
  try {
    const response = await axios.post('/api/translate', { text: formState.question_en });
    formState.question_ko = response.data.translation;
    message.success('번역이 완료되었습니다.');
  } catch (error) {
    console.error('Translate Error:', error);
    // Fallback if backend translation fails during mock
    formState.question_ko = error.response?.data?.mock || '[번역 실패]';
    message.error('번역 중 오류가 발생했습니다.');
  } finally {
    translating.value = false;
  }
};

// Form submission
const onFinish = async (values) => {
  try {
    // Transform options into simple array of objects
    const formattedOptions = formState.options.map(opt => ({ en: opt.en, ko: opt.ko }));
    
    // Validate answers length for MULTIPLE
    if (isMultiple.value && (formState.answer.length < 2 || formState.answer.length > 3)) {
      message.error('다중 선택형은 정답 2~3개를 선택해야 합니다.');
      return;
    }
    
    // Transform answer numeric strings to actual option texts based on index based on PMP standards (A, B, C...)
    const formattedAnswers = isMultiple.value 
      ? formState.answer.map(idx => formattedOptions[parseInt(idx)].en)
      : [formattedOptions[parseInt(formState.answer[0])].en];

    const payload = {
      type: formState.type,
      category: formState.category,
      question_en: formState.question_en,
      question_ko: formState.question_ko,
      options: formattedOptions,
      answer: formattedAnswers,
      explanation: formState.explanation,
      keywords: formState.keywords ? formState.keywords.split(',').map(s => s.trim()) : []
    };

    await axios.post('/api/questions', payload);
    message.success('문제 등록이 성공적으로 완료되었습니다.');
    router.push('/');
  } catch (error) {
    console.error('Save Error:', error);
    message.error('문제 등록에 실패했습니다.');
  }
};

const onFinishFailed = (errorInfo) => {
  console.log('Failed:', errorInfo);
  message.error('필수 입력 항목을 확인해주세요.');
};

// Handle type change reset answer
const handleTypeChange = () => {
    formState.answer = [];
};
</script>

<template>
  <div class="question-create-container">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <h2>새 문제 등록</h2>
    </div>

    <div style="margin-bottom: 24px;">
      <a-upload-dragger
        name="file"
        :customRequest="handleImageUpload"
        :showUploadList="false"
        accept="image/*"
      >
        <p class="ant-upload-drag-icon">
          <inbox-outlined></inbox-outlined>
        </p>
        <p class="ant-upload-text">여기를 클릭하거나 이미지를 드래그하여 업로드하세요</p>
        <p class="ant-upload-hint">업로드 즉시 Gemini AI가 분석하여 아래 폼을 자동으로 채워줍니다.</p>
      </a-upload-dragger>
      
      <div v-if="uploadingImage" style="text-align: center; margin-top: 10px; color: #1890ff;">
        <span>AI가 이미지를 분석 중입니다. 잠시만 기다려주세요...</span>
      </div>
    </div>

    <a-form
      ref="formRef"
      :model="formState"
      name="questionForm"
      :label-col="{ span: 4 }"
      :wrapper-col="{ span: 20 }"
      @finish="onFinish"
      @finishFailed="onFinishFailed"
    >
      <a-form-item label="문제 유형" name="type" :rules="[{ required: true, message: '문제 유형을 선택해주세요!' }]">
        <a-radio-group v-model:value="formState.type" @change="handleTypeChange">
          <a-radio value="SINGLE">단일 선택형 (정답 1개)</a-radio>
          <a-radio value="MULTIPLE">다중 선택형 (정답 2~3개)</a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item label="카테고리" name="category" :rules="[{ required: true, message: '카테고리를 입력해주세요!' }]">
        <a-input v-model:value="formState.category" placeholder="예: Integration Management" />
      </a-form-item>

      <a-form-item label="영어 지문" name="question_en" :rules="[{ required: true, message: '영어 지문을 입력해주세요!' }]">
        <a-textarea v-model:value="formState.question_en" :rows="4" />
        <div style="margin-top: 8px; text-align: right;">
           <a-button type="dashed" @click="handleTranslate" :loading="translating">
             AI 번역
           </a-button>
        </div>
      </a-form-item>

      <a-form-item label="한국어 지문" name="question_ko" :rules="[{ required: true, message: '한국어 지문을 입력해주세요!' }]">
        <a-textarea v-model:value="formState.question_ko" :rows="4" />
      </a-form-item>

      <a-form-item label="보기 (Options)" required>
         <div v-for="(option, index) in formState.options" :key="index" style="display: flex; margin-bottom: 8px;">
            <a-input v-model:value="option.en" :placeholder="`보기 ${index + 1} (영어)`" style="width: 40%; margin-right: 8px;" />
            <a-input v-model:value="option.ko" :placeholder="`보기 ${index + 1} (한국어)`" style="width: 40%; margin-right: 8px;" />
            <MinusCircleOutlined
              v-if="formState.options.length > 2"
              class="dynamic-delete-button"
              @click="removeOption(index)"
            />
         </div>
         <a-button type="dashed" style="width: 80%" @click="addOption" :disabled="formState.options.length >= 5">
            <PlusOutlined /> 보기 추가
         </a-button>
      </a-form-item>

      <a-form-item label="정답" name="answer" :rules="[{ required: true, message: '정답을 선택해주세요!' }]">
        <!-- Single Answer -->
        <a-radio-group v-if="!isMultiple" v-model:value="formState.answer[0]">
          <a-radio v-for="(opt, idx) in formState.options" :key="idx" :value="idx.toString()">
            보기 {{ idx + 1 }}
          </a-radio>
        </a-radio-group>

        <!-- Multiple Answer -->
        <a-checkbox-group v-else v-model:value="formState.answer">
          <a-checkbox v-for="(opt, idx) in formState.options" :key="idx" :value="idx.toString()">
            보기 {{ idx + 1 }}
          </a-checkbox>
        </a-checkbox-group>
      </a-form-item>

      <a-form-item label="해설 (선택사항)" name="explanation">
        <a-textarea v-model:value="formState.explanation" :rows="3" />
      </a-form-item>

      <a-form-item label="키워드" name="keywords">
        <a-input v-model:value="formState.keywords" placeholder="예: Agile, Scrum (쉼표로 구분)" />
      </a-form-item>

      <a-form-item :wrapper-col="{ offset: 4, span: 20 }">
        <a-button type="primary" html-type="submit">문제 저장</a-button>
        <a-button style="margin-left: 10px" @click="() => router.push('/')">취소</a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<style scoped>
.question-create-container {
  max-width: 800px;
  margin: 0 auto;
}
.dynamic-delete-button {
  cursor: pointer;
  position: relative;
  top: 4px;
  font-size: 24px;
  color: #999;
  transition: all 0.3s;
}
.dynamic-delete-button:hover {
  color: #777;
}
</style>
