import { defineStore } from 'pinia';
import axios from 'axios';

export const useQuestionStore = defineStore('question', {
    state: () => ({
        questions: [],
        loading: false,
        error: null,
    }),
    actions: {
        async fetchQuestions() {
            this.loading = true;
            this.error = null;
            try {
                const response = await axios.get('/api/questions');
                this.questions = response.data;
            } catch (err) {
                console.error('Failed to fetch questions:', err);
                this.error = '문제 목록을 불러오지 못했습니다.';
            } finally {
                this.loading = false;
            }
        },
        async deleteQuestions(ids) {
            this.loading = true;
            this.error = null;
            try {
                await axios.post('/api/questions/bulk-delete', { ids });
                // Remove the deleted questions from the local state safely
                this.questions = this.questions.filter(q => !ids.includes(q.id));
            } catch (err) {
                console.error('Failed to delete questions:', err);
                this.error = '선택한 문제들을 삭제하지 못했습니다.';
                throw err;
            } finally {
                this.loading = false;
            }
        }
    }
});
