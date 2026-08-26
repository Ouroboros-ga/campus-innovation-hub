import ui from '@nuxt/ui/vue-plugin'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import OrgManageShell from '@/features/organizations/components/OrgManageShell.vue'
import OrgApplicationsPage from '@/pages/manage/OrgApplicationsPage.vue'
import {
  addRecruitment,
  canManageOrganization,
  managedApplications,
  managedRecruitments,
  setRecruitmentState,
  validateRecruitEditor
} from '@/features/organizations/lib/orgManagement'

const mounted: ReturnType<typeof mount>[] = []

async function mountComponent(component: unknown, pattern: string, url: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: pattern, component: component as never }]
  })
  await router.push(url)
  await router.isReady()

  const wrapper = mount(component as never, {
    attachTo: document.body,
    global: {
      plugins: [router, ui],
      stubs: { RouterLink: true, RouterView: true }
    }
  })
  mounted.push(wrapper)
  return wrapper
}

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
  document.body.innerHTML = ''
})

describe('FE-080 组织管理', () => {
  it('负责人可管理，成员不可管理（mock 权限）', () => {
    expect(canManageOrganization('ai-union')).toBe(true)
    expect(canManageOrganization('robot-lab')).toBe(true)
    expect(canManageOrganization('data-science-club')).toBe(false)
  })

  it('管理数据包含招新与申请', () => {
    expect(managedRecruitments('ai-union').length).toBeGreaterThanOrEqual(1)
    expect(managedApplications('ai-union').length).toBeGreaterThanOrEqual(1)
  })

  it('校验并可新建/发布招新', () => {
    const errors = validateRecruitEditor({
      title: '',
      introMd: '',
      applyStartAt: '',
      applyEndAt: '',
      targetGradeMin: null,
      targetGradeMax: null,
      notesMd: '',
      positions: []
    })
    expect(errors.title).toBeTruthy()
    expect(errors.positions).toBeTruthy()

    const before = managedRecruitments('ai-union').length
    const added = addRecruitment('ai-union', {
      title: '测试招新',
      introMd: '介绍',
      applyStartAt: '2026-09-01T00:00:00',
      applyEndAt: '2026-09-10T00:00:00',
      targetGradeMin: 1,
      targetGradeMax: 4,
      notesMd: '',
      positions: [{ name: '岗位 A', headcount: 2, description: '', requirements: '' }]
    })
    expect(managedRecruitments('ai-union').length).toBe(before + 1)
    expect(added.publicationState).toBe('DRAFT')

    setRecruitmentState('ai-union', added.id, 'PUBLISHED')
    const updated = managedRecruitments('ai-union').find(item => item.id === added.id)
    expect(updated?.publicationState).toBe('PUBLISHED')
  })

  it('负责人可见管理入口，成员/学生见无权访问', async () => {
    const lead = await mountComponent(
      OrgManageShell,
      '/manage/organizations/:organizationId',
      '/manage/organizations/ai-union'
    )
    expect(lead.text()).toContain('人工智能协会')
    expect(lead.text()).toContain('组织管理')
    expect(lead.text()).toContain('组织资料')
    expect(lead.text()).toContain('招新管理')
    expect(lead.text()).toContain('申请管理')

    const member = await mountComponent(
      OrgManageShell,
      '/manage/organizations/:organizationId',
      '/manage/organizations/data-science-club'
    )
    expect(member.text()).toContain('无权访问')
  })

  it('申请管理可接受待处理申请', async () => {
    const wrapper = await mountComponent(
      OrgApplicationsPage,
      '/manage/organizations/:organizationId',
      '/manage/organizations/ai-union'
    )
    expect(wrapper.text()).toContain('待处理')

    const acceptButton = wrapper
      .findAll('button')
      .find(b => b.text() === '接受')
    await acceptButton!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('已接受')
  })
})
