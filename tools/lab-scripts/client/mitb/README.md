# 浏览器 MITB 只读验证

## 用途

对 `client.mitb` 做本机只读一致性验证，覆盖元数据结构、固定交易视图、三方对照计数、引导式目录毕业状态、前后端专用路由顺序、canonical 信号、文档完整性和禁用能力。

## 运行方式

```bash
pnpm --filter @network-safe/server exec tsx ../../tools/lab-scripts/client/mitb/verify.ts
```

必须从 `@network-safe/server` 工作区运行，因为脚本复用服务端固定交易视图常量，需要该工作区解析 `@network-safe/shared` 依赖。

## 安全边界

- 只读取仓库内元数据、文档、实现和测试文件，并导入服务端固定视图常量。
- 不发起 HTTP 请求，不读取真实浏览器 DOM、扩展、Cookie、会话或凭据。
- 不连接任何支付、银行或金融接口，也不执行系统命令。
- 不提供 `exploit.py`，不实现或描述任何浏览器内篡改能力。
- 对照计数只由固定虚构视图的字段比较确定性推导。
