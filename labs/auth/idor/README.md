# IDOR

## 实验目标

本实验用于学习 IDOR（Insecure Direct Object Reference，不安全的直接对象引用）问题。场景模拟一个订单详情接口，学习者先以正常用户读取自己的订单，再把请求中的 `orderId` 替换为他人订单，观察漏洞版和修复版的后端判定差异。

本实验不是通用越权工具，只面向本项目本机受控环境。

## 业务场景

- 当前登录用户 ID：`1`
- 自己的受控订单：`order-1001`
- 他人的受控订单：`order-2001`
- 请求字段固定为：`orderId`

接口入口：

- `POST /api/labs/auth/idor/vuln/read`
- `POST /api/labs/auth/idor/fixed/read`

页面入口：

- `/labs/auth/idor/vuln`
- `/labs/auth/idor/fixed`

## 学习重点

- 攻击方可以控制对象 ID。
- 漏洞版只按对象 ID 读取资源，没有校验对象归属。
- 修复版在后端进行对象级授权校验。
- 日志如何记录跨用户对象读取尝试。

## 预期信号

- 正常读取自己的订单：`idor-own-order-accepted`
- 漏洞版读取他人订单：`idor-cross-user-order-exposed`
- 修复版阻断他人订单：`idor-cross-user-order-blocked`

## 安全边界

- 使用虚拟订单数据，不读取真实订单表。
- 攻击脚本只允许本机地址。
- 不做对象 ID 枚举、扫描或爆破。
- 事件日志只保存 `orderId` 摘要、对象类型、归属判断和学习信号。
