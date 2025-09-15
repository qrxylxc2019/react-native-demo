import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Image,
  NativeModules,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTerminalDetail, pageVerificationOrder, submitVerification } from '../api';
import { TerminalDetailResponseData, PIC_URL, VerificationRequest } from '../constants/api';
import LinearGradient from 'react-native-linear-gradient';
import { RootStackParamList } from '../navigation/types';

const { width } = Dimensions.get('window');

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [terminalDetail, setTerminalDetail] = useState<TerminalDetailResponseData | null>(null);
  const [loading, setLoading] = useState(true);

  // 检查登录状态
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const accessToken = await AsyncStorage.getItem('accessToken');
        if (!accessToken) {
          // 未登录，跳转到登录页面
          navigation.replace('Login');
        }
      } catch (error) {
        console.error('检查登录状态失败:', error);
        navigation.replace('Login');
      }
    };
    
    checkLoginStatus();
  }, [navigation]);

  useEffect(() => {
    const fetchTerminalDetail = async () => {
      console.log('fetchTerminalDetail');
      try {
        setLoading(true);
        // 从AsyncStorage获取用户ID和token
        const userId = await AsyncStorage.getItem('userId');
        const accessToken = await AsyncStorage.getItem('accessToken');
        
        if (userId && accessToken) {
          const response = await getTerminalDetail(userId, accessToken);
          if (response.success && response.data) {
            setTerminalDetail(response.data);
            
            // 将merchantId存储到缓存中
            if (response.data.merchantId) {
              await AsyncStorage.setItem('merchantId', response.data.merchantId.toString());
            }
          }
        }
      } catch (error) {
        console.error('获取终端设备详情失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTerminalDetail();
  }, []);

  const handleLogout = async () => {
    try {
      // 清空所有缓存数据
      await AsyncStorage.clear();
      console.log('缓存已清空');
      // 跳转到登录页面
      navigation.replace('Login');
    } catch (error) {
      console.error('退出登录时清空缓存失败:', error);
      navigation.replace('Login');
    }
  };

  const navigateToScan = async () => {
    try {
      const result = await NativeModules.XToastModule.startQRCodeScan();
      if (result) {
        // 获取token和merchantId
        const accessToken = await AsyncStorage.getItem('accessToken');
        const storedMerchantId = await AsyncStorage.getItem('merchantId');
        
        if (!accessToken) {
          Alert.alert('提示', '请先登录', [
            { text: '确定', onPress: () => navigation.replace('Login') }
          ]);
          return;
        }
        
        if (!storedMerchantId) {
          Alert.alert('提示', '未获取到商户信息');
          return;
        }

        // 判断是否包含下划线，区分订单二维码和社保卡二维码
        if (result.includes('_')) {
          // 解析扫描结果，格式如 1568758870_8780-0
          const orderIdMatch = result.split('_')[0];
          if (orderIdMatch) {
            // 直接导航到订单列表页面，让订单列表页面去获取订单详情
            navigation.navigate('verification-list', {
              orderId: orderIdMatch,
              token: accessToken,
              type:2
            });
          } else {
            Alert.alert('扫码错误', '无法识别的二维码格式');
          }
        } else {
          // 社保卡二维码，调用原生模块显示Toast
          console.log('扫描到社保卡二维码:', result);
          // 调用XToastModule的showToast方法显示弹窗
          NativeModules.XToastModule.initParms(
            "https://qyykt.e-tecsun.com/prod-api/outInterface/api/r0/doPost",
            "gdly"
          ).then((res: number) => {
            console.log('initParms res=====:', res);
            NativeModules.XToastModule.checkESSCard(result, "01|票务核销|000001|").then((checkRes: any) => {
              console.log('解析社保卡二维码结果:', checkRes);
              // 解构返回的结果对象，获取结果码和错误信息
              const resultCode = checkRes.resultCode;
              const errorMsg = checkRes.errorMsg;
              const resultStr = checkRes.resultStr
              const idNo = checkRes.idNo;
              
              if (resultCode !== 0) {
                // 结果不等于0时，显示错误信息
                Alert.alert('核销失败', `${errorMsg || resultStr}`);
              } else {
                // 结果等于0时，显示成功信息
                navigation.navigate('verification-list', {
                  idNo: idNo,
                  token: accessToken,
                  type:1
                });
              }
            }).catch((error: Error) => {
              console.log('解析社保卡二维码失败:', error);
              Alert.alert('核销失败', error.message);
            });
          }).catch((error: Error) => {
            console.log('扫码error=====:', error);
            // 显示完整错误信息
            Alert.alert(
              '错误提示',
              error.message,
              [{ text: '确定', style: 'cancel' }],
              { cancelable: true }
            );
          });
        }
      }
    } catch (error: any) {
      Alert.alert('扫码错误', error.message);
      console.error('扫码错误:', error);
    }
  };

  const navigateToCard = (type: number) => {
    navigation.navigate('waiting-card', { type });
  };

  const navigateToOrder = () => {
    navigation.navigate('order-query');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FEE726" />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Image source={require('../assets/images/tuichu.png')} style={styles.logoutIcon} />
            </TouchableOpacity>
          </View>

          <View style={styles.welcomeSection}>
            <View style={styles.welcomeContent}>
              <Image source={{uri: terminalDetail?.pic ? `${PIC_URL}${terminalDetail.pic}` : undefined}} style={styles.merchantAvatar} />
              <View style={styles.merchantDetails}>
                <View style={styles.merchantInfo}>
                  <Text style={styles.merchantName}>{terminalDetail?.merchantName}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.codeView}>
          {/* QR Code Section */}
          <View style={styles.qrSection}>
            <Image source={require('../assets/images/bg2.png')} style={styles.qrBackground} />
            <View style={styles.qrTopContainer}>
              <Image source={require('../assets/images/code.png')} style={styles.topTishiIcon} />
              <TouchableOpacity style={styles.scanButton} onPress={navigateToScan}>
                <Text style={styles.scanButtonText}>扫码核销</Text>
                <Image source={require('../assets/images/right-arrow.png')} style={{width: 20, height: 20}} />
              </TouchableOpacity>
            </View>
            <View style={styles.qrTextContainer}>
              <LinearGradient
                colors={['#FEE626', 'rgba(255,255,255,0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientContainer}
              >
                <Image source={require('../assets/images/tishi.png')} style={styles.tishiIcon} />
                <Text style={styles.qrInfoText}>支持扫电子社保卡二维码、订单核销二维码</Text>
              </LinearGradient>
            </View>
          </View>

          {/* Card Verification */}
          <View style={styles.cardSection}>
            <View style={styles.cardContent}>
              <View style={styles.cardTitleContainer}>
                <Image source={require('../assets/images/shuaka.png')} style={styles.cardTitleBackground} />
                <Image source={require('../assets/images/shuaxin.png')} style={styles.cardIcon} />
                <Text style={styles.cardTitle}>刷卡核销</Text>
              </View>
              <View style={styles.cardButtons}>
                <TouchableOpacity style={styles.cardActionButton} onPress={() => navigateToCard(1)}>
                  <Text style={styles.cardActionText}>插入社保卡</Text>
                  <Image source={require('../assets/images/right-arrow.png')} style={{width: 18, height: 18}} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.cardActionButton} onPress={() => navigateToCard(2)}>
                  <Text style={styles.cardActionText}>读取身份证</Text>
                  <Image source={require('../assets/images/right-arrow.png')} style={{width: 18, height: 18}} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Order Query */}
          <View style={styles.orderSection}>
            <View style={styles.orderTitleRow}>
              <View style={styles.orderTitleBar} />
              <Text style={styles.orderTitle}>全部订单</Text>
            </View>
            <View style={styles.orderContentRow}>
              <Text style={styles.orderDescription}>点击进入订单列表，查看所有订单</Text>
              <TouchableOpacity style={styles.orderButton} onPress={navigateToOrder}>
                <Text style={styles.orderButtonText}>查询订单</Text>
                <Image source={require('../assets/images/right-arrow.png')} style={{width: 18, height: 18}} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ID Card Demo */}
          <View style={styles.orderSection}>
            <View style={styles.orderTitleRow}>
              <View style={styles.orderTitleBar} />
              <Text style={styles.orderTitle}>身份证读取演示</Text>
            </View>
            <View style={styles.orderContentRow}>
              <Text style={styles.orderDescription}>测试身份证NFC读取功能</Text>
              <TouchableOpacity style={styles.orderButton} onPress={() => navigation.navigate('idcard-demo')}>
                <Text style={styles.orderButtonText}>身份证演示</Text>
                <Image source={require('../assets/images/right-arrow.png')} style={{width: 18, height: 18}} />
              </TouchableOpacity>
            </View>
          </View>

          {/* User Info */}
          <View style={styles.userInfoCard}>
            <View style={styles.orderTitleRow}>
              <View style={styles.orderTitleBar} />
              <Text style={styles.orderTitle}>商户信息</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>终端账号：</Text>
              <Text style={styles.infoValue}>{terminalDetail?.accountName}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>账号类型：</Text>
              <Text style={styles.infoValue}>{terminalDetail?.isMain === 'YES' ? '主账号' : '子账号'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>店铺名称：</Text>
              <Text style={styles.infoValue}>{terminalDetail?.merchantName}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>店铺地址：</Text>
              <Text style={styles.infoValue}>{terminalDetail?.addr}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>设备唯一编码：</Text>
              <Text style={styles.infoValue}>{terminalDetail?.equipmentCoding}</Text>
            </View>
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
  header: {
    backgroundColor: '#FEE726',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  codeView: {
    position: 'relative',
    top: -30,
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: 120,
    gap: 5,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    padding: 8,
  },
  logoutIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  welcomeSection: {
    marginBottom: 10,
    paddingVertical: 5,
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  merchantAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#fff',
  },
  merchantDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  merchantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  merchantLabel: {
    fontSize: 14,
    color: '#333',
  },
  merchantName: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  qrSection: {
    marginHorizontal: 20,
    borderRadius: 15,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: 120,
    position: 'relative',
  },
  qrBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  topTishiIcon: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    marginRight: 10,
  },
  tishiIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    marginRight: 10,
  },
  qrTopContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    position: 'relative',
    zIndex: 1,
    height: '60%',
  },
  qrTextContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  gradientContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    width: '100%',
  },
  qrInfoText: {
    color: '#333',
    fontSize: 12,
    flex: 1,
  },
  scanButton: {
    backgroundColor: '#FEE726',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#333',
    fontWeight: 'bold',
    marginRight: 5,
  },
  cardSection: {
    marginHorizontal: 20,
    borderRadius: 15,
    overflow: 'hidden',
    height: 140,
    position: 'relative',
    backgroundColor: '#fff',
  },
  cardBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    marginRight: 10,
    position: 'relative',
    zIndex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    position: 'relative',
    color: '#fff',
    zIndex: 1,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: 0,
    height: '50%',
    overflow: 'hidden',
    width: '100%',
  },
  cardTitleBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'stretch',
    top: 0,
    bottom: 0,
  },
  cardButtons: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    alignItems: 'center',
    height: '50%',
    gap:20,
  },
  cardActionButton: {
    backgroundColor: 'rgba(254, 231, 38, 0.1)',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '48%',
    borderWidth: 1,
    borderColor: '#FEDE26',
  },
  cardActionText: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 14,
    marginRight: 5,
  },
  orderSection: {
    marginHorizontal: 20,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#fff',
    position: 'relative',
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 15,
  },
  orderTitleRow: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderTitleBar: {
    width: 5,
    height: 20,
    backgroundColor: '#FEE726',
    marginRight: 8,
    borderRadius: 1.5,
  },
  orderContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTitle: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
  },
  orderDescription: {
    color: '#666',
    fontSize: 12,
    flex: 1,
    paddingRight: 10,
  },
  orderTextContainer: {
    flex: 1,
  },
  orderText: {
    color: '#fff',
    fontSize: 14,
  },
  orderButton: {
    backgroundColor: '#FEE726',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderButtonText: {
    color: '#333',
    fontWeight: 'bold',
    marginRight: 5,
  },
  orderImage: {
    position: 'absolute',
    right: 15,
    bottom: 10,
    width: 40,
    height: 40,
    resizeMode: 'contain',
    opacity: 0.5,
  },
  userInfoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 15,
    paddingTop: 10,
    paddingBottom: 0,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  infoRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    width: 100,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
});
