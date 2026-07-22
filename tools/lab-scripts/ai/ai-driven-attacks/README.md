<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# AI 驱动攻击实验脚本

## 只读验证

`verify.ts` 只读取仓库内共享场景目录、元数据、文档、通用前后端入口和测试文件，输出 JSON 一致性报告。

运行：

`pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/ai/ai-driven-attacks/verify.ts`

本实验不提供 `exploit.py`，因为固定案例或状态模拟已经满足学习目标。

禁止将本目录扩展为外部扫描、投递、样本执行、凭据收集或通用攻击工具。
