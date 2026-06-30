# 命令注入修复版

修复版只接受固定诊断任务 ID，并把目标作为普通参数值处理。

检测到命令连接符、管道或重定向时，修复版会返回阻断信号：

```text
command-injection-allowlist-blocked
```

正常目标仍可完成虚拟诊断任务。
