import ui from '@nuxt/ui/vue-plugin'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import App from '@/app/App.vue'
import { getCompetition, listCompetitions } from '@/features/competitions/api/competitionApi'
import { getActivity, listActivities, listAnnouncements } from '@/features/dynamics/api/dynamicsApi'
import { getHome, type HomeData } from '@/features/homepage/api/homeApi'
import { getOrganization, getRecruitment, listOrganizations } from '@/features/organizations/api/organizationApi'
import { listTeams } from '@/features/teams/api/teamApi'
import { competitionDetails } from '@/mocks/fixtures/competitions-detail'
import { competitions } from '@/mocks/fixtures/competitions'
import { dynamicsActivities, dynamicsAnnouncements } from '@/mocks/fixtures/dynamics'
import { organizationDetails, organizations, recruitmentDetails } from '@/mocks/fixtures/organizations'
import { routes } from '@/router/routes'

vi.mock('@/features/auth/api/authApi', () => ({
  initCsrf: vi.fn().mockResolvedValue(undefined),
  fetchCurrentUser: vi.fn().mockResolvedValue(null),
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn()
}))
vi.mock('@/features/homepage/api/homeApi', () => ({ getHome: vi.fn() }))
vi.mock('@/features/competitions/api/competitionApi', () => ({
  getCompetition: vi.fn(),
  listCompetitions: vi.fn(),
  followCompetition: vi.fn(),
  unfollowCompetition: vi.fn()
}))
vi.mock('@/features/organizations/api/organizationApi', () => ({
  getOrganization: vi.fn(),
  getRecruitment: vi.fn(),
  listOrganizations: vi.fn(),
  applyToRecruitment: vi.fn(),
  withdrawRecruitmentApplication: vi.fn()
}))
vi.mock('@/features/teams/api/teamApi', () => ({ listTeams: vi.fn() }))
vi.mock('@/features/dynamics/api/dynamicsApi', () => ({
  getActivity: vi.fn(),
  listActivities: vi.fn(),
  listAnnouncements: vi.fn(),
  registerActivity: vi.fn(),
  cancelActivityRegistration: vi.fn()
}))

const emptyHome: HomeData = {
  banners: [], deadlines: [], featuredCompetitions: [], announcements: [],
  featuredGuides: [], teamPosts: [], recruitingOrganizations: [], activities: [], faqs: []
}

const mountedWrappers: ReturnType<typeof mount>[] = []

beforeEach(() => {
  vi.mocked(getHome).mockResolvedValue(emptyHome)
  vi.mocked(listCompetitions).mockResolvedValue({ items: competitions, total: competitions.length, page: 1 })
  vi.mocked(getCompetition).mockImplementation(async id => competitionDetails[id]!)
  vi.mocked(listOrganizations).mockResolvedValue({ items: organizations, total: organizations.length, page: 1 })
  vi.mocked(getOrganization).mockImplementation(async id => organizationDetails.find(item => item.id === id)!)
  vi.mocked(getRecruitment).mockImplementation(async id => recruitmentDetails.find(item => item.id === id)!)
  vi.mocked(listTeams).mockResolvedValue({ items: [], total: 0, page: 1 })
  vi.mocked(listActivities).mockResolvedValue({ items: dynamicsActivities, total: dynamicsActivities.length, page: 1 })
  vi.mocked(listAnnouncements).mockResolvedValue({ items: dynamicsAnnouncements, total: dynamicsAnnouncements.length, page: 1 })
  vi.mocked(getActivity).mockImplementation(async id => dynamicsActivities.find(item => item.id === id)!)
})

/** 设置视口宽度（px），用于驱动 `useBreakpoint` 响应式外壳的确定性测试。 */
function setViewportWidth(width: number) {
  ;(globalThis as unknown as { __viewportWidth: number }).__viewportWidth =
    width
}

async function mountAt(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes
  })
  await router.push(path)
  await router.isReady()

  const wrapper = mount(App, {
    attachTo: document.body,
    global: {
      plugins: [router, ui, createPinia()]
    }
  })
  mountedWrappers.push(wrapper)
  await flushPromises()

  return { router, wrapper }
}

afterEach(() => {
  setViewportWidth(1024)
  mountedWrappers.splice(0).forEach(wrapper => wrapper.unmount())
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
})

describe('FE-004 公开应用外壳', () => {
  it.each([
    ['/', '发现科创机会，成就无限可能'],
    ['/competitions', '竞赛中心'],
    ['/organizations', '社团与组织'],
    ['/teams', '组队广场'],
    ['/activities', '校园动态'],
    ['/qa', '咨询与指南']
  ])('让 %s 共享完整外壳并显示正确页面标题', async (path, title) => {
    const { wrapper } = await mountAt(path)

    expect(wrapper.get('header').attributes('role')).toBe('banner')
    expect(wrapper.get('main').get('h1').text()).toBe(title)
    expect(wrapper.get('footer').attributes('role')).toBe('contentinfo')
  })

  it('支持桌面导航、活动路由状态和可访问的工具按钮', async () => {
    const { router, wrapper } = await mountAt('/')

    const desktopNavigation = wrapper.get('[aria-label="主导航"]')
    expect(desktopNavigation.text()).toContain('首页')
    expect(desktopNavigation.text()).toContain('竞赛')
    expect(desktopNavigation.text()).toContain('社团组织')
    expect(desktopNavigation.text()).toContain('组队广场')
    expect(desktopNavigation.text()).toContain('校园动态')
    expect(desktopNavigation.text()).toContain('咨询指南（Q&A）')

    await desktopNavigation.get('a[href="/activities"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/activities')
    expect(wrapper.get('main h1').text()).toBe('校园动态')
    expect(
      desktopNavigation.get('a[href="/activities"]').attributes('aria-current')
    ).toBe('page')
    // 活动项字体色需真实生效，避免 `text-toned` 覆盖 `text-primary` 导致不高亮
    const activeItem = desktopNavigation.get('a[href="/activities"]')
    expect(activeItem.classes()).toContain('text-primary')
    expect(activeItem.classes()).not.toContain('text-toned')
    expect(wrapper.get('button[aria-label="搜索"]')).toBeTruthy()
    expect(wrapper.get('button[aria-label="查看通知"]')).toBeTruthy()
    expect(wrapper.get('button[aria-label="切换外观"]')).toBeTruthy()
    // 匿名态用户入口为「登录」按钮（FE-105）
    expect(wrapper.get('button[aria-label="登录"]')).toBeTruthy()
  })

  it('Tablet 通过 Drawer 导航并在选择后关闭', async () => {
    setViewportWidth(800)
    vi.stubGlobal('getComputedStyle', () => {
      const base: Record<string, string> = {
        animationName: 'none',
        display: 'block'
      }
      return new Proxy(base, {
        get(target, prop) {
          if (prop in target) return target[prop as keyof typeof base]
          if (prop === 'getPropertyValue') return () => '0px'
          if (prop === 'getPropertyPriority') return () => ''
          return ''
        },
        has: () => true
      })
    })
    const { router, wrapper } = await mountAt('/')

    await wrapper.get('button[aria-label="打开主菜单"]').trigger('click')
    await flushPromises()

    const drawer = document.body.querySelector('[role="dialog"]')
    expect(drawer?.textContent).toContain('主导航')

    const organizationLink = drawer?.querySelector<HTMLAnchorElement>(
      'a[href="/organizations"]'
    )
    organizationLink?.click()
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/organizations')
    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
  })

  it('手机端根页展示五项底部主导航并标记活动项', async () => {
    setViewportWidth(390)
    const { wrapper } = await mountAt('/')

    const bottomNav = wrapper.get('[aria-label="底部主导航"]')
    expect(bottomNav.text()).toContain('首页')
    expect(bottomNav.text()).toContain('竞赛')
    expect(bottomNav.text()).toContain('组队')
    expect(bottomNav.text()).toContain('动态')
    expect(bottomNav.text()).toContain('我的')

    const homeItem = bottomNav.get('a[href="/"]')
    expect(homeItem.attributes('aria-current')).toBe('page')
    // 活动态字体色必须真正生效：`text-primary` 与 `text-toned` 不能同时在
    // 同一元素上（同似性下 `text-toned` 在样式表后置会覆盖 `text-primary`，
    // 导致当前页图标不高亮）。活动项只挂 primary，非活动项只挂 toned。
    expect(homeItem.classes()).toContain('text-primary')
    expect(homeItem.classes()).not.toContain('text-toned')

    const competitionsItem = bottomNav.get('a[href="/competitions"]')
    expect(competitionsItem.attributes('aria-current')).toBeUndefined()
    expect(competitionsItem.classes()).toContain('text-toned')
    expect(competitionsItem.classes()).not.toContain('text-primary')
  })

  it('手机端详情页隐藏底部导航并展示返回头部', async () => {
    setViewportWidth(390)
    const { wrapper } = await mountAt('/qa')

    expect(wrapper.find('[aria-label="底部主导航"]').exists()).toBe(false)
    expect(wrapper.get('button[aria-label="返回"]')).toBeTruthy()
  })

  it.each([
    ['/competitions/mcm-2026', '竞赛详情'],
    ['/organizations/ai-union', '组织详情'],
    ['/activities/ai-sharing-4', '活动详情']
  ])('手机端详情 %s 顶部为居中标题返回头（%s），而非完整桌面栏', async (path, title) => {
    setViewportWidth(390)
    const { wrapper } = await mountAt(path)

    const header = wrapper.get('header')
    expect(header.attributes('role')).toBe('banner')
    expect(header.text()).toContain(title)
    // 返回头不应出现桌面主导航 / 用户菜单 / 外观切换
    expect(wrapper.find('[aria-label="主导航"]').exists()).toBe(false)
    expect(wrapper.find('button[aria-label="打开用户菜单"]').exists()).toBe(false)
    expect(wrapper.find('button[aria-label="切换外观"]').exists()).toBe(false)
    // 详情页隐藏底部主导航
    expect(wrapper.find('[aria-label="底部主导航"]').exists()).toBe(false)
  })

  it('手机端组织列表使用详情返回头（与详情一致），隐藏底部导航', async () => {
    setViewportWidth(390)
    const { wrapper } = await mountAt('/organizations')

    const header = wrapper.get('header')
    expect(header.attributes('role')).toBe('banner')
    expect(header.text()).toContain('社团与组织')
    // 详情壳不应包含桌面主导航 / 用户菜单 / 外观切换
    expect(wrapper.find('[aria-label="主导航"]').exists()).toBe(false)
    expect(wrapper.find('button[aria-label="打开用户菜单"]').exists()).toBe(false)
    expect(wrapper.find('button[aria-label="切换外观"]').exists()).toBe(false)
    // 详情壳：展示返回按钮，隐藏底部主导航（与 /qa 详情一致）
    expect(wrapper.get('button[aria-label="返回"]')).toBeTruthy()
    expect(wrapper.find('[aria-label="底部主导航"]').exists()).toBe(false)
  })

  it('在 Footer 中提供平台说明入口', async () => {
    const { wrapper } = await mountAt('/')
    const footer = wrapper.get('footer')

    expect(footer.text()).toContain('© 2026 SIT 人工智能学院·科创与就业服务平台')
    expect(footer.text()).toContain('关于我们')
    expect(footer.text()).toContain('联系我们')
    expect(footer.text()).toContain('使用帮助')
    expect(footer.text()).toContain('隐私政策')
    expect(footer.text()).toContain('服务条款')
    // 页脚项应为可点击的 RouterLink
    expect(footer.find('a[href="/docs/privacy"]').exists()).toBe(true)
    expect(footer.find('a[href="/docs/terms"]').exists()).toBe(true)
  })
})
