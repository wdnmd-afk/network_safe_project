# SSRF 实验

## 目标

本实验用于理解服务端请求伪造（SSRF）风险。实验从攻击方视角提交一个受控的内部元数据 URL 样例，再对比修复版如何通过协议限制、主机白名单和私有目标阻断保护服务端请求边界。

## 实验边界

- 仅面向本机、本项目、受控学习环境。
- 后端只查询内置虚拟资源表，不发起真实 HTTP 请求。
- 内部元数据是教学占位内容，不包含真实凭据、真实云资源或真实内部服务信息。
- 事件日志只记录 URL 摘要、协议、主机、目标分类和学习信号。

## 入口

- 漏洞版页面：`/labs/web/ssrf/vuln`
- 修复版页面：`/labs/web/ssrf/fixed`
- 漏洞版 API：`POST /api/labs/web/ssrf/vuln/fetch`
- 修复版 API：`POST /api/labs/web/ssrf/fixed/fetch`

## 关键样例

正常公开资源：

```json
{
  "targetUrl": "https://safe-mart-cdn.local/public/catalog.json"
}
```

受控攻击样例：

```json
{
  "targetUrl": "http://169.254.169.254/latest/meta-data/iam/security-credentials/demo"
}
```

## 预期信号

- 漏洞版提交受控攻击样例：`ssrf-internal-metadata-exposed`
- 修复版提交同一受控攻击样例：`ssrf-private-target-blocked`
- 任一版本提交正常公开资源：`ssrf-public-resource-fetched`

## 文档

- [攻击步骤](./docs/attack-steps.md)
- [修复说明](./docs/fix-notes.md)
- [手动验证](./docs/manual-verification.md)
