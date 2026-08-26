/**
 * 组队广场开发 Fixtures（Mock-First）— FE-030
 *
 * 规则（database-design.md §1.3 / §36 / FE-005）：
 * - 日期一律使用 ISO 8601 字符串（+08:00）；
 * - 不存放可推导的展示文本（状态由稳定枚举承载）；
 * - 不虚构浏览量 / 热度等官方统计（§28）；
 * - 这是开发脚手架，不是生产事实，不作为真实官方数据展示。
 *
 * 覆盖维度（便于演示筛选 / 分页 / 本人操作）：
 * - 信息类型：队伍找人 / 个人找队；
 * - 状态：招募中 / 已满 / 已关闭；
 * - 关联竞赛：多场不同赛事；
 * - 本人发布：2 条（展示「我发布的」与编辑 / 关闭）。
 */

import type { TeamPost, TeamPostDetail } from '@/features/teams/types'

export const teamPosts: TeamPost[] = [
  {
    id: 'team-algo-01',
    title: '智能算法突破小队',
    postType: 'TEAM_RECRUITING',
    status: 'RECRUITING',
    competitionId: 'lanqiao',
    competitionName: '第十六届蓝桥杯大赛',
    baseMemberCount: 2,
    targetMemberCount: 5,
    roles: ['算法设计', '机器学习'],
    skills: ['Python', '机器学习', '算法设计'],
    goal: '目标冲击省赛一等奖，有算法基础的同学加入！',
    creatorName: '李同学',
    creatorGrade: '2024级',
    creatorMajor: '人工智能',
    isOwned: false,
    publishedAt: '2026-08-20T10:00:00+08:00',
    detailPath: '/teams/team-algo-01'
  },
  {
    id: 'team-viz-02',
    title: '可视化数据分析小队',
    postType: 'PERSON_LOOKING',
    status: 'RECRUITING',
    competitionId: 'iflytek',
    competitionName: '科大讯飞 AI 开发者大赛',
    baseMemberCount: 1,
    targetMemberCount: 3,
    roles: ['数据可视化', '报告撰写'],
    skills: ['Python', 'ECharts', '数据可视化'],
    goal: '擅长数据分析和可视化，希望找队友一起参赛！',
    creatorName: '王同学',
    creatorGrade: '2024级',
    creatorMajor: '统计学',
    isOwned: false,
    publishedAt: '2026-08-19T14:00:00+08:00',
    detailPath: '/teams/team-viz-02'
  },
  {
    id: 'team-aiapp-03',
    title: 'AI 创新应用探索队',
    postType: 'TEAM_RECRUITING',
    status: 'RECRUITING',
    competitionId: 'iflytek',
    competitionName: '科大讯飞 AI 开发者大赛',
    baseMemberCount: 3,
    targetMemberCount: 4,
    roles: ['产品设计', '算法实现'],
    skills: ['Python', 'TensorFlow', '产品设计'],
    goal: '寻找对 AI 应用开发感兴趣的同学，协作完成作品！',
    creatorName: '张同学',
    creatorGrade: '2023级',
    creatorMajor: '计算机科学与技术',
    isOwned: false,
    publishedAt: '2026-08-18T09:00:00+08:00',
    detailPath: '/teams/team-aiapp-03'
  },
  {
    id: 'team-math-04',
    title: '数学建模找队友（本科组）',
    postType: 'TEAM_RECRUITING',
    status: 'RECRUITING',
    competitionId: 'mcm',
    competitionName: '全国大学生数学建模竞赛',
    baseMemberCount: 1,
    targetMemberCount: 3,
    roles: ['建模手', '论文写作'],
    skills: ['Matlab', 'Python', 'LaTeX', '优化模型'],
    goal: '三天三夜全力以赴，冲全国一等奖！',
    creatorName: '赵同学',
    creatorGrade: '2022级',
    creatorMajor: '信息管理与信息系统',
    isOwned: false,
    publishedAt: '2026-08-17T08:30:00+08:00',
    detailPath: '/teams/team-math-04'
  },
  {
    id: 'team-soa-05',
    title: '服务外包创新创业大赛组',
    postType: 'TEAM_RECRUITING',
    status: 'RECRUITING',
    competitionId: 'csd',
    competitionName: '全国大学生服务外包创新创业大赛',
    baseMemberCount: 2,
    targetMemberCount: 5,
    roles: ['产品经理', '后端开发', 'UI/UX'],
    skills: ['Java', 'SpringBoot', 'Vue', 'MySQL'],
    goal: '以信息化服务解决实际场景痛点，打造可落地的创新方案，争取省一等奖及以上成绩。',
    creatorName: '李同学',
    creatorGrade: '2022级',
    creatorMajor: '计算机科学与技术',
    isOwned: false,
    publishedAt: '2026-08-16T11:00:00+08:00',
    detailPath: '/teams/team-soa-05'
  },
  {
    id: 'team-datachallenge-08',
    title: '数据分析挑战赛·求大佬带飞！',
    postType: 'PERSON_LOOKING',
    status: 'RECRUITING',
    competitionId: 'mcm',
    competitionName: '全国大学生数学建模竞赛',
    baseMemberCount: 1,
    targetMemberCount: 4,
    roles: ['建模手', '数据分析师'],
    skills: ['Python', 'Pandas', 'SQL', '可视化', '机器学习'],
    goal: '熟悉数据处理与建模，希望加入实力队伍，分工协作，冲击国奖！',
    creatorName: '王同学',
    creatorGrade: '2024级',
    creatorMajor: '会计学',
    isOwned: false,
    publishedAt: '2026-08-15T15:00:00+08:00',
    detailPath: '/teams/team-datachallenge-08'
  },
  {
    id: 'team-acm-06',
    title: 'ACM 新生训练队（长期招募）',
    postType: 'TEAM_RECRUITING',
    status: 'RECRUITING',
    competitionId: 'icpc',
    competitionName: 'ACM 国际大学生程序设计竞赛（区域赛）',
    baseMemberCount: 3,
    targetMemberCount: 5,
    roles: ['算法工程师', '代码实现'],
    skills: ['C++', 'STL', '算法', '数据结构'],
    goal: '以训练和比赛为目标，定期刷题与模拟赛，备战各类 ACM 区域赛。',
    creatorName: '张同学（我）',
    creatorGrade: '2022级',
    creatorMajor: '软件工程',
    isOwned: true,
    publishedAt: '2026-08-14T09:00:00+08:00',
    detailPath: '/teams/team-acm-06'
  },
  {
    id: 'team-bigdata-07',
    title: '数据可视化小队（可冲省赛）',
    postType: 'TEAM_RECRUITING',
    status: 'RECRUITING',
    competitionId: 'bigdata',
    competitionName: '大数据分析挑战赛',
    baseMemberCount: 2,
    targetMemberCount: 4,
    roles: ['数据可视化', '数据清洗', '报告撰写'],
    skills: ['ECharts', 'Python', 'SQL', 'Power BI'],
    goal: '以数据可视化为核心，产出高质量分析报告，争取进入省赛！',
    creatorName: '张同学（我）',
    creatorGrade: '2022级',
    creatorMajor: '软件工程',
    isOwned: true,
    publishedAt: '2026-08-13T10:30:00+08:00',
    detailPath: '/teams/team-bigdata-07'
  },
  {
    id: 'team-ai-workshop-09',
    title: 'AI 创新应用工作坊小队',
    postType: 'PERSON_LOOKING',
    status: 'FULL',
    competitionId: 'ai-workshop',
    competitionName: 'AI 创新应用工作坊',
    baseMemberCount: 3,
    targetMemberCount: 3,
    roles: ['算法实现', '前端开发'],
    skills: ['Python', 'TensorFlow', '大模型', 'Streamlit'],
    goal: '做一个有实用价值的 AI 小项目，希望找到志同道合的伙伴一起落地。',
    creatorName: '蔡同学',
    creatorGrade: '2023级',
    creatorMajor: '人工智能',
    isOwned: false,
    publishedAt: '2026-08-12T14:00:00+08:00',
    detailPath: '/teams/team-ai-workshop-09'
  },
  {
    id: 'team-closed-10',
    title: '大数据可视化项目（已结题）',
    postType: 'TEAM_RECRUITING',
    status: 'CLOSED',
    competitionId: 'bigdata',
    competitionName: '大数据分析挑战赛',
    baseMemberCount: 4,
    targetMemberCount: 4,
    roles: ['数据清洗'],
    skills: ['SQL', 'Python'],
    goal: '项目已结题，感谢各位同学参与。',
    creatorName: '林同学',
    creatorGrade: '2023级',
    creatorMajor: '软件工程',
    isOwned: false,
    publishedAt: '2026-08-05T09:00:00+08:00',
    detailPath: '/teams/team-closed-10'
  }
]

/** 部分帖子的详情覆盖（更贴近真实示例）；其余用派生默认值。 */
const detailOverrides: Record<string, Partial<TeamPostDetail>> = {
  'team-algo-01': {
    direction: '蓝桥杯 / 智能算法赛项',
    currentMembers: '已有 2 名成员：1 人负责算法设计，1 人负责数据准备。',
    expectedEffort: '每周约 8 小时，赛前一周每晚进行模拟赛。',
    creatorBio: '人工智能学院 2024 级本科生，曾获校级算法竞赛二等奖。'
  },
  'team-acm-06': {
    direction: 'ACM 区域赛 / 数据结构与算法',
    currentMembers: '已有 3 名成员：2 人负责算法实现，1 人负责训练规划。',
    expectedEffort: '每周约 10 小时，周末集中进行模拟赛。',
    creatorBio: '软件工程 2022 级本科生，ICPC 校队成员。'
  },
  'team-bigdata-07': {
    direction: '大数据分析挑战赛 / 可视化与报告',
    currentMembers: '已有 2 名成员：1 人负责数据清洗，1 人负责可视化。',
    expectedEffort: '每周约 6 小时，冲刺期适当加班。',
    creatorBio: '软件工程 2022 级本科生，热爱数据可视化。'
  }
}

/** 按 id 索引的完整组队详情（FE-031）。 */
export const teamDetails: Record<string, TeamPostDetail> = {}
for (const post of teamPosts) {
  teamDetails[post.id] = {
    ...post,
    direction: `${post.competitionName} / ${post.roles.join('、')}`,
    currentMembers: `已有 ${post.baseMemberCount} 名成员，正在补充 ${post.targetMemberCount - post.baseMemberCount} 人。`,
    expectedEffort: '每周约 6–8 小时，赛前两周增加集中讨论。',
    intro: post.goal,
    creatorBio: null,
    ...(detailOverrides[post.id] ?? {})
  }
}
