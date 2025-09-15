import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getMerchantOrders, submitVerification } from '../api';
import { OrderItem, VerificationRequest } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TopHeader, OrderDetail } from '../components';
import { RootStackParamList } from '../navigation/types';

type OrderQueryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'order-query'>;

export default function OrderQueryScreen() {
  const navigation = useNavigation<OrderQueryScreenNavigationProp>();
  const [searchText, setSearchText] = useState('');
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [token, setToken] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [merchantId, setMerchantId] = useState<number | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  // 获取Token和其他信息
  useEffect(() => {
    const getStoredData = async () => {
      try {
        // 获取存储的数据
        const accessToken = await AsyncStorage.getItem('accessToken');
        const storedTenantId = await AsyncStorage.getItem('tenantId');
        const storedMerchantId = await AsyncStorage.getItem('merchantId');
        
        // 设置状态
        setToken(accessToken);
        setTenantId(storedTenantId ? parseInt(storedTenantId) : null);
        setMerchantId(storedMerchantId ? parseInt(storedMerchantId) : null);
        
        // 标记数据加载完成
        setDataLoaded(true);
        
        // 如果没有token，跳转到登录页面
        if (!accessToken) {
          Alert.alert('提示', '请先登录', [
            { text: '确定', onPress: () => navigation.replace('Login') }
          ]);
        }
      } catch (error) {
        console.error('获取存储数据失败:', error);
        Alert.alert('错误', '获取登录信息失败，请重新登录', [
          { text: '确定', onPress: () => navigation.replace('Login') }
        ]);
        setDataLoaded(true); // 即使出错也要标记加载完成
      }
    };
    
    getStoredData();
  }, [navigation]);

  // 加载订单数据
  const loadOrders = async (page = 1, keyword = '') => {
    if (!token) {
      console.log('没有访问令牌，无法加载订单');
      return;
    }
    
    setLoading(true);
    try {
      const params = {
        pageNum: page,
        pageSize: pageSize,
        keyWord: keyword || undefined,
        tenantId: tenantId || undefined,
        merchantId: merchantId || undefined,
      };

      console.log('查询订单参数:', JSON.stringify(params));
      
      const response = await getMerchantOrders(params, token);
      console.log('查询订单结果:', response.success ? '成功' : '失败', response.msg || '');
      if (response.success) {
        // 如果是第一页，替换数据；否则，追加数据
        if (page === 1) {
          setOrders(response.data.list || []);
        } else {
          setOrders(prevOrders => [...prevOrders, ...(response.data.list || [])]);
        }
        setTotal(response.data.total || 0);
        setCurrentPage(page);
      } else {
        // 检查是否是token过期
        if (response.code === '401' || response.msg?.includes('token')) {
          Alert.alert('登录已过期', '请重新登录', [
            { text: '确定', onPress: () => {
              // 清除存储的token
              AsyncStorage.removeItem('accessToken');
              // 跳转到登录页面
              navigation.replace('Login');
            }}
          ]);
        } else {
          Alert.alert('获取订单失败', response.msg || '请稍后重试');
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('加载订单失败:', error);
      Alert.alert('获取订单失败', '网络错误，请稍后重试');
    }
  };

  // 初始加载 - 等待数据加载完成后再执行
  useEffect(() => {
    if (dataLoaded && token) {
      console.log('数据加载完成，开始查询订单:', { token: !!token, tenantId, merchantId });
      loadOrders(1);
    }
  }, [dataLoaded, token, tenantId, merchantId]);

  // 搜索订单
  const handleSearch = () => {
    // 先清空当前订单列表数据
    setOrders([]);
    setTotal(0);
    setCurrentPage(1);
    // 执行搜索
    loadOrders(1, searchText);
  };

  // 获取订单状态文本
  const getStatusText = (status: number, statusStr?: string) => {
    if (statusStr) return statusStr;
    
    switch (status) {
      case 1: return '待付款';
      case 2: return '待发货';
      case 3: return '待收货';
      case 4: return '待评价';
      case 5: return '已完成';
      case 6: return '已取消';
      case 7: return '售后退款';
      case 8: return '已完成';
      default: return '未知状态';
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: return '#FF9500'; // 待付款
      case 2: 
      case 3: return '#FF9500'; // 待发货/待收货
      case 4: 
      case 5: return '#34C759'; // 待评价/已完成
      case 6: return '#FF3B30'; // 已取消
      case 7: return '#FF3B30'; // 售后退款
      case 8: return '#34C759'; // 已完成
      default: return '#999';
    }
  };

  // 订单详情
  const handleOrderPress = (order: OrderItem) => {
    
  };

  const goBack = () => {
    navigation.goBack();
  };

  // 处理单个订单核销（用于只有一张门票/一个游客的情况）
  const handleVerification = async (order: OrderItem) => {
    // 移除调试代码
    if (!token) {
      Alert.alert('提示', '请先登录');
      return;
    }
    
    try {
      setLoading(true);
      
      // 对于单个门票/游客的核销
      const verificationData: VerificationRequest = {
        orderId: order.orderId,
        verificationNum: order.orderType === '2' || order.orderType === '3' ? 1 : undefined,
      };

      console.log('verificationData', verificationData);
      const response = await submitVerification(verificationData, token);
      
      if (response.success) {
        Alert.alert('核销成功', '订单已成功核销', [
          { text: '确定', onPress: () => navigation.navigate('Home') }
        ]);
      } else {
        Alert.alert('核销失败', response.msg || '核销请求失败');
      }
    } catch (error) {
      console.error('核销失败:', error);
      Alert.alert('核销失败', '请求过程中发生错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 加载更多订单
  const loadMoreOrders = () => {
    // 防止重复加载：检查是否正在加载中、是否已加载全部数据
    if (!loading && orders.length < total) {
      console.log('加载更多订单，当前页码:', currentPage);
      loadOrders(currentPage + 1, searchText);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      
      
      {/* Header */}
      <TopHeader title="订单列表" onBack={goBack} />

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Image 
            source={require('../assets/images/search.png')} 
            style={styles.searchIcon} 
          />
          <TextInput
            style={styles.searchInput}
            placeholder="输入订单号或用户账号搜索"
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={handleSearch}
          >
            <Text style={styles.searchButtonText}>查询</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Orders List */}
      {loading && orders.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.ordersList}
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            // 提前触发加载更多，当距离底部还有屏幕高度的 30% 时就开始加载
            const triggerDistance = layoutMeasurement.height * 1;
            const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - triggerDistance;
            if (isCloseToBottom) {
              loadMoreOrders();
            }
          }}
          scrollEventThrottle={200}
        >
          {orders.length > 0 ? (
            orders.map((order) => (
              <View
                key={order.orderId.toString()}
                style={styles.orderCard}
              >
                <OrderDetail 
                  order={order} 
                  onVerify={handleVerification}
                  token={token}
                />
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Image 
                source={require('../assets/images/tishi.png')} 
                style={{width: 60, height: 60, tintColor: '#ccc'}} 
              />
              <Text style={styles.emptyText}>
                {searchText ? '未找到相关订单' : '暂无订单数据'}
              </Text>
            </View>
          )}
          
          {loading && orders.length > 0 && (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color="#FF6B6B" />
              <Text style={styles.loadingMoreText}>加载更多...</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F6DA3A',
    borderRadius: 200,
    paddingHorizontal: 5,
    paddingVertical: 5,
  },
  searchIcon: {
    marginLeft: 12,
    width: 20,
    height: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#F6DA3A',
    borderRadius: 200,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: 'bold',
  },
  ordersList: {
    flex: 1,
    padding: 0,
    paddingHorizontal: 10,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  orderContent: {
    marginBottom: 8,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 2,
  },
  orderLabel: {
    fontSize: 14,
    color: '#666',
    width: '30%',
  },
  orderValue: {
    fontSize: 14,
    color: '#333',
    width: '70%',
    textAlign: 'right',
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  detailButton: {
    backgroundColor: '#F6DA3A',
    borderRadius: 200,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 5,
  },
  buttonIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
});
