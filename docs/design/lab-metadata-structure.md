# 实验元数据结构

## 1. 文档目标

本文档用于定义本项目中每个实验场景的统一元数据结构，解决以下问题：

1. 每个实验至少要提供哪些基础信息
2. 漏洞版 / 修复版如何在元数据中表达
3. 脚本入口、验证入口、学习内容入口如何统一描述
4. 平台后续如何扫描 `labs/` 目录并注册实验

本文档是后续以下内容的共同基础：

- 实验目录索引
- 前端实验列表页
- 实验详情页
- 学习记录
- 验证记录
- 自动化测试接入
- 脚本入口注册

## 2. 设计原则

### 2.1 元数据只描述，不承载实现细节

`meta.json` 用于描述实验，不直接写业务实现代码，也不承载大段教程正文。

它负责回答：

- 这是什么实验
- 属于什么分类
- 有没有漏洞版与修复版
- 从哪里进入
- 如何验证
- 需要什么前置条件

### 2.2 平台字段与实验字段分层

元数据字段分为两类：

- **平台通用字段**：所有实验都必须理解和复用
- **实验扩展字段**：少量特殊实验可以使用，但必须遵循约定

### 2.3 先保证可索引，再考虑扩展

一期优先满足：

- 平台可扫描
- 前端可展示
- 后端可注册
- 测试可定位

不追求一开始把所有未来可能用到的字段都塞进去。

## 3. 目录约定

每个实验目录继续遵循：

```text
labs/<category>/<scene>/
├─ meta.json
├─ README.md
├─ vuln/
├─ fixed/
├─ mock/
└─ docs/
```

其中：

- `meta.json`：实验注册入口
- `README.md`：实验简介与使用说明
- `vuln/`：漏洞版实现
- `fixed/`：修复版实现
- `mock/`：模拟资源、样本、伪数据、案例素材
- `docs/`：攻击步骤、修复说明、补充知识

## 4. 元数据文件命名与格式

### 4.1 文件名

固定为：

```text
meta.json
```

### 4.2 编码

- UTF-8
- JSON 标准格式
- 字段名使用英文小写驼峰或明确约定的短横线风格中的一种

本项目统一使用：**英文小写驼峰命名**。

## 5. 顶层字段定义

## 5.1 必填字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `string` | 实验唯一标识，全仓库唯一 |
| `slug` | `string` | 实验短标识，通常与目录名一致 |
| `title` | `string` | 实验标题，中文展示名 |
| `category` | `string` | 一级分类，如 `web`、`auth`、`network` |
| `subcategory` | `string` | 二级分类，如 `xss`、`sql-injection`、`jwt` |
| `mode` | `string` | 落地方式：`interactive` / `simulation` / `case-study` |
| `severity` | `string` | 风险等级：`low` / `medium` / `high` / `critical` |
| `difficulty` | `string` | 学习难度：`beginner` / `intermediate` / `advanced` |
| `summary` | `string` | 简要说明，供列表与概览使用 |
| `status` | `string` | 当前实验建设状态 |
| `variants` | `array` | 实验变体定义，至少包含一种 |
| `entrypoints` | `object` | 平台或实验入口定义 |
| `verification` | `object` | 验证方式定义 |
| `prerequisites` | `array` | 前置条件说明 |
| `tags` | `array` | 标签列表 |
| `knowledgePoints` | `array` | 知识点列表 |
| `paths` | `object` | 与本实验相关的目录路径 |

## 5.2 推荐字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `sortOrder` | `number` | 列表排序值 |
| `phase` | `string` | 所属阶段，如 `phase-1` |
| `estimatedMinutes` | `number` | 建议学习时长 |
| `safeBoundaries` | `array` | 安全边界说明 |
| `references` | `array` | 学习参考资料 |
| `notes` | `string` | 补充说明 |

## 5.3 受控字段值

### `status`

统一取值：

- `planned`
- `in-progress`
- `ready`
- `deprecated`

说明：

- `planned`：已规划，未完成可运行落地
- `in-progress`：正在建设
- `ready`：可运行、可学习、可验证
- `deprecated`：保留历史，不再继续扩展

### `mode`

统一取值：

- `interactive`
- `simulation`
- `case-study`

说明：

- `interactive`：真实交互实验
- `simulation`：脚本或本机模拟实验
- `case-study`：案例化或半交互演示

## 5.4 元数据可用等级

为了避免“目录已存在，但平台不知道是否应注册或展示”的歧义，一期明确把实验元数据分为三个可用等级：

### A. 占位可用

适用于目录骨架刚建立时。

最低要求：

- 有 `id`
- 有 `slug`
- 有 `title`
- 有 `category`
- 有 `subcategory`
- 有 `mode`
- 有 `summary`
- 有 `status`
- 有 `paths`

允许状态：

- `planned`

允许内容：

- `entrypoints.web` 为空
- `entrypoints.api` 为空
- `entrypoints.scripts` 为空
- `verification.automation.supported = false`

作用：

- 允许仓库建立目录和占位 `meta.json`
- 不代表平台前台必须展示

### B. 可注册

适用于平台已经可以识别、扫描、列出实验。

最低要求：

- 满足“占位可用”
- 有完整 `variants`
- `entrypoints.docs` 至少有一条
- `verification.manual.supported = true`
- `verification.manual.stepsDocPath` 指向真实文档，而不是占位文件

允许状态：

- `planned`
- `in-progress`
- `ready`

作用：

- 允许后端扫描并加入实验索引
- 默认开发索引可见

### C. 可实现 / 可联调

适用于真正开始做实验页面、接口、记录和自动化测试。

最低要求：

- 满足“可注册”
- 至少存在一个真实页面入口或 API 入口
- `variants` 中的 `vuln` 与 `fixed` 都有明确 `entryKey`
- `verification.manual.expectedSignals` 不为空占位文本
- 若已接入自动化，必须填写真实测试路径

允许状态：

- `in-progress`
- `ready`

作用：

- 允许进入真实业务实现
- 允许接入自动化测试

## 5.5 平台扫描与展示规则

为避免后续实现时再猜平台行为，一期直接约定：

1. 后端扫描时：读取所有满足“占位可用”的 `meta.json`
2. 写入实验索引时：仅接受满足“可注册”的实验
3. 前台默认列表：仅展示 `status` 为 `in-progress` 或 `ready` 的实验
4. `planned` 状态实验：
   - 可以存在于仓库
   - 可以被开发态索引识别
   - 默认不作为前台主列表的正式可学实验

## 6. `id` 与 `slug` 规则

### 6.1 `id`

格式建议：

```text
<category>.<subcategory>
```

示例：

- `web.xss`
- `web.sql-injection`
- `auth.jwt`
- `network.port-scan`

要求：

- 全仓库唯一
- 一旦对外暴露给记录表或测试索引，尽量不再变更

### 6.2 `slug`

格式建议：

```text
<scene>
```

示例：

- `xss`
- `sql-injection`
- `jwt`
- `port-scan`

要求：

- 优先与目录名保持一致
- 用于路由、目录、测试标识时应保持稳定

## 7. `variants` 结构

## 7.1 设计目标

本项目强调同一场景尽量同时提供漏洞版与修复版，因此 `variants` 是核心字段。

## 7.2 字段定义

`variants` 为数组，每个元素结构如下：

| 字段 | 类型 | 说明 |
|---|---|---|
| `key` | `string` | 变体标识，如 `vuln`、`fixed` |
| `title` | `string` | 变体标题 |
| `enabled` | `boolean` | 当前是否启用 |
| `description` | `string` | 变体说明 |
| `entryKey` | `string` | 对应 `entrypoints` 中的入口键 |
| `expectedOutcome` | `string` | 预期效果说明 |
| `supportsAutomation` | `boolean` | 是否支持自动化验证 |

## 7.3 一期默认要求

对一期核心实验，`variants` 默认至少包含：

- `vuln`
- `fixed`

若某类内容暂时只能案例化或模拟化，也必须显式写明原因，而不是省略字段。

## 8. `entrypoints` 结构

## 8.1 设计目标

不同实验可能有不同入口：

- 前端页面入口
- 后端 API 入口
- 脚本入口
- 文档入口

因此 `entrypoints` 应统一记录这些位置。

## 8.2 字段定义

建议结构：

| 字段 | 类型 | 说明 |
|---|---|---|
| `web` | `object[]` | 前端页面入口 |
| `api` | `object[]` | 后端 API 入口 |
| `scripts` | `object[]` | 脚本入口 |
| `docs` | `object[]` | 文档入口 |

### `web` 元素字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `key` | `string` | 入口标识 |
| `variant` | `string` | 对应变体 |
| `path` | `string` | 前端路由路径 |
| `description` | `string` | 页面说明 |

### `api` 元素字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `key` | `string` | 入口标识 |
| `variant` | `string` | 对应变体或 `shared` |
| `method` | `string` | HTTP 方法 |
| `path` | `string` | API 路径 |
| `description` | `string` | 接口说明 |

### `scripts` 元素字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `key` | `string` | 脚本标识 |
| `language` | `string` | `python` / `ts` |
| `path` | `string` | 相对仓库根目录的脚本路径 |
| `description` | `string` | 脚本用途 |

### `docs` 元素字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `key` | `string` | 文档标识 |
| `path` | `string` | 相对路径 |
| `description` | `string` | 文档用途 |

## 9. `verification` 结构

## 9.1 设计目标

平台后续不仅要展示实验，还要验证：

- 漏洞版是否真的能触发
- 修复版是否真的生效
- 脚本验证和自动化测试是否已接入

## 9.2 字段定义

| 字段 | 类型 | 说明 |
|---|---|---|
| `manual` | `object` | 手工验证说明 |
| `automation` | `object` | 自动化验证说明 |

### `manual` 字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `supported` | `boolean` | 是否支持手工验证 |
| `stepsDocPath` | `string` | 手工步骤文档路径 |
| `expectedSignals` | `array` | 手工观察到的现象 |

### `automation` 字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `supported` | `boolean` | 是否支持自动化验证 |
| `playwright` | `object` | 前端 E2E 信息 |
| `apiTest` | `object` | API 测试信息 |
| `scriptVerification` | `object` | 脚本验证信息 |

#### `playwright`

| 字段 | 类型 | 说明 |
|---|---|---|
| `enabled` | `boolean` | 是否已接入 |
| `specPath` | `string` | 测试文件路径 |

#### `apiTest`

| 字段 | 类型 | 说明 |
|---|---|---|
| `enabled` | `boolean` | 是否已接入 |
| `specPath` | `string` | 测试文件路径 |

#### `scriptVerification`

| 字段 | 类型 | 说明 |
|---|---|---|
| `enabled` | `boolean` | 是否已接入 |
| `scriptKeys` | `array` | 对应脚本标识列表 |

## 10. `prerequisites` 结构

每个元素建议使用对象，结构如下：

| 字段 | 类型 | 说明 |
|---|---|---|
| `type` | `string` | 前置条件类型 |
| `value` | `string` | 前置条件内容 |
| `required` | `boolean` | 是否必需 |

推荐 `type`：

- `service`
- `database`
- `seed-data`
- `env`
- `browser`
- `script`

示例：

- 需要 MySQL 已启动
- 需要导入某实验种子数据
- 需要本地启动服务

## 11. `paths` 结构

用于统一记录本实验相关路径，避免平台或测试层硬编码拼接。

| 字段 | 类型 | 说明 |
|---|---|---|
| `root` | `string` | 实验根目录 |
| `readme` | `string` | README 路径 |
| `vuln` | `string` | 漏洞版目录 |
| `fixed` | `string` | 修复版目录 |
| `mock` | `string` | 模拟资源目录 |
| `docs` | `string` | 文档目录 |
| `scripts` | `string` | 对应脚本目录 |

## 12. 推荐 JSON 示例

```json
{
  "id": "web.xss",
  "slug": "xss",
  "title": "XSS",
  "category": "web",
  "subcategory": "xss",
  "mode": "interactive",
  "severity": "high",
  "difficulty": "beginner",
  "summary": "通过可控输入与页面渲染演示 XSS 漏洞触发与修复差异。",
  "status": "planned",
  "phase": "phase-1",
  "sortOrder": 10,
  "estimatedMinutes": 25,
  "tags": ["xss", "web", "output-encoding"],
  "knowledgePoints": [
    "输入与输出边界",
    "HTML 上下文编码",
    "存储型与反射型 XSS 差异"
  ],
  "variants": [
    {
      "key": "vuln",
      "title": "漏洞版",
      "enabled": true,
      "description": "输出未经过安全编码，可观察脚本注入效果。",
      "entryKey": "web-vuln",
      "expectedOutcome": "恶意输入在页面中执行。",
      "supportsAutomation": true
    },
    {
      "key": "fixed",
      "title": "修复版",
      "enabled": true,
      "description": "输出经过编码或安全渲染，不再执行恶意脚本。",
      "entryKey": "web-fixed",
      "expectedOutcome": "恶意输入以普通文本展示或被拦截。",
      "supportsAutomation": true
    }
  ],
  "entrypoints": {
    "web": [
      {
        "key": "web-vuln",
        "variant": "vuln",
        "path": "/labs/web/xss/vuln",
        "description": "XSS 漏洞版页面入口"
      },
      {
        "key": "web-fixed",
        "variant": "fixed",
        "path": "/labs/web/xss/fixed",
        "description": "XSS 修复版页面入口"
      }
    ],
    "api": [
      {
        "key": "xss-shared-api",
        "variant": "shared",
        "method": "POST",
        "path": "/api/labs/web/xss/comments",
        "description": "评论提交接口"
      }
    ],
    "scripts": [
      {
        "key": "seed-comments",
        "language": "ts",
        "path": "tools/lab-scripts/web/xss/seed-comments.ts",
        "description": "初始化演示数据"
      }
    ],
    "docs": [
      {
        "key": "attack-steps",
        "path": "labs/web/xss/docs/attack-steps.md",
        "description": "攻击步骤说明"
      },
      {
        "key": "fix-notes",
        "path": "labs/web/xss/docs/fix-notes.md",
        "description": "修复说明"
      }
    ]
  },
  "verification": {
    "manual": {
      "supported": true,
      "stepsDocPath": "labs/web/xss/docs/attack-steps.md",
      "expectedSignals": [
        "漏洞版页面弹出提示或执行恶意脚本",
        "修复版页面仅显示普通文本"
      ]
    },
    "automation": {
      "supported": true,
      "playwright": {
        "enabled": true,
        "specPath": "apps/web/tests/labs/web/xss.spec.ts"
      },
      "apiTest": {
        "enabled": false,
        "specPath": ""
      },
      "scriptVerification": {
        "enabled": true,
        "scriptKeys": ["seed-comments"]
      }
    }
  },
  "prerequisites": [
    {
      "type": "service",
      "value": "web-app-running",
      "required": true
    },
    {
      "type": "service",
      "value": "server-app-running",
      "required": true
    },
    {
      "type": "database",
      "value": "mysql-localhost-ready",
      "required": true
    }
  ],
  "safeBoundaries": [
    "仅面向本地受控实验环境",
    "不对外部站点或服务使用"
  ],
  "references": [],
  "notes": "一期基础 Web 漏洞实验。",
  "paths": {
    "root": "labs/web/xss",
    "readme": "labs/web/xss/README.md",
    "vuln": "labs/web/xss/vuln",
    "fixed": "labs/web/xss/fixed",
    "mock": "labs/web/xss/mock",
    "docs": "labs/web/xss/docs",
    "scripts": "tools/lab-scripts/web/xss"
  }
}
```

## 13. 平台如何使用 `meta.json`

## 13.1 注册流程

后续平台应支持以下流程：

1. 扫描 `labs/*/*/meta.json`
2. 读取并校验 JSON 结构
3. 生成统一实验索引
4. 暴露给前端列表与后端服务
5. 同步给自动化测试入口和脚本索引

## 13.2 平台可直接使用的字段

前端列表直接依赖：

- `title`
- `summary`
- `category`
- `subcategory`
- `difficulty`
- `severity`
- `mode`
- `status`
- `tags`

详情页直接依赖：

- `variants`
- `entrypoints`
- `prerequisites`
- `knowledgePoints`
- `verification`

测试层直接依赖：

- `id`
- `slug`
- `variants`
- `verification`
- `paths`

## 14. 一期落地最低要求

一期每个核心实验的 `meta.json` 至少要满足：

1. 有稳定 `id`
2. 有稳定 `slug`
3. 有 `category` 和 `subcategory`
4. 有 `mode`
5. 有 `summary`
6. 有 `variants`
7. 有页面或 API 入口
8. 有手工验证说明
9. 有脚本目录路径
10. 有漏洞版 / 修复版目录路径

补充约束：

- 只建目录而没有真实手工验证文档的实验，只能视为“占位可用”
- 只有满足“可注册”条件的实验，才能进入平台实验索引
- 只有满足“可实现 / 可联调”条件的实验，才能开始真实业务逻辑开发

## 15. 不允许的做法

- 不允许不同实验随意自定义同义字段
- 不允许把“漏洞版 / 修复版”写死在代码里而不写到元数据中
- 不允许只写目录，不写入口和验证信息
- 不允许把长篇实验教程直接塞进 `meta.json`
- 不允许把测试路径、脚本路径写成猜测式字段

## 16. 后续联动文档

本文档确定后，后续必须与以下内容保持一致：

- 数据库基础表设计文档
- 自动化测试规划文档
- `packages/shared` 中的元数据类型定义
- `labs/` 下实际实验目录
- `tools/lab-scripts/` 下实际脚本目录

## 17. 当前结论

后续每个实验都必须以 `meta.json` 作为统一注册入口。

这样做的价值是：

- 平台能稳定扫描实验
- 前端不用猜每个实验怎么展示
- 后端不用猜每个实验怎么注册
- 测试不用猜每个实验的入口和验证方式
- TODO 中“做了没有、做到哪一步、做在哪”也能逐步从文档跟踪过渡到结构化跟踪
