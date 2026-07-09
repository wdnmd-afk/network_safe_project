import type { RouteRecordRaw } from "vue-router";

export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: () => import("../views/HomeView.vue"),
  },
  {
    path: "/products",
    name: "products",
    component: () => import("../views/ProductsView.vue"),
  },
  {
    path: "/login",
    name: "login",
    component: () => import("../views/LoginView.vue"),
  },
  {
    path: "/account",
    name: "account",
    component: () => import("../views/AccountView.vue"),
  },
  {
    path: "/orders",
    name: "orders",
    component: () => import("../views/OrdersView.vue"),
  },
  {
    path: "/support",
    name: "support",
    component: () => import("../views/SupportView.vue"),
  },
  {
    path: "/labs",
    name: "labs",
    component: () => import("../views/LabsView.vue"),
  },
  {
    path: "/labs/:category/:scene",
    name: "lab-detail",
    component: () => import("../views/LabDetailView.vue"),
    props: true,
  },
  {
    path: "/labs/web/xss/vuln",
    name: "lab-web-xss-vuln",
    component: () => import("../views/XssLabView.vue"),
    props: {
      variant: "vuln",
    },
  },
  {
    path: "/labs/web/xss/fixed",
    name: "lab-web-xss-fixed",
    component: () => import("../views/XssLabView.vue"),
    props: {
      variant: "fixed",
    },
  },
  {
    path: "/labs/web/csrf/vuln",
    name: "lab-web-csrf-vuln",
    component: () => import("../views/CsrfLabView.vue"),
    props: {
      variant: "vuln",
    },
  },
  {
    path: "/labs/web/csrf/fixed",
    name: "lab-web-csrf-fixed",
    component: () => import("../views/CsrfLabView.vue"),
    props: {
      variant: "fixed",
    },
  },
  {
    path: "/labs/web/sql-injection/vuln",
    name: "lab-web-sql-injection-vuln",
    component: () => import("../views/SqlInjectionLabView.vue"),
    props: {
      variant: "vuln",
    },
  },
  {
    path: "/labs/web/sql-injection/fixed",
    name: "lab-web-sql-injection-fixed",
    component: () => import("../views/SqlInjectionLabView.vue"),
    props: {
      variant: "fixed",
    },
  },
  {
    path: "/labs/web/nosql-injection/vuln",
    name: "lab-web-nosql-injection-vuln",
    component: () => import("../views/NosqlInjectionLabView.vue"),
    props: {
      variant: "vuln",
    },
  },
  {
    path: "/labs/web/nosql-injection/fixed",
    name: "lab-web-nosql-injection-fixed",
    component: () => import("../views/NosqlInjectionLabView.vue"),
    props: {
      variant: "fixed",
    },
  },
  {
    path: "/labs/web/crlf-injection/vuln",
    name: "lab-web-crlf-injection-vuln",
    component: () => import("../views/CrlfInjectionLabView.vue"),
    props: {
      variant: "vuln",
    },
  },
  {
    path: "/labs/web/crlf-injection/fixed",
    name: "lab-web-crlf-injection-fixed",
    component: () => import("../views/CrlfInjectionLabView.vue"),
    props: {
      variant: "fixed",
    },
  },
  {
    path: "/labs/web/xpath-injection/vuln",
    name: "lab-web-xpath-injection-vuln",
    component: () => import("../views/XpathInjectionLabView.vue"),
    props: {
      variant: "vuln",
    },
  },
  {
    path: "/labs/web/xpath-injection/fixed",
    name: "lab-web-xpath-injection-fixed",
    component: () => import("../views/XpathInjectionLabView.vue"),
    props: {
      variant: "fixed",
    },
  },
  {
    path: "/labs/web/ldap-injection/vuln",
    name: "lab-web-ldap-injection-vuln",
    component: () => import("../views/LdapInjectionLabView.vue"),
    props: {
      variant: "vuln",
    },
  },
  {
    path: "/labs/web/ldap-injection/fixed",
    name: "lab-web-ldap-injection-fixed",
    component: () => import("../views/LdapInjectionLabView.vue"),
    props: {
      variant: "fixed",
    },
  },
  {
    path: "/labs/web/command-injection/vuln",
    name: "lab-web-command-injection-vuln",
    component: () => import("../views/CommandInjectionLabView.vue"),
    props: {
      variant: "vuln",
    },
  },
  {
    path: "/labs/web/command-injection/fixed",
    name: "lab-web-command-injection-fixed",
    component: () => import("../views/CommandInjectionLabView.vue"),
    props: {
      variant: "fixed",
    },
  },
  {
    path: "/labs/web/ssti/vuln",
    name: "lab-web-ssti-vuln",
    component: () => import("../views/SstiLabView.vue"),
    props: {
      variant: "vuln",
    },
  },
  {
    path: "/labs/web/ssti/fixed",
    name: "lab-web-ssti-fixed",
    component: () => import("../views/SstiLabView.vue"),
    props: {
      variant: "fixed",
    },
  },
  {
    path: "/labs/web/xxe/vuln",
    name: "lab-web-xxe-vuln",
    component: () => import("../views/XxeLabView.vue"),
    props: {
      variant: "vuln",
    },
  },
  {
    path: "/labs/web/xxe/fixed",
    name: "lab-web-xxe-fixed",
    component: () => import("../views/XxeLabView.vue"),
    props: {
      variant: "fixed",
    },
  },
  {
    path: "/labs/web/file-upload/vuln",
    name: "lab-web-file-upload-vuln",
    component: () => import("../views/FileUploadLabView.vue"),
    props: {
      variant: "vuln",
    },
  },
  {
    path: "/labs/web/file-upload/fixed",
    name: "lab-web-file-upload-fixed",
    component: () => import("../views/FileUploadLabView.vue"),
    props: {
      variant: "fixed",
    },
  },
  {
    path: "/labs/web/info-disclosure/vuln",
    name: "lab-web-info-disclosure-vuln",
    component: () => import("../views/InfoDisclosureLabView.vue"),
    props: {
      variant: "vuln",
    },
  },
  {
    path: "/labs/web/info-disclosure/fixed",
    name: "lab-web-info-disclosure-fixed",
    component: () => import("../views/InfoDisclosureLabView.vue"),
    props: {
      variant: "fixed",
    },
  },
  {
    path: "/labs/web/path-traversal/vuln",
    name: "lab-web-path-traversal-vuln",
    component: () => import("../views/PathTraversalLabView.vue"),
    props: {
      variant: "vuln",
    },
  },
  {
    path: "/labs/web/path-traversal/fixed",
    name: "lab-web-path-traversal-fixed",
    component: () => import("../views/PathTraversalLabView.vue"),
    props: {
      variant: "fixed",
    },
  },
  {
    path: "/labs/web/ssrf/vuln",
    name: "lab-web-ssrf-vuln",
    component: () => import("../views/SsrfLabView.vue"),
    props: {
      variant: "vuln",
    },
  },
  {
    path: "/labs/web/ssrf/fixed",
    name: "lab-web-ssrf-fixed",
    component: () => import("../views/SsrfLabView.vue"),
    props: {
      variant: "fixed",
    },
  },
  {
    path: "/labs/auth/jwt/vuln",
    name: "lab-auth-jwt-vuln",
    component: () => import("../views/JwtLabView.vue"),
    props: {
      variant: "vuln",
    },
  },
  {
    path: "/labs/auth/jwt/fixed",
    name: "lab-auth-jwt-fixed",
    component: () => import("../views/JwtLabView.vue"),
    props: {
      variant: "fixed",
    },
  },
  {
    path: "/labs/auth/idor/vuln",
    name: "lab-auth-idor-vuln",
    component: () => import("../views/IdorLabView.vue"),
    props: {
      variant: "vuln",
    },
  },
  {
    path: "/labs/auth/idor/fixed",
    name: "lab-auth-idor-fixed",
    component: () => import("../views/IdorLabView.vue"),
    props: {
      variant: "fixed",
    },
  },
  {
    path: "/labs/auth/privilege-escalation/vuln",
    name: "lab-auth-privilege-escalation-vuln",
    component: () => import("../views/PrivilegeEscalationLabView.vue"),
    props: {
      variant: "vuln",
    },
  },
  {
    path: "/labs/auth/privilege-escalation/fixed",
    name: "lab-auth-privilege-escalation-fixed",
    component: () => import("../views/PrivilegeEscalationLabView.vue"),
    props: {
      variant: "fixed",
    },
  },
  {
    path: "/labs/auth/brute-force/vuln",
    name: "lab-auth-brute-force-vuln",
    component: () => import("../views/BruteForceLabView.vue"),
    props: {
      variant: "vuln",
    },
  },
  {
    path: "/labs/auth/brute-force/fixed",
    name: "lab-auth-brute-force-fixed",
    component: () => import("../views/BruteForceLabView.vue"),
    props: {
      variant: "fixed",
    },
  },
  {
    path: "/labs/auth/session-fixation/vuln",
    name: "lab-auth-session-fixation-vuln",
    component: () => import("../views/SessionFixationLabView.vue"),
    props: {
      variant: "vuln",
    },
  },
  {
    path: "/labs/auth/session-fixation/fixed",
    name: "lab-auth-session-fixation-fixed",
    component: () => import("../views/SessionFixationLabView.vue"),
    props: {
      variant: "fixed",
    },
  },
  {
    path: "/labs/network/port-scan/vuln",
    name: "lab-network-port-scan-vuln",
    component: () => import("../views/PortScanLabView.vue"),
    props: {
      variant: "vuln",
    },
  },
  {
    path: "/labs/network/port-scan/fixed",
    name: "lab-network-port-scan-fixed",
    component: () => import("../views/PortScanLabView.vue"),
    props: {
      variant: "fixed",
    },
  },
  {
    path: "/labs/network/dns-hijack/vuln",
    name: "lab-network-dns-hijack-vuln",
    component: () => import("../views/DnsHijackLabView.vue"),
    props: {
      variant: "vuln",
    },
  },
  {
    path: "/labs/network/dns-hijack/fixed",
    name: "lab-network-dns-hijack-fixed",
    component: () => import("../views/DnsHijackLabView.vue"),
    props: {
      variant: "fixed",
    },
  },
  {
    path: "/labs/ai/prompt-injection/vuln",
    name: "lab-ai-prompt-injection-vuln",
    component: () => import("../views/PromptInjectionLabView.vue"),
    props: {
      variant: "vuln",
    },
  },
  {
    path: "/labs/ai/prompt-injection/fixed",
    name: "lab-ai-prompt-injection-fixed",
    component: () => import("../views/PromptInjectionLabView.vue"),
    props: {
      variant: "fixed",
    },
  },
  {
    path: "/labs/social/phishing/vuln",
    name: "lab-social-phishing-vuln",
    component: () => import("../views/PhishingLabView.vue"),
    props: {
      variant: "vuln",
    },
  },
  {
    path: "/labs/social/phishing/fixed",
    name: "lab-social-phishing-fixed",
    component: () => import("../views/PhishingLabView.vue"),
    props: {
      variant: "fixed",
    },
  },
  {
    path: "/labs/social/spear-phishing/vuln",
    name: "lab-social-spear-phishing-vuln",
    component: () => import("../views/SpearPhishingLabView.vue"),
    props: {
      variant: "vuln",
    },
  },
  {
    path: "/labs/social/spear-phishing/fixed",
    name: "lab-social-spear-phishing-fixed",
    component: () => import("../views/SpearPhishingLabView.vue"),
    props: {
      variant: "fixed",
    },
  },
  {
    path: "/labs/social/whaling/vuln",
    name: "lab-social-whaling-vuln",
    component: () => import("../views/WhalingLabView.vue"),
    props: {
      variant: "vuln",
    },
  },
  {
    path: "/labs/social/whaling/fixed",
    name: "lab-social-whaling-fixed",
    component: () => import("../views/WhalingLabView.vue"),
    props: {
      variant: "fixed",
    },
  },
  {
    path: "/labs/supply-chain/dependency-confusion/vuln",
    name: "lab-supply-chain-dependency-confusion-vuln",
    component: () => import("../views/DependencyConfusionLabView.vue"),
    props: {
      variant: "vuln",
    },
  },
  {
    path: "/labs/supply-chain/dependency-confusion/fixed",
    name: "lab-supply-chain-dependency-confusion-fixed",
    component: () => import("../views/DependencyConfusionLabView.vue"),
    props: {
      variant: "fixed",
    },
  },
  {
    path: "/labs/infrastructure/misconfiguration/vuln",
    name: "lab-infrastructure-misconfiguration-vuln",
    component: () => import("../views/MisconfigurationLabView.vue"),
    props: {
      variant: "vuln",
    },
  },
  {
    path: "/labs/infrastructure/misconfiguration/fixed",
    name: "lab-infrastructure-misconfiguration-fixed",
    component: () => import("../views/MisconfigurationLabView.vue"),
    props: {
      variant: "fixed",
    },
  },
];
