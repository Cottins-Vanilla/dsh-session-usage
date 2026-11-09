/**
 * Session usage: Client half.
 *
 * Renders a compact current-conversation chip in the Session header and the
 * full usage dashboard in the main column. All numbers come from this bundle's
 * Host half over `POST /api/session-usage/query`; the Client only aggregates
 * nothing locally, so the committed Session log stays the single source.
 */

window.__ModuleLoader__.load({
  id: 'dsh-session-usage',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const NS = 'session-usage'
    const PANEL_ID = 'session-usage'
    const PREF_METRIC = 'dsh-session-usage.metric'

    const DICT = {
      zh: {
        'panel.title': '会话用量',
        'panel.subtitle': '每个对话的价格与 token 消耗',
        'panel.refresh': '刷新',
        'panel.loading': '正在统计…',
        'page.needSession': '打开任意对话后，即可查看「当前对话」和「当前项目」。',
        'scope.label': '统计范围',
        'scope.current': '当前对话',
        'scope.project': '当前项目',
        'scope.all': '全部对话',
        'scope.untitled': '未命名对话',
        'metric.label': '显示指标',
        'metric.cost': '价格',
        'metric.tokens': '总 tokens',
        'metric.input': '输入 tokens',
        'metric.output': '输出 tokens',
        'metric.cacheRead': '缓存命中',
        'kpi.cost': '估算费用',
        'kpi.tokens': '总 tokens',
        'kpi.io': '输入 / 输出',
        'kpi.cache': '缓存命中',
        'kpi.sessions': '对话 / 轮次',
        'kpi.estimated': '按公开单价估算',
        'kpi.rate': '命中率',
        'kpi.input': '输入',
        'kpi.output': '输出',
        'unit.tokens': 'tokens',
        'unit.turns': '轮',
        'unit.steps': '步',
        'unit.days': '天',
        'unit.messages': '条模型消息',
        'chart.turns': '每轮累计消耗',
        'chart.days': '每日消耗',
        'chart.cumulative': '按轮次累计',
        'chart.perDay': '按自然日',
        'chart.window': '统计窗口',
        'chart.empty': '该范围内还没有用量记录',
        'chart.hint': '将鼠标移到曲线上查看每个点的数值',
        'chart.modeDays': '每日',
        'chart.modeTurns': '每轮累计',
        'chart.modeTurnValue': '每轮值',
        'chart.turnValue': '每轮值',
        'chart.perTurn': '单轮消耗，不累计',
        'chart.clickHint': '点击数据点跳转到对应对话或轮次',
        'chart.otherPrefix': '其他',
        'chart.legendHint': '点击图例可隐藏或显示对应对话',
        'chart.seriesNote': '最多显示 8 个对话',
        'chart.range': '显示范围',
        'chart.rangeAll': '不限',
        'chart.rangePlaceholder': '每屏 N 轮',
        'chart.rangeInvalid': '请输入正整数',
        'unit.conversations': '个对话',
        'turn.label': '当前对话',
        'turn.turnLabel': '本轮',
        'turn.open': '查看用量',
        'turn.tooltip': '当前对话累计价格与本轮价格',
        'color.label': '标记颜色',
        'color.custom': '自定义颜色',
        'view.label': '用量',
        'list.title': '对话明细',
        'list.note': '按当前指标排序，点击打开对话',
        'list.showing': '显示',
        'list.more': '显示更多',
        'list.empty': '没有可显示的对话',
        'list.untitled': '未命名对话',
        'list.subagent': '子代理',
        'list.current': '当前',
        'list.open': '打开对话',
        'turns.title': '轮次明细',
        'turns.note': '点击任意轮次可打开这个对话',
        'turns.empty': '这个对话还没有用量记录',
        'foot.estimate': '费用按 token 用量与 DeepSeek 公开单价估算，仅供参考。',
        'foot.peakOn': '当前为高峰时段，按高峰单价计价。',
        'foot.peakOff': '当前为空闲时段。',
        'foot.generated': '更新于',
        'foot.warnings': '个对话读取失败',
        'open.failed': '无法打开这个对话，请从侧边栏重试。',
        'error.title': '读取用量失败',
        'error.retry': '重试',
        'chip.title': '当前对话用量，点击查看统计',
        'chip.error': '用量读取失败',
        'chip.stale': '数据可能已过期',
        'chip.staleTitle': '最近一次刷新失败，显示的是上次成功的数据',
        'project.unknown': '未记录项目',
        'model.unknown': '未知模型',
        'update.check': '检查更新',
        'update.checking': '检查中…',
        'update.hint': '检查更新会访问 GitHub API',
        'update.available': '发现新版本',
        'update.current': '当前',
        'update.latest': '最新',
        'update.open': '查看 Release',
        'update.dismiss': '关闭',
        'update.upToDate': '已是最新版本',
        'update.failed': '检查更新失败',
      },
      en: {
        'panel.title': 'Session usage',
        'panel.subtitle': 'Price and token consumption for every conversation',
        'panel.refresh': 'Refresh',
        'panel.loading': 'Measuring…',
        'page.needSession': 'Open a conversation to unlock Current conversation and Current project.',
        'scope.label': 'Scope',
        'scope.current': 'Current conversation',
        'scope.project': 'Current project',
        'scope.all': 'All conversations',
        'scope.untitled': 'Untitled conversation',
        'metric.label': 'Metric',
        'metric.cost': 'Price',
        'metric.tokens': 'Total tokens',
        'metric.input': 'Input tokens',
        'metric.output': 'Output tokens',
        'metric.cacheRead': 'Cache reads',
        'kpi.cost': 'Estimated price',
        'kpi.tokens': 'Total tokens',
        'kpi.io': 'Input / output',
        'kpi.cache': 'Cache reads',
        'kpi.sessions': 'Conversations / turns',
        'kpi.estimated': 'estimated from list prices',
        'kpi.rate': 'hit rate',
        'kpi.input': 'in',
        'kpi.output': 'out',
        'unit.tokens': 'tokens',
        'unit.turns': 'turns',
        'unit.steps': 'steps',
        'unit.days': 'days',
        'unit.messages': 'model messages',
        'chart.turns': 'Cumulative by turn',
        'chart.days': 'Daily consumption',
        'chart.cumulative': 'cumulative',
        'chart.perDay': 'per calendar day',
        'chart.window': 'window',
        'chart.empty': 'No usage recorded in this range yet',
        'chart.hint': 'Hover the curve to inspect each point',
        'chart.modeDays': 'Daily',
        'chart.modeTurns': 'By turn',
        'chart.modeTurnValue': 'Per-turn',
        'chart.turnValue': 'Per-turn value',
        'chart.perTurn': 'Single turn, not cumulative',
        'chart.clickHint': 'Click a data point to open the conversation or turn',
        'chart.otherPrefix': 'Other',
        'chart.legendHint': 'Click a legend item to hide or show that conversation',
        'chart.seriesNote': 'up to 8 conversations',
        'chart.range': 'Range',
        'chart.rangeAll': 'All',
        'chart.rangePlaceholder': 'Turns per view',
        'chart.rangeInvalid': 'Enter a positive integer',
        'unit.conversations': 'conversations',
        'turn.label': 'Conversation',
        'turn.turnLabel': 'this turn',
        'turn.open': 'View usage',
        'turn.tooltip': 'Conversation total and this turn’s price',
        'color.label': 'Badge color',
        'color.custom': 'Custom color',
        'view.label': 'Usage',
        'list.title': 'Conversations',
        'list.note': 'Sorted by the selected metric; click to open',
        'list.showing': 'Showing',
        'list.more': 'Show more',
        'list.empty': 'No conversations to show',
        'list.untitled': 'Untitled conversation',
        'list.subagent': 'subagent',
        'list.current': 'current',
        'list.open': 'Open conversation',
        'turns.title': 'Turns',
        'turns.note': 'Click a turn to open this conversation',
        'turns.empty': 'This conversation has no usage yet',
        'foot.estimate': 'Prices are estimated from token counts and public DeepSeek list prices.',
        'foot.peakOn': 'Peak window: higher peak rates apply.',
        'foot.peakOff': 'Off-peak window.',
        'foot.generated': 'Updated',
        'foot.warnings': 'conversations failed to load',
        'open.failed': 'Could not open that conversation. Try the sidebar.',
        'error.title': 'Could not read usage',
        'error.retry': 'Retry',
        'chip.title': 'Current conversation usage; click for details',
        'chip.error': 'usage unavailable',
        'chip.stale': 'may be stale',
        'chip.staleTitle': 'The last refresh failed; showing the last successful value',
        'project.unknown': 'No project recorded',
        'model.unknown': 'unknown model',
        'update.check': 'Check for updates',
        'update.checking': 'Checking…',
        'update.hint': 'Checking for updates contacts the GitHub API',
        'update.available': 'Update available',
        'update.current': 'Current',
        'update.latest': 'Latest',
        'update.open': 'View release',
        'update.dismiss': 'Dismiss',
        'update.upToDate': 'Up to date',
        'update.failed': 'Update check failed',
      },
    }

    const SCOPES = [
      { id: 'current', labelKey: 'scope.current' },
      { id: 'project', labelKey: 'scope.project' },
      { id: 'all', labelKey: 'scope.all' },
    ]

    const METRICS = [
      { id: 'cost', labelKey: 'metric.cost', kind: 'money' },
      { id: 'tokens', labelKey: 'metric.tokens', kind: 'tokens' },
      { id: 'input', labelKey: 'metric.input', kind: 'tokens' },
      { id: 'output', labelKey: 'metric.output', kind: 'tokens' },
      { id: 'cacheRead', labelKey: 'metric.cacheRead', kind: 'tokens' },
    ]

    // Categorical series colors: chart artwork, chosen for contrast on both
    // light and dark surfaces. The aggregate series uses a neutral gray.
    const SERIES_COLORS = ['#4C6EF5', '#12B886', '#F08C00', '#E64980', '#7950F2', '#1098AD', '#F76707', '#AE3EC9']
    const OTHER_COLOR = '#868E96'

    const CSS = `
.dsu-panel{height:100%;box-sizing:border-box;overflow:auto;padding:28px 32px 56px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.5}
.dsu-inner{max-width:1060px;margin:0 auto;display:flex;flex-direction:column;gap:18px}
.dsu-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
.dsu-title{font-size:18px;font-weight:600;letter-spacing:-0.01em;margin:0}
.dsu-sub{font-size:12px;color:var(--dsw-alias-label-secondary);margin-top:2px}
.dsu-inline{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.dsu-btn{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;cursor:pointer;white-space:nowrap}
.dsu-btn:hover{border-color:var(--dsw-alias-border-l2)}
.dsu-btn:focus-visible,.dsu-seg-btn:focus-visible,.dsu-metric:focus-visible,.dsu-row:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.dsu-toolbar{display:flex;align-items:flex-start;gap:22px;flex-wrap:wrap}
.dsu-group{display:flex;flex-direction:column;gap:5px;min-width:0}
.dsu-group-label{font-size:10.5px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.dsu-seg{display:inline-flex;padding:2px;gap:2px;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-layer-2);flex-wrap:wrap;max-width:100%}
.dsu-seg-btn{height:24px;padding:0 10px;border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer;white-space:nowrap;max-width:280px;overflow:hidden;text-overflow:ellipsis}
.dsu-seg-btn:hover:not(:disabled){color:var(--dsw-alias-label-primary)}
.dsu-seg-btn.is-on{background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-weight:600;box-shadow:inset 0 0 0 1px var(--dsw-alias-border-l1)}
.dsu-seg-btn:disabled{opacity:.45;cursor:not-allowed}
.dsu-metrics{display:flex;flex-wrap:wrap;gap:6px}
.dsu-metric{height:24px;padding:0 9px;border:1px solid transparent;border-radius:999px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer;white-space:nowrap}
.dsu-metric:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2)}
.dsu-metric.is-on{color:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}
.dsu-colors{display:flex;align-items:center;gap:5px;height:28px}
.dsu-swatch{width:18px;height:18px;padding:0;border:2px solid var(--dsw-alias-bg-layer-1);border-radius:50%;box-shadow:0 0 0 1px var(--dsw-alias-border-l1);cursor:pointer}
.dsu-swatch.is-on{box-shadow:0 0 0 2px var(--dsw-alias-label-primary)}
.dsu-color-input{width:24px;height:22px;padding:0;border:1px solid var(--dsw-alias-border-l1);border-radius:6px;background:var(--dsw-alias-bg-layer-1);cursor:pointer}
.dsu-hint{font-size:12px;color:var(--dsw-alias-label-secondary)}
.dsu-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
.dsu-kpi{border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);padding:12px 14px;min-width:0}
.dsu-kpi-label{font-size:11px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dsu-kpi-value{font-size:20px;font-weight:600;letter-spacing:-0.02em;margin-top:4px;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dsu-kpi-sub{font-size:11px;color:var(--dsw-alias-label-secondary);margin-top:2px;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dsu-card{border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);padding:14px 16px 10px;min-width:0}
.dsu-card-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px;flex-wrap:wrap;row-gap:4px}
.dsu-card-title{font-size:12px;font-weight:600;min-width:0}
.dsu-card-note{font-size:11px;color:var(--dsw-alias-label-secondary);white-space:normal}
.dsu-mode{flex:none}
.dsu-mode .dsu-seg-btn{height:22px;padding:0 8px;font-size:11px}
.dsu-range{display:flex;align-items:center;gap:6px;flex-wrap:wrap;min-width:0}
.dsu-range-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;width:100%;margin:2px 0 8px}
.dsu-range-label{font-size:11px;color:var(--dsw-alias-label-secondary)}
.dsu-range>.dsu-seg-btn{border:1px solid var(--dsw-alias-border-l1);border-radius:6px;height:22px;padding:0 8px;font-size:11px}
.dsu-range-input{width:104px;height:22px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l1);border-radius:6px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:11px;padding:0 6px}
.dsu-range-error{font-size:10.5px;color:var(--dsw-alias-state-error-primary)}
.dsu-chart-wrap{position:relative;width:100%}
.dsu-chart-scroll{width:100%;overflow-x:auto;overflow-y:hidden;overscroll-behavior-x:contain}
.dsu-chart-viewport{position:relative}
.dsu-chart{display:block;width:100%;height:auto;overflow:visible}
.dsu-tip{position:absolute;top:4px;background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:6px 8px;font-size:11px;line-height:1.4;white-space:normal;pointer-events:none;z-index:3;min-width:150px;max-width:min(300px, calc(100% - 8px))}
.dsu-tip-head{font-size:10.5px;font-weight:600;color:var(--dsw-alias-label-secondary);margin-bottom:3px}
.dsu-tip-row{display:grid;grid-template-columns:7px minmax(0,1fr) auto;gap:6px;align-items:center}
.dsu-tip-dot{width:6px;height:6px;border-radius:50%}
.dsu-tip-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:170px}
.dsu-tip-value{font-variant-numeric:tabular-nums;font-weight:600}
.dsu-tip-foot{margin-top:3px;font-size:10px;color:var(--dsw-alias-label-secondary)}
.dsu-legend{display:flex;flex-wrap:wrap;align-items:center;gap:5px 10px;margin-top:6px;padding-top:8px;border-top:1px solid var(--dsw-alias-border-l1)}
.dsu-legend-item{display:inline-flex;align-items:center;gap:5px;min-width:0;padding:2px 6px;border:1px solid transparent;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:11px;cursor:pointer}
.dsu-legend-item:hover{background:var(--dsw-alias-bg-layer-2)}
.dsu-legend-item.is-off{opacity:.45}
.dsu-legend-dot{width:8px;height:8px;border-radius:50%;flex:none}
.dsu-legend-label{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px}
.dsu-legend-project{font-weight:400;color:var(--dsw-alias-label-secondary)}
.dsu-legend-value{font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary);font-weight:600}
.dsu-legend-hint{font-size:10.5px;color:var(--dsw-alias-label-secondary);margin-left:auto}
.dsu-tip b{font-variant-numeric:tabular-nums}
.dsu-tip-label{color:var(--dsw-alias-label-secondary)}
.dsu-list{display:flex;flex-direction:column;gap:2px}
.dsu-more{display:flex;justify-content:center;padding:8px 0 2px}
.dsu-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(70px,140px) 108px;gap:12px;align-items:center;width:100%;padding:9px 10px;border:1px solid transparent;border-radius:9px;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}
.dsu-row:hover{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-border-l1)}
.dsu-row.is-current{background:var(--dsw-alias-bg-layer-2)}
.dsu-row-title{font-size:12.5px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dsu-row-sub{font-size:11px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px}
.dsu-bar{height:5px;border-radius:999px;background:var(--dsw-alias-bg-layer-2);overflow:hidden}
.dsu-bar-fill{display:block;height:100%;border-radius:999px;background:var(--dsw-alias-brand-primary);min-width:2px}
.dsu-row-value{text-align:right;font-size:12px;font-variant-numeric:tabular-nums;white-space:nowrap}
.dsu-row-meta{text-align:right;font-size:11px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;white-space:nowrap;margin-top:1px}
.dsu-turns .dsu-row{grid-template-columns:minmax(0,1fr) 84px 132px}
.dsu-empty{display:flex;align-items:center;justify-content:center;min-height:120px;color:var(--dsw-alias-label-secondary);font-size:12px;text-align:center;padding:12px}
.dsu-error{border:1px solid var(--dsw-alias-state-error-primary);border-radius:10px;padding:10px 12px;color:var(--dsw-alias-state-error-primary);font-size:12px;background:var(--dsw-alias-bg-layer-1);display:flex;align-items:center;justify-content:space-between;gap:12px}
.dsu-error-text{min-width:0;word-break:break-word}
.dsu-update{position:relative;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;padding:10px 12px 10px 16px;background:var(--dsw-alias-bg-layer-2)}
.dsu-update::before{content:'';position:absolute;left:0;top:8px;bottom:8px;width:3px;border-radius:3px;background:var(--dsw-alias-brand-primary)}
.dsu-update-main{min-width:0}
.dsu-update-title{font-size:12px;font-weight:600;color:var(--dsw-alias-brand-primary)}
.dsu-update-sub{font-size:11px;color:var(--dsw-alias-label-secondary);margin-top:2px}
.dsu-update-actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.dsu-update-link{text-decoration:none}
.dsu-update-ok{color:var(--dsw-alias-state-success-primary, var(--dsw-alias-brand-primary))}
.dsu-update-error{color:var(--dsw-alias-state-error-primary);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsu-foot{font-size:11px;color:var(--dsw-alias-label-secondary);display:flex;flex-wrap:wrap;gap:4px 12px}
.dsu-spin{width:12px;height:12px;border-radius:50%;border:2px solid var(--dsw-alias-border-l2);border-top-color:var(--dsw-alias-brand-primary);animation:dsu-spin .8s linear infinite;display:inline-block;vertical-align:-2px;margin-right:6px}
@keyframes dsu-spin{to{transform:rotate(360deg)}}
@media (max-width:640px){.dsu-panel{padding:18px 16px 40px}.dsu-row{grid-template-columns:minmax(0,1fr) 92px}.dsu-bar{display:none}.dsu-turns .dsu-row{grid-template-columns:minmax(0,1fr) 110px}}
`

    const currentStore = { sessionId: '', cwd: '', title: '' }
    const currentListeners = new Set()

    function setCurrentSession(patch) {
      let changed = false
      if (patch.sessionId !== undefined && patch.sessionId !== currentStore.sessionId) {
        cancelChatTurnNavigation()
        currentStore.sessionId = patch.sessionId
        // A different conversation must not inherit the previous title or cwd.
        currentStore.title = ''
        currentStore.cwd = ''
        changed = true
      }
      for (const key of ['title', 'cwd']) {
        if (patch[key] !== undefined && patch[key] !== currentStore[key]) {
          currentStore[key] = patch[key]
          changed = true
        }
      }
      if (changed) {
        for (const listener of currentListeners) {
          try {
            listener()
          } catch {
            // A listener that throws must not break the writer.
          }
        }
      }
    }

    function useCurrentSession() {
      const force = React.useReducer((n) => n + 1, 0)[1]
      React.useEffect(() => {
        currentListeners.add(force)
        return () => currentListeners.delete(force)
      }, [force])
      return currentStore
    }

    // Turn-badge accent: one shared preference, defaulting to white; changeable
    // from the usage panel.
    const TURN_COLOR_KEY = 'dsh-session-usage.turnColor'
    const DEFAULT_TURN_COLOR = '#FFFFFF'
    const TURN_COLOR_PRESETS = ['#FFFFFF', '#F08C00', '#E03131', '#4C6EF5', '#2F9E44', '#9C36B5', '#0C8599']
    const appearance = { turnColor: DEFAULT_TURN_COLOR }
    const appearanceListeners = new Set()

    function normalizeColor(value) {
      const text = String(value || '').trim()
      if (/^#[0-9a-fA-F]{6}$/.test(text)) return text.toUpperCase()
      if (/^#[0-9a-fA-F]{3}$/.test(text)) {
        return `#${text.slice(1).split('').map((part) => part + part).join('')}`.toUpperCase()
      }
      return ''
    }

    function storedTurnColor() {
      try {
        return normalizeColor(window.localStorage.getItem(TURN_COLOR_KEY)) || DEFAULT_TURN_COLOR
      } catch {
        return DEFAULT_TURN_COLOR
      }
    }

    appearance.turnColor = storedTurnColor()

    function setTurnColor(value) {
      const color = normalizeColor(value) || DEFAULT_TURN_COLOR
      if (color === appearance.turnColor) return
      appearance.turnColor = color
      try {
        window.localStorage.setItem(TURN_COLOR_KEY, color)
      } catch {
        // A read-only storage area still keeps the in-memory choice.
      }
      for (const listener of appearanceListeners) {
        try {
          listener()
        } catch {
          // Keep other listeners alive.
        }
      }
    }

    function useTurnColor() {
      const force = React.useReducer((n) => n + 1, 0)[1]
      React.useEffect(() => {
        appearanceListeners.add(force)
        return () => appearanceListeners.delete(force)
      }, [force])
      return appearance.turnColor
    }

    // The Chat View does not consume `openView`'s focus payload. Reproduce the
    // native turn-rail navigation after the Usage View switches back to Chat.
    let chatTurnNavigation = 0
    const chatTurnTimers = new Set()

    function cancelChatTurnNavigation() {
      chatTurnNavigation += 1
      for (const timer of chatTurnTimers) window.clearTimeout(timer)
      chatTurnTimers.clear()
    }

    function scheduleChatTurn(attempt, delay) {
      const timer = window.setTimeout(() => {
        chatTurnTimers.delete(timer)
        attempt()
      }, delay)
      chatTurnTimers.add(timer)
      return timer
    }

    function turnRailScroller(nav) {
      for (const element of nav.querySelectorAll('*')) {
        const overflow = getComputedStyle(element).overflowY
        if ((overflow === 'auto' || overflow === 'scroll') && element.scrollHeight > element.clientHeight + 1) {
          return element
        }
      }
      return null
    }

    function turnMarkFor(nav, turn) {
      const numbered = Array.from(nav.querySelectorAll('button[data-index]')).find((button) => {
        const label = button.getAttribute('aria-label') || ''
        return new RegExp(`(^|\\D)${turn}(\\D|$)`).test(label)
      })
      if (numbered) return numbered
      return nav.querySelector(`button[data-index="${turn - 1}"]`)
    }

    function focusChatTurn(value, sessionId) {
      const turn = Number(value)
      if (!Number.isSafeInteger(turn) || turn < 1 || typeof document === 'undefined') return
      const targetSession = String(sessionId || '')
      if (targetSession && currentStore.sessionId && currentStore.sessionId !== targetSession) return
      cancelChatTurnNavigation()
      const token = ++chatTurnNavigation
      let attempts = 0

      const attempt = () => {
        if (token !== chatTurnNavigation) return
        if (targetSession && currentStore.sessionId && currentStore.sessionId !== targetSession) return
        const roots = Array.from(document.querySelectorAll('[data-conversation-scroll]'))
          .filter((element) => element.getClientRects().length > 0)
        const root = roots[roots.length - 1] || document
        let navs = Array.from(root.querySelectorAll('nav')).filter((nav) => nav.querySelector('button[data-index]'))
        if (!navs.length && root !== document) {
          navs = Array.from(document.querySelectorAll('nav')).filter((nav) => nav.querySelector('button[data-index]'))
        }
        for (const nav of navs) {
          const mark = turnMarkFor(nav, turn)
          if (mark) {
            mark.click()
            return
          }
          const scroller = turnRailScroller(nav)
          if (scroller) scroller.scrollTop = Math.max(0, (turn - 1) * 10 - 30)
        }

        const target = root.querySelector(`[data-chat-turn="${turn}"]`)
        if (target) {
          target.scrollIntoView({ block: 'start', behavior: 'smooth' })
          return
        }

        if (attempts === 24) {
          const transcript = root === document ? document.querySelector('[data-conversation-scroll]') : root
          if (transcript) transcript.scrollTop = 0
        }
        attempts += 1
        if (attempts < 60) scheduleChatTurn(attempt, 50)
      }

      scheduleChatTurn(attempt, 40)
    }

    function tint(hex, alpha) {
      const value = normalizeColor(hex).slice(1)
      const r = Number.parseInt(value.slice(0, 2), 16)
      const g = Number.parseInt(value.slice(2, 4), 16)
      const b = Number.parseInt(value.slice(4, 6), 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }

    function translate(ctx, key) {
      let active = ''
      try {
        const locale = ctx.get('locale')
        if (locale && typeof locale.getLocale === 'function') {
          active = String(locale.getLocale().active || '')
        }
        if (locale && typeof locale.bind === 'function') {
          const text = locale.bind(NS)(key)
          if (typeof text === 'string' && text !== '' && text !== key) return text
        }
      } catch {
        // Fall back to the bundled dictionaries.
      }
      if (/^zh/i.test(active)) return DICT.zh[key] || DICT.en[key] || key
      return DICT.en[key] || key
    }

    function useTranslate(ctx) {
      const force = React.useReducer((n) => n + 1, 0)[1]
      React.useEffect(() => {
        const locale = ctx.get('locale')
        if (!locale || typeof locale.subscribe !== 'function') return undefined
        return locale.subscribe(() => force())
      }, [ctx, force])
      return React.useCallback((key) => translate(ctx, key), [ctx])
    }

    function registerLocale(ctx) {
      const locale = ctx.get('locale')
      if (!locale || typeof locale.register !== 'function') return () => {}
      const disposers = []
      for (const [id, dict] of Object.entries(DICT)) {
        try {
          disposers.push(locale.register(NS, id, dict))
        } catch {
          // A duplicate registration from a hot reload is harmless.
        }
      }
      return () => {
        for (const dispose of disposers) {
          try {
            dispose()
          } catch {
            // Ignore a disposer that already ran.
          }
        }
      }
    }

    async function queryUsage(payload, signal) {
      const response = await fetch('api/session-usage/query', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload || {}),
        signal,
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      let body = null
      try {
        body = await response.json()
      } catch {
        throw new Error('The usage endpoint returned an unreadable response.')
      }
      if (!body || body.ok !== true) {
        const message = body && body.error && body.error.message
        throw new Error(message || 'The usage endpoint failed.')
      }
      return body
    }

    async function checkForUpdate() {
      const init = {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ force: true }),
      }
      if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
        init.signal = AbortSignal.timeout(12000)
      }
      const response = await fetch('api/session-usage/update', init)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      let body = null
      try {
        body = await response.json()
      } catch {
        throw new Error('The update endpoint returned an unreadable response.')
      }
      if (!body || body.ok !== true) {
        const message = body && body.error && body.error.message
        throw new Error(message || 'The update endpoint failed.')
      }
      return body
    }

    function useQuery(ctx, scope, sessionId) {
      const [state, setState] = React.useState({ data: null, error: '', loading: true })
      const [nonce, setNonce] = React.useState(0)
      const forceNext = React.useRef(false)
      React.useEffect(() => {
        let alive = true
        let controller = null
        let timer = null
        const schedule = () => {
          if (!alive) return
          timer = window.setTimeout(load, 15000)
        }
        const load = () => {
          if (!alive) return
          if (timer) {
            window.clearTimeout(timer)
            timer = null
          }
          controller = new AbortController()
          const force = forceNext.current
          forceNext.current = false
          setState((previous) => ({ ...previous, loading: true, error: '' }))
          queryUsage({ scope, sessionId: sessionId || undefined, refresh: force }, controller.signal)
            .then((data) => {
              if (alive) setState({ data, error: '', loading: false })
            })
            .catch((error) => {
              if (!alive || error?.name === 'AbortError') return
              setState((previous) => ({ ...previous, loading: false, error: String(error?.message || error) }))
            })
            .finally(schedule)
        }
        load()
        return () => {
          alive = false
          if (timer) window.clearTimeout(timer)
          if (controller) controller.abort()
        }
      }, [scope, sessionId, nonce])
      return {
        ...state,
        refresh: React.useCallback(() => {
          forceNext.current = true
          setNonce((value) => value + 1)
        }, []),
      }
    }

    // Shared one-session snapshot for turn badges: many completed turns mount
    // at once, and one request per conversation covers all of them.
    const sharedUsage = new Map()

    function loadSessionUsage(sessionId, force = false) {
      const cached = sharedUsage.get(sessionId)
      if (cached?.promise) return cached.promise
      if (!force && cached?.data && Date.now() - cached.at < 60000) return Promise.resolve(cached.data)
      const promise = queryUsage({ scope: 'current', sessionId })
        .then((data) => {
          sharedUsage.set(sessionId, {
            data,
            at: Date.now(),
            maxSeq: Number(data.maxSeq) || 0,
          })
          return data
        })
        .catch((error) => {
          const current = sharedUsage.get(sessionId)
          if (current?.promise === promise) sharedUsage.delete(sessionId)
          throw error
        })
      sharedUsage.set(sessionId, { ...(cached || {}), promise })
      return promise
    }

    function getTurnData(sessionId, seq) {
      const requested = Number(seq) || 0
      const cached = sharedUsage.get(sessionId)
      const stale = !cached?.data || Number(cached.maxSeq) < requested
      return loadSessionUsage(sessionId, stale)
        .then((data) => {
          if (Number(data?.maxSeq) >= requested) return data
          // A request that started before this turn cannot satisfy it; wait for
          // that shared promise, then make one fresh request.
          return loadSessionUsage(sessionId, true)
        })
        .then((data) => (Number(data?.maxSeq) >= requested ? data : null))
    }

    function money(value, symbol) {
      const n = Number(value) || 0
      const prefix = symbol || '¥'
      if (n === 0) return `${prefix}0`
      if (n < 0.01) return `${prefix}${n.toFixed(4)}`
      if (n < 1) return `${prefix}${n.toFixed(3)}`
      return `${prefix}${n.toFixed(2)}`
    }

    function compact(value) {
      const n = Number(value) || 0
      if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`
      if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
      if (n >= 1e4) return `${Math.round(n / 1e3)}k`
      if (n >= 1000) return `${(n / 1e3).toFixed(1)}k`
      return String(Math.round(n))
    }

    function full(value) {
      try {
        return new Intl.NumberFormat().format(Math.round(Number(value) || 0))
      } catch {
        return String(Math.round(Number(value) || 0))
      }
    }

    function pct(value) {
      const n = Number(value) || 0
      return `${(n * 100).toFixed(1)}%`
    }

    function symbolOf(currency) {
      if (currency === 'USD') return '$'
      if (currency === 'EUR') return '€'
      if (currency === 'CNY' || !currency) return '¥'
      return `${currency} `
    }

    function metricValue(item, metric) {
      if (!item) return 0
      if (metric.id === 'cost') return Number(item.cost) || 0
      return Number(item[metric.id]) || 0
    }

    function formatMetric(item, metric, symbol) {
      return metric.kind === 'money' ? money(metricValue(item, metric), symbol) : compact(metricValue(item, metric))
    }

    function formatAxis(value, metric, symbol) {
      return metric.kind === 'money' ? money(value, symbol) : compact(value)
    }

    function formatRaw(value, metric, symbol) {
      return metric.kind === 'money' ? money(value, symbol) : compact(value)
    }

    function projectLabel(cwd) {
      const text = String(cwd || '').replace(/[\\/]+$/, '')
      const parts = text.split(/[\\/]/)
      return parts[parts.length - 1] || text
    }

    function localeTag(ctx) {
      try {
        const locale = ctx.get('locale')
        const snapshot = locale && typeof locale.getLocale === 'function' ? locale.getLocale() : null
        return (snapshot && snapshot.active) || 'zh-CN'
      } catch {
        return 'zh-CN'
      }
    }

    function formatDate(ctx, timestamp) {
      const time = Number(timestamp)
      if (!Number.isFinite(time) || time <= 0) return ''
      try {
        return new Intl.DateTimeFormat(localeTag(ctx), {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(new Date(time))
      } catch {
        return ''
      }
    }

    function formatClock(ctx, timestamp) {
      const time = Number(timestamp)
      if (!Number.isFinite(time) || time <= 0) return ''
      try {
        return new Intl.DateTimeFormat(localeTag(ctx), {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(new Date(time))
      } catch {
        return ''
      }
    }

    function openSession(ctx, id) {
      if (!id) return false
      try {
        const workspace = ctx.get('uiWorkspace')
        if (workspace && typeof workspace.openSession === 'function') {
          workspace.openSession(id)
          return true
        }
      } catch {
        // Report the failure to the caller.
      }
      return false
    }

    function openPanel(ctx) {
      try {
        const layout = ctx.get('layout')
        if (layout && typeof layout.selectPanel === 'function') layout.selectPanel(PANEL_ID)
      } catch {
        // The sidebar entry remains the fallback navigation.
      }
    }

    function readMetricPref() {
      try {
        const value = window.localStorage.getItem(PREF_METRIC)
        if (METRICS.some((metric) => metric.id === value)) return value
      } catch {
        // Storage can be unavailable in hardened views.
      }
      return 'cost'
    }

    function writeMetricPref(value) {
      try {
        window.localStorage.setItem(PREF_METRIC, value)
      } catch {
        // Preference persistence is best effort.
      }
    }

    function StyleTag() {
      return h('style', { dangerouslySetInnerHTML: { __html: CSS } })
    }

    function ChartIcon({ size }) {
      const edge = typeof size === 'number' && size > 0 ? size : 16
      return h('svg', {
        viewBox: '0 0 24 24',
        width: edge,
        height: edge,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.7,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
        style: { display: 'block' },
      },
        h('path', { d: 'M4 19V5' }),
        h('path', { d: 'M4 19h16' }),
        h('path', { d: 'M7 15l4-4 3 2 5-6' }),
      )
    }

    function RefreshIcon() {
      return h('svg', {
        viewBox: '0 0 24 24',
        width: 13,
        height: 13,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.7,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
      },
        h('path', { d: 'M20 12a8 8 0 1 1-2.3-5.6' }),
        h('path', { d: 'M20 4v5h-5' }),
      )
    }

    function UpdateIcon() {
      return h('svg', {
        viewBox: '0 0 24 24',
        width: 13,
        height: 13,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.7,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
      },
        h('path', { d: 'M12 3v12' }),
        h('path', { d: 'm7 10 5 5 5-5' }),
        h('path', { d: 'M4 21h16' }),
      )
    }

    function Kpi({ label, value, sub }) {
      return h('div', { className: 'dsu-kpi' },
        h('div', { className: 'dsu-kpi-label' }, label),
        h('div', { className: 'dsu-kpi-value' }, value),
        sub ? h('div', { className: 'dsu-kpi-sub' }, sub) : null,
      )
    }

    function Empty({ text }) {
      return h('div', { className: 'dsu-empty' }, text)
    }

    function niceMax(value) {
      const n = Number(value) || 0
      if (!(n > 0)) return 1
      const exponent = Math.floor(Math.log10(n))
      const base = 10 ** exponent
      const scaled = n / base
      const step = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 5 ? 5 : 10
      return step * base
    }

    function cumulativeOf(points, metric) {
      const ordered = [...points].sort((a, b) => Number(a.turn) - Number(b.turn))
      let total = 0
      const values = []
      for (const point of ordered) {
        total += metricValue(point, metric)
        values.push({ turn: Number(point.turn) || 0, value: total, point })
      }
      return { values, total }
    }

    function pointValuesOf(points, metric) {
      const ordered = [...points].sort((a, b) => Number(a.turn) - Number(b.turn))
      let total = 0
      const values = ordered.map((point) => {
        const value = metricValue(point, metric)
        total += value
        return { turn: Number(point.turn) || 0, value, point }
      })
      return { values, total }
    }

    function UsageChart({ mode, daily, turns, metric, symbol, t, showProject, turnWindow, rangeNonce, sessionKey, onPick }) {
      const width0 = 760
      const height = 252
      const padLeft = 58
      const padRight = 16
      const padTop = 18
      const padBottom = 30
      const baseY = height - padBottom
      const [hover, setHover] = React.useState(-1)
      const [hidden, setHidden] = React.useState(() => new Set())
      const [tip, setTip] = React.useState(null)
      const [tipPos, setTipPos] = React.useState(null)
      const wrapRef = React.useRef(null)
      const scrollRef = React.useRef(null)
      const tipRef = React.useRef(null)
      let width = width0

      const dailyPoints = React.useMemo(() => (Array.isArray(daily) ? daily : []), [daily])
      const items = React.useMemo(() => {
        if (mode !== 'turns' && mode !== 'turnValue') return []
        const list = []
        const source = turns && Array.isArray(turns.series) ? turns.series : []
        source.forEach((entry, index) => {
          const points = Array.isArray(entry.points) ? entry.points : []
          list.push({
            id: entry.id || `series-${index}`,
            color: SERIES_COLORS[index % SERIES_COLORS.length],
            points,
            label: entry.title || t('list.untitled'),
            project: showProject ? projectLabel(entry.cwd) : '',
            other: false,
            total: Number(entry.cost) || 0,
            tokens: Number(entry.tokens) || 0,
            series: mode === 'turnValue' ? pointValuesOf(points, metric) : cumulativeOf(points, metric),
          })
        })
        const other = turns && turns.other
        if (other && Array.isArray(other.points) && other.points.length > 0) {
          list.push({
            id: '__other__',
            color: OTHER_COLOR,
            points: other.points,
            label: `${t('chart.otherPrefix')} ${other.count} ${t('unit.conversations')}`,
            project: '',
            other: true,
            total: Number(other.cost) || 0,
            tokens: Number(other.tokens) || 0,
            series: mode === 'turnValue' ? pointValuesOf(other.points, metric) : cumulativeOf(other.points, metric),
          })
        }
        return list
      }, [mode, turns, metric, t, showProject])

      const itemsKey = items.map((item) => item.id).join('|')
      React.useEffect(() => {
        setHidden((previous) => {
          const allowed = new Set(items.map((item) => item.id))
          const next = new Set([...previous].filter((id) => allowed.has(id)))
          return next.size === previous.size ? previous : next
        })
      }, [itemsKey])

      const visible = items.filter((item) => !hidden.has(item.id))
      const maxTurn = Math.max(
        1,
        Number(turns?.maxTurn) || 0,
        ...items.map((item) => (item.series.values.length > 0
          ? item.series.values[item.series.values.length - 1].turn
          : 0)),
      )
      const dailyValues = dailyPoints.map((point) => metricValue(point, metric))
      let peak = 0
      if (mode === 'days') {
        for (const value of dailyValues) peak = Math.max(peak, value)
      } else if (mode === 'turns') {
        for (const item of visible) peak = Math.max(peak, item.series.total)
      } else {
        for (const item of visible) {
          for (const entry of item.series.values) peak = Math.max(peak, entry.value)
        }
      }
      const max = niceMax(peak)
      const TURN_STEP = 42
      const limited = mode !== 'days' && Number.isSafeInteger(turnWindow) && turnWindow > 0
      const contentWidth = limited
        ? Math.max(padLeft + padRight + TURN_STEP, padLeft + padRight + Math.max(1, maxTurn - 1) * TURN_STEP)
        : width0
      const viewportWidth = limited
        ? Math.min(contentWidth, padLeft + padRight + Math.max(1, turnWindow) * TURN_STEP)
        : width0
      width = contentWidth
      const span = width - padLeft - padRight
      const xDay = (index) => (dailyPoints.length <= 1
        ? padLeft + span / 2
        : padLeft + (index / (dailyPoints.length - 1)) * span)
      const xTurn = (turn) => {
        if (maxTurn <= 1) return padLeft + span / 2
        const clamped = Math.max(1, Math.min(maxTurn, Number(turn) || 1))
        return padLeft + ((clamped - 1) / (maxTurn - 1)) * span
      }
      const yOf = (value) => padTop + (1 - value / max) * (baseY - padTop)

      function pointerOf(event) {
        const rect = event.currentTarget.getBoundingClientRect()
        if (!rect.width || !rect.height) return null
        return {
          x: ((event.clientX - rect.left) / rect.width) * width,
          y: ((event.clientY - rect.top) / rect.height) * height,
        }
      }

      function onMove(event) {
        const pointer = pointerOf(event)
        if (!pointer) return
        const wrap = wrapRef.current
        if (wrap) {
          const rect = wrap.getBoundingClientRect()
          setTip({ x: event.clientX - rect.left, y: event.clientY - rect.top })
        }
        if (pointer.x < padLeft || pointer.x > width - padRight
          || pointer.y < padTop || pointer.y > baseY) {
          setHover(-1)
          setTip(null)
          setTipPos(null)
          return
        }
        if (mode === 'days') {
          if (dailyPoints.length === 0) return
          let best = 0
          let distance = Infinity
          for (let index = 0; index < dailyPoints.length; index += 1) {
            const current = Math.abs(xDay(index) - pointer.x)
            if (current < distance) {
              distance = current
              best = index
            }
          }
          setHover(best)
          return
        }
        const ratio = (pointer.x - padLeft) / Math.max(1, span)
        setHover(Math.max(1, Math.min(maxTurn, Math.round(1 + ratio * (maxTurn - 1)))))
      }

      const safeHover = mode === 'days'
        ? (hover >= 0 && hover < dailyPoints.length ? hover : -1)
        : (hover >= 1 && hover <= maxTurn ? hover : -1)
      const hoverX = safeHover < 0 ? 0 : (mode === 'days' ? xDay(safeHover) : xTurn(safeHover))

      const toggle = (id) => {
        setHidden((previous) => {
          const next = new Set(previous)
          if (next.has(id)) next.delete(id)
          else next.add(id)
          return next
        })
      }

      const valueAt = (item, turn) => {
        if (mode === 'turnValue') {
          const exact = item.series.values.find((entry) => entry.turn === turn)
          return exact ? exact.value : 0
        }
        let value = 0
        for (const entry of item.series.values) {
          if (entry.turn <= turn) value = entry.value
          else break
        }
        return value
      }

      const dailyLine = dailyValues
        .map((value, index) => `${index === 0 ? 'M' : 'L'}${xDay(index).toFixed(2)} ${yOf(value).toFixed(2)}`)
        .join(' ')
      const dailyArea = dailyPoints.length > 1
        ? `${dailyLine} L${xDay(dailyPoints.length - 1).toFixed(2)} ${baseY} L${xDay(0).toFixed(2)} ${baseY} Z`
        : ''

      const turnPaths = mode === 'turns' || mode === 'turnValue'
        ? visible.map((item) => ({
          item,
          line: item.series.values
            .map((entry, index) => `${index === 0 ? 'M' : 'L'}${xTurn(entry.turn).toFixed(2)} ${yOf(entry.value).toFixed(2)}`)
            .join(' '),
        }))
        : []
      const singlePath = turnPaths.length === 1 ? turnPaths[0] : null
      const singleArea = singlePath && singlePath.item.series.values.length > 1
        ? (() => {
          const values = singlePath.item.series.values
          return `${singlePath.line} L${xTurn(values[values.length - 1].turn).toFixed(2)} ${baseY} L${xTurn(values[0].turn).toFixed(2)} ${baseY} Z`
        })()
        : ''

      const tooltipRows = []
      if (safeHover >= 0) {
        if (mode === 'days') {
          tooltipRows.push({
            key: 'daily',
            color: 'var(--dsw-alias-brand-primary)',
            label: t('chart.days'),
            value: dailyValues[safeHover],
          })
        } else {
          for (const item of visible) {
            const value = valueAt(item, safeHover)
            if (value > 0 || visible.length === 1) {
              tooltipRows.push({
                key: item.id,
                color: item.color,
                label: item.project ? `${item.label} · ${item.project}` : item.label,
                value,
              })
            }
          }
          tooltipRows.sort((a, b) => b.value - a.value)
        }
      }

      React.useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollLeft = 0
      }, [turnWindow, rangeNonce, sessionKey])

      React.useLayoutEffect(() => {
        const wrap = wrapRef.current
        const card = tipRef.current
        if (!wrap || !card || !tip || safeHover < 0) return
        const wrapRect = wrap.getBoundingClientRect()
        const area = (scrollRef.current || wrap).getBoundingClientRect()
        const areaLeft = area.left - wrapRect.left
        const areaTop = area.top - wrapRect.top
        const areaWidth = area.width
        const areaHeight = area.height
        const cardWidth = card.offsetWidth
        const cardHeight = card.offsetHeight
        const gap = 12
        const edge = 4
        let left = tip.x + gap
        if (left + cardWidth > areaLeft + areaWidth - edge) left = tip.x - gap - cardWidth
        left = Math.max(areaLeft + edge, Math.min(left, areaLeft + areaWidth - cardWidth - edge))
        let top = tip.y + gap
        if (top + cardHeight > areaTop + areaHeight - edge) top = tip.y - gap - cardHeight
        top = Math.max(areaTop + edge, Math.min(top, areaTop + areaHeight - cardHeight - edge))
        setTipPos((previous) => (
          previous && Math.abs(previous.left - left) < 0.5 && Math.abs(previous.top - top) < 0.5
            ? previous
            : { left, top }
        ))
      }, [tip, safeHover, tooltipRows.length])

      const labelStepDays = Math.max(1, Math.ceil(dailyPoints.length / 7))
      const labelStepTurns = Math.max(1, Math.ceil((limited ? turnWindow : maxTurn) / 8))
      const turnLabelValues = []
      if (mode === 'turns' || mode === 'turnValue') {
        turnLabelValues.push(1)
        for (let turn = 1 + labelStepTurns; turn < maxTurn; turn += labelStepTurns) turnLabelValues.push(turn)
        if (maxTurn > 1 && turnLabelValues[turnLabelValues.length - 1] !== maxTurn) turnLabelValues.push(maxTurn)
      }

      return h('div', { className: 'dsu-chart-wrap', ref: wrapRef },
        h('div', {
          className: 'dsu-chart-scroll',
          ref: scrollRef,
          onScroll: () => {
            setHover(-1)
            setTip(null)
            setTipPos(null)
          },
        },
          h('div', {
            className: 'dsu-chart-viewport',
            style: limited ? { width: `${viewportWidth}px` } : { width: '100%' },
          },
            h('svg', {
              className: 'dsu-chart',
              viewBox: `0 0 ${width} ${height}`,
              role: 'img',
              'aria-label': t(mode === 'days' ? 'chart.days' : (mode === 'turnValue' ? 'chart.turnValue' : 'chart.turns')),
              onMouseMove: onMove,
              onMouseLeave: () => {
                setHover(-1)
                setTip(null)
                setTipPos(null)
              },
              style: limited
                ? { width: `${contentWidth}px`, height: `${height}px` }
                : { width: '100%', height: 'auto' },
            },
          typeof onPick === 'function' && mode !== 'days'
            ? h('title', null, t('chart.clickHint'))
            : null,
          [0, 0.25, 0.5, 0.75, 1].map((fraction) => {
            const y = yOf(max * fraction)
            return h('g', { key: `tick-${fraction}` },
              h('line', {
                x1: padLeft,
                x2: width - padRight,
                y1: y,
                y2: y,
                stroke: 'var(--dsw-alias-border-l1)',
                strokeWidth: 1,
              }),
              h('text', {
                x: padLeft - 8,
                y: y + 3.5,
                textAnchor: 'end',
                fontSize: 10,
                fill: 'var(--dsw-alias-label-secondary)',
              }, formatAxis(max * fraction, metric, symbol)),
            )
          }),
          mode === 'days'
            ? (dailyArea ? h('path', {
              d: dailyArea,
              fill: 'var(--dsw-alias-brand-primary)',
              fillOpacity: 0.1,
              stroke: 'none',
            }) : null)
            : (singleArea ? h('path', {
              d: singleArea,
              fill: singlePath.item.color,
              fillOpacity: 0.1,
              stroke: 'none',
            }) : null),
          mode === 'days'
            ? h('path', {
              d: dailyLine,
              fill: 'none',
              stroke: 'var(--dsw-alias-brand-primary)',
              strokeWidth: 2.2,
              strokeLinejoin: 'round',
              strokeLinecap: 'round',
            })
            : turnPaths.map(({ item, line }) => h('path', {
              key: `line-${item.id}`,
              d: line,
              fill: 'none',
              stroke: item.color,
              strokeWidth: 2.2,
              strokeLinejoin: 'round',
              strokeLinecap: 'round',
              opacity: 0.95,
            })),
          mode === 'days'
            ? (safeHover >= 0
              ? h('circle', {
                cx: xDay(safeHover),
                cy: yOf(dailyValues[safeHover]),
                r: 4,
                fill: 'var(--dsw-alias-bg-base)',
                stroke: 'var(--dsw-alias-brand-primary)',
                strokeWidth: 2,
              })
              : (dailyPoints.length === 1
                ? h('circle', {
                  cx: xDay(0),
                  cy: yOf(dailyValues[0]),
                  r: 4,
                  fill: 'var(--dsw-alias-bg-base)',
                  stroke: 'var(--dsw-alias-brand-primary)',
                  strokeWidth: 2,
                })
                : null))
            : visible.map((item) => h(React.Fragment, { key: `dots-${item.id}` },
              item.series.values.map((entry) => {
                if (safeHover !== entry.turn) return null
                const clickable = typeof onPick === 'function' && !item.other
                return h('circle', {
                  key: `dot-${item.id}-${entry.turn}`,
                  cx: xTurn(entry.turn),
                  cy: yOf(entry.value),
                  r: 3.6,
                  fill: 'var(--dsw-alias-bg-base)',
                  stroke: item.color,
                  strokeWidth: 1.8,
                  style: clickable ? { cursor: 'pointer' } : undefined,
                  onClick: clickable
                    ? (event) => {
                      event.stopPropagation()
                      onPick({ sessionId: item.id, turn: Number(entry.turn) || 1 })
                    }
                    : undefined,
                })
              }),
            )),
          mode === 'days'
            ? dailyPoints.map((point, index) => {
              if (index % labelStepDays !== 0 && index !== dailyPoints.length - 1) return null
              return h('text', {
                key: `label-${index}`,
                x: xDay(index),
                y: height - 8,
                textAnchor: 'middle',
                fontSize: 10,
                fill: 'var(--dsw-alias-label-secondary)',
              }, point.label)
            })
            : turnLabelValues.map((turn) => h('text', {
              key: `label-turn-${turn}`,
              x: xTurn(turn),
              y: height - 8,
              textAnchor: 'middle',
              fontSize: 10,
              fill: 'var(--dsw-alias-label-secondary)',
            }, `T${turn}`)),
          safeHover >= 0
            ? h('line', {
              x1: hoverX,
              x2: hoverX,
              y1: padTop,
              y2: baseY,
              stroke: 'var(--dsw-alias-border-l2)',
              strokeWidth: 1,
              strokeDasharray: '3 3',
            })
            : null,
            ),
          ),
        ),
        safeHover >= 0 && tip
          ? h('div', {
            className: 'dsu-tip',
            ref: tipRef,
            style: {
              left: `${tipPos ? tipPos.left : tip.x + 12}px`,
              top: `${tipPos ? tipPos.top : tip.y + 12}px`,
              transform: 'none',
            },
          },
            h('div', { className: 'dsu-tip-head' },
              mode === 'days' ? (dailyPoints[safeHover]?.day || dailyPoints[safeHover]?.label) : `T${safeHover}`,
            ),
            tooltipRows.map((row) => h('div', { key: row.key, className: 'dsu-tip-row' },
              h('span', { className: 'dsu-tip-dot', style: { background: row.color } }),
              h('span', { className: 'dsu-tip-name' }, row.label),
              h('span', { className: 'dsu-tip-value' }, formatRaw(row.value, metric, symbol)),
            )),
            mode === 'days' && dailyPoints[safeHover]
              ? h('div', { className: 'dsu-tip-foot' }, `${compact(dailyPoints[safeHover].tokens)} ${t('unit.tokens')}`)
              : null,
          )
          : null,
        (mode === 'turns' || mode === 'turnValue') && items.length > 0
          ? h('div', { className: 'dsu-legend' },
            items.map((item) => h('button', {
              key: item.id,
              type: 'button',
              className: `dsu-legend-item${hidden.has(item.id) ? ' is-off' : ''}`,
              title: [item.label, item.project].filter(Boolean).join(' · '),
              'aria-pressed': !hidden.has(item.id),
              onClick: () => toggle(item.id),
            },
              h('span', { className: 'dsu-legend-dot', style: { background: item.color } }),
              h('span', { className: 'dsu-legend-label' },
                item.label,
                item.project ? h('span', { className: 'dsu-legend-project' }, ` · ${item.project}`) : null,
              ),
              h('span', { className: 'dsu-legend-value' }, formatRaw(item.series.total, metric, symbol)),
            )),
            h('span', { className: 'dsu-legend-hint' }, t('chart.legendHint')),
          )
          : null,
      )
    }

    function createIcon(ctx) {
      return function UsageIcon(props) {
        return h(ChartIcon, { size: props && typeof props.size === 'number' ? props.size : 18 })
      }
    }

    function createChip(ctx) {
      return function UsageChip(props) {
        const t = useTranslate(ctx)
        const sessionId = props && typeof props.sessionId === 'string' ? props.sessionId : ''
        const [summary, setSummary] = React.useState(null)
        const [currency, setCurrency] = React.useState('CNY')
        const [failed, setFailed] = React.useState(false)

        React.useEffect(() => {
          if (!sessionId) return undefined
          setCurrentSession({ sessionId })
          let alive = true
          let latestRequest = 0
          let controller = null
          let timer = null
          const schedule = () => {
            if (!alive) return
            timer = window.setTimeout(load, 8000)
          }
          const load = () => {
            if (!alive) return
            if (timer) {
              window.clearTimeout(timer)
              timer = null
            }
            controller = new AbortController()
            const requestId = ++latestRequest
            queryUsage({ scope: 'current', sessionId }, controller.signal)
              .then((data) => {
                if (!alive || requestId !== latestRequest) return
                setSummary(data.session || data.totals || null)
                setCurrency(data.currency || 'CNY')
                setFailed(false)
                setCurrentSession({
                  sessionId,
                  cwd: data.current?.cwd || '',
                  title: data.current?.title || '',
                })
              })
              .catch((error) => {
                if (!alive || requestId !== latestRequest || error?.name === 'AbortError') return
                setFailed(true)
              })
              .finally(schedule)
          }
          load()
          return () => {
            alive = false
            if (timer) window.clearTimeout(timer)
            if (controller) controller.abort()
          }
        }, [sessionId])

        if (!sessionId || (!summary && !failed)) return null

        const stale = failed && !!summary
        const label = summary
          ? `${money(summary.cost, symbolOf(currency))} · ${compact(summary.tokens)} ${t('unit.tokens')}${stale ? ` · ${t('chip.stale')}` : ''}`
          : t('chip.error')
        const title = stale ? t('chip.staleTitle') : t('chip.title')

        return h('button', {
          type: 'button',
          title,
          'aria-label': title,
          onClick: () => openPanel(ctx),
          style: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            height: 24,
            padding: '0 8px',
            border: '1px solid var(--dsw-alias-border-l1)',
            borderRadius: 999,
            background: 'transparent',
            color: stale ? 'var(--dsw-alias-state-error-primary)' : 'var(--dsw-alias-label-secondary)',
            font: 'inherit',
            fontSize: 11.5,
            fontVariantNumeric: 'tabular-nums',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          },
        },
          h(ChartIcon, { size: 13 }),
          h('span', null, label),
        )
      }
    }

    function createPanel(ctx) {
      return function UsagePanel(props) {
        const t = useTranslate(ctx)
        const store = useCurrentSession()
        const fixedId = props && typeof props.viewSessionId === 'string' ? props.viewSessionId : ''
        const sessionId = fixedId || store.sessionId
        const current = fixedId
          ? {
            sessionId,
            title: store.sessionId === fixedId ? store.title : '',
            cwd: store.sessionId === fixedId ? store.cwd : '',
          }
          : store
        const [scope, setScope] = React.useState(() => (sessionId ? 'current' : 'all'))
        const [metricId, setMetricId] = React.useState(readMetricPref)
        const [chartMode, setChartMode] = React.useState(() => (sessionId ? 'turnValue' : 'days'))
        const [openError, setOpenError] = React.useState('')
        const [update, setUpdate] = React.useState({ checking: false, result: null, error: '' })
        const [updateDismissed, setUpdateDismissed] = React.useState(false)
        const [listLimit, setListLimit] = React.useState(150)
        const [turnWindow, setTurnWindow] = React.useState(null)
        const [turnDraft, setTurnDraft] = React.useState('')
        const [turnRangeError, setTurnRangeError] = React.useState('')
        const [rangeNonce, setRangeNonce] = React.useState(0)
        const turnColor = useTurnColor()
        const effectiveScope = scope !== 'all' && !sessionId ? 'all' : scope
        const query = useQuery(ctx, effectiveScope, sessionId)
        const data = query.data
        const metric = METRICS.find((entry) => entry.id === metricId) || METRICS[0]
        const symbol = symbolOf(data?.currency)
        const totals = data?.totals || null
        const chart = data?.chart || null
        const daily = chart && Array.isArray(chart.daily) ? chart.daily : []
        const turns = chart && chart.turns ? chart.turns : null
        const points = turns && turns.series && turns.series[0] && Array.isArray(turns.series[0].points)
          ? turns.series[0].points
          : []
        const currentCwd = current.cwd || (data && data.current ? data.current.cwd : '') || ''
        const currentTitle = current.title || (data && data.current ? data.current.title : '') || ''
        const projectName = projectLabel(currentCwd) || (data && data.project ? data.project.label : '') || ''
        const scopeLabels = {
          current: t('scope.current') + (currentTitle
            ? ` · ${currentTitle}`
            : (sessionId ? ` · ${t('scope.untitled')}` : '')),
          project: t('scope.project') + (projectName ? ` · ${projectName}` : ''),
          all: t('scope.all') + (totals && effectiveScope === 'all' ? ` · ${totals.sessions}` : ''),
        }
        const scopeTitles = {
          current: currentTitle || scopeLabels.current,
          project: currentCwd || scopeLabels.project,
          all: scopeLabels.all,
        }

        React.useEffect(() => {
          if (!data || !data.current) return
          setCurrentSession({
            sessionId: data.current.id,
            title: data.current.title || '',
            cwd: data.current.cwd || '',
          })
        }, [data && data.current ? data.current.id : '', data && data.current ? data.current.title : '', data && data.current ? data.current.cwd : ''])

        React.useEffect(() => {
          setChartMode(effectiveScope === 'current' ? 'turnValue' : 'days')
        }, [effectiveScope])

        React.useEffect(() => {
          setListLimit(150)
        }, [effectiveScope])

        const chooseScope = (next) => {
          setScope(next)
          setOpenError('')
        }

        const chooseMetric = (next) => {
          setMetricId(next)
          writeMetricPref(next)
        }

        const applyTurnRange = () => {
          const text = String(turnDraft || '').trim()
          if (!text) {
            setTurnRangeError(t('chart.rangeInvalid'))
            return
          }
          const parsed = Number(text)
          if (!Number.isSafeInteger(parsed) || parsed < 1) {
            setTurnRangeError(t('chart.rangeInvalid'))
            return
          }
          setTurnWindow(parsed)
          setTurnDraft(String(parsed))
          setTurnRangeError('')
          setRangeNonce((value) => value + 1)
        }

        const clearTurnRange = () => {
          setTurnWindow(null)
          setTurnDraft('')
          setTurnRangeError('')
          setRangeNonce((value) => value + 1)
        }

        const runUpdateCheck = async () => {
          setUpdate((previous) => ({ ...previous, checking: true, error: '' }))
          try {
            const result = await checkForUpdate()
            setUpdate({ checking: false, result, error: '' })
            setUpdateDismissed(false)
          } catch (error) {
            setUpdate({ checking: false, result: null, error: String(error?.message || error) })
          }
        }

        const open = (id) => {
          if (!openSession(ctx, id)) setOpenError(t('open.failed'))
          else setOpenError('')
        }

        const openConversation = (id, turn) => {
          if (!id) return
          // Inside the 用量 View tab, the session is already selected, so
          // openSession is a no-op. Select the Chat View explicitly instead.
          if (typeof props.openView === 'function' && id === sessionId) {
            props.openView('chat')
            setOpenError('')
            if (turn === undefined || turn === null || turn === '') cancelChatTurnNavigation()
            else focusChatTurn(turn, id)
            return
          }
          cancelChatTurnNavigation()
          open(id)
        }

        const openTurn = (turn) => openConversation(sessionId, turn)

        const rows = React.useMemo(() => {
          const list = Array.isArray(data?.sessions)
            ? data.sessions.filter((session) => (Number(session.tokens) || 0) > 0 || (Number(session.cost) || 0) > 0)
            : []
          return list.sort((a, b) => metricValue(b, metric) - metricValue(a, metric))
        }, [data, metric])

        const hasAnyUsage = !!(totals && ((Number(totals.tokens) || 0) > 0 || (Number(totals.cost) || 0) > 0))
        const maxRowValue = rows.length > 0 ? Math.max(1, metricValue(rows[0], metric)) : 1
        const maxTurnValue = points.length > 0
          ? Math.max(1, points.reduce((peak, point) => Math.max(peak, metricValue(point, metric)), 0))
          : 1

        const header = h('div', { className: 'dsu-head' },
          h('div', { style: { minWidth: 0 } },
            h('h1', { className: 'dsu-title' }, t('panel.title')),
            h('div', { className: 'dsu-sub' }, t('panel.subtitle')),
          ),
          h('div', { className: 'dsu-inline' },
            query.loading && data
              ? h('span', { className: 'dsu-card-note' }, h('span', { className: 'dsu-spin' }), t('panel.loading'))
              : null,
            update.error
              ? h('span', { className: 'dsu-card-note dsu-update-error', title: update.error }, t('update.failed'))
              : null,
            update.result && !update.result.updateAvailable && !update.checking
              ? h('span', { className: 'dsu-card-note dsu-update-ok' }, t('update.upToDate'))
              : null,
            h('button', {
              type: 'button',
              className: 'dsu-btn',
              onClick: runUpdateCheck,
              disabled: update.checking,
              title: t('update.hint'),
            },
              h(UpdateIcon),
              h('span', null, t(update.checking ? 'update.checking' : 'update.check')),
            ),
            h('button', { type: 'button', className: 'dsu-btn', onClick: query.refresh },
              h(RefreshIcon),
              h('span', null, t('panel.refresh')),
            ),
          ),
        )

        const toolbar = h('div', { className: 'dsu-toolbar' },
          h('div', { className: 'dsu-group' },
            h('span', { className: 'dsu-group-label' }, t('scope.label')),
            h('div', { className: 'dsu-seg', role: 'group', 'aria-label': t('scope.label') },
              SCOPES.map((entry) => h('button', {
                key: entry.id,
                type: 'button',
                className: `dsu-seg-btn${effectiveScope === entry.id ? ' is-on' : ''}`,
                title: scopeTitles[entry.id],
                disabled: entry.id !== 'all' && !sessionId,
                onClick: () => chooseScope(entry.id),
              }, scopeLabels[entry.id])),
            ),
          ),
          h('div', { className: 'dsu-group' },
            h('span', { className: 'dsu-group-label' }, t('metric.label')),
            h('div', { className: 'dsu-metrics', role: 'group', 'aria-label': t('metric.label') },
              METRICS.map((entry) => h('button', {
                key: entry.id,
                type: 'button',
                className: `dsu-metric${metric.id === entry.id ? ' is-on' : ''}`,
                onClick: () => chooseMetric(entry.id),
              }, t(entry.labelKey))),
            ),
          ),
          h('div', { className: 'dsu-group dsu-color-group' },
            h('span', { className: 'dsu-group-label' }, t('color.label')),
            h('div', { className: 'dsu-colors' },
              TURN_COLOR_PRESETS.map((color) => h('button', {
                key: color,
                type: 'button',
                className: `dsu-swatch${turnColor === color ? ' is-on' : ''}`,
                style: { background: color },
                title: color,
                'aria-label': color,
                onClick: () => setTurnColor(color),
              })),
              h('input', {
                type: 'color',
                className: 'dsu-color-input',
                value: turnColor,
                title: t('color.custom'),
                'aria-label': t('color.custom'),
                onChange: (event) => setTurnColor(event.target.value),
              }),
            ),
          ),
        )

        const hint = !sessionId
          ? h('div', { className: 'dsu-hint' }, t('page.needSession'))
          : null

        const kpis = totals
          ? h('div', { className: 'dsu-kpis' },
            h(Kpi, {
              label: t('kpi.cost'),
              value: money(totals.cost, symbol),
              sub: t('kpi.estimated'),
            }),
            h(Kpi, {
              label: t('kpi.tokens'),
              value: full(totals.tokens),
              sub: `${full(totals.messages)} ${t('unit.messages')}`,
            }),
            h(Kpi, {
              label: t('kpi.io'),
              value: `${compact(totals.input)} / ${compact(totals.output)}`,
              sub: `${t('kpi.input')} · ${t('kpi.output')}`,
            }),
            h(Kpi, {
              label: t('kpi.cache'),
              value: compact(totals.cacheRead),
              sub: `${t('kpi.rate')} ${pct(totals.cacheHitRate)}`,
            }),
            h(Kpi, {
              label: t('kpi.sessions'),
              value: `${full(totals.sessions)} / ${full(totals.turns)}`,
              sub: `${full(totals.steps)} ${t('unit.steps')}`,
            }),
          )
          : null

        const chartModes = effectiveScope === 'current'
          ? [
            { id: 'turnValue', labelKey: 'chart.modeTurnValue' },
            { id: 'turns', labelKey: 'chart.modeTurns' },
            { id: 'days', labelKey: 'chart.modeDays' },
          ]
          : [
            { id: 'days', labelKey: 'chart.modeDays' },
            { id: 'turns', labelKey: 'chart.modeTurns' },
          ]
        const hasChartData = chartMode === 'days'
          ? daily.length > 0
          : !!(turns && ((Array.isArray(turns.series) && turns.series.length > 0) || turns.other))
        const chartTitle = chartMode === 'turnValue'
          ? t('chart.turnValue')
          : (chartMode === 'turns' ? t('chart.turns') : t('chart.days'))
        const chartNote = chartMode === 'turnValue'
          ? t('chart.perTurn')
          : chartMode === 'turns'
            ? (effectiveScope === 'current' ? '' : t('chart.seriesNote'))
            : (data ? `${t('chart.window')} ${data.chartDays || daily.length} ${t('unit.days')}` : '')

        const rangeEnabled = (effectiveScope === 'project' || effectiveScope === 'all') && chartMode === 'turns'
        const rangeControl = rangeEnabled
          ? h('div', { className: 'dsu-range' },
            h('span', { className: 'dsu-range-label' }, t('chart.range')),
            h('button', {
              type: 'button',
              className: `dsu-seg-btn${turnWindow === null ? ' is-on' : ''}`,
              onClick: clearTurnRange,
            }, t('chart.rangeAll')),
            h('input', {
              type: 'number',
              min: 1,
              step: 1,
              className: 'dsu-range-input',
              value: turnDraft,
              placeholder: t('chart.rangePlaceholder'),
              'aria-label': t('chart.rangePlaceholder'),
              onChange: (event) => {
                setTurnDraft(event.target.value)
                setTurnRangeError('')
              },
              onBlur: () => {
                if (turnDraft.trim()) applyTurnRange()
              },
              onKeyDown: (event) => {
                if (event.key === 'Enter') applyTurnRange()
              },
            }),
            turnRangeError
              ? h('span', { className: 'dsu-range-error' }, turnRangeError)
              : null,
          )
          : null

        const chartCard = h('div', { className: 'dsu-card' },
          h('div', { className: 'dsu-card-head' },
            h('div', { className: 'dsu-card-title' }, chartTitle),
            h('div', { className: 'dsu-inline' },
              h('span', { className: 'dsu-card-note' }, chartNote),
              h('div', { className: 'dsu-seg dsu-mode', role: 'group', 'aria-label': chartTitle },
                chartModes.map((entry) => h('button', {
                  key: entry.id,
                  type: 'button',
                  className: `dsu-seg-btn${chartMode === entry.id ? ' is-on' : ''}`,
                  onClick: () => setChartMode(entry.id),
                }, t(entry.labelKey))),
              ),
            ),
          ),
          rangeControl
            ? h('div', { className: 'dsu-range-row' }, rangeControl)
            : null,
          hasChartData && hasAnyUsage
            ? h(UsageChart, {
              mode: chartMode,
              daily,
              turns,
              metric,
              symbol,
              t,
              showProject: effectiveScope === 'all',
              turnWindow: rangeEnabled ? turnWindow : null,
              rangeNonce,
              sessionKey: sessionId,
              onPick: chartMode === 'days'
                ? undefined
                : (pick) => openConversation(pick.sessionId, pick.turn),
            })
            : h(Empty, { text: t('chart.empty') }),
        )

        const listCard = effectiveScope === 'current'
          ? h('div', { className: 'dsu-card dsu-turns' },
            h('div', { className: 'dsu-card-head' },
              h('div', { className: 'dsu-card-title' }, t('turns.title')),
              h('div', { className: 'dsu-inline' },
                h('span', { className: 'dsu-card-note' }, t('turns.note')),
                sessionId
                  ? h('button', {
                    type: 'button',
                    className: 'dsu-btn',
                    onClick: () => openTurn(points.length > 0 ? points[points.length - 1].turn : ''),
                  }, t('list.open'))
                  : null,
              ),
            ),
            points.length > 0
              ? h('div', { className: 'dsu-list' },
                points.map((point, index) => {
                  const value = metricValue(point, metric)
                  const width = Math.max(2, Math.min(100, (value / maxTurnValue) * 100))
                  return h('button', {
                    key: `turn-${point.turn}-${index}`,
                    type: 'button',
                    className: 'dsu-row',
                    onClick: () => openTurn(point.turn),
                  },
                    h('div', { style: { minWidth: 0 } },
                      h('div', { className: 'dsu-row-title' }, point.label),
                      h('div', { className: 'dsu-row-sub' },
                        `${compact(point.tokens)} ${t('unit.tokens')} · ${compact(point.steps)} ${t('unit.steps')} · ${compact(point.messages)} ${t('unit.messages')}`,
                      ),
                    ),
                    h('div', { className: 'dsu-bar' },
                      h('span', { className: 'dsu-bar-fill', style: { width: `${Math.max(2, width)}%` } }),
                    ),
                    h('div', null,
                      h('div', { className: 'dsu-row-value' }, formatMetric(point, metric, symbol)),
                      h('div', { className: 'dsu-row-meta' },
                        metric.id === 'cost'
                          ? `${compact(point.tokens)} ${t('unit.tokens')}`
                          : money(point.cost, symbol),
                      ),
                    ),
                  )
                }),
              )
              : h(Empty, { text: t('turns.empty') }),
          )
          : h('div', { className: 'dsu-card' },
            h('div', { className: 'dsu-card-head' },
              h('div', { className: 'dsu-card-title' },
                t('list.title'),
                h('span', { className: 'dsu-card-note', style: { marginLeft: 8, fontWeight: 400 } }, String(rows.length)),
              ),
              h('div', { className: 'dsu-card-note' },
                rows.length > listLimit
                  ? `${t('list.showing')} ${listLimit} / ${rows.length}`
                  : t('list.note'),
              ),
            ),
            rows.length > 0
              ? h(React.Fragment, null,
                h('div', { className: 'dsu-list' },
                  rows.slice(0, listLimit).map((session) => {
                  const value = metricValue(session, metric)
                  const model = session.models && session.models[0] ? session.models[0].model : ''
                  const sub = [
                    projectLabel(session.cwd) || t('project.unknown'),
                    model || t('model.unknown'),
                    formatDate(ctx, session.updatedAt),
                    session.subagent ? t('list.subagent') : '',
                  ].filter(Boolean).join(' · ')
                  const meta = metric.kind === 'money'
                    ? `${compact(session.tokens)} ${t('unit.tokens')} · ${full(session.turns)} ${t('unit.turns')}`
                    : `${money(session.cost, symbol)} · ${full(session.turns)} ${t('unit.turns')}`
                  return h('button', {
                    key: session.id,
                    type: 'button',
                    className: `dsu-row${session.id === sessionId ? ' is-current' : ''}`,
                    title: t('list.open'),
                    onClick: () => openConversation(session.id),
                  },
                    h('div', { style: { minWidth: 0 } },
                      h('div', { className: 'dsu-row-title' },
                        session.title || t('list.untitled'),
                        session.id === sessionId
                          ? h('span', { className: 'dsu-card-note', style: { marginLeft: 8, fontWeight: 400 } }, t('list.current'))
                          : null,
                      ),
                      h('div', { className: 'dsu-row-sub' }, sub),
                    ),
                    h('div', { className: 'dsu-bar' },
                      h('span', {
                        className: 'dsu-bar-fill',
                        style: { width: `${Math.max(2, Math.min(100, (value / maxRowValue) * 100))}%` },
                      }),
                    ),
                    h('div', null,
                      h('div', { className: 'dsu-row-value' }, formatMetric(session, metric, symbol)),
                      h('div', { className: 'dsu-row-meta' }, meta),
                    ),
                  )
                }),
                ),
                rows.length > listLimit
                  ? h('div', { className: 'dsu-more' },
                    h('button', {
                      type: 'button',
                      className: 'dsu-btn',
                      onClick: () => setListLimit((value) => value + 150),
                    }, `${t('list.more')} (${rows.length - listLimit})`),
                  )
                  : null,
              )
              : h(Empty, { text: t('list.empty') }),
          )

        const footer = data
          ? h('div', { className: 'dsu-foot' },
            h('span', null, t('foot.estimate')),
            h('span', null, data.peak ? t('foot.peakOn') : t('foot.peakOff')),
            h('span', null, `${t('foot.generated')} ${formatClock(ctx, data.generatedAt)}`),
            data.warnings && data.warnings.length > 0
              ? h('span', null, `${data.warnings.length} ${t('foot.warnings')}`)
              : null,
          )
          : null

        const updateBanner = update.result && update.result.updateAvailable && !updateDismissed
          ? h('div', { className: 'dsu-update', role: 'status' },
            h('div', { className: 'dsu-update-main' },
              h('div', { className: 'dsu-update-title' },
                `${t('update.available')} · v${update.result.latest}`,
              ),
              h('div', { className: 'dsu-update-sub' },
                `${t('update.current')} v${update.result.current} · ${t('update.latest')} v${update.result.latest}`,
              ),
            ),
            h('div', { className: 'dsu-update-actions' },
              h('a', {
                className: 'dsu-btn dsu-update-link',
                href: update.result.releaseUrl,
                target: '_blank',
                rel: 'noopener noreferrer',
              }, t('update.open')),
              h('button', {
                type: 'button',
                className: 'dsu-btn',
                onClick: () => setUpdateDismissed(true),
              }, t('update.dismiss')),
            ),
          )
          : null

        let body
        if (!data && query.loading) {
          body = h('div', { className: 'dsu-empty' }, h('span', { className: 'dsu-spin' }), t('panel.loading'))
        } else if (!data && query.error) {
          body = h('div', { className: 'dsu-error' },
            h('div', { className: 'dsu-error-text' }, `${t('error.title')}: ${query.error}`),
            h('button', { type: 'button', className: 'dsu-btn', onClick: query.refresh }, t('error.retry')),
          )
        } else if (data) {
          body = h(React.Fragment, null,
            query.error
              ? h('div', { className: 'dsu-error' },
                h('div', { className: 'dsu-error-text' }, `${t('error.title')}: ${query.error}`),
                h('button', { type: 'button', className: 'dsu-btn', onClick: query.refresh }, t('error.retry')),
              )
              : null,
            updateBanner,
            kpis,
            chartCard,
            listCard,
            openError ? h('div', { className: 'dsu-hint' }, openError) : null,
            footer,
          )
        } else {
          body = h(Empty, { text: t('chart.empty') })
        }

        return h('div', { className: 'dsu-panel' },
          h(StyleTag),
          h('div', { className: 'dsu-inner' },
            header,
            toolbar,
            hint,
            body,
          ),
        )
      }
    }

    function createUsageView(ctx, Panel) {
      return function UsageView(props) {
        const sessionId = props && typeof props.sessionId === 'string' ? props.sessionId : ''
        React.useEffect(() => {
          if (sessionId) setCurrentSession({ sessionId })
        }, [sessionId])
        return h(Panel, {
          viewSessionId: sessionId,
          openView: props && typeof props.openView === 'function' ? props.openView : null,
        })
      }
    }

    function createTurnCost(ctx) {
      return function TurnCost(props) {
        const t = useTranslate(ctx)
        const color = useTurnColor()
        const sessionId = props && typeof props.sessionId === 'string' ? props.sessionId : ''
        const seq = Number(props && props.seq) || 0
        const turnHint = (() => {
          const value = props && props.turn
          if (typeof value === 'number' && Number.isFinite(value)) return value
          if (value && typeof value === 'object') {
            for (const key of ['turn', 'number', 'index']) {
              const candidate = Number(value[key])
              if (Number.isFinite(candidate) && candidate > 0) return candidate
            }
          }
          return 0
        })()
        const [state, setState] = React.useState({ turn: null, total: 0, currency: 'CNY' })

        React.useEffect(() => {
          if (!sessionId) return undefined
          let alive = true
          getTurnData(sessionId, seq)
            .then((data) => {
              if (!alive) return
              if (!data) {
                setState({ turn: null, total: 0, currency: 'CNY' })
                return
              }
              const series = data && data.chart && data.chart.turns ? data.chart.turns.series : null
              const list = series && series[0] && Array.isArray(series[0].points) ? series[0].points : []
              let match = turnHint > 0
                ? list.find((point) => Number(point.turn) === turnHint) || null
                : null
              if (!match && turnHint <= 0) {
                for (const point of list) {
                  const pointSeq = Number(point.seq) || 0
                  if (pointSeq <= seq && (!match || pointSeq >= (Number(match.seq) || 0))) match = point
                }
              }
              if (!match && turnHint <= 0 && seq <= 0 && list.length > 0) match = list[list.length - 1]
              if (!match) {
                // The requested turn is known but absent from this snapshot.
                // Do not fall back to a neighbouring turn's amount.
                setState({ turn: null, total: 0, currency: (data && data.currency) || 'CNY' })
                return
              }
              const ordered = [...list].sort((a, b) => (Number(a.turn) || 0) - (Number(b.turn) || 0))
              let total = 0
              for (const point of ordered) {
                total += Number(point.cost) || 0
                if (point.turn === match.turn) break
              }
              setState({ turn: match, total, currency: (data && data.currency) || 'CNY' })
            })
            .catch(() => {})
          return () => {
            alive = false
          }
        }, [sessionId, seq, turnHint])

        const turn = state.turn
        if (!turn) return null
        const total = state.total
        if (!(total > 0 || (Number(turn.cost) || 0) > 0 || (Number(turn.tokens) || 0) > 0)) return null
        const symbol = symbolOf(state.currency)
        const isWhite = normalizeColor(color) === '#FFFFFF'
        const border = isWhite ? '1px solid var(--dsw-alias-border-l2)' : `1px solid ${tint(color, 0.5)}`
        const background = isWhite ? '#FFFFFF' : tint(color, 0.16)
        const textColor = isWhite ? '#1F2328' : 'var(--dsw-alias-label-primary)'
        const secondaryColor = isWhite ? 'rgba(31, 35, 40, 0.62)' : 'var(--dsw-alias-label-secondary)'
        const dotStyle = isWhite
          ? {
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: '#FFFFFF',
            boxShadow: '0 0 0 1px var(--dsw-alias-border-l2)',
            flex: 'none',
          }
          : {
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: color,
            flex: 'none',
          }
        return h('button', {
          type: 'button',
          title: `${t('turn.tooltip')} · ${compact(turn.tokens)} ${t('unit.tokens')}`,
          'aria-label': t('turn.open'),
          onClick: () => {
            if (sessionId) setCurrentSession({ sessionId })
            openPanel(ctx)
          },
          style: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            maxWidth: '100%',
            padding: '2px 9px',
            border,
            borderRadius: 999,
            background,
            color: textColor,
            font: 'inherit',
            fontSize: 11.5,
            fontVariantNumeric: 'tabular-nums',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          },
        },
          h('span', { style: dotStyle }),
          h('span', null, `${t('turn.turnLabel')} ${money(turn.cost, symbol)}`),
          h('span', { style: { color: secondaryColor } }, '·'),
          h('span', { style: { color: secondaryColor } },
            `${t('turn.label')} ${money(total, symbol)}`,
          ),
        )
      }
    }

    return {
      name: 'dsh-session-usage',
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => registerLocale(ctx))
        ctx.effect(() => () => cancelChatTurnNavigation())
        const Icon = createIcon(ctx)
        const Chip = createChip(ctx)
        const Panel = createPanel(ctx)
        const UsageView = createUsageView(ctx, Panel)
        const TurnCost = createTurnCost(ctx)

        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: PANEL_ID,
          order: 25,
          label: () => translate(ctx, 'panel.title'),
        }, Icon))

        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: PANEL_ID,
        }, Panel))

        ctx.slots.inject('conversation.view', () => ctx.slots.register({
          name: 'conversation.view',
          id: 'usage',
          order: 15,
          label: () => translate(ctx, 'view.label'),
        }, UsageView))

        ctx.slots.inject('conversation.session.header.utilities', () => ctx.slots.register({
          name: 'conversation.session.header.utilities',
          id: `${PANEL_ID}:header`,
          order: 40,
        }, Chip))

        ctx.slots.inject('conversation.chat.turnTail', () => ctx.slots.register({
          name: 'conversation.chat.turnTail',
          id: `${PANEL_ID}:turn-cost`,
          order: 30,
        }, TurnCost))
      },
    }
  },
})
