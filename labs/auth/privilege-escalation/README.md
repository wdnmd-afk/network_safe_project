# 权限提升

## 实验目标

本实验用于学习垂直权限提升问题。场景模拟一个管理操作执行器，学习者先以普通用户执行普通操作，再把请求中的 `requestedRole` 改成 `admin` 并请求管理操作，观察漏洞版和修复版的后端判定差异。

本实验不是通用提权工具，只面向本项目本机受控环境。

## 业务场景

- 当前登录用户服务端角色：`member`
- 普通操作：`view-profile-summary`
- 管理操作：`approve-refund`
- 请求字段固定为：
  - `operationKey`
  - `requestedRole`

接口入口：

- `POST /api/labs/auth/privilege-escalation/vuln/execute`
- `POST /api/labs/auth/privilege-escalation/fixed/execute`

页面入口：

- `/labs/auth/privilege-escalation/vuln`
- `/labs/auth/privilege-escalation/fixed`

## 学习重点

- 客户端传来的角色声明不能作为授权依据。
- 漏洞版信任 `requestedRole=admin`，导致普通用户执行管理操作。
- 修复版只信任登录态中的服务端角色。
- 日志如何记录权限提升尝试和阻断原因。

## 预期信号

- 普通操作通过：`privilege-normal-operation-accepted`
- 漏洞版接受客户端 admin 声明：`privilege-client-role-admin-accepted`
- 修复版阻断客户端 admin 声明：`privilege-client-role-admin-blocked`

## 安全边界

- 使用虚拟管理操作，不修改真实用户角色。
- 攻击脚本只允许本机地址。
- 不做权限枚举、接口扫描或真实提权。
- 事件日志只保存操作 key 摘要、服务端角色、客户端声明角色和学习信号。
