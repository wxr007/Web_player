<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getVipPrices, getSubscriptionStatus } from '@/api/payment'

const prices = ref<Array<{ months: number; price: number; originalPrice?: number }>>([])
const subscription = ref<{ isVip: boolean; vipExpireAt?: string } | null>(null)
const loading = ref(true)

const fetchData = async () => {
  try {
    const [pricesRes, subRes] = await Promise.all([
      getVipPrices() as Promise<any>,
      getSubscriptionStatus() as Promise<any>
    ])
    prices.value = pricesRes || []
    subscription.value = subRes
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})

const handleSubscribe = async (months: number) => {
  console.log('订阅', months)
}
</script>

<template>
  <div class="subscription-page container">
    <h1>会员订阅</h1>
    
    <div class="current-status" v-if="subscription">
      <div class="status-card" :class="{ vip: subscription.isVip }">
        <h3>{{ subscription.isVip ? 'VIP会员' : '普通用户' }}</h3>
        <p v-if="subscription.isVip && subscription.vipExpireAt">
          到期时间: {{ new Date(subscription.vipExpireAt).toLocaleDateString() }}
        </p>
        <p v-else>开通VIP享高清画质和专属内容</p>
      </div>
    </div>
    
    <div class="vip-plans">
      <h2>选择套餐</h2>
      <div class="plans-grid">
        <div 
          v-for="plan in prices" 
          :key="plan.months" 
          class="plan-card"
        >
          <h3>{{ plan.months }}个月</h3>
          <div class="price">
            <span class="current">¥{{ plan.price }}</span>
            <span class="original" v-if="plan.originalPrice">¥{{ plan.originalPrice }}</span>
          </div>
          <button @click="handleSubscribe(plan.months)" class="btn-buy">
            立即购买
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.subscription-page {
  padding: var(--spacing-lg);
  
  h1 {
    font-size: 24px;
    margin-bottom: var(--spacing-lg);
  }
}

.current-status {
  margin-bottom: 40px;
  
  .status-card {
    background: #fff;
    padding: 24px;
    border-radius: 12px;
    max-width: 400px;
    
    h3 {
      font-size: 20px;
      margin-bottom: 8px;
    }
    
    &.vip h3 {
      background: linear-gradient(135deg, #ffd700, #ff8c00);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    p {
      color: var(--color-text-secondary);
      font-size: 14px;
    }
  }
}

.vip-plans {
  h2 {
    font-size: 18px;
    margin-bottom: 20px;
  }
  
  .plans-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    max-width: 800px;
  }
  
  .plan-card {
    background: #fff;
    padding: 24px;
    border-radius: 12px;
    text-align: center;
    border: 2px solid transparent;
    transition: border-color 0.2s;
    
    &:hover {
      border-color: var(--color-primary);
    }
    
    h3 {
      font-size: 18px;
      margin-bottom: 16px;
    }
    
    .price {
      margin-bottom: 20px;
      
      .current {
        font-size: 28px;
        font-weight: bold;
        color: var(--color-primary);
      }
      
      .original {
        margin-left: 8px;
        color: var(--color-text-secondary);
        text-decoration: line-through;
      }
    }
    
    .btn-buy {
      width: 100%;
      padding: 12px;
      background: var(--color-primary);
      color: #fff;
      border: none;
      border-radius: var(--border-radius-base);
      cursor: pointer;
      
      &:hover {
        background: #66b1ff;
      }
    }
  }
}
</style>
