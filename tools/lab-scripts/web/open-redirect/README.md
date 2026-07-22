<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 开放重定向实验脚本

## 只读验证

`verify.ts` 只读取仓库内共享场景目录、元数据、文档、通用前后端入口和测试文件，输出 JSON 一致性报告。

运行：

`pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/open-redirect/verify.ts`

`exploit.py` 只向显式指定的 localhost / 127.0.0.1 后端发送固定案例请求，并要求临时 Bearer token；脚本不会保存 token。

禁止将本目录扩展为外部扫描、投递、样本执行、凭据收集或通用攻击工具。
