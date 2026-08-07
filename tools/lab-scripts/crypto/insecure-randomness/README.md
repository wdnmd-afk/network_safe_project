# 不安全随机数实验脚本

## 只读验证

`verify.ts` 只读取仓库内 insecure-randomness 元数据、文档、前后端入口和测试文件，输出 JSON 一致性报告。

运行：

`pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/crypto/insecure-randomness/verify.ts`

本实验不提供 `exploit.py`。风险路径由本机固定状态机展示，不生成或接收真实 token、secret、seed、时间戳、计数器、用户信息或随机材料。

禁止将本目录扩展为 token 序列预测、枚举、爆破、会话接管、外部目标探测或通用攻击工具。
