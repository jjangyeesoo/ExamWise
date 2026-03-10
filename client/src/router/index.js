import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'questions',
            component: () => import('../views/QuestionListView.vue')
        },
        {
            path: '/create',
            name: 'createQuestion',
            component: () => import('../views/QuestionCreateView.vue')
        },
        {
            path: '/edit/:id',
            name: 'editQuestion',
            component: () => import('../views/QuestionCreateView.vue')
        },
        {
            path: '/study',
            name: 'studyMode',
            component: () => import('../views/StudyView.vue')
        }
    ]
});

export default router;
