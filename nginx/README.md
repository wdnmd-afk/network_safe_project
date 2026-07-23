# nginx

本目录提供 Windows 本机前端静态托管和 Node API 反向代理模板。

## 文件

- `network-safe.conf.template`：不含个人绝对路径的 nginx 模板。
- `../tools/release/generate-nginx-config.ps1`：根据本机路径生成配置并可调用 `nginx -t` 校验。

仓库不提交包含本机路径的生成配置，也不覆盖用户已有的 nginx 配置。

## 前置条件

- 已完成前端构建并存在 `apps/web/dist/index.html`。
- Node 服务监听 `6667`。
- 本机已安装 nginx，`nginx.exe` 在 PATH 中，或能够传入 `-NginxRoot`。

## 生成并校验配置

在仓库根目录执行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\release\generate-nginx-config.ps1 -Validate
```

如果 nginx 不在 PATH：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\release\generate-nginx-config.ps1 `
  -NginxRoot 'C:\tools\nginx' `
  -Validate
```

默认输出到系统临时目录 `network-safe-nginx.conf`。也可以指定输出位置：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\release\generate-nginx-config.ps1 `
  -OutputConfig "$env:TEMP\network-safe-nginx.conf" `
  -ListenPort 8080 `
  -ServerPort 6667 `
  -Validate
```

## 启动和停止

先启动已构建的 Node 服务，再使用生成的配置启动 nginx：

```powershell
pnpm --filter @network-safe/server start

& 'C:\tools\nginx\nginx.exe' `
  -p 'C:\tools\nginx\' `
  -c "$env:TEMP\network-safe-nginx.conf"
```

停止时只操作本次配置对应的 nginx 实例：

```powershell
& 'C:\tools\nginx\nginx.exe' `
  -p 'C:\tools\nginx\' `
  -c "$env:TEMP\network-safe-nginx.conf" `
  -s quit
```

实际 nginx 安装目录必须替换为本机路径，不得写入仓库文件。

## 验收地址

- 前端首页：`http://localhost:8080/`
- 实验目录：`http://localhost:8080/labs`
- 深层实验路由：`http://localhost:8080/labs/web/xss/vuln`
- API 健康检查：`http://localhost:8080/api/health`
- 实验列表：`http://localhost:8080/api/labs`

`/api/` 由 nginx 代理到 `http://127.0.0.1:6667`；前端 Vue history 路由由 `try_files` 回退到 `index.html`。

## 排障

- 首页 404：确认 `apps/web/dist/index.html` 存在且生成配置的 web root 正确。
- 深层路由刷新 404：确认使用了本模板的 `try_files` 配置。
- API 502：确认 Node 服务监听 `6667`，并检查 nginx `network-safe-error.log`。
- `nginx -t` 失败：确认 `-NginxRoot`、`conf/mime.types` 和输出配置路径。
- 端口被占用：更改生成脚本的 `-ListenPort`，不要停止未知业务进程。

## 安全边界

- 只代理本机 Node 服务，不连接外部目标。
- 不把 `.env`、token、Cookie、密码或个人路径写入配置和日志。
- 不覆盖用户已有站点配置，不接管未明确指定的 nginx 进程。
