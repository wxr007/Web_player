<script setup lang="ts">
</script>

<template>
  <div class="home-page">
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">发现精彩视频</h1>
        <p class="hero-desc">海量视频资源，随时随地观看</p>
        <div class="hero-actions">
          <router-link to="/video" class="btn btn-primary">开始浏览</router-link>
          <router-link to="/auth/register" class="btn btn-secondary">立即注册</router-link>
        </div>
      </div>
    </section>
    
    <section class="features container">
      <div class="feature-item">
        <div class="feature-icon">🎬</div>
        <h3>海量资源</h3>
        <p>各类精彩视频内容</p>
      </div>
      <div class="feature-item">
        <div class="feature-icon">💬</div>
        <h3>多语言字幕</h3>
        <p>支持多种字幕格式</p>
      </div>
      <div class="feature-item">
        <div class="feature-icon">⭐</div>
        <h3>VIP会员</h3>
        <p>畅享高清画质</p>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.home-page {
  min-height: calc(100vh - var(--header-height));
}

.hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 80px 20px;
  text-align: center;
  
  .hero-title {
    font-size: 48px;
    font-weight: bold;
    margin-bottom: 16px;
  }
  
  .hero-desc {
    font-size: 18px;
    opacity: 0.9;
    margin-bottom: 32px;
  }
  
  .hero-actions {
    display: flex;
    gap: 16px;
    justify-content: center;
  }
  
  .btn {
    padding: 12px 32px;
    border-radius: 8px;
    font-size: 16px;
    text-decoration: none;
    transition: all 0.3s;
    
    &-primary {
      background: #fff;
      color: #667eea;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }
    }
    
    &-secondary {
      background: transparent;
      color: #fff;
      border: 2px solid #fff;
      
      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    }
  }
}

.features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
  padding: 60px 20px;
  
  .feature-item {
    text-align: center;
    padding: 32px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    
    .feature-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    
    h3 {
      font-size: 18px;
      margin-bottom: 8px;
    }
    
    p {
      color: var(--color-text-secondary);
      font-size: 14px;
    }
  }
}

@media (max-width: 768px) {
  .features {
    grid-template-columns: 1fr;
  }
  
  .hero .hero-title {
    font-size: 32px;
  }
}
</style>
