# network_safe_project

一个面向个人学习的网络安全训练平台仓库。

项目目标是在 Windows 本机环境下，使用 `Node.js + MySQL + Vue` 构建一个覆盖常见网络安全问题的学习系统，并通过“漏洞版 / 修复版”对照模式支持实验、验证和后续自动化测试。

## 1. 项目目标

本项目不是单一漏洞 demo，也不是纯知识文档仓库，而是一个分阶段建设的学习平台。

核心目标如下：

- 个人学习优先
- 同一场景尽量同时提供漏洞版与修复版
- 尽量覆盖更广泛的攻击类型
- 允许不同攻击类型采用不同呈现方式
- 为后续自动化测试预留统一结构

## 2. 当前约束

当前已确认的约束如下：

- 运行环境：Windows 本机
- 容器方案：暂不使用 Docker
- 数据库：本机 `localhost` MySQL
- 前端：Vue
- 后端：Node.js
- 仓库结构：monorepo
- 前端部署：允许 `build` 后交由 `nginx` 托管
- 后端部署：Node 服务独立常驻运行

## 3. 架构思路

项目采用“平台核心分层 + 实验模块分层”的组织方式。

### 3.1 平台核心

平台核心负责统一的平台能力：

- 用户与认证
- 实验目录与学习路径
- 学习记录
- 验证记录
- 知识内容与题目
- 统一 API

### 3.2 实验模块

实验内容按安全领域拆分为四类：

1. Web 漏洞靶场
2. 认证授权与业务逻辑靶场
3. 网络与基础设施实验模块
4. 社会工程学与新型攻击学习模块

### 3.3 脚本与资源层

单独维护实验脚本与验证资源，主要语言为 Python 与 TypeScript，用于：

- 本地受控实验
- 场景验证
- 自动化测试复用
- 样本与产物管理

## 4. 当前目录结构

```text
network-safe-project/
├─ apps/
│  ├─ web/
│  └─ server/
├─ packages/
│  ├─ shared/
│  ├─ configs/
│  └─ testing/
├─ labs/
│  ├─ web/
│  ├─ auth/
│  ├─ network/
│  ├─ social/
│  ├─ client/
│  ├─ ai/
│  ├─ malware/
│  ├─ supply-chain/
│  └─ infrastructure/
├─ tools/
│  └─ lab-scripts/
├─ docs/
│  ├─ execution/
│  └─ design/
├─ database/
│  ├─ schema/
│  ├─ seeds/
│  └─ migrations/
├─ nginx/
└─ pnpm-workspace.yaml
```

当前仓库已经完成：

- 文档体系
- monorepo 根配置
- `apps/web` 与 `apps/server` 基础占位
- `packages/shared`、`packages/configs`、`packages/testing` 基础占位
- `database/`、`nginx/` 基础目录
- 一期 15 个实验的目录骨架与 `meta.json` 占位
- 对应脚本目录骨架

## 5. 实验目录规范

每个实验建议按以下结构组织：

```text
labs/<category>/<scene>/
├─ meta.json
├─ README.md
├─ vuln/
├─ fixed/
├─ mock/
└─ docs/
```

字段含义：

- `meta.json`：实验元数据
- `README.md`：实验说明与入口说明
- `vuln/`：漏洞版实现
- `fixed/`：修复版实现
- `mock/`：模拟服务、演示数据或辅助页面
- `docs/`：攻击步骤、修复说明、学习材料

## 6. 脚本目录规范

实验脚本按场景组织，不按语言优先组织：

```text
tools/lab-scripts/<category>/<scene>/
├─ README.md
├─ exploit.py
├─ verify.ts
├─ samples/
└─ artifacts/
```

约束如下：

- 仅用于本项目内的受控学习场景
- Python 主要承担实验与验证脚本
- TypeScript 主要承担平台集成与自动化验证
- 不作为通用攻击工具库使用

## 7. 覆盖策略

本项目追求“尽量全覆盖”，但不要求所有攻击类型都以同一种方式实现。

### 7.1 适合真实靶场化的内容

- XSS
- CSRF
- SQL 注入
- 文件上传
- 路径遍历
- SSRF
- JWT / 会话问题
- IDOR / 越权
- 业务逻辑漏洞

### 7.2 适合脚本实验或模拟演示的内容

- 端口扫描
- DNS 相关实验
- 中间人攻击原理演示
- ARP 欺骗原理演示
- 配置错误利用

### 7.3 适合案例化与半交互演示的内容

- 网络钓鱼
- 鱼叉式钓鱼
- 商业邮件诈骗
- 水坑攻击
- Prompt 注入
- AI 驱动攻击

## 8. 文档目录

文档按用途拆分：

- `docs/execution/`：执行文档
- `docs/design/`：架构设计与技术方案
- `docs/labs/`：漏洞场景说明
- `docs/testing/`：测试规划与验证方案

## 9. 当前状态

当前仓库处于：**实施规划完成，工程骨架已落地，真实业务实现尚未开始**

当前已完成：

- 项目目标与约束确认
- 总体架构划分
- 文档体系闭环
- monorepo 根配置
- 实验目录规范
- 实验脚本目录规范
- 一期实验目录骨架
- 一期脚本目录骨架

当前尚未完成：

- 前后端可运行应用初始化
- 元数据扫描与实验注册
- 平台核心数据库 schema 实现
- `web/xss` 样板实验真实业务逻辑
- 自动化测试落地

## 10. 下一步

当前最直接的下一步如下：

1. 初始化 `apps/web` 为可运行的 Vue + Vite 应用
2. 初始化 `apps/server` 为可运行的 Node + Express 应用
3. 建立 `packages/shared` 中的实验元数据类型与校验
4. 实现实验扫描、注册与实验列表接口
5. 落地平台核心数据库 schema
6. 开始 `web/xss` 样板实验
