export type IdorVariantKey = "vuln" | "fixed";

export type IdorSignal =
  | "idor-own-order-accepted"
  | "idor-cross-user-order-exposed"
  | "idor-cross-user-order-blocked"
  | "idor-order-not-found";

export type IdorStatus = "ok" | "blocked" | "not-found";

export type IdorInput = {
  userId: string;
  variantKey: IdorVariantKey;
  orderId: string;
};

export type IdorOrder = {
  id: string;
  ownerUserId: string;
  ownerLabel: string;
  productName: string;
  amount: number;
  status: "paid" | "shipping" | "pending";
  contactMasked: string;
  internalNote: string;
};

export type IdorInspection = {
  orderIdLength: number;
  objectType: "order";
  objectFound: boolean;
  currentUserId: string;
  ownerUserId: string;
  ownerMatches: boolean;
  crossUserRequested: boolean;
};

export type IdorResult = {
  status: IdorStatus;
  variantKey: IdorVariantKey;
  orderId: string;
  order: IdorOrder | null;
  inspection: IdorInspection;
  signal: IdorSignal;
  decision: "accepted" | "blocked" | "failed";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type IdorLabSamples = {
  ownOrderId: string;
  otherUserOrderId: string;
};

export type IdorLabService = {
  readOrder(input: IdorInput): Promise<IdorResult>;
  getSamples(): IdorLabSamples;
};

const idorOrders: IdorOrder[] = [
  {
    id: "order-1001",
    ownerUserId: "1",
    ownerLabel: "演示用户",
    productName: "Secure Key Pro",
    amount: 299,
    status: "paid",
    contactMasked: "lin***01",
    internalNote: "当前登录用户自己的受控教学订单",
  },
  {
    id: "order-2001",
    ownerUserId: "2",
    ownerLabel: "测试账户",
    productName: "Cloud Backup Locker",
    amount: 159,
    status: "shipping",
    contactMasked: "test***02",
    internalNote: "用于 IDOR 越权读取观察的他人受控教学订单",
  },
];

const idorLabSamples: IdorLabSamples = {
  ownOrderId: "order-1001",
  otherUserOrderId: "order-2001",
};

function findOrder(orderId: string) {
  return idorOrders.find((order) => order.id === orderId) ?? null;
}

function createInspection(input: {
  userId: string;
  orderId: string;
  order: IdorOrder | null;
}): IdorInspection {
  const ownerUserId = input.order?.ownerUserId ?? "";
  const ownerMatches = Boolean(input.order && ownerUserId === input.userId);

  return {
    orderIdLength: input.orderId.length,
    objectType: "order",
    objectFound: Boolean(input.order),
    currentUserId: input.userId,
    ownerUserId,
    ownerMatches,
    crossUserRequested: Boolean(input.order && !ownerMatches),
  };
}

export function createIdorLabService(): IdorLabService {
  return {
    getSamples() {
      return idorLabSamples;
    },

    async readOrder(input) {
      const orderId = input.orderId.trim();
      const order = findOrder(orderId);
      const inspection = createInspection({
        userId: input.userId,
        orderId,
        order,
      });

      if (!order) {
        return {
          status: "not-found",
          variantKey: input.variantKey,
          orderId,
          order: null,
          inspection,
          signal: "idor-order-not-found",
          decision: "failed",
          message: "未找到对应的受控教学订单。",
          nextStep: "使用自己的订单样例或他人订单样例，观察对象级授权差异。",
          blockedReason: "order-not-found",
        };
      }

      if (inspection.ownerMatches) {
        return {
          status: "ok",
          variantKey: input.variantKey,
          orderId,
          order,
          inspection,
          signal: "idor-own-order-accepted",
          decision: "accepted",
          message: "当前用户读取自己的订单，正常业务请求被接受。",
          nextStep: "把 orderId 替换为他人订单样例，观察漏洞版和修复版差异。",
        };
      }

      if (input.variantKey === "fixed") {
        return {
          status: "blocked",
          variantKey: input.variantKey,
          orderId,
          order: null,
          inspection,
          signal: "idor-cross-user-order-blocked",
          decision: "blocked",
          message: "修复版校验订单归属，已阻断跨用户对象读取。",
          nextStep: "切回漏洞版提交同样 orderId，观察缺少对象级授权会暴露什么。",
          blockedReason: "owner-mismatch",
        };
      }

      return {
        status: "ok",
        variantKey: input.variantKey,
        orderId,
        order,
        inspection,
        signal: "idor-cross-user-order-exposed",
        decision: "accepted",
        message: "漏洞版只按 orderId 读取对象，跨用户订单详情被返回。",
        nextStep: "切到修复版提交同样 orderId，观察对象归属校验如何阻断。",
      };
    },
  };
}
