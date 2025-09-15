import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Image,
  ImageBackground,
  NativeModules,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import apiService from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../navigation/types';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [username, setUsername] = useState('ydrzd02'); // ydrzd02
  const [password, setPassword] = useState('Etecsun2021');  // Etecsun2021
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deviceUniqueId, setDeviceUniqueId] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const accessToken = await AsyncStorage.getItem('accessToken');
        if (accessToken) {
          // 已经登录，直接跳转到首页
          navigation.navigate('Home');
        }
      } catch (error) {
        console.error('检查登录状态失败:', error);
      }
    };
    checkLoginStatus();
  }, [navigation]);
  
  useEffect(() => {
    console.log('successMessage=======',successMessage);
    if (successMessage === '登录成功') {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        navigation.navigate('Home');
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [successMessage, navigation]);

  useEffect(() => {
    const getDeviceId = async () => {
      try {
        const uniqueId = await NativeModules.XToastModule.getDeviceUniqueId();
        setDeviceUniqueId(uniqueId);
        console.log('设备唯一ID:', uniqueId);
      } catch (error) {
        console.error('获取设备唯一ID失败:', error);
      }
    };
    
    getDeviceId();
  }, []);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('错误', '请输入用户名和密码');
      return;
    }

    try {
      // Alert.alert("deviceUniqueId=" + deviceUniqueId);
      setLoading(true);
      setSuccessMessage('登录中');

      
      // 使用设备唯一编码作为equipmentCoding
      console.log('登录参数 username',username);
      console.log('登录参数 password',password);
      console.log('登录参数 deviceUniqueId',deviceUniqueId);
      const response = await apiService.login(username, password, deviceUniqueId);
      console.log('登录返回',response);
      if (response.success) {
        // 存储登录信息
        try {
          await AsyncStorage.setItem('accessToken', response.data.accessToken);
          await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
          await AsyncStorage.setItem('tenantId', String(response.data.tenantId));
          await AsyncStorage.setItem('equipmentCoding', String(deviceUniqueId));
          // 如果有merchantId，也存储
          if (response.data.merchantId) {
            await AsyncStorage.setItem('merchantId', String(response.data.merchantId));
          }

          if (response.data.merchantAccount) {
            await AsyncStorage.setItem('merchantAccount', String(response.data.merchantAccount));
          }

          if (response.data.merchantName) {
            await AsyncStorage.setItem('merchantName', String(response.data.merchantName));
          }
          
          // 如果有userId，也存储
          if (response.data.userId) {
            await AsyncStorage.setItem('userId', String(response.data.userId));
          }
          
          console.log('登录信息已存储');
        } catch (error) {
          console.error('存储登录信息失败:', error);
        }
        
        setSuccessMessage('登录成功');
        console.log('登录成功', response.data);
      } else {
        setSuccessMessage('');
        Alert.alert('错误', response.msg || '登录失败');
      }
    } catch (error) {
      console.error('登录错误:', error);
      setSuccessMessage('');
      Alert.alert('错误', '网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView contentContainerStyle={{flexGrow: 1}}>
        <ImageBackground 
          source={require('../assets/images/login.png')}
          style={styles.backgroundImage}
        >
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Hello</Text>
            <Text style={styles.headerSubtitle}>欢迎来旅游小程序</Text>
          </View>
          
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Image 
                source={require('../assets/images/username.png')} 
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="请输入用户名"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Image 
                source={require('../assets/images/password.png')} 
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="请输入登录密码"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                placeholderTextColor="#999"
              />
              <TouchableOpacity 
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                style={styles.eyeIcon}
              >
                <Image 
                  source={isPasswordVisible ? require('../assets/images/hide.png') : require('../assets/images/look.png')} 
                  style={styles.inputIcon}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.loginButton, loading && styles.loginButtonDisabled]} 
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>商户登录</Text>
            </TouchableOpacity>
            
            {/* <TouchableOpacity style={styles.mobileLoginButton}>
              <Text style={styles.mobileLoginText}>返回手机登录</Text>
            </TouchableOpacity> */}
          </View>
        </ImageBackground>
      </ScrollView>

      {/* 成功提示弹窗 */}
      <Modal
        transparent={true}
        visible={!!successMessage}
        animationType="fade"
        onRequestClose={() => setSuccessMessage('')}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <ActivityIndicator color="#FEE726" size="large" />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  headerContainer: {
    paddingTop: 200,
    paddingHorizontal: 30,
  },
  headerTitle: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#333',
    marginTop: 5,
  },
  formContainer: {
    flex: 1,
    marginTop: 50,
    backgroundColor: '#fafafa',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 30,
    paddingTop: 50,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: 20,
    borderRadius: 30,
    paddingHorizontal: 15,
    height: 55,
  },
  inputIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 5,
  },
  loginButton: {
    backgroundColor: '#FEE926',
    marginTop: 20,
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  loginButtonDisabled: {
    backgroundColor: '#f9f3b8',
  },
  loginButtonText: {
    color: '#333',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  mobileLoginButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  mobileLoginText: {
    color: '#666',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModal: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 25,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  successText: {
    color: '#FEE726',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
  },
});
