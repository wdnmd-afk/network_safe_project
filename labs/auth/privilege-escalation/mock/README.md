# 权限提升 Mock 数据

本实验使用后端内置虚拟操作：

| 操作 key | 要求角色 | 用途 |
|---|---|---|
| `view-profile-summary` | `member` | 普通用户正常操作 |
| `approve-refund` | `admin` | 用于观察客户端 admin 声明提权风险 |

这些操作只用于本机教学，不会修改真实用户、订单、退款或配置。
