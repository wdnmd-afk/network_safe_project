# 下一批 Web 注入类扩展实验设计

## 1. 文档定位

本文档定义下一批 Web 注入类扩展实验的设计方案。

当前批次包含：

- `web/command-injection`
- `web/ssti`
- `web/xxe`

这三个实验已经存在占位目录和基础元数据，但尚未具备真实工作台、受控接口、事件日志、脚本和差异验证。本设计用于指导后续逐项实现。

## 2. 总体原则

下一批实验继续沿用一期已落地实验模式：

- 每个实验提供漏洞版和修复版。
- 每个实验有正常业务路径、攻击方视角路径和防御方视角路径。
- 每个实验有清晰的攻击成功信号和修复阻断信号。
- 每个实验写入统一 `lab_event_logs`。
- 每个实验接入通用实验详情页。
- 每个实验脚本只服务本机受控学习场景。

更重要的是，这一批实验必须优先保持安全边界：

- 不调用真实 shell。
- 不执行真实模板表达式。
- 不解析真实外部实体。
- 不读取真实本机敏感文件。
- 不访问外部网络目标。
- 不输出可复制到外部目标的通用攻击工具能力。

## 3. 实施顺序

推荐顺序如下：

1. `web/command-injection`
   - 风险等级最高，且当前 TODO 中优先级高。
   - 先用虚拟命令运行器建立高风险实验的安全实现范式。
2. `web/ssti`
   - 与命令注入同属“输入被解释执行”的学习模型，可复用工作台结构。
   - 必须使用教学用模板模拟器，避免真实代码执行。
3. `web/xxe`
   - 需要 XML 结构、实体解析和修复边界说明。
   - 放在第三个实现，便于复用前两个实验的日志、详情页和脚本组织方式。

每个实验都应单独写执行文档、单独验证、单独同步 TODO。

## 4. 共同接入契约

### 4.1 目录

每个实验保持以下结构：

```text
labs/web/<scene>/
├─ meta.json
├─ README.md
├─ vuln/
├─ fixed/
├─ mock/
└─ docs/
```

脚本目录固定为：

```text
tools/lab-scripts/web/<scene>/
```

### 4.2 元数据

后续实现时，三类实验的 `meta.json` 都要补齐：

- `summary`
- `knowledgePoints`
- `variants[].description`
- `variants[].expectedOutcome`
- `variants[].supportsAutomation`
- `entrypoints.web`
- `entrypoints.api`
- `entrypoints.scripts`
- `entrypoints.docs`
- `verification.manual.expectedSignals`
- `verification.automation.apiTest`
- `verification.automation.scriptVerification`
- `prerequisites`
- `safeBoundaries`
- `sortOrder`
- `estimatedMinutes`

变体入口必须遵守：

```text
variant.entryKey -> entrypoints.web[].key
```

### 4.3 页面

每个实验工作台页面至少包含：

- 当前实验标题。
- 漏洞版 / 修复版视角。
- 正常业务说明。
- 攻击方观察目标。
- 受控样例按钮。
- 当前请求摘要。
- 后端判定结果。
- 学习信号。
- 下一步建议。

页面可以让学习者看到输入被解释的风险，但不应鼓励对外攻击。

### 4.4 后端

每个实验建议新增一个 service：

```text
apps/server/src/services/<scene>-lab.ts
```

每个实验建议新增两个受控 API：

```text
POST /api/labs/web/<scene>/vuln/<action>
POST /api/labs/web/<scene>/fixed/<action>
```

后端必须：

- 从登录态读取当前用户。
- 写入统一实验事件日志。
- 不执行真实危险操作。
- 返回学习信号、判定结果和面向学习者的说明。

### 4.5 日志

事件日志字段沿用当前 `lab_event_logs` 摘要展示口径。

必须记录：

- `labKey`
- `variantKey`
- `phase`
- `actorPerspective`
- `eventType`
- `decision`
- `signal`
- `statusCode`
- `riskLevel`
- `message`

不展示或不保存：

- 真实命令全文
- 真实模板表达式全文
- 真实 XML 文件全文
- 真实密码、token、Cookie、密钥
- 外部目标地址
- 完整攻击 payload

如需记录输入摘要，只能记录分类、长度、是否命中受控样例、检测到的风险类型等脱敏信息。

## 5. 命令注入实验设计

### 5.1 场景定位

业务包装建议为“诊断任务运行器”或“日志归档任务”。

学习目标：

- 理解把用户输入拼入命令执行流程的风险。
- 理解允许列表、参数数组、任务 ID 映射和禁止 shell 拼接的防御价值。

### 5.2 漏洞版

漏洞版展示“输入被当作命令片段解释”的风险，但只能使用虚拟命令运行器。

后端不得调用：

- `child_process`
- 系统 shell
- PowerShell
- `cmd.exe`
- 任意真实系统命令

漏洞版只在内存中识别受控样例，返回虚拟执行结果和学习信号。

建议学习信号：

- `command-injection-virtual-command-executed`
- `command-injection-command-separator-detected`

### 5.3 修复版

修复版只接受允许列表任务 ID。

建议修复点：

- 任务 ID 映射固定命令模板。
- 用户输入只能作为普通参数值。
- 拒绝分隔符、管道、重定向和不在允许列表中的任务。
- 日志只记录风险类型，不记录完整输入。

建议学习信号：

- `command-injection-allowlist-blocked`
- `command-injection-normal-task-completed`

### 5.4 验证方式

最小验证：

- 漏洞版受控样例返回虚拟额外命令执行信号。
- 修复版同样样例返回阻断信号。
- 正常任务在修复版仍可完成。
- 事件日志记录 `attack` / `defense` 差异。

## 6. SSTI 实验设计

### 6.1 场景定位

业务包装建议为“通知模板预览”。

学习目标：

- 理解模板引擎把用户输入当作模板语法解释的风险。
- 理解模板变量白名单、转义和模板来源隔离的防御价值。

### 6.2 漏洞版

漏洞版使用教学用模板模拟器展示风险，不接入真实危险模板引擎。

后端不得使用：

- `eval`
- `Function`
- Node VM 执行不可信代码
- 可访问运行时对象的真实模板表达式

漏洞版可以识别固定受控表达式类别，并返回“表达式被解释”的学习信号。

建议学习信号：

- `ssti-expression-evaluated`
- `ssti-template-context-exposed`

### 6.3 修复版

修复版只允许固定变量插值，例如姓名、订单号、通知标题这类教学字段。

建议修复点：

- 模板来源由系统维护，用户只提供变量值。
- 变量名走允许列表。
- 未知表达式原样转义或拒绝。
- 不暴露运行时对象或服务器上下文。

建议学习信号：

- `ssti-expression-blocked`
- `ssti-safe-template-rendered`

### 6.4 验证方式

最小验证：

- 漏洞版受控表达式出现解释信号。
- 修复版同样输入被阻断或转义。
- 正常模板变量仍能渲染。
- 事件日志区分攻击尝试和正常预览。

## 7. XXE 实验设计

### 7.1 场景定位

业务包装建议为“XML 发票 / 配置导入预览”。

学习目标：

- 理解 XML 外部实体解析可能读取本地资源或触发服务端请求。
- 理解禁用 DTD、禁用外部实体和使用安全解析器配置的防御价值。

### 7.2 漏洞版

漏洞版只使用虚拟 XML 资源解析。

后端不得：

- 读取真实本机文件。
- 请求真实外部 URL。
- 解析真实外部实体。
- 返回真实环境变量或真实系统路径内容。

漏洞版可以把固定虚拟实体映射到 `mock/` 中的教学资源名称，并返回学习信号。

建议学习信号：

- `xxe-virtual-entity-resolved`
- `xxe-internal-resource-exposed`

### 7.3 修复版

修复版应拒绝 DTD、外部实体或不可信实体声明。

建议修复点：

- 禁用 DTD。
- 禁用外部实体。
- 限制 XML 大小和嵌套深度。
- 只读取业务需要字段。
- 返回明确阻断原因。

建议学习信号：

- `xxe-doctype-blocked`
- `xxe-safe-xml-imported`

### 7.4 验证方式

最小验证：

- 漏洞版受控 XML 样例返回虚拟实体解析信号。
- 修复版同样 XML 返回 DTD / 外部实体阻断信号。
- 正常 XML 在修复版仍可导入。
- 事件日志不保存完整 XML 文档。

## 8. 脚本边界

三类实验后续脚本只允许：

- 默认访问 `http://127.0.0.1:6667`。
- 允许目标限定为 `localhost`、`127.0.0.1`、`::1`。
- 调用本项目对应 API。
- 输出本机受控学习信号。

脚本不允许：

- 扫描端口或网段。
- 访问外部目标。
- 生成通用攻击 payload 库。
- 执行真实系统命令。
- 读取本机真实文件。
- 使用真实凭据、真实 token 或真实 Cookie。

## 9. 后续执行切片

推荐后续按以下切片推进：

1. 命令注入执行文档。
2. 命令注入前后端、元数据、文档、脚本和测试。
3. SSTI 执行文档。
4. SSTI 前后端、元数据、文档、脚本和测试。
5. XXE 执行文档。
6. XXE 前后端、元数据、文档、脚本和测试。
7. 三个实验的统一回归验证与 TODO 收口。

每个实现切片都必须完成最小必要验证后再更新状态。

## 10. 完成判定

单个实验达到以下条件，才可从占位进入可用状态：

- `meta.json` 状态改为 `ready`。
- 漏洞版与修复版工作台入口可用。
- 后端受控 API 可用。
- 事件日志写入成功。
- 详情页可展示变体入口、文档、脚本和验证方式。
- 文档包含攻击步骤、修复说明和手动验证。
- 脚本目录包含本机受控 `exploit.py` 与 `verify.ts`。
- 服务端 API 或 service 测试通过。
- 前端 helper / API 测试通过。
- `git diff --check` 无空白错误。

