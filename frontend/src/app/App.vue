<script setup lang="ts">
import { zh_cn } from '@nuxt/ui/locale'
import { useRouter } from 'vue-router'

import { setAuthRedirectHandler } from '@/shared/http/client'
import { useAuthStore } from '@/stores/auth'

// 应用启动即初始化 CSRF 并恢复会话（未登录 fail-open）。
useAuthStore().init()

const router = useRouter()
setAuthRedirectHandler(target => {
  const current = router.currentRoute.value.fullPath
  if (current.startsWith('/login')) return
  void router.push(target)
})
</script>

<template>
  <!--
    关闭弹层滚动锁定的滚动条补偿（scrollBody.padding / margin = 0）：
    根元素已通过 CSS `scrollbar-gutter: stable` 恒久预留垂直滚动条槽位，滚动条
    消失时页面布局本身不会左移。Reka UI 的 `useBodyScrollLock` 默认会再给 body
    追加 `padding-right` 以补偿消失的滚动条，二者叠加形成双重补偿，导致 UModal
    （全局搜索）与 UDropdownMenu（用户菜单）打开时整页左右抽搐。关闭该补偿即可。
  -->
  <UApp
    :locale="zh_cn"
    :scroll-body="{ padding: 0, margin: 0 }"
    :toaster="{ position: 'top-right', expand: false }"
  >
    <RouterView />
  </UApp>
</template>
