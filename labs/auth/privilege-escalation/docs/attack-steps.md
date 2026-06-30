# 权限提升攻击步骤

## 前置条件

- 已登录本项目本机演示账号。
- 后端服务运行在本机。
- 打开 `/labs/auth/privilege-escalation/vuln`。

## 步骤

1. 点击“普通操作”，确认请求体为：

   ```json
   {
     "operationKey": "view-profile-summary",
     "requestedRole": "member"
   }
   ```

2. 点击“执行操作”，观察正常业务信号：

   ```text
   privilege-normal-operation-accepted
   ```

3. 点击“客户端 admin 声明”，请求体变为：

   ```json
   {
     "operationKey": "approve-refund",
     "requestedRole": "admin"
   }
   ```

4. 再次点击“执行操作”，观察漏洞版执行虚拟管理操作。

5. 后端日志和数据库事件日志应出现：

   ```text
   privilege-client-role-admin-accepted
   ```

## 攻击方观察点

- 可控输入是 `operationKey` 与 `requestedRole`。
- 漏洞根因不是用户真的变成了管理员，而是后端信任了客户端角色声明。
- 同一请求在修复版中应被阻断。

## 安全边界

本实验只提交固定受控样例，不做权限枚举、接口扫描或真实提权。
