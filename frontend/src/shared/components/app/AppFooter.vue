<script setup lang="ts">
import PageContainer from '@/shared/components/layout/PageContainer.vue'

const footerLinks = [
  { label: '关于我们', to: '/docs/about' },
  { label: '联系我们', to: '/docs/contact' },
  { label: '使用帮助', to: '/docs/help' },
  { label: '隐私政策', to: '/docs/privacy' },
  { label: '服务条款', to: '/docs/terms' }
] as const
</script>

<template>
  <footer
    role="contentinfo"
    class="border-t border-default bg-default"
  >
    <PageContainer>
      <div
        class="flex min-h-16 flex-col items-center justify-center gap-x-7 gap-y-1 py-3 text-center text-xs text-muted sm:flex-row"
      >
        <p>© 2026 SIT 人工智能学院·科创与就业服务平台</p>
        <ul class="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
          <li
            v-for="item in footerLinks"
            :key="item.to"
          >
            <RouterLink
              :to="item.to"
              class="transition-colors hover:text-highlighted hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {{ item.label }}
            </RouterLink>
          </li>
        </ul>
        <a
          href="https://beian.miit.gov.cn"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-highlighted hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          豫ICP备2026040663号
        </a>
      </div>
    </PageContainer>
  </footer>
</template>
