import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import IdCardReader, { IdCardInfo, IdCardReaderEvent } from '../api/IdCardReader';

const IdCardReaderDemo: React.FC = () => {
  const [isReading, setIsReading] = useState(false);
  const [idCardInfo, setIdCardInfo] = useState<IdCardInfo | null>(null);
  const [nfcStatus, setNfcStatus] = useState({ available: false, enabled: false });
  const [status, setStatus] = useState<string>('准备就绪');

  useEffect(() => {
    // 检查NFC状态
    checkNfcStatus();
    
    // 添加事件监听
    const listener = IdCardReader.addListener(handleIdCardEvent);
    
    return () => {
      IdCardReader.removeListener(listener);
      if (isReading) {
        IdCardReader.stopReading();
      }
    };
  }, []);

  const checkNfcStatus = async () => {
    try {
      const status = await IdCardReader.checkNfcStatus();
      setNfcStatus(status);
    } catch (error) {
      console.error('检查NFC状态失败:', error);
    }
  };

  const handleIdCardEvent = (event: IdCardReaderEvent) => {
    console.log('身份证读取事件:', event);
    
    switch (event.status) {
      case 'idcard_start':
        setStatus('正在读取身份证...');
        setIdCardInfo(null);
        break;
        
      case 'idcard_success':
        setStatus('读取成功');
        setIsReading(false);
        
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
        break;
        
      case 'idcard_error':
        setStatus(`读取失败: ${event.errorInfo}`);
        setIsReading(false);
        Alert.alert('读取失败', event.errorInfo || '未知错误');
        break;
    }
  };

  const startReading = async () => {
    if (!nfcStatus.available) {
      Alert.alert('错误', '设备不支持NFC功能');
      return;
    }
    
    if (!nfcStatus.enabled) {
      Alert.alert('提示', '请先在系统设置中启用NFC功能');
      return;
    }

    try {
      setIsReading(true);
      setStatus('启动身份证读取模式...');
      await IdCardReader.startReading();
      setStatus('请将身份证贴近设备背面');
    } catch (error) {
      setIsReading(false);
      setStatus('启动失败');
      Alert.alert('错误', `启动身份证读取失败: ${error}`);
    }
  };

  const stopReading = async () => {
    try {
      await IdCardReader.stopReading();
      setIsReading(false);
      setStatus('已停止读取');
    } catch (error) {
      Alert.alert('错误', `停止读取失败: ${error}`);
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
      <ScrollView style={styles.infoContainer}>
        <Text style={styles.infoTitle}>身份证信息</Text>
        
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
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>身份证读取演示</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>NFC状态:</Text>
        <Text style={[styles.statusValue, { color: nfcStatus.available && nfcStatus.enabled ? 'green' : 'red' }]}>
          {nfcStatus.available ? (nfcStatus.enabled ? '可用' : '未启用') : '不支持'}
        </Text>
      </View>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>读取状态:</Text>
        <Text style={styles.statusValue}>{status}</Text>
        {isReading && <ActivityIndicator size="small" color="#007AFF" style={styles.indicator} />}
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isReading && styles.buttonDisabled]}
          onPress={startReading}
          disabled={isReading}
        >
          <Text style={styles.buttonText}>开始读取</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.stopButton, !isReading && styles.buttonDisabled]}
          onPress={stopReading}
          disabled={!isReading}
        >
          <Text style={styles.buttonText}>停止读取</Text>
        </TouchableOpacity>
      </View>
      
      {renderIdCardInfo()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    minWidth: 80,
  },
  statusValue: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  indicator: {
    marginLeft: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    maxHeight: 400,
  },
  infoTitle: {
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

export default IdCardReaderDemo;