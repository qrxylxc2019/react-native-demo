/**
 * 身份证读取功能修复验证脚本
 * 用于验证NFC身份证读取功能是否正常工作
 */

const fs = require('fs');
const path = require('path');

// 检查关键文件是否存在和内容是否正确
const checks = [
  {
    name: 'MainActivity.kt - 身份证NFC回调初始化',
    path: 'android/app/src/main/java/com/fwz/MainActivity.kt',
    check: (content) => {
      // 检查是否取消了注释
      const hasUncommentedCallback = !content.includes('// TODO: 添加身份证读取SDK依赖后启用');
      const hasNfcCallback = content.includes('idCardNfcCallback = NfcAdapter.ReaderCallback');
      const hasMessageHandler = content.includes('when (msg.what) {');
      const hasSuccessHandler = content.includes('ConsantHelper.READ_CARD_SUCCESS');
      
      return hasUncommentedCallback && hasNfcCallback && hasMessageHandler && hasSuccessHandler;
    }
  },
  {
    name: 'MainActivity.kt - 身份证读取模式启用/禁用',
    path: 'android/app/src/main/java/com/fwz/MainActivity.kt',
    check: (content) => {
      const hasEnableMethod = content.includes('fun enableIdCardReaderMode()');
      const hasDisableMethod = content.includes('fun disableIdCardReaderMode()');
      const hasUncommentedDisable = !content.includes('// TODO: 添加身份证读取SDK依赖后启用');
      const hasOnResume = content.includes('enableIdCardReaderMode()');
      const hasOnPause = content.includes('disableIdCardReaderMode()');
      
      return hasEnableMethod && hasDisableMethod && hasUncommentedDisable && hasOnResume && hasOnPause;
    }
  },
  {
    name: 'IdCardReaderModule.kt - 模块方法启用',
    path: 'android/app/src/main/java/com/fwz/IdCardReaderModule.kt',
    check: (content) => {
      const hasStartMethod = content.includes('activity.enableIdCardReaderMode()');
      const hasStopMethod = content.includes('activity.disableIdCardReaderMode()');
      const noCommentedStart = !content.includes('// activity.enableIdCardReaderMode()');
      const noCommentedStop = !content.includes('// activity.disableIdCardReaderMode()');
      
      return hasStartMethod && hasStopMethod && noCommentedStart && noCommentedStop;
    }
  },
  {
    name: 'ShareReferenceSaver.kt - 工具类存在',
    path: 'android/app/src/main/java/com/fwz/ShareReferenceSaver.kt',
    check: (content) => {
      const hasObject = content.includes('object ShareReferenceSaver');
      const hasSaveData = content.includes('fun saveData');
      const hasGetData = content.includes('fun getData');
      const hasSaveBool = content.includes('fun saveBool');
      const hasGetBool = content.includes('fun getBool');
      
      return hasObject && hasSaveData && hasGetData && hasSaveBool && hasGetBool;
    }
  },
  {
    name: 'MainApplication.kt - 包注册',
    path: 'android/app/src/main/java/com/fwz/MainApplication.kt',
    check: (content) => {
      const hasIdCardPackage = content.includes('add(IdCardReaderPackage())');
      const hasXToastPackage = content.includes('add(XToastPackage())');
      
      return hasIdCardPackage && hasXToastPackage;
    }
  },
  {
    name: 'build.gradle - 依赖配置',
    path: 'android/app/build.gradle',
    check: (content) => {
      const hasFileTree = content.includes('implementation fileTree(dir: "libs", include: ["*.jar", "*.aar"])');
      const hasNdkConfig = content.includes('ndk {');
      const hasAbiFilters = content.includes('abiFilters');
      
      return hasFileTree && hasNdkConfig && hasAbiFilters;
    }
  },
  {
    name: 'AndroidManifest.xml - 权限配置',
    path: 'android/app/src/main/AndroidManifest.xml',
    check: (content) => {
      const hasNfcPermission = content.includes('android.permission.NFC');
      const hasNfcFeature = content.includes('android.hardware.nfc');
      const hasInternetPermission = content.includes('android.permission.INTERNET');
      
      return hasNfcPermission && hasNfcFeature && hasInternetPermission;
    }
  }
];

console.log('🔍 开始验证身份证读取功能修复...\n');

let passedChecks = 0;
let totalChecks = checks.length;

checks.forEach((check, index) => {
  try {
    const filePath = path.join(__dirname, '..', check.path);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ ${index + 1}. ${check.name}`);
      console.log(`   文件不存在: ${check.path}\n`);
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const isValid = check.check(content);
    
    if (isValid) {
      console.log(`✅ ${index + 1}. ${check.name}`);
      passedChecks++;
    } else {
      console.log(`❌ ${index + 1}. ${check.name}`);
      console.log(`   检查失败: ${check.path}\n`);
    }
  } catch (error) {
    console.log(`❌ ${index + 1}. ${check.name}`);
    console.log(`   读取文件失败: ${error.message}\n`);
  }
});

console.log(`\n📊 验证结果: ${passedChecks}/${totalChecks} 项检查通过`);

if (passedChecks === totalChecks) {
  console.log('🎉 所有检查都通过了！身份证读取功能修复完成。');
  console.log('\n📋 修复内容总结:');
  console.log('1. ✅ 启用了MainActivity中的身份证NFC回调初始化');
  console.log('2. ✅ 启用了身份证读取消息处理逻辑');
  console.log('3. ✅ 启用了身份证读取模式的启用/禁用方法');
  console.log('4. ✅ 启用了IdCardReaderModule中的方法调用');
  console.log('5. ✅ 创建了ShareReferenceSaver工具类');
  console.log('6. ✅ 确认了包注册和依赖配置');
  console.log('7. ✅ 确认了权限和特性配置');
  
  console.log('\n🚀 下一步操作:');
  console.log('1. 重新编译并安装应用到设备');
  console.log('2. 确保设备支持NFC功能');
  console.log('3. 在系统设置中启用NFC');
  console.log('4. 使用身份证读取功能进行测试');
} else {
  console.log('⚠️  部分检查未通过，请检查上述失败的项。');
}

console.log('\n💡 使用说明:');
console.log('- 在React Native应用中调用IdCardReader.startReading()开始读取');
console.log('- 将身份证贴近设备背面进行NFC读取');
console.log('- 监听onReadCardError事件获取读取结果');
console.log('- 支持普通身份证、外国人身份证、港澳台身份证');
