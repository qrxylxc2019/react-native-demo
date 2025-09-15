import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  NativeModules,
  Image,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OrderItem } from '../constants/api';
import { TopHeader, OrderDetail, VerificationResult } from '../components';
import { RootStackParamList } from '../navigation/types';
import { submitVerification, pageVerificationOrder } from '../api';

type VerificationListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'verification-list'>;
type VerificationListScreenRouteProp = RouteProp<RootStackParamList, 'verification-list'>;

// 验证结果接口
interface VerificationResultData {
  orderId: string;
  response: {
    success: boolean;
    msg?: string;
    code?: string;
  };
}

export default function VerificationListScreen() {
  const navigation = useNavigation<VerificationListScreenNavigationProp>();
  const route = useRoute<VerificationListScreenRouteProp>();

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResultData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [queryType, setQueryType] = useState<number | null>(null);
  const [queryParam, setQueryParam] = useState<string | null>(null);
  const [channel, setChannel] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // 从路由参数中获取数据
  useEffect(() => {
    if (route.params) {
      // 重置分页状态
      setCurrentPage(1);
      setHasMore(true);
      setOrders([]);

      // 如果接收到了订单列表，直接使用
      if (route.params.orders) {
        setOrders(route.params.orders || []);
        setToken(route.params.token || null);
        // 清除查询参数
        setQueryType(null);
        setQueryParam(null);
      }
      // 如果接收到了 idNo 和 type=1，则使用身份证号查询
      else if (route.params.idNo && route.params.token && route.params.type === 1) {
        setToken(route.params.token);
        setQueryType(1);
        setQueryParam(route.params.idNo);
        setChannel(route.params.channel || null);
        fetchOrdersByIdCard(route.params.idNo, route.params.token, 1);
      }
      // 如果接收到了 orderId 和 type=2，则使用订单号查询
      else if (route.params.orderId && route.params.token && route.params.type === 2) {
        setToken(route.params.token);
        setQueryType(2);
        setQueryParam(route.params.orderId);
        fetchOrderDetails(route.params.orderId, route.params.token, 1);
      }
    }
  }, [route.params]);

  // 通过身份证号查询订单
  const fetchOrdersByIdCard = async (idCard: string, accessToken: string, page: number, isLoadingMore: boolean = false) => {
    if (!isLoadingMore) {
      setLoading(true);
    }
    try {
      const storedMerchantId = await AsyncStorage.getItem('merchantId');

      if (!storedMerchantId) {
        Alert.alert('提示', '未获取到商户信息');
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        return;
      }

      const merchantId = parseInt(storedMerchantId);

      const params = {
        merchantId,
        pageNum: page,
        pageSize: 10,
        type: 1, // type 1 表示通过身份证号查询
        idCard: idCard
      };

      const response = await pageVerificationOrder(params, accessToken);

      if (response.success && response.data.list.length > 0) {
        if (isLoadingMore) {
          // 加载更多时，合并新数据
          setOrders(prevOrders => [...prevOrders, ...response.data.list]);
        } else {
          // 第一次加载或刷新时，替换数据
          setOrders(response.data.list);
        }
        setVerificationResult(null); // 清除验证结果

        // 判断是否还有更多数据
        setHasMore(response.data.pages > page);
        setCurrentPage(page);
      } else {
        if (response.code === '401') {
          Alert.alert('登录已过期', '请重新登录', [
            {
              text: '确定', onPress: () => {
                AsyncStorage.removeItem('accessToken');
                navigation.replace('Login');
              }
            }
          ]);
        } else if (!isLoadingMore) {
          // 非加载更多模式下才显示错误
          // 在当前页面显示错误信息
          setVerificationResult({
            orderId: idCard, // 使用身份证号作为ID
            response
          });
          setOrders([]);
        } else {
          // 加载更多没有数据
          setHasMore(false);
        }
      }
    } catch (error) {
      if (!isLoadingMore) {
        // 非加载更多模式下才显示错误
        // 在当前页面显示错误信息
        setVerificationResult({
          orderId: idCard, // 使用身份证号作为ID
          response: {
            success: false,
            msg: '网络错误，请稍后重试'
          }
        });
        setOrders([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // 通过订单号查询订单详情
  const fetchOrderDetails = async (orderId: string, accessToken: string, page: number, isLoadingMore: boolean = false) => {
    if (!isLoadingMore) {
      setLoading(true);
    }
    try {
      const storedMerchantId = await AsyncStorage.getItem('merchantId');

      if (!storedMerchantId) {
        Alert.alert('提示', '未获取到商户信息');
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        return;
      }

      const merchantId = parseInt(storedMerchantId);

      const params = {
        merchantId,
        pageNum: page,
        pageSize: 10,
        type: 2, // type 2 表示通过订单号查询
        orderId: orderId
      };

      const response = await pageVerificationOrder(params, accessToken);

      if (response.success && response.data.list.length > 0) {
        if (isLoadingMore) {
          // 加载更多时，合并新数据
          setOrders(prevOrders => [...prevOrders, ...response.data.list]);
        } else {
          // 第一次加载或刷新时，替换数据
          setOrders(response.data.list);
        }
        setVerificationResult(null); // 清除验证结果

        // 判断是否还有更多数据
        setHasMore(response.data.pages > page);
        setCurrentPage(page);
      } else {
        if (response.code === '401') {
          Alert.alert('登录已过期', '请重新登录', [
            {
              text: '确定', onPress: () => {
                AsyncStorage.removeItem('accessToken');
                navigation.replace('Login');
              }
            }
          ]);
        } else if (!isLoadingMore) {
          // 非加载更多模式下才显示错误
          // 在当前页面显示错误信息
          setVerificationResult({
            orderId: orderId,
            response
          });
          setOrders([]);
        } else {
          // 加载更多没有数据
          setHasMore(false);
        }
      }
    } catch (error) {
      if (!isLoadingMore) {
        // 非加载更多模式下才显示错误
        // 在当前页面显示错误信息
        setVerificationResult({
          orderId: orderId,
          response: {
            success: false,
            msg: '网络错误，请稍后重试'
          }
        });
        setOrders([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const goBack = () => {
    navigation.goBack();
  };

  const goHome = () => {
    navigation.navigate('Home');
  };

  // 下拉刷新处理函数
  const onRefresh = async () => {
    if (refreshing) return;

    setRefreshing(true);
    setCurrentPage(1);
    setHasMore(true);

    // 根据查询类型执行不同的刷新操作
    if (queryType === 1 && queryParam && token) {
      // 身份证号查询
      fetchOrdersByIdCard(queryParam, token, 1);
    } else if (queryType === 2 && queryParam && token) {
      // 订单号查询
      fetchOrderDetails(queryParam, token, 1);
    } else {
      setRefreshing(false);
    }
  };

  // 加载更多数据
  const loadMoreOrders = async () => {
    if (loadingMore || !hasMore || !token || !queryParam || !queryType) return;

    setLoadingMore(true);
    const nextPage = currentPage + 1;

    // 根据查询类型执行不同的加载更多操作
    if (queryType === 1) {
      // 身份证号查询
      fetchOrdersByIdCard(queryParam, token, nextPage, true);
    } else if (queryType === 2) {
      // 订单号查询
      fetchOrderDetails(queryParam, token, nextPage, true);
    } else {
      setLoadingMore(false);
    }
  };

  // 继续扫码核销
  const continueScanning = async () => {
    try {
      const result = await NativeModules.XToastModule.startQRCodeScan();
      if (result) {
        // 获取token和merchantId
        const accessToken = await AsyncStorage.getItem('accessToken');

        if (!accessToken) {
          Alert.alert('提示', '请先登录', [
            { text: '确定', onPress: () => navigation.replace('Login') }
          ]);
          return;
        }

        // 判断是否包含下划线，区分订单二维码和社保卡二维码
        if (result.includes('_')) {
          // 解析扫描结果，格式如 1568758870_8780-0
          const orderIdMatch = result.split('_')[0];
          if (orderIdMatch) {
            // 重置分页状态
            setCurrentPage(1);
            setHasMore(true);
            setOrders([]);
            setQueryType(2);
            setQueryParam(orderIdMatch);
            // 使用订单号查询
            fetchOrderDetails(orderIdMatch, accessToken, 1);
          } else {
            Alert.alert('扫码错误', '无法识别的二维码格式');
          }
        } else {
          // 社保卡二维码，调用原生模块解析
          console.log('扫描到社保卡二维码:', result);
          // 调用XToastModule的初始化和解析方法
          try {
            await NativeModules.XToastModule.initParms(
              "https://qyykt.e-tecsun.com/prod-api/outInterface/api/r0/doPost",
              "gdly"
            );
            const checkRes = await NativeModules.XToastModule.checkESSCard(result, "01|票务核销|000001|");
            console.log('解析社保卡二维码结果===:', checkRes);

            // 解构返回的结果对象，获取结果码和错误信息
            const resultCode = checkRes.resultCode;
            const errorMsg = checkRes.errorMsg;
            const resultStr = checkRes.resultStr
            const idNo = checkRes.idNo;

            if (resultCode !== 0) {
              // 结果不等于0时，显示错误信息
              Alert.alert('核销失败', `${errorMsg || resultStr}`);
            } else {
              // 重置分页状态
              setCurrentPage(1);
              setHasMore(true);
              setOrders([]);
              setQueryType(1);
              setQueryParam(idNo);
              // 结果等于0时，使用身份证号查询
              fetchOrdersByIdCard(idNo, accessToken, 1);
            }
          } catch (error: any) {
            console.log('解析社保卡二维码失败:', error);
            Alert.alert('核销失败', error.message);
          }
        }
      }
    } catch (error: any) {
      Alert.alert('扫码错误', error.message);
      console.error('扫码错误:', error);
    }
  };

  // 处理单个订单核销
  const handleVerification = async (order: OrderItem) => {
    if (!token) {
      Alert.alert('提示', '请先登录');
      return;
    }

    try {
      setLoading(true);
      // 对于单个门票/游客的核销
      const verificationData = {
        orderId: order.orderId,
        verificationNum: order.orderType === '2' || order.orderType === '3' ? 1 : undefined,
      };


      const response = await submitVerification(verificationData, token);
      // 核销成功，在当前页面显示结果
      setVerificationResult({
        orderId: order.orderId.toString(),
        response: response
      });
      setOrders([]);

    } catch (error) {
      console.error('核销失败:', error);
      // 发生错误时在当前页面显示结果
      setVerificationResult({
        orderId: order.orderId.toString(),
        response: {
          success: false,
          msg: '请求过程中发生错误，请重试'
        }
      });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // 核销成功后的回调
  const handleVerificationSuccess = () => {
    // 更新订单列表
    if (orders.length > 0) {
      const updatedOrders = [...orders];
      updatedOrders.shift(); // 移除第一个订单
      setOrders(updatedOrders);

      // 如果没有更多订单，返回首页
      if (updatedOrders.length === 0) {
        navigation.navigate('Home');
      }
    }
  };

  // 渲染验证结果组件
  const renderVerificationResult = () => {
    if (!verificationResult) return null;

    const { orderId, response } = verificationResult;
    return (
      <VerificationResult
        message={response.msg}
        isSuccess={response.success}
        code={response.code}
        orderId={orderId}
      />
    );
  };

  // 根据channel参数决定标题
  const getTitle = () => {
    return channel === 'card' ? '刷卡核销' : '扫码核销';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <TopHeader title={getTitle()} onBack={goBack} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TopHeader title={getTitle()} onBack={goBack} />

      {verificationResult ? (
        // 显示验证结果
        <>
          <View style={{ flex: 1 }}>
            {renderVerificationResult()}
          </View>
        </>
      ) : (
        // 显示订单列表
        <>
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#FEE726']}
                tintColor="#FEE726"
              />
            }
            onScroll={({ nativeEvent }) => {
              const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
              const paddingToBottom = 20; // 距离底部20px时就触发
              const isCloseToBottom = layoutMeasurement.height + contentOffset.y >=
                contentSize.height - paddingToBottom;
              if (isCloseToBottom && !loadingMore && hasMore) {
                console.log('【更多】触发加载更多==========')
                loadMoreOrders();
              }
            }}
            scrollEventThrottle={16}
            onMomentumScrollEnd={({ nativeEvent }) => {
              const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
              const paddingToBottom = 20;
              const isCloseToBottom = layoutMeasurement.height + contentOffset.y >=
                contentSize.height - paddingToBottom;
              console.log('【滚动结束】isCloseToBottom==========', isCloseToBottom)
              if (isCloseToBottom && !loadingMore && hasMore) {
                console.log('【滚动结束】触发加载更多==========')
                loadMoreOrders();
              }
            }}
          >
            {orders.length > 0 && orders.map((item, index) => (
              <View style={styles.cardContainer} key={`order-${item.orderId}-${index}`}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>订单信息</Text>
                </View>
                <OrderDetail
                  key={index}
                  order={item}
                  onVerify={handleVerification}
                  token={token || undefined}
                  onVerificationSuccess={handleVerificationSuccess}
                />
              </View>
            ))}

            {loadingMore && (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color="#FEE726" />
                <Text style={styles.loadingMoreText}>加载更多数据...</Text>
              </View>
            )}

            {!loadingMore && !hasMore && orders.length > 0 && (
              <Text style={styles.noMoreDataText}>没有更多数据了</Text>
            )}
          </ScrollView>
          <View style={styles.footerContainer}>
            <TouchableOpacity
              style={[styles.homeButton, channel === 'card' && styles.fullWidthButton]}
              onPress={goHome}
            >
              <Text style={styles.homeButtonText}>返回首页</Text>
            </TouchableOpacity>

            {channel !== 'card' && (
              <TouchableOpacity
                style={styles.scanButton}
                onPress={continueScanning}
              >
                <Text style={styles.scanButtonText}>继续扫码核销</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
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
    padding: 16,
  },
  scrollViewContent: {
    paddingBottom: 60, // 为底部按钮留出足够空间
  },
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  homeButton: {
    backgroundColor: '#fff',
    borderRadius: 200,
    paddingVertical: 12,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEE726',
  },
  homeButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scanButton: {
    backgroundColor: '#FEE726',
    borderRadius: 200,
    paddingVertical: 12,
    width: '48%',
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 6,
    fontSize: 16,
    color: '#666',
  },
  loadingMoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  noMoreDataText: {
    textAlign: 'center',
    color: '#999',
  },
  fullWidthButton: {
    width: '100%',
  },
}); 