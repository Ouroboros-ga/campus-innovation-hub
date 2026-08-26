<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const displayName = computed(
  () => auth.user?.profile?.nickname || auth.user?.real_name || ''
)
const initial = computed(() => displayName.value.slice(0, 1) || '未')
const isOperator = computed(() => auth.isOperator)

const items = computed(() => {
  const account = [
    {
      label: displayName.value || '未登录',
      icon: 'i-lucide-user',
      disabled: true
    }
  ]
  const menu: {
    label: string
    icon: string
    to?: string
    click?: () => void
  }[] = [
    { label: '个人中心', icon: 'i-lucide-circle-user-round', to: '/me' },
    { label: '账号设置', icon: 'i-lucide-settings', to: '/me/settings' }
  ]
  if (isOperator.value) {
    menu.push({ label: '平台运营', icon: 'i-lucide-layout-dashboard', to: '/ops' })
  }
  menu.push({ label: '退出登录', icon: 'i-lucide-log-out', click: onLogout })
  return [account, menu]
})

function onLogout() {
  void auth.logout().then(() => {
    void router.push('/')
  })
}

function goLogin() {
  void router.push({ name: 'login', query: { redirect: '/me' } })
}
</script>

<template>
  <UDropdownMenu
    v-if="auth.isAuthenticated"
    :items="items"
    :content="{ align: 'end', sideOffset: 8 }"
  >
    <UButton
      aria-label="打开用户菜单"
      color="neutral"
      variant="ghost"
      class="gap-2 px-1.5 text-default"
    >
      <UAvatar
        :text="initial"
        :alt="displayName"
        size="sm"
        color="primary"
      />
      <span class="hidden text-sm font-medium 2xl:inline">
        {{ displayName }}
      </span>
      <UIcon
        name="i-lucide-chevron-down"
        class="hidden size-4 2xl:block"
        aria-hidden="true"
      />
    </UButton>
  </UDropdownMenu>

  <UButton
    v-else
    color="neutral"
    variant="soft"
    icon="i-lucide-log-in"
    aria-label="登录"
    @click="goLogin"
  >
    登录
  </UButton>
</template>
