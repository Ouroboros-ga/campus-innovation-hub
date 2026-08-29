<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const open = ref(false)
const src = ref('')
const alt = ref('')
const scale = ref(1)
const offset = ref({ x: 0, y: 0 })
let dragging = false
let start = { x: 0, y: 0, ox: 0, oy: 0 }

function handlePreview(e: Event) {
  const detail = (e as CustomEvent).detail as { src: string; alt?: string }
  if (!detail?.src) return
  src.value = detail.src
  alt.value = detail.alt ?? ''
  scale.value = 1
  offset.value = { x: 0, y: 0 }
  open.value = true
}

function onWheel(e: WheelEvent) {
  if (!open.value) return
  e.preventDefault()
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  scale.value = Math.min(3, Math.max(1, Number((scale.value + delta).toFixed(2))))
  if (scale.value === 1) offset.value = { x: 0, y: 0 }
}

function onMouseDown(e: MouseEvent) {
  if (scale.value === 1) return
  dragging = true
  start = { x: e.clientX, y: e.clientY, ox: offset.value.x, oy: offset.value.y }
}
function onMouseMove(e: MouseEvent) {
  if (!dragging) return
  offset.value = { x: start.ox + (e.clientX - start.x), y: start.oy + (e.clientY - start.y) }
}
function onMouseUp() { dragging = false }

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}

onMounted(() => {
  globalThis.addEventListener('preview-image', handlePreview as EventListener)
  globalThis.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  globalThis.removeEventListener('preview-image', handlePreview as EventListener)
  globalThis.removeEventListener('keydown', onKeydown)
})

function close() { open.value = false }
</script>

<template>
  <UModal v-model:open="open" :ui="{ content: 'max-w-[92vw] max-h-[92vh] bg-black/85 p-0 overflow-hidden' }">
    <template #content>
      <div
        class="relative flex max-h-[92vh] min-h-[50vh] w-full items-center justify-center bg-black/85 p-4"
        @wheel.prevent="onWheel"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="onMouseUp"
      >
        <button type="button" aria-label="关闭预览" class="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25" @click="close">
          <UIcon name="i-lucide-x" class="size-5" />
        </button>
        <div class="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-white/15 p-1 backdrop-blur">
          <UButton size="xs" color="neutral" variant="ghost" class="text-white" icon="i-lucide-zoom-out" aria-label="缩小" @click="scale = Math.max(1, Number((scale - 0.2).toFixed(2)))" />
          <span class="px-2 text-xs tabular-nums text-white">{{ Math.round(scale * 100) }}%</span>
          <UButton size="xs" color="neutral" variant="ghost" class="text-white" icon="i-lucide-zoom-in" aria-label="放大" @click="scale = Math.min(3, Number((scale + 0.2).toFixed(2)))" />
          <UButton v-if="scale !== 1" size="xs" color="neutral" variant="ghost" class="text-white" icon="i-lucide-refresh-ccw" aria-label="复位" @click="scale = 1; offset = { x: 0, y: 0 }" />
        </div>
        <img
          :src="src"
          :alt="alt"
          class="max-h-[84vh] max-w-[88vw] select-none object-contain transition-transform duration-200 will-change-transform"
          :style="{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, cursor: scale > 1 ? (dragging ? 'grabbing' : 'grab') : 'zoom-out' }"
          draggable="false"
          @click="scale === 1 ? close() : (scale = 1)"
        />
      </div>
    </template>
  </UModal>
</template>
