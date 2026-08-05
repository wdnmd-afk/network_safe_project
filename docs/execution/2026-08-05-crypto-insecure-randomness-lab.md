# LT-023 不安全随机数与 token 熵专用实验执行文档

## 1. 目标

按照 `SECURITY-COVERAGE-LONG-TERM-GOAL.md` 的 `LT-023` 和 `docs/design/cryptography-and-data-protection-labs.md` 第 5.2 节，实现不安全随机数与 token 熵专用模拟实验（D3），并在同一切片建立 `crypto` 分类。

实验只使用固定预生成的模式摘要，对比时间戳/自增序列被误当作随机 token 与采用操作系统 CSPRNG 策略后的差异。漏洞版展示低熵、可预测模式被接受；修复版阻断弱随机源，同时验证固定 CSPRNG 策略样例可以继续正常流程。

## 2. 已确认契约与字段来源

### 2.1 分类与实验标识

- 分类：`crypto`，中文名称“密码学与数据保护”。
- 实验 ID：`crypto.insecure-randomness`。
- slug / subcategory：`insecure-randomness`。
- 模式：`simulation`，深度：D3 专用模拟。
- 元数据在实现和命令验证完成前保持 `in-progress`，验证通过后再单独推进为 `ready`。

### 2.2 现有会话实现的准确边界

- `apps/server/src/services/session-token.ts` 的准确入口是 `createSessionToken(userId, secret, issuedAt)`。
- 当前会话令牌对 `userId.issuedAt` 使用 HMAC-SHA256 签名；它不是随机 token 生成器，也没有 `randomBytes` 随机 nonce。
- LT-023 只把 `issuedAt` 作为“时间字段本身不提供随机熵”的讲解锚点，不修改现有认证/会话链路，也不把“可观察的签名载荷”与“可伪造令牌”混为一谈。
- 固定正例只表达“由操作系统 CSPRNG 生成至少 128 位随机材料”的策略，不在实验运行时生成真实会话 token。

### 2.3 固定样例模型

- 风险样例只保存固定摘要：来源 `timestamp-counter`、单调递增模式、低熵等级和可预测模式命中。
- 正常样例只保存固定摘要：来源 `operating-system-csprng`、目标强度 `128-bit`、不透明指纹列表和策略通过标记。
- 不在页面、API、事件日志或文档中保存可用的真实 token、secret、签名密钥或认证凭据。
- 不计算用户输入的熵，不提供 token 猜测器、序列预测器或爆破脚本。

### 2.4 请求字段

评估 API 只接受现有第二版专用实验契约：

```ts
{
  scenarioKey: "predictable-session-token-sequence";
  decisions: string[];
}
```

- 不接受 `token`、`secret`、`seed`、`timestamp`、`counter`、`userId`、熵值或自由文本。
- 固定摘要和随机源策略只由服务端已注册的 scenario / option key 表达。
- 未知 key 必须脱敏阻断，不回显原始输入，也不得写入事件日志。

### 2.5 两步状态机

第一步 `entropy-assessment`（熵与模式判定）：

- `trust-timestamp-counter-pattern`：风险路径，把时间戳/自增结构误当作不可预测 token，进入随机源处置。
- `detect-low-entropy-pattern`：防御路径，识别固定低熵和单调模式，进入随机源处置。

第二步 `random-source-decision`（随机源处置）：

- `keep-predictable-token-source`：风险终止路径，canonical 信号 `crypto-insecure-randomness-risk-accepted`。
- `block-weak-token-generation`：防御终止路径，canonical 信号 `crypto-insecure-randomness-defense-blocked`。
- `verify-csprng-token-policy`：正常终止路径，canonical 信号 `crypto-insecure-randomness-normal-verified`。

边界阻断统一使用 `crypto-insecure-randomness-boundary-blocked`。

## 3. 实施范围

- 新增 `labs/crypto/insecure-randomness/` 标准目录、元数据和完整实验文档。
- 新增 `tools/lab-scripts/crypto/insecure-randomness/verify.ts` 只读一致性验证及 README，不新增 `exploit.py`。
- 新增服务端专用第二版状态机、工作台 API、评估 API、统一事件日志安全摘要和专用测试。
- 新增前端 API client、模型配置、专用工作台页面、精确路由和前端 API / 路由测试。
- 将 `crypto` 接入数据库动态分类同步、实验列表中文分组和平台状态统计标签。
- 同步实验总数、分类数、变体数、模式数、专用实现数、覆盖矩阵和相关断言。

## 4. 不在本轮范围

- 不修改真实登录、会话 token、JWT、口令哈希或认证数据库。
- 不生成、签发、存储、验证或传输真实 token、secret、seed、密钥或凭据。
- 不接受任意 token、时间戳、计数器、随机种子、用户 ID 或外部 URL。
- 不提供 token 枚举、序列预测、爆破、会话接管或可迁移攻击脚本。
- 不在本轮增加 Playwright、数据库集成、smoke 或发布构建证据。

## 5. 操作步骤

1. 建立 `crypto` 分类 profile、前端标签和 `crypto.insecure-randomness` 元数据，初始状态为 `in-progress`。
2. 新增专用服务，使用共享 `createGuidedScenarioMachine` 驱动固定两步状态机，覆盖风险、防御、正常、未知和多余输入路径。
3. 在通用 guided catch-all 之前注册精确工作台 / 评估路由；评估接口要求登录，并只记录 scenarioKey、步数、结果计数、终止结果和 signal。
4. 新增前端 API、展示模型和专用页面；页面只通过固定按钮提交决策，不提供 token 或随机参数输入控件。
5. 接入学习进度和验证记录，保持现有字段契约，不新增猜测字段。
6. 新增标准实验文档、只读验证器、服务端测试、前端 API 测试、共享元数据断言和路由断言。
7. 更新覆盖矩阵和全局计数：实现阶段应为 68 个实验、12 个分类、136 个变体、25 个 interactive、16 个 simulation、27 个 case-study、37 个专用实现和 31 个引导式实验。
8. 经用户明确授权后运行专项验证与根级 `pnpm verify`；全部通过后再把元数据推进到 `ready` 并回填 LT-023 完成证据。

## 6. 实施建议

- 结构上复用 workflow-bypass / BFLA 的专用实验模式，保持第二版状态机、固定请求和事件摘要一致。
- 服务端只维护固定证据卡和决策图，不调用 `randomBytes`、`Math.random`、真实会话服务或外部熵源。
- 正常路径验证的是固定 CSPRNG 策略摘要，不输出原始随机材料。
- 本切片不抽取新的通用页面或服务抽象，避免把安全主题差异隐藏在过早封装中。

## 7. 潜在风险分析

| 风险 | 影响 | 控制方式 |
|---|---|---|
| 把签名令牌与随机令牌概念混淆 | 形成错误安全结论 | 文档明确现有 session token 是 HMAC 签名结构，本实验只讨论随机材料策略 |
| 固定样例被误当作真实 token | 产生可复用凭据风险 | 页面只展示摘要和不可用指纹，不登记原始 token 字符串 |
| 实验运行时生成安全 token | 意外接入认证或泄露随机材料 | 服务不调用随机 API，不签发、不存储、不验证 token |
| 新分类造成统计漂移 | 元数据、数据库、页面和文档不一致 | 同步 profile、标签、覆盖矩阵、健康检查和注册表计数断言 |
| 未知输入写入日志 | 可能记录疑似秘密 | API 只接受固定 key，未知值脱敏阻断，事件摘要不含原始输入 |
| 专用路由被 catch-all 吞掉 | 页面或 API 命中错误服务 | 精确路由置于通用路由之前并增加测试 |

## 8. 优化方案

- 通过共享第二版状态机复用图校验、确定性决策和 recap 汇总，不手写随机性判断引擎。
- 固定熵摘要与 token 指纹只在服务端定义中维护一份，前端从工作台配置读取。
- 对终止步骤后的多余决策显式阻断，避免未知 optionKey 被静默忽略。
- 只读验证器同时核对元数据、文档、实现、测试、固定 key 和禁用能力，降低跨层漂移。

## 9. 验证方式

经用户明确授权后执行：

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/crypto/insecure-randomness/verify.ts`
- `pnpm verify`
- `git diff --check`

`pnpm verify` 应覆盖前后端类型检查、shared、guided、coverage、server 和 web 测试。build、smoke、数据库集成与 Playwright 不属于本切片最小门禁，除非用户另行授权。

## 10. 完成条件

- `crypto.insecure-randomness` 专用页面和 API 可访问，风险、防御、正常三条路径产生预定 canonical 信号。
- 未知 scenario / option key、不完整路径和终止后的多余决策均被脱敏阻断。
- 事件日志只包含安全摘要，不包含 token、secret、seed、用户、时间戳、计数器或原始随机材料。
- 分类注册、元数据、路由、页面、API、脚本、文档、覆盖矩阵和计数一致。
- 专项验证与 `pnpm verify` 全部通过，元数据推进为 `ready`，LT-023 完成证据回填。

## 11. 当前执行结果

- 已完成密码学规划、现有 session token / password / JWT 实现和专用实验模板预读。
- 已锁定分类、实验 ID、固定摘要、scenarioKey、optionKey、canonical 信号、API 字段和安全边界。
- 运行时代码尚未开始修改；下一步按本执行文档实现服务端状态机与 `crypto` 分类注册。
