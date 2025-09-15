import { NativeModules, DeviceEventEmitter, NativeEventEmitter } from 'react-native';

const { IdCardReader } = NativeModules;

export interface IdCardInfo {
  name: string;
  gender: string;
  nation: string;
  birthday: string;
  address: string;
  idNum: string;
  issueOrg: string;
  effectDate: string;
  expireDate: string;
  photo?: string;
  idType?: string;
  // 外国人身份证特有字段
  nationality?: string;
  englishName?: string;
  // 港澳台身份证特有字段
  signCount?: string;
  passNum?: string;
  // 普通身份证特有字段
  dn?: string;
}

export interface IdCardReaderEvent {
  status: 'idcard_start' | 'idcard_success' | 'idcard_error';
  type: 'idcard';
  errorInfo?: string;
  errorCode?: number;
  timestamp: number;
  // 身份证信息字段
  name?: string;
  gender?: string;
  nation?: string;
  birthday?: string;
  address?: string;
  idNum?: string;
  issueOrg?: string;
  effectDate?: string;
  expireDate?: string;
  photo?: string;
  idType?: string;
  nationality?: string;
  englishName?: string;
  signCount?: string;
  passNum?: string;
  dn?: string;
}

export interface NfcStatus {
  available: boolean;
  enabled: boolean;
}

class IdCardReaderManager {
  private eventEmitter: NativeEventEmitter;
  
  constructor() {
    this.eventEmitter = new NativeEventEmitter(IdCardReader);
  }
  
  /**
   * 开始身份证读取
   */
  async startReading(): Promise<string> {
    return IdCardReader.startIdCardReading();
  }
  
  /**
   * 停止身份证读取
   */
  async stopReading(): Promise<string> {
    return IdCardReader.stopIdCardReading();
  }
  
  /**
   * 检查NFC是否可用
   */
  async checkNfcStatus(): Promise<NfcStatus> {
    return IdCardReader.checkNfcAvailable();
  }
  
  /**
   * 监听身份证读取事件
   */
  addListener(callback: (event: IdCardReaderEvent) => void) {
    return DeviceEventEmitter.addListener('onReadCardError', callback);
  }
  
  /**
   * 移除监听器
   */
  removeListener(listener: any) {
    if (listener && typeof listener.remove === 'function') {
      listener.remove();
    }
  }
  
  /**
   * 移除所有监听器
   */
  removeAllListeners() {
    DeviceEventEmitter.removeAllListeners('onReadCardError');
  }
}

export default new IdCardReaderManager();