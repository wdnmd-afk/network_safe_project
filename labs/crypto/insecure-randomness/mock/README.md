# 固定摘要说明

本目录表示服务端内置的确定性教学摘要，不保存样本文件：

- 风险摘要：`source=timestamp-counter`、`entropyClass=low`、单调时间模式、自增计数模式、缺少随机材料。
- 正常摘要：`source=operating-system-csprng`、`targetStrength=128-bit` 和不可用指纹。

这些内容不是 token，不映射到真实用户、会话、时间戳、计数器或认证系统。禁止在本目录加入真实随机材料、secret、seed、凭据或可预测序列样本。
