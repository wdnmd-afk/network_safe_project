# 业务流程跳步实验脚本

## 只读验证

`verify.ts` 只读取仓库内 workflow-bypass 元数据、文档、前后端入口和测试文件，输出 JSON 一致性报告。

运行：

`pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/business-logic/workflow-bypass/verify.ts`

本实验不提供 `exploit.py`。风险路径由本机固定状态机展示，不需要构造真实订单、阶段、支付数据、外部 URL 或可迁移的流程绕过请求。

禁止将本目录扩展为外部接口枚举、批量流程绕过、支付跳过、订单操作或通用攻击工具。
