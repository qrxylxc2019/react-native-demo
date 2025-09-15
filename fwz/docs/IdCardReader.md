# 身份证读取功能集成说明

## 概述

本项目已成功集成身份证NFC读取功能，基于 `srreaderapi-4.01.01_20_release.aar` 库实现。该功能与现有的社保卡NFC功能并行运行，互不干扰。

## 功能特性

- ✅ 支持标准身份证读取
- ✅ 支持外国人身份证读取 (idType: "I")
- ✅ 支持港澳台身份证读取 (idType: "J")
- ✅ 自动提取身份证照片
- ✅ 完整的错误处理机制
- ✅ React Native接口封装
- ✅ 与现有NFC功能兼容

## 文件结构

```
android/app/src/main/java/com/fwz/
├── MainActivity.kt                 # 主Activity，包含身份证读取逻辑
├── IdCardReaderModule.kt          # React Native模块
├── IdCardReaderPackage.kt         # 模块包
├── GuidUtils.kt                   # GUID工具类
├── ShareReferenceSaver.kt         # SharedPreferences工具类
└── RequestPermissionUtil.kt       # 权限请求工具类

api/
└── IdCardReader.ts                # TypeScript接口定义

components/
└── IdCardReaderDemo.tsx           # 演示组件

docs/
└── IdCardReader.md               # 本文档
```

## 权限配置

已在 `AndroidManifest.xml` 中添加必要权限：

```xml
<uses-permission android:name="android.permission.NFC" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.CHANGE_NETWORK_STATE" />
<uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />

<uses-feature android:name="android.hardware.nfc" android:required="false" />
<uses-feature android:name="android.hardware.usb.host" />
```

## 使用方法

### 1. JavaScript/TypeScript 接口

```typescript
import IdCardReader from '../api/IdCardReader';

// 检查NFC状态
const nfcStatus = await IdCardReader.checkNfcStatus();
console.log('NFC可用:', nfcStatus.available);
console.log('NFC已启用:', nfcStatus.enabled);

// 开始读取身份证
await IdCardReader.startReading();

// 监听读取事件
const listener = IdCardReader.addListener((event) => {
  switch (event.status) {
    case 'idcard_start':
      console.log('开始读取身份证');
      break;
    case 'idcard_success':
      console.log('读取成功:', event);
      // 处理身份证信息
      break;
    case 'idcard_error':
      console.log('读取失败:', event.errorInfo);
      break;
  }
});

// 停止读取
await IdCardReader.stopReading();

// 清理监听器
IdCardReader.removeListener(listener);
```

### 2. 身份证信息结构

```typescript
interface IdCardInfo {
  name: string;           // 姓名
  gender: string;         // 性别
  nation: string;         // 民族
  birthday: string;       // 出生日期 (YYYYMMDD)
  address: string;        // 住址
  idNum: string;          // 身份证号
  issueOrg: string;       // 签发机关
  effectDate: string;     // 生效日期
  expireDate: string;     // 失效日期
  photo?: string;         // Base64编码的照片
  idType?: string;        // 身份证类型 ("I"=外国人, "J"=港澳台)
  
  // 外国人身份证特有字段
  nationality?: string;   // 国籍
  englishName?: string;   // 英文姓名
  
  // 港澳台身份证特有字段
  signCount?: string;     // 签发次数
  passNum?: string;       // 通行证号
  
  // 普通身份证特有字段
  dn?: string;           // DN信息
}
```

### 3. 演示页面

应用中已包含完整的演示页面，可通过主页面的"身份证读取演示"按钮访问。

## 技术实现

### 1. SDK配置

```kotlin
// 初始化身份证读取SDK
CommonUtil.getInstance().setAppKey("BB86ED1828594FE7B232C18AB71209B2")
CommonUtil.getInstance().setAppSecret("1CF9517C4B52434D997D2475E580C617")
CommonUtil.getInstance().setPassword("4EBF7F338A914EA9861B5979FD920AFA")
CommonUtil.getInstance().initReaderType(ReaderType.NFC)
```

### 2. NFC回调处理

```kotlin
private fun initIdCardNfcCallback() {
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
    idCardNfcCallback = NfcAdapter.ReaderCallback { tag ->
      if (!isIdCardReading) {
        isIdCardReading = true
        hasTag = 1
        val message = Message()
        message.what = ID_CARD_NFC_START
        message.obj = tag
        idCardHandler?.sendMessage(message)
      }
    }
  }
}
```

### 3. 读取流程

1. 用户调用 `startReading()` 启用NFC读取模式
2. 当检测到NFC标签时，触发回调函数
3. 验证标签是否为有效身份证
4. 生成业务流水号并调用SDK读取
5. 解析返回的JSON数据
6. 通过事件发送给React Native层

## 错误处理

常见错误及处理：

- **设备不支持NFC**: 检查 `nfcStatus.available`
- **NFC未启用**: 检查 `nfcStatus.enabled`，提示用户启用
- **不是有效身份证**: SDK验证失败，提示重新放置
- **读取超时**: 网络或服务器问题，重试或检查网络
- **解析失败**: 身份证数据损坏或格式异常

## 与现有功能的兼容性

- ✅ 与社保卡NFC读取功能完全兼容
- ✅ 使用不同的NFC适配器实例避免冲突
- ✅ 独立的事件处理机制
- ✅ 不影响现有的扫码和刷卡功能

## 注意事项

1. **权限要求**: 确保应用已获得NFC和存储权限
2. **设备兼容**: 需要Android 4.4+且支持NFC的设备
3. **网络要求**: 身份证解密需要网络连接
4. **证件要求**: 仅支持二代身份证，不支持一代身份证
5. **放置方式**: 身份证需要贴近设备NFC区域，通常在设备背面

## 调试信息

可通过以下日志标签查看调试信息：

- `MainActivity`: 主要功能日志
- `IdCardReaderModule`: React Native模块日志
- `SunriseDemo`: SDK内部日志

## 更新历史

- **v1.0.0**: 初始版本，基本身份证读取功能
- **v1.1.0**: 添加外国人和港澳台身份证支持
- **v1.2.0**: 完善错误处理和React Native接口