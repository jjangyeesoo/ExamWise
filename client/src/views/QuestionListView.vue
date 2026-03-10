<script setup>
import { onMounted, ref, computed, watch } from 'vue';
import { useQuestionStore } from '../stores/question.js';
import { message, Modal } from 'ant-design-vue';
import { ExclamationCircleOutlined } from '@ant-design/icons-vue';
import { createVNode } from 'vue';

const questionStore = useQuestionStore();

// Selection state
const selectedRowKeys = ref([]);

// Filter & Sort state
const searchQuery = ref('');
const debouncedSearchQuery = ref('');
const selectedCategory = ref(null);
const sortOrder = ref('numberAsc'); // 'numberAsc', 'numberDesc', 'latest', 'oldest'
const showOnlyBookmarked = ref(false);

// Debounce search query
let searchTimeout = null;
watch(searchQuery, (newValue) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        debouncedSearchQuery.value = newValue;
    }, 400); // 400ms debounce
});

const uniqueCategories = computed(() => {
    if (!questionStore.questions) return [];
    const categories = questionStore.questions.map(q => q.category).filter(Boolean);
    return [...new Set(categories)].sort();
});

const filteredQuestions = computed(() => {
    if (!questionStore.questions) return [];
    
    let result = [...questionStore.questions];
    
    // 1. Filter by Category
    if (selectedCategory.value) {
        result = result.filter(q => q.category === selectedCategory.value);
    }
    
    // 2. Filter by Search Query
    if (debouncedSearchQuery.value) {
        const lowerQ = debouncedSearchQuery.value.toLowerCase();
        result = result.filter(q => {
            const matchEn = q.question_en && q.question_en.toLowerCase().includes(lowerQ);
            const matchKo = q.question_ko && q.question_ko.toLowerCase().includes(lowerQ);
            
            // Check keywords (array of keywords)
            let matchKeywords = false;
            if (q.keywords && Array.isArray(q.keywords)) {
                 matchKeywords = q.keywords.some(k => k.toLowerCase().includes(lowerQ));
            } else if (typeof q.keywords === 'string') {
                 matchKeywords = q.keywords.toLowerCase().includes(lowerQ);
            }
            
            return matchEn || matchKo || matchKeywords;
        });
    }
    
    // 3. Filter by Bookmark Only Check
    if (showOnlyBookmarked.value) {
        result = result.filter(q => q.is_bookmarked === 1);
    }
    
    // 4. Sort
    result.sort((a, b) => {
        if (sortOrder.value === 'numberAsc') {
            return (a.number || 0) - (b.number || 0);
        } else if (sortOrder.value === 'numberDesc') {
            return (b.number || 0) - (a.number || 0);
        } else if (sortOrder.value === 'latest') {
            return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        } else if (sortOrder.value === 'oldest') {
            return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        }
        return 0;
    });
    
    return result;
});

const onSelectChange = (keys) => {
  selectedRowKeys.value = keys;
};

const handleResetFilters = () => {
    searchQuery.value = '';
    debouncedSearchQuery.value = '';
    selectedCategory.value = null;
    sortOrder.value = 'numberAsc';
    showOnlyBookmarked.value = false;
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
    title: '번호',
    dataIndex: 'number',
    key: 'number',
    width: 90,
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
  },
  {
    title: '작업',
    key: 'action',
    width: 80,
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
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
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
        <a-button @click="$router.push('/study')" style="margin-right: 12px;">공부 시작</a-button>
        <a-button type="primary" @click="$router.push('/create')">새 문제 등록</a-button>
      </div>
    </div>
    
    <!-- Filter and Search Bar -->
    <div style="background: #fbfbfb; padding: 16px; border-radius: 8px; margin-bottom: 16px; display: flex; gap: 16px; flex-wrap: wrap; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
        <div style="flex: 1; min-width: 200px;">
           <div style="margin-bottom: 4px; font-size: 12px; color: #666;">검색어 (지문/키워드)</div>
           <a-input-search
              v-model:value="searchQuery"
              placeholder="검색어를 입력하세요..."
              allow-clear
              style="width: 100%"
            />
        </div>
        <div style="width: 220px;">
           <div style="margin-bottom: 4px; font-size: 12px; color: #666;">카테고리 필터</div>
           <a-select
              v-model:value="selectedCategory"
              style="width: 100%"
              allow-clear
              placeholder="전체 도메인 보기"
            >
              <a-select-option :value="null">전체 도메인 (All)</a-select-option>
              <a-select-option v-for="cat in uniqueCategories" :key="cat" :value="cat">
                  {{ cat }}
              </a-select-option>
            </a-select>
        </div>
        <div style="width: 180px;">
           <div style="margin-bottom: 4px; font-size: 12px; color: #666;">정렬 기준</div>
           <a-select v-model:value="sortOrder" style="width: 100%">
              <a-select-option value="numberAsc">문제 번호 오름차순</a-select-option>
              <a-select-option value="numberDesc">문제 번호 내림차순</a-select-option>
              <a-select-option value="latest">최신 등록순</a-select-option>
              <a-select-option value="oldest">오래된 등록순</a-select-option>
            </a-select>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin-right: 8px;">
            <div style="margin-bottom: 4px; font-size: 12px; color: #666;">북마크만 보기</div>
            <a-switch v-model:checked="showOnlyBookmarked" checked-children="ON" un-checked-children="OFF" />
        </div>
        <div style="display: flex; align-items: flex-end;">
            <a-button type="primary" @click="handleResetFilters" title="초기화">
                Reset
            </a-button>
        </div>
    </div>

    <a-table 
      :rowSelection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }"
      :dataSource="filteredQuestions" 
      :columns="columns"  
      :loading="questionStore.loading"
      rowKey="id"
      :pagination="{ pageSize: 10 }"
    >
      <!-- Custom rendering for columns -->
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'number'">
          문제 {{ record.number || '-' }}
        </template>
        <template v-else-if="column.key === 'type'">
          <a-tag :color="record.type === 'SINGLE' ? 'blue' : 'purple'">
            {{ record.type === 'SINGLE' ? '단일 선택' : '다중 선택' }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-button type="link" size="small" @click="$router.push(`/edit/${record.id}`)">수정</a-button>
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
