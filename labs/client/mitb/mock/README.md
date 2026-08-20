# 固定交易视图说明

本目录表示服务端内存中的固定虚构交易视图，不保存、导出或采集任何真实交易数据。

- 固定案例 key：`fixed-browser-transaction-view-audit`。
- 虚构视图：`virtual-tampered-transfer-view`、`virtual-consistent-transfer-view`。
- 虚构收款方：`virtual-supplier-a`、`virtual-unknown-payee-z`。
- 教学金额：`1000.00`、`9500.00`，仅为固定字符串常量。
- 对照来源：浏览器显示、服务端记录、带外确认通道三方。
- 姿态枚举：`tampered`、`consistent`。

禁止在本目录加入真实账户号、卡号、IBAN、SWIFT、商户号、交易号、签名值、浏览器指纹、Cookie、会话令牌或任何可用于真实支付的指令。
