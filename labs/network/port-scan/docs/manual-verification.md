# 手动验证

## 1. 当前可验证内容

当前 `in-progress` 阶段可验证：

- `labs/network/port-scan/meta.json` 存在。
- `README.md`、`vuln/README.md`、`fixed/README.md`、`mock/README.md` 存在。
- 攻击步骤、修复说明和手动验证文档存在。
- 元数据登记 web、docs 和后端 API 入口，不登记未实现的 scripts 入口。
- 前端页面 `/labs/network/port-scan/vuln` 和 `/labs/network/port-scan/fixed` 只提供固定虚拟目标和固定观察模式选择器。
- 自动化验证已登记 `apps/server/tests/port-scan-lab.test.ts`。
- 页面级验证已登记 `packages/testing/tests/e2e/platform.spec.mjs`。
- 只读一致性验证已登记 `tools/lab-scripts/network/port-scan/verify.ts`。
- 后端 API 只接收 `targetKey` 和 `scanProfile`。
- 未知目标会返回 `port-scan-target-blocked`，且不会回显原始目标。
- 文档明确禁止真实扫描、任意目标输入和通用扫描器能力。

## 2. 预期信号

当前手动验证确认页面、API 与安全边界信号：

- `port-scan-management-surface-visible`
- `port-scan-surface-reduced`
- `port-scan-target-blocked`
- `port-scan-workbench-reviewed`
- `port-scan-virtual-boundary-verified`
- `port-scan-no-real-scan-confirmed`

## 3. 不应出现的内容

当前阶段不应出现：

- `exploit.py`。
- 真实扫描脚本。
- 真实 socket 探测。
- 系统网络探测命令调用。
- 任意 IP、域名、网段或端口范围输入框。

## 4. 只读脚本验证

可运行以下命令验证端口扫描实验的本地文档、元数据、入口和安全边界一致：

```bash
pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/network/port-scan/verify.ts
```

该脚本只读取仓库文件，不发起 HTTP 请求，不扫描真实端口。
