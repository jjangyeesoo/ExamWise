<script setup>
import { onMounted, ref, computed } from 'vue';
import { useQuestionStore } from '../stores/question.js';
import { message, Modal } from 'ant-design-vue';
import { ExclamationCircleOutlined } from '@ant-design/icons-vue';
import { createVNode } from 'vue';

const questionStore = useQuestionStore();

// Selection state
const selectedRowKeys = ref([]);

const onSelectChange = (keys) => {
  selectedRowKeys.value = keys;
};

const hasSelected = computed(() => selectedRowKeys.value.length > 0);

const confirmDelete = () => {
  Modal.confirm({
    title: `${selectedRowKeys.value.length}개의 문제를 삭제하시겠습니까?`,
    icon: createVNode(ExclamationCircleOutlined),
    content: '삭제된 문제는 화면에서 사라집니다 (소프트 삭제 처리).',
    okText: '삭제',
    okType: 'danger',
    cancelText: '취소',
    onOk: async () => {
      try {
        await questionStore.deleteQuestions(selectedRowKeys.value);
        message.success(`${selectedRowKeys.value.length}개의 문제가 삭제되었습니다.`);
        selectedRowKeys.value = []; // Clear selection after successful delete
      } catch (err) {
        message.error('문제 삭제 중 오류가 발생했습니다.');
      }
    },
  });
};

// Define table columns
const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 60,
  },
  {
    title: '유형',
    dataIndex: 'type',
    key: 'type',
    width: 120,
  },
  {
    title: '카테고리',
    dataIndex: 'category',
    key: 'category',
    width: 150,
  },
  {
    title: '문제 (요약)',
    dataIndex: 'question_ko',
    key: 'question_ko',
    ellipsis: true, // Truncate long text
  }
];

// Helper to format option index to A, B, C, D, E
const getOptionLabel = (index) => {
  return String.fromCharCode(65 + index); // 65 is 'A' ASCII
};

// Helper to format answer array
const formatAnswer = (answerArray, optionsArray) => {
  if (!answerArray || !Array.isArray(answerArray)) return '';
  return answerArray.map(ans => {
    // Find the index of the answer in the options array to get the A, B, C label
    const idx = optionsArray.findIndex(opt => {
        if (typeof opt === 'object' && opt !== null) {
            return opt.en === ans || opt.ko === ans;
        }
        return opt === ans;
    });
    return idx !== -1 ? getOptionLabel(idx) : ans;
  }).join(', ');
};

onMounted(() => {
  questionStore.fetchQuestions();
});
</script>

<template>
  <div class="question-list-container">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <h2>문제 목록</h2>
      <div>
        <a-button 
            v-if="hasSelected" 
            type="primary" 
            danger 
            style="margin-right: 12px;" 
            @click="confirmDelete"
        >
          {{ selectedRowKeys.length }}개 선택 삭제
        </a-button>
        <a-button type="primary" @click="$router.push('/create')">새 문제 등록</a-button>
      </div>
    </div>

    <a-table 
      :rowSelection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }"
      :dataSource="questionStore.questions" 
      :columns="columns"  
      :loading="questionStore.loading"
      rowKey="id"
      :pagination="{ pageSize: 10 }"
    >
      <!-- Custom rendering for columns -->
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'type'">
          <a-tag :color="record.type === 'SINGLE' ? 'blue' : 'purple'">
            {{ record.type === 'SINGLE' ? '단일 선택' : '다중 선택' }}
          </a-tag>
        </template>
      </template>

      <!-- Expandable row details -->
      <template #expandedRowRender="{ record }">
        <div style="margin: 0">
          <p><strong>[영어 원문]</strong><br />{{ record.question_en }}</p>
          <p><strong>[한국어 번역]</strong><br />{{ record.question_ko || '번역 없음' }}</p>
          
          <div style="margin-top: 16px;">
            <strong>[보기]</strong>
            <ul style="list-style-type: none; padding-left: 0;">
              <li v-for="(opt, idx) in record.options" :key="idx" style="margin-bottom: 8px;">
                <strong>{{ getOptionLabel(idx) }}.</strong> {{ typeof opt === 'object' ? opt.en : opt }}<br />
                <span v-if="typeof opt === 'object' && opt.ko" style="color: #666; margin-left: 18px;">{{ opt.ko }}</span>
              </li>
            </ul>
          </div>

          <div style="margin-top: 16px; padding: 12px; background-color: #f6ffed; border: 1px solid #b7eb8f; border-radius: 4px;">
            <p style="margin-bottom: 8px;"><strong>정답:</strong> {{ formatAnswer(record.answer, record.options) }}</p>
            <p v-if="record.explanation" style="margin-bottom: 0;"><strong>해설:</strong> {{ record.explanation }}</p>
          </div>
        </div>
      </template>
    </a-table>
  </div>
</template>

<style scoped>
.question-list-container {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
