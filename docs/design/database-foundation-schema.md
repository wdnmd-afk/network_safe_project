# 数据库基础表设计

## 1. 文档目标

本文档用于明确本项目在一期阶段的数据库基础表设计，解决以下问题：

1. 哪些表属于平台核心
2. 哪些表属于具体实验场景
3. 平台如何记录实验、学习进度、验证结果
4. 漏洞版 / 修复版与实验元数据如何在数据库层关联

本文档只定义数据库基础骨架，不在本阶段展开所有实验场景的细节业务表。

## 2. 设计原则

### 2.1 平台核心表与实验场景表分离

数据库设计必须分两层：

- **平台核心表**
  - 负责用户、实验目录、学习记录、验证记录、运行记录
- **实验场景表**
  - 负责某个具体漏洞实验的业务数据、样本数据、攻击结果数据

不能把所有实验数据直接堆进平台通用表中。

### 2.2 平台表优先稳定

平台核心表一旦确定，应尽量保持长期稳定，因为它们会被以下模块共同依赖：

- 前端实验列表
- 实验详情页
- 学习记录
- 验证记录
- 自动化测试
- 后续脚本索引

### 2.3 场景表允许按实验扩展

例如：

- XSS 需要评论或输入数据表
- SQL 注入需要订单、用户、查询目标表
- IDOR 需要资源拥有关系表

这些表不应该提前全部设计成一个大而全模型，而应由各场景按需扩展。

## 3. 一期数据库分层

## 3.1 平台核心层

建议放在：

```text
database/schema/platform/
```

负责以下主题：

- 用户
- 实验主数据
- 实验变体
- 学习记录
- 验证记录
- 实验运行记录

## 3.2 实验场景层

建议放在：

```text
database/schema/labs/<category>/<scene>/
```

负责：

- 场景业务表
- 场景种子数据
- 场景初始化脚本

## 3.3 种子数据层

建议放在：

```text
database/seeds/
```

继续拆为：

- `platform/`
- `labs/<category>/<scene>/`

## 4. 平台核心表总览

一期建议先定义以下核心表：

| 表名 | 作用 |
|---|---|
| `users` | 平台用户 |
| `lab_categories` | 实验一级分类 |
| `labs` | 实验主表 |
| `lab_variants` | 实验变体表 |
| `lab_tags` | 标签定义 |
| `lab_tag_relations` | 实验与标签关系 |
| `learning_progress` | 学习进度记录 |
| `verification_records` | 验证结果记录 |
| `lab_run_records` | 实验运行记录 |

说明：

- 一期不急着设计过多平台表
- 先围绕“能展示实验、能进入实验、能记录学习、能记录验证”四件事建模

## 5. 核心表详细设计

## 5.0 一期构造约束

为了让本文档可以直接驱动 `Prisma schema` 与数据库落地，一期先明确以下统一约束：

1. 平台核心表主键默认使用 `bigint unsigned auto_increment`
2. 平台核心表统一保留：
   - `created_at`
   - `updated_at`
3. 时间统一使用 UTC 语义
4. `details_json`、`extra_json` 这类字段落 MySQL `json`，在 Prisma 中映射为 `Json`
5. 平台核心表优先使用强外键，不依赖纯字符串碰运气关联
6. 实验场景表允许自行扩展，但不得破坏平台核心表关系

## 5.1 `users`

### 作用

记录平台用户基础信息。

### 字段建议

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `bigint` | 主键 |
| `username` | `varchar(64)` | 登录名，唯一 |
| `password_hash` | `varchar(255)` | 密码哈希 |
| `display_name` | `varchar(100)` | 展示名称 |
| `role` | `varchar(32)` | 平台角色，如 `student`、`admin` |
| `status` | `varchar(32)` | 状态，如 `active`、`disabled` |
| `created_at` | `datetime` | 创建时间 |
| `updated_at` | `datetime` | 更新时间 |

### 说明

- 一期用户模型保持简单
- 后续认证授权实验中的业务身份，不一定完全复用平台角色
- 某些实验可在场景表中定义更细的业务用户数据

## 5.2 `lab_categories`

### 作用

统一记录实验一级分类，便于前端展示与后端索引。

### 字段建议

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `bigint` | 主键 |
| `code` | `varchar(64)` | 分类编码，如 `web`、`auth` |
| `name` | `varchar(100)` | 分类名称 |
| `description` | `varchar(255)` | 分类说明 |
| `sort_order` | `int` | 排序值 |
| `created_at` | `datetime` | 创建时间 |
| `updated_at` | `datetime` | 更新时间 |

## 5.3 `labs`

### 作用

实验主表。每一个实验场景在平台层对应一条主记录。

### 字段建议

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `bigint` | 主键 |
| `lab_key` | `varchar(128)` | 实验唯一键，对应元数据 `id` |
| `slug` | `varchar(128)` | 短标识，对应元数据 `slug` |
| `title` | `varchar(255)` | 实验标题 |
| `category_id` | `bigint` | 关联 `lab_categories.id` |
| `subcategory_code` | `varchar(128)` | 二级分类编码 |
| `mode` | `varchar(32)` | `interactive` / `simulation` / `case-study` |
| `severity` | `varchar(32)` | 风险等级 |
| `difficulty` | `varchar(32)` | 难度等级 |
| `summary` | `varchar(500)` | 简要说明 |
| `status` | `varchar(32)` | `planned` / `in-progress` / `ready` / `deprecated` |
| `phase` | `varchar(32)` | 如 `phase-1` |
| `sort_order` | `int` | 排序值 |
| `estimated_minutes` | `int` | 建议时长 |
| `meta_version` | `int` | 元数据版本号 |
| `meta_path` | `varchar(255)` | `meta.json` 路径 |
| `readme_path` | `varchar(255)` | README 路径 |
| `root_path` | `varchar(255)` | 实验根目录 |
| `is_enabled` | `tinyint(1)` | 是否启用 |
| `created_at` | `datetime` | 创建时间 |
| `updated_at` | `datetime` | 更新时间 |

### 说明

- `lab_key` 必须与 `meta.json` 中的 `id` 对齐
- `slug` 必须与元数据稳定一致
- `category_id` 使用强外键，避免分类漂移
- 平台列表页、详情页可优先从该表读取基础信息
- 后续可以通过扫描元数据同步更新这张表

## 5.4 `lab_variants`

### 作用

记录每个实验下的漏洞版 / 修复版等变体。

### 字段建议

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `bigint` | 主键 |
| `lab_id` | `bigint` | 关联 `labs.id` |
| `variant_key` | `varchar(32)` | 如 `vuln`、`fixed` |
| `title` | `varchar(100)` | 变体标题 |
| `description` | `varchar(255)` | 变体说明 |
| `entry_key` | `varchar(100)` | 对应元数据入口键 |
| `expected_outcome` | `varchar(255)` | 预期效果 |
| `supports_automation` | `tinyint(1)` | 是否支持自动化验证 |
| `is_enabled` | `tinyint(1)` | 是否启用 |
| `created_at` | `datetime` | 创建时间 |
| `updated_at` | `datetime` | 更新时间 |

### 说明

- 一期核心实验默认至少有 `vuln` 和 `fixed`
- 某些模拟或案例实验也可以有 `demo`、`analysis` 等扩展变体，但必须与元数据一致

## 5.5 `lab_tags`

### 作用

记录标签定义，避免字符串散落。

### 字段建议

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `bigint` | 主键 |
| `tag_code` | `varchar(64)` | 标签编码 |
| `tag_name` | `varchar(100)` | 标签名称 |
| `created_at` | `datetime` | 创建时间 |

## 5.6 `lab_tag_relations`

### 作用

记录实验与标签的多对多关系。

### 字段建议

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `bigint` | 主键 |
| `lab_id` | `bigint` | 关联实验 |
| `tag_id` | `bigint` | 关联标签 |
| `created_at` | `datetime` | 创建时间 |

## 5.7 `learning_progress`

### 作用

记录用户对某实验的学习进度。

### 字段建议

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `bigint` | 主键 |
| `user_id` | `bigint` | 用户 ID |
| `lab_id` | `bigint` | 实验 ID |
| `current_variant_key` | `varchar(32)` | 当前学习变体 |
| `status` | `varchar(32)` | 如 `not-started`、`in-progress`、`completed` |
| `started_at` | `datetime` | 开始时间 |
| `last_viewed_at` | `datetime` | 最近查看时间 |
| `completed_at` | `datetime` | 完成时间 |
| `notes` | `text` | 学习备注 |
| `created_at` | `datetime` | 创建时间 |
| `updated_at` | `datetime` | 更新时间 |

### 说明

- 该表记录“学到哪了”
- 不负责记录每次验证是否成功
- 学习备注允许用户记录观察现象或修复理解

## 5.8 `verification_records`

### 作用

记录用户或系统对实验的验证结果。

### 字段建议

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `bigint` | 主键 |
| `user_id` | `bigint` | 用户 ID，可为空表示系统触发 |
| `lab_id` | `bigint` | 实验 ID |
| `variant_key` | `varchar(32)` | 变体，如 `vuln` / `fixed` |
| `verification_type` | `varchar(32)` | `manual` / `playwright` / `api` / `script` |
| `result` | `varchar(32)` | `passed` / `failed` / `blocked` |
| `summary` | `varchar(255)` | 结果摘要 |
| `details_json` | `json` | 详细结果 |
| `triggered_by` | `varchar(32)` | `user` / `system` / `scheduler` |
| `created_at` | `datetime` | 创建时间 |

### 说明

- 该表记录“验证结果”
- 与学习进度表分工不同
- 后续 Playwright、脚本验证、接口验证都可以统一落这里

## 5.9 `lab_run_records`

### 作用

记录实验运行行为，便于后续分析实验使用情况。

### 字段建议

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `bigint` | 主键 |
| `user_id` | `bigint` | 用户 ID，可为空 |
| `lab_id` | `bigint` | 实验 ID |
| `variant_key` | `varchar(32)` | 访问或运行的变体 |
| `run_type` | `varchar(32)` | `web` / `api` / `script` |
| `entry_key` | `varchar(100)` | 命中的入口键 |
| `status` | `varchar(32)` | `started` / `finished` / `error` |
| `started_at` | `datetime` | 开始时间 |
| `ended_at` | `datetime` | 结束时间 |
| `extra_json` | `json` | 额外信息 |
| `created_at` | `datetime` | 创建时间 |

### 说明

- 该表不等同于验证表
- 它关注“有没有运行、运行到哪里”
- 后续可以用来观察哪些实验被频繁使用、哪些入口出错更多

## 6. 核心表关系

简化关系如下：

```text
users
  ├─ learning_progress
  ├─ verification_records
  └─ lab_run_records

lab_categories
  └─ labs
       ├─ lab_variants
       ├─ lab_tag_relations
       ├─ learning_progress
       ├─ verification_records
       └─ lab_run_records

lab_tags
  └─ lab_tag_relations
```

## 7. 平台表与元数据的关系

## 7.1 元数据优先，数据库缓存

本项目建议采用：

- `meta.json` 作为实验定义的真实来源
- 数据库中的 `labs`、`lab_variants` 作为平台查询和运行缓存

### 原因

- 实验目录是代码仓库的一部分
- 文档、路径、变体、脚本入口天然属于文件系统上下文
- 数据库存储适合承载索引、状态、记录和查询优化

## 7.2 同步策略

后续平台初始化时应支持：

1. 扫描 `labs/*/*/meta.json`
2. 读取基础信息
3. upsert 到 `labs`
4. 同步 `lab_variants`
5. 同步标签关系

### 注意

- 数据库中不应手工维护与元数据冲突的实验基础信息
- 一旦冲突，以受控同步流程为准

## 8. 实验场景表如何设计

## 8.1 设计原则

每个实验场景的业务表应按场景单独定义，不混入平台核心表。

示例：

- `database/schema/labs/web/xss/`
- `database/schema/labs/web/sql-injection/`
- `database/schema/labs/auth/idor/`

## 8.2 示例边界

### XSS

可自定义：

- 评论表
- 页面输入记录表

### SQL 注入

可自定义：

- 查询目标数据表
- 管理后台示例数据表

### IDOR

可自定义：

- 订单表
- 用户资源关联表

### 会话固定

可自定义：

- 场景会话表
- 登录状态模拟表

## 8.3 不建议的做法

- 不要把所有场景共用成一个“万能实验数据表”
- 不要提前设计几十张未来可能根本用不到的业务表
- 不要为了省事把场景数据直接塞进 `json` 字段长期使用

## 9. 一期建议索引与约束

## 9.1 唯一约束

建议至少具备：

- `users.username` 唯一
- `lab_categories.code` 唯一
- `labs.lab_key` 唯一
- `labs.slug` 唯一
- `lab_variants(lab_id, variant_key)` 唯一
- `lab_tags.tag_code` 唯一
- `lab_tag_relations(lab_id, tag_id)` 唯一
- `learning_progress(user_id, lab_id)` 唯一

## 9.2 常用索引

建议至少建立：

- `labs(category_id, sort_order)`
- `labs(status, is_enabled)`
- `verification_records(lab_id, variant_key, verification_type, created_at)`
- `verification_records(user_id, created_at)`
- `lab_run_records(lab_id, created_at)`
- `learning_progress(user_id, status)`

## 10. 一期建议状态值

### `users.role`

- `student`
- `admin`

### `users.status`

- `active`
- `disabled`

### `learning_progress.status`

- `not-started`
- `in-progress`
- `completed`

### `verification_records.result`

- `passed`
- `failed`
- `blocked`

### `verification_records.verification_type`

- `manual`
- `playwright`
- `api`
- `script`

### `lab_run_records.run_type`

- `web`
- `api`
- `script`

### `lab_run_records.status`

- `started`
- `finished`
- `error`

## 11. 与后续技术栈的关系

该数据库设计需与以下技术方案对齐：

- Node 22.x LTS
- MySQL 8.4 LTS
- Prisma 6.x
- `mysql2` 3.x

建议策略：

- 平台核心表优先由 Prisma 管理
- 少量实验场景允许同时存在原生 SQL 演示逻辑
- 但实验中的原生 SQL 不应破坏平台核心表结构稳定性

补充实现约束：

- `labs.category_id` 与 `lab_categories.id` 建立 Prisma relation
- `lab_variants.lab_id`、`lab_tag_relations.lab_id`、`learning_progress.lab_id`、`verification_records.lab_id`、`lab_run_records.lab_id` 都应使用显式 relation
- `verification_records.user_id`、`lab_run_records.user_id` 允许为空，以支持系统触发记录

## 12. 后续目录建议

后续数据库目录建议如下：

```text
database/
├─ schema/
│  ├─ platform/
│  └─ labs/
│     ├─ web/
│     └─ auth/
├─ seeds/
│  ├─ platform/
│  └─ labs/
└─ migrations/
```

说明：

- `schema/platform/`：平台核心表设计
- `schema/labs/`：实验场景表设计
- `seeds/`：种子数据
- `migrations/`：迁移记录

## 13. 一期最低落地要求

在真正开始工程实现前，数据库设计至少要达到以下程度：

1. 明确平台核心表
2. 明确元数据与数据库同步关系
3. 明确学习记录与验证记录分工
4. 明确实验场景表与平台表隔离方式
5. 明确目录结构与迁移落点

## 14. 当前结论

一期数据库不应该直接为所有攻击类型预建一套庞大模型，而应采用：

- 平台核心表稳定建模
- 实验场景表按需扩展
- 元数据驱动实验注册
- 学习记录、验证记录、运行记录分表管理

这样后续无论是做 Web 漏洞、认证授权实验，还是网络模拟与案例化模块，都能在不破坏平台主干的前提下继续扩展。
