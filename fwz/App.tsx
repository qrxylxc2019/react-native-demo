/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'react-native';

// 导入页面组件
import Login from './app/login';
import Home from './app/index';
import OrderQuery from './app/order-query';
import VerificationResult from './app/verification-result';
import VerificationList from './app/verification-list';
import OrderDetail from './app/order-detail';
import WaitingCard from './app/waiting-card';
import IdCardReaderDemo from './components/IdCardReaderDemo';

// 导入类型定义
import { RootStackParamList } from './navigation/types';

// 创建导航栈
const Stack = createNativeStackNavigator<RootStackParamList>();

function App() {
  return (
    <NavigationContainer>
      <StatusBar backgroundColor="#1890ff" barStyle="light-content" />
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="order-query" component={OrderQuery} />
        <Stack.Screen name="verification-result" component={VerificationResult} />
        <Stack.Screen name="verification-list" component={VerificationList} />
        <Stack.Screen name="order-detail" component={OrderDetail} />
        <Stack.Screen name="waiting-card" component={WaitingCard} />
        <Stack.Screen name="idcard-demo" component={IdCardReaderDemo} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
