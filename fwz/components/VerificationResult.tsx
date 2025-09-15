import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pageVerificationOrder } from '../api';

interface VerificationResultProps {
  message?: string;
  isSuccess?: boolean;
  code?: string;
  orderId?: string;
}

export const VerificationResult = ({ message, isSuccess, code, orderId }: VerificationResultProps) => {
  const navigation = useNavigation<any>();

  const goHome = () => {
    navigation.navigate('Home');
  };
  
  // 根据code和msg决定显示内容
  const renderContent = () => {
    if (code === '00000') {
      if (message === 'ok') {
        return (
          <View>
            <Text style={[styles.notFoundText, styles.successText]}>核销成功</Text>
          </View>
        );
      } else {
        return (
          <View>
            <Text style={[styles.notFoundText, styles.successText]}>{message}</Text>
          </View>
        );
      }
    } else {
      return (
        <View>
          <Text style={[styles.notFoundText, styles.errorText]}>核销失败</Text>
          <Text style={[styles.messageText, styles.errorText]}>{message}</Text>
        </View>
      );
    }
  };

  return (
    <View style={styles.notFoundContainer}>
      <View style={styles.notFoundContent}>
        <Image 
          source={code === '00000' 
            ? require('../assets/images/ok.png') 
            : require('../assets/images/noData.png')} 
          style={styles.noDataImage}
        />
        {renderContent()}
      </View>
      
      <View style={styles.footerButtonsContainer}>
        <TouchableOpacity 
          style={styles.footerButtonLeft}
          onPress={goHome}
        >
          <Text style={styles.footerButtonText}>返回首页</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.footerButtonRight}
          onPress={async () => {
            try {
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
              
              const merchantId = parseInt(storedMerchantId);
              
              if (!orderId) {
                Alert.alert('提示', '未获取到订单信息');
                return;
              }
              
              // 导航到订单详情页
              navigation.navigate('order-detail', {
                orderId: orderId,
                merchantId: merchantId,
                accessToken: accessToken
              });
            } catch (error) {
              console.error('获取订单详情失败:', error);
              Alert.alert('提示', '网络错误，请稍后重试');
            }
          }}
        >
          <Text style={styles.footerButtonText}>查看订单</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  notFoundContainer: {
    flex: 1,
    padding: 20,
  },
  notFoundContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  noDataImage: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  successText: {
    color: '#4CAF50',
  },
  errorText: {
    color: '#F44336',
  },
  footerButtonsContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  footerButtonLeft: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 200,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 10,
  },
  footerButtonRight: {
    flex: 1,
    backgroundColor: '#FEE726',
    borderRadius: 200,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 10,
  },
  footerButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default VerificationResult; 