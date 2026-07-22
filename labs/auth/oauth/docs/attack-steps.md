<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# OAuth 漏洞风险观察步骤

1. 登录本机学习平台。
2. 打开 `/labs/auth/oauth/vuln`。
3. 选择固定案例“授权响应关联缺失”。
4. 选择“授权请求未绑定”。
5. 点击“运行固定评估”。
6. 观察决策 `accepted`、学习信号 `auth-oauth-risk-accepted` 和风险标签。
7. 在统一事件日志中确认只记录固定 key 和安全摘要。

该流程只观察固定本机教学结果，不提供外部目标操作步骤。
