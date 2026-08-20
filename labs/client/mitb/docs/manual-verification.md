# 手工验证矩阵

## 固定契约

- scenarioKey：`fixed-browser-transaction-view-audit`。
- 第一阶段 optionKey：`trust-browser-rendered-view`、`compare-server-and-out-of-band-view`。
- 第二阶段 optionKey：`submit-transaction-from-browser-view`、`block-mismatched-transaction`、`confirm-consistent-transaction`。

## 路径一：漏洞版风险接受

1. 打开 `/labs/client/mitb/vuln`。
2. 选择 `trust-browser-rendered-view` 和 `submit-transaction-from-browser-view`。
3. 预期 HTTP 200、decision 为 `accepted`、signal 为 `client-mitb-risk-accepted`。
4. 预期视图摘要为 `virtual-tampered-transfer-view`：4 项发现、3 项三方不一致、0 项受信路径控制。

## 路径二：修复版防御阻断

1. 打开 `/labs/client/mitb/fixed`。
2. 选择 `compare-server-and-out-of-band-view` 和 `block-mismatched-transaction`。
3. 预期 HTTP 403、decision 为 `blocked`、signal 为 `client-mitb-defense-blocked`。
4. 预期视图摘要为 `virtual-consistent-transfer-view`：0 项发现、0 项不一致、4 项受信路径控制。

## 路径三：修复版正常确认

1. 保持 `compare-server-and-out-of-band-view`。
2. 选择 `confirm-consistent-transaction`。
3. 预期 HTTP 200、decision 为 `accepted`、signal 为 `client-mitb-normal-verified`。
4. 预期 disposition 为 `consistent-transaction-confirmed`，证明受信路径校验不阻断正常交易。

## 路径四：边界阻断

1. 提交未登记 scenarioKey / optionKey、只提交第一阶段，或在终止步骤后追加多余决策。
2. 预期返回 `client-mitb-boundary-blocked` 或 `path-incomplete` 对应的脱敏阻断结果。
3. 响应与事件日志不得包含原始未知 key、真实账户、卡号、IBAN、商户号、交易号、金额指令或浏览器指纹。
