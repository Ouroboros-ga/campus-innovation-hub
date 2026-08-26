<script setup lang="ts">
import { zh_cn } from '@nuxt/ui/locale'

import { useAuthStore } from '@/stores/auth'

// 应用启动即初始化 CSRF 并恢复会话（未登录 fail-open）。
useAuthStore().init()
</script>

<template>
  <UApp :locale="zh_cn">
    <RouterView />
  </UApp>
</template>
