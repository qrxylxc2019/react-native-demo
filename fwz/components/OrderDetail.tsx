import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { OrderItem } from '../constants/api';
import { VerificationModal } from './index';

interface OrderDetailProps {
  order: OrderItem;
  onVerify?: (order: OrderItem) => void;
  showVerifyButton?: boolean;
  token?: string;
  onVerificationSuccess?: () => void;
  onPress?: () => void;
}

const OrderDetail: React.FC<OrderDetailProps> = ({ 
  order, 
  onVerify, 
  showVerifyButton = true, 
  token,
  onVerificationSuccess,
  onPress
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleVerify = () => {
    // 如果门票总数/游客总数为1，直接调用onVerify
    const spuCount = parseInt(order.spuCount || '0');
    console.log('spuCount', spuCount)
    if (spuCount === 1) {
      // 单个门票/游客直接调用核销接口
      if (onVerify) {
        console.log('核销======',order)
        onVerify(order);
      }
    } else {
      console.log('多个门票/游客显示核销弹窗')
      // 多个门票/游客显示核销弹窗
      setModalVisible(true);
    }
  };

  const handleVerificationSuccess = () => {
    // 核销成功回调
    if (onVerificationSuccess) {
      onVerificationSuccess();
    }
  };

  return (
    <View style={styles.orderContent}>
      <TouchableOpacity 
        style={styles.contentWrapper} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>订单号</Text>
          <Text style={styles.orderValue}>{order.orderId}</Text>
        </View>

        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>用户账号</Text>
          <Text style={styles.orderValue}>{order.memberAccount}</Text>
        </View>
      
        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>订单金额</Text>
          <Text style={styles.orderAmount}>¥{(order.total / 100).toFixed(2)}</Text>
        </View>

        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>订单状态</Text>
          <Text style={styles.orderValue}>{order.statusStr}</Text>
        </View>
      
        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>商品名称</Text>
          <Text style={styles.orderValue}>{order.spuName}</Text>
        </View>
      
        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>{order.orderType === '3' ? '游客总数' : '门票总数'}</Text>
          <Text style={styles.orderValue}>X{order.spuCount || 'X3'}</Text>
        </View>
      
        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>出游日期</Text>
          <Text style={styles.orderValue}>{order.selectDate}</Text>
        </View>
      
        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>商品类型</Text>
          <Text style={styles.orderValue}>
            {order.orderType === '1' ? '小程序商城订单' :
             order.orderType === '2' ? '景区门票订单' :
             order.orderType === '3' ? '跟团游线路订单' : ''}
          </Text>
        </View>
      
        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>下单时间</Text>
          <Text style={styles.orderValue}>{order.payTime || order.createTime}</Text>
        </View>
      
        {order.refundAmount > 0 && order.status == 7 && (
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>退款金额</Text>
            <Text style={styles.orderValue}>¥{(order.refundAmount / 100).toFixed(2)}</Text>
          </View>
        )}
      
        {order.verificationType && (
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>核销方式</Text>
            <Text style={styles.orderValue}>
              {order.verificationTypeStr || 
                (order.verificationType === '1' ? '小程序核销' : 
                 order.verificationType === '2' ? 'pose机核销' : '未知')}
            </Text>
          </View>
        )}
        {/* 核销按钮 - 只在订单状态为10(待核销)时显示 */}
        {showVerifyButton && order.status === 10 && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.verifyButton}
              onPress={handleVerify}
            >
              <Text style={styles.verifyButtonText}>核销</Text>
              <Image source={require('../assets/images/right-arrow.png')} style={styles.buttonIcon} />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
      
      {/* 核销弹窗 - 使用条件渲染代替visible属性 */}
      {modalVisible && (
        <VerificationModal
          onClose={() => setModalVisible(false)}
          onSuccess={handleVerificationSuccess}
          orderId={order.orderId}
          orderType={order.orderType}
          token={token}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  orderContent: {
    marginBottom: 8,
  },
  contentWrapper: {
    // 移除重复的样式
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
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  verifyButton: {
    backgroundColor: '#F6DA3A',
    borderRadius: 200,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonText: {
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
});

export default OrderDetail; 