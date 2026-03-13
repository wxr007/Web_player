<script setup lang="ts">
</script>

<template>
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
</template>

<style scoped lang="scss">
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
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    
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
