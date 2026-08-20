# 防御复盘版

防御复盘版使用同一固定案例，先选择 `compare-server-and-out-of-band-view`，再对比两条处置路径：

- `block-mismatched-transaction`：阻断三方视图不一致且未签名的交易，返回 `client-mitb-defense-blocked`（HTTP 403）。
- `confirm-consistent-transaction`：依据三方一致与独立交易签名确认基线，返回 `client-mitb-normal-verified`（HTTP 200）。

两条路径共同说明受信路径校验只阻断不一致交易，不影响正常业务确认。所有结论都基于固定虚构交易视图，不发起真实支付、转账、扣款或撤销操作。
