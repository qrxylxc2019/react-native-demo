#!/usr/bin/env node

/**
 * 身份证读取功能集成测试脚本
 * 检查所有必要的文件和配置是否正确
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 开始检查身份证读取功能集成...\n');

const checks = [
  {
    name: 'AAR库文件',
    path: 'android/app/libs/srreaderapi-4.01.01_20_release.aar',
    required: true
  },
  {
    name: 'MainActivity.kt',
    path: 'android/app/src/main/java/com/fwz/MainActivity.kt',
    required: true,
    contains: ['IdCardReaderHelper', 'initIdCardReader', 'handleIdCardMessage']
  },
  {
    name: 'IdCardReaderModule.kt',
    path: 'android/app/src/main/java/com/fwz/IdCardReaderModule.kt',
    required: true
  },
  {
    name: 'IdCardReaderPackage.kt',
    path: 'android/app/src/main/java/com/fwz/IdCardReaderPackage.kt',
    required: true
  },
  {
    name: 'GuidUtils.kt',
    path: 'android/app/src/main/java/com/fwz/GuidUtils.kt',
    required: true
  },
  {
    name: 'ShareReferenceSaver.kt',
    path: 'android/app/src/main/java/com/fwz/ShareReferenceSaver.kt',
    required: true
  },
  {
    name: 'RequestPermissionUtil.kt',
    path: 'android/app/src/main/java/com/fwz/RequestPermissionUtil.kt',
    required: true
  },
  {
    name: 'MainApplication.kt',
    path: 'android/app/src/main/java/com/fwz/MainApplication.kt',
    required: true,
    contains: ['IdCardReaderPackage']
  },
  {
    name: 'AndroidManifest.xml',
    path: 'android/app/src/main/AndroidManifest.xml',
    required: true,
    contains: ['android.permission.NFC', 'android.hardware.nfc', 'android.hardware.usb.host']
  },
  {
    name: 'TypeScript接口',
    path: 'api/IdCardReader.ts',
    required: true
  },
  {
    name: '演示组件',
    path: 'components/IdCardReaderDemo.tsx',
    required: true
  },
  {
    name: '导航类型定义',
    path: 'navigation/types.ts',
    required: true,
    contains: ['idcard-demo']
  },
  {
    name: 'App.tsx',
    path: 'App.tsx',
    required: true,
    contains: ['IdCardReaderDemo', 'idcard-demo']
  },
  {
    name: '主页面',
    path: 'app/index.tsx',
    required: true,
    contains: ['身份证读取演示', 'idcard-demo']
  }
];

let passCount = 0;
let failCount = 0;

checks.forEach((check, index) => {
  const filePath = path.join(process.cwd(), check.path);
  const exists = fs.existsSync(filePath);
  
  if (!exists) {
    if (check.required) {
      console.log(`❌ ${check.name}: 文件不存在 (${check.path})`);
      failCount++;
    } else {
      console.log(`⚠️  ${check.name}: 可选文件不存在 (${check.path})`);
    }
    return;
  }
  
  // 检查文件内容
  if (check.contains) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const missingItems = check.contains.filter(item => !content.includes(item));
      
      if (missingItems.length > 0) {
        console.log(`❌ ${check.name}: 缺少必要内容 - ${missingItems.join(', ')}`);
        failCount++;
        return;
      }
    } catch (error) {
      console.log(`❌ ${check.name}: 读取文件失败 - ${error.message}`);
      failCount++;
      return;
    }
  }
  
  console.log(`✅ ${check.name}: 检查通过`);
  passCount++;
});

console.log(`\n📊 检查结果:`);
console.log(`✅ 通过: ${passCount}`);
console.log(`❌ 失败: ${failCount}`);

if (failCount === 0) {
  console.log(`\n🎉 身份证读取功能集成检查全部通过！`);
  console.log(`\n📝 下一步操作:`);
  console.log(`1. 运行 'npx react-native run-android' 编译应用`);
  console.log(`2. 在应用中点击"身份证读取演示"测试功能`);
  console.log(`3. 将身份证贴近设备NFC区域进行测试`);
  console.log(`\n📖 详细文档请查看: docs/IdCardReader.md`);
} else {
  console.log(`\n⚠️  发现 ${failCount} 个问题，请检查并修复后重新运行测试`);
  process.exit(1);
}