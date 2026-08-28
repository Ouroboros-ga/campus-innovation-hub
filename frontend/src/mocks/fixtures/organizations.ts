/**
 * 组织列表页开发 Fixtures（Mock-First 开发脚手架）
 *
 * 位置：src/mocks/fixtures/（FrontendImplementationPlan.md FE-005 规则）
 *
 * 规则（database-design.md / FE-005）：
 * - 日期一律 ISO 8601（+08:00）；
 * - 招新状态（招新中/即将招新/暂停招新/不招新）由 publication_state 与报名窗口
 *   在运行时派生，不在此处存放展示文本；
 * - 不虚构浏览量 / 热度等官方统计；这是开发脚手架，不是生产事实。
 *
 * 覆盖维度：
 * - 类型：COLLEGE_DEPARTMENT / STUDENT_CLUB / LABORATORY / INNOVATION_TEAM / OTHER
 * - 招新状态：RECRUITING / UPCOMING / PAUSED / NOT_RECRUITING
 * - 我的组织：LEADER（会长）/ MEMBER（成员）
 */

import type {
  MyOrganization,
  OrganizationDetail,
  OrganizationSummary,
  RecruitmentDetail
} from '@/features/organizations/types'

const logo = (alt: string) => ({ alt, src: null })

export const organizations: OrganizationSummary[] = [
  {
    id: 'ai-union',
    name: '人工智能协会',
    type: 'STUDENT_CLUB',
    description: '共建 AI 前沿技术，分享交流成长，探索智能的无限可能。',
    logo: logo('人工智能协会 logo'),
    recruitment: {
      id: 'ai-union-fall-2026',
      title: '人工智能协会 2026 秋季招新',
      applyStartAt: '2026-08-20T00:00:00+08:00',
      applyEndAt: '2026-09-05T23:59:59+08:00',
      publicationState: 'PUBLISHED'
    },
    detailPath: '/organizations/ai-union',
    recruitmentPath: '/organizations/ai-union/recruitments/ai-union-fall-2026'
  },
  {
    id: 'data-science-club',
    name: '数据科学社',
    type: 'STUDENT_CLUB',
    description: '数据驱动未来，让数据创造价值。学习数据分析与挖掘，实践应用。',
    logo: logo('数据科学社 logo'),
    recruitment: {
      id: 'data-science-fall-2026',
      title: '数据科学社 2026 秋季招新',
      applyStartAt: '2026-08-20T00:00:00+08:00',
      applyEndAt: '2026-09-06T23:59:59+08:00',
      publicationState: 'PUBLISHED'
    },
    detailPath: '/organizations/data-science-club',
    recruitmentPath: '/organizations/data-science-club/recruitments/data-science-fall-2026'
  },
  {
    id: 'robot-lab',
    name: '机器人创新实验室',
    type: 'LABORATORY',
    description: '专注机器人研发与实践，推动智能硬件创新，探索技术落地应用。',
    logo: logo('机器人创新实验室 logo'),
    recruitment: {
      id: 'robot-lab-fall-2026',
      title: '机器人创新实验室 2026 招新',
      applyStartAt: '2026-09-01T00:00:00+08:00',
      applyEndAt: '2026-09-20T23:59:59+08:00',
      publicationState: 'PUBLISHED'
    },
    detailPath: '/organizations/robot-lab',
    recruitmentPath: '/organizations/robot-lab/recruitments/robot-lab-fall-2026'
  },
  {
    id: 'innovation-center',
    name: '创新创业中心',
    type: 'INNOVATION_TEAM',
    description: '激发创新思维，孵化创业项目，链接资源，助力梦想起航。',
    logo: logo('创新创业中心 logo'),
    recruitment: {
      id: 'innovation-center-fall-2026',
      title: '创新创业中心 2026 招新',
      applyStartAt: '2026-08-22T00:00:00+08:00',
      applyEndAt: '2026-09-08T23:59:59+08:00',
      publicationState: 'PUBLISHED'
    },
    detailPath: '/organizations/innovation-center',
    recruitmentPath: '/organizations/innovation-center/recruitments/innovation-center-fall-2026'
  },
  {
    id: 'sci-employment',
    name: '科创与就业部',
    type: 'COLLEGE_DEPARTMENT',
    description: '服务同学科创与就业发展，组织活动与资源对接，助力成长成才。',
    logo: logo('科创与就业部 logo'),
    recruitment: {
      id: 'sci-employment-fall-2026',
      title: '科创与就业部 2026 招新',
      applyStartAt: '2026-08-22T00:00:00+08:00',
      applyEndAt: '2026-09-06T23:59:59+08:00',
      publicationState: 'PUBLISHED'
    },
    detailPath: '/organizations/sci-employment',
    recruitmentPath: '/organizations/sci-employment/recruitments/sci-employment-fall-2026'
  },
  {
    id: 'green-public',
    name: '绿色公益社',
    type: 'STUDENT_CLUB',
    description: '践行绿色理念，参与公益实践，传递温暖，守护美好校园。',
    logo: logo('绿色公益社 logo'),
    recruitment: {
      id: 'green-public-fall-2026',
      title: '绿色公益社 2026 招新',
      applyStartAt: '2026-09-02T00:00:00+08:00',
      applyEndAt: '2026-09-18T23:59:59+08:00',
      publicationState: 'PUBLISHED'
    },
    detailPath: '/organizations/green-public',
    recruitmentPath: '/organizations/green-public/recruitments/green-public-fall-2026'
  },
  {
    id: 'light-workshop',
    name: '光影工作室',
    type: 'STUDENT_CLUB',
    description: '用镜头记录精彩，用影像表达创意，分享摄影与视频创作。',
    logo: logo('光影工作室 logo'),
    recruitment: {
      id: 'light-workshop-fall-2026',
      title: '光影工作室 2026 招新',
      applyStartAt: '2026-08-20T00:00:00+08:00',
      applyEndAt: '2026-09-05T23:59:59+08:00',
      publicationState: 'CANCELLED'
    },
    detailPath: '/organizations/light-workshop',
    recruitmentPath: null
  },
  {
    id: 'academic-forum',
    name: '学术研讨会',
    type: 'STUDENT_CLUB',
    description: '聚焦学术前沿，举办主题研讨，拓展视野，提升研究能力。',
    logo: logo('学术研讨会 logo'),
    recruitment: null,
    detailPath: '/organizations/academic-forum',
    recruitmentPath: null
  }
]

/** 登录态「我的组织」（mock 当前用户：会长 + 成员；6 项以覆盖「查看全部 / 收起」）。 */
export const myOrganizations: MyOrganization[] = [
  {
    organization: organizations[0]!,
    membership: 'LEADER',
    roleLabel: '会长'
  },
  {
    organization: organizations[1]!,
    membership: 'MEMBER',
    roleLabel: '成员'
  },
  {
    organization: organizations[2]!,
    membership: 'LEADER',
    roleLabel: '实验室负责人'
  },
  {
    organization: organizations[3]!,
    membership: 'MEMBER',
    roleLabel: '成员'
  },
  {
    organization: organizations[4]!,
    membership: 'LEADER',
    roleLabel: '部长'
  },
  {
    organization: organizations[5]!,
    membership: 'MEMBER',
    roleLabel: '成员'
  }
]

// ---------------------------------------------------------------------------
// 组织详情 / 招新详情（FE-041 / FE-042）
// ---------------------------------------------------------------------------
// 设计来源：PageMap §组织主页 / §招新详情 / §招新申请；database-design.md §10 / §11。
// 近期活动链接到真实 `activities` fixture 的详情路径；招新详情复用列表中的 recruitment id。

const aiUnionRecruitment = organizations[0]!.recruitment!

export const organizationDetails: OrganizationDetail[] = [
  {
    ...organizations[0]!,
    descriptionMd:
      '人工智能协会是面向全校的人工智能技术社群。我们组织 AI 前沿讲座、动手工作坊与项目实战，帮助成员建立从理论到落地的完整认知。',
    direction: '机器学习 / 计算机视觉 / 自然语言处理 / AI 产品与工程',
    foundedAt: '2018-09-01T00:00:00+08:00',
    memberCount: 286,
    college: '人工智能学院',
    advisors: [{ membershipId: 'adv-1', userId: 'teacher-wang', publicName: '王丽华', displayName: '王丽华', avatar: null, department: '人工智能学院', academicTitle: '教授', publicEmail: 'wanglihua@ai.edu.cn', officeLocation: '科研楼 210', researchInterests: ['机器学习', '自然语言处理'], title: '指导老师' }],
    leaders: [],
    currentUserOrganizationRole: null,
    canManage: null,
    isLeader: null,
    leaderName: '张同学',
    leaderTitle: '会长',
    leaderGrade: '2023级',
    contactEmail: 'ai.association@ai.edu.cn',
    contactPhone: '010-1234 5678',
    contactAddress: '科技楼 3 楼 AI 协会办公室',
    wechatName: 'AI 人工智能协会',
    publicContact: 'ai-union@example.edu.cn',
    qqGroupNumber: '876543210',
    qqGroupQr: { alt: '人工智能协会招新 QQ 群二维码', src: null },
    qqGroupJoinUrl: 'https://qm.qq.com/q/876543210',
    allowOnlineApplication: true,
    relatedLinks: [
      { label: '全国大学生人工智能创新挑战赛', url: '/competitions/ai-innovation-2026', type: 'competition' },
      { label: '蓝桥杯全国软件和信息技术专业人才大赛', url: '/competitions/lanqiao-2026', type: 'competition' },
    ],
    recentActivities: [
      {
        id: 'ai-sharing-4',
        title: '大模型应用实战分享会',
        startAt: '2026-08-24T19:00:00+08:00',
        detailPath: '/activities/ai-sharing-4'
      },
      {
        id: 'spring-innovation-salon',
        title: 'AI 创新沙龙：从论文到原型',
        startAt: '2026-09-12T14:00:00+08:00',
        detailPath: '/activities/spring-innovation-salon'
      }
    ],
    currentRecruitments: [aiUnionRecruitment]
  },
  {
    ...organizations[1]!,
    descriptionMd:
      '数据科学社聚焦数据分析、统计建模与数据可视化，定期开展案例研读、工具工作坊与竞赛组队。',
    direction: '数据分析 / 统计建模 / 机器学习 / 数据可视化',
    foundedAt: '2019-03-01T00:00:00+08:00',
    memberCount: 120,
    college: '人工智能学院',
    advisors: [{ membershipId: 'adv-2', userId: 'teacher-li', publicName: '李明', displayName: '李明', avatar: null, department: '人工智能学院', academicTitle: '副教授', publicEmail: 'liming@ai.edu.cn', officeLocation: '科研楼 205', researchInterests: ['数据挖掘', '统计分析'], title: '指导老师' }],
    leaders: [],
    currentUserOrganizationRole: null,
    canManage: null,
    isLeader: null,
    leaderName: '赵同学',
    leaderTitle: '社长',
    leaderGrade: '2023级',
    contactEmail: 'ds.club@ai.edu.cn',
    contactPhone: '010-2345 6789',
    contactAddress: '图书馆 4 楼数据科学中心',
    wechatName: 'AI 数据科学社',
    publicContact: 'ds-club@example.edu.cn',
    qqGroupNumber: '234567890',
    qqGroupQr: { alt: '数据科学社招新 QQ 群二维码', src: null },
    qqGroupJoinUrl: null,
    allowOnlineApplication: true,
    relatedLinks: [
      { label: '全国大学生数学建模竞赛', url: '/competitions/mcm-2026', type: 'competition' },
      { label: '中国大学生计算机设计大赛', url: '/competitions/csdc-2026', type: 'competition' },
    ],
    recentActivities: [
      {
        id: 'python-training',
        title: 'Python 数据分析入门训练营',
        startAt: '2026-08-30T15:00:00+08:00',
        detailPath: '/activities/python-training'
      }
    ],
    currentRecruitments: [organizations[1]!.recruitment!]
  },
  {
    ...organizations[2]!,
    descriptionMd:
      '机器人创新实验室面向对机器人、嵌入式与智能硬件感兴趣的同学，提供开发板、机械结构与算法调优的实践环境。',
    direction: 'ROS / 嵌入式开发 / 机械结构 / 传感器融合',
    foundedAt: '2016-09-01T00:00:00+08:00',
    memberCount: 45,
    college: '人工智能学院',
    advisors: [{ membershipId: 'adv-3', userId: 'teacher-chen', publicName: '陈志强', displayName: '陈志强', avatar: null, department: '人工智能学院', academicTitle: '教授', publicEmail: 'chenzhiqiang@ai.edu.cn', officeLocation: '科研楼 220', researchInterests: ['机器人学', '嵌入式系统'], title: '指导老师' }],
    leaders: [],
    currentUserOrganizationRole: null,
    canManage: null,
    isLeader: null,
    leaderName: '周同学',
    leaderTitle: '实验室负责人',
    leaderGrade: '2022级',
    contactEmail: 'robot.lab@ai.edu.cn',
    contactPhone: '010-3456 7890',
    contactAddress: '科研楼 2 楼 220 室',
    wechatName: null,
    publicContact: null,
    qqGroupNumber: '345678901',
    qqGroupQr: { alt: '机器人实验室招新 QQ 群二维码', src: null },
    qqGroupJoinUrl: null,
    allowOnlineApplication: false,
    relatedLinks: [
      { label: '中国机器人大赛', url: '/competitions/robot-cup-2026', type: 'competition' },
      { label: '全国大学生电子设计竞赛', url: '/competitions/electronics-design-2026', type: 'competition' },
    ],
    recentActivities: [
      {
        id: 'research-training-camp',
        title: '机器人基础研发训练营',
        startAt: '2026-09-19T09:00:00+08:00',
        detailPath: '/activities/research-training-camp'
      }
    ],
    currentRecruitments: [organizations[2]!.recruitment!]
  },
  {
    ...organizations[3]!,
    descriptionMd:
      '创新创业中心孵化校园创业项目，组织路演、商业计划辅导与资源对接，支持从 idea 到落地的全过程。',
    direction: '创业孵化 / 商业计划 / 产品设计 / 项目路演',
    foundedAt: '2020-03-01T00:00:00+08:00',
    memberCount: 58,
    college: '人工智能学院',
    advisors: [{ membershipId: 'adv-4', userId: 'teacher-liu', publicName: '刘敏', displayName: '刘敏', avatar: null, department: '创业学院', academicTitle: '副教授', publicEmail: 'liumin@ai.edu.cn', officeLocation: '创客空间 2 楼', researchInterests: ['创业管理', '商业模式'], title: '指导老师' }],
    leaders: [],
    currentUserOrganizationRole: null,
    canManage: null,
    isLeader: null,
    leaderName: '王同学',
    leaderTitle: '中心主任',
    leaderGrade: '2022级',
    contactEmail: 'innovation.center@ai.edu.cn',
    contactPhone: '010-4567 8901',
    contactAddress: '创客空间 1 层',
    wechatName: 'AI 创新创业中心',
    publicContact: 'innovation-center@example.edu.cn',
    qqGroupNumber: '567890123',
    qqGroupQr: { alt: '创新创业中心招新 QQ 群二维码', src: null },
    qqGroupJoinUrl: null,
    allowOnlineApplication: true,
    relatedLinks: [
      { label: '「挑战杯」全国大学生课外学术科技作品竞赛', url: '/competitions/challenge-cup-2026', type: 'competition' },
      { label: '大学生创新创业训练计划', url: '/competitions/innovation-training-2026', type: 'competition' },
    ],
    recentActivities: [
      {
        id: 'enterprise-visit-fall-2026',
        title: '秋季企业参访：走进科技园区',
        startAt: '2026-09-03T13:00:00+08:00',
        detailPath: '/activities/enterprise-visit-fall-2026'
      }
    ],
    currentRecruitments: [organizations[3]!.recruitment!]
  },
  {
    ...organizations[4]!,
    descriptionMd:
      '科创与就业部服务全院同学的科创竞赛与就业发展，负责竞赛资讯、求职讲座与资源对接。',
    direction: '竞赛服务 / 就业指导 / 校企对接 / 生涯规划',
    foundedAt: '2015-09-01T00:00:00+08:00',
    memberCount: 60,
    college: '人工智能学院',
    advisors: [{ membershipId: 'adv-5', userId: 'teacher-sun', publicName: '孙老师', displayName: '孙老师', avatar: null, department: '教学科研办', academicTitle: '讲师', publicEmail: 'sun@ai.edu.cn', officeLocation: '行政楼 106', researchInterests: ['学生科创与就业服务'], title: '指导老师' }],
    leaders: [],
    currentUserOrganizationRole: null,
    canManage: null,
    isLeader: null,
    leaderName: '李同学',
    leaderTitle: '部长',
    leaderGrade: '2023级',
    contactEmail: 'sci.career@ai.edu.cn',
    contactPhone: '010-5678 9012',
    contactAddress: '行政楼 106 室',
    wechatName: null,
    publicContact: 'sci-career@example.edu.cn',
    qqGroupNumber: '112233445',
    qqGroupQr: { alt: '科创与就业部招新 QQ 群二维码', src: null },
    qqGroupJoinUrl: 'https://qm.qq.com/q/112233445',
    allowOnlineApplication: true,
    relatedLinks: [
      { label: '全国大学生数学建模竞赛', url: '/competitions/mcm-2026', type: 'competition' },
      { label: '校内程序设计竞赛', url: '/competitions/school-programming-2026', type: 'competition' },
    ],
    recentActivities: [
      {
        id: 'mcm-briefing-2026',
        title: '2026 数模竞赛宣讲会',
        startAt: '2026-08-22T19:00:00+08:00',
        detailPath: '/activities/mcm-briefing-2026'
      }
    ],
    currentRecruitments: [organizations[4]!.recruitment!]
  },
  {
    ...organizations[5]!,
    descriptionMd:
      '绿色公益社倡导绿色生活与公益实践，组织环保行动、志愿服务与公益传播，传递温暖共建美好校园。',
    direction: '环保行动 / 志愿服务 / 公益传播',
    foundedAt: '2021-09-01T00:00:00+08:00',
    memberCount: 90,
    college: '人工智能学院',
    advisors: [{ membershipId: 'adv-6', userId: 'teacher-he', publicName: '何芳', displayName: '何芳', avatar: null, department: '人工智能学院', academicTitle: '副教授', publicEmail: 'hefang@ai.edu.cn', officeLocation: '学活 303', researchInterests: ['环境教育', '公益实践'], title: '指导老师' }],
    leaders: [],
    currentUserOrganizationRole: null,
    canManage: null,
    isLeader: null,
    leaderName: '刘同学',
    leaderTitle: '社长',
    leaderGrade: '2023级',
    contactEmail: 'green.public@ai.edu.cn',
    contactPhone: '010-6789 0123',
    contactAddress: '大学生活动中心 303 室',
    wechatName: '绿色公益社',
    publicContact: 'green-public@example.edu.cn',
    qqGroupNumber: '678901234',
    qqGroupQr: { alt: '绿色公益社招新 QQ 群二维码', src: null },
    qqGroupJoinUrl: null,
    allowOnlineApplication: false,
    relatedLinks: [],
    recentActivities: [
      {
        id: 'further-study-sharing',
        title: '升学与职业规划分享会',
        startAt: '2026-09-15T16:00:00+08:00',
        detailPath: '/activities/further-study-sharing'
      }
    ],
    currentRecruitments: [organizations[5]!.recruitment!]
  },
  {
    ...organizations[6]!,
    descriptionMd:
      '光影工作室专注摄影与影像创作，提供设备共享、拍摄实践与后期工作坊，记录校园的美好瞬间。',
    direction: '摄影 / 短片创作 / 后期剪辑',
    foundedAt: '2017-03-01T00:00:00+08:00',
    memberCount: 35,
    college: '人工智能学院',
    advisors: [{ membershipId: 'adv-7', userId: 'teacher-wu', publicName: '吴晋', displayName: '吴晋', avatar: null, department: null, academicTitle: null, publicEmail: null, officeLocation: null, researchInterests: [], title: '指导老师' }],
    leaders: [],
    currentUserOrganizationRole: null,
    canManage: null,
    isLeader: null,
    leaderName: '郑同学',
    leaderTitle: '工作室主理人',
    leaderGrade: '2022级',
    contactEmail: null,
    contactPhone: null,
    contactAddress: null,
    wechatName: null,
    publicContact: null,
    qqGroupNumber: null,
    qqGroupQr: null,
    qqGroupJoinUrl: null,
    allowOnlineApplication: true,
    relatedLinks: [],
    recentActivities: [],
    currentRecruitments: []
  },
  {
    ...organizations[7]!,
    descriptionMd:
      '学术研讨会组织主题研讨与论文共读，帮助同学拓展学术视野、提升研究能力。',
    direction: '论文共读 / 主题研讨 / 学术写作',
    foundedAt: null,
    memberCount: null,
    college: '人工智能学院',
    advisors: [],
    leaders: [],
    currentUserOrganizationRole: null,
    canManage: null,
    isLeader: null,
    leaderName: '陈同学',
    leaderTitle: '召集人',
    leaderGrade: null,
    contactEmail: null,
    contactPhone: null,
    contactAddress: null,
    wechatName: null,
    publicContact: null,
    qqGroupNumber: null,
    qqGroupQr: null,
    qqGroupJoinUrl: null,
    allowOnlineApplication: false,
    relatedLinks: [],
    recentActivities: [],
    currentRecruitments: []
  }
]

export const recruitmentDetails: RecruitmentDetail[] = [
  {
    id: 'ai-union-fall-2026',
    organization: {
      id: organizations[0]!.id,
      name: organizations[0]!.name,
      type: organizations[0]!.type,
      detailPath: organizations[0]!.detailPath,
      logo: organizations[0]!.logo
    },
    title: '人工智能协会 2026 秋季招新',
    introMd:
      '无论你是 AI 新手还是已有项目经验，只要对人工智能技术充满热情，都欢迎加入。我们看重好奇心与学习意愿。',
    applyStartAt: '2026-08-20T00:00:00+08:00',
    applyEndAt: '2026-09-05T23:59:59+08:00',
    publicationState: 'PUBLISHED',
    completedAt: null,
    targetGradeMin: 1,
    targetGradeMax: 4,
    notesMd: '面试安排在 9 月上旬，具体时间将通过邮件通知。',
    qqGroupNumber: '876543210',
    qqGroupQr: { alt: '人工智能协会 2026 秋季招新 QQ 群二维码', src: null },
    qqGroupJoinUrl: 'https://qm.qq.com/q/876543210',
    enableOnlineApplication: true,
    organizationAllowOnlineApplication: true,
    positions: [
      {
        id: 'ai-union-ml',
        name: '机器学习方向',
        headcount: 12,
        description: '参与机器学习模型开发与论文复现。',
        requirements: '熟悉 Python，了解一种深度学习框架。'
      },
      {
        id: 'ai-union-cv',
        name: '计算机视觉方向',
        headcount: 8,
        description: '围绕视觉检测与识别进行项目实践。',
        requirements: '有图像处理基础，可参与数据集构建。'
      },
      {
        id: 'ai-union-product',
        name: 'AI 产品与运营',
        headcount: 5,
        description: '负责社群活动策划与 AI 产品体验设计。',
        requirements: '沟通能力强，有活动组织经验者优先。'
      }
    ]
  },
  {
    id: 'data-science-fall-2026',
    organization: {
      id: organizations[1]!.id,
      name: organizations[1]!.name,
      type: organizations[1]!.type,
      detailPath: organizations[1]!.detailPath,
      logo: organizations[1]!.logo
    },
    title: '数据科学社 2026 秋季招新',
    introMd: '如果你对用数据讲故事感兴趣，欢迎加入数据科学社，一起做有趣的案例与竞赛。',
    applyStartAt: '2026-08-20T00:00:00+08:00',
    applyEndAt: '2026-09-06T23:59:59+08:00',
    publicationState: 'PUBLISHED',
    completedAt: null,
    targetGradeMin: 1,
    targetGradeMax: 4,
    notesMd: null,
    qqGroupNumber: '234567890',
    qqGroupQr: { alt: '数据科学社招新 QQ 群二维码', src: null },
    qqGroupJoinUrl: null,
    enableOnlineApplication: true,
    organizationAllowOnlineApplication: true,
    positions: [
      {
        id: 'ds-analysis',
        name: '数据分析',
        headcount: 10,
        description: '负责数据采集、清洗与探索性分析。',
        requirements: '会使用 Python 或 SQL。'
      },
      {
        id: 'ds-viz',
        name: '可视化',
        headcount: 6,
        description: '制作数据图表与可视化作品。',
        requirements: '有审美好，熟悉至少一种可视化工具。'
      }
    ]
  },
  {
    id: 'robot-lab-fall-2026',
    organization: {
      id: organizations[2]!.id,
      name: organizations[2]!.name,
      type: organizations[2]!.type,
      detailPath: organizations[2]!.detailPath,
      logo: organizations[2]!.logo
    },
    title: '机器人创新实验室 2026 招新',
    introMd: '欢迎对机器人、嵌入式与智能硬件有热情的同学加入，一起动手做实物。',
    applyStartAt: '2026-09-01T00:00:00+08:00',
    applyEndAt: '2026-09-20T23:59:59+08:00',
    publicationState: 'PUBLISHED',
    completedAt: null,
    targetGradeMin: 2,
    targetGradeMax: 4,
    notesMd: '实验室将提供开发板与机械结构材料。',
    qqGroupNumber: '345678901',
    qqGroupQr: { alt: '机器人实验室招新 QQ 群二维码', src: null },
    qqGroupJoinUrl: null,
    enableOnlineApplication: false,
    organizationAllowOnlineApplication: false,
    positions: [
      {
        id: 'robot-embedded',
        name: '嵌入式开发',
        headcount: 6,
        description: '负责单片机与传感器控制开发。',
        requirements: '了解 C 语言与基本电路。'
      },
      {
        id: 'robot-mech',
        name: '机械结构',
        headcount: 4,
        description: '设计并搭建机器人机械结构。',
        requirements: '会使用三维建模软件。'
      }
    ]
  },
  {
    id: 'innovation-center-fall-2026',
    organization: {
      id: organizations[3]!.id,
      name: organizations[3]!.name,
      type: organizations[3]!.type,
      detailPath: organizations[3]!.detailPath,
      logo: organizations[3]!.logo
    },
    title: '创新创业中心 2026 招新',
    introMd: '无论你已有创业想法，还是想学习产品与商业知识，创新创业中心都欢迎你。',
    applyStartAt: '2026-08-22T00:00:00+08:00',
    applyEndAt: '2026-09-08T23:59:59+08:00',
    publicationState: 'PUBLISHED',
    completedAt: null,
    targetGradeMin: 1,
    targetGradeMax: 4,
    notesMd: '鼓励携带想法或已有项目加入。',
    qqGroupNumber: '567890123',
    qqGroupQr: { alt: '创新创业中心招新 QQ 群二维码', src: null },
    qqGroupJoinUrl: null,
    enableOnlineApplication: true,
    organizationAllowOnlineApplication: true,
    positions: [
      {
        id: 'innovation-product',
        name: '产品与运营',
        headcount: 8,
        description: '负责产品原型设计与项目运营。',
        requirements: '逻辑清晰，乐于沟通。'
      },
      {
        id: 'innovation-tech',
        name: '技术研发',
        headcount: 6,
        description: '参与创业项目技术实现。',
        requirements: '有一门擅长的编程语言。'
      }
    ]
  },
  {
    id: 'sci-employment-fall-2026',
    organization: {
      id: organizations[4]!.id,
      name: organizations[4]!.name,
      type: organizations[4]!.type,
      detailPath: organizations[4]!.detailPath,
      logo: organizations[4]!.logo
    },
    title: '科创与就业部 2026 招新',
    introMd: '加入科创与就业部，一起为同学们提供竞赛与就业服务。',
    applyStartAt: '2026-08-22T00:00:00+08:00',
    applyEndAt: '2026-09-06T23:59:59+08:00',
    publicationState: 'PUBLISHED',
    completedAt: null,
    targetGradeMin: 1,
    targetGradeMax: 4,
    notesMd: null,
    qqGroupNumber: '112233445',
    qqGroupQr: { alt: '科创与就业部招新 QQ 群二维码', src: null },
    qqGroupJoinUrl: 'https://qm.qq.com/q/112233445',
    enableOnlineApplication: true,
    organizationAllowOnlineApplication: true,
    positions: [
      {
        id: 'sci-service',
        name: '竞赛服务',
        headcount: 6,
        description: '负责竞赛信息整理与答疑。',
        requirements: '细心耐心，熟悉校园竞赛者优先。'
      },
      {
        id: 'sci-career',
        name: '就业服务',
        headcount: 6,
        description: '组织求职讲座与企业对接。',
        requirements: '具备一定沟通与组织能力。'
      }
    ]
  },
  {
    id: 'green-public-fall-2026',
    organization: {
      id: organizations[5]!.id,
      name: organizations[5]!.name,
      type: organizations[5]!.type,
      detailPath: organizations[5]!.detailPath,
      logo: organizations[5]!.logo
    },
    title: '绿色公益社 2026 招新',
    introMd: '期待热心公益、热爱生活的你，一起参与绿色行动与志愿服务。',
    applyStartAt: '2026-09-02T00:00:00+08:00',
    applyEndAt: '2026-09-18T23:59:59+08:00',
    publicationState: 'PUBLISHED',
    completedAt: null,
    targetGradeMin: 1,
    targetGradeMax: 4,
    notesMd: '具体活动时间将在加入后通知。',
    qqGroupNumber: '678901234',
    qqGroupQr: { alt: '绿色公益社招新 QQ 群二维码', src: null },
    qqGroupJoinUrl: null,
    enableOnlineApplication: false,
    organizationAllowOnlineApplication: false,
    positions: [
      {
        id: 'green-action',
        name: '公益活动策划',
        headcount: 8,
        description: '策划并组织环保与公益行动。',
        requirements: '有责任心，乐于团队协作。'
      }
    ]
  }
]
