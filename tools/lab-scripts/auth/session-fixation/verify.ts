import { pathToFileURL } from "node:url";

export type SessionFixationVerificationCase = {
  key: string;
  variantKey: "vuln" | "fixed";
  method: "POST";
  path: string;
  body: {
    preLoginSessionId: string;
    sessionSource: string;
  };
  expectedStatus: number;
  expectedSignal:
    | "session-normal-id-accepted"
    | "session-fixed-id-bound"
    | "session-fixed-id-rotated";
  description: string;
};

export const normalPreLoginSessionId = "browser-prelogin-session-1024";
export const attackPreLoginSessionId = "attacker-fixed-session-9001";
export const normalSessionSource = "browser";
export const attackSessionSource = "external-link";

export const sessionFixationVerificationCases: SessionFixationVerificationCase[] =
  [
    {
      key: "session-fixation-vuln-normal-session",
      variantKey: "vuln",
      method: "POST",
      path: "/api/labs/auth/session-fixation/vuln/login",
      body: {
        preLoginSessionId: normalPreLoginSessionId,
        sessionSource: normalSessionSource,
      },
      expectedStatus: 200,
      expectedSignal: "session-normal-id-accepted",
      description: "漏洞版普通浏览器预登录教学会话 ID 会被接受。",
    },
    {
      key: "session-fixation-vuln-external-link-bound",
      variantKey: "vuln",
      method: "POST",
      path: "/api/labs/auth/session-fixation/vuln/login",
      body: {
        preLoginSessionId: attackPreLoginSessionId,
        sessionSource: attackSessionSource,
      },
      expectedStatus: 200,
      expectedSignal: "session-fixed-id-bound",
      description: "漏洞版外部链接固定教学会话 ID 会被绑定给当前用户。",
    },
    {
      key: "session-fixation-fixed-external-link-rotated",
      variantKey: "fixed",
      method: "POST",
      path: "/api/labs/auth/session-fixation/fixed/login",
      body: {
        preLoginSessionId: attackPreLoginSessionId,
        sessionSource: attackSessionSource,
      },
      expectedStatus: 200,
      expectedSignal: "session-fixed-id-rotated",
      description: "修复版登录后会轮换外部链接固定教学会话 ID。",
    },
  ];

export const sessionFixationVerificationNotes = [
  "这些配置只描述本项目本机接口的预期行为。",
  "执行真实请求前需要先通过平台登录获得本机演示账号 token。",
  "本文件不枚举会话 ID，不读取 Cookie，不访问外部目标。",
];

export function getSessionFixationVerificationPlan() {
  return {
    labKey: "auth.session-fixation",
    scope: "localhost-only",
    safeBoundary:
      "仅验证本项目本机教学登录会话绑定差异，不修改真实登录 token，不读取真实 Cookie，不访问外部目标。",
    cases: sessionFixationVerificationCases,
    notes: sessionFixationVerificationNotes,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(JSON.stringify(getSessionFixationVerificationPlan(), null, 2));
}
