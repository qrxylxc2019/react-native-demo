import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { getVerificationOrder } from '../api';
import TopHeader from '../components/TopHeader';

type RouteParams = {
  orderId: string;
  merchantId: number;
  accessToken: string;
};

type OrderDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'order-detail'>;

const OrderDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<OrderDetailScreenProps['route']>();
  const { orderId, merchantId, accessToken } = route.params as RouteParams;
  
  const [loading, setLoading] = useState(true);
  const [orderDetail, setOrderDetail] = useState<any>(null);
  
  useEffect(() => {
    fetchOrderDetail();
  }, []);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      
      const response = await getVerificationOrder(orderId, accessToken);

      if (response.success) {
        console.log('订单详情======='+ JSON.stringify(response.data));
        setOrderDetail(response.data);
      } else {
      }
    } catch (error) {
      console.error('获取订单详情失败:', error);
      Alert.alert('提示', '网络错误，请稍后重试');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const renderDetailItem = (label: string, value: string | number) => {
    return (
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || ''}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TopHeader title="订单详情" onBack={() => navigation.goBack()} />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F6DA3A" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      ) : orderDetail ? (
        <ScrollView style={styles.contentContainer}>
          {renderDetailItem('订单号', orderDetail.orderId)}
          {renderDetailItem('商品名称', orderDetail.spuName)}
          {renderDetailItem('商品类型', orderDetail.orderTypeStr)}
          {renderDetailItem('商品数量', orderDetail.spuCount)}
          {renderDetailItem('订单金额', `¥${orderDetail.total > 0 ? (orderDetail.total/100).toFixed(2) : '' }`)}
          {renderDetailItem('创建时间', orderDetail.createTime)}
          {renderDetailItem('支付时间', orderDetail.payTime)}
          {renderDetailItem('支付方式', orderDetail.payTypeStr)}
          {renderDetailItem('订单状态', orderDetail.statusStr)}
          {orderDetail.status == 7 && renderDetailItem('退款金额', `¥${orderDetail.refundAmount > 0 ? (orderDetail.refundAmount/100).toFixed(2) : '' }`)}
          {renderDetailItem('用户账号', orderDetail.memberAccount)}
          {orderDetail.selectDate && renderDetailItem('出游日期', orderDetail.selectDate)}
          {renderDetailItem('核销方式', orderDetail.verificationTypeStr)}
        </ScrollView>
      ) : (
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>未找到订单信息</Text>
        </View>
      )}
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>返回</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  contentContainer: {
    flex: 1,
    padding: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flexShrink: 1,
    flexWrap: 'wrap',
    textAlign: 'right',
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: 16,
    color: '#999',
  },
  footer: {
    padding: 15,
  },
  backButton: {
    backgroundColor: '#F6DA3A',
    borderRadius: 200,
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default OrderDetailScreen; 