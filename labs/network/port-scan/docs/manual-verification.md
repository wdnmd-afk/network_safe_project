# 手动验证

## 1. 当前可验证内容

当前 `in-progress` 阶段可验证：

- `labs/network/port-scan/meta.json` 存在。
- `README.md`、`vuln/README.md`、`fixed/README.md`、`mock/README.md` 存在。
- 攻击步骤、修复说明和手动验证文档存在。
- 元数据登记 docs 入口和后端 API 入口，不登记未实现的 web 或 scripts 入口。
- 自动化验证已登记 `apps/server/tests/port-scan-lab.test.ts`。
- 后端 API 只接收 `targetKey` 和 `scanProfile`。
- 未知目标会返回 `port-scan-target-blocked`，且不会回显原始目标。
- 文档明确禁止真实扫描、任意目标输入和通用扫描器能力。

## 2. 预期信号

当前手动验证确认 API 与安全边界信号：

- `port-scan-management-surface-visible`
- `port-scan-surface-reduced`
- `port-scan-target-blocked`
- `port-scan-virtual-boundary-verified`
- `port-scan-no-real-scan-confirmed`

## 3. 不应出现的内容

当前阶段不应出现：

- `/labs/network/port-scan/vuln` 页面入口。
- `/labs/network/port-scan/fixed` 页面入口。
- `exploit.py`。
- 真实扫描脚本。
- 真实 socket 探测。
- 系统网络探测命令调用。
