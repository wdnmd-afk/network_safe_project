# web/xss 纵向样板实验执行文档

## 1. 目标

实现第一条纵向样板实验 `web/xss`，让平台从实验列表进入漏洞版与修复版页面，并在客服留言业务上下文中展示 XSS 风险与修复差异。

本阶段只做本机受控教学模拟，不实现可复用攻击工具，不访问外部目标。

## 2. 范围

本次修改范围：

- `apps/web`
  - 新增 `web/xss` 实验页面
  - 新增漏洞版 / 修复版路由
  - 新增 XSS 实验模型与前端测试
  - 补充页面样式
- `labs/web/xss`
  - 更新 `meta.json`
  - 补充漏洞版说明
  - 补充修复版说明
  - 补充手动验证文档
- `docs/TODO.md`
  - 同步当前进度

本次不修改：

- 数据库 schema 和 migration
- 服务端实验执行接口
- 通用攻击脚本
- 外部网络访问逻辑

## 3. 业务上下文

使用 SafeMart 客服留言作为业务场景：

- 正常业务动作：用户提交客服留言。
- 漏洞版行为：留言内容被当作 HTML 渲染，页面出现注入标记。
- 修复版行为：同样输入只作为文本显示，不解释 HTML。

本阶段使用惰性 HTML 标记作为风险信号，例如：

```html
<mark data-xss-lab-signal="xss">XSS 模拟信号</mark>
```

该样例用于说明“未转义输出会改变页面结构”，不执行脚本，不读取敏感信息，不访问外部地址。

## 4. 操作步骤

1. 先补前端测试：
   - 路由包含 `/labs/web/xss/vuln` 与 `/labs/web/xss/fixed`
   - XSS 实验模型能区分漏洞版 HTML 渲染与修复版文本渲染
2. 运行测试，确认新测试失败。
3. 实现 XSS 实验模型。
4. 实现 `LabExperimentView.vue`。
5. 将路由接入实验页面。
6. 更新样式。
7. 更新 `labs/web/xss/meta.json`，让 `/labs` 中的变体入口能进入页面。
8. 补充 `labs/web/xss/vuln/README.md`、`labs/web/xss/fixed/README.md`、`labs/web/xss/docs/manual-verification.md`。
9. 更新 `docs/TODO.md`。
10. 运行最小验证并提交。

## 5. 安全边界

- 只面向 `localhost` / 本项目页面。
- 不写对外扫描、探测、批量提交或攻击脚本。
- 不包含真实数据窃取、Cookie 读取、网络回连、键盘记录等行为。
- 漏洞版只演示输出编码缺失造成的页面结构变化。
- 修复版只演示最小输出编码策略，即使用文本渲染代替 HTML 注入。

## 6. 风险分析

- `v-html` 本身是风险点，必须只在漏洞版分支使用，并在页面和文档中标明为受控实验。
- 样例 payload 如果使用真实脚本会扩大安全风险，本阶段固定为惰性 HTML 标记。
- 当前无后端持久化，刷新后留言状态会重置；这是本阶段有意保留的最小实现。
- 当前不更新数据库和学习记录，避免把样板实验范围扩大到记录系统。

## 7. 验证方式

最小验证：

```powershell
pnpm --filter @network-safe/web test -- --run
pnpm --filter @network-safe/web exec vue-tsc --noEmit
pnpm --filter @network-safe/shared test
```

如需浏览器级回归，可追加：

```powershell
pnpm test:e2e
```

本次默认不执行全量 build。
