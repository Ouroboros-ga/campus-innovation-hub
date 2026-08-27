# PageMap.md

> 产品：人工智能学院科创与就业服务平台  
> 文档版本：0.5
> 产品里程碑：V0.1  
> Locale：简体中文（zh-CN）  
> 用途：定义网站页面结构、主要区块、按钮、字段、页面操作与页面之间的跳转关系  
> 说明：本页面地图是产品结构来源，不是视觉设计规范；视觉、图标、暗色模式、动效与响应式实现以最新版 `FrontendDesign.md` 为准  
> 路由说明：本文记录目标页面结构；首个前端里程碑不要求一次性实现全部目标路由

---

# 全站页面树

```text
/
├── 首页
│
├── /competitions
│   ├── 竞赛列表
│   └── /competitions/:id
│       └── 竞赛详情
│
├── /teams
│   ├── 组队广场
│   ├── /teams/create
│   │   └── 发布组队
│   └── /teams/:id
│       └── 组队详情
│
├── /organizations
│   ├── 组织列表（登录且有身份时显示“我的组织”）
│   └── /organizations/:id
│       ├── 组织主页
│       └── /organizations/:id/recruitments/:recruitmentId
│           └── 招新详情
│
├── /activities
│   ├── 校园动态（全部 / 活动 / 公告）
│   ├── /activities/:id
│       └── 活动详情
│   └── /activities/announcements/:announcementId
│       └── 公告详情
│
├── /qa
│   ├── FAQ / 指南
│   ├── /qa/questions/:id
│   │   └── 问题详情
│   └── /qa/ask
│       └── 提交咨询
│
├── /search
│   └── 搜索结果（可选独立页）
│
├── /notifications
│   └── 消息中心
│
├── /me
│   ├── 个人中心概览
│   ├── /me/profile
│   ├── /me/follows
│   ├── /me/teams
│   ├── /me/applications
│   ├── /me/activities
│   ├── /me/questions
│   └── /me/settings
│
├── /manage/organizations/:organizationId
│   ├── 组织管理概览
│   ├── /profile
│   ├── /recruitments
│   └── /applications
│
└── /ops
    ├── 运营中心
    ├── /competitions
    ├── /activities（校园动态管理：活动 / 公告）
    ├── /questions
    ├── /guides
    └── 其余运营任务
```

系统级管理：

```text
Django Admin
```

不重复开发一套完整超级管理员前端。

---


# 全局外观与语言

## 产品语言

V0.1：

```text
简体中文（zh-CN）
```

不提供语言切换入口，不存在独立 Locale 页面。

---

## 主题切换

全局支持：

```text
浅色
暗色
跟随系统
```

入口必须全局可达，但不作为一级导航项。

推荐位置：

```text
Desktop：Header utility / 用户菜单
Mobile：导航 Drawer / 用户菜单
账号设置：可再次修改外观偏好
```

主题切换：

- 不要求登录
- 不改变业务数据
- 不改变页面功能
- 不改变状态语义
- 不建立独立路由

正式实现使用 Nuxt UI Color Mode 组件与共享 Token。

---

## 全局 UI 图标

PageMap 中出现的“搜索、通知、外链、返回、编辑、删除”等动作名称只描述行为，不代表使用文字字符或 emoji 实现图标。

正式 UI：

```text
Iconify + Lucide SVG
```

禁止：

```text
emoji 作为产品功能图标
Unicode 箭头代替通用图标
为常见动作手写 SVG path
```

---

# Mobile Web 页面壳

## Phone `<768px`

Phone 使用三种页面壳。

### Tab Shell

适用：

```text
/
 /competitions
 /teams
 /activities
 /me
```

结构：

```text
Compact Header
Content
Bottom Navigation
```

Bottom Navigation：

```text
首页
竞赛
组队
动态
我的
```

### Detail Shell

适用：

```text
/competitions/:id
/teams/:id
/organizations/:id
/organizations/:id/recruitments/:recruitmentId
/activities/:id
/activities/announcements/:announcementId
```

结构：

```text
Back Header
Content
Sticky Primary Action（如存在）
```

不显示全局 Bottom Navigation。

### Form / Task Shell

适用：

```text
/teams/create
/qa/ask
申请表单
资料编辑
组织管理编辑
```

结构：

```text
Back Header
Form / Task
Sticky Submit（如适合）
```

不显示全局 Bottom Navigation。

---

## Tablet `768–1023px`

```text
Compact Header
Drawer Navigation
Content
```

不使用 Phone Bottom Navigation。

---

## Desktop `>=1024px`

保持现有：

```text
Full Header
Top Primary Navigation
Content
```

---

## Phone Safe Area

Bottom Navigation 和 Sticky Action 必须考虑：

```text
env(safe-area-inset-bottom)
```

页面内容必须预留相应空间，不能被固定底栏遮挡。

---

# 全站 Header

所有学生端公开页面共享。

内容：

```text
Logo
平台名称

首页
竞赛
社团组织
组队广场
校园动态
咨询指南（Q&A）

搜索
消息
头像
```

未登录：

```text
登录
注册
```

登录后：

```text
搜索
消息
用户头像
```

头像菜单：

```text
个人中心
平台运营（是 OPERATOR 时）
退出登录
```

“我的组织”固定从 `/organizations` 的登录态上下文区块进入；LEADER / ADVISOR 也只能先选择自己有管理权限的具体组织，再进入该组织工作台，避免 Header 出现无作用域的“组织管理”入口。

Phone：

```text
页面 / 平台短标题
搜索
消息
头像（登录后）
```

Phone 一级导航不进入 Drawer，而使用底部五项导航。

Tablet：

```text
紧凑 Header
搜索
消息
头像
菜单
```

Tablet 主导航进入 Drawer。

---

# 全站搜索

触发：

```text
Header 搜索按钮
Ctrl + K
Cmd + K
```

搜索框 Placeholder：

```text
搜索竞赛、组织、组队、活动、FAQ……
```

类别：

```text
竞赛
组织
招新
组队
活动
FAQ
指南
通知
```

搜索结果行：

```text
标题
类型
少量上下文
```

操作：

```text
点击结果 -> 对应详情页
ESC -> 关闭
键盘上下 -> 选择
Enter -> 打开
```

---

# 首页 `/`

## 页面目标

用户 10 秒内能够判断：

```text
近期有什么重要机会？
什么快截止？
我可以去哪里找比赛 / 队友 / 组织 / 活动？
```

---

## Hero

左侧：

```text
主标题
简短说明
```

快捷入口：

```text
找竞赛
找队友
找组织
找活动
```

操作：

```text
找竞赛 -> /competitions
找队友 -> /teams
找组织 -> /organizations
找活动 -> /activities
```

---

## 校园轮播

每张：

```text
图片
可选类别
标题
一句说明
可选 CTA
```

轮播类型：

```text
重要竞赛
学院科创季
组织集中招新
重点活动
```

操作：

```text
上一张
下一张
分页点
点击 CTA
```

---

## 即将截止

卡片 / 列表字段：

```text
类型
名称
剩余时间
截止日期
```

类型：

```text
竞赛
活动
招新
```

点击：

```text
进入对应详情页
```

---

## 热门竞赛

每项：

```text
封面
竞赛名称
竞赛级别
个人 / 团队
状态
截止时间
官网 / 查看详情
```

按钮：

```text
查看详情
官网
查看全部
```

---

## 通知公告

列表：

```text
标题
日期
```

操作：

```text
点击 -> 公告详情 / 关联页面
查看全部 -> /activities?tab=announcements
```

---

## 热门指南

列表：

```text
标题
类型
更新日期 / 浏览信息（仅真实数据）
```

操作：

```text
点击 -> 指南详情
查看全部
```

---

## 正在组队

列表：

```text
标题
关联竞赛
人数
需要岗位
发布时间
```

操作：

```text
查看详情
查看全部
```

---

## 正在招新的组织

列表：

```text
组织名称
组织类型
招新状态
岗位概览
截止时间
```

操作：

```text
查看组织
查看招新
查看全部
```

---

## 近期活动

列表：

```text
活动名称
时间
地点
报名状态
```

操作：

```text
查看活动
查看全部 -> /activities?tab=activities
```

---

## 常见问题

列表：

```text
问题标题
```

操作：

```text
查看回答
进入 Q&A
```

---

## Phone 首页顺序

Phone 首页不直接复制 Desktop split hero。

顺序：

```text
Compact Header
搜索入口
精简 Hero
Quick Entry 2 x 2
即将截止
校园轮播 16:9
推荐竞赛
正在组队
正在招新的组织
近期活动
最新公告
指南 / FAQ
Minimal Footer
Bottom Navigation
```

Phone 端“即将截止”优先于大图轮播。

Hero 不占据大半首屏。

---

# 竞赛列表 `/competitions`

## 页面顶部

```text
H1：竞赛中心
说明
搜索框
```

筛选：

```text
状态
分类
个人 / 团队
```

状态：

```text
全部
报名中
即将开始
进行中
已结束
```

---

## 竞赛列表项

字段：

```text
封面
名称
级别
参赛形式
适合年级
主要方向
报名状态
截止时间
```

操作：

```text
查看详情
官网
关注（登录）
```

---

## 空状态

```text
没有找到符合条件的竞赛
[清除筛选]
```

---

# 竞赛详情 `/competitions/:id`

## 顶部信息

```text
名称
级别
个人 / 团队
状态
报名截止
剩余时间
```

按钮：

```text
关注 / 已关注
官方网站
报名方式
```

团队赛增加：

```text
查看组队
发布组队
```

---

## 基本信息

字段：

```text
参赛形式
适合年级
主要方向
学院是否组织
校内联系人
报名开始
报名截止
比赛时间
官网
```

---

## 比赛简介

正文。

---

## 谁适合参加

结构化提示：

```text
年级
基础要求
技能建议
是否需要团队
```

---

## 时间线

节点：

```text
日期
标题
说明
```

---

## 相关通知

列表。

---

## 相关指南

列表。

---

## 正在组队

展示 2–4 条。

按钮：

```text
查看全部组队
发布组队
```

---

# 组队广场 `/teams`

## 顶部

```text
H1：组队广场
说明
[发布组队]
```

未登录点发布：

```text
要求登录
```

---

## 筛选

```text
关联竞赛
信息类型
状态
```

类型：

```text
队伍找人
个人找队
```

状态：

```text
招募中
已组满
已关闭
```

---

## 组队列表项

```text
标题
关联竞赛
队伍 / 个人
当前人数 / 目标人数
招募岗位
技能
目标
发布时间
发布者
```

操作：

```text
查看详情
```

本人：

```text
编辑
关闭
```

---

# 发布组队 `/teams/create`

字段：

```text
关联竞赛
信息类型
标题
队伍名称
项目 / 方向
当前人数
目标人数
当前成员情况
招募岗位
技能要求
目标
预计投入
联系方式
其他说明
```

按钮：

```text
发布
取消
```

如果实现草稿：

```text
保存草稿
```

V0.1 可不做草稿。

---

# 组队详情 `/teams/:id`

展示：

```text
标题
关联竞赛
状态
项目方向
队伍人数
已有成员情况
正在招募
技能要求
预计投入
发布者公开资料
发布时间
```

主要按钮：

```text
申请加入
```

本人：

```text
编辑
查看申请
关闭招募
```

---

## 申请加入 Modal

字段：

```text
简单介绍
技能
相关经历
为什么想加入
每周投入
联系方式
```

按钮：

```text
提交申请
取消
```

提交成功：

```text
申请已提交
```

---

# 组织列表 `/organizations`

登录态上下文区块（仅有有效组织身份时显示，位于列表筛选之前）：

```text
H2：我的组织
组织名称
成员身份
职位名称
查看组织
进入管理（LEADER / ADVISOR）
```

规则：

```text
无组织身份：整个区块不渲染，不显示空状态
1–4 个组织：全部紧凑展示
超过 4 个：显示“查看全部（n）”，原位展开 / 收起
不使用横向滚动或滚动提示
```

MEMBER 只能进入组织主页；LEADER / ADVISOR 的“进入管理”必须携带该项 `organizationId`，进入 `/manage/organizations/:organizationId`。`ADVISOR` 必须对应 TEACHER 账号。组织管理入口始终先经过“我的组织”选择具体作用域。

顶部：

```text
H1：社团与组织
搜索
组织类型筛选
招新状态筛选
```

组织类型：

```text
学院部门
学生社团
实验室
创新团队
其他
```

---

## 组织卡

```text
Logo
名称
类型
一句简介
招新状态
```

按钮：

```text
查看组织
查看招新（如有）
```

---

# 组织主页 `/organizations/:id`

Hero / Identity：

```text
Logo
Banner
组织名称
组织类型
简介
```

内容：

```text
主要方向
负责人
指导老师
公开联系方式
近期活动
当前招新
```

指导老师不是纯文本姓名，而是关联的教师账号（`OrganizationMembership.role = ADVISOR`）。

公开展示建议：

```text
头像
公开姓名
职称
学院 / 部门
研究方向（可选）
公开邮箱（可选）
办公地点（可选）
```

如果当前登录用户是该组织的 `LEADER` 或 `ADVISOR`：

```text
显示 [管理组织]
```

`MEMBER` 只显示“查看组织”，不显示管理入口。

# 招新详情 `/organizations/:id/recruitments/:recruitmentId`

顶部：

```text
组织名称
招新标题
状态
截止时间
```

正文：

```text
招新介绍
面向年级
其他说明
```

岗位：

```text
岗位名称
人数
岗位说明
要求
```

主要按钮：

```text
申请加入
```

---

## 招新申请 Modal / 页面

```text
申请岗位
自我介绍
技能
相关经历
为什么想加入
```

按钮：

```text
提交申请
取消
```

---

# 校园动态 `/activities`

页面展示名：

```text
校园动态
```

路由保持 `/activities`，不新增学生端“公告”一级导航。公开浏览状态由 URL query 表达：

```text
/activities?tab=all             默认
/activities?tab=activities      活动
/activities?tab=announcements   公告
```

顶部：

```text
H1：校园动态
搜索
全部 / 活动 / 公告
```

`tab=all` 按以下两个独立区块呈现，不把具有报名操作的活动和纯信息公告混成一种列表项：

```text
近期活动
最新公告
```

---

## 活动列表 `tab=activities`

筛选：

```text
报名中
即将开始
已结束
活动类型
```

活动项：

```text
封面
名称
时间
地点
主办组织
报名状态
当前报名人数 / 限额（如有）
```

按钮：

```text
查看详情
```

---

## 公告列表 `tab=announcements`

筛选：

```text
学院公告
学校公告
平台公告
```

公告项：

```text
来源
标题
摘要
发布日期
置顶状态（如存在）
关联活动 / 竞赛 / 组织 / 招新（如存在）
站外原文标识（如存在）
```

公告不是个人未读消息；点击进入公告详情。

---

# 活动详情 `/activities/:id`

顶部：

```text
活动名称
活动类型
报名状态
```

信息：

```text
时间
地点
主办方
报名截止
人数限制
当前报名人数
```

正文：

```text
活动介绍
主讲人
内容
注意事项
相关公告
```

按钮未报名：

```text
报名参加
```

已报名：

```text
已报名
取消报名
```

已满：

```text
报名已满
```

已结束：

```text
报名已结束
```

---

# 公告详情 `/activities/announcements/:announcementId`

```text
来源（学院 / 学校 / 平台）
标题
发布日期
公告正文
查看原文（有 external_url 时）
查看关联对象（有关联对象时）
```

`查看原文` 是明确的站外跳转，不抓取、镜像或 iframe 嵌入学校官网内容。

---

## 报名确认

字段自动带入：

```text
姓名
学号
班级
```

按钮：

```text
确认报名
取消
```

---

# Q&A 首页 `/qa`

顶部：

```text
H1：咨询与指南
搜索
```

Tab / 分类：

```text
常见问题
指南
公开问答
```

---

## FAQ

```text
问题
简短摘要
分类
```

点击查看完整回答。

---

## 指南

```text
标题
分类
更新时间
摘要
```

---

## 我要咨询

按钮：

```text
[提交咨询]
```

---

# 提交咨询 `/qa/ask`

字段：

```text
问题分类
关联竞赛（可选）
标题
问题描述
公开 / 私密
```

按钮：

```text
提交
取消
```

---

# 问题详情 `/qa/questions/:id`

公开问题：

```text
标题
分类
关联对象
问题正文
回答
更新时间
```

本人私密咨询：

```text
状态
问题
运营回复
```

---

# 消息中心 `/notifications`

Header 小铃铛进入本页。它只展示当前登录用户的个人消息，不混入学院、学校或平台的公开公告。

筛选：

```text
全部
未读
竞赛
组队
活动
组织
咨询
系统
```

每条：

```text
消息标题
摘要
时间
未读状态
```

操作：

```text
打开关联页面
标记已读
全部已读
```

---

# 个人中心 `/me`

个人中心根据 `identity_type` 呈现不同资料摘要。

## STUDENT 概览

```text
Avatar
昵称
姓名
专业
年级
公开简介
组织身份
```

学生导航：

```text
个人资料
我的关注
我的组队
我的申请
我的活动
我的咨询
账号设置
```

## TEACHER 概览

```text
Avatar
姓名
教师
学院 / 部门
职称
公开简介
指导组织身份（如有）
```

教师默认不显示学生专属入口：

```text
我的组队
我的申请
我的活动
```

教师仍可使用：

```text
个人资料
我的关注（如保留竞赛关注）
我的咨询
账号设置
```

如果教师是某组织 `ADVISOR`，组织入口仍从：

```text
社团组织 -> 我的组织 -> 进入管理
```

进入，不在个人中心增加无作用域“组织管理”按钮。

---

# 我的资料 `/me/profile`

页面先显示账号身份：

```text
学生
或
教师
```

## STUDENT 系统字段

```text
姓名
学号
班级
专业
年级
```

## STUDENT 公开字段

```text
昵称
头像
简介
技能标签
```

## TEACHER 系统字段

```text
姓名
工号
```

## TEACHER 公开字段

```text
公开姓名
头像
学院 / 部门
职称
简介
研究方向
公开邮箱（可选）
办公地点（可选）
```

身份、真实姓名、学号 / 工号不能通过普通资料编辑自行切换。

按钮：

```text
保存修改
```

---

# 我的关注 `/me/follows`

列表：

```text
关注的竞赛
```

操作：

```text
查看
取消关注
```

---

# 我的组队 `/me/teams`

Tab：

```text
我发布的
我加入的
```

本人发布：

```text
编辑
查看申请
关闭
```

---

# 我的申请 `/me/applications`

Tab：

```text
全部
组队申请
组织申请
```

每条：

```text
目标
类型
提交时间
状态
```

允许状态：

```text
待处理
已接受
已拒绝
已撤回
```

待处理可：

```text
撤回
```

---

# 我的活动 `/me/activities`

列表：

```text
活动
时间
报名状态
```

可取消时：

```text
取消报名
```

---

# 我的咨询 `/me/questions`

```text
标题
公开 / 私密
状态
最后更新
```

---

# 账号设置 `/me/settings`

包含：

```text
外观模式
账号安全入口
必要的账户偏好
```

外观模式：

```text
跟随系统
浅色
暗色
```

说明：

- 不提供语言切换，V0.1 固定简体中文
- 主题偏好可在未登录状态下使用；登录后的账号设置只是另一个管理入口
- 密码、登录安全等具体字段以最终认证方案为准，不在前端阶段自行发明

---

# 组织管理 `/manage/organizations/:organizationId`

仅当前组织有效 LEADER / ADVISOR 与 SUPERADMIN 可访问。ADVISOR 必须对应 TEACHER 账号。

顶部：

```text
组织名称
当前身份
返回组织主页
```

导航：

```text
组织资料
招新管理
申请管理
```

---

# 组织资料管理

可编辑：

```text
Logo
Banner
简介
主要方向
公开联系方式
展示信息
```

不可编辑：

```text
组织类型（V0.1）
组织负责人 / 指导老师授权
组织删除
```

按钮：

```text
保存修改
```

---

# 招新管理

列表：

```text
标题
状态
开始
截止
申请人数
```

操作：

```text
新建招新
编辑
发布
结束
查看申请
```

---

# 新建 / 编辑招新

基本字段：

```text
标题
介绍
开始时间
截止时间
面向年级
其他说明
```

岗位编辑器：

```text
岗位名称
招募人数
岗位说明
要求
```

操作：

```text
添加岗位
删除岗位
保存
发布
```

---

# 招新申请管理

筛选：

```text
全部
待处理
已接受
已拒绝
```

申请项：

```text
申请人
岗位
年级
专业
技能
自我介绍
提交时间
```

操作：

```text
接受
拒绝
```

---

# 平台运营 `/ops`

仅：

```text
OPERATOR
SUPERADMIN
```

可访问。

概览卡：

```text
报名中的竞赛
进行中的活动
待回复咨询
当前招新
```

注意：

只显示真实数据。

---

# 运营竞赛管理 `/ops/competitions`

表格：

```text
名称
状态
报名截止
更新时间
推荐状态
```

操作：

```text
新建
查看
编辑
时间线
推荐 / 取消推荐
结束
归档
```

---

# 新建 / 编辑竞赛

字段：

```text
名称
级别
参赛形式
适合年级
主要方向
分类
报名开始
报名截止
比赛时间
学院是否组织
联系人
官网
官方通知
简介
适合谁参加
准备建议
```

时间线：

```text
添加节点
编辑节点
删除节点
```

---

# 校园动态管理 `/ops/activities`

该页是 OPERATOR / SUPERADMIN 的统一发布与管理入口，页面内使用：

```text
活动
公告
```

tab，而不是新增 `/ops/announcements` 前端页面路由。两个 tab 调用各自的 API 与管理字段，不能把 Activity 和 Announcement 合并成一个通用表。

主操作：

```text
发布动态
```

发布动态打开类型选择：

```text
发布活动
发布公告
发布活动并同步生成关联公告
```

活动 tab 表格：

```text
名称
时间
状态
报名人数
人数限制
主办组织
```

活动操作：

```text
发布
编辑
查看报名
关闭报名
结束
导出名单
```

公告 tab 表格：

```text
来源
标题
发布时间
状态
关联对象
站外原文
```

公告操作：

```text
发布
编辑
归档
```

“发布活动并同步生成关联公告”由后端一个事务完成；失败时不可留下只创建活动或只创建公告的半成品。

---

# 运营咨询管理 `/ops/questions`

筛选：

```text
待回复
已回复
公开
私密
```

详情：

```text
学生
问题
分类
关联竞赛
公开状态
时间
```

操作：

```text
回复
编辑回复
设为 FAQ 候选（可选）
```

---

# 指南管理 `/ops/guides`

列表：

```text
标题
分类
状态
更新时间
```

操作：

```text
新建
编辑
发布
归档
```

---

# 登录页

V0.1 统一登录入口：

```text
学号 / 工号 / 用户名
密码
```

按钮：

```text
登录
```

辅助：

```text
学生注册
忘记密码 / 联系管理员
```

不开发独立教师登录页。

教师账号使用同一登录页。

后续如接入学校统一认证，再调整流程。

---

# 注册页

V0.1 自助注册只面向学生。

基础字段：

```text
学号
姓名
密码
确认密码
```

可选：

```text
专业
年级
班级
```

注册产生：

```text
identity_type = STUDENT
```

页面不得提供：

```text
“注册教师账号”
“选择教师身份”
```

教师账号由 SUPERADMIN 通过 Django Admin 或受控导入流程创建，账号至少包含：

```text
工号
姓名
identity_type = TEACHER
```

教师后续可完善：

```text
公开姓名
学院 / 部门
职称
头像
研究方向
公开邮箱
办公地点
```

组织主页公开展示教师时使用 `public_name`，不直接暴露账号级 `real_name`。

复杂资料可登录后补充。

---

# 403

内容：

```text
你没有权限访问此页面
```

操作：

```text
返回上一页
返回首页
```

---

# 404

```text
页面不存在或已被移动
```

操作：

```text
返回首页
```

---

# 500

```text
服务暂时出现问题
请稍后重试
```

操作：

```text
重新加载
返回首页
```

---



# 页面实现统一规则

## 需登录操作

所有公开页面采用同一策略：

```text
游客点击受保护操作
-> /login?next=<目标或返回路径>
-> 登录成功
-> 返回原任务
```

不使用：

```text
不同页面各自发明的登录 Modal
禁用但不给解释的按钮
仅前端隐藏作为权限控制
```

---

## 列表分页

默认：

```text
公开列表：20 / 页
运营表格：30 / 页
搜索结果：20 / 页
```

筛选和页码写入 URL Query，便于：

```text
刷新恢复
浏览器返回
复制分享
```

---

## 核心页面布局基线

### `/competitions`

```text
页面标题 / 简介
搜索 + 筛选
结果数量 / 排序
竞赛列表
分页
Empty / Error
```

### `/competitions/:id`

```text
标题 + 状态 + 截止信息 + 主操作
基本信息
比赛简介
谁适合参加
时间线
相关通知 / 指南
正在组队
```

移动端保持：

```text
状态
截止时间
主操作
```

优先于封面等装饰信息。

### `/teams`

```text
标题 + 发布组队
搜索 / 竞赛 / 类型 / 状态筛选
组队列表
分页
```

### `/teams/:id`

```text
标题 + 关联竞赛 + 状态
队伍 / 个人基本信息
已有成员与目标人数
招募岗位
技能 / 投入 / 目标
发布者公开资料
主操作：申请加入
```

### `/organizations`

```text
标题
我的组织（有有效身份时，至多 4 项 + 查看全部）
搜索 / 类型 / 招新筛选
组织列表
分页
```

### `/organizations/:id`

```text
组织 Identity / Banner
简介与方向
负责人 / 指导老师 / 公开联系方式
当前招新
近期活动
```

### `Recruitment Detail`

```text
组织上下文
招新标题 + 截止状态
招新介绍
岗位列表
申请入口
```

### `/activities`

```text
校园动态标题
全部 / 活动 / 公告
搜索
当前 tab 的筛选
活动或公告列表
分页（单独 tab）
```

### `/activities/:id`

```text
标题 + 报名状态 + 主操作
时间 / 地点 / 主办方
活动介绍
主讲人
注意事项
报名信息
```

### `/activities/announcements/:announcementId`

```text
来源 + 标题 + 日期
公告正文
关联对象入口（如存在）
站外原文入口（如存在）
```

### `/qa`

```text
标题 + 搜索 + 提交咨询
FAQ
指南
公开问答
```

### `/notifications`

```text
标题 + 全部已读
类型 / 未读筛选
消息列表
分页
```

### `/ops/*`

```text
页面标题 + 主操作
筛选
数据表格
分页
```

运营页优先 Table，不把管理记录改成营销卡片墙。

---

## Empty / Error 文案规则

Empty 必须解释下一步。

例如：

```text
暂时没有正在招募的队伍
[发布组队]
```

筛选后无结果：

```text
没有找到符合当前条件的内容
[清除筛选]
```

接口错误：

```text
加载失败，请稍后重试
[重新加载]
```

---

## 数据展示来源

页面不得保存或依赖以下重复字段：

```text
还有 3 天截止
报名中
当前团队人数
组织正在招新
活动剩余名额
```

这些显示数据由数据库基础事实实时派生。

例如：

```text
deadline -> remaining time
accepted applications -> current member count
active recruitment -> organization recruiting state
registered rows -> remaining capacity
```

详细规则见：

```text
docs/backend/database-design.md
```

---

# Mobile 页面级交互规则

## 筛选

Phone 列表页：

```text
搜索
少量 Quick Filter
[筛选]
```

“筛选”打开 `UDrawer`。

完整筛选值仍写入 URL Query。

---

## Detail Sticky Action

以下页面在 Phone 可使用 Sticky Bottom Action：

```text
Team Detail        -> 申请加入
Recruitment Detail -> 申请加入
Activity Detail    -> 报名参加
Competition Detail -> 根据上下文显示最重要动作
```

显示 Sticky Action 时隐藏全局 Bottom Navigation。

---

## 长表单

Phone 上以下操作使用独立任务页或全屏任务面：

```text
发布组队
申请加入队伍
申请组织
提交咨询
编辑完整资料
```

不要塞入小尺寸 Modal。

---

## 手机运营与组织管理

`/organizations` 仍是 Phone 根级 Tab Shell；“我的组织”只在存在身份时置于组织列表前方。成员点按进入组织主页，LEADER / ADVISOR 点按“进入管理”后切换到管理 Shell，不能同时保留全局 Bottom Navigation。

Phone 的校园动态：

```text
底部导航标签：动态
页面内：全部 / 活动 / 公告
活动项：紧凑行 + 时间 / 地点 / 报名状态
公告项：紧凑行 + 来源 / 日期 / 外链标识
```

tab 必须有可见文字、选中态与键盘可达性；不把关键 tab 或筛选隐藏在无提示的横向滑动区域。活动详情与公告详情均使用 Back Header；只有可报名活动才有 Sticky Bottom Action。

组织 LEADER / ADVISOR 的常见管理操作必须在 Phone 可完成：

```text
查看申请
接受
拒绝
发布 / 结束招新
编辑组织基础资料
```

组织管理者和运营人员的长表单（新建招新、发布动态、编辑活动、编辑公告）使用独立任务页或全屏任务面，不放进小 Modal。

Platform Operations：

```text
手机可用
Desktop 优先
```

Phone 不展示 8–10 列横向巨型表格。

应降级为：

```text
summary row / list
-> detail / edit
```

运营“校园动态管理”在 Phone 先选择“活动 / 公告”tab；各记录降级为摘要行，点击后进入详情或编辑任务页。报名名单、申请处理和长正文编辑不得通过横向巨型表格完成。

---

# 页面级通用验收

所有数据驱动页面都必须明确处理：

```text
Loading
Success
Empty
Error
Disabled（需要时）
```

所有页面在进入开发完成状态前至少验证：

```text
1440 Desktop
1024 Boundary
768 Tablet
430 Large Phone
390 Phone
360 Small Phone
Keyboard
Light mode
Dark mode
200% zoom（核心页面）
```

核心业务状态不得仅以颜色表达。

页面第一视觉层级应回答：

```text
我现在在哪里？
我能做什么？
下一步会发生什么？
```

---

# 页面与权限矩阵

权限是可叠加的三个维度：

```text
身份：STUDENT / TEACHER
平台：USER / OPERATOR / SUPERADMIN
组织：MEMBER / LEADER / ADVISOR
```

下表中的 `LEADER / ADVISOR` 都必须限定到当前组织。

| 页面 / 操作 | 游客 | STUDENT | TEACHER | MEMBER(org) | LEADER(org) | ADVISOR(org) | OPERATOR | SUPERADMIN |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 浏览公开内容 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 搜索 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 关注竞赛 |  | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 发布组队 |  | ✓ |  | ✓* | ✓* |  | ✓* | ✓ |
| 申请队伍 |  | ✓ |  | ✓* | ✓* |  | ✓* | ✓ |
| 报名学生活动 |  | ✓ |  | ✓* | ✓* |  | ✓* | ✓ |
| 提交咨询 |  | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 申请组织招新 |  | ✓ |  | ✓* | ✓* |  | ✓* | ✓ |
| 管理当前组织 |  |  |  |  | ✓ | ✓ | 仅同时有对应组织角色时 | ✓ |
| 发布官方竞赛 |  |  |  |  |  |  | ✓ | ✓ |
| 发布学院活动 / 公告 |  |  |  |  |  |  | ✓ | ✓ |
| 管理指南 / FAQ |  |  |  |  |  |  | ✓ | ✓ |
| 授予 LEADER / ADVISOR |  |  |  |  |  |  |  | ✓ |
| 系统权限管理 |  |  |  |  |  |  |  | ✓ |

说明：

`*` 表示最终是否可执行仍以账号 `identity_type = STUDENT` 为准。  
例如一个学生同时是 `OPERATOR`，仍然可以作为学生参与组队；一个教师即使是 `OPERATOR`，不会因为运营权限自动获得学生组队 / 招新申请能力。

典型组合：

```text
学生负责人：
identity_type = STUDENT
platform_role = USER
AI协会 = LEADER
```

```text
指导老师：
identity_type = TEACHER
platform_role = USER
AI协会 = ADVISOR
```

```text
学院运营老师：
identity_type = TEACHER
platform_role = OPERATOR
AI协会 = ADVISOR（可选）
```

这些身份与权限可以叠加，但不会互相替代。

---

# V0.1 不存在的页面

以下页面不应在第一版页面地图中被开发：

```text
成果中心
成果提交
成果审核
成果统计

站内聊天
私信
积分商城
排行榜
组织内部聊天
组织内部部门管理
组织成员复杂 RBAC
活动签到
AI 助手
推荐中心
```

如果代码 Agent 自行添加这些页面，应视为超范围实现。
