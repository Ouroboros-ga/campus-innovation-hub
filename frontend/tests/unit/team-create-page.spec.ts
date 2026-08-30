import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import TeamCreatePage from '@/pages/teams/TeamCreatePage.vue'
import { listCompetitions } from '@/features/competitions/api/competitionApi'
import { useAuthStore } from '@/stores/auth'
import { mountWithAppContext } from '../utils/mountWithAppContext'

vi.mock('@/features/competitions/api/competitionApi', () => ({
  listCompetitions: vi.fn()
}))

const mounted: VueWrapper[] = []

async function mountPage() {
  vi.mocked(listCompetitions).mockResolvedValue({
    items: [],
    total: 0,
    page: 1
  })
  const { wrapper } = await mountWithAppContext(TeamCreatePage, {
    initialRoute: '/teams/create',
    routes: [{ path: '/teams/create', component: TeamCreatePage }],
    stubs: { RouterLink: true }
  })
  mounted.push(wrapper)
  const auth = useAuthStore()
  auth.status = 'authenticated'
  auth.user = {
    id: 'student-1',
    username: 'student',
    identity_type: 'STUDENT',
    student_no: '20260001',
    employee_no: null,
    real_name: '测试学生',
    platform_role: 'USER',
    is_superuser: false,
    profile: {
      nickname: '测试学生',
      major: '人工智能',
      grade: 2,
      bio: '',
      skills: []
    }
  }
  auth.permissions = { platform_role: 'USER', organization_memberships: [] }
  await flushPromises()
  return wrapper
}

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
  document.body.innerHTML = ''
})

describe('FE-032 发布组队表单', () => {
  it('渲染表单字段', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('发布组队')
    expect(wrapper.text()).toContain('关联竞赛')
    expect(wrapper.text()).toContain('信息类型')
    expect(wrapper.text()).toContain('标题')
    expect(wrapper.text()).toContain('项目 / 方向简介')
    expect(wrapper.text()).toContain('招募岗位')
    expect(wrapper.text()).toContain('预计投入时间')
    expect(wrapper.text()).toContain('联系方式')
  })

  it('点击发布校验必填字段', async () => {
    const wrapper = await mountPage()

    const submitButton = wrapper
      .findAll('button')
      .find(b => b.text() === '发布')
    await submitButton!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('请选择关联竞赛')
    expect(wrapper.text()).toContain('请选择信息类型')
    expect(wrapper.text()).toContain('请填写标题')
    expect(wrapper.text()).toContain('请填写项目 / 方向简介')
    expect(wrapper.text()).toContain('请至少填写一个招募岗位')
    expect(wrapper.text()).toContain('请填写联系方式')
  })
})
