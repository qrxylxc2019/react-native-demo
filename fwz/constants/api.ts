// API 基础配置
export const FWZ_URL = 'https://yktlycs.e-tecsun.com';

export const PIC_URL = 'https://yktlyimcs.e-tecsun.com/mall4cloud';

// API 接口路径
export const API_ENDPOINTS = {
  LOGIN: '/mall4cloud_auth/ua/login',
  MERCHANT_ORDER: '/mall4cloud_order/m/merchantOrder/pageMerchantOrder',
  TERMINAL_DETAIL: '/mall4cloud_multishop/terminal/getTerminalDetail',
  VERIFICATION_ORDER: '/mall4cloud_order/m/merchantOrder/pageVerificationOrder',
  VERIFICATION_INFO: '/mall4cloud_order/m/merchantOrder/verificationInfo',
  VERIFICATION: '/mall4cloud_order/m/merchantOrder/verification',
  GET_VERIFICATION_ORDER: '/mall4cloud_order/m/merchantOrder/getVerificationOrder',
};

// 接口响应类型
export interface ApiResponse<T = any> {
  code: string;
  data: T;
  msg: string;
  success: boolean;
}

// 登录请求参数类型
export interface LoginRequest {
  credentials: string; // 密码
  principal: string;   // 用户名
  sysType: number;     // 系统类型
  equipmentCoding?: string; // 设备唯一编码
}

// 登录响应数据类型
export interface LoginResponseData {
  accessToken: string;
  expiresIn: number;
  merchantAccount: string;
  merchantId: number;
  merchantName: string;
  refreshToken: string;
  tenantId: number;
  userId: number;
}

// 终端设备详情请求参数类型
export interface TerminalDetailRequest {
  userId: string;
}

// 终端设备详情响应数据类型
export interface TerminalDetailResponseData {
  accountName: string;     // 账号名称
  equipmentCoding: string; // 设备编码
  isMain: string;          // 主账号 YES NO
  merchantId: number;      // 商家Id
  merchantName: string;    // 商家名称
  addr: string;            // 店铺地址
  pic: string;             // 店铺图片
}

// 订单查询请求参数类型
export interface MerchantOrderRequest {
  pageNum: number;
  pageSize: number;
  columns?: string[];
  keyWord?: string;
  memberAccount?: string;
  merchantId?: number;
  orderBy?: string;
  orderId?: number;
  orders?: string[];
  status?: string;
  tenantId?: number;
  userId?: number;
}

// 订单核销请求参数类型
export interface VerificationOrderRequest {
  merchantId: number;     // 店铺id
  pageNum: number;        // 当前页
  pageSize: number;       // 每页大小
  type: number;           // 入口类型(1:扫电子社保卡二维码 2:扫订单核销二维码 3:刷身份证或社保卡)
  idCard?: string;        // 身份证号码（type 1、3 传）
  orderId?: string;       // 订单号（type 2 传）
}

// 游客信息类型
export interface Tourist {
  name: string;         // 游客姓名
  number: string;       // 游客证件号
  touristId: number;    // 游客ID
}

// 核销信息请求参数类型
export interface VerificationInfoRequest {
  orderId: number | string;
}

// 核销信息响应数据类型
export interface VerificationInfoResponseData {
  orderId: number;           // 订单号
  orderType: number;         // 商品类型 1 小程序商城订单 2 景区门票订单 3 跟团游线路订单
  orderTypeStr: string;      // 商品类型 1 小程序商城订单 2 景区门票订单 3 跟团游线路订单
  remainingCount: number;    // 未核销数量
  remainingList: Tourist[];  // 未核销列表
  spuCount: number;          // 商品/游客总数
  spuName: string;           // 商品名称
  usedCount: number;         // 已核销数量
  usedList: Tourist[];       // 已核销列表
}

// 核销请求参数类型
export interface VerificationRequest {
  orderId: number | string;         // 订单号
  touristIds?: number[];            // 游客ID列表，orderType=3时需要
  verificationNum?: number;         // 核销数量，orderType=2时需要
}

// 订单数据类型
export interface OrderItem {
  createTime: string;      // 订单时间
  memberAccount: string;   // 用户账号
  merchantId: number;      // 店铺id
  orderId: number;         // 订单号
  orderType: string;       // 1 小程序商城订单 2 景区门票订单 3 跟团游线路订单
  orderTypeStr: string;    // 1 小程序商城订单 2 景区门票订单 3 跟团游线路订单
  payTime: string;         // 支付时间
  payType: string;         // (德生)支付渠道 1：微信支付 2：支付宝支付 3:数字人民币 4:积分支付
  payTypeStr: string;      // (德生)支付渠道 1：微信支付 2：支付宝支付 3:数字人民币 4:积分支付
  refundAmount: number;    // 退款金额
  selectDate: string;      // 出游日期
  spuCount: string;        // 门票总数
  spuName: string;         // 商品名称
  status: number;          // 订单状态
  statusStr: string;       // 订单状态
  total: number;           // 订单金额
  verificationType: string; // 1 小程序核销 2 pose机核销
  verificationTypeStr: string; // 1 小程序核销 2 pose机核销
}

// 订单查询响应数据类型
export interface MerchantOrderResponseData {
  list: OrderItem[];
  pages: number;
  total: number;
}

// 获取单个订单核销详情请求参数类型
export interface GetVerificationOrderRequest {
  orderId: number | string;
}

// 获取单个订单核销详情响应数据类型
export interface GetVerificationOrderResponseData {
  createTime: string;      // 订单时间
  memberAccount: string;   // 用户账号
  merchantId: number;      // 店铺id
  orderId: number;         // 订单号
  orderType: string;       // 1 小程序商城订单 2 景区门票订单 3 跟团游线路订单
  orderTypeStr: string;    // 1 小程序商城订单 2 景区门票订单 3 跟团游线路订单
  payTime: string;         // 支付时间
  payType: string;         // (德生)支付渠道 1：微信支付 2：支付宝支付 3:数字人民币 4:积分支付
  payTypeStr: string;      // (德生)支付渠道 1：微信支付 2：支付宝支付 3:数字人民币 4:积分支付
  refundAmount: number;    // 退款金额
  selectDate: string;      // 出游日期
  spuCount: string;        // 门票总数
  spuName: string;         // 商品名称
  status: number;          // 订单状态
  statusStr: string;       // 订单状态
  total: number;           // 订单金额
  verificationType: string; // 1 小程序核销 2 pose机核销
  verificationTypeStr: string; // 1 小程序核销 2 pose机核销
} 