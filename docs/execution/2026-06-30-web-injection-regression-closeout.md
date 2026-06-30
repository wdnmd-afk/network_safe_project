# Web 扩展注入实验统一回归验证与收口执行文档

## 1. 目标

对下一批 Web 注入类扩展实验进行统一回归验证与状态收口。

本轮覆盖：

- `web/command-injection`
- `web/ssti`
- `web/xxe`

目标不是新增实验能力，而是确认三项实验已经同时满足以下要求：

- 漏洞版与修复版入口一致可用。
- 后端受控 API 可用。
- 统一事件日志写入路径仍可用。
- 元数据、文档、脚本和测试入口一致。
- 安全边界未被后续实现破坏。
- TODO 和总纲状态从“进行中”推进到“扩展注入实验回归收口完成”。

## 2. 范围

本轮验证范围：

- 服务端三项实验 API / service 测试。
- 前端三项实验 API client / helper / 路由测试。
- 前后端 TypeScript 类型检查。
- 共享元数据测试。
- 三项实验 `verify.ts` 验证计划输出。
- 三项实验 `exploit.py` 语法检查。
- 安全边界关键词检查。
- 文档状态同步。

本轮不包含：

- 不新增新的攻击类型。
- 不新增数据库迁移。
- 不执行全量打包。
- 不访问外部目标。
- 不启动真实攻击扫描。
- 不读取真实本机敏感文件。

## 3. 已确认上下文

本轮开始前已确认：

- `docs/design/next-wave-web-injection-labs.md`
  - 第 9 节要求三项实验最后进行统一回归验证与 TODO 收口。
- `docs/TODO.md`
  - 当前进行中项为 `web/command-injection`、`web/ssti`、`web/xxe` 三个扩展注入实验统一回归验证与收口。
- `docs/execution/security-lab-master-goal.md`
  - 当前基线中三项实验均具备漏洞版 / 修复版页面、受控 API、统一事件日志、文档、脚本和 API 差异验证。
- 三项实验已有单项验证记录，但还需要统一验证后同步收口状态。

## 4. 安全边界

统一回归必须继续保证：

- 命令注入只使用虚拟命令运行器，不调用真实 shell、PowerShell、`cmd.exe`、`child_process` 或系统命令。
- SSTI 只使用教学用模板模拟器，不使用 `eval`、`Function`、Node VM 或真实危险模板表达式执行。
- XXE 只使用虚拟 XML 资源解析器，不读取真实本机文件、不请求真实外部 URL、不解析真实外部实体。
- 三项脚本只允许 localhost / 127.0.0.1 / ::1。
- 三项日志不保存完整危险输入、真实密码、真实 token、真实 Cookie、完整 payload 或外部目标信息。

## 5. 验证矩阵

### 5.1 服务端

运行：

```powershell
pnpm --filter @network-safe/server test -- tests/command-injection-lab.test.ts tests/ssti-lab.test.ts tests/xxe-lab.test.ts
```

预期：

- `web.command-injection` 漏洞版受控样例返回 `command-injection-virtual-command-executed`。
- `web.command-injection` 修复版受控样例返回 `command-injection-allowlist-blocked`。
- `web.ssti` 漏洞版受控样例返回 `ssti-expression-evaluated` 或 `ssti-template-context-exposed`。
- `web.ssti` 修复版受控样例返回 `ssti-expression-blocked`。
- `web.xxe` 漏洞版受控样例返回 `xxe-internal-resource-exposed` 或 `xxe-virtual-entity-resolved`。
- `web.xxe` 修复版受控样例返回 `xxe-doctype-blocked`。
- 三项 API 均写入脱敏 `inputSummary`。

### 5.2 前端

运行：

```powershell
pnpm --filter @network-safe/web exec vitest run tests/command-injection-api.test.ts tests/command-injection-lab.test.ts tests/ssti-api.test.ts tests/ssti-lab.test.ts tests/xxe-api.test.ts tests/xxe-lab.test.ts tests/router.test.ts
pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit
```

预期：

- 三项 API client 路径和请求体正确。
- 三项 helper 能生成学习进度与验证记录。
- 路由包含六个漏洞版 / 修复版工作台入口。
- 页面类型检查通过。

### 5.3 元数据

运行：

```powershell
pnpm --filter @network-safe/shared test
```

预期：

- 三项 `meta.json` 状态为 `ready`。
- 三项 web / api / scripts / docs 入口与实际文件一致。
- 三项 `scriptVerification.scriptKeys` 已启用。

### 5.4 脚本

运行：

```powershell
pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/command-injection/verify.ts
pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/ssti/verify.ts
pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/xxe/verify.ts
python -m py_compile tools/lab-scripts/web/command-injection/exploit.py tools/lab-scripts/web/ssti/exploit.py tools/lab-scripts/web/xxe/exploit.py
```

预期：

- 三个 `verify.ts` 只输出本机验证计划。
- 三个 `exploit.py` 语法检查通过。
- 不留下 `__pycache__` 等无关生成物。

### 5.5 空白与安全关键词

运行：

```powershell
git diff --check
rg -n "[ \t]+$" <本轮目标文件>
rg -n "<安全关键词>" <三项实验实现与脚本>
```

预期：

- 无新增行尾空白。
- `git diff --check` 无空白错误，仅允许既有 LF/CRLF 提示。
- 关键词检查不出现真实危险实现；若命中，必须是文档、测试、函数名或本机 API 请求。

## 6. 实施步骤

1. 运行服务端三项实验回归测试。
2. 运行前端三项实验 API / helper / 路由测试。
3. 运行前后端类型检查。
4. 运行共享元数据测试。
5. 运行三项脚本验证计划和 Python 语法检查。
6. 清理语法检查产生的 `__pycache__`。
7. 执行空白与安全关键词检查。
8. 若验证通过，更新 `docs/TODO.md` 和 `docs/execution/security-lab-master-goal.md`。
9. 若验证失败，先修复失败点，再重新运行对应验证。

## 7. 完成判定

同时满足以下条件，才可视为本轮收口完成：

- 三项实验服务端回归通过。
- 三项实验前端 API / helper / 路由回归通过。
- 前后端类型检查通过。
- 共享元数据测试通过。
- 三项脚本验证计划可输出，Python 脚本语法检查通过。
- 无新增空白错误。
- 安全关键词检查未发现真实危险能力。
- TODO 和总纲已同步下一步状态。

## 8. 实际执行结果

本轮统一回归已按上方矩阵完成，结论为通过。

- 服务端回归：`pnpm --filter @network-safe/server test -- tests/command-injection-lab.test.ts tests/ssti-lab.test.ts tests/xxe-lab.test.ts` 通过；该脚本实际运行服务端全量测试，126 项通过。
- 前端回归：`pnpm --filter @network-safe/web exec vitest run tests/command-injection-api.test.ts tests/command-injection-lab.test.ts tests/ssti-api.test.ts tests/ssti-lab.test.ts tests/xxe-api.test.ts tests/xxe-lab.test.ts tests/router.test.ts` 通过，7 个测试文件、19 项测试通过。
- 类型检查：`pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit` 与 `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit` 均通过。
- 元数据验证：`pnpm --filter @network-safe/shared test` 通过，19 项通过。
- 脚本验证：三个 `verify.ts` 均通过并输出本机验证计划。
- Python 语法检查：三个 `exploit.py` 均通过 `python -m py_compile`。
- 生成物清理：已删除三个脚本目录下由语法检查生成的 `__pycache__`。
- 安全关键词：三项实验实现与脚本未命中 `child_process`、`eval`、`new Function`、真实文件读取、真实网络请求、`process.env` 或 `inputSummaryJson` 等风险关键词。
- 空白检查：目标文件行尾空白扫描未命中；`git diff --check` 未发现空白错误，仅输出当前工作区既有 LF/CRLF 提示。

收口结论：

- `web/command-injection`、`web/ssti`、`web/xxe` 均保持本机受控学习边界。
- 三项实验的漏洞版 / 修复版页面、受控 API、统一事件日志、元数据、文档、脚本和测试入口已完成统一回归确认。
- TODO 与总纲下一步已转向注入类一期剩余清单规划。
