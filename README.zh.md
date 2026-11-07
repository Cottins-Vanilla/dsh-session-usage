# Session Usage for DeepSeek Harness

<p align="center">
  <img src="icon.svg" alt="会话用量图标" width="72" height="72">
</p>

[English](README.md) | [中文](README.zh.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22.19-339933)](package.json)
[![DeepSeek Harness](https://img.shields.io/badge/DeepSeek%20Harness-0.2.2--rc.1-4C6EF5)](https://github.com/deepseek-ai/deepseek-harness)
[![Platform](https://img.shields.io/badge/platform-web-8A2BE2)](#兼容性与已知限制)

一个 DeepSeek Harness 插件，回答每个对话都关心的问题：**它花了多少钱、多少 token？**

插件读取已提交的会话日志，把 `assistant/message` 的用量折叠成按对话、按轮次的统计，并放在你
本来就在看的位置：侧边栏、对话顶部 View 标签、会话标题栏，以及每个回答的末尾。

## 四个入口

| 入口 | 位置 | 内容 |
| --- | --- | --- |
| **会话用量面板** | 侧边栏 → **会话用量** | 完整仪表盘：KPI、每日/每轮曲线、对话列表 |
| **用量标签页** | 对话顶部 View 标签 → **用量** | 同一个仪表盘，默认聚焦当前对话 |
| **标题栏胶囊** | 对话标题栏右侧 | 当前对话的价格与总 token，点击打开面板 |
| **每轮价格标记** | 每个完成的回答末尾 | `本轮 ¥… · 当前对话 ¥…`，先显示本轮价格，再显示当前对话累计价格；默认白色，可换颜色 |

```text
侧边栏
  └─ 会话用量  ← 完整仪表盘

对话标题栏
  ├─ [对话] [轨迹] [用量] [上下文] [编队]
  └─ ¥0.1234 · 12.3k tokens        ← 标题栏胶囊

回答结束处
  └─ 本轮 ¥0.1234 · 当前对话 ¥1.2345   ← 每轮价格标记
```

## 功能

- **五种指标**：价格、总 tokens、输入 tokens、输出 tokens、缓存命中 tokens。
- **三种范围**：当前对话、当前项目（当前对话所在工作目录）、全部对话。每个选项都会显示
  具体对象：对话标题、项目文件夹名，或对话数量。
- **两张曲线**：零填充的每日曲线，以及按轮次累计的曲线。
  - 每轮累计曲线给消耗最高的 8 个对话各一种颜色，其余合并为灰色的“其他对话”；
  - 图例显示颜色、对话标题、项目和总额；点击图例可隐藏/显示对应对话；
  - 鼠标悬停可查看每条可见曲线在该轮次的累计值。
- **点击跳转**：对话列表每一行都能打开对应对话；当前对话视图还会列出每一轮。
- **每轮价格标记**：每个回答结束先显示“本轮价格”，再显示截至该轮的“当前对话累计价格”。默认白底深色文字；
  面板的 **标记颜色** 提供白色、琥珀、红、蓝、绿、紫、青以及自定义取色器；选择保存在本地。
- **刷新节奏**：面板 15 秒、标题栏胶囊 8 秒；每轮标记按会话共享一次请求，只有新轮次出现时才重取。
- **中英双语**：完整的 `zh` / `en` 字典。
- **只读设计**：不写会话日志、不改 profile、不访问第三方网络、不上报遥测。

## 安装

### 前提

- DeepSeek Harness **0.2.2-rc.1**（已测试），启用 Web UI。
- Node.js **22.19+**。
- 一个启用了 Web 应用的 profile。

### 方式 A：从仓库安装

在 Web UI 打开 **Plugins → Add plugin**，选择 GitHub 来源，填入：

```text
https://github.com/Cottins-Vanilla/dsh-session-usage
```

或用 CLI（把 `desktop` 换成你的 Web profile 名）：

```sh
dsh plugin --profile desktop add https://github.com/Cottins-Vanilla/dsh-session-usage
```

### 方式 B：安装本地目录

```sh
git clone https://github.com/Cottins-Vanilla/dsh-session-usage.git
dsh plugin --profile desktop add ./dsh-session-usage
```

这个 bundle 没有构建步骤，也没有运行时依赖。安装后默认启用；如果应用已经在运行，刷新页面。
如果 Host 半没能通过 HMR 重载，重启一次应用。

### 卸载

Web UI 的 **Plugins → Session usage → Remove**，或：

```sh
dsh plugin --profile desktop remove dsh-session-usage
```

## 使用

### 统计范围

统计范围是一个带说明文字的分组控件，不是一组看起来像标签的按钮：

- **当前对话 · `<标题>`**：本页面最近打开的对话。
- **当前项目 · `<文件夹>`**：记录的 `cwd` 与当前对话一致的会话；悬停按钮可看完整路径。
- **全部对话 · `<n>`**：`sessionQuery` 能看到的全部 live / persisted 会话。

没有在当前页面打开过对话时，“当前对话”和“当前项目”会禁用。

### 曲线模式

图表卡片右上角可在 **每日** 和 **每轮累计** 之间切换：

- **每日**：以今天（北京时间）结尾的 `chartDays` 天窗口，缺失日期补 0。回答“什么时候花了多少”。
- **每轮累计**：每条对话按轮次累计所选指标。回答“这个对话怎么长起来的，第 N 轮谁花得更多”。

### 每轮价格标记

每个完成的轮次都会在对话里显示一个小标记：

```text
● 本轮 ¥0.1234 · 当前对话 ¥1.2345
```

- 第一个数是本轮价格，第二个数是截至该轮的当前对话累计价格。
- 默认是白底深色文字的胶囊，浅色/深色主题都可读。
- 在 **会话用量 / 用量** 面板的 **标记颜色** 里更换：预设包含白、琥珀、红、蓝、绿、紫、青；
  取色器支持任意十六进制颜色。选择保存在 `localStorage` 的
  `dsh-session-usage.turnColor`。
- 点击标记会打开该对话的用量面板。

## 定价模型

价格是**估算值**。Harness 记录每条助手消息的 token 用量，但不记录发票价或供应商单价。

默认价目表按 DeepSeek 官方人民币列表价（每 100 万 token）：

| 模型匹配 | 缓存命中 | 未命中输入 | 输出 |
| --- | ---: | ---: | ---: |
| `deepseek-flash` | 0.02 | 1 | 4 |
| `deepseek-v4-flash` | 0.02 | 1 | 4 |
| `deepseek-v4-flash-vision-exp` | 0.02 | 1 | 4 |
| `deepseek-v4-pro` | 0.15 | 4.5 | 13.5 |
| `deepseek-pro` | 0.15 | 4.5 | 13.5 |
| 兜底 | 0.02 | 1 | 4 |

单条消息：

```text
cost = (cacheRead × hit + input × miss + cacheWrite × miss + output × out) / 1,000,000
       × (高峰 ? peakMultiplier : 1)
```

- 高峰时段为北京时间周一至周五 **09:00–12:00**、**14:00–18:00**，`peakMultiplier` 默认 2。
- 周末与内置的 2026 年中国法定节假日按谷价。
- Session 契约中 `outputTokens` 已包含 `reasoningTokens`，不会重复计费。
- `totalTokens` 为 `input + cacheRead + cacheWrite + output`；供应商显式给出时以其为准。
- 子代理会话计入项目/全部统计，并在列表中标记为 **子代理**。

完整规则与注意项见 [docs/pricing.md](docs/pricing.md)。

## 配置

bundle 行支持可选的 `config` 对象，覆盖内置默认值；每个字段见
[docs/configuration.md](docs/configuration.md)。

```yaml
- id: session-usage
  config:
    chartDays: 14              # 每日曲线点数，2..60
    maxSessions: 400           # 最多扫描的最新会话数，1..2000
    pricing:
      currency: CNY
      peakMultiplier: 2
      peakHours: [[9, 12], [14, 18]]
      weekendValley: true
      models:
        deepseek-v4-pro: { hit: 0.15, miss: 4.5, out: 13.5 }
        deepseek-flash: { hit: 0.02, miss: 1, out: 4 }
        my-model: { hit: 0.1, miss: 2, out: 6 }
      fallback: { hit: 0.02, miss: 1, out: 4 }
      holidays: ['2026-10-01']
```

模型键按模型 id 的大小写不敏感子串匹配，最长键优先。第一次打开“全部对话”会读取并缓存所有冷
会话，之后只折叠新提交的 live 事件。

## 数据、隐私与安全

- **唯一事实来源**：已提交的会话日志。live 会话从内存存储折叠；冷会话通过
  `sessionQuery.readSession()` 读取。插件从不追加事件，也不写会话数据。
- **不访问外部网络**：唯一的 HTTP 请求是本 bundle 的 Client 与 Host 之间的同源、已认证
  `POST /api/session-usage/query`。
- **无遥测**：不向作者或第三方上报任何数据。
- **不读取秘密**：只读取 token 计数与模型 id，不读取凭据或账户数据。唯一保留的消息文本是
  会话没有标题事件时，从第一条用户消息提取的最多 120 字符的兜底标题。
- **有界工作**：`maxSessions` 限制扫描量；查询路由只读；单个会话失败会隔离并以警告数上报。

漏洞报告见 [SECURITY.md](SECURITY.md)。

## 架构

```text
会话日志 ──► Host 折叠（lib/stats.js + lib/pricing.js）
                 │
                 ├── 每会话总计（tokens、价格、模型、每日、轮次）
                 ├── 每轮点（价格、tokens、seq）
                 └── POST /api/session-usage/query
                            │
Client（client.js）◄────────┘
  ├── 侧边栏面板（main + sidebar.panellist）
  ├── “用量”标签页（conversation.view）
  ├── 标题栏胶囊（conversation.session.header.utilities）
  └── 每轮标记（conversation.chat.turnTail）
```

Host 维护一个派生的内存索引；它是缓存，不是第二份事实来源。Client 使用主题 token 渲染，不导入
Harness Client 包，只通过 Host 响应读取会话数据。

更多见 [docs/architecture.md](docs/architecture.md)。

## 项目结构

```text
dsh-session-usage/
├── index.js                 Host 半：路由、会话扫描、缓存
├── client.js                Web Client 半：插槽、图表、标记、语言
├── lib/
│   ├── pricing.js           价目表、峰谷时段、计价公式
│   └── stats.js             事件折叠、按轮/按日聚合
├── locale/{en,zh}.json      Plugin Manager 展示元数据
├── cordis.patch.yml         Bundle 层：一行 Host 条目
├── icon.svg                 插件图标（原创，MIT）
├── scripts/check.mjs        无依赖的仓库检查 / CI
├── docs/                    架构、配置、定价、发布
├── examples/                示例 profile patch
├── CHANGELOG.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
└── LICENSE
```

## 开发

没有编译步骤。修改 `client.js` / `index.js` / `lib/*.js` 后运行：

```sh
npm test          # node scripts/check.mjs
```

检查内容包括 manifest、exports、语言元数据、SVG 大小、Client loader id、JavaScript 语法，以及
是否存在临时/本地文件。

本地预览时，把目录作为 bundle 安装（见上文）。Client 侧修改在 bundle 重载后刷新页面即可；Host
侧修改需要切换插件或重启应用。

## 兼容性与已知限制

- 已在 DeepSeek Harness **0.2.2-rc.1** 的 Web 平台测试。
- 价格是估算；内置的 2026 节假日表需要按年更新。其他供应商或新价格请覆盖
  `pricing.models` 与 `pricing.holidays`。
- 历史很多时，第一次“全部对话”会稍慢，因为冷日志只读一次；后续增量更新。
- “当前项目”按记录的 `cwd` 比较，不是完整的 workspace registry 映射。
- npm 包名 `dsh-session-usage` 已被另一个项目占用。本仓库以 GitHub/本地 bundle 形式分发；
  发布 npm 前请读 [docs/publishing.md](docs/publishing.md)。
- 仓库不包含截图；上面的 UI 地图描述了每个入口。

## 贡献

欢迎 issue 与 pull request。请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 并遵守
[行为准则](CODE_OF_CONDUCT.md)。

## 许可

[MIT](LICENSE) © 2026 Cottins-Vanilla。

DeepSeek、DeepSeek Harness 及相关标识归其各自所有者。本插件不是 DeepSeek 官方产品。
