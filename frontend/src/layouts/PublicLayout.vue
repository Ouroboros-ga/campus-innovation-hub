<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'

import AppFooter from '@/shared/components/app/AppFooter.vue'
import AppHeader from '@/shared/components/app/AppHeader.vue'
import MobileBottomNav from '@/shared/components/app/MobileBottomNav.vue'

// 全局搜索（UModal + UCommandPalette + 索引）较重：拆为独立异步 chunk，减轻所有公开页共享的布局体积。
const GlobalSearch = defineAsyncComponent(() =>
  import('@/features/search/components/GlobalSearch.vue')
)

const route = useRoute()

const isOpsRoute = computed(() => route.path.startsWith('/ops'))

/** 手机端根级 Tab Shell：仅这些路由在手机端展示底部主导航。 */
const isTabShell = computed(() => {
  const shell = route.meta.mobileShell
  return shell === 'tab' || shell === undefined
})

/**
 * 手机端预留底部空间：Tab 页为固定底部导航（3.5rem），详情 / 表单 / 管理页
 * 为粘性主操作栏（§34.7，4.5rem），避免内容或 Footer 被固定栏遮挡。
 */
const bottomSpace = computed(() => {
  const shell = route.meta.mobileShell
  if (shell === 'tab' || shell === undefined) {
    return 'pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0'
  }
  if (shell === 'detail' || shell === 'form' || shell === 'manage') {
    return 'pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0'
  }
  return ''
})
</script>

<template>
  <div
    class="flex min-h-dvh flex-col"
    :class="bottomSpace"
  >
    <AppHeader v-if="!isOpsRoute" />
    <main class="flex-1">
      <RouterView />
    </main>
    <AppFooter />
    <MobileBottomNav v-if="isTabShell" />
    <GlobalSearch />
  </div>
</template>
