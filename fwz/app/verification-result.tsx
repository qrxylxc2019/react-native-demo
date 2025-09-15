import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TopHeader, VerificationResult } from '../components';
import { RootStackParamList } from '../navigation/types';

type VerificationResultScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'verification-result'>;
type VerificationResultScreenRouteProp = RouteProp<RootStackParamList, 'verification-result'>;

interface VerificationResultProps {
  message?: string;
  isSuccess?: boolean;
  code?: string;
}

export default function VerificationResultScreen({ message, isSuccess, code: propCode }: VerificationResultProps) {
  const navigation = useNavigation<VerificationResultScreenNavigationProp>();
  const route = useRoute<VerificationResultScreenRouteProp>();
  const [resultMessage, setResultMessage] = useState<string>(message || '');
  const [resultSuccess, setResultSuccess] = useState<boolean>(isSuccess || false);
  const [resultCode, setResultCode] = useState<string>(propCode || '');

  // 从路由参数中获取response数据
  useEffect(() => {
    // 如果有直接传入的message、isSuccess和code，优先使用
    if (message) {
      setResultMessage(message);
      setResultSuccess(isSuccess || false);
      if (propCode) {
        setResultCode(propCode);
      }
      return;
    }
    // 从路由参数中获取response
    const response = route.params?.response;

    if (response) {
      setResultMessage(response.msg || '');
      setResultSuccess(response.success || false);
      setResultCode(response.code || '');
    } else {
      setResultMessage('未获取到核销结果');
      setResultSuccess(false);
      setResultCode('');
    }
  }, [route.params?.response, message, isSuccess, propCode]);

  const goBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopHeader title="扫码核销" onBack={goBack} />
      <VerificationResult 
        message={resultMessage}
        isSuccess={resultSuccess}
        code={resultCode}
        orderId={route.params?.orderId}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
}); 