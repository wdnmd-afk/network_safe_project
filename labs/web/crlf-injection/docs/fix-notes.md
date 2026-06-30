# CRLF 注入修复说明

## 漏洞根因

风险来自把用户输入直接放入响应头上下文。响应头使用换行作为字段边界，如果 CR / LF 控制字符未被服务端阻断，头部结构就可能被污染。

## 修复策略

修复版采用服务端响应头模板：

- 头部模板由服务端枚举。
- 下载方式由服务端允许列表决定。
- 文件名只作为普通文本值。
- 在进入虚拟头部构造器前拒绝 CR、LF 和其他控制字符。
- 对展示用文件名只返回脱敏预览。

## 防御效果

同样的固定受控样例在修复版中不会进入虚拟头部构造器。

预期信号：

- `crlf-injection-control-chars-blocked`
- `crlf-injection-template-not-found`

## 日志差异

漏洞版：

- `phase = attack`
- `decision = accepted`
- `signal = crlf-injection-virtual-header-injected`
- `risk_level = high`

修复版：

- `phase = defense`
- `decision = blocked`
- `signal = crlf-injection-control-chars-blocked`
- `risk_level = medium`

## 生产环境还需要

- 使用框架提供的安全响应头 API。
- 对所有响应头值执行上下文编码。
- 对文件名做长度、字符集和控制字符校验。
- 对可下载资源做权限校验。
- 对异常头部构造行为做审计和告警。
- 在反向代理和 CDN 层配置额外响应头安全策略。
