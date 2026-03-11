<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
const videoId = route.params.id
</script>

<template>
  <div class="video-detail-page">
    <div class="container">
      <p>视频详情页 - ID: {{ videoId }}</p>
      <router-link :to="`/video/${videoId}/play`">开始播放</router-link>
    </div>
  </div>
</template>

<style scoped>
.video-detail-page {
  padding: 20px;
}
</style>
