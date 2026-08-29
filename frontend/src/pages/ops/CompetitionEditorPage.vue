<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { http } from '@/shared/http/client'
import { useToast } from '@nuxt/ui/composables'
import CoverUpload from '@/shared/components/upload/CoverUpload.vue'
import MarkdownEditor from '@/shared/components/editor/MarkdownEditor.vue'
import type { CompetitionCategory, CompetitionLevel, MediaImage, ParticipationMode } from '@/shared/types/homepage'
import { competitionCategoryLabel, competitionLevelLabel, participationModeLabel } from '@/shared/lib/domain-labels'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const isEdit = computed(() => Boolean(route.params.id))
const id = computed(() => route.params.id as string | undefined)

const name = ref('')
const edition = ref('')
const category = ref<CompetitionCategory>('OTHER')
const level = ref<CompetitionLevel>('SCHOOL')
const participationMode = ref<ParticipationMode>('INDIVIDUAL')
const collegeOrganized = ref(true)
const officialUrl = ref('')
const registrationUrl = ref('')
const officialNoticeUrl = ref('')
const cover = ref<MediaImage | null>(null)
const suitableGradeMin = ref<number | null>(null)
const suitableGradeMax = ref<number | null>(null)
const directionTags = ref<string[]>([])
const directionInput = ref('')
const summary = ref('')
const descriptionMd = ref('')
const suitableForMd = ref('')
const preparationAdviceMd = ref('')
const registrationStartAt = ref('')
const registrationEndAt = ref('')
const eventStartAt = ref('')
const eventEndAt = ref('')
const collegeContactName = ref('')
const collegeContactText = ref('')

const saving = ref(false)
const publishing = ref(false)
const loading = ref(false)
const lastSaved = ref<string | null>(null)
const createdAt = ref<string | null>(null)
const updatedAt = ref<string | null>(null)
const publicationState = ref<string>('DRAFT')

const activeSection = ref('basic')
const showPreview = ref(false)

const presetDirectionTags = [
  '人工智能', '程序设计', '创新创业', '数学建模', '电子', '机器人',
  '网络安全', '电子设计', '机械设计', '软件开发', '嵌入式', '大数据', '其他'
]

const categoryOptions = (Object.keys(competitionCategoryLabel) as CompetitionCategory[]).map(v => ({ label: competitionCategoryLabel[v], value: v }))
const levelOptions = (Object.keys(competitionLevelLabel) as CompetitionLevel[]).map(v => ({ label: competitionLevelLabel[v], value: v }))
const participationOptions = (Object.keys(participationModeLabel) as ParticipationMode[]).map(v => ({ label: participationModeLabel[v], value: v }))

function parseDirectionToTags(dir: string | null): string[] {
  if (!dir) return []
  return dir.split(/[、，,]/).map(s => s.trim()).filter(Boolean)
}
function tagsToDirection(tags: string[]): string | null {
  if (!tags.length) return null
  return tags.join('、')
}

function addTag(tag?: string) {
  const t = (tag ?? directionInput.value).trim()
  if (!t) return
  if (directionTags.value.includes(t)) { directionInput.value = ''; return }
  if (directionTags.value.length >= 10) { toast.add({ title: '标签最多10个', color: 'warning' }); return }
  if (t.length > 20) { toast.add({ title: '标签过长', color: 'warning' }); return }
  directionTags.value.push(t)
  directionInput.value = ''
}
function removeTag(idx: number) {
  directionTags.value.splice(idx, 1)
}
function onDirectionKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault()
    addTag()
  }
}

const errors = ref<Record<string, string>>({})

async function load() {
  if (!isEdit.value || !id.value) return
  loading.value = true
  try {
    const dto = await http.get<Record<string, unknown>>(`/ops/competitions/${id.value}`)
    name.value = (dto.name as string) ?? ''
    edition.value = (dto.edition as string) ?? ''
    category.value = (dto.category as CompetitionCategory) ?? 'OTHER'
    level.value = (dto.level as CompetitionLevel) ?? 'SCHOOL'
    participationMode.value = (dto.participation_mode as ParticipationMode) ?? (dto.participationMode as ParticipationMode) ?? 'INDIVIDUAL'
    collegeOrganized.value = Boolean(dto.college_organized ?? dto.collegeOrganized ?? true)
    officialUrl.value = (dto.official_url as string) ?? (dto.officialUrl as string) ?? ''
    registrationUrl.value = (dto.registration_url as string) ?? (dto.registrationUrl as string) ?? ''
    officialNoticeUrl.value = (dto.official_notice_url as string) ?? (dto.official_notice_url as string) ?? ''
    const coverDto = dto.cover as Record<string, unknown> | null | undefined
    if (coverDto && (coverDto.src || coverDto.url)) {
      cover.value = { id: (coverDto.id as string) ?? null, src: (coverDto.src as string) ?? (coverDto.url as string) ?? null, alt: (coverDto.alt as string) ?? '' }
    } else if (dto.cover_asset_id) {
      cover.value = { id: dto.cover_asset_id as string, src: null as unknown as string, alt: '' }
    }
    suitableGradeMin.value = (dto.suitable_grade_min as number) ?? (dto.suitableGradeMin as number) ?? null
    suitableGradeMax.value = (dto.suitable_grade_max as number) ?? (dto.suitableGradeMax as number) ?? null
    const dirStr = (dto.direction as string) ?? ''
    directionTags.value = parseDirectionToTags(dirStr)
    summary.value = (dto.summary as string) ?? ''
    descriptionMd.value = (dto.description_md as string) ?? (dto.descriptionMd as string) ?? ''
    suitableForMd.value = (dto.suitable_for_md as string) ?? (dto.suitable_for_md as string) ?? ''
    preparationAdviceMd.value = (dto.preparation_advice_md as string) ?? ''
    registrationStartAt.value = ((dto.registration_start_at as string) ?? (dto.registrationStartAt as string) ?? '').slice(0,16)
    registrationEndAt.value = ((dto.registration_end_at as string) ?? (dto.registrationEndAt as string) ?? '').slice(0,16)
    eventStartAt.value = ((dto.event_start_at as string) ?? '').slice(0,16)
    eventEndAt.value = ((dto.event_end_at as string) ?? '').slice(0,16)
    collegeContactName.value = (dto.college_contact_name as string) ?? ''
    collegeContactText.value = (dto.college_contact_text as string) ?? ''
    publicationState.value = (dto.publication_state as string) ?? (dto.publicationState as string) ?? 'DRAFT'
    createdAt.value = (dto.created_at as string) ?? null
    updatedAt.value = (dto.updated_at as string) ?? null
  } catch (e) {
    toast.add({ title: '加载失败', description: e instanceof Error ? e.message : String(e), color: 'error' })
  } finally { loading.value = false }
}
onMounted(load)
watch(() => route.params.id, load)

function validate(): boolean {
  const errs: Record<string, string> = {}
  if (!name.value.trim()) errs.name = '竞赛名称必填'
  else if (name.value.trim().length < 2) errs.name = '至少2字'
  if (!edition.value.trim()) errs.edition = '届次必填'
  if (!level.value) errs.level = '级别必填'
  if (!descriptionMd.value.trim()) errs.descriptionMd = '竞赛介绍必填'
  if (suitableGradeMin.value !== null && suitableGradeMax.value !== null && suitableGradeMin.value > suitableGradeMax.value) errs.suitableGradeMin = '下限不能大于上限'
  errors.value = errs
  return Object.keys(errs).length === 0
}

async function save(publish = false) {
  if (!validate()) return
  const payload: Record<string, unknown> = {
    name: name.value.trim(),
    edition: edition.value.trim(),
    category: category.value,
    level: level.value,
    participation_mode: participationMode.value,
    college_organized: collegeOrganized.value,
    official_url: officialUrl.value.trim() || null,
    registration_url: registrationUrl.value.trim() || null,
    official_notice_url: officialNoticeUrl.value.trim() || null,
    direction: tagsToDirection(directionTags.value),
    summary: summary.value.trim() || null,
    description_md: descriptionMd.value.trim(),
    suitable_for_md: suitableForMd.value.trim() || null,
    preparation_advice_md: preparationAdviceMd.value.trim() || null,
    suitable_grade_min: suitableGradeMin.value,
    suitable_grade_max: suitableGradeMax.value,
    registration_start_at: registrationStartAt.value ? new Date(registrationStartAt.value).toISOString() : null,
    registration_end_at: registrationEndAt.value ? new Date(registrationEndAt.value).toISOString() : null,
    event_start_at: eventStartAt.value ? new Date(eventStartAt.value).toISOString() : null,
    event_end_at: eventEndAt.value ? new Date(eventEndAt.value).toISOString() : null,
    college_contact_name: collegeContactName.value.trim() || null,
    college_contact_text: collegeContactText.value.trim() || null,
    cover_asset_id: cover.value?.id ?? null,
  }
  saving.value = !publish
  publishing.value = publish
  try {
    let targetId = id.value ?? null
    if (isEdit.value && targetId) {
      await http.patch(`/ops/competitions/${targetId}`, payload)
    } else {
      const res = await http.post<{ id: string }>('/ops/competitions', payload)
      targetId = res.id
    }
    if (publish && targetId) {
      await http.post(`/ops/competitions/${targetId}/publish`)
      toast.add({ title: '已发布', color: 'success' })
      router.push({ name: 'ops-competitions' })
    } else {
      lastSaved.value = new Date().toLocaleString()
      toast.add({ title: isEdit.value ? '已保存' : '已创建草稿', color: 'success' })
      if (!isEdit.value && targetId) router.replace({ name: 'ops-competition-edit', params: { id: targetId } })
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '保存失败'
    toast.add({ title: publish ? '发布失败' : '保存失败', description: msg, color: 'error' })
  } finally { saving.value = false; publishing.value = false }
}

const navItems = [
  { id: 'basic', label: '基础信息' },
  { id: 'intro', label: '竞赛介绍' },
  { id: 'timeline', label: '关键时间线' },
  { id: 'audience', label: '参与与准备建议' },
  { id: 'related', label: '关联内容' },
  { id: 'publish', label: '发布设置' },
]
function scrollTo(id: string) {
  activeSection.value = id
  document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div class="min-h-dvh bg-canvas">
    <header class="sticky top-14 z-20 border-b border-default bg-default/95 backdrop-blur">
      <div class="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div class="min-w-0">
          <div class="flex items-center gap-2 text-xs text-muted">
            <span>竞赛管理</span>
            <UIcon name="i-lucide-chevron-right" class="size-3" />
            <span class="text-highlighted">{{ isEdit ? '编辑竞赛' : '新建竞赛' }}</span>
          </div>
          <div class="mt-1 flex items-center gap-3">
            <h1 class="truncate text-lg font-bold text-highlighted sm:text-xl">{{ name || (isEdit ? '编辑竞赛' : '新建竞赛') }}</h1>
            <UBadge :color="publicationState==='PUBLISHED'?'success':'success'" variant="soft" size="xs">{{ publicationState==='PUBLISHED' ? '已发布' : '草稿' }}</UBadge>
          </div>
          <p v-if="lastSaved || createdAt" class="mt-1 text-xs text-muted">最后保存: {{ lastSaved ?? (updatedAt ?? createdAt ?? '--') }} · 保存人: {{ isEdit ? '当前用户' : '--' }}</p>
        </div>
        <div class="flex items-center gap-2">
          <UButton color="neutral" variant="ghost" icon="i-lucide-eye" @click="showPreview = !showPreview">{{ showPreview ? '编辑' : '预览' }}</UButton>
          <UButton color="neutral" variant="outline" :loading="saving" icon="i-lucide-save" @click="save(false)">保存草稿</UButton>
          <UButton color="primary" :loading="publishing" @click="save(true)">发布</UButton>
        </div>
      </div>
    </header>

    <div v-if="loading" class="mx-auto max-w-[1600px] px-4 py-20 text-center text-sm text-muted sm:px-6">正在加载…</div>
    <div v-else class="mx-auto grid max-w-[1600px] grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[200px_minmax(0,1fr)_320px]">
      <!-- 左侧导航 -->
      <aside class="hidden lg:block">
        <nav class="sticky top-[112px] space-y-1 rounded-xl border border-default bg-default p-2">
          <button v-for="item in navItems" :key="item.id" class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm" :class="activeSection===item.id ? 'bg-primary-50 font-medium text-primary-700 dark:bg-primary-950' : 'text-muted hover:bg-muted'" @click="scrollTo(item.id)">
            <span class="size-1.5 rounded-full" :class="activeSection===item.id ? 'bg-primary-600' : 'bg-transparent'" />
            {{ item.label }}
          </button>
        </nav>
      </aside>

      <!-- 中间表单 -->
      <div class="min-w-0 space-y-6">
        <section id="sec-basic" class="rounded-xl border border-default bg-default p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-highlighted">基础信息</h2>
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <UFormField label="竞赛名称" required :error="errors.name">
              <UInput v-model="name" placeholder="如：蓝桥杯全国软件和信息技术专业人才大赛" class="w-full" />
            </UFormField>
            <div class="grid grid-cols-2 gap-4">
              <UFormField label="届次" required :error="errors.edition">
                <UInput v-model="edition" placeholder="如：第十六届" class="w-full" />
              </UFormField>
              <UFormField label="分类" required>
                <USelect v-model="category" :items="categoryOptions" class="w-full" />
              </UFormField>
            </div>
          </div>
          <div class="mt-4 grid gap-4 sm:grid-cols-3">
            <UFormField label="级别" required>
              <USelect v-model="level" :items="levelOptions" class="w-full" />
            </UFormField>
            <UFormField label="参赛形式" required>
              <USelect v-model="participationMode" :items="participationOptions" class="w-full" />
            </UFormField>
            <UFormField label="是否校内统一组织">
              <div class="flex h-9 items-center gap-2">
                <USwitch v-model="collegeOrganized" />
                <span class="text-sm">{{ collegeOrganized ? '是' : '否' }}</span>
              </div>
            </UFormField>
          </div>
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <UFormField label="官方链接">
              <UInput v-model="officialUrl" placeholder="https://dasai.lanqiao.cn" class="w-full" />
            </UFormField>
            <UFormField label="报名链接">
              <UInput v-model="registrationUrl" placeholder="https://dasai.lanqiao.cn/signup" class="w-full" />
            </UFormField>
          </div>
          <div class="mt-4">
            <UFormField label="封面图" required :error="errors.cover">
              <CoverUpload v-model="cover" label="封面图（16:9 建议 1200x628 JPG/PNG ≤5MB）" />
            </UFormField>
          </div>
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <UFormField label="适合年级">
              <div class="flex gap-2">
                <USelect v-model="suitableGradeMin" :items="[{label:'全部年级',value:null},{label:'1年级',value:1},{label:'2年级',value:2},{label:'3年级',value:3},{label:'4年级',value:4}]" class="flex-1" placeholder="下限" />
                <USelect v-model="suitableGradeMax" :items="[{label:'不限',value:null},{label:'1年级',value:1},{label:'2年级',value:2},{label:'3年级',value:3},{label:'4年级',value:4}]" class="flex-1" placeholder="上限" />
              </div>
            </UFormField>
            <UFormField label="分类（多标签，最多10）" hint="点击预制或回车新增">
              <div class="rounded-lg border border-default p-2">
                <div v-if="directionTags.length" class="mb-2 flex flex-wrap gap-1.5">
                  <UBadge v-for="(tag, idx) in directionTags" :key="tag" color="primary" variant="soft" size="xs" class="gap-1">
                    {{ tag }}
                    <button type="button" class="ml-1 hover:text-danger-600" @click="removeTag(idx)"><UIcon name="i-lucide-x" class="size-3" /></button>
                  </UBadge>
                </div>
                <div class="flex flex-wrap gap-1.5">
                  <button v-for="preset in presetDirectionTags" :key="preset" type="button" class="rounded-full border px-2.5 py-1 text-xs" :class="directionTags.includes(preset) ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-default bg-muted hover:bg-default'" @click="addTag(preset)">{{ preset }}</button>
                </div>
                <UInput v-model="directionInput" placeholder="输入自定义标签后回车" class="mt-2 w-full" @keydown="onDirectionKeydown" />
              </div>
            </UFormField>
          </div>
          <UFormField label="简介摘要" class="mt-4">
            <UTextarea v-model="summary" :rows="3" maxlength="200" placeholder="200字内简介" class="w-full" />
            <p class="mt-1 text-right text-xs text-muted">{{ summary.length }}/200</p>
          </UFormField>
        </section>

        <section id="sec-intro" class="rounded-xl border border-default bg-default p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-highlighted">竞赛介绍 <span class="ml-2 text-xs font-normal text-muted">支持 Markdown / 链接 / 图片</span></h2>
          <div class="mt-3">
            <MarkdownEditor v-model="descriptionMd" :height="320" />
            <p v-if="errors.descriptionMd" class="mt-2 text-xs text-error-600">{{ errors.descriptionMd }}</p>
          </div>
        </section>

        <section id="sec-timeline" class="rounded-xl border border-default bg-default p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-highlighted">关键时间线</h2>
          <div class="mt-3 grid gap-4 sm:grid-cols-2">
            <UFormField label="报名开始"><UInput v-model="registrationStartAt" type="datetime-local" class="w-full" /></UFormField>
            <UFormField label="报名截止"><UInput v-model="registrationEndAt" type="datetime-local" class="w-full" /></UFormField>
            <UFormField label="赛事开始"><UInput v-model="eventStartAt" type="datetime-local" class="w-full" /></UFormField>
            <UFormField label="赛事结束"><UInput v-model="eventEndAt" type="datetime-local" class="w-full" /></UFormField>
          </div>
        </section>

        <section id="sec-audience" class="rounded-xl border border-default bg-default p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-highlighted">参与与准备建议</h2>
          <UFormField label="适合人群说明" class="mt-3"><UTextarea v-model="suitableForMd" :rows="3" placeholder="适合人群 Markdown" class="w-full" /></UFormField>
          <UFormField label="备赛建议" class="mt-3"><UTextarea v-model="preparationAdviceMd" :rows="3" placeholder="备赛建议 Markdown" class="w-full" /></UFormField>
          <div class="mt-3 grid gap-4 sm:grid-cols-2">
            <UFormField label="校内联系人"><UInput v-model="collegeContactName" placeholder="如：张老师" class="w-full" /></UFormField>
            <UFormField label="联系方式"><UInput v-model="collegeContactText" placeholder="邮箱/电话" class="w-full" /></UFormField>
          </div>
        </section>

        <section id="sec-related" class="rounded-xl border border-default bg-default p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-highlighted">关联内容</h2>
          <p class="mt-1 text-xs text-muted">关联公告/指南等，需在对应模块创建后关联</p>
          <div class="mt-3 rounded-lg bg-muted p-4 text-center text-sm text-muted">关联管理入口占位</div>
        </section>

        <section id="sec-publish" class="rounded-xl border border-default bg-default p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-highlighted">发布设置</h2>
          <div class="mt-3 flex items-center gap-2 text-sm">
            <USwitch :model-value="publicationState==='PUBLISHED'" disabled />
            <span>当前状态：{{ publicationState==='PUBLISHED' ? '已发布' : '草稿' }}</span>
          </div>
        </section>
      </div>

      <!-- 右侧状态 -->
      <aside class="hidden space-y-4 lg:block">
        <div class="sticky top-[112px] space-y-4">
          <div class="rounded-xl border border-default bg-default p-4 shadow-sm">
            <h3 class="text-sm font-semibold text-highlighted">内容状态</h3>
            <div class="mt-3 space-y-2 text-xs">
              <div class="flex justify-between"><span class="text-muted">当前状态</span><span class="flex items-center gap-1 font-medium text-success-600"><span class="size-1.5 rounded-full bg-success-500" />{{ publicationState==='PUBLISHED' ? '已发布' : '草稿' }}</span></div>
              <div class="flex justify-between"><span class="text-muted">创建时间</span><span class="text-highlighted">{{ createdAt?.slice(0,16) ?? '--' }}</span></div>
              <div class="flex justify-between"><span class="text-muted">最后更新</span><span class="text-highlighted">{{ updatedAt?.slice(0,16) ?? '--' }}</span></div>
            </div>
            <UButton block variant="ghost" size="xs" class="mt-3" icon="i-lucide-history">查看版本历史</UButton>
          </div>

          <div class="rounded-xl border border-default bg-default p-4 shadow-sm">
            <h3 class="text-sm font-semibold text-highlighted">已关联资源</h3>
            <div class="mt-3 space-y-2 text-xs">
              <div class="flex justify-between"><span class="text-muted">关联公告</span><span>0 条</span></div>
              <div class="flex justify-between"><span class="text-muted">关联指南</span><span>0 条</span></div>
              <div class="flex justify-between"><span class="text-muted">校内说明会</span><span>0 条</span></div>
            </div>
            <UButton block variant="soft" size="xs" class="mt-3">管理关联内容</UButton>
          </div>

          <div class="rounded-xl border border-default bg-default p-4 shadow-sm">
            <h3 class="text-sm font-semibold text-highlighted">校验提醒</h3>
            <ul class="mt-2 space-y-1.5 text-xs">
              <li class="flex items-center gap-1.5" :class="name && edition && level ? 'text-success-600' : 'text-warning-600'"><UIcon :name="name && edition && level ? 'i-lucide-check-circle' : 'i-lucide-alert-circle'" class="size-3.5" />必填项已完整填写</li>
              <li class="flex items-center gap-1.5" :class="registrationStartAt && registrationEndAt ? 'text-success-600' : 'text-muted'"><UIcon :name="registrationStartAt && registrationEndAt ? 'i-lucide-check-circle' : 'i-lucide-circle'" class="size-3.5" />关键时间线已设置</li>
            </ul>
          </div>

          <div class="rounded-xl border border-default bg-default p-4 shadow-sm">
            <h3 class="text-sm font-semibold text-highlighted">预览入口</h3>
            <p class="mt-1 text-xs text-muted">预览当前内容在前台的展示效果</p>
            <UButton block variant="outline" size="xs" class="mt-2" icon="i-lucide-eye" @click="showPreview = !showPreview">{{ showPreview ? '关闭预览' : '预览当前内容' }}</UButton>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>
