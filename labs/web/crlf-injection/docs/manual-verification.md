# CRLF 注入手动验证

## 验证前置

- 本机后端服务已启动。
- 本机前端页面可访问。
- 已登录演示账号。
- `web/crlf-injection` 元数据状态为 `ready`。

## 漏洞版正常预览

1. 打开 `/labs/web/crlf-injection/vuln`。
2. 点击“填入正常文件名”。
3. 点击“生成响应头预览”。
4. 预期信号为 `crlf-injection-safe-header-previewed`。
5. 虚拟头部只包含正常 `Content-Disposition`。

## 漏洞版受控样例

1. 打开 `/labs/web/crlf-injection/vuln`。
2. 点击“填入受控样例”。
3. 点击“生成响应头预览”。
4. 预期信号为 `crlf-injection-virtual-header-injected`。
5. 页面显示 `virtual-injected` 教学头部，并说明它没有写入真实响应。

## 修复版阻断

1. 打开 `/labs/web/crlf-injection/fixed`。
2. 点击“填入受控样例”。
3. 点击“生成响应头预览”。
4. 预期信号为 `crlf-injection-control-chars-blocked`。
5. 后端决策为 `blocked`，虚拟污染头部数量为 `0`。

## 日志检查

在账户中心或实验详情页查看最近事件复盘：

- 漏洞版受控样例阶段应为 `attack`。
- 修复版阻断阶段应为 `defense`。
- 日志只展示模板、下载方式、文件名长度、脱敏预览、控制字符类别、虚拟头部数量和学习信号。
- 日志不展示完整危险文件名、完整 header 文本、真实 token、真实 Cookie 或外部目标信息。

## 当前后端验证

```powershell
pnpm --filter @network-safe/server test -- tests/crlf-injection-lab.test.ts
```

## 脚本验证

```powershell
pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/crlf-injection/verify.ts
python tools/lab-scripts/web/crlf-injection/exploit.py --token <local-token> --variant vuln --sample controlled
python tools/lab-scripts/web/crlf-injection/exploit.py --token <local-token> --variant fixed --sample controlled
```
