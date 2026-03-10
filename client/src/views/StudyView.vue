<script setup>
import { onMounted, onUnmounted, ref, computed, watch } from 'vue';
import { useQuestionStore } from '../stores/question.js';
import { useRouter } from 'vue-router';
import { LeftOutlined, RightOutlined, TranslationOutlined, CheckCircleOutlined, StarOutlined, StarFilled } from '@ant-design/icons-vue';

const router = useRouter();
const questionStore = useQuestionStore();

const currentIndex = ref(0);
const showTranslation = ref(false);
const showAnswer = ref(false);

const userAnswer = ref(null);
const userAnswers = ref([]);

// Active UI states for keyboard feedback
const isSpaceActive = ref(false);
const isLeftActive = ref(false);
const isRightActive = ref(false);

const currentFilter = ref('all');
const studyQuestions = ref([]);

const loadStudyQuestions = () => {
    if (currentFilter.value === 'all') {
        studyQuestions.value = [...(questionStore.questions || [])];
    } else {
        studyQuestions.value = (questionStore.questions || []).filter(q => q.is_bookmarked === 1);
    }
    currentIndex.value = 0;
    resetStates();
};

watch(currentFilter, () => {
    loadStudyQuestions();
});

const currentQuestion = computed(() => {
    if (studyQuestions.value.length === 0) return null;
    return studyQuestions.value[currentIndex.value];
});

const totalQuestions = computed(() => studyQuestions.value.length);
const progressPercent = computed(() => {
    if (totalQuestions.value === 0) return 0;
    return Math.round(((currentIndex.value + 1) / totalQuestions.value) * 100);
});

const canGoPrev = computed(() => currentIndex.value > 0);
const canGoNext = computed(() => currentIndex.value < totalQuestions.value - 1);

const handlePrev = () => {
    if (canGoPrev.value) {
        currentIndex.value--;
        resetStates();
    }
};

const handleNext = () => {
    if (canGoNext.value) {
        currentIndex.value++;
        resetStates();
    }
};

const resetStates = () => {
    showTranslation.value = false;
    showAnswer.value = false;
    userAnswer.value = null;
    userAnswers.value = [];
};

// Formatting helpers
const getOptionLabel = (index) => String.fromCharCode(65 + index); // A, B, C...

const isCorrectOption = (optStr, optIndex) => {
    if (!currentQuestion.value || !currentQuestion.value.answer) return false;
    
    // Check if the exact english text match, or korean text match, or standard index match
    return currentQuestion.value.answer.some(ans => {
        if (typeof optStr === 'object') {
           return optStr.en === ans || optStr.ko === ans;
        }
        return optStr === ans;
    });
};

const isWrongOption = (optStr, optIndex) => {
    if (!currentQuestion.value || !currentQuestion.value.answer) return false;
    const isSelected = currentQuestion.value.type === 'SINGLE' 
        ? userAnswer.value === optIndex.toString() 
        : userAnswers.value.includes(optIndex.toString());
    
    if (!isSelected) return false;
    return !isCorrectOption(optStr, optIndex);
};

const handleToggleBookmark = async () => {
    if (!currentQuestion.value) return;
    try {
        await questionStore.toggleBookmark(currentQuestion.value.id, currentQuestion.value.is_bookmarked);
    } catch (err) {
        // Error handled in store
    }
};

const handleKeyDown = (event) => {
    // Ignore if typing in an input or textarea
    if (['INPUT', 'TEXTAREA'].includes(event.target.tagName)) return;

    if (event.code === 'Space') {
        event.preventDefault(); // Prevent page scroll
        if (event.repeat) return; // Prevent continuous trigger during hold
        if (!currentQuestion.value) return; // Ignore if no question loaded
        
        isSpaceActive.value = true;
        
        // Custom Space logic: Jump to Next if answer is already shown
        if (showAnswer.value) {
            if (canGoNext.value) handleNext();
        } else {
            showAnswer.value = true;
        }
    } else if (event.code === 'ArrowRight') {
        if (!currentQuestion.value) return;
        isRightActive.value = true;
        if (canGoNext.value) handleNext();
    } else if (event.code === 'ArrowLeft') {
        if (!currentQuestion.value) return;
        isLeftActive.value = true;
        if (canGoPrev.value) handlePrev();
    }
};

const handleKeyUp = (event) => {
    if (event.code === 'Space') isSpaceActive.value = false;
    else if (event.code === 'ArrowRight') isRightActive.value = false;
    else if (event.code === 'ArrowLeft') isLeftActive.value = false;
};

onMounted(async () => {
    await questionStore.fetchQuestions();
    loadStudyQuestions();
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
});

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
});
</script>

<template>
  <div class="study-container">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 16px;">
      <div style="display: flex; align-items: center; gap: 16px;">
          <h2 style="margin: 0;">공부 모드 (Study Mode)</h2>
          <a-radio-group v-model:value="currentFilter" button-style="solid">
              <a-radio-button value="all">전체</a-radio-button>
              <a-radio-button value="bookmarked">북마크</a-radio-button>
          </a-radio-group>
      </div>
      <a-button @click="router.push('/')">목록으로 돌아가기</a-button>
    </div>

    <!-- Progress Bar -->
    <div v-if="totalQuestions > 0" style="margin-bottom: 24px; background: #fff; padding: 16px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>진행률</span>
            <span>문제 {{ currentIndex + 1 }} / {{ totalQuestions }}</span>
        </div>
        <a-progress :percent="progressPercent" :show-info="false" />
    </div>

    <!-- Empty State -->
    <a-empty v-if="questionStore.loading && totalQuestions === 0" description="문제를 불러오는 중입니다..." />
    <a-empty v-else-if="!questionStore.loading && totalQuestions === 0 && currentFilter === 'bookmarked'" description="북마크된 문제가 없습니다. 전체 모드에서 문제를 북마크해보세요!" />
    <a-empty v-else-if="!questionStore.loading && totalQuestions === 0" description="등록된 문제가 없습니다." />
    
    <!-- Question Display -->
    <div v-else-if="currentQuestion" style="background: #fff; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 24px;">
        <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="display: flex; align-items: center; gap: 8px;">
                <a-tag color="blue">문제 {{ currentQuestion.number }}</a-tag>
                <a-tag :color="currentQuestion.type === 'SINGLE' ? 'blue' : 'purple'">
                    {{ currentQuestion.type === 'SINGLE' ? '단일 선택' : '다중 선택' }}
                </a-tag>
                <a-tag color="cyan">{{ currentQuestion.category }}</a-tag>
                
                <a-button type="text" shape="circle" @click="handleToggleBookmark" style="padding: 0; display: flex; align-items: center; justify-content: center;">
                    <StarFilled v-if="currentQuestion.is_bookmarked" style="color: #faad14; font-size: 18px;" />
                    <StarOutlined v-else style="color: #d9d9d9; font-size: 18px;" />
                </a-button>
            </div>
            <div>
                 <a-switch v-model:checked="showTranslation" checked-children="한/영" un-checked-children="영어만" />
            </div>
        </div>

        <a-row :gutter="24">
            <!-- English Column -->
            <a-col :span="showTranslation ? 12 : 24" style="transition: all 0.3s ease;">
                <div class="question-block">
                    <h3 style="white-space: pre-wrap; margin-bottom: 20px; font-size: 16px; line-height: 1.6;">{{ currentQuestion.question_en }}</h3>
                    
                    <div class="options-list">
                        <template v-if="currentQuestion.type === 'SINGLE'">
                            <a-radio-group v-model:value="userAnswer" style="width: 100%; display: flex; flex-direction: column; gap: 12px;">
                                <div 
                                    v-for="(opt, idx) in currentQuestion.options" 
                                    :key="idx" 
                                    class="option-item"
                                    :class="{ 'is-correct': showAnswer && isCorrectOption(opt, idx), 'is-wrong': showAnswer && isWrongOption(opt, idx) }"
                                >
                                    <a-radio :value="idx.toString()" :disabled="showAnswer" style="display: flex; align-items: flex-start; white-space: normal;">
                                        <strong>{{ getOptionLabel(idx) }}.</strong> {{ typeof opt === 'object' ? opt.en : opt }}
                                    </a-radio>
                                </div>
                            </a-radio-group>
                        </template>
                        <template v-else>
                            <a-checkbox-group v-model:value="userAnswers" style="width: 100%; display: flex; flex-direction: column; gap: 12px;">
                                <div 
                                    v-for="(opt, idx) in currentQuestion.options" 
                                    :key="idx" 
                                    class="option-item"
                                    :class="{ 'is-correct': showAnswer && isCorrectOption(opt, idx), 'is-wrong': showAnswer && isWrongOption(opt, idx) }"
                                >
                                    <a-checkbox :value="idx.toString()" :disabled="showAnswer" style="display: flex; align-items: flex-start; white-space: normal;">
                                        <strong>{{ getOptionLabel(idx) }}.</strong> {{ typeof opt === 'object' ? opt.en : opt }}
                                    </a-checkbox>
                                </div>
                            </a-checkbox-group>
                        </template>
                    </div>
                </div>
            </a-col>

            <!-- Korean Column (Conditional) -->
            <a-col :span="12" v-if="showTranslation" style="border-left: 1px solid #f0f0f0;">
                 <div class="question-block">
                    <h3 style="white-space: pre-wrap; margin-bottom: 20px; font-size: 16px; line-height: 1.6;">{{ currentQuestion.question_ko || '번역 없음' }}</h3>
                    
                    <div class="options-list">
                        <template v-if="currentQuestion.type === 'SINGLE'">
                            <a-radio-group v-model:value="userAnswer" style="width: 100%; display: flex; flex-direction: column; gap: 12px;">
                                <div 
                                    v-for="(opt, idx) in currentQuestion.options" 
                                    :key="'ko'+idx" 
                                    class="option-item"
                                    :class="{ 'is-correct': showAnswer && isCorrectOption(opt, idx), 'is-wrong': showAnswer && isWrongOption(opt, idx) }"
                                >
                                    <a-radio :value="idx.toString()" :disabled="showAnswer" style="display: flex; align-items: flex-start; white-space: normal;">
                                        <strong>{{ getOptionLabel(idx) }}.</strong> {{ typeof opt === 'object' && opt.ko ? opt.ko : (typeof opt === 'object' ? opt.en : opt) }}
                                    </a-radio>
                                </div>
                            </a-radio-group>
                        </template>
                        <template v-else>
                            <a-checkbox-group v-model:value="userAnswers" style="width: 100%; display: flex; flex-direction: column; gap: 12px;">
                                <div 
                                    v-for="(opt, idx) in currentQuestion.options" 
                                    :key="'ko'+idx" 
                                    class="option-item"
                                    :class="{ 'is-correct': showAnswer && isCorrectOption(opt, idx), 'is-wrong': showAnswer && isWrongOption(opt, idx) }"
                                >
                                    <a-checkbox :value="idx.toString()" :disabled="showAnswer" style="display: flex; align-items: flex-start; white-space: normal;">
                                        <strong>{{ getOptionLabel(idx) }}.</strong> {{ typeof opt === 'object' && opt.ko ? opt.ko : (typeof opt === 'object' ? opt.en : opt) }}
                                    </a-checkbox>
                                </div>
                            </a-checkbox-group>
                        </template>
                    </div>
                </div>
            </a-col>
        </a-row>

        <div style="margin-top: 32px; display: flex; justify-content: center;">
             <a-button type="primary" size="large" @click="showAnswer = true" :disabled="showAnswer" :class="{ 'active-btn': isSpaceActive }">
                 <check-circle-outlined />
                 정답 확인 (Space)
             </a-button>
        </div>

        <!-- Answer Reveal -->
        <div v-if="showAnswer" style="margin-top: 24px; padding: 16px; background-color: #f6ffed; border: 1px solid #b7eb8f; border-radius: 4px; animation: fadeIn 0.3s;">
             <p v-if="currentQuestion.explanation" style="margin-bottom: 8px; font-size: 15px;"><strong>해설:</strong><br /> <span style="white-space: pre-wrap;">{{ currentQuestion.explanation }}</span></p>
             <p v-else style="margin-bottom: 8px;">해설이 없습니다.</p>
             
             <div v-if="currentQuestion.keywords && currentQuestion.keywords.length > 0" style="margin-top: 12px;">
                 <strong>키워드:</strong> 
                 <a-tag v-for="kw in currentQuestion.keywords" :key="kw" color="orange" style="margin-left: 8px;">{{ kw }}</a-tag>
             </div>
        </div>
    </div>

    <!-- Navigation -->
    <div style="display: flex; justify-content: space-between;">
        <a-button size="large" @click="handlePrev" :disabled="!canGoPrev" :class="{ 'active-btn': isLeftActive }">
            <left-outlined /> 이전 문제 (←)
        </a-button>
        <a-button size="large" type="primary" @click="handleNext" :disabled="!canGoNext" :class="{ 'active-btn': isRightActive }">
            다음 문제 (→) <right-outlined />
        </a-button>
    </div>
  </div>
</template>

<style scoped>
.study-container {
  max-width: 1000px;
  margin: 0 auto;
  padding-bottom: 40px;
}
.question-block {
    padding: 12px;
}
.options-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.option-item {
    padding: 12px 16px;
    border: 1px solid #e8e8e8;
    border-radius: 6px;
    background: #fbfbfb;
    transition: all 0.2s;
}
.option-item.is-correct {
    background-color: #f6ffed;
    border-color: #52c41a;
    color: #237804;
    font-weight: 500;
}
.option-item.is-wrong {
    background-color: #fff1f0;
    border-color: #ffa39e;
    color: #cf1322;
}
.option-item.is-correct :deep(.ant-radio-wrapper),
.option-item.is-correct :deep(.ant-checkbox-wrapper) {
    color: #237804;
    font-weight: 500;
}
.option-item.is-wrong :deep(.ant-radio-wrapper),
.option-item.is-wrong :deep(.ant-checkbox-wrapper) {
    color: #cf1322;
    font-weight: 500;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
}
.active-btn {
    transform: scale(0.96) !important;
    filter: brightness(0.9) !important;
    box-shadow: 0 0 8px rgba(0,0,0,0.2) inset !important;
    transition: all 0.1s !important;
}
</style>
