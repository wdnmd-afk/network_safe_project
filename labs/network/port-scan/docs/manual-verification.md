# 手动验证

## 1. 当前可验证内容

当前 `planned` 阶段可验证：

- `labs/network/port-scan/meta.json` 存在。
- `README.md`、`vuln/README.md`、`fixed/README.md`、`mock/README.md` 存在。
- 攻击步骤、修复说明和手动验证文档存在。
- 元数据只登记 docs 入口，不登记未实现的 web、api 或 scripts 入口。
- 自动化验证标记为未启用。
- 文档明确禁止真实扫描、任意目标输入和通用扫描器能力。

## 2. 预期信号

当前手动验证只确认文档阶段信号：

- `port-scan-planned-docs-reviewed`
- `port-scan-virtual-boundary-verified`
- `port-scan-no-real-scan-confirmed`

## 3. 不应出现的内容

当前阶段不应出现：

- `/labs/network/port-scan/vuln` 页面入口。
- `/labs/network/port-scan/fixed` 页面入口。
- `/api/labs/network/port-scan/:variant/scan` 后端实现。
- `exploit.py`。
- 真实扫描脚本。
- 真实 socket 探测。
- 系统网络探测命令调用。

