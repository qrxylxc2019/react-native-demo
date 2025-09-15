export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  'scan-verification': { orderId: string } | undefined;
  'card-verification': { orderId: string } | undefined;
  'order-query': undefined;
  'verification-result': { orderId: string, response?: any } | undefined;
  'verification-list': { orders?: any[], token: string | null, orderId?: string, idNo?: string, type?: number, channel?: string } | undefined;
  'order-detail': { orderId: string, merchantId: number, accessToken: string };
  'waiting-card': { type: number }; // 1: 社保卡, 2: 身份证
  'idcard-demo': undefined; // 身份证读取演示页面
}; 