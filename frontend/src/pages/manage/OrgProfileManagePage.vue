<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from '@nuxt/ui/composables'

import { managedOrganizationDetail } from '@/features/organizations/lib/orgManagement'
import ContentEditorShell from '@/shared/components/editor/ContentEditorShell.vue'
import CoverUpload from '@/shared/components/upload/CoverUpload.vue'
import FormSection from '@/shared/components/form/FormSection.vue'
import MarkdownEditor from '@/shared/components/editor/MarkdownEditor.vue'
import RichContent from '@/shared/components/reader/RichContent.vue'
import type { MediaImage } from '@/shared/types/homepage'

/** 组织资料管理（FE-080 / PageMap §组织资料管理）。
 *  Logo 走媒体上传，介绍为 Markdown 所见即所得，桌面双栏 / 移动 编辑↔预览实时渲染。
 */
const route = useRoute()
const toast = useToast()

const orgId = String(route.params.organizationId ?? '')
const detail = computed(() => managedOrganizationDetail(orgId))

const intro = ref(detail.value?.descriptionMd ?? '')
const direction = ref(detail.value?.direction ?? '')
const contactEmail = ref(detail.value?.contactEmail ?? '')
const contactPhone = ref(detail.value?.contactPhone ?? '')
const contactAddress = ref(detail.value?.contactAddress ?? '')
const publicContact = ref(detail.value?.publicContact ?? '')
const logo = ref<MediaImage | null>(detail.value?.logo ? { id: null, src: detail.value.logo.src, alt: detail.value.logo.alt } : null)

const directionTags = computed(() =>
  direction.value
    .split(/[,，、/]/)
    .map(item => item.trim())
    .filter(Boolean)
)

function save() {
  toast.add({
    title: '已保存',
    description: '组织资料修改已保存（mock）。',
    color: 'success',
    icon: 'i-lucide-check-circle'
  })
}
</script>

<template>
  <div class="space-y-4">
    <form
      class="space-y-6"
      novalidate
      @submit.prevent="save"
    >
      <ContentEditorShell preview-title="组织页预览">
        <template #form>
          <FormSection
            title="品牌与介绍"
            description="Logo 与组织介绍"
          >
            <CoverUpload
              v-model="logo"
              label="组织 Logo"
            />

            <UFormField label="组织介绍">
              <MarkdownEditor
                v-model="intro"
                :height="240"
              />
            </UFormField>
          </FormSection>

          <FormSection
            title="方向与联系方式"
            description="主要方向与公开联系方式"
          >
            <UFormField label="主要方向">
              <UInput
                v-model="direction"
                placeholder="用 / 分隔多个方向"
                class="w-full"
              />
            </UFormField>

            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="公开邮箱">
                <UInput
                  v-model="contactEmail"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="公开电话">
                <UInput
                  v-model="contactPhone"
                  class="w-full"
                />
              </UFormField>
            </div>

            <UFormField label="公开地址">
              <UInput
                v-model="contactAddress"
                class="w-full"
              />
            </UFormField>

            <UFormField label="单行公开联系方式">
              <UInput
                v-model="publicContact"
                class="w-full"
              />
            </UFormField>
          </FormSection>
        </template>

        <template #preview>
          <div
            v-if="logo?.src"
            class="mb-4 aspect-video overflow-hidden rounded-surface border border-default"
          >
            <img
              :src="logo.src"
              :alt="logo.alt"
              class="h-full w-full object-cover"
            >
          </div>
          <h3 class="text-lg font-semibold text-highlighted">
            {{ detail?.name || '组织名称' }}
          </h3>
          <div
            v-if="directionTags.length"
            class="mt-2 flex flex-wrap gap-1.5"
          >
            <span
              v-for="tag in directionTags"
              :key="tag"
              class="rounded-md bg-neutral-100 px-2 py-0.5 text-xs text-highlighted dark:bg-neutral-800"
            >
              {{ tag }}
            </span>
          </div>
          <RichContent :content="intro" />
          <dl
            v-if="contactEmail || contactPhone || contactAddress || publicContact"
            class="mt-4 space-y-1 text-sm"
          >
            <template v-if="contactEmail">
              <dt class="sr-only">
                公开邮箱
              </dt>
              <dd class="text-toned">
                邮箱：{{ contactEmail }}
              </dd>
            </template>
            <template v-if="contactPhone">
              <dt class="sr-only">
                公开电话
              </dt>
              <dd class="text-toned">
                电话：{{ contactPhone }}
              </dd>
            </template>
            <template v-if="contactAddress">
              <dt class="sr-only">
                公开地址
              </dt>
              <dd class="text-toned">
                地址：{{ contactAddress }}
              </dd>
            </template>
            <template v-if="publicContact">
              <dt class="sr-only">
                联系方式
              </dt>
              <dd class="text-toned">
                联系：{{ publicContact }}
              </dd>
            </template>
          </dl>
        </template>
      </ContentEditorShell>

      <div class="flex justify-end">
        <UButton
          type="submit"
          color="primary"
          variant="solid"
          icon="i-lucide-save"
        >
          保存修改
        </UButton>
      </div>
    </form>
  </div>
</template>
