import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { VerificationInfoResponseData, Tourist } from '../constants/api';
import { getVerificationInfo, submitVerification } from '../api';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type VerificationModalNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface VerificationModalProps {
  onClose: () => void;
  onSuccess: () => void;
  orderId: number | string;
  orderType: string;
  token?: string;
}

const VerificationModal: React.FC<VerificationModalProps> = ({
  onClose,
  onSuccess,
  orderId,
  orderType,
  token
}) => {
  const navigation = useNavigation<VerificationModalNavigationProp>();
  const [loading, setLoading] = useState(false);
  const [verificationInfo, setVerificationInfo] = useState<VerificationInfoResponseData | null>(null);
  const [verificationNum, setVerificationNum] = useState<string>('');
  const [selectedTourists, setSelectedTourists] = useState<number[]>([]);

  // 加载核销信息
  useEffect(() => {
    if (orderId) {
      loadVerificationInfo();
    }
  }, [orderId]);

  // 获取核销信息
  const loadVerificationInfo = async () => {
    try {
      console.log('loadVerificationInfo', orderId, token);
      setLoading(true);
      const response = await getVerificationInfo(orderId, token);
      
      if (response.success) {
        setVerificationInfo(response.data);
        // 默认设置为核销一个
        if (orderType === '2') {
          setVerificationNum('1');
        }
      } else {
        Alert.alert('提示', response.msg || '获取核销信息失败');
        onClose();
      }
    } catch (error) {
      console.error('获取核销信息失败:', error);
      Alert.alert('提示', '获取核销信息失败，请重试');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  // 处理核销提交
  const handleSubmit = async () => {
    try {
      if (!verificationInfo) return;

      // 验证输入
      if (orderType === '2') {
        const num = parseInt(verificationNum);
        if (isNaN(num) || num <= 0) {
          Alert.alert('提示', '请输入有效的核销数量');
          return;
        }
        
        if (num > verificationInfo.remainingCount) {
          Alert.alert('提示', '核销数量不能大于剩余待核销数量');
          return;
        }
      } else if (orderType === '3') {
        if (selectedTourists.length === 0) {
          Alert.alert('提示', '请选择至少一位游客进行核销');
          return;
        }
      }

      setLoading(true);
      
      const verificationData = {
        orderId: orderId,
        ...(orderType === '2' ? { verificationNum: parseInt(verificationNum) } : {}),
        ...(orderType === '3' ? { touristIds: selectedTourists } : {}),
      };
      
      const response = await submitVerification(verificationData, token);
      
      if (response.success) {
        // 不显示弹窗，直接关闭模态框并跳转到验证结果页面
        onSuccess();
        onClose();
        navigation.navigate('verification-result', {
          orderId: orderId.toString(),
          response: response
        });
      } else {
        Alert.alert('提示', response.msg || '核销失败');
      }
    } catch (error) {
      console.error('核销失败:', error);
      Alert.alert('提示', '核销过程中发生错误，请重试');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  // 处理游客选择
  const toggleTouristSelection = (touristId: number) => {
    if (selectedTourists.includes(touristId)) {
      setSelectedTourists(selectedTourists.filter(id => id !== touristId));
    } else {
      setSelectedTourists([...selectedTourists, touristId]);
    }
  };

  return (
    <Modal
      visible={true}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#F6DA3A" />
              <Text style={styles.loadingText}>加载中...</Text>
            </View>
          ) : (
            <>
              <Text style={styles.title}>订单核销</Text>
              
              {verificationInfo && (
                <ScrollView style={styles.contentContainer}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>商品类型</Text>
                    <Text style={styles.infoValue}>{verificationInfo.orderTypeStr}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>商品名称</Text>
                    <Text style={styles.infoValue}>{verificationInfo.spuName}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{orderType === '3' ? '游客总数' : '门票总数'}</Text>
                    <Text style={styles.infoValue}>{verificationInfo.spuCount}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>已核销数</Text>
                    <Text style={styles.infoValue}>{verificationInfo.usedCount}</Text>
                  </View>
                  
                  {orderType === '3' && verificationInfo.usedList && verificationInfo.usedList.length > 0 && (
                    <View style={styles.touristListContainer}>
                      {verificationInfo.usedList.map((tourist, index) => (
                        <Text key={`used-${tourist.touristId || index}`} style={styles.touristListItem}>
                          {tourist.name}
                        </Text>
                      ))}
                    </View>
                  )}
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>剩余待核销</Text>
                    <Text style={styles.infoValue}>{verificationInfo.remainingCount}</Text>
                  </View>
                  
                  {orderType === '3' && verificationInfo.remainingList && verificationInfo.remainingList.length > 0 && (
                    <View style={styles.touristListContainer}>
                      {verificationInfo.remainingList.map((tourist, index) => (
                        <Text key={`remaining-${tourist.touristId || index}`} style={styles.touristListItem}>
                          {tourist.name}
                        </Text>
                      ))}
                    </View>
                  )}
                  
                  {orderType === '2' && (
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>输入核销数量</Text>
                      <TextInput
                        style={styles.input}
                        value={verificationNum}
                        onChangeText={setVerificationNum}
                        keyboardType="numeric"
                        placeholder="请输入"
                      />
                    </View>
                  )}
                  
                  {orderType === '3' && verificationInfo.remainingList.length > 0 && (
                    <View style={styles.touristContainer}>
                      <Text style={styles.inputLabel}>点击选择游客姓名</Text>
                      
                      {verificationInfo.remainingList.map((tourist, index) => (
                        <TouchableOpacity
                          key={tourist.touristId}
                          style={[
                            styles.touristItem,
                            selectedTourists.includes(tourist.touristId) && styles.touristItemSelected
                          ]}
                          onPress={() => toggleTouristSelection(tourist.touristId)}
                        >
                          <Text
                            style={[
                              styles.touristName,
                              selectedTourists.includes(tourist.touristId) && styles.touristNameSelected
                            ]}
                          >
                            {tourist.name}
                          </Text>
                          {tourist.number && (
                            <Text style={styles.touristNumber}>{tourist.number}</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </ScrollView>
              )}
              
              <View style={styles.buttonsContainer}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={onClose}
                >
                  <Text style={styles.buttonText}>取消</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.confirmButton}
                  onPress={handleSubmit}
                >
                  <Text style={styles.buttonText}>确认核销</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    width: '90%',
    padding: 20,
    maxHeight: '80%',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  contentContainer: {
    maxHeight: 400,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
  },
  touristListContainer: {
    paddingLeft: 15,
    paddingVertical: 5,
    marginBottom: 5,
    backgroundColor: '#F9F9F9',
    borderRadius: 5,
  },
  touristListItem: {
    fontSize: 13,
    color: '#666',
    paddingVertical: 3,
  },
  inputContainer: {
    marginTop: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 5,
    padding: 10,
    fontSize: 14,
  },
  touristContainer: {
    marginTop: 15,
  },
  touristItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 5,
    marginBottom: 8,
    backgroundColor: '#F9F9F9',
  },
  touristItemSelected: {
    borderColor: '#F6DA3A',
    backgroundColor: '#FEFBEA',
  },
  touristName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  touristNameSelected: {
    color: '#000',
  },
  touristNumber: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    marginRight: 10,
  },
  confirmButton: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    backgroundColor: '#F6DA3A',
    alignItems: 'center',
    marginLeft: 10,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default VerificationModal; 