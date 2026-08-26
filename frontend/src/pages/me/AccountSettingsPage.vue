<script setup lang="ts">
import AccountSubPage from '@/features/account/components/AccountSubPage.vue'

/** 账号设置（FE-070 /me/settings）。
 *  外观模式接入 Nuxt UI Color Mode（未登录也可切换），使用内置 UColorModeSelect。 */
</script>

<template>
  <AccountSubPage>
    <h1 class="text-xl font-bold text-highlighted sm:text-2xl">
      账号设置
    </h1>
    <p class="mt-1 text-sm text-muted">
      外观模式与账号偏好。
    </p>

    <UFormField
      label="外观模式"
      class="mt-6"
    >
      <UColorModeSelect />
    </UFormField>

    <div class="mt-6 rounded-surface border border-default bg-default p-4 text-sm">
      <div class="flex items-center gap-2">
        <UIcon
          name="i-lucide-shield-check"
          class="size-4 text-muted"
          aria-hidden="true"
        />
        <span class="font-medium text-highlighted">账号安全</span>
      </div>
      <p class="mt-2 text-xs text-muted">
        密码 / 绑定等设置以最终认证方案为准，当前为占位。
      </p>
    </div>
  </AccountSubPage>
</template>
