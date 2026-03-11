<script setup lang="ts">
</script>

<template>
  <div class="admin-page container">
    <h1>管理后台</h1>
    
    <div class="admin-nav">
      <router-link to="/admin" class="nav-item">控制台</router-link>
      <router-link to="/admin/videos" class="nav-item">视频管理</router-link>
      <router-link to="/admin/users" class="nav-item">用户管理</router-link>
      <router-link to="/admin/orders" class="nav-item">订单管理</router-link>
    </div>
    
    <div class="dashboard">
      <h2>数据概览</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="value">0</div>
          <div class="label">视频总数</div>
        </div>
        <div class="stat-card">
          <div class="value">0</div>
          <div class="label">用户总数</div>
        </div>
        <div class="stat-card">
          <div class="value">0</div>
          <div class="label">VIP用户</div>
        </div>
        <div class="stat-card">
          <div class="value">¥0</div>
          <div class="label">总收入</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.admin-page {
  padding: var(--spacing-lg);
  
  h1 {
    font-size: 24px;
    margin-bottom: var(--spacing-lg);
  }
}

.admin-nav {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  
  .nav-item {
    padding: 8px 16px;
    border-radius: 4px;
    text-decoration: none;
    color: var(--color-text);
    
    &:hover, &.router-link-active {
      background: var(--color-primary);
      color: #fff;
    }
  }
}

.dashboard {
  h2 {
    font-size: 18px;
    margin-bottom: 20px;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }
  
  .stat-card {
    background: #fff;
    padding: 24px;
    border-radius: 8px;
    text-align: center;
    
    .value {
      font-size: 32px;
      font-weight: bold;
      color: var(--color-primary);
      margin-bottom: 8px;
    }
    
    .label {
      font-size: 14px;
      color: var(--color-text-secondary);
    }
  }
}
</style>
