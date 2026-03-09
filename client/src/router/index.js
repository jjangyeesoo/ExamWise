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
            name: 'createOption',
            component: () => import('../views/QuestionCreateView.vue')
        }
    ]
});

export default router;
