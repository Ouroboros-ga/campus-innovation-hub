<script setup lang="ts">
import { ref, watch } from 'vue'
import { useToast } from '@nuxt/ui/composables'

import { createOpsOrganization } from '../api/opsOrganizationApi'
import { AppError } from '@/shared/http/types'
import { organizationTypeLabel } from '@/shared/lib/domain-labels'
import CoverUpload from '@/shared/components/upload/CoverUpload.vue'
import FormSection from '@/shared/components/form/FormSection.vue'
import MarkdownEditor from '@/shared/components/editor/MarkdownEditor.vue'
import type { MediaImage, OrganizationType } from '@/shared/types/homepage'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [open: boolean]; saved: [] }>()
const toast = useToast()

const name = ref('')
const organizationType = ref<OrganizationType>('STUDENT_CLUB')
const shortIntro = ref('')
const descriptionMd = ref('')
const publicContact = ref('')
const qqGroupNumber = ref('')
const qqGroupJoinUrl = ref('')
const allowOnline = ref(true)
const logo = ref<MediaImage | null>(null)
const banner = ref<MediaImage | null>(null)
const errors = ref<Record<string, string>>({})
const submitting = ref(false)

const typeOptions = (Object.keys(organizationTypeLabel) as OrganizationType[]).map(value => ({
  label: organizationTypeLabel[value],
  value
}))

watch(
  () => props.open,
  open => {
    if (!open) return
    name.value = ''
    organizationType.value = 'STUDENT_CLUB'
    shortIntro.value = ''
    descriptionMd.value = ''
    publicContact.value = ''
    qqGroupNumber.value = ''
    qqGroupJoinUrl.value = ''
    allowOnline.value = true
    logo.value = null
    banner.value = null
    errors.value = {}
  }
)

function close() {
  emit('update:open', false)
}

const FIELD_MAP: Record<string, string> = {
  name: 'name',
  organization_type: 'organizationType',
  short_intro: 'shortIntro',
  description_md: 'descriptionMd',
  public_contact: 'publicContact',
  qq_group_number: 'qqGroupNumber',
  qq_group_join_url: 'qqGroupJoinUrl',
  logo_asset_id: 'logo',
  banner_asset_id: 'banner',
  qq_group_qr_asset_id: 'qqQr'
}

function mapFieldErrors(fieldErrors: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(fieldErrors)) {
    result[FIELD_MAP[key] ?? key] = value
  }
  return result
}

function validateLocal(): Record<string, string> {
  const e: Record<string, string> = {}
  if (!name.value.trim() || name.value.trim().length < 2) e.name = '组织名称至少 2 个字符'
  if (name.value.trim().length > 100) e.name = '组织名称最多 100 字符'
  if (!organizationType.value) e.organizationType = '请选择组织类型'
  if (shortIntro.value && shortIntro.value.length > 200) e.shortIntro = '简介最多 200 字符'
  if (descriptionMd.value && descriptionMd.value.length > 10000) e.descriptionMd = '详细介绍最多 10000 字符'
  if (publicContact.value && publicContact.value.length > 200) e.publicContact = '联系方式最多 200 字符'
  if (qqGroupNumber.value && qqGroupNumber.value.length > 30) e.qqGroupNumber = '群号最多 30 字符'
  if (qqGroupJoinUrl.value) {
    try {
      const u = new globalThis.URL(qqGroupJoinUrl.value)
      if (!['http:', 'https:'].includes(u.protocol)) e.qqGroupJoinUrl = '请输入 http(s) 链接'
    } catch {
      e.qqGroupJoinUrl = '请输入合法的 http(s) 链接'
    }
    if (qqGroupJoinUrl.value.length > 500) e.qqGroupJoinUrl = '链接最多 500 字符'
  }
  return e
}

async function save() {
  const localErrors = validateLocal()
  errors.value = localErrors
  if (Object.keys(localErrors).length > 0) return

  submitting.value = true
  try {
    await createOpsOrganization({
      name: name.value.trim(),
      organization_type: organizationType.value,
      short_intro: shortIntro.value.trim() || null,
      description_md: descriptionMd.value.trim() || null,
      logo_asset_id: logo.value?.id ?? null,
      banner_asset_id: banner.value?.id ?? null,
      public_contact: publicContact.value.trim() || null,
      qq_group_number: qqGroupNumber.value.trim() || null,
      qq_group_join_url: qqGroupJoinUrl.value.trim() || null,
      allow_online_application: allowOnline.value,
      related_links_json: []
    })
    toast.add({ title: '已创建组织', description: `「${name.value.trim()}」创建成功`, color: 'success', icon: 'i-lucide-check-circle' })
    close()
    emit('saved')
  } catch (err) {
    if (err instanceof AppError && err.fieldErrors) {
      errors.value = { ...errors.value, ...mapFieldErrors(err.fieldErrors) }
    } else {
      const message = err instanceof AppError ? err.message : '创建失败，请稍后重试。'
      toast.add({ title: '创建失败', description: message, color: 'error', icon: 'i-lucide-alert-circle' })
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <UModal :open="props.open" :ui="{ content: 'max-w-[720px] max-h-[90vh] overflow-hidden flex flex-col' }" @update:open="close">
    <template #header>
      <div class="flex items-start gap-3">
        <span class="grid size-9 place-items-center rounded-xl bg-primary-600 text-white shadow-sm">
          <UIcon name="i-lucide-plus" class="size-5" aria-hidden="true" />
        </span>
        <div class="min-w-0 flex-1">
          <h2 class="text-base font-semibold text-highlighted">新建组织</h2>
          <p class="mt-1 text-xs leading-relaxed text-muted">创建后立即可见，名称全局唯一</p>
        </div>
      </div>
    </template>

    <template #content>
      <form class="space-y-6 overflow-y-auto px-1 py-2" novalidate @submit.prevent="save">
        <FormSection title="基本信息" description="名称与类型为必填">
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="组织名称" name="name" required :error="errors.name">
              <UInput v-model="name" placeholder="如：人工智能协会" class="w-full" />
            </UFormField>
            <UFormField label="组织类型" name="organizationType" required :error="errors.organizationType">
              <USelect v-model="organizationType" :items="typeOptions" class="w-full" />
            </UFormField>
          </div>
          <UFormField label="一句话简介" :error="errors.shortIntro">
            <UInput v-model="shortIntro" placeholder="200 字内" maxlength="200" class="w-full" />
          </UFormField>
          <UFormField label="公开联系方式" :error="errors.publicContact">
            <UInput v-model="publicContact" placeholder="邮箱或电话，选填" class="w-full" />
          </UFormField>
        </FormSection>

        <FormSection title="媒体" description="Logo 与横幅（选填，需先上传）">
          <CoverUpload v-model="logo" label="组织 Logo（选填，正方形更佳）" />
          <CoverUpload v-model="banner" label="组织横幅（选填，16:9）" />
        </FormSection>

        <FormSection title="招新引流" description="QQ 群与在线申请开关">
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="QQ 群号" :error="errors.qqGroupNumber">
              <UInput v-model="qqGroupNumber" placeholder="如：876543210" class="w-full" />
            </UFormField>
            <UFormField label="入群链接" :error="errors.qqGroupJoinUrl">
              <UInput v-model="qqGroupJoinUrl" placeholder="https://qm.qq.com/q/..." class="w-full" />
            </UFormField>
          </div>
          <UFormField label="在线申请">
            <UCheckbox v-model="allowOnline" :label="allowOnline ? '允许平台在线申请' : '仅展示入群方式'" />
          </UFormField>
        </FormSection>

        <FormSection title="详细介绍" description="支持 Markdown，展示在组织主页">
          <UFormField :error="errors.descriptionMd">
            <MarkdownEditor v-model="descriptionMd" :height="220" />
          </UFormField>
        </FormSection>
      </form>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-between gap-3 border-t border-default bg-muted/20 px-1 py-1">
        <p class="hidden text-xs text-muted sm:block">名称唯一，创建后可在列表中编辑资料</p>
        <div class="ml-auto flex items-center gap-2">
          <UButton color="neutral" variant="ghost" @click="close">取消</UButton>
          <UButton color="primary" icon="i-lucide-plus" :loading="submitting" @click="save">创建组织</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
