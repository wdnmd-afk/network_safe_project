import express from "express";
import type { LabMetadata } from "@network-safe/shared/lab-metadata";

import { createAuthService, type AuthService } from "./services/auth.js";
import {
  createBruteForceLabService,
  type BruteForceLabService,
  type BruteForceVariantKey,
} from "./services/brute-force-lab.js";
import {
  createCsrfLabService,
  type CsrfLabService,
  type CsrfVariantKey,
} from "./services/csrf-lab.js";
import {
  createCommandInjectionLabService,
  type CommandInjectionLabService,
  type CommandInjectionVariantKey,
} from "./services/command-injection-lab.js";
import {
  createCrlfInjectionLabService,
  type CrlfInjectionLabService,
  type CrlfInjectionVariantKey,
} from "./services/crlf-injection-lab.js";
import {
  createDnsHijackLabService,
  type DnsHijackLabService,
  type DnsHijackVariantKey,
} from "./services/dns-hijack-lab.js";
import {
  createNosqlInjectionLabService,
  type NosqlInjectionLabService,
  type NosqlInjectionVariantKey,
} from "./services/nosql-injection-lab.js";
import {
  createLdapInjectionLabService,
  type LdapInjectionLabService,
  type LdapInjectionVariantKey,
} from "./services/ldap-injection-lab.js";
import {
  createXpathInjectionLabService,
  type XpathInjectionLabService,
  type XpathInjectionVariantKey,
} from "./services/xpath-injection-lab.js";
import {
  createFileUploadLabService,
  type FileUploadLabService,
  type FileUploadVariantKey,
} from "./services/file-upload-lab.js";
import {
  createInfoDisclosureLabService,
  type InfoDisclosureLabService,
  type InfoDisclosureVariantKey,
} from "./services/info-disclosure-lab.js";
import {
  createIdorLabService,
  type IdorLabService,
  type IdorVariantKey,
} from "./services/idor-lab.js";
import {
  createJwtLabService,
  type JwtLabService,
  type JwtVariantKey,
} from "./services/jwt-lab.js";
import {
  createLabEventLogsService,
  type LabEventInput,
  type LabEventLogsService,
} from "./services/lab-event-logs.js";
import {
  createLabRecapQuestionCompletionsService,
  type LabRecapQuestionCompletionsService,
} from "./services/lab-recap-question-completions.js";
import { createLabRegistry } from "./services/lab-registry.js";
import {
  createLabRecordsService,
  LabRecordError,
  type LabRecordsService,
} from "./services/lab-records.js";
import {
  createPathTraversalLabService,
  type PathTraversalLabService,
  type PathTraversalVariantKey,
} from "./services/path-traversal-lab.js";
import {
  createPortScanLabService,
  type PortScanLabService,
  type PortScanVariantKey,
} from "./services/port-scan-lab.js";
import {
  createPromptInjectionLabService,
  type PromptInjectionLabService,
  type PromptInjectionVariantKey,
} from "./services/prompt-injection-lab.js";
import {
  createPrivilegeEscalationLabService,
  type PrivilegeEscalationLabService,
  type PrivilegeEscalationVariantKey,
} from "./services/privilege-escalation-lab.js";
import {
  createSessionFixationLabService,
  type SessionFixationLabService,
  type SessionFixationVariantKey,
} from "./services/session-fixation-lab.js";
import {
  createSqlInjectionLabService,
  type SqlInjectionLabService,
  type SqlInjectionVariantKey,
} from "./services/sql-injection-lab.js";
import {
  createSsrfLabService,
  type SsrfLabService,
  type SsrfVariantKey,
} from "./services/ssrf-lab.js";
import {
  createSstiLabService,
  type SstiLabService,
  type SstiPreviewInput,
  type SstiVariantKey,
} from "./services/ssti-lab.js";
import {
  createXxeLabService,
  type XxeLabService,
  type XxeVariantKey,
} from "./services/xxe-lab.js";

type DatabaseHealth = {
  status: string;
  message?: string;
};

type CreateAppOptions = {
  checkDatabaseHealth?: () => Promise<DatabaseHealth>;
  labRegistry?: ReturnType<typeof createLabRegistry>;
  authService?: AuthService;
  labRecordsService?: LabRecordsService;
  bruteForceLabService?: BruteForceLabService;
  commandInjectionLabService?: CommandInjectionLabService;
  crlfInjectionLabService?: CrlfInjectionLabService;
  csrfLabService?: CsrfLabService;
  dnsHijackLabService?: DnsHijackLabService;
  fileUploadLabService?: FileUploadLabService;
  infoDisclosureLabService?: InfoDisclosureLabService;
  idorLabService?: IdorLabService;
  jwtLabService?: JwtLabService;
  labEventLogsService?: LabEventLogsService;
  labRecapQuestionCompletionsService?: LabRecapQuestionCompletionsService;
  ldapInjectionLabService?: LdapInjectionLabService;
  nosqlInjectionLabService?: NosqlInjectionLabService;
  xpathInjectionLabService?: XpathInjectionLabService;
  pathTraversalLabService?: PathTraversalLabService;
  portScanLabService?: PortScanLabService;
  promptInjectionLabService?: PromptInjectionLabService;
  privilegeEscalationLabService?: PrivilegeEscalationLabService;
  sessionFixationLabService?: SessionFixationLabService;
  sqlInjectionLabService?: SqlInjectionLabService;
  ssrfLabService?: SsrfLabService;
  sstiLabService?: SstiLabService;
  xxeLabService?: XxeLabService;
};

type ErrorResult = {
  ok: false;
  status: number;
  body: {
    status: string;
    message: string;
  };
};

type CurrentUserResult =
  | {
      ok: true;
      user: Awaited<ReturnType<AuthService["getCurrentUser"]>> & {};
    }
  | ErrorResult;

type LabResult =
  | {
      ok: true;
      lab: LabMetadata;
    }
  | ErrorResult;

function getTimestamp() {
  return new Date().toISOString();
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "unknown database error";
}

export function createApp(options: CreateAppOptions = {}) {
  const app = express();
  const labRegistry = options.labRegistry ?? createLabRegistry();
  const authService = options.authService ?? createAuthService();
  const labRecordsService =
    options.labRecordsService ?? createLabRecordsService();
  const bruteForceLabService =
    options.bruteForceLabService ?? createBruteForceLabService();
  const commandInjectionLabService =
    options.commandInjectionLabService ?? createCommandInjectionLabService();
  const crlfInjectionLabService =
    options.crlfInjectionLabService ?? createCrlfInjectionLabService();
  const csrfLabService = options.csrfLabService ?? createCsrfLabService();
  const dnsHijackLabService =
    options.dnsHijackLabService ?? createDnsHijackLabService();
  const fileUploadLabService =
    options.fileUploadLabService ?? createFileUploadLabService();
  const infoDisclosureLabService =
    options.infoDisclosureLabService ?? createInfoDisclosureLabService();
  const idorLabService = options.idorLabService ?? createIdorLabService();
  const jwtLabService = options.jwtLabService ?? createJwtLabService();
  const labEventLogsService =
    options.labEventLogsService ?? createLabEventLogsService();
  const labRecapQuestionCompletionsService =
    options.labRecapQuestionCompletionsService ??
    createLabRecapQuestionCompletionsService();
  const ldapInjectionLabService =
    options.ldapInjectionLabService ?? createLdapInjectionLabService();
  const nosqlInjectionLabService =
    options.nosqlInjectionLabService ?? createNosqlInjectionLabService();
  const xpathInjectionLabService =
    options.xpathInjectionLabService ?? createXpathInjectionLabService();
  const pathTraversalLabService =
    options.pathTraversalLabService ?? createPathTraversalLabService();
  const portScanLabService =
    options.portScanLabService ?? createPortScanLabService();
  const promptInjectionLabService =
    options.promptInjectionLabService ?? createPromptInjectionLabService();
  const privilegeEscalationLabService =
    options.privilegeEscalationLabService ??
    createPrivilegeEscalationLabService();
  const sessionFixationLabService =
    options.sessionFixationLabService ?? createSessionFixationLabService();
  const sqlInjectionLabService =
    options.sqlInjectionLabService ?? createSqlInjectionLabService();
  const ssrfLabService = options.ssrfLabService ?? createSsrfLabService();
  const sstiLabService = options.sstiLabService ?? createSstiLabService();
  const xxeLabService = options.xxeLabService ?? createXxeLabService();

  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: "server",
      timestamp: getTimestamp(),
    });
  });

  app.get("/api/health/db", async (_req, res) => {
    try {
      const database = await options.checkDatabaseHealth?.();

      res.status(200).json({
        status: "ok",
        service: "server",
        database: database ?? {
          status: "ok",
        },
        timestamp: getTimestamp(),
      });
    } catch (error) {
      res.status(503).json({
        status: "error",
        service: "server",
        database: {
          status: "error",
          message: getErrorMessage(error),
        },
        timestamp: getTimestamp(),
      });
    }
  });

  app.post("/api/auth/login", async (req, res, next) => {
    try {
      const username = typeof req.body?.username === "string" ? req.body.username : "";
      const password = typeof req.body?.password === "string" ? req.body.password : "";
      const loginResult = await authService.login({
        username,
        password,
      });

      if (!loginResult) {
        res.status(401).json({
          status: "error",
          message: "invalid credentials",
        });
        return;
      }

      res.status(200).json(loginResult);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/auth/me", async (req, res, next) => {
    try {
      const authorization = req.header("authorization") ?? "";
      const token = authorization.startsWith("Bearer ")
        ? authorization.slice("Bearer ".length)
        : "";

      if (!token) {
        res.status(401).json({
          status: "error",
          message: "missing session token",
        });
        return;
      }

      const user = await authService.getCurrentUser(token);

      if (!user) {
        res.status(401).json({
          status: "error",
          message: "invalid session token",
        });
        return;
      }

      res.status(200).json({
        user,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/logout", (_req, res) => {
    res.status(200).json({
      status: "ok",
    });
  });

  async function readCurrentUser(req: express.Request): Promise<CurrentUserResult> {
    const authorization = req.header("authorization") ?? "";
    const token = authorization.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length)
      : "";

    if (!token) {
      return {
        ok: false,
        status: 401,
        body: {
          status: "error",
          message: "missing session token",
        },
      };
    }

    const user = await authService.getCurrentUser(token);

    if (!user) {
      return {
        ok: false,
        status: 401,
        body: {
          status: "error",
          message: "invalid session token",
        },
      };
    }

    return {
      ok: true,
      user,
    };
  }

  async function readLab(category: string, scene: string): Promise<LabResult> {
    const lab = await labRegistry.getLab(category, scene);

    if (!lab) {
      return {
        ok: false,
        status: 404,
        body: {
          status: "error",
          message: "lab not found",
        },
      };
    }

    return {
      ok: true,
      lab,
    };
  }

  function readOptionalString(value: unknown) {
    return typeof value === "string" ? value : undefined;
  }

  function readOptionalLabEventPhase(value: unknown) {
    return value === "attack" || value === "defense" || value === "normal"
      ? value
      : undefined;
  }

  function readOptionalLabEventRiskLevel(value: unknown) {
    return value === "low" ||
      value === "medium" ||
      value === "high" ||
      value === "critical"
      ? value
      : undefined;
  }

  function readRequiredString(value: unknown) {
    return typeof value === "string" && value.trim() ? value.trim() : "";
  }

  function readRequiredStringArray(value: unknown) {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function readOptionalCommaSeparatedStrings(value: unknown) {
    const values =
      typeof value === "string"
        ? value.split(",")
        : readRequiredStringArray(value);

    return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
  }

  function readPositiveInteger(value: unknown) {
    return typeof value === "number" && Number.isInteger(value) && value > 0
      ? value
      : 0;
  }

  function readZeroBasedQuestionIndex(value: unknown) {
    return typeof value === "number" &&
      Number.isInteger(value) &&
      value >= 0 &&
      value <= 20
      ? value
      : -1;
  }

  function readBruteForceVariantKey(value: unknown): BruteForceVariantKey | "" {
    return value === "vuln" || value === "fixed" ? value : "";
  }

  function readCsrfVariantKey(value: unknown): CsrfVariantKey | "" {
    return value === "vuln" || value === "fixed" ? value : "";
  }

  function readCommandInjectionVariantKey(
    value: unknown,
  ): CommandInjectionVariantKey | "" {
    return value === "vuln" || value === "fixed" ? value : "";
  }

  function readCrlfInjectionVariantKey(
    value: unknown,
  ): CrlfInjectionVariantKey | "" {
    return value === "vuln" || value === "fixed" ? value : "";
  }

  function readDnsHijackVariantKey(value: unknown): DnsHijackVariantKey | "" {
    return value === "vuln" || value === "fixed" ? value : "";
  }

  function readNosqlInjectionVariantKey(
    value: unknown,
  ): NosqlInjectionVariantKey | "" {
    return value === "vuln" || value === "fixed" ? value : "";
  }

  function readLdapInjectionVariantKey(
    value: unknown,
  ): LdapInjectionVariantKey | "" {
    return value === "vuln" || value === "fixed" ? value : "";
  }

  function readXpathInjectionVariantKey(
    value: unknown,
  ): XpathInjectionVariantKey | "" {
    return value === "vuln" || value === "fixed" ? value : "";
  }

  function readSqlInjectionVariantKey(value: unknown): SqlInjectionVariantKey | "" {
    return value === "vuln" || value === "fixed" ? value : "";
  }

  function readFileUploadVariantKey(value: unknown): FileUploadVariantKey | "" {
    return value === "vuln" || value === "fixed" ? value : "";
  }

  function readInfoDisclosureVariantKey(
    value: unknown,
  ): InfoDisclosureVariantKey | "" {
    return value === "vuln" || value === "fixed" ? value : "";
  }

  function readIdorVariantKey(value: unknown): IdorVariantKey | "" {
    return value === "vuln" || value === "fixed" ? value : "";
  }

  function readJwtVariantKey(value: unknown): JwtVariantKey | "" {
    return value === "vuln" || value === "fixed" ? value : "";
  }

  function readPathTraversalVariantKey(value: unknown): PathTraversalVariantKey | "" {
    return value === "vuln" || value === "fixed" ? value : "";
  }

  function readPortScanVariantKey(value: unknown): PortScanVariantKey | "" {
    return value === "vuln" || value === "fixed" ? value : "";
  }

  function readPromptInjectionVariantKey(
    value: unknown,
  ): PromptInjectionVariantKey | "" {
    return value === "vuln" || value === "fixed" ? value : "";
  }

  function readPrivilegeEscalationVariantKey(
    value: unknown,
  ): PrivilegeEscalationVariantKey | "" {
    return value === "vuln" || value === "fixed" ? value : "";
  }

  function readSessionFixationVariantKey(
    value: unknown,
  ): SessionFixationVariantKey | "" {
    return value === "vuln" || value === "fixed" ? value : "";
  }

  function readSsrfVariantKey(value: unknown): SsrfVariantKey | "" {
    return value === "vuln" || value === "fixed" ? value : "";
  }

  function readSstiVariantKey(value: unknown): SstiVariantKey | "" {
    return value === "vuln" || value === "fixed" ? value : "";
  }

  function readXxeVariantKey(value: unknown): XxeVariantKey | "" {
    return value === "vuln" || value === "fixed" ? value : "";
  }

  function readSstiTemplateVariables(
    value: unknown,
  ): SstiPreviewInput["variables"] | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return null;
    }

    const record = value as Record<string, unknown>;
    const allowedKeys = ["customerName", "orderNo", "noticeTitle"];
    const hasUnexpectedKey = Object.keys(record).some(
      (key) => !allowedKeys.includes(key),
    );

    if (hasUnexpectedKey) {
      return null;
    }

    const customerName = readRequiredString(record.customerName);
    const orderNo = readRequiredString(record.orderNo);
    const noticeTitle = readRequiredString(record.noticeTitle);

    if (!customerName || !orderNo || !noticeTitle) {
      return null;
    }

    return {
      customerName,
      orderNo,
      noticeTitle,
    };
  }

  function readOptionalTraceId(req: express.Request) {
    const traceId = req.header("x-lab-trace-id") ?? req.header("x-request-id");

    return traceId?.trim() ? traceId.trim().slice(0, 64) : undefined;
  }

  function maskLearningInput(value: string) {
    if (value.length <= 4) {
      return "***";
    }

    return `${value.slice(0, 3)}***${value.slice(-2)}`;
  }

  function getCsrfEventMessage(input: {
    variantKey: CsrfVariantKey;
    status: "ok" | "blocked";
  }) {
    if (input.variantKey === "vuln") {
      return "漏洞版缺少 CSRF token 仍接受转账请求，攻击模拟成功";
    }

    if (input.status === "blocked") {
      return "修复版要求有效 CSRF token，已阻断跨站转账模拟请求";
    }

    return "修复版收到匹配 CSRF token，正常业务请求被接受";
  }

  function summarizeBruteForceInput(input: {
    targetUsername: string;
    inspection: {
      targetUsernameLength: number;
      targetExists: boolean;
      candidateCount: number;
      maxAllowedCandidates: number;
      lockoutThreshold: number;
      matchedAttemptNumber: number | null;
      failedAttemptsBeforeMatch: number;
      thresholdExceeded: boolean;
      rateLimitApplied: boolean;
      acceptedCredential: boolean;
      attackPattern: boolean;
      currentUserId: string;
    };
    signal: string;
  }) {
    return {
      targetUsernameLength: input.inspection.targetUsernameLength,
      targetUsernamePreview: input.inspection.attackPattern
        ? "controlled-brute-force-target"
        : maskLearningInput(input.targetUsername),
      targetExists: input.inspection.targetExists,
      candidateCount: input.inspection.candidateCount,
      maxAllowedCandidates: input.inspection.maxAllowedCandidates,
      lockoutThreshold: input.inspection.lockoutThreshold,
      matchedAttemptNumber: input.inspection.matchedAttemptNumber,
      failedAttemptsBeforeMatch: input.inspection.failedAttemptsBeforeMatch,
      thresholdExceeded: input.inspection.thresholdExceeded,
      rateLimitApplied: input.inspection.rateLimitApplied,
      acceptedCredential: input.inspection.acceptedCredential,
      attackPattern: input.inspection.attackPattern,
      currentUserId: input.inspection.currentUserId,
      signal: input.signal,
    };
  }

  function summarizeSqlInjectionKeyword(input: {
    keyword: string;
    detectedInjection: boolean;
    signal: string;
  }) {
    return {
      keywordLength: input.keyword.length,
      keywordPreview: input.detectedInjection
        ? "controlled-sql-injection-sample"
        : maskLearningInput(input.keyword),
      detectedInjection: input.detectedInjection,
      signal: input.signal,
    };
  }

  function summarizeCommandInjectionInput(input: {
    taskKey: string;
    target: string;
    inspection: {
      targetLength: number;
      containsCommandSeparator: boolean;
      detectedOperator: string;
      matchedControlledSample: boolean;
      allowedTask: boolean;
    };
    signal: string;
  }) {
    return {
      taskKey: input.taskKey,
      targetLength: input.inspection.targetLength,
      targetPreview: input.inspection.matchedControlledSample
        ? "controlled-command-injection-sample"
        : maskLearningInput(input.target),
      containsCommandSeparator: input.inspection.containsCommandSeparator,
      detectedOperator: input.inspection.detectedOperator,
      matchedControlledSample: input.inspection.matchedControlledSample,
      allowedTask: input.inspection.allowedTask,
      signal: input.signal,
    };
  }

  function summarizeNosqlInjectionInput(input: {
    queryMode: string;
    keyword: string;
    inspection: {
      keywordLength: number;
      filterTextLength: number;
      detectedRiskTypes: string[];
      matchedControlledSample: boolean;
      resultScope: string;
    };
    documentCount: number;
    signal: string;
  }) {
    return {
      queryMode: input.queryMode,
      keywordLength: input.inspection.keywordLength,
      keywordPreview: maskLearningInput(input.keyword),
      filterTextLength: input.inspection.filterTextLength,
      detectedRiskTypes: input.inspection.detectedRiskTypes,
      matchedControlledSample: input.inspection.matchedControlledSample,
      resultScope: input.inspection.resultScope,
      documentCount: input.documentCount,
      signal: input.signal,
    };
  }

  function summarizeLdapInjectionInput(input: {
    scenarioKey: string;
    inspection: {
      keywordLength: number;
      keywordPreview: string;
      detectedRiskTypes: string[];
      matchedControlledSample: boolean;
      resultScope: string;
    };
    entryCount: number;
    signal: string;
  }) {
    return {
      scenarioKey: input.scenarioKey,
      keywordLength: input.inspection.keywordLength,
      keywordPreview: input.inspection.keywordPreview,
      detectedRiskTypes: input.inspection.detectedRiskTypes,
      matchedControlledSample: input.inspection.matchedControlledSample,
      resultScope: input.inspection.resultScope,
      entryCount: input.entryCount,
      signal: input.signal,
    };
  }

  function summarizeXpathInjectionInput(input: {
    queryTemplate: string;
    scope: string;
    inspection: {
      keywordLength: number;
      keywordPreview: string;
      detectedRiskTypes: string[];
      matchedControlledSample: boolean;
      resultScope: string;
    };
    documentCount: number;
    signal: string;
  }) {
    return {
      queryTemplate: input.queryTemplate,
      scope: input.scope,
      keywordLength: input.inspection.keywordLength,
      keywordPreview: input.inspection.keywordPreview,
      detectedRiskTypes: input.inspection.detectedRiskTypes,
      matchedControlledSample: input.inspection.matchedControlledSample,
      resultScope: input.inspection.resultScope,
      documentCount: input.documentCount,
      signal: input.signal,
    };
  }

  function summarizeCrlfInjectionInput(input: {
    headerTemplate: string;
    dispositionType: string;
    inspection: {
      fileNameLength: number;
      fileNamePreview: string;
      detectedControlChars: string[];
      matchedControlledSample: boolean;
      virtualHeaderCount: number;
      pollutedHeaderCount: number;
    };
    signal: string;
  }) {
    return {
      headerTemplate: input.headerTemplate,
      dispositionType: input.dispositionType,
      fileNameLength: input.inspection.fileNameLength,
      fileNamePreview: input.inspection.fileNamePreview,
      detectedControlChars: input.inspection.detectedControlChars,
      matchedControlledSample: input.inspection.matchedControlledSample,
      virtualHeaderCount: input.inspection.virtualHeaderCount,
      pollutedHeaderCount: input.inspection.pollutedHeaderCount,
      signal: input.signal,
    };
  }

  function summarizeSstiInput(input: {
    templateKey: string;
    inspection: {
      templateLength: number;
      expressionCount: number;
      expressionTypes: string[];
      matchedControlledSample: boolean;
      unknownExpressionCount: number;
      variableKeys: string[];
      acceptedVariableKeys: string[];
    };
    signal: string;
  }) {
    return {
      templateKey: input.templateKey,
      templateLength: input.inspection.templateLength,
      variableKeys: input.inspection.variableKeys,
      acceptedVariableKeys: input.inspection.acceptedVariableKeys,
      expressionCount: input.inspection.expressionCount,
      expressionTypes: input.inspection.expressionTypes,
      matchedControlledSample: input.inspection.matchedControlledSample,
      unknownExpressionCount: input.inspection.unknownExpressionCount,
      signal: input.signal,
    };
  }

  function summarizeXxeInput(input: {
    importKind: string;
    inspection: {
      xmlLength: number;
      containsDoctype: boolean;
      declaredEntityNames: string[];
      referencedEntityNames: string[];
      entitySourceTypes: string[];
      matchedControlledSample: boolean;
      unknownEntityCount: number;
    };
    signal: string;
  }) {
    return {
      importKind: input.importKind,
      xmlLength: input.inspection.xmlLength,
      containsDoctype: input.inspection.containsDoctype,
      declaredEntityNames: input.inspection.declaredEntityNames,
      referencedEntityNames: input.inspection.referencedEntityNames,
      entitySourceTypes: input.inspection.entitySourceTypes,
      matchedControlledSample: input.inspection.matchedControlledSample,
      unknownEntityCount: input.inspection.unknownEntityCount,
      signal: input.signal,
    };
  }

  function summarizeFileUploadInput(input: {
    fileName: string;
    contentType: string;
    inspection: {
      extension: string;
      allowedExtension: boolean;
      allowedContentType: boolean;
      detectedExecutableContent: boolean;
      contentLength: number;
    };
    signal: string;
  }) {
    return {
      fileName: input.fileName,
      contentType: input.contentType,
      extension: input.inspection.extension,
      allowedExtension: input.inspection.allowedExtension,
      allowedContentType: input.inspection.allowedContentType,
      detectedExecutableContent: input.inspection.detectedExecutableContent,
      contentLength: input.inspection.contentLength,
      signal: input.signal,
    };
  }

  function summarizeInfoDisclosureInput(input: {
    reportKey: string;
    inspection: {
      normalizedReportKey: string;
      requestedSensitiveReport: boolean;
      allowedPublicReport: boolean;
      exposedFieldCount: number;
      reportKeyLength: number;
    };
    signal: string;
  }) {
    return {
      reportKeyLength: input.inspection.reportKeyLength,
      reportKeyPreview: input.inspection.requestedSensitiveReport
        ? "controlled-debug-report-sample"
        : maskLearningInput(input.reportKey),
      normalizedReportKey: input.inspection.normalizedReportKey,
      requestedSensitiveReport: input.inspection.requestedSensitiveReport,
      allowedPublicReport: input.inspection.allowedPublicReport,
      exposedFieldCount: input.inspection.exposedFieldCount,
      signal: input.signal,
    };
  }

  function summarizeJwtInput(input: {
    token: string;
    inspection: {
      tokenLength: number;
      segmentCount: number;
      algorithm: string;
      signaturePresent: boolean;
      signatureValid: boolean;
      roleClaim: string;
      scopeClaim: string;
      adminClaimRequested: boolean;
      labToken: boolean;
    };
    signal: string;
  }) {
    return {
      tokenLength: input.inspection.tokenLength,
      tokenPreview: input.inspection.adminClaimRequested
        ? "controlled-jwt-none-admin-sample"
        : "controlled-jwt-signed-user-sample",
      segmentCount: input.inspection.segmentCount,
      algorithm: input.inspection.algorithm,
      signaturePresent: input.inspection.signaturePresent,
      signatureValid: input.inspection.signatureValid,
      roleClaim: input.inspection.roleClaim,
      scopeClaim: input.inspection.scopeClaim,
      adminClaimRequested: input.inspection.adminClaimRequested,
      labToken: input.inspection.labToken,
      signal: input.signal,
    };
  }

  function summarizeIdorInput(input: {
    orderId: string;
    inspection: {
      orderIdLength: number;
      objectType: "order";
      objectFound: boolean;
      currentUserId: string;
      ownerUserId: string;
      ownerMatches: boolean;
      crossUserRequested: boolean;
    };
    signal: string;
  }) {
    return {
      orderIdLength: input.inspection.orderIdLength,
      orderIdPreview: input.inspection.crossUserRequested
        ? "controlled-idor-cross-user-order"
        : maskLearningInput(input.orderId),
      objectType: input.inspection.objectType,
      objectFound: input.inspection.objectFound,
      currentUserId: input.inspection.currentUserId,
      ownerUserId: input.inspection.ownerUserId,
      ownerMatches: input.inspection.ownerMatches,
      crossUserRequested: input.inspection.crossUserRequested,
      signal: input.signal,
    };
  }

  function summarizePathTraversalInput(input: {
    requestedPath: string;
    inspection: {
      normalizedPath: string;
      containsTraversalSequence: boolean;
      escapedAllowedRoot: boolean;
      requestedPathLength: number;
    };
    signal: string;
  }) {
    return {
      requestedPathLength: input.inspection.requestedPathLength,
      requestedPathPreview: input.inspection.escapedAllowedRoot
        ? "controlled-path-traversal-sample"
        : maskLearningInput(input.requestedPath),
      normalizedPath: input.inspection.normalizedPath,
      containsTraversalSequence: input.inspection.containsTraversalSequence,
      escapedAllowedRoot: input.inspection.escapedAllowedRoot,
      signal: input.signal,
    };
  }

  function summarizePortScanInput(input: {
    targetKey: string;
    scanProfile: string;
    summary: {
      virtualPortCount: number;
      openPortCount: number;
      restrictedPortCount: number;
      highRiskPortCount: number;
      exposureScore: number;
      matchedControlledSample: boolean;
    };
    signal: string;
  }) {
    return {
      targetKey: input.targetKey,
      scanProfile: input.scanProfile,
      virtualPortCount: input.summary.virtualPortCount,
      openPortCount: input.summary.openPortCount,
      restrictedPortCount: input.summary.restrictedPortCount,
      highRiskPortCount: input.summary.highRiskPortCount,
      exposureScore: input.summary.exposureScore,
      matchedControlledSample: input.summary.matchedControlledSample,
      signal: input.signal,
    };
  }

  function summarizeDnsHijackInput(input: {
    domainKey: string;
    resolverProfile: string;
    resolution: {
      expectedAddressCategory: string;
      resolvedAddressCategory: string;
      certificateStatus: string;
      anomalyDetected: boolean;
      matchedControlledSample: boolean;
    };
    signal: string;
  }) {
    return {
      domainKey: input.domainKey,
      resolverProfile: input.resolverProfile,
      expectedAddressCategory: input.resolution.expectedAddressCategory,
      resolvedAddressCategory: input.resolution.resolvedAddressCategory,
      certificateStatus: input.resolution.certificateStatus,
      anomalyDetected: input.resolution.anomalyDetected,
      matchedControlledSample: input.resolution.matchedControlledSample,
      signal: input.signal,
    };
  }

  function summarizePromptInjectionInput(input: {
    scenarioKey: string;
    instructionSourceKey: string;
    defensePolicyKey: string;
    routing: {
      inputLength: number;
      riskCategory: string;
      matchedControlledSample: boolean;
      instructionPriority: string;
      toolRequestStatus: string;
      outputPolicyStatus: string;
    };
    signal: string;
  }) {
    return {
      scenarioKey: input.scenarioKey,
      instructionSourceKey: input.instructionSourceKey,
      defensePolicyKey: input.defensePolicyKey,
      inputLength: input.routing.inputLength,
      riskCategory: input.routing.riskCategory,
      matchedControlledSample: input.routing.matchedControlledSample,
      instructionPriority: input.routing.instructionPriority,
      toolRequestStatus: input.routing.toolRequestStatus,
      outputPolicyStatus: input.routing.outputPolicyStatus,
      signal: input.signal,
    };
  }

  function summarizePrivilegeEscalationInput(input: {
    operationKey: string;
    inspection: {
      operationKeyLength: number;
      requestedRole: string;
      currentUserRole: string;
      effectiveRole: string;
      trustedClientRole: boolean;
      privilegedOperation: boolean;
      roleAllowed: boolean;
    };
    signal: string;
  }) {
    return {
      operationKeyLength: input.inspection.operationKeyLength,
      operationKeyPreview: input.inspection.privilegedOperation
        ? "controlled-admin-operation"
        : maskLearningInput(input.operationKey),
      requestedRole: input.inspection.requestedRole,
      currentUserRole: input.inspection.currentUserRole,
      effectiveRole: input.inspection.effectiveRole,
      trustedClientRole: input.inspection.trustedClientRole,
      privilegedOperation: input.inspection.privilegedOperation,
      roleAllowed: input.inspection.roleAllowed,
      signal: input.signal,
    };
  }

  function summarizeSessionFixationInput(input: {
    preLoginSessionId: string;
    inspection: {
      preLoginSessionIdLength: number;
      sessionSource: string;
      attackerControlled: boolean;
      acceptedClientSessionId: boolean;
      rotatedSessionId: boolean;
      sessionIdChanged: boolean;
      currentUserId: string;
      boundSessionIdLength: number;
    };
    signal: string;
  }) {
    return {
      preLoginSessionIdLength: input.inspection.preLoginSessionIdLength,
      preLoginSessionIdPreview: input.inspection.attackerControlled
        ? "controlled-session-fixation-sample"
        : maskLearningInput(input.preLoginSessionId),
      sessionSource: input.inspection.sessionSource,
      attackerControlled: input.inspection.attackerControlled,
      acceptedClientSessionId: input.inspection.acceptedClientSessionId,
      rotatedSessionId: input.inspection.rotatedSessionId,
      sessionIdChanged: input.inspection.sessionIdChanged,
      currentUserId: input.inspection.currentUserId,
      boundSessionIdLength: input.inspection.boundSessionIdLength,
      signal: input.signal,
    };
  }

  function summarizeSsrfInput(input: {
    targetUrl: string;
    inspection: {
      protocol: string;
      hostname: string;
      pathname: string;
      allowedPublicHost: boolean;
      privateTarget: boolean;
      targetUrlLength: number;
    };
    signal: string;
  }) {
    return {
      targetUrlLength: input.inspection.targetUrlLength,
      targetUrlPreview: input.inspection.privateTarget
        ? "controlled-ssrf-internal-target"
        : maskLearningInput(input.targetUrl),
      protocol: input.inspection.protocol,
      hostname: input.inspection.hostname,
      pathname: input.inspection.pathname,
      allowedPublicHost: input.inspection.allowedPublicHost,
      privateTarget: input.inspection.privateTarget,
      signal: input.signal,
    };
  }

  async function recordLabEventSafely(input: LabEventInput) {
    try {
      await labEventLogsService.recordLabEvent(input);
    } catch (error) {
      console.warn(
        `[LAB_EVENT_SERVICE_FAILED] lab=${input.labKey} signal=${input.signal} error="${getErrorMessage(error)}"`,
      );
    }
  }

  app.get("/api/lab-records/me", async (req, res, next) => {
    try {
      const currentUser = await readCurrentUser(req);

      if (!currentUser.ok) {
        res.status(currentUser.status).json(currentUser.body);
        return;
      }

      const records = await labRecordsService.listUserLabRecords({
        userId: currentUser.user.id,
      });

      res.status(200).json({
        status: "ok",
        records,
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/lab-event-logs/me", async (req, res, next) => {
    try {
      const currentUser = await readCurrentUser(req);

      if (!currentUser.ok) {
        res.status(currentUser.status).json(currentUser.body);
        return;
      }

      const labKey = readOptionalString(req.query.labKey);
      const phase = readOptionalLabEventPhase(req.query.phase);
      const riskLevel = readOptionalLabEventRiskLevel(req.query.riskLevel);
      const events = await labEventLogsService.listUserLabEventLogs({
        userId: currentUser.user.id,
        ...(labKey ? { labKey } : {}),
        ...(phase ? { phase } : {}),
        ...(riskLevel ? { riskLevel } : {}),
      });

      res.status(200).json({
        status: "ok",
        events,
      });
    } catch (error) {
      next(error);
    }
  });

  app.get(
    "/api/lab-recap-question-completions/me",
    async (req, res, next) => {
      try {
        const currentUser = await readCurrentUser(req);

        if (!currentUser.ok) {
          res.status(currentUser.status).json(currentUser.body);
          return;
        }

        const labKey = readOptionalString(req.query.labKey);
        const traceIds = readOptionalCommaSeparatedStrings(req.query.traceIds)
          .filter((traceId) => traceId.length <= 64)
          .slice(0, 30);
        const items =
          await labRecapQuestionCompletionsService.listUserQuestionCompletions({
            userId: currentUser.user.id,
            ...(labKey && labKey.length <= 128 ? { labKey } : {}),
            ...(traceIds.length > 0 ? { traceIds } : {}),
          });

        res.status(200).json({
          status: "ok",
          items,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  app.put(
    "/api/lab-recap-question-completions/me",
    async (req, res, next) => {
      try {
        const currentUser = await readCurrentUser(req);

        if (!currentUser.ok) {
          res.status(currentUser.status).json(currentUser.body);
          return;
        }

        const traceId = readRequiredString(req.body?.traceId);
        const labKey = readRequiredString(req.body?.labKey);
        const questionIndex = readZeroBasedQuestionIndex(
          req.body?.questionIndex,
        );
        const completed = req.body?.completed;

        if (
          !traceId ||
          traceId.length > 64 ||
          !labKey ||
          labKey.length > 128 ||
          questionIndex < 0 ||
          typeof completed !== "boolean"
        ) {
          res.status(400).json({
            status: "error",
            message:
              "traceId, labKey, questionIndex and completed are required",
          });
          return;
        }

        const item =
          await labRecapQuestionCompletionsService.setQuestionCompletion({
            userId: currentUser.user.id,
            traceId,
            labKey,
            questionIndex,
            completed,
          });

        res.status(200).json({
          status: "ok",
          item,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  app.post(
    "/api/labs/:category/:scene/learning-progress",
    async (req, res, next) => {
      try {
        const currentUser = await readCurrentUser(req);

        if (!currentUser.ok) {
          res.status(currentUser.status).json(currentUser.body);
          return;
        }

        const currentLab = await readLab(req.params.category, req.params.scene);

        if (!currentLab.ok) {
          res.status(currentLab.status).json(currentLab.body);
          return;
        }

        const variantKey = readRequiredString(req.body?.variantKey);
        const status = readRequiredString(req.body?.status);

        if (!variantKey || !status) {
          res.status(400).json({
            status: "error",
            message: "variantKey and status are required",
          });
          return;
        }

        const progress = await labRecordsService.recordLearningProgress({
          userId: currentUser.user.id,
          labKey: currentLab.lab.id,
          variantKey,
          status,
          notes: readOptionalString(req.body?.notes),
        });

        res.status(200).json({
          status: "ok",
          progress,
        });
      } catch (error) {
        if (error instanceof LabRecordError) {
          res.status(409).json({
            status: "error",
            message: error.message,
          });
          return;
        }

        next(error);
      }
    },
  );

  app.post(
    "/api/labs/:category/:scene/verification-records",
    async (req, res, next) => {
      try {
        const currentUser = await readCurrentUser(req);

        if (!currentUser.ok) {
          res.status(currentUser.status).json(currentUser.body);
          return;
        }

        const currentLab = await readLab(req.params.category, req.params.scene);

        if (!currentLab.ok) {
          res.status(currentLab.status).json(currentLab.body);
          return;
        }

        const variantKey = readRequiredString(req.body?.variantKey);
        const result = readRequiredString(req.body?.result);
        const summary = readRequiredString(req.body?.summary);

        if (!variantKey || !result || !summary) {
          res.status(400).json({
            status: "error",
            message: "variantKey, result and summary are required",
          });
          return;
        }

        const record = await labRecordsService.recordVerification({
          userId: currentUser.user.id,
          labKey: currentLab.lab.id,
          variantKey,
          result,
          summary,
          details: req.body?.details,
        });

        res.status(200).json({
          status: "ok",
          record,
        });
      } catch (error) {
        if (error instanceof LabRecordError) {
          res.status(409).json({
            status: "error",
            message: error.message,
          });
          return;
        }

        next(error);
      }
    },
  );

  app.post("/api/labs/auth/idor/:variant/read", async (req, res, next) => {
    try {
      const currentUser = await readCurrentUser(req);

      if (!currentUser.ok) {
        res.status(currentUser.status).json(currentUser.body);
        return;
      }

      const variantKey = readIdorVariantKey(req.params.variant);
      const orderId = readRequiredString(req.body?.orderId);

      if (!variantKey) {
        res.status(404).json({
          status: "error",
          message: "idor variant not found",
        });
        return;
      }

      if (!orderId) {
        res.status(400).json({
          status: "error",
          message: "orderId is required",
        });
        return;
      }

      const result = await idorLabService.readOrder({
        userId: currentUser.user.id,
        variantKey,
        orderId,
      });
      const responseStatus =
        result.status === "blocked"
          ? 403
          : result.status === "not-found"
            ? 404
            : 200;

      await recordLabEventSafely({
        traceId: readOptionalTraceId(req),
        userId: currentUser.user.id,
        labKey: "auth.idor",
        variantKey,
        phase:
          result.status === "blocked"
            ? "defense"
            : result.inspection.crossUserRequested
              ? "attack"
              : "normal",
        eventType:
          result.status === "blocked"
            ? "blocked"
            : result.status === "not-found"
              ? "failure"
              : "success",
        actorPerspective: result.inspection.crossUserRequested
          ? "attacker"
          : "user",
        method: req.method,
        path: req.path,
        inputSummary: summarizeIdorInput({
          orderId: result.orderId,
          inspection: result.inspection,
          signal: result.signal,
        }),
        decision: result.decision,
        signal: result.signal,
        statusCode: responseStatus,
        message: result.message,
        riskLevel:
          result.signal === "idor-cross-user-order-exposed"
            ? "high"
            : result.status === "blocked"
              ? "medium"
              : "low",
      });

      res.status(responseStatus).json({
        status: result.status,
        result,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/labs/auth/jwt/:variant/verify", async (req, res, next) => {
    try {
      const currentUser = await readCurrentUser(req);

      if (!currentUser.ok) {
        res.status(currentUser.status).json(currentUser.body);
        return;
      }

      const variantKey = readJwtVariantKey(req.params.variant);
      const token = readRequiredString(req.body?.token);

      if (!variantKey) {
        res.status(404).json({
          status: "error",
          message: "jwt variant not found",
        });
        return;
      }

      if (!token) {
        res.status(400).json({
          status: "error",
          message: "token is required",
        });
        return;
      }

      const result = await jwtLabService.verifyToken({
        userId: currentUser.user.id,
        variantKey,
        token,
      });
      const responseStatus =
        result.status === "blocked"
          ? 403
          : result.status === "invalid"
            ? 400
            : 200;

      await recordLabEventSafely({
        traceId: readOptionalTraceId(req),
        userId: currentUser.user.id,
        labKey: "auth.jwt",
        variantKey,
        phase:
          result.status === "blocked"
            ? "defense"
            : result.inspection.adminClaimRequested
              ? "attack"
              : "normal",
        eventType:
          result.status === "blocked"
            ? "blocked"
            : result.status === "invalid"
              ? "failure"
              : "success",
        actorPerspective: result.inspection.adminClaimRequested
          ? "attacker"
          : "user",
        method: req.method,
        path: req.path,
        inputSummary: summarizeJwtInput({
          token,
          inspection: result.inspection,
          signal: result.signal,
        }),
        decision: result.decision,
        signal: result.signal,
        statusCode: responseStatus,
        message: result.message,
        riskLevel:
          result.signal === "jwt-none-alg-admin-accepted"
            ? "high"
            : result.status === "blocked"
              ? "medium"
              : "low",
      });

      res.status(responseStatus).json({
        status: result.status,
        result,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post(
    "/api/labs/auth/privilege-escalation/:variant/execute",
    async (req, res, next) => {
      try {
        const currentUser = await readCurrentUser(req);

        if (!currentUser.ok) {
          res.status(currentUser.status).json(currentUser.body);
          return;
        }

        const variantKey = readPrivilegeEscalationVariantKey(req.params.variant);
        const operationKey = readRequiredString(req.body?.operationKey);
        const requestedRole = readRequiredString(req.body?.requestedRole);

        if (!variantKey) {
          res.status(404).json({
            status: "error",
            message: "privilege escalation variant not found",
          });
          return;
        }

        if (!operationKey || !requestedRole) {
          res.status(400).json({
            status: "error",
            message: "operationKey and requestedRole are required",
          });
          return;
        }

        const result = await privilegeEscalationLabService.executeOperation({
          userId: currentUser.user.id,
          currentUserRole: currentUser.user.role,
          variantKey,
          operationKey,
          requestedRole,
        });
        const responseStatus =
          result.status === "blocked"
            ? 403
            : result.status === "not-found"
              ? 404
              : 200;

        await recordLabEventSafely({
          traceId: readOptionalTraceId(req),
          userId: currentUser.user.id,
          labKey: "auth.privilege-escalation",
          variantKey,
          phase:
            result.status === "blocked"
              ? "defense"
              : result.inspection.privilegedOperation
                ? "attack"
                : "normal",
          eventType:
            result.status === "blocked"
              ? "blocked"
              : result.status === "not-found"
                ? "failure"
                : "success",
          actorPerspective: result.inspection.privilegedOperation
            ? "attacker"
            : "user",
          method: req.method,
          path: req.path,
          inputSummary: summarizePrivilegeEscalationInput({
            operationKey: result.operationKey,
            inspection: result.inspection,
            signal: result.signal,
          }),
          decision: result.decision,
          signal: result.signal,
          statusCode: responseStatus,
          message: result.message,
          riskLevel:
            result.signal === "privilege-client-role-admin-accepted"
              ? "critical"
              : result.status === "blocked"
                ? "high"
                : "low",
        });

        res.status(responseStatus).json({
          status: result.status,
          result,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  app.post(
    "/api/labs/auth/brute-force/:variant/attempt",
    async (req, res, next) => {
      try {
        const currentUser = await readCurrentUser(req);

        if (!currentUser.ok) {
          res.status(currentUser.status).json(currentUser.body);
          return;
        }

        const variantKey = readBruteForceVariantKey(req.params.variant);
        const targetUsername = readRequiredString(req.body?.targetUsername);
        const rawPasswordCandidates = req.body?.passwordCandidates;
        const passwordCandidates = readRequiredStringArray(rawPasswordCandidates);
        const hasInvalidCandidate =
          Array.isArray(rawPasswordCandidates) &&
          rawPasswordCandidates.some(
            (candidate) =>
              typeof candidate !== "string" || !candidate.trim(),
          );

        if (!variantKey) {
          res.status(404).json({
            status: "error",
            message: "brute force variant not found",
          });
          return;
        }

        if (
          !targetUsername ||
          !Array.isArray(rawPasswordCandidates) ||
          hasInvalidCandidate ||
          passwordCandidates.length < 1 ||
          passwordCandidates.length > 5
        ) {
          res.status(400).json({
            status: "error",
            message:
              "targetUsername and 1 to 5 non-empty passwordCandidates are required",
          });
          return;
        }

        const result = await bruteForceLabService.submitAttempt({
          userId: currentUser.user.id,
          variantKey,
          targetUsername,
          passwordCandidates,
        });
        const responseStatus =
          result.status === "blocked"
            ? 429
            : result.status === "failed"
              ? 401
              : 200;

        await recordLabEventSafely({
          traceId: readOptionalTraceId(req),
          userId: currentUser.user.id,
          labKey: "auth.brute-force",
          variantKey,
          phase:
            result.status === "blocked"
              ? "defense"
              : result.inspection.attackPattern
                ? "attack"
                : "normal",
          eventType:
            result.status === "blocked"
              ? "blocked"
              : result.status === "failed"
                ? "failure"
                : "success",
          actorPerspective: result.inspection.attackPattern
            ? "attacker"
            : "user",
          method: req.method,
          path: req.path,
          inputSummary: summarizeBruteForceInput({
            targetUsername: result.targetUsername,
            inspection: result.inspection,
            signal: result.signal,
          }),
          decision: result.decision,
          signal: result.signal,
          statusCode: responseStatus,
          message: result.message,
          riskLevel:
            result.signal === "brute-force-password-guessed"
              ? "high"
              : result.signal === "brute-force-rate-limit-blocked"
                ? "medium"
                : "low",
        });

        res.status(responseStatus).json({
          status: result.status,
          result,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  app.post(
    "/api/labs/auth/session-fixation/:variant/login",
    async (req, res, next) => {
      try {
        const currentUser = await readCurrentUser(req);

        if (!currentUser.ok) {
          res.status(currentUser.status).json(currentUser.body);
          return;
        }

        const variantKey = readSessionFixationVariantKey(req.params.variant);
        const preLoginSessionId = readRequiredString(
          req.body?.preLoginSessionId,
        );
        const sessionSource = readRequiredString(req.body?.sessionSource);

        if (!variantKey) {
          res.status(404).json({
            status: "error",
            message: "session fixation variant not found",
          });
          return;
        }

        if (!preLoginSessionId || !sessionSource) {
          res.status(400).json({
            status: "error",
            message: "preLoginSessionId and sessionSource are required",
          });
          return;
        }

        const result = await sessionFixationLabService.submitTeachingLogin({
          userId: currentUser.user.id,
          username: currentUser.user.username,
          variantKey,
          preLoginSessionId,
          sessionSource,
        });

        await recordLabEventSafely({
          traceId: readOptionalTraceId(req),
          userId: currentUser.user.id,
          labKey: "auth.session-fixation",
          variantKey,
          phase: result.inspection.attackerControlled
            ? result.inspection.rotatedSessionId
              ? "defense"
              : "attack"
            : "normal",
          eventType: "success",
          actorPerspective: result.inspection.attackerControlled
            ? "attacker"
            : "user",
          method: req.method,
          path: req.path,
          inputSummary: summarizeSessionFixationInput({
            preLoginSessionId: result.preLoginSessionId,
            inspection: result.inspection,
            signal: result.signal,
          }),
          decision: result.decision,
          signal: result.signal,
          statusCode: 200,
          message: result.message,
          riskLevel:
            result.signal === "session-fixed-id-bound"
              ? "high"
              : result.signal === "session-fixed-id-rotated"
                ? "medium"
                : "low",
        });

        res.status(200).json({
          status: result.status,
          result,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  app.get("/api/labs/web/csrf/state", async (req, res, next) => {
    try {
      const currentUser = await readCurrentUser(req);

      if (!currentUser.ok) {
        res.status(currentUser.status).json(currentUser.body);
        return;
      }

      const state = await csrfLabService.readState({
        userId: currentUser.user.id,
      });

      res.status(200).json({
        status: "ok",
        state,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/labs/web/csrf/fixed/token", async (req, res, next) => {
    try {
      const currentUser = await readCurrentUser(req);

      if (!currentUser.ok) {
        res.status(currentUser.status).json(currentUser.body);
        return;
      }

      const token = await csrfLabService.issueToken({
        userId: currentUser.user.id,
      });

      res.status(200).json({
        status: "ok",
        ...token,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/labs/web/csrf/:variant/transfer", async (req, res, next) => {
    try {
      const currentUser = await readCurrentUser(req);

      if (!currentUser.ok) {
        res.status(currentUser.status).json(currentUser.body);
        return;
      }

      const variantKey = readCsrfVariantKey(req.params.variant);
      const amount = readPositiveInteger(req.body?.amount);
      const targetAccount = readRequiredString(req.body?.targetAccount);
      const csrfToken = readOptionalString(req.body?.csrfToken);

      if (!variantKey) {
        res.status(404).json({
          status: "error",
          message: "csrf variant not found",
        });
        return;
      }

      if (!amount || !targetAccount) {
        res.status(400).json({
          status: "error",
          message: "amount and targetAccount are required",
        });
        return;
      }

      const result = await csrfLabService.submitTransfer({
        userId: currentUser.user.id,
        variantKey,
        amount,
        targetAccount,
        csrfToken,
      });
      const responseStatus = result.status === "blocked" ? 403 : 200;

      await recordLabEventSafely({
        traceId: readOptionalTraceId(req),
        userId: currentUser.user.id,
        labKey: "web.csrf",
        variantKey,
        phase:
          result.status === "blocked"
            ? "defense"
            : variantKey === "vuln"
              ? "attack"
              : "normal",
        eventType: result.status === "blocked" ? "blocked" : "success",
        actorPerspective:
          variantKey === "fixed" && result.status === "ok" ? "user" : "attacker",
        method: req.method,
        path: req.path,
        inputSummary: {
          amount,
          targetAccountMasked: maskLearningInput(targetAccount),
          hasCsrfToken: Boolean(csrfToken),
        },
        decision: result.status === "blocked" ? "blocked" : "accepted",
        signal: result.state.lastSignal,
        statusCode: responseStatus,
        message: getCsrfEventMessage({
          variantKey,
          status: result.status,
        }),
        riskLevel:
          variantKey === "vuln"
            ? "high"
            : result.status === "blocked"
              ? "medium"
              : "low",
      });

      res.status(responseStatus).json({
        status: result.status,
        state: result.state,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post(
    "/api/labs/web/command-injection/:variant/run",
    async (req, res, next) => {
      try {
        const currentUser = await readCurrentUser(req);

        if (!currentUser.ok) {
          res.status(currentUser.status).json(currentUser.body);
          return;
        }

        const variantKey = readCommandInjectionVariantKey(req.params.variant);
        const taskKey = readRequiredString(req.body?.taskKey);
        const target = readRequiredString(req.body?.target);

        if (!variantKey) {
          res.status(404).json({
            status: "error",
            message: "command injection variant not found",
          });
          return;
        }

        if (!taskKey || !target) {
          res.status(400).json({
            status: "error",
            message: "taskKey and target are required",
          });
          return;
        }

        const result = await commandInjectionLabService.runDiagnostic({
          userId: currentUser.user.id,
          variantKey,
          taskKey,
          target,
        });
        const responseStatus =
          result.status === "blocked"
            ? 403
            : result.status === "failed"
              ? 404
              : 200;

        await recordLabEventSafely({
          traceId: readOptionalTraceId(req),
          userId: currentUser.user.id,
          labKey: "web.command-injection",
          variantKey,
          phase:
            result.status === "blocked"
              ? "defense"
              : result.inspection.containsCommandSeparator
                ? "attack"
                : "normal",
          eventType:
            result.status === "blocked"
              ? "blocked"
              : result.status === "failed"
                ? "failure"
                : "success",
          actorPerspective: result.inspection.containsCommandSeparator
            ? "attacker"
            : "user",
          method: req.method,
          path: req.path,
          inputSummary: summarizeCommandInjectionInput({
            taskKey: result.taskKey,
            target: result.target,
            inspection: result.inspection,
            signal: result.signal,
          }),
          decision: result.decision,
          signal: result.signal,
          statusCode: responseStatus,
          message: result.message,
          riskLevel:
            result.signal === "command-injection-virtual-command-executed"
              ? "critical"
              : result.signal === "command-injection-command-separator-detected"
                ? "high"
                : result.status === "blocked"
                  ? "medium"
                  : "low",
        });

        res.status(responseStatus).json({
          status: result.status,
          result,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  app.post("/api/labs/web/ssti/:variant/preview", async (req, res, next) => {
    try {
      const currentUser = await readCurrentUser(req);

      if (!currentUser.ok) {
        res.status(currentUser.status).json(currentUser.body);
        return;
      }

      const variantKey = readSstiVariantKey(req.params.variant);
      const templateKey = readRequiredString(req.body?.templateKey);
      const templateText = readOptionalString(req.body?.templateText);
      const variables = readSstiTemplateVariables(req.body?.variables);

      if (!variantKey) {
        res.status(404).json({
          status: "error",
          message: "ssti variant not found",
        });
        return;
      }

      if (!templateKey || !variables) {
        res.status(400).json({
          status: "error",
          message:
            "templateKey and variables.customerName/orderNo/noticeTitle are required",
        });
        return;
      }

      const result = await sstiLabService.previewTemplate({
        userId: currentUser.user.id,
        variantKey,
        templateKey,
        templateText,
        variables,
      });
      const responseStatus =
        result.status === "blocked"
          ? 403
          : result.status === "failed"
            ? 404
            : 200;
      const expressionAttempt =
        result.inspection.matchedControlledSample ||
        result.inspection.unknownExpressionCount > 0;

      await recordLabEventSafely({
        traceId: readOptionalTraceId(req),
        userId: currentUser.user.id,
        labKey: "web.ssti",
        variantKey,
        phase:
          result.status === "blocked" && variantKey === "fixed"
            ? "defense"
            : expressionAttempt
              ? "attack"
              : "normal",
        eventType:
          result.status === "blocked"
            ? "blocked"
            : result.status === "failed"
              ? "failure"
              : "success",
        actorPerspective: expressionAttempt ? "attacker" : "user",
        method: req.method,
        path: req.path,
        inputSummary: summarizeSstiInput({
          templateKey: result.templateKey,
          inspection: result.inspection,
          signal: result.signal,
        }),
        decision: result.decision,
        signal: result.signal,
        statusCode: responseStatus,
        message: result.message,
        riskLevel:
          result.signal === "ssti-template-context-exposed"
            ? "critical"
            : result.signal === "ssti-expression-evaluated"
              ? "high"
              : result.status === "blocked"
                ? "medium"
                : "low",
      });

      res.status(responseStatus).json({
        status: result.status,
        result,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/labs/web/xxe/:variant/import", async (req, res, next) => {
    try {
      const currentUser = await readCurrentUser(req);

      if (!currentUser.ok) {
        res.status(currentUser.status).json(currentUser.body);
        return;
      }

      const variantKey = readXxeVariantKey(req.params.variant);
      const importKind = readRequiredString(req.body?.importKind);
      const xmlDocument = readRequiredString(req.body?.xmlDocument);

      if (!variantKey) {
        res.status(404).json({
          status: "error",
          message: "xxe variant not found",
        });
        return;
      }

      if (!importKind || !xmlDocument) {
        res.status(400).json({
          status: "error",
          message: "importKind and xmlDocument are required",
        });
        return;
      }

      const result = await xxeLabService.importXml({
        userId: currentUser.user.id,
        variantKey,
        importKind,
        xmlDocument,
      });
      const responseStatus =
        result.status === "blocked"
          ? 403
          : result.status === "failed"
            ? result.signal === "xxe-xml-too-large"
              ? 400
              : 404
            : 200;
      const entityAttempt =
        result.inspection.containsDoctype ||
        result.inspection.declaredEntityNames.length > 0 ||
        result.inspection.referencedEntityNames.length > 0;

      await recordLabEventSafely({
        traceId: readOptionalTraceId(req),
        userId: currentUser.user.id,
        labKey: "web.xxe",
        variantKey,
        phase:
          result.status === "blocked" && variantKey === "fixed"
            ? "defense"
            : entityAttempt
              ? "attack"
              : "normal",
        eventType:
          result.status === "blocked"
            ? "blocked"
            : result.status === "failed"
              ? "failure"
              : "success",
        actorPerspective: entityAttempt ? "attacker" : "user",
        method: req.method,
        path: req.path,
        inputSummary: summarizeXxeInput({
          importKind: result.importKind,
          inspection: result.inspection,
          signal: result.signal,
        }),
        decision: result.decision,
        signal: result.signal,
        statusCode: responseStatus,
        message: result.message,
        riskLevel:
          result.signal === "xxe-internal-resource-exposed"
            ? "critical"
            : result.signal === "xxe-virtual-entity-resolved"
              ? "high"
              : result.status === "blocked"
                ? "medium"
                : "low",
      });

      res.status(responseStatus).json({
        status: result.status,
        result,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post(
    "/api/labs/web/nosql-injection/:variant/search",
    async (req, res, next) => {
      try {
        const currentUser = await readCurrentUser(req);

        if (!currentUser.ok) {
          res.status(currentUser.status).json(currentUser.body);
          return;
        }

        const variantKey = readNosqlInjectionVariantKey(req.params.variant);
        const queryMode = readRequiredString(req.body?.queryMode);
        const keyword = readRequiredString(req.body?.keyword);
        const filterText = readOptionalString(req.body?.filterText);

        if (!variantKey) {
          res.status(404).json({
            status: "error",
            message: "nosql injection variant not found",
          });
          return;
        }

        if (!queryMode || !keyword) {
          res.status(400).json({
            status: "error",
            message: "queryMode and keyword are required",
          });
          return;
        }

        const result = await nosqlInjectionLabService.searchCoupons({
          userId: currentUser.user.id,
          variantKey,
          queryMode,
          keyword,
          filterText,
        });
        const responseStatus =
          result.status === "blocked"
            ? 403
            : result.status === "failed"
              ? 404
              : 200;
        const queryRiskAttempt = result.inspection.detectedRiskTypes.some(
          (riskType) => riskType !== "none",
        );

        await recordLabEventSafely({
          traceId: readOptionalTraceId(req),
          userId: currentUser.user.id,
          labKey: "web.nosql-injection",
          variantKey,
          phase:
            result.status === "blocked" && variantKey === "fixed"
              ? "defense"
              : queryRiskAttempt
                ? "attack"
                : "normal",
          eventType:
            result.status === "blocked"
              ? "blocked"
              : result.status === "failed"
                ? "failure"
                : "success",
          actorPerspective: queryRiskAttempt ? "attacker" : "user",
          method: req.method,
          path: req.path,
          inputSummary: summarizeNosqlInjectionInput({
            queryMode: result.queryMode,
            keyword: result.keyword,
            inspection: result.inspection,
            documentCount: result.documents.length,
            signal: result.signal,
          }),
          decision: result.decision,
          signal: result.signal,
          statusCode: responseStatus,
          message: result.message,
          riskLevel:
            result.signal === "nosql-injection-query-expanded"
              ? "high"
              : result.status === "blocked"
                ? "medium"
                : "low",
        });

        res.status(responseStatus).json({
          status: result.status,
          result,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  app.post(
    "/api/labs/web/crlf-injection/:variant/preview",
    async (req, res, next) => {
      try {
        const currentUser = await readCurrentUser(req);

        if (!currentUser.ok) {
          res.status(currentUser.status).json(currentUser.body);
          return;
        }

        const variantKey = readCrlfInjectionVariantKey(req.params.variant);
        const headerTemplate = readRequiredString(req.body?.headerTemplate);
        const rawFileName = req.body?.fileName;
        const fileName =
          typeof rawFileName === "string" && rawFileName.length > 0
            ? rawFileName
            : "";
        const dispositionType = readRequiredString(req.body?.dispositionType);

        if (!variantKey) {
          res.status(404).json({
            status: "error",
            message: "crlf injection variant not found",
          });
          return;
        }

        if (!headerTemplate || !fileName || !dispositionType) {
          res.status(400).json({
            status: "error",
            message: "headerTemplate, fileName and dispositionType are required",
          });
          return;
        }

        const result = await crlfInjectionLabService.previewHeaders({
          userId: currentUser.user.id,
          variantKey,
          headerTemplate,
          fileName,
          dispositionType,
        });
        const responseStatus =
          result.status === "blocked"
            ? 403
            : result.status === "failed"
              ? 404
              : 200;
        const controlCharAttempt =
          result.inspection.detectedControlChars.length > 0;

        await recordLabEventSafely({
          traceId: readOptionalTraceId(req),
          userId: currentUser.user.id,
          labKey: "web.crlf-injection",
          variantKey,
          phase:
            result.status === "blocked" && variantKey === "fixed"
              ? "defense"
              : controlCharAttempt
                ? "attack"
                : "normal",
          eventType:
            result.status === "blocked"
              ? "blocked"
              : result.status === "failed"
                ? "failure"
                : "success",
          actorPerspective: controlCharAttempt ? "attacker" : "user",
          method: req.method,
          path: req.path,
          inputSummary: summarizeCrlfInjectionInput({
            headerTemplate: result.headerTemplate,
            dispositionType: result.dispositionType,
            inspection: result.inspection,
            signal: result.signal,
          }),
          decision: result.decision,
          signal: result.signal,
          statusCode: responseStatus,
          message: result.message,
          riskLevel:
            result.signal === "crlf-injection-virtual-header-injected"
              ? "high"
              : result.status === "blocked"
                ? "medium"
                : "low",
        });

        res.status(responseStatus).json({
          status: result.status,
          result,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  app.post(
    "/api/labs/web/xpath-injection/:variant/search",
    async (req, res, next) => {
      try {
        const currentUser = await readCurrentUser(req);

        if (!currentUser.ok) {
          res.status(currentUser.status).json(currentUser.body);
          return;
        }

        const variantKey = readXpathInjectionVariantKey(req.params.variant);
        const queryTemplate = readRequiredString(req.body?.queryTemplate);
        const keyword = readRequiredString(req.body?.keyword);
        const scope = readRequiredString(req.body?.scope);

        if (!variantKey) {
          res.status(404).json({
            status: "error",
            message: "xpath injection variant not found",
          });
          return;
        }

        if (!queryTemplate || !keyword || !scope) {
          res.status(400).json({
            status: "error",
            message: "queryTemplate, keyword and scope are required",
          });
          return;
        }

        const result = await xpathInjectionLabService.searchCatalog({
          userId: currentUser.user.id,
          variantKey,
          queryTemplate,
          keyword,
          scope,
        });
        const responseStatus =
          result.status === "blocked"
            ? 403
            : result.status === "failed"
              ? 404
              : 200;
        const queryRiskAttempt = result.inspection.detectedRiskTypes.some(
          (riskType) => riskType !== "none",
        );

        await recordLabEventSafely({
          traceId: readOptionalTraceId(req),
          userId: currentUser.user.id,
          labKey: "web.xpath-injection",
          variantKey,
          phase:
            result.status === "blocked" && variantKey === "fixed"
              ? "defense"
              : queryRiskAttempt
                ? "attack"
                : "normal",
          eventType:
            result.status === "blocked"
              ? "blocked"
              : result.status === "failed"
                ? "failure"
                : "success",
          actorPerspective: queryRiskAttempt ? "attacker" : "user",
          method: req.method,
          path: req.path,
          inputSummary: summarizeXpathInjectionInput({
            queryTemplate: result.queryTemplate,
            scope: result.scope,
            inspection: result.inspection,
            documentCount: result.documents.length,
            signal: result.signal,
          }),
          decision: result.decision,
          signal: result.signal,
          statusCode: responseStatus,
          message: result.message,
          riskLevel:
            result.signal === "xpath-injection-result-scope-expanded"
              ? "high"
              : result.status === "blocked"
                ? "medium"
                : "low",
        });

        res.status(responseStatus).json({
          status: result.status,
          result,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  app.post(
    "/api/labs/web/ldap-injection/:variant/search",
    async (req, res, next) => {
      try {
        const currentUser = await readCurrentUser(req);

        if (!currentUser.ok) {
          res.status(currentUser.status).json(currentUser.body);
          return;
        }

        const variantKey = readLdapInjectionVariantKey(req.params.variant);
        const scenarioKey = readRequiredString(req.body?.scenarioKey);
        const keyword = readRequiredString(req.body?.keyword);

        if (!variantKey) {
          res.status(404).json({
            status: "error",
            message: "ldap injection variant not found",
          });
          return;
        }

        if (!scenarioKey || !keyword) {
          res.status(400).json({
            status: "error",
            message: "scenarioKey and keyword are required",
          });
          return;
        }

        const result = await ldapInjectionLabService.searchDirectory({
          userId: currentUser.user.id,
          variantKey,
          scenarioKey,
          keyword,
        });
        const responseStatus =
          result.status === "blocked"
            ? 403
            : result.status === "failed"
              ? 404
              : 200;
        const queryRiskAttempt = result.inspection.detectedRiskTypes.some(
          (riskType) => riskType !== "none",
        );

        await recordLabEventSafely({
          traceId: readOptionalTraceId(req),
          userId: currentUser.user.id,
          labKey: "web.ldap-injection",
          variantKey,
          phase:
            result.status === "blocked" && variantKey === "fixed"
              ? "defense"
              : queryRiskAttempt
                ? "attack"
                : "normal",
          eventType:
            result.status === "blocked"
              ? "blocked"
              : result.status === "failed"
                ? "failure"
                : "success",
          actorPerspective: queryRiskAttempt ? "attacker" : "user",
          method: req.method,
          path: req.path,
          inputSummary: summarizeLdapInjectionInput({
            scenarioKey: result.scenarioKey,
            inspection: result.inspection,
            entryCount: result.entries.length,
            signal: result.signal,
          }),
          decision: result.decision,
          signal: result.signal,
          statusCode: responseStatus,
          message: result.message,
          riskLevel:
            result.signal === "ldap-injection-scope-expanded"
              ? "high"
              : result.status === "blocked"
                ? "medium"
                : "low",
        });

        res.status(responseStatus).json({
          status: result.status,
          result,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  app.post(
    "/api/labs/web/sql-injection/:variant/search",
    async (req, res, next) => {
      try {
        const currentUser = await readCurrentUser(req);

        if (!currentUser.ok) {
          res.status(currentUser.status).json(currentUser.body);
          return;
        }

        const variantKey = readSqlInjectionVariantKey(req.params.variant);
        const keyword = readRequiredString(req.body?.keyword);

        if (!variantKey) {
          res.status(404).json({
            status: "error",
            message: "sql injection variant not found",
          });
          return;
        }

        if (!keyword) {
          res.status(400).json({
            status: "error",
            message: "keyword is required",
          });
          return;
        }

        const result = await sqlInjectionLabService.searchProducts({
          variantKey,
          keyword,
        });
        const responseStatus =
          result.status === "blocked" ? 403 : result.status === "failed" ? 400 : 200;

        await recordLabEventSafely({
          traceId: readOptionalTraceId(req),
          userId: currentUser.user.id,
          labKey: "web.sql-injection",
          variantKey,
          phase:
            result.status === "blocked"
              ? "defense"
              : result.detectedInjection
                ? "attack"
                : "normal",
          eventType:
            result.status === "blocked"
              ? "blocked"
              : result.status === "failed"
                ? "failure"
                : "success",
          actorPerspective: result.detectedInjection ? "attacker" : "user",
          method: req.method,
          path: req.path,
          inputSummary: {
            ...summarizeSqlInjectionKeyword({
              keyword: result.keyword,
              detectedInjection: result.detectedInjection,
              signal: result.signal,
            }),
            queryMode: result.queryMode,
            resultCount: result.rows.length,
            containsHiddenResult: result.rows.some((row) => row.isHidden),
          },
          decision: result.decision,
          signal: result.signal,
          statusCode: responseStatus,
          message: result.message,
          riskLevel:
            result.signal === "sql-injection-data-exposed"
              ? "critical"
              : result.detectedInjection
                ? "high"
                : "low",
        });

        res.status(responseStatus).json({
          status: result.status,
          result,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  app.post(
    "/api/labs/web/file-upload/:variant/upload",
    async (req, res, next) => {
      try {
        const currentUser = await readCurrentUser(req);

        if (!currentUser.ok) {
          res.status(currentUser.status).json(currentUser.body);
          return;
        }

        const variantKey = readFileUploadVariantKey(req.params.variant);
        const fileName = readRequiredString(req.body?.fileName);
        const contentType = readRequiredString(req.body?.contentType);
        const contentText =
          typeof req.body?.contentText === "string" ? req.body.contentText : "";

        if (!variantKey) {
          res.status(404).json({
            status: "error",
            message: "file upload variant not found",
          });
          return;
        }

        if (!fileName || !contentType || !contentText) {
          res.status(400).json({
            status: "error",
            message: "fileName, contentType and contentText are required",
          });
          return;
        }

        const result = await fileUploadLabService.submitUpload({
          userId: currentUser.user.id,
          variantKey,
          fileName,
          contentType,
          contentText,
        });
        const responseStatus = result.status === "blocked" ? 403 : 200;
        const dangerousUpload =
          !result.inspection.allowedExtension ||
          !result.inspection.allowedContentType ||
          result.inspection.detectedExecutableContent;

        await recordLabEventSafely({
          traceId: readOptionalTraceId(req),
          userId: currentUser.user.id,
          labKey: "web.file-upload",
          variantKey,
          phase:
            result.status === "blocked"
              ? "defense"
              : dangerousUpload
                ? "attack"
                : "normal",
          eventType: result.status === "blocked" ? "blocked" : "success",
          actorPerspective: dangerousUpload ? "attacker" : "user",
          method: req.method,
          path: req.path,
          inputSummary: summarizeFileUploadInput({
            fileName: result.fileName,
            contentType: result.contentType,
            inspection: result.inspection,
            signal: result.signal,
          }),
          decision: result.decision,
          signal: result.signal,
          statusCode: responseStatus,
          message: result.message,
          riskLevel:
            result.signal === "file-upload-executable-stored"
              ? "high"
              : result.status === "blocked"
                ? "medium"
                : "low",
        });

        res.status(responseStatus).json({
          status: result.status,
          result,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  app.post(
    "/api/labs/web/info-disclosure/:variant/report",
    async (req, res, next) => {
      try {
        const currentUser = await readCurrentUser(req);

        if (!currentUser.ok) {
          res.status(currentUser.status).json(currentUser.body);
          return;
        }

        const variantKey = readInfoDisclosureVariantKey(req.params.variant);
        const reportKey = readRequiredString(req.body?.reportKey);

        if (!variantKey) {
          res.status(404).json({
            status: "error",
            message: "info disclosure variant not found",
          });
          return;
        }

        if (!reportKey) {
          res.status(400).json({
            status: "error",
            message: "reportKey is required",
          });
          return;
        }

        const result = await infoDisclosureLabService.readReport({
          userId: currentUser.user.id,
          variantKey,
          reportKey,
        });
        const responseStatus =
          result.status === "blocked"
            ? 403
            : result.status === "not-found"
              ? 404
              : 200;

        await recordLabEventSafely({
          traceId: readOptionalTraceId(req),
          userId: currentUser.user.id,
          labKey: "web.info-disclosure",
          variantKey,
          phase:
            result.status === "blocked"
              ? "defense"
              : result.inspection.requestedSensitiveReport
                ? "attack"
                : "normal",
          eventType:
            result.status === "blocked"
              ? "blocked"
              : result.status === "not-found"
                ? "failure"
                : "success",
          actorPerspective: result.inspection.requestedSensitiveReport
            ? "attacker"
            : "user",
          method: req.method,
          path: req.path,
          inputSummary: summarizeInfoDisclosureInput({
            reportKey: result.reportKey,
            inspection: result.inspection,
            signal: result.signal,
          }),
          decision: result.decision,
          signal: result.signal,
          statusCode: responseStatus,
          message: result.message,
          riskLevel:
            result.signal === "info-disclosure-debug-data-exposed"
              ? "high"
              : result.status === "blocked"
                ? "medium"
                : "low",
        });

        res.status(responseStatus).json({
          status: result.status,
          result,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  app.post(
    "/api/labs/web/path-traversal/:variant/read",
    async (req, res, next) => {
      try {
        const currentUser = await readCurrentUser(req);

        if (!currentUser.ok) {
          res.status(currentUser.status).json(currentUser.body);
          return;
        }

        const variantKey = readPathTraversalVariantKey(req.params.variant);
        const requestedPath = readRequiredString(req.body?.requestedPath);

        if (!variantKey) {
          res.status(404).json({
            status: "error",
            message: "path traversal variant not found",
          });
          return;
        }

        if (!requestedPath) {
          res.status(400).json({
            status: "error",
            message: "requestedPath is required",
          });
          return;
        }

        const result = await pathTraversalLabService.readDocument({
          userId: currentUser.user.id,
          variantKey,
          requestedPath,
        });
        const responseStatus =
          result.status === "blocked"
            ? 403
            : result.status === "not-found"
              ? 404
              : 200;

        await recordLabEventSafely({
          traceId: readOptionalTraceId(req),
          userId: currentUser.user.id,
          labKey: "web.path-traversal",
          variantKey,
          phase:
            result.status === "blocked"
              ? "defense"
              : result.inspection.escapedAllowedRoot
                ? "attack"
                : "normal",
          eventType:
            result.status === "blocked"
              ? "blocked"
              : result.status === "not-found"
                ? "failure"
                : "success",
          actorPerspective: result.inspection.escapedAllowedRoot
            ? "attacker"
            : "user",
          method: req.method,
          path: req.path,
          inputSummary: summarizePathTraversalInput({
            requestedPath: result.requestedPath,
            inspection: result.inspection,
            signal: result.signal,
          }),
          decision: result.decision,
          signal: result.signal,
          statusCode: responseStatus,
          message: result.message,
          riskLevel:
            result.signal === "path-traversal-sensitive-file-exposed"
              ? "high"
              : result.status === "blocked"
                ? "medium"
                : "low",
        });

        res.status(responseStatus).json({
          status: result.status,
          result,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  app.post("/api/labs/web/ssrf/:variant/fetch", async (req, res, next) => {
    try {
      const currentUser = await readCurrentUser(req);

      if (!currentUser.ok) {
        res.status(currentUser.status).json(currentUser.body);
        return;
      }

      const variantKey = readSsrfVariantKey(req.params.variant);
      const targetUrl = readRequiredString(req.body?.targetUrl);

      if (!variantKey) {
        res.status(404).json({
          status: "error",
          message: "ssrf variant not found",
        });
        return;
      }

      if (!targetUrl) {
        res.status(400).json({
          status: "error",
          message: "targetUrl is required",
        });
        return;
      }

      const result = await ssrfLabService.fetchResource({
        userId: currentUser.user.id,
        variantKey,
        targetUrl,
      });
      const responseStatus =
        result.status === "blocked"
          ? 403
          : result.status === "not-found"
            ? 404
            : 200;

      await recordLabEventSafely({
        traceId: readOptionalTraceId(req),
        userId: currentUser.user.id,
        labKey: "web.ssrf",
        variantKey,
        phase:
          result.status === "blocked"
            ? "defense"
            : result.inspection.privateTarget
              ? "attack"
              : "normal",
        eventType:
          result.status === "blocked"
            ? "blocked"
            : result.status === "not-found"
              ? "failure"
              : "success",
        actorPerspective: result.inspection.privateTarget ? "attacker" : "user",
        method: req.method,
        path: req.path,
        inputSummary: summarizeSsrfInput({
          targetUrl: result.targetUrl,
          inspection: result.inspection,
          signal: result.signal,
        }),
        decision: result.decision,
        signal: result.signal,
        statusCode: responseStatus,
        message: result.message,
        riskLevel:
          result.signal === "ssrf-internal-metadata-exposed"
            ? "high"
            : result.status === "blocked"
              ? "medium"
              : "low",
      });

      res.status(responseStatus).json({
        status: result.status,
        result,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post(
    "/api/labs/network/port-scan/:variant/scan",
    async (req, res, next) => {
      try {
        const currentUser = await readCurrentUser(req);

        if (!currentUser.ok) {
          res.status(currentUser.status).json(currentUser.body);
          return;
        }

        const variantKey = readPortScanVariantKey(req.params.variant);
        const targetKey = readRequiredString(req.body?.targetKey);
        const scanProfile = readRequiredString(req.body?.scanProfile);

        if (!variantKey) {
          res.status(404).json({
            status: "error",
            message: "port scan variant not found",
          });
          return;
        }

        if (!targetKey || !scanProfile) {
          res.status(400).json({
            status: "error",
            message: "targetKey and scanProfile are required",
          });
          return;
        }

        const result = await portScanLabService.observeExposure({
          userId: currentUser.user.id,
          variantKey,
          targetKey,
          scanProfile,
        });
        const responseStatus = result.status === "blocked" ? 403 : 200;
        const highRiskExposure =
          result.signal === "port-scan-exposure-expanded" ||
          result.signal === "port-scan-management-surface-visible";

        await recordLabEventSafely({
          traceId: readOptionalTraceId(req),
          userId: currentUser.user.id,
          labKey: "network.port-scan",
          variantKey,
          phase:
            result.status === "blocked"
              ? "defense"
              : highRiskExposure
                ? "attack"
                : variantKey === "fixed"
                  ? "defense"
                  : "normal",
          eventType: result.status === "blocked" ? "blocked" : "success",
          actorPerspective:
            result.status === "blocked" || highRiskExposure
              ? "attacker"
              : "user",
          method: req.method,
          path: req.path,
          inputSummary: summarizePortScanInput({
            targetKey: result.targetKey,
            scanProfile: result.scanProfile,
            summary: result.summary,
            signal: result.signal,
          }),
          decision: result.decision,
          signal: result.signal,
          statusCode: responseStatus,
          message: result.message,
          riskLevel: highRiskExposure
            ? "high"
            : result.status === "blocked"
              ? "medium"
              : "low",
        });

        res.status(responseStatus).json({
          status: result.status,
          result,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  app.post(
    "/api/labs/network/dns-hijack/:variant/resolve",
    async (req, res, next) => {
      try {
        const currentUser = await readCurrentUser(req);

        if (!currentUser.ok) {
          res.status(currentUser.status).json(currentUser.body);
          return;
        }

        const variantKey = readDnsHijackVariantKey(req.params.variant);
        const domainKey = readRequiredString(req.body?.domainKey);
        const resolverProfile = readRequiredString(req.body?.resolverProfile);

        if (!variantKey) {
          res.status(404).json({
            status: "error",
            message: "dns hijack variant not found",
          });
          return;
        }

        if (!domainKey || !resolverProfile) {
          res.status(400).json({
            status: "error",
            message: "domainKey and resolverProfile are required",
          });
          return;
        }

        const result = await dnsHijackLabService.resolveDomain({
          userId: currentUser.user.id,
          variantKey,
          domainKey,
          resolverProfile,
        });
        const responseStatus = result.status === "blocked" ? 403 : 200;
        const hijackVisible =
          result.signal === "dns-hijack-resolution-misdirected" ||
          result.signal === "dns-hijack-certificate-mismatch-visible";

        await recordLabEventSafely({
          traceId: readOptionalTraceId(req),
          userId: currentUser.user.id,
          labKey: "network.dns-hijack",
          variantKey,
          phase:
            result.status === "blocked"
              ? "defense"
              : hijackVisible
                ? "attack"
                : variantKey === "fixed"
                  ? "defense"
                  : "normal",
          eventType: result.status === "blocked" ? "blocked" : "success",
          actorPerspective:
            result.status === "blocked" || hijackVisible ? "attacker" : "user",
          method: req.method,
          path: req.path,
          inputSummary: summarizeDnsHijackInput({
            domainKey: result.domainKey,
            resolverProfile: result.resolverProfile,
            resolution: result.resolution,
            signal: result.signal,
          }),
          decision: result.decision,
          signal: result.signal,
          statusCode: responseStatus,
          message: result.message,
          riskLevel: hijackVisible
            ? "high"
            : result.status === "blocked"
              ? "medium"
              : "low",
        });

        res.status(responseStatus).json({
          status: result.status,
          result,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  app.post(
    "/api/labs/ai/prompt-injection/:variant/evaluate",
    async (req, res, next) => {
      try {
        const currentUser = await readCurrentUser(req);

        if (!currentUser.ok) {
          res.status(currentUser.status).json(currentUser.body);
          return;
        }

        const variantKey = readPromptInjectionVariantKey(req.params.variant);
        const scenarioKey = readRequiredString(req.body?.scenarioKey);
        const instructionSourceKey = readRequiredString(
          req.body?.instructionSourceKey,
        );
        const defensePolicyKey = readRequiredString(req.body?.defensePolicyKey);

        if (!variantKey) {
          res.status(404).json({
            status: "error",
            message: "prompt injection variant not found",
          });
          return;
        }

        if (!scenarioKey || !instructionSourceKey || !defensePolicyKey) {
          res.status(400).json({
            status: "error",
            message:
              "scenarioKey, instructionSourceKey and defensePolicyKey are required",
          });
          return;
        }

        const result = await promptInjectionLabService.evaluateRoute({
          userId: currentUser.user.id,
          variantKey,
          scenarioKey,
          instructionSourceKey,
          defensePolicyKey,
        });
        const responseStatus = result.status === "blocked" ? 403 : 200;
        const riskyPromptRoute =
          result.routing.riskCategory !== "safe-reference" &&
          result.routing.matchedControlledSample;

        await recordLabEventSafely({
          traceId: readOptionalTraceId(req),
          userId: currentUser.user.id,
          labKey: "ai.prompt-injection",
          variantKey,
          phase:
            result.status === "blocked"
              ? "defense"
              : riskyPromptRoute
                ? "attack"
                : "normal",
          eventType: result.status === "blocked" ? "blocked" : "success",
          actorPerspective: riskyPromptRoute ? "attacker" : "user",
          method: req.method,
          path: req.path,
          inputSummary: summarizePromptInjectionInput({
            scenarioKey: result.scenarioKey,
            instructionSourceKey: result.instructionSourceKey,
            defensePolicyKey: result.defensePolicyKey,
            routing: result.routing,
            signal: result.signal,
          }),
          decision: result.decision,
          signal: result.signal,
          statusCode: responseStatus,
          message: result.message,
          riskLevel:
            result.status === "blocked"
              ? "medium"
              : riskyPromptRoute
                ? "high"
                : "low",
        });

        res.status(responseStatus).json({
          status: result.status,
          result,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  app.get("/api/labs", async (_req, res, next) => {
    try {
      const items = await labRegistry.listLabs();

      res.status(200).json({
        items,
        total: items.length,
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/labs/:category/:scene", async (req, res, next) => {
    try {
      const lab = await labRegistry.getLab(req.params.category, req.params.scene);

      if (!lab) {
        res.status(404).json({
          status: "error",
          message: "lab not found",
        });
        return;
      }

      res.status(200).json(lab);
    } catch (error) {
      next(error);
    }
  });

  return app;
}
