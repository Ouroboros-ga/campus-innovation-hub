<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useToast } from '@nuxt/ui/composables'

import { createOpsOrganization, getOpsOrganization, searchOpsUsers, updateOpsOrganization, type OpsUserOption, type OrganizationCreatePayload } from '../api/opsOrganizationApi'
import { AppError } from '@/shared/http/types'
import { organizationTypeLabel } from '@/shared/lib/domain-labels'
import CoverUpload from '@/shared/components/upload/CoverUpload.vue'
import FormSection from '@/shared/components/form/FormSection.vue'
import MarkdownEditor from '@/shared/components/editor/MarkdownEditor.vue'
import type { MediaImage, OrganizationType } from '@/shared/types/homepage'
import { firstFieldErrors } from '@/shared/lib/form-errors'

const props = defineProps<{ open: boolean; organizationId?: string | null }>()
const emit = defineEmits<{ 'update:open': [open: boolean]; saved: [] }>()
const toast = useToast()

const isEdit = computed(() => !!props.organizationId)

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
const loadingDetail = ref(false)

// 负责人/指导老师
const leaderQuery = ref('')
const advisorQuery = ref('')
const leaderOptions = ref<OpsUserOption[]>([])
const advisorOptions = ref<OpsUserOption[]>([])
const leaderSelected = ref<OpsUserOption | null>(null)
const advisorSelected = ref<OpsUserOption | null>(null)
const leaderTitle = ref('')
const advisorTitle = ref('')
const leaderSearching = ref(false)
const advisorSearching = ref(false)
let leaderTimer: ReturnType<typeof globalThis.setTimeout> | null = null
let advisorTimer: ReturnType<typeof globalThis.setTimeout> | null = null

const typeOptions = (Object.keys(organizationTypeLabel) as OrganizationType[]).map(value => ({
  label: organizationTypeLabel[value],
  value
}))

function resetForm() {
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
  leaderQuery.value = ''
  advisorQuery.value = ''
  leaderOptions.value = []
  advisorOptions.value = []
  leaderSelected.value = null
  advisorSelected.value = null
  leaderTitle.value = ''
  advisorTitle.value = ''
}

async function loadDetail() {
  if (!props.organizationId) return
  loadingDetail.value = true
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const org: any = await getOpsOrganization(props.organizationId)
    name.value = (org.name as string) ?? ''
    organizationType.value = (org.organization_type as OrganizationType) ?? 'STUDENT_CLUB'
    shortIntro.value = (org.short_intro as string) ?? ''
    descriptionMd.value = (org.description_md as string) ?? ''
    publicContact.value = (org.public_contact as string) ?? ''
    qqGroupNumber.value = (org.qq_group_number as string) ?? ''
    qqGroupJoinUrl.value = (org.qq_group_join_url as string) ?? ''
    allowOnline.value = (org.allow_online_application as boolean) ?? true
    const orgName = (org.name as string) ?? ''
    const logoDto = org.logo as { id?: string; url?: string | null } | null | undefined
    const bannerDto = org.banner as { id?: string; url?: string | null } | null | undefined
    logo.value = logoDto?.url ? { id: (logoDto.id as string | null) ?? null, src: logoDto.url, alt: orgName } : null
    banner.value = bannerDto?.url ? { id: (bannerDto.id as string | null) ?? null, src: bannerDto.url, alt: orgName } : null
    // leader/advisor
    const leaderDto = org.leader as { user_id: string; display_name: string; avatar?: { url: string | null } | null; title?: string | null } | null | undefined
    if (leaderDto) {
      leaderSelected.value = {
        id: leaderDto.user_id,
        username: leaderDto.user_id,
        real_name: leaderDto.display_name,
        identity_type: 'STUDENT',
        display_name: leaderDto.display_name,
        avatar: leaderDto.avatar ?? null,
        department: null,
        major: null
      } as OpsUserOption
      leaderQuery.value = leaderDto.display_name ?? ''
      leaderTitle.value = leaderDto.title ?? ''
    }
    const advisorDto = org.advisor as { user_id: string; display_name: string; avatar?: { url: string | null } | null; title?: string | null } | null | undefined
    if (advisorDto) {
      advisorSelected.value = {
        id: advisorDto.user_id,
        username: advisorDto.user_id,
        real_name: advisorDto.display_name,
        identity_type: 'TEACHER',
        display_name: advisorDto.display_name,
        avatar: advisorDto.avatar ?? null,
        department: null,
        major: null
      } as OpsUserOption
      advisorQuery.value = advisorDto.display_name ?? ''
      advisorTitle.value = advisorDto.title ?? ''
    }
  } catch (err) {
    const msg = err instanceof AppError ? err.message : '加载组织详情失败'
    toast.add({ title: '加载失败', description: msg, color: 'error', icon: 'i-lucide-alert-circle' })
  } finally {
    loadingDetail.value = false
  }
}

watch(
  () => [props.open, props.organizationId] as const,
  ([open, orgId]) => {
    if (!open) return
    resetForm()
    if (orgId) {
      loadDetail()
    }
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
  qq_group_qr_asset_id: 'qqQr',
  leader_user_id: 'leader',
  advisor_user_id: 'advisor',
  leader_title: 'leaderTitle',
  advisor_title: 'advisorTitle'
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
  if (leaderTitle.value && leaderTitle.value.length > 80) e.leaderTitle = '头衔最多 80 字符'
  if (advisorTitle.value && advisorTitle.value.length > 80) e.advisorTitle = '头衔最多 80 字符'
  if (qqGroupJoinUrl.value) {
    try {
      const u = new globalThis.URL(qqGroupJoinUrl.value)
      if (!['http:', 'https:'].includes(u.protocol)) e.qqGroupJoinUrl = '请输入 http(s) 链接'
    } catch {
      e.qqGroupJoinUrl = '请输入合法的 http(s) 链接'
    }
    if (qqGroupJoinUrl.value.length > 500) e.qqGroupJoinUrl = '链接最多 500 字符'
  }
  if (leaderSelected.value && advisorSelected.value && leaderSelected.value.id === advisorSelected.value.id) {
    e.advisor = '负责人与指导老师不能为同一账号'
  }
  return e
}

function onLeaderInput(val: string) {
  leaderQuery.value = val
  if (leaderSelected.value && val !== leaderSelected.value.display_name) {
    leaderSelected.value = null
  }
  if (leaderTimer) globalThis.clearTimeout(leaderTimer)
  if (!val.trim() || val.trim().length < 1) {
    leaderOptions.value = []
    return
  }
  leaderSearching.value = true
  leaderTimer = globalThis.setTimeout(async () => {
    try {
      const res = await searchOpsUsers({ q: val.trim(), pageSize: 8 })
      leaderOptions.value = res.results
    } catch { leaderOptions.value = [] } finally { leaderSearching.value = false }
  }, 300)
}

function onAdvisorInput(val: string) {
  advisorQuery.value = val
  if (advisorSelected.value && val !== advisorSelected.value.display_name) {
    advisorSelected.value = null
  }
  if (advisorTimer) globalThis.clearTimeout(advisorTimer)
  if (!val.trim() || val.trim().length < 1) {
    advisorOptions.value = []
    return
  }
  advisorSearching.value = true
  advisorTimer = globalThis.setTimeout(async () => {
    try {
      const res = await searchOpsUsers({ q: val.trim(), identity_type: 'TEACHER', pageSize: 8 })
      advisorOptions.value = res.results
    } catch { advisorOptions.value = [] } finally { advisorSearching.value = false }
  }, 300)
}

function selectLeader(opt: OpsUserOption) {
  leaderSelected.value = opt
  leaderQuery.value = opt.display_name
  leaderOptions.value = []
}

function selectAdvisor(opt: OpsUserOption) {
  advisorSelected.value = opt
  advisorQuery.value = opt.display_name
  advisorOptions.value = []
}

function clearLeader() {
  leaderSelected.value = null
  leaderQuery.value = ''
  leaderOptions.value = []
}

function clearAdvisor() {
  advisorSelected.value = null
  advisorQuery.value = ''
  advisorOptions.value = []
}

async function save() {
  const localErrors = validateLocal()
  errors.value = localErrors
  if (Object.keys(localErrors).length > 0) return

  submitting.value = true
  try {
    const payload: OrganizationCreatePayload = {
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
      related_links_json: [],
      leader_user_id: leaderSelected.value?.id ?? null,
      leader_title: leaderTitle.value.trim() || null,
      advisor_user_id: advisorSelected.value?.id ?? null,
      advisor_title: advisorTitle.value.trim() || null
    }
    // 编辑时允许清空：若用户清空了输入并移除选择，则传 null 语义为清空；若从未选择则保持 null 也会被后端视为清空，需要区分。
    // 后端通过 “是否传入该 key” 判断是否改动；创建时 null 无碍，编辑时需要显式传 null 以清空旧值。
    // 此处创建与编辑统一传值，编辑清空逻辑由后端处理。
    if (isEdit.value && props.organizationId) {
      // 编辑：只发送必要字段，若未改动名称也需传？后端要求至少一个字段，创建的全量可复用
      await updateOpsOrganization(props.organizationId, payload)
      toast.add({ title: '已更新组织', description: `「${name.value.trim()}」已保存`, color: 'success', icon: 'i-lucide-check-circle' })
    } else {
      await createOpsOrganization(payload)
      toast.add({ title: '已创建组织', description: `「${name.value.trim()}」创建成功`, color: 'success', icon: 'i-lucide-check-circle' })
    }
    close()
    emit('saved')
  } catch (err) {
    if (err instanceof AppError && err.fieldErrors) {
      errors.value = { ...errors.value, ...firstFieldErrors(err.fieldErrors, FIELD_MAP) }
    } else {
      const message = err instanceof AppError ? err.message : (isEdit.value ? '保存失败，请稍后重试。' : '创建失败，请稍后重试。')
      toast.add({ title: isEdit.value ? '保存失败' : '创建失败', description: message, color: 'error', icon: 'i-lucide-alert-circle' })
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <UModal :open="props.open" :ui="{ content: 'max-w-[720px] w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] max-h-[90vh] flex flex-col overflow-hidden', header: 'shrink-0 border-b border-default', body: 'flex-1 overflow-y-auto min-h-0 p-4 sm:p-6', footer: 'shrink-0 border-t border-default bg-muted/20' }" @update:open="close">
    <template #header>
      <div class="flex items-start gap-3">
        <span class="grid size-9 place-items-center rounded-xl bg-primary-600 text-white shadow-sm">
          <UIcon :name="isEdit ? 'i-lucide-pencil' : 'i-lucide-plus'" class="size-5" aria-hidden="true" />
        </span>
        <div class="min-w-0 flex-1">
          <h2 class="text-base font-semibold text-highlighted">{{ isEdit ? '编辑组织' : '新建组织' }}</h2>
          <p class="mt-1 text-xs leading-relaxed text-muted">{{ isEdit ? '修改组织资料与负责人' : '创建后立即可见，名称全局唯一' }}</p>
        </div>
      </div>
    </template>

    <template #body>
      <div v-if="loadingDetail" class="py-10 text-center text-sm text-muted">正在加载…</div>
      <form v-else class="space-y-6" novalidate @submit.prevent="save">
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

        <FormSection title="负责人与指导老师" description="超管可在创建/编辑时直接指派（可留空，后续可在成员管理中调整）">
          <div class="grid gap-4">
            <div>
              <UFormField label="负责人（LEADER）" :error="errors.leader || errors.leaderTitle">
                <div class="flex gap-2">
                  <div class="flex-1 relative">
                    <UInput :model-value="leaderQuery" placeholder="输入学号/姓名/用户名搜索" class="w-full" @update:model-value="onLeaderInput" />
                    <div v-if="leaderOptions.length" class="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border border-default bg-default shadow-lg">
                      <button v-for="opt in leaderOptions" :key="opt.id" type="button" class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted" @click="selectLeader(opt)">
                        <UAvatar :src="opt.avatar?.url ?? undefined" :alt="opt.display_name" size="xs" />
                        <span class="flex-1 truncate">{{ opt.display_name }}<span class="ml-1 text-xs text-muted">({{ opt.username }} · {{ opt.identity_type }})</span></span>
                      </button>
                    </div>
                    <p v-if="leaderSearching" class="mt-1 text-xs text-muted">搜索中…</p>
                  </div>
                  <UButton v-if="leaderSelected" color="neutral" variant="ghost" size="sm" icon="i-lucide-x" @click="clearLeader">清除</UButton>
                </div>
                <div v-if="leaderSelected" class="mt-2 flex items-center gap-2 rounded-md border border-default bg-muted/30 px-3 py-2">
                  <UAvatar :src="leaderSelected.avatar?.url ?? undefined" :alt="leaderSelected.display_name" size="xs" />
                  <span class="text-sm font-medium text-highlighted">{{ leaderSelected.display_name }}</span>
                  <span class="text-xs text-muted">{{ leaderSelected.username }} · {{ leaderSelected.identity_type }}</span>
                </div>
              </UFormField>
              <UFormField label="负责人头衔（选填）" :error="errors.leaderTitle" class="mt-2">
                <UInput v-model="leaderTitle" placeholder="如：会长 / 部长" class="w-full" />
              </UFormField>
            </div>

            <div>
              <UFormField label="指导老师（ADVISOR，需教师账号）" :error="errors.advisor || errors.advisorTitle">
                <div class="flex gap-2">
                  <div class="flex-1 relative">
                    <UInput :model-value="advisorQuery" placeholder="输入工号/姓名搜索教师" class="w-full" @update:model-value="onAdvisorInput" />
                    <div v-if="advisorOptions.length" class="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border border-default bg-default shadow-lg">
                      <button v-for="opt in advisorOptions" :key="opt.id" type="button" class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted" @click="selectAdvisor(opt)">
                        <UAvatar :src="opt.avatar?.url ?? undefined" :alt="opt.display_name" size="xs" />
                        <span class="flex-1 truncate">{{ opt.display_name }}<span class="ml-1 text-xs text-muted">({{ opt.username }})</span></span>
                      </button>
                    </div>
                    <p v-if="advisorSearching" class="mt-1 text-xs text-muted">搜索中…</p>
                  </div>
                  <UButton v-if="advisorSelected" color="neutral" variant="ghost" size="sm" icon="i-lucide-x" @click="clearAdvisor">清除</UButton>
                </div>
                <div v-if="advisorSelected" class="mt-2 flex items-center gap-2 rounded-md border border-default bg-muted/30 px-3 py-2">
                  <UAvatar :src="advisorSelected.avatar?.url ?? undefined" :alt="advisorSelected.display_name" size="xs" />
                  <span class="text-sm font-medium text-highlighted">{{ advisorSelected.display_name }}</span>
                  <span class="text-xs text-muted">{{ advisorSelected.username }} · 教师</span>
                </div>
                <p class="mt-1 text-xs text-muted">需为已填写“公开姓名”的教师账号，否则保存时会校验失败。</p>
              </UFormField>
              <UFormField label="指导老师头衔（选填）" :error="errors.advisorTitle" class="mt-2">
                <UInput v-model="advisorTitle" placeholder="如：指导老师" class="w-full" />
              </UFormField>
            </div>
          </div>
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
        <p class="hidden text-xs text-muted sm:block">{{ isEdit ? '保存后立即生效' : '名称唯一，创建后可在列表中编辑资料' }}</p>
        <div class="ml-auto flex items-center gap-2">
          <UButton color="neutral" variant="ghost" @click="close">取消</UButton>
          <UButton :color="isEdit ? 'primary' : 'primary'" :icon="isEdit ? 'i-lucide-check' : 'i-lucide-plus'" :loading="submitting" :disabled="loadingDetail" @click="save">{{ isEdit ? '保存修改' : '创建组织' }}</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
