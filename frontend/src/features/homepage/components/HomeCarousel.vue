<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import { carouselSlides } from '@/mocks/fixtures/homepage'
import type { CarouselSlide } from '@/shared/types/homepage'

/**
 * 首页校园轮播（FE-007）。
 *
 * 设计来源：docs/frontend/FrontendDesign.md
 * - §19：使用 UCarousel（不手写轮播 JS）；内容为校园主题 / 竞赛 / 组织招新；
 *   一张幻灯片最多一个类别标签 + 一条标题 + 一句说明 + 一个可选 CTA；
 * - §33：`prefers-reduced-motion` 时关闭自动播放；
 * - §9：轮播为主表面，圆角 12px（rounded-surface）；
 * - §38：预留图片尺寸、`object-fit: cover`、懒加载。
 *
 * 图片比例：统一使用 16:9（`aspect-video`）画框，移动端与 PC 端一致，素材最易获得；
 * 不同比例图片以 `object-fit: cover` 居中裁切填充，并可经 `image.position`（`object-position`）
 * 微调裁切焦点。真实校园图片尚未接入（fixture 的 image.src 为空），以中性深色背景预留图片区，
 * 文字叠加其上；接入真实媒体后由文案层（浅色 scrim）保证可读性（FE-013）。
 */
const props = withDefaults(
  defineProps<{ slides?: CarouselSlide[] }>(),
  { slides: () => carouselSlides }
)

const prefersReducedMotion = ref(false)
let mediaQuery: ReturnType<typeof globalThis.matchMedia> | null = null
const updatePrefersReducedMotion = (event: { matches: boolean }) => {
  prefersReducedMotion.value = event.matches
}

if (
  typeof globalThis !== 'undefined' &&
  typeof globalThis.matchMedia === 'function'
) {
  prefersReducedMotion.value = globalThis.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches
}

onMounted(() => {
  if (
    typeof globalThis !== 'undefined' &&
    typeof globalThis.matchMedia === 'function'
  ) {
    mediaQuery = globalThis.matchMedia('(prefers-reduced-motion: reduce)')
    mediaQuery.addEventListener?.('change', updatePrefersReducedMotion)
  }
})

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener?.('change', updatePrefersReducedMotion)
})

const autoplay = computed(() => {
  if (prefersReducedMotion.value) return false
  return { delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true }
})

const carouselRef = ref()

function scrollPrev() {
  carouselRef.value?.emblaApi?.scrollPrev()
}
function scrollNext() {
  carouselRef.value?.emblaApi?.scrollNext()
}
</script>

<template>
  <div class="group relative">
    <UCarousel
      ref="carouselRef"
      :items="props.slides"
      :autoplay="autoplay"
      loop
      dots
      class="mb-7 w-full min-w-0 rounded-surface border border-default bg-neutral-900 shadow-sm"
      :ui="{
        viewport: 'overflow-hidden rounded-surface'
      }"
    >
      <template #default="{ item }">
        <component
          :is="item.link.type === 'EXTERNAL' ? 'a' : item.link.type === 'INTERNAL' ? 'RouterLink' : 'div'"
          v-bind="
            item.link.type === 'EXTERNAL'
              ? { href: item.link.externalUrl ?? undefined, target: '_blank', rel: 'noopener noreferrer' }
              : item.link.type === 'INTERNAL'
                ? { to: item.link.internalPath ?? '/' }
                : {}
          "
          :aria-label="item.title"
          class="block relative aspect-video overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <div
            v-if="item.image.src"
            class="absolute inset-0"
          >
            <img
              :src="item.image.src"
              :alt="item.image.alt"
              class="size-full object-cover"
              :style="{ objectPosition: item.image.position ?? 'center' }"
              loading="lazy"
            >
          </div>
          <div
            v-else
            class="absolute inset-0 bg-neutral-900"
            aria-hidden="true"
          />
          <span class="sr-only">{{ item.title }}</span>
        </component>
      </template>
    </UCarousel>

    <!-- 自定义前后箭头：默认透明，鼠标靠近/聚焦显示，图标在圆形内居中 -->
    <button
      type="button"
      data-slot="prev"
      aria-label="上一张"
      class="absolute start-3 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-neutral-900 shadow-md opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:bg-white"
      @click="scrollPrev"
    >
      <UIcon
        name="i-lucide-chevron-left"
        class="size-5"
        aria-hidden="true"
      />
    </button>
    <button
      type="button"
      data-slot="next"
      aria-label="下一张"
      class="absolute end-3 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-neutral-900 shadow-md opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:bg-white"
      @click="scrollNext"
    >
      <UIcon
        name="i-lucide-chevron-right"
        class="size-5"
        aria-hidden="true"
      />
    </button>
  </div>
</template>
