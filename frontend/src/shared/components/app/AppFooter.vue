<script setup lang="ts">
import PageContainer from '@/shared/components/layout/PageContainer.vue'

const footerItems = ['关于我们', '联系我们', '使用帮助', '隐私政策']
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
        <p>© 2026 人工智能学院科创与就业服务平台</p>
        <ul class="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
          <li
            v-for="item in footerItems"
            :key="item"
          >
            <span>{{ item }}</span>
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
