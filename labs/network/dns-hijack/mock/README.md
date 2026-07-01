# DNS 劫持 / 污染 mock 说明

## 1. 当前状态

当前为 `in-progress` 后端 API 阶段，已在 `apps/server/src/services/dns-hijack-lab.ts` 实现固定内存解析表。

## 2. 当前 mock 模型

当前使用固定内存解析表，不从用户输入构造真实域名或真实解析请求。

固定样例：

| `domainKey` | 展示域名 | 漏洞版观察 | 修复版观察 |
|---|---|---|---|
| `customer-portal` | `portal.example.test` | 解析到错误虚拟服务 | 恢复到可信服务 |
| `update-service` | `update.example.test` | 更新入口证书不匹配 | 可信解析和证书校验通过 |
| `internal-dashboard` | `dashboard.example.test` | 内部入口解析异常 | 异常解析被审计或阻断 |

解析结果字段：

- `domainKey`
- `resolverProfile`
- `expectedAddressCategory`
- `resolvedAddressCategory`
- `certificateStatus`
- `anomalyDetected`
- `learningHint`

## 3. 禁止内容

mock 数据不得包含：

- 真实域名访问历史。
- 真实 IP。
- 真实 DNS 响应。
- 真实证书内容。
- 真实 Cookie、token、凭据或个人信息。
