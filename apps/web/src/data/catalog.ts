export type Product = {
  id: string;
  name: string;
  category: "account" | "device" | "service";
  price: number;
  stock: number;
  summary: string;
  badge: string;
};

export type Order = {
  id: string;
  productName: string;
  amount: number;
  status: "待支付" | "已发货" | "已完成";
  owner: string;
};

export const products: Product[] = [
  {
    id: "secure-key",
    name: "Secure Key Pro",
    category: "account",
    price: 299,
    stock: 42,
    summary: "适合账户登录、二次验证和会员中心演示。",
    badge: "热卖",
  },
  {
    id: "cloud-backup",
    name: "Cloud Backup Locker",
    category: "account",
    price: 159,
    stock: 18,
    summary: "用于订单、账单、资料同步等账户功能演示。",
    badge: "会员",
  },
  {
    id: "wifi-camera",
    name: "Home WiFi Camera",
    category: "device",
    price: 429,
    stock: 9,
    summary: "模拟设备详情、售后留言和附件上传。",
    badge: "新品",
  },
  {
    id: "support-plan",
    name: "Priority Support Plan",
    category: "service",
    price: 89,
    stock: 99,
    summary: "用于客服工单、评论反馈和状态流转。",
    badge: "服务",
  },
];

export const orders: Order[] = [
  {
    id: "SM-20260608-1041",
    productName: "Secure Key Pro",
    amount: 299,
    status: "已完成",
    owner: "林安",
  },
  {
    id: "SM-20260608-1057",
    productName: "Cloud Backup Locker",
    amount: 159,
    status: "已发货",
    owner: "林安",
  },
  {
    id: "SM-20260608-1099",
    productName: "Priority Support Plan",
    amount: 89,
    status: "待支付",
    owner: "测试账户",
  },
];
