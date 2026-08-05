# API 功能级授权实验脚本

## 只读验证

`verify.ts` 只读取仓库内 BFLA 元数据、文档、前后端入口和测试文件，输出 JSON 一致性报告。

运行：

`pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/api/functional-authorization/verify.ts`

本实验首版不提供 `exploit.py`。风险路径由本机固定状态机展示，不需要构造真实账户、角色、外部 URL 或可迁移的越权请求。

禁止将本目录扩展为外部目标枚举、批量越权请求、凭据收集或通用攻击工具。
