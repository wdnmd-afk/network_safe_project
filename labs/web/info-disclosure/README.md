# 信息泄露

## 实验目标

本实验通过一个受控的“服务诊断报告查看”业务，展示信息泄露如何发生，以及修复版如何收敛错误信息并隔离调试入口。

学习顺序：

1. 先使用公开报告 `public-status` 观察正常业务。
2. 再在漏洞版提交调试报告 `debug-diagnostics`，观察教学占位的堆栈、配置键名和 token 形态如何被返回。
3. 最后在修复版提交同样报告 key，观察调试报告如何被阻断，并查看事件日志中的防御信号。

## 安全边界

- 本实验只查询内置虚拟诊断报告表。
- 不读取真实环境变量、真实 token、真实日志、真实文件或真实数据库连接信息。
- 调试报告内容全部是教学占位文本。
- 统一事件日志只记录报告 key 摘要、是否请求敏感报告、字段类别数量和学习信号。

## 入口

- 漏洞版页面：`/labs/web/info-disclosure/vuln`
- 修复版页面：`/labs/web/info-disclosure/fixed`
- 漏洞版 API：`POST /api/labs/web/info-disclosure/vuln/report`
- 修复版 API：`POST /api/labs/web/info-disclosure/fixed/report`

请求字段固定为：

```json
{
  "reportKey": "debug-diagnostics"
}
```

## 预期信号

- 正常公开报告：`info-disclosure-public-report-returned`
- 漏洞版调试报告暴露：`info-disclosure-debug-data-exposed`
- 修复版调试报告阻断：`info-disclosure-debug-data-blocked`

## 配套文件

- `vuln/README.md`：漏洞版说明
- `fixed/README.md`：修复版说明
- `mock/README.md`：虚拟数据说明
- `docs/attack-steps.md`：攻击步骤
- `docs/fix-notes.md`：修复说明
- `docs/manual-verification.md`：手动验证说明
