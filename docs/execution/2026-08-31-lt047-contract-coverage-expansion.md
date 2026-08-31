# LT-047 契约一致性断言覆盖面扩展执行文档

> 文档状态：已完成
>
> 建立时间：2026-08-31
>
> 关联任务：`LT-047`（承接 `LT-046`）

## 1. 目标

把 `LT-046` 建立的前后端固定契约断言，从 17 个 `recommendedPath` 型实验扩展到更大覆盖面，并记录推广过程中发现的既有不一致。

## 2. 队列原文与实测范围的差异

第 21.5 节 `LT-047` 原文为「推广到全部专用实验」。实施前先按架构实测分类，结论是**该原文不可直接执行**，需按实测重新界定范围。

### 2.1 48 个专用实验的架构分类

| 类别 | 数量 | 前端是否持有可比对的固定契约 | 是否可机械断言 |
|---|---:|---|---|
| A. `recommendedPath` 型（第二版状态机） | 17 | 是，持有完整决策路径 | 是，`LT-046` 已覆盖 |
| B. 固定输入样例型 | 21 | 是，但为 payload / keyword / URL 等输入值 | 部分，见 2.2 |
| C. 无独立前端模块（复用共享视图） | 6 | 否，决策 key 由服务端工作台响应驱动 | 否，无第二份副本可比 |
| D. 纯前端实验（`web.xss`，`"api": []`） | 1 | 无服务端实现 | 否，不存在跨端契约 |

分类依据为实测，非推断：

- C 类 6 个（`api.functional-authorization`、`api.property-authorization`、`business-logic.race-condition`、`client.mitb`、`crypto.secret-lifecycle-audit`、`host.event-log-triage`）在 `apps/web/src/labs/` 下无同名模块。
- D 类 `web.xss` 的 `meta.json` 中 `"api": []`，且 `apps/server/src/services/` 无 `xss-lab.ts`，`app.ts` 无任何 xss 路由。

### 2.2 B 类为何不做逐一调用断言

B 类的前端常量是**固定输入样例**，服务端不导出对应常量、在函数内部判定。要断言其一致性只能真实调用服务方法，但实测发现：

- 26 个候选服务中仅 5 个提供 `getSamples()`（`brute-force`、`idor`、`jwt`、`privilege-escalation`、`session-fixation`）。
- 其余服务方法签名各不相同（`fetchResource(SsrfInput)`、`readOrder(IdorInput)`、`readDocument(PathTraversalInput)`、`verifyToken(JwtInput)`…），入参结构无共性。
- 另有 2 个服务需外部依赖才能构造（`sql-injection` 需 `SqlInjectionLabRepository`，`session-fixation` 需 options）。

结论：为 21 个实验逐一编写调用适配器，会引入 21 处与服务签名强耦合的胶水代码。该胶水本身即需维护，且服务签名变更时它会先于被测代码腐化——制造的维护负担大于它防住的缺陷。**故不采用。**

### 2.3 一条被否决的替代方案

曾实现「前端样例值必须出现在配对服务端源码中」的文本存在性规则，实测产生 5 个误报，全部为合法情形：

| 未命中项 | 合法原因 |
|---|---|
| `jwt.normalJwtSample` / `attackJwtSample` | 完整 JWT 串，服务端按 `alg` 与签名解析，从不持有字面量 |
| `path-traversal.attackPathTraversalSample` | `../internal/admin-note.txt` 是遍历输入，服务端持有规范化后的 `internal/admin-note.txt` |
| `sql-injection.sqlInjectionNormalKeyword` / `sqlInjectionAttackPayload` | 经 repository 与正则判定，服务端不硬编码 |

带 5 个误报的规则无法进门禁，**已否决并未提交**。这也再次印证 `LT-046` 的结论：文本存在性检查对契约一致性无效。

## 3. 实际交付的增量检查

新增 `registered-signals-labeled`：**服务端注册的每个信号，前端 `formatSignal` 都必须有对应中文标签。**

设计要点：

- 信号来源是**工作台响应的 `cases[].steps[].options[].signal`**，即状态机的权威注册表，而非服务端顶层导出常量。这一点是关键——`LT-042` 的第五处缺陷在中间步骤信号上，它不是顶层导出。
- 判定方式是调用前端 `formatSignal`：约定未登记信号原样返回，故返回值等于入参即说明标签缺失或拼错。不读取标签表内部形态，避免与其实现耦合。
- 该检查覆盖 `scenarioKey` 与 `optionKey` 断言都抓不到的一类漂移：标签键写错时页面会把原始信号串直接显示给学习者。

### 3.1 一次被识别并移除的冗余实现

首个版本实现的是「两侧同名导出字符串常量逐一相等」。实测发现那 17 个同名常量**全部就是 `scenarioKey` 本身**，而检查一已在比对它——该检查零增量，检查数从 153 涨到 170 属虚增。已替换为本节的信号标签检查。

## 4. 推广中发现的既有不一致

`registered-signals-labeled` 上线后**立即发现一个真实缺陷**（非注入）：

- 实验：`api.rate-limit-idempotency`（`LT-043` 交付）
- 服务端注册：`api-rate-limit-idempotency-unthrottled-accepted`
- 前端标签写作：`api-rate-limit-idempotency-batch-accepted`
- 后果：学习者在漏洞版首步完成后，页面显示原始信号串而非中文标签
- 性质：与 `LT-042` 完全同类，同样通过了 `LT-043` 的全部门禁（专项只读验证 18/18、根级 verify EXIT=0、E6 三向页面验证）

修复：`apps/web/src/labs/rate-limit-idempotency.ts` 标签键改为服务端注册值。

这是本切片最有价值的产出——它证明 `LT-042` 不是孤例，而是该类缺陷在缺少契约断言时的必然产物。E6 页面验证也未能发现它，因为该信号出现在中间步骤，三向用例只断言终止信号。

## 5. 有效性验证（注入测试）

对 `LT-042` 第五处缺陷做注入测试。第一版实现（扫描服务端顶层 `*Signal` 导出）**未能捕获**，实测 `ok True failed 0`——该版本无效，已修正为从工作台 option 收集。

修正后重新注入：

```
injected LT-042 fifth defect (signal label)
ok False failed 1
  infrastructure.kubernetes-rbac-audit | registered-signals-labeled
  | 前端缺少标签（页面将显示原始信号串）：infrastructure-kubernetes-rbac-audit-cluster-wide-accepted
```

注入文件已从备份完整恢复，`git diff` 确认无残留。

## 6. 安全边界

与 `LT-046` 一致：只导入本仓库模块并在内存中比对；不发起 HTTP 请求、不连接数据库、不执行系统命令、不读取凭据。

## 7. 完成标准

- [x] 按架构实测分类 48 个专用实验，界定可断言范围。
- [x] 交付有真实增量的新检查（`registered-signals-labeled`）。
- [x] 识别并移除零增量的冗余检查。
- [x] 否决会产生误报的替代方案并记录原因。
- [x] 注入测试证明新检查对目标缺陷有效。
- [x] 记录推广中发现的既有不一致并修复。
- [x] 根级 `pnpm verify` EXIT=0。
- [x] 长期目标、TODO 同步。
- [x] `git diff --check` 通过并提交。

## 8. 验收证据

- 契约验证器：`ok: true`，17 配对，**170 项检查**，0 失败。
- 新检查覆盖：17 个配对实验的全部注册信号（含中间步骤信号）。
- 注入测试：修正后精确捕获 `LT-042` 第五处缺陷；第一版无效已记录于第 5 节。
- 发现并修复既有缺陷 1 处：`api.rate-limit-idempotency` 信号标签键不一致。
- 根级 `pnpm verify` EXIT=0（含 `test:contracts`；shared 67、guided 30/30、controlled 7×`ok: true`、Web 入口 156/156、API 入口 207/207、coverage 78/78、server 390/390、web 285/285）。
- `git diff --check` 通过。
- 未运行：build、smoke、数据库集成、Playwright（本切片不涉及页面与发布链路）。

## 9. 遗留与后续建议

- B 类 21 个实验的输入样例一致性仍无自动断言。若要覆盖，正确做法是先统一服务方法签名（例如为每个服务补 `getSamples()`），再做机械比对；不应先写 21 处胶水。建议单独立项。
- C 类 6 个与 D 类 1 个不存在跨端契约副本，无需断言，属正常架构而非缺口。
- E6 三向用例只断言终止信号，对中间步骤信号漂移无效——本切片的信号检查填补了该盲区，但也说明 E6 不能替代契约断言。
