<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 凭据填充风险观察步骤

1. 登录本机学习平台。
2. 打开 `/labs/auth/credential-stuffing/vuln`。
3. 选择固定案例“重复凭据登录批次”。
4. 选择“缺少跨请求关联”。
5. 点击“运行固定评估”。
6. 观察决策 `accepted`、学习信号 `auth-credential-stuffing-risk-accepted` 和风险标签。
7. 在统一事件日志中确认只记录固定 key 和安全摘要。

该流程只观察固定本机教学结果，不提供外部目标操作步骤。
