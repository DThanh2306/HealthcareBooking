<template>
  <div class="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useBotpress } from '@/useBotpress'

const { loadBotpress } = useBotpress()

onMounted(() => {
  loadBotpress()
})
</script>

<style scoped>
.app {
  background: #f5f5f5;
  min-height: 100vh;
}
</style>
