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

  // 调试：监听loading状态变化
  useEffect(() => {
    console.log('Loading状态变化:', loading);
  }, [loading]);

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

  // 监听来自原生层的读卡错误信息
  useEffect(() => {
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
  }, []);

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

  // 读取社保卡或身份证
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
              </View>
            )}

            {/* 单独显示错误信息，不受loading状态影响 */}
            {error && !loading && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>错误信息: {error}</Text>
              </View>
            )}

            {/* 单独显示结果信息，不受loading状态影响 */}
            {cardInfo && !loading && (
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
}); 