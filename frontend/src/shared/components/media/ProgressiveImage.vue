<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  src: string | null
  alt?: string
  width?: number | null
  height?: number | null
  lqip?: string | null
  preview?: boolean
  aspect?: string
  objectPosition?: string
  rounded?: string
}>(), {
  alt: '',
  width: null,
  height: null,
  lqip: null,
  preview: true,
  aspect: 'aspect-[16/9]',
  objectPosition: 'center',
  rounded: 'rounded-xl'
})

const emit = defineEmits<{ preview: [src: string] }>()

const loaded = ref(false)
const error = ref(false)
const inView = ref(false)
const rootEl = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

const shouldLoad = computed(() => Boolean(props.src) && inView.value)

function onLoad() {
  loaded.value = true
}
function onError() {
  error.value = true
}

function onIntersect(entries: IntersectionObserverEntry[]) {
  if (entries[0]?.isIntersecting) {
    inView.value = true
    observer?.disconnect()
    observer = null
  }
}

onMounted(() => {
  if (typeof IntersectionObserver === 'undefined') {
    inView.value = true
    return
  }
  observer = new IntersectionObserver(onIntersect, { rootMargin: '200px' })
  if (rootEl.value) observer.observe(rootEl.value)
})

watch(() => props.src, () => {
  loaded.value = false
  error.value = false
  if (!inView.value && typeof IntersectionObserver === 'undefined') inView.value = true
})

onBeforeUnmount(() => observer?.disconnect())

function handleClick() {
  if (!props.preview || !props.src || error.value) return
  emit('preview', props.src)
  // 触发全局预览事件，供 ImageLightbox 监听
  if (typeof globalThis !== 'undefined') {
    globalThis.dispatchEvent(new CustomEvent('preview-image', { detail: { src: props.src, alt: props.alt } }))
  }
}
</script>

<template>
  <div
    ref="rootEl"
    class="relative overflow-hidden bg-muted"
    :class="[props.aspect, props.rounded]"
    :style="props.width && props.height ? `aspect-ratio:${props.width}/${props.height}` : undefined"
  >
    <!-- 模糊占位：优先 lqip，否则用全图模糊 + 放大 -->
    <img
      v-if="props.src && !error"
      :src="props.lqip || props.src"
      :alt="props.alt"
      class="absolute inset-0 size-full object-cover transition-opacity duration-500"
      :class="loaded ? 'opacity-0' : 'opacity-100'"
      :style="{ objectPosition: props.objectPosition, filter: 'blur(12px)', transform: 'scale(1.05)' }"
      aria-hidden="true"
      loading="eager"
      decoding="async"
    />
    <!-- 占位背景（无图时） -->
    <div
      v-if="!props.src || error"
      class="absolute inset-0 grid place-items-center bg-gradient-to-br from-muted to-muted/50"
      aria-hidden="true"
    >
      <UIcon name="i-lucide-image" class="size-6 text-muted" />
    </div>

    <!-- 完整图：懒加载，加载后淡入变清晰 -->
    <img
      v-if="shouldLoad && !error"
      :src="props.src!"
      :alt="props.alt"
      class="absolute inset-0 size-full object-cover transition-opacity duration-700"
      :class="loaded ? 'opacity-100' : 'opacity-0'"
      :style="{ objectPosition: props.objectPosition }"
      loading="lazy"
      decoding="async"
      fetchpriority="low"
      @load="onLoad"
      @error="onError"
    />

    <!-- 点击放大 -->
    <button
      v-if="props.preview && props.src && !error"
      type="button"
      class="absolute inset-0 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      :aria-label="`放大预览 ${props.alt || '图片'}`"
      @click="handleClick"
    />
  </div>
</template>
