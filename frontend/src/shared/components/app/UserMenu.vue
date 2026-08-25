<script setup lang="ts">
const userMenuItems = [
  [
    {
      label: '张同学',
      icon: 'i-lucide-user',
      disabled: true
    }
  ],
  [
    {
      label: '个人中心',
      icon: 'i-lucide-circle-user-round',
      disabled: true
    },
    {
      label: '登录功能将在后续接入',
      icon: 'i-lucide-log-in',
      disabled: true
    }
  ]
]
</script>

<template>
  <UDropdownMenu
    :items="userMenuItems"
    :content="{ align: 'end', sideOffset: 8 }"
  >
    <UButton
      aria-label="打开用户菜单"
      color="neutral"
      variant="ghost"
      class="gap-2 px-1.5 text-default"
    >
      <UAvatar
        text="张"
        alt="张同学"
        size="sm"
        color="primary"
      />
      <span class="hidden text-sm font-medium 2xl:inline">张同学</span>
      <UIcon
        name="i-lucide-chevron-down"
        class="hidden size-4 2xl:block"
        aria-hidden="true"
      />
    </UButton>
  </UDropdownMenu>
</template>
