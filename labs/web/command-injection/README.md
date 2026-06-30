# 命令注入

## 实验目标

本实验通过“诊断任务运行器”学习命令注入风险。

漏洞版模拟把用户输入当作命令片段解释，固定受控样例会触发虚拟额外步骤。修复版只接受允许列表任务 ID，并把目标作为普通参数值处理。

## 安全边界

- 只面向本机、本项目、受控实验环境。
- 后端只使用虚拟命令运行器。
- 不调用真实 shell、PowerShell、`cmd.exe`、`child_process` 或系统命令。
- 不读取真实本机文件。
- 不访问外部目标。
- 事件日志不保存完整目标输入。

## 入口

- 漏洞版：`/labs/web/command-injection/vuln`
- 修复版：`/labs/web/command-injection/fixed`
- 漏洞版 API：`POST /api/labs/web/command-injection/vuln/run`
- 修复版 API：`POST /api/labs/web/command-injection/fixed/run`

## 受控样例

- 正常目标：`storefront-cache`
- 受控攻击样例：`storefront-cache && reveal-debug-note`

该样例只会被虚拟命令运行器识别，不会交给真实系统执行。

## 预期信号

- 漏洞版受控样例：`command-injection-virtual-command-executed`
- 修复版受控样例：`command-injection-allowlist-blocked`
- 正常任务：`command-injection-normal-task-completed`

## 文档

- [攻击步骤](docs/attack-steps.md)
- [修复说明](docs/fix-notes.md)
- [手动验证](docs/manual-verification.md)
