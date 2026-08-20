# 浏览器 MITB 交易视图固定审计

## 场景目标

对比两组固定交易视图，观察浏览器显示、服务端记录和带外确认通道的三方一致性，并完成两步交易处置决策。

固定案例为 `fixed-browser-transaction-view-audit`。所有收款方标识统一使用 `virtual-*` 前缀，金额为教学常量，全部是服务端内存冻结数据，不读取真实浏览器状态，也不接触任何支付接口。

## 固定交易视图

- `virtual-tampered-transfer-view`：浏览器显示 `virtual-supplier-a` / `1000.00`，服务端记录与带外通道均为 `virtual-unknown-payee-z` / `9500.00`，交易未签名；固定 4 项发现、3 项三方不一致、0 项受信路径控制。
- `virtual-consistent-transfer-view`：三方均为 `virtual-supplier-a` / `1000.00` 且交易已签名；固定 0 项发现、0 项不一致、4 项受信路径控制。

不一致计数覆盖收款方、金额和带外通道三个对照维度；受信路径控制计数在三项一致之外再计入独立交易签名。

## 固定决策

- 第一阶段 `transaction-view-assessment`：`trust-browser-rendered-view` 或 `compare-server-and-out-of-band-view`。
- 第二阶段 `transaction-disposition`：`submit-transaction-from-browser-view`、`block-mismatched-transaction` 或 `confirm-consistent-transaction`。
- 风险信号：`client-mitb-risk-accepted`。
- 防御信号：`client-mitb-defense-blocked`。
- 正常信号：`client-mitb-normal-verified`。
- 边界阻断信号：`client-mitb-boundary-blocked`。

## 前置条件

- 本机前端与后端服务已启动。
- 使用本项目本机演示账号登录。
- 不需要真实银行账户、支付凭据、浏览器扩展或抓包工具。

## 使用方式

1. 访问 `/labs/client/mitb/vuln`，观察三方不一致视图被按浏览器显示提交的固定风险路径。
2. 切换到 `/labs/client/mitb/fixed`，比对服务端记录与带外通道并阻断不一致交易。
3. 载入一致交易基线路径，确认受信路径校验不阻断正常业务。
4. 在实验详情或账户中心复盘统一事件日志的安全摘要。

## 安全边界

- 该实验按 case-study ready 例外收口，不提供 `exploit.py`。
- 固定交易视图只存在于服务端内存常量，不读取真实浏览器 DOM、扩展、Cookie、会话或凭据。
- 页面和 API 不接受账户、卡号、金额、收款方、交易号、签名值、浏览器指纹或自由文本。
- 未知 key 会被脱敏阻断，不回显原始输入，也不写入事件日志。
- 不发起真实支付、转账、扣款、撤销或任何金融接口调用，也不描述任何注入或篡改手法。
