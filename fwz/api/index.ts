import { FWZ_URL, API_ENDPOINTS, ApiResponse, LoginRequest, LoginResponseData, MerchantOrderRequest, MerchantOrderResponseData, TerminalDetailRequest, TerminalDetailResponseData, VerificationOrderRequest, VerificationInfoRequest, VerificationInfoResponseData, VerificationRequest, GetVerificationOrderRequest, GetVerificationOrderResponseData } from '../constants/api';
import { Alert, NativeModules } from 'react-native';

// 自定义类型定义
type HeadersInit_ = Headers | Record<string, string>;

/**
 * 基础HTTP请求函数
 */
async function fetchApi<T = any>(
  endpoint: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any,
  headers: HeadersInit_ = {}
): Promise<ApiResponse<T>> {
  const url = `${FWZ_URL}${endpoint}`;
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    return result as ApiResponse<T>;
  } catch (error) {
    console.error('API请求错误:', error);
    throw error;
  }
}

/**
 * 构建GET请求URL（带查询参数）
 */
function buildUrl(endpoint: string, params: Record<string, any>): string {
  const url = new URL(`${FWZ_URL}${endpoint}`);
  
  // 过滤掉undefined值
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        // 处理数组参数
        value.forEach(item => url.searchParams.append(key, String(item)));
      } else {
        url.searchParams.append(key, String(value));
      }
    }
  });
  
  return url.toString();
}

/**
 * 登录API
 */
export async function login(username: string, password: string, equipmentCoding?: string): Promise<ApiResponse<LoginResponseData>> {
  const loginData: LoginRequest = {
    principal: username,
    credentials: password,
    sysType: 8,
    equipmentCoding: equipmentCoding || '' // 添加设备唯一编码
  };

  console.log('登录参数 loginData',JSON.stringify(loginData));  
  
  return fetchApi<LoginResponseData>(API_ENDPOINTS.LOGIN, 'POST', loginData);
}

/**
 * 获取商户订单列表
 */
export async function getMerchantOrders(params: MerchantOrderRequest, token?: string): Promise<ApiResponse<MerchantOrderResponseData>> {
  const headers: HeadersInit_ = {};
  
  // 如果有token，添加到请求头
  if (token) {
    headers['Authorization'] = `${token}`;
  }
  
  // 构建带查询参数的URL
  const url = buildUrl(API_ENDPOINTS.MERCHANT_ORDER, params);
  
  // 使用URL中的查询参数进行GET请求
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers
    });
    
    const result = await response.json();
    return result as ApiResponse<MerchantOrderResponseData>;
  } catch (error) {
    console.error('获取订单列表失败:', error);
    throw error;
  }
}

/**
 * 获取终端设备详情
 */
export async function getTerminalDetail(userId: string, token?: string): Promise<ApiResponse<TerminalDetailResponseData>> {
  const headers: HeadersInit_ = {};
  
  // 如果有token，添加到请求头
  if (token) {
    headers['Authorization'] = `${token}`;
  }
  
  const params: TerminalDetailRequest = {
    userId
  };
  
  // 构建带查询参数的URL
  const url = buildUrl(API_ENDPOINTS.TERMINAL_DETAIL, params);
  
  // 使用URL中的查询参数进行GET请求
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers
    });
    
    const result = await response.json();
    return result as ApiResponse<TerminalDetailResponseData>;
  } catch (error) {
    console.error('获取终端设备详情失败:', error);
    throw error;
  }
}

/**
 * 获取订单核销信息
 */
export async function pageVerificationOrder(params: VerificationOrderRequest, token?: string): Promise<ApiResponse<MerchantOrderResponseData>> {
  const headers: HeadersInit_ = {};
  
  // 如果有token，添加到请求头
  if (token) {
    headers['Authorization'] = `${token}`;
  }
  
  // 构建带查询参数的URL
  const url = buildUrl(API_ENDPOINTS.VERIFICATION_ORDER, params);
  
  // 使用URL中的查询参数进行GET请求
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers
    });
    
    const result = await response.json();
    return result as ApiResponse<MerchantOrderResponseData>;
  } catch (error) {
    console.error('获取订单核销信息失败:', error);
    throw error;
  }
}

/**
 * 获取订单核销详情信息
 */
export async function getVerificationInfo(orderId: number | string, token?: string): Promise<ApiResponse<VerificationInfoResponseData>> {
  const headers: HeadersInit_ = {};
  
  // 如果有token，添加到请求头
  if (token) {
    headers['Authorization'] = `${token}`;
  }
  
  const params: VerificationInfoRequest = {
    orderId
  };
  
  // 构建带查询参数的URL
  const url = buildUrl(API_ENDPOINTS.VERIFICATION_INFO, params);
  
  // 使用URL中的查询参数进行GET请求
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers
    });
    
    const result = await response.json();
    return result as ApiResponse<VerificationInfoResponseData>;
  } catch (error) {
    console.error('获取订单核销详情信息失败:', error);
    throw error;
  }
}

/**
 * 提交核销订单
 */
export async function submitVerification(data: VerificationRequest, token?: string): Promise<ApiResponse<string>> {
  const headers: HeadersInit_ = {};
  
  // 如果有token，添加到请求头
  if (token) {
    headers['Authorization'] = `${token}`;
  }
  
  return fetchApi<string>(API_ENDPOINTS.VERIFICATION, 'POST', data, headers);
}

/**
 * 获取订单核销详情
 */
export async function getVerificationOrder(orderId: number | string, token?: string): Promise<ApiResponse<GetVerificationOrderResponseData>> {
  const headers: HeadersInit_ = {};
  
  // 如果有token，添加到请求头
  if (token) {
    headers['Authorization'] = `${token}`;
  }
  
  const params: GetVerificationOrderRequest = {
    orderId
  };
  
  // 构建带查询参数的URL
  const url = buildUrl(API_ENDPOINTS.GET_VERIFICATION_ORDER, params);
  
  // 使用URL中的查询参数进行GET请求
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers
    });
    
    const result = await response.json();
    return result as ApiResponse<GetVerificationOrderResponseData>;
  } catch (error) {
    console.error('获取订单详情失败:', error);
    throw error;
  }
}

export default {
  login,
  getMerchantOrders,
  getTerminalDetail,
  pageVerificationOrder,
  getVerificationInfo,
  submitVerification,
  getVerificationOrder,
}; 