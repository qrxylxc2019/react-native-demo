import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  ActivityIndicator,
  BackHandler,
  Alert,
  NativeModules,
  ScrollView,
  DeviceEventEmitter,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../navigation/types';
import TopHeader from '../components/TopHeader';
import IdCardReader, { IdCardInfo, IdCardReaderEvent } from '../api/IdCardReader';

type WaitingCardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'waiting-card'>;

type RouteParams = {
  type: number; // 1: 社保卡, 2: 身份证
};

export default function WaitingCardScreen() {
  const navigation = useNavigation<WaitingCardScreenNavigationProp>();
  const route = useRoute();
  const { type } = route.params as RouteParams;

  const [loading, setLoading] = useState(false);
  const [cardInfo, setCardInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [idCardInfo, setIdCardInfo] = useState<IdCardInfo | null>(null);
  const [nfcStatus, setNfcStatus] = useState({ available: false, enabled: false });
  const [status, setStatus] = useState<string>('准备就绪');

  // 调试：监听loading状态变化
  useEffect(() => {
    console.log('Loading状态变化:', loading);
  }, [loading]);

  // 身份证读取相关初始化
  useEffect(() => {
    // 设置读卡类型
    const setCardType = async () => {
      try {
        await NativeModules.XToastModule.setCardType(type);
        console.log('已设置读卡类型:', type);
      } catch (error) {
        console.error('设置读卡类型失败:', error);
      }
    };
    
    setCardType();
    
    if (type === 2) { // 只有身份证读取时才初始化
      // 添加事件监听
      const listener = IdCardReader.addListener(handleIdCardEvent);
      
      // 自动开始身份证读取
      const initIdCardReading = async () => {
        try {
          // 先检查NFC状态，等待检查完成
          const nfcStatusResult = await checkNfcStatus();
          
          await new Promise(resolve => setTimeout(resolve, 1000)); 
          console.log('nfcStatus.available===', nfcStatusResult)
          await startIdCardReading(nfcStatusResult);
        } catch (error) {
          console.error('自动启动身份证读取失败:', error);
        }
      };
      
      initIdCardReading();
      
      return () => {
        IdCardReader.removeListener(listener);
        if (isReading) {
          IdCardReader.stopReading();
        }
      };
    } else if (type === 1) { // 社保卡读取时自动启动
      // 自动开始社保卡读取
      const initSocialCardReading = async () => {
        try {
          const nfcStatusResult = await checkNfcStatus();
          await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒确保初始化完成
          // await handleReadCard();
        } catch (error) {
          console.error('自动启动社保卡读取失败:', error);
        }
      };
      
      initSocialCardReading();
    }
  }, [type]);

  const checkNfcStatus = async () => {
    try {
      const status = await IdCardReader.checkNfcStatus();
      console.log('nfc状态',status)
      setNfcStatus(status);
      return status; // 返回状态值
    } catch (error) {
      console.error('检查NFC状态失败:', error);
      return { available: false, enabled: false }; // 返回默认值
    }
  };

  const handleIdCardEvent = (event: IdCardReaderEvent) => {
    console.log('身份证读取事件:', event);
    
    switch (event.status) {
      case 'idcard_start':
        setStatus('正在读取身份证...');
        setIdCardInfo(null);
        setLoading(true);
        setIsReading(true);
        break;
        
      case 'idcard_success':
        setStatus('读取成功');
        setIsReading(false);
        setLoading(false);
        
        // 构建身份证信息对象
        const cardInfo: IdCardInfo = {
          name: event.name || '',
          gender: event.gender || '',
          nation: event.nation || '',
          birthday: event.birthday || '',
          address: event.address || '',
          idNum: event.idNum || '',
          issueOrg: event.issueOrg || '',
          effectDate: event.effectDate || '',
          expireDate: event.expireDate || '',
          photo: event.photo,
          idType: event.idType,
          nationality: event.nationality,
          englishName: event.englishName,
          signCount: event.signCount,
          passNum: event.passNum,
          dn: event.dn,
        };
        
        setIdCardInfo(cardInfo);
        
        // 跳转到验证列表页面
        if (cardInfo.idNum) {
          handleNavigateToVerificationList(cardInfo.idNum);
        }
        break;
        
      case 'idcard_error':
        setStatus(`读取状态: ${event.errorInfo}`);
        setIsReading(false);
        setLoading(false);
        setError(event.errorInfo || '读取失败');
        break;
    }
  };

  const startIdCardReading = async (nfcStatusParam?: { available: boolean, enabled: boolean }) => {
    // 使用传入的参数或者当前状态
    const currentNfcStatus = nfcStatusParam || nfcStatus;
    
    if (!currentNfcStatus.available) {
      setStatus('设备不支持NFC功能');
      Alert.alert('提示', '设备不支持NFC功能');
      return;
    }
    
    if (!currentNfcStatus.enabled) {
      setStatus('请先在系统设置中启用NFC功能');
      Alert.alert('提示', '请先在系统设置中启用NFC功能');
      return;
    }

    try {
      setIsReading(true);
      setLoading(true);
      setStatus('启动身份证读取模式...');
      setError(null);
      setIdCardInfo(null);
      await IdCardReader.startReading();
      setStatus('请将身份证贴近设备');
    } catch (error) {
      setIsReading(false);
      setLoading(false);
      setStatus(`启动失败: ${error}`);
      setError(`启动失败: ${error}`);
    }
  };

  const stopIdCardReading = async () => {
    try {
      await IdCardReader.stopReading();
      setIsReading(false);
      setLoading(false);
      setStatus('已停止读取');
    } catch (error) {
      setStatus(`停止读取失败: ${error}`);
    }
  };

  // 返回按钮处理
  useEffect(() => {
    const backAction = () => {
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [navigation]);

  // 监听来自原生层的读卡错误信息（仅社保卡使用）
  useEffect(() => {
    if (type === 1) { // 只有社保卡读取时才监听
      const subscription = DeviceEventEmitter.addListener(
        'onReadCardError',
        (errorData) => {
          console.log('收到信息:', errorData);
          console.log('状态:', errorData.status);
          console.log('时间戳:', new Date(errorData.timestamp).toLocaleString());

          if (errorData.status === 'start') {
            // 确保状态更新的时序正确
            setError(null);
            setCardInfo(null);
            setLoading(true);

            console.log('设置loading为true');
          } else if (errorData.status === 'result') {
            console.log('错误信息 (getErr):', errorData.errorInfo);
            console.log('结果信息 (getOut):', errorData.resultInfo);
            console.log('结果代码:', errorData.resultCode);

            setLoading(false);

            // 显示弹窗提醒
            if (errorData.resultCode != 0) {
              Alert.alert(
                '读卡信息',
                `${errorData.errorInfo}`,
                [{ text: '确定' }]
              );
            } else {
              // 读卡成功，解析身份证号
              const resultInfo = errorData.resultInfo;
              if (resultInfo && typeof resultInfo === 'string') {
                // 使用 | 分割字符串，身份证号是第二个字段
                const parts = resultInfo.split('|');
                if (parts.length >= 2) {
                  const idNo = parts[1]; // 身份证号
                  console.log('提取到身份证号:', idNo);

                  // 跳转到验证列表页面
                  handleNavigateToVerificationList(idNo);
                } else {
                  Alert.alert(
                    '读卡信息',
                    `${errorData.resultInfo}`,
                    [{ text: '确定' }]
                  );
                }
              } else {
                Alert.alert(
                  '读卡信息',
                  `${errorData.resultInfo}`,
                  [{ text: '确定' }]
                );
              }
            }
          }
        }
      );

      // 组件卸载时取消监听
      return () => {
        subscription.remove();
      };
    }
  }, [type]);

  // 跳转到验证列表页面并查询订单
  const handleNavigateToVerificationList = async (idNo: string) => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');

      if (!accessToken) {
        Alert.alert('提示', '请先登录', [
          { text: '确定', onPress: () => navigation.navigate('Login') }
        ]);
        return;
      }

      // 跳转到验证列表页面，传递身份证号和token
      navigation.navigate('verification-list', {
        idNo: idNo,
        token: accessToken,
        type: 1, // 1表示通过身份证号查询
        channel: 'card' // 标识为刷卡核销
      });
    } catch (error) {
      console.error('获取accessToken失败:', error);
      Alert.alert('错误', '获取登录信息失败，请重新登录');
    }
  };

  // 读取社保卡
  const handleReadCard = async () => {
    try {
      setLoading(true);
      setError(null);
      setCardInfo(null);

      const iType = 2; // 非接触式操作卡
      const sceneCode = "000001"; // 场景编码

      // 调用原生模块读取卡信息
      const result = await NativeModules.XToastModule.readCardInfo(iType, sceneCode);
      console.log('读卡结果:', JSON.stringify(result));

      setLoading(false);

      if (result.resultCode === 0) {
        // 读卡成功
        setCardInfo(result);
        Alert.alert('读卡成功', '已获取卡片信息');
      } else {
        // 读卡失败
        setError(result.errorMsg || '未知错误');
        Alert.alert('读卡失败', result.errorMsg || '未知错误');
      }
    } catch (error: any) {
      setLoading(false);
      setError(error.message || '读卡过程发生错误');
      Alert.alert('读卡错误', error.message || '读卡过程发生错误');
      console.error('读卡错误:', error);
    }
  };

  const formatBirthday = (birthday: string) => {
    if (birthday.length === 8) {
      return `${birthday.substring(0, 4)}-${birthday.substring(4, 6)}-${birthday.substring(6, 8)}`;
    }
    return birthday;
  };

  const renderIdCardInfo = () => {
    if (!idCardInfo) return null;

    return (
      <View style={styles.idCardInfoContainer}>
        <Text style={styles.idCardInfoTitle}>身份证信息</Text>
        
        {idCardInfo.photo && (
          <View style={styles.photoContainer}>
            <Image
              source={{ uri: `data:image/jpeg;base64,${idCardInfo.photo}` }}
              style={styles.photo}
              resizeMode="contain"
            />
          </View>
        )}
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>姓名:</Text>
          <Text style={styles.value}>{idCardInfo.name}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>性别:</Text>
          <Text style={styles.value}>{idCardInfo.gender}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>民族:</Text>
          <Text style={styles.value}>{idCardInfo.nation}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>出生日期:</Text>
          <Text style={styles.value}>{formatBirthday(idCardInfo.birthday)}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>住址:</Text>
          <Text style={styles.value}>{idCardInfo.address}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>身份证号:</Text>
          <Text style={styles.value}>{idCardInfo.idNum}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>签发机关:</Text>
          <Text style={styles.value}>{idCardInfo.issueOrg}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>有效期限:</Text>
          <Text style={styles.value}>{idCardInfo.effectDate} - {idCardInfo.expireDate}</Text>
        </View>
        
        {/* 特殊身份证类型的额外信息 */}
        {idCardInfo.idType === 'I' && (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.label}>国籍:</Text>
              <Text style={styles.value}>{idCardInfo.nationality}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>英文姓名:</Text>
              <Text style={styles.value}>{idCardInfo.englishName}</Text>
            </View>
          </>
        )}
        
        {idCardInfo.idType === 'J' && (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.label}>签发次数:</Text>
              <Text style={styles.value}>{idCardInfo.signCount}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>通行证号:</Text>
              <Text style={styles.value}>{idCardInfo.passNum}</Text>
            </View>
          </>
        )}
        
        {idCardInfo.dn && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>DN:</Text>
            <Text style={styles.value}>{idCardInfo.dn}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <TopHeader title={type === 1 ? '社保卡读取' : '身份证读取'} onBack={() => navigation.goBack()} />

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.cardContainer}>
            <Text style={styles.description}>
              {type === 1
                ? '请将社保卡放在读卡区域'
                : '请将身份证放在读卡区域'}
            </Text>

            <Image
              source={require('../assets/images/card.png')}
              style={styles.cardImage}
            />

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FEE726" />
                <Text style={styles.loadingText}>
                  {type === 1 ? '正在读取社保卡...' : '正在读取身份证...'}
                </Text>
              </View>
            ) : (
              <View style={styles.tipContainer}>
                <Text style={styles.tipText}>请将卡片放在读卡器上</Text>
                
                <View style={styles.statusContainer}>
                  <Text style={styles.statusLabel}>NFC状态:</Text>
                  <Text style={[styles.statusValue, { color: nfcStatus.available && nfcStatus.enabled ? 'green' : 'red' }]}>
                    {nfcStatus.available ? (nfcStatus.enabled ? '可用' : '不支持') : '不支持'}
                  </Text>
                </View>
              
                <View style={styles.statusContainer}>
                  <Text style={styles.statusLabel}>读取状态:</Text>
                  <Text style={styles.statusValue}>{status}</Text>
                </View>
              </View>
            )}

            {/* 单独显示结果信息，不受loading状态影响 */}
            {cardInfo && !loading && type === 1 && (
              <View style={styles.resultContainer}>
                <Text style={styles.resultTitle}>读卡结果:</Text>
                {cardInfo.areaCode && (
                  <Text style={styles.resultText}>发卡地区: {cardInfo.areaCode}</Text>
                )}
                {cardInfo.socialSecurityNumber && (
                  <Text style={styles.resultText}>社会保障号码: {cardInfo.socialSecurityNumber}</Text>
                )}
                {cardInfo.cardNumber && (
                  <Text style={styles.resultText}>卡号: {cardInfo.cardNumber}</Text>
                )}
                {cardInfo.identityNumber && (
                  <Text style={styles.resultText}>身份证号: {cardInfo.identityNumber}</Text>
                )}
                {cardInfo.name && (
                  <Text style={styles.resultText}>姓名: {cardInfo.name}</Text>
                )}
                <Text style={styles.resultText}>原始数据: {cardInfo.data}</Text>
              </View>
            )}

            {/* 显示身份证信息 */}
            {type === 2 && renderIdCardInfo()}
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  cardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  cardImage: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 10,
    color: '#333',
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  tipContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  readButton: {
    backgroundColor: '#FEE726',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 10,
  },
  readButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cancelButton: {
    marginTop: 20,
    backgroundColor: '#F0F0F0',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  errorContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#FFEBEE',
    borderRadius: 5,
    width: '100%',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
  },
  resultContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#E8F5E9',
    borderRadius: 5,
    width: '100%',
    alignItems: 'flex-start',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  resultText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    width: '100%',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 10,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    minWidth: 80,
  },
  statusValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  idCardInfoContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
    width: '100%',
  },
  idCardInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  photo: {
    width: 100,
    height: 130,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    minWidth: 80,
  },
  value: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
}); 