<script setup>
import { ref } from 'vue';
import { RouterView, useRouter } from 'vue-router';
import { UnorderedListOutlined, DashboardOutlined, PlusOutlined } from '@ant-design/icons-vue';

const router = useRouter();
const collapsed = ref(false);
const selectedKeys = ref(['questions']);

const navigateTo = ({ key }) => {
  if (key === 'questions') {
    router.push('/');
  } else if (key === 'create') {
    router.push('/create');
  }
};
</script>

<template>
  <a-layout style="min-height: 100vh">
    <a-layout-sider v-model:collapsed="collapsed" collapsible>
      <div class="logo">
        <h2 v-if="!collapsed">ExamWise</h2>
        <h2 v-else>EW</h2>
      </div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
        theme="dark"
        mode="inline"
        @click="navigateTo"
      >
        <a-menu-item key="dashboard" disabled>
          <dashboard-outlined />
          <span>대시보드</span>
        </a-menu-item>
        <a-menu-item key="questions">
          <unordered-list-outlined />
          <span>문제 목록</span>
        </a-menu-item>
        <a-menu-item key="create">
          <plus-outlined />
          <span>문제 등록</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>
    
    <a-layout>
      <a-layout-header style="background: #fff; padding: 0 16px">
        <!-- Add header actions here later -->
      </a-layout-header>
      
      <a-layout-content style="margin: 16px">
        <div :style="{ padding: '24px', background: '#fff', minHeight: '360px' }">
          <RouterView />
        </div>
      </a-layout-content>
      
      <a-layout-footer style="text-align: center">
        ExamWise ©2026 Crafted with Ant Design Vue
      </a-layout-footer>
    </a-layout>
  </a-layout>
</template>

<style>
.logo {
  height: 32px;
  margin: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  overflow: hidden;
  white-space: nowrap;
}
.logo h2 {
  color: white;
  margin: 0;
  font-size: 1.2rem;
}
</style>
