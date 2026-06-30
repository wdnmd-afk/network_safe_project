# 命令注入手动验证

## 验证矩阵

| 场景 | 入口 | 输入 | 预期状态 | 预期信号 |
|---|---|---|---|---|
| 漏洞版正常任务 | `/labs/web/command-injection/vuln` | `storefront-cache` | 200 | `command-injection-normal-task-completed` |
| 漏洞版受控样例 | `/labs/web/command-injection/vuln` | `storefront-cache && reveal-debug-note` | 200 | `command-injection-virtual-command-executed` |
| 修复版受控样例 | `/labs/web/command-injection/fixed` | `storefront-cache && reveal-debug-note` | 403 | `command-injection-allowlist-blocked` |

## 页面验证步骤

1. 登录平台演示账号。
2. 进入漏洞版页面。
3. 点击“填入正常目标”，运行诊断，确认正常任务完成。
4. 点击“填入攻击样例”，运行诊断，确认出现虚拟额外步骤。
5. 切换到修复版页面。
6. 再次点击“填入攻击样例”，运行诊断，确认请求被阻断。
7. 回到账户中心或实验详情页查看最近事件复盘。

## 日志验证

事件日志应出现：

- `labKey`: `web.command-injection`
- `variantKey`: `vuln` 或 `fixed`
- `phase`: `attack` / `defense` / `normal`
- `signal`: 对应上表预期信号

事件日志不应保存完整虚拟目标输入。
