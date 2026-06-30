# SSTI

## 实验目标

本实验通过“通知模板预览”学习服务端模板注入风险：

- 漏洞版展示模板文本中的固定受控表达式被解释后的学习信号。
- 修复版展示系统模板、变量允许列表和表达式阻断的防御价值。
- 后端写入统一实验事件日志，便于账户中心和实验详情页复盘。

## 使用方式

1. 登录平台演示账号。
2. 进入 `/labs/web/ssti/vuln`。
3. 点击“填入表达式样例”或“填入上下文样例”，提交预览。
4. 切换到 `/labs/web/ssti/fixed`，提交同样样例。
5. 对比后端决策、学习信号、表达式类别和事件日志。

## 安全边界

- 本实验只使用教学用模板模拟器。
- 不使用 `eval`、`Function`、Node VM 或真实危险模板表达式执行。
- 受控表达式结果来自固定教学映射。
- 不读取真实服务器上下文、环境变量、文件系统或网络资源。
- 日志只记录模板长度、变量名、表达式类别、是否命中受控样例和学习信号，不记录完整模板、完整表达式或完整变量值。

## 预期信号

- `ssti-safe-template-rendered`
- `ssti-expression-evaluated`
- `ssti-template-context-exposed`
- `ssti-expression-blocked`

## 相关文档

- `docs/attack-steps.md`
- `docs/fix-notes.md`
- `docs/manual-verification.md`
