package com.fwz;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;
import com.hjq.xtoast.XToast;
import android.widget.Toast;
import android.app.Activity;
import android.util.Log;
import android.content.Intent;
import android.Manifest;
import android.content.pm.PackageManager;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.fwz.R;
import android.provider.Settings;
import java.security.MessageDigest;
import java.util.UUID;
import android.os.Build;
// 正确的导入方式
import com.tecsun.readic.BuildConfig;
import com.tecsun.readic.utils.LogUntil;
import com.tecsun.readic.ReadCard;
import android.nfc.Tag;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = "XToastModule")
public class XToastModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;
    private static final String TAG = "XToastModule";
    private static final int REQUEST_CAMERA_PERMISSION = 1001;
    private static final int REQUEST_CODE_SCAN = 2001;
    private Promise scanPromise;

    public XToastModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "XToastModule";
    }
    
    @ReactMethod
    public void isXToastAvailable(Callback callback) {
        try {
            // 简单测试XToast是否可用
            Class.forName("com.hjq.xtoast.XToast");
            callback.invoke(null, true);
        } catch (Exception e) {
            Log.e(TAG, "XToast库不可用错误: " + e.getMessage(), e);
            callback.invoke(e.getMessage(), false);
        }
    }
    
    @ReactMethod
    public void showSimpleToast(String message, int duration) {
        try {
            Activity activity = reactContext.getCurrentActivity();
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    Toast.makeText(activity, message, duration > 0 ? Toast.LENGTH_LONG : Toast.LENGTH_SHORT).show();
                });
            } else {
                Toast.makeText(reactContext, message, duration > 0 ? Toast.LENGTH_LONG : Toast.LENGTH_SHORT).show();
            }
        } catch (Exception e) {
            Log.e(TAG, "显示普通Toast错误: " + e.getMessage(), e);
        }
    }

    @ReactMethod
    public void showToast() {
        try {
            Activity activity = reactContext.getCurrentActivity();
            if (activity != null) {
                // 确保在UI线程中执行
                activity.runOnUiThread(() -> {
                    try {
                        Toast.makeText(activity, "准备显示XToast", Toast.LENGTH_SHORT).show();
                        // 使用自定义布局window_hint.xml
                        new XToast<>(activity)
                            .setDuration(1000)
                            .setContentView(R.layout.window_hint)
                            .setImageDrawable(android.R.id.icon, android.R.mipmap.sym_def_app_icon)
                            .setText(android.R.id.message, "这是一个XToast消息")
                            .show();
                    } catch (Exception e) {
                        Log.e(TAG, "XToast显示错误: " + e.getMessage(), e);
                        // 回退到使用普通Toast
                        Toast.makeText(activity, "XToast显示错误: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                    }
                });
            } else {
                Log.e(TAG, "无法获取当前活动");
                // 如果活动不可用，使用普通Toast
                Toast.makeText(reactContext, "无法获取当前活动", Toast.LENGTH_SHORT).show();
            }
        } catch (Exception e) {
            Log.e(TAG, "showToast错误: " + e.getMessage(), e);
            e.printStackTrace();
            // 如果XToast调用错误，使用普通Toast作为备选
            Toast.makeText(reactContext, "XToast调用错误: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }
    
    @ReactMethod
    public void startQRCodeScan(Promise promise) {
        Activity currentActivity = reactContext.getCurrentActivity();
        if (currentActivity == null) {
            promise.reject("E_ACTIVITY_DOES_NOT_EXIST", "Activity不存在");
            return;
        }
        
        this.scanPromise = promise;
        
        // 检查相机权限
        if (ContextCompat.checkSelfPermission(currentActivity, Manifest.permission.CAMERA) 
                != PackageManager.PERMISSION_GRANTED) {
            // 请求相机权限
            ActivityCompat.requestPermissions(currentActivity,
                    new String[]{Manifest.permission.CAMERA}, REQUEST_CAMERA_PERMISSION);
            return;
        }
        
        // 启动扫码活动
        startScanActivity();
    }
    
    private void startScanActivity() {
        try {
            Activity currentActivity = reactContext.getCurrentActivity();
            if (currentActivity != null) {
                // 启动ZXing扫码活动
                Intent intent = new Intent(currentActivity, QRScanActivity.class);
                currentActivity.startActivityForResult(intent, REQUEST_CODE_SCAN);
            } else {
                if (scanPromise != null) {
                    scanPromise.reject("E_ACTIVITY_DOES_NOT_EXIST", "Activity不存在");
                    scanPromise = null;
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "启动扫码活动错误: " + e.getMessage(), e);
            if (scanPromise != null) {
                scanPromise.reject("E_SCAN_FAILED", "启动扫码活动失败: " + e.getMessage());
                scanPromise = null;
            }
        }
    }
    
    // 处理权限请求结果
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        if (requestCode == REQUEST_CAMERA_PERMISSION) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                // 权限被授予，启动扫码
                startScanActivity();
            } else {
                // 权限被拒绝
                if (scanPromise != null) {
                    scanPromise.reject("E_PERMISSION_DENIED", "相机权限被拒绝");
                    scanPromise = null;
                }
            }
        }
    }
    
    // 处理扫码结果
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
        if (requestCode == REQUEST_CODE_SCAN) {
            if (resultCode == Activity.RESULT_OK && data != null && scanPromise != null) {
                String result = data.getStringExtra("SCAN_RESULT");
                if (result != null) {
                    scanPromise.resolve(result);
                } else {
                    scanPromise.reject("E_SCAN_CANCELLED", "未获取到扫码结果");
                }
            } else if (scanPromise != null) {
            }
            scanPromise = null;
        }
    }

    /**
     * 获取设备唯一编码
     * @param promise 用于将结果返回给React Native
     */
    @ReactMethod
    public void getDeviceUniqueId(Promise promise) {
        try {
            String uniqueId = getUniqueDeviceId();
            promise.resolve(uniqueId);
        } catch (Exception e) {
            Log.e(TAG, "获取设备唯一编码错误: " + e.getMessage(), e);
            promise.reject("E_DEVICE_ID", "获取设备唯一ID失败: " + e.getMessage());
        }
    }

    /**
     * 生成设备唯一标识符
     * 使用Android ID、设备序列号、构建信息等组合生成一个持久的唯一ID
     */
    private String getUniqueDeviceId() {
        String deviceId = "";
        
        // 尝试获取Android ID
        String androidId = Settings.Secure.getString(reactContext.getContentResolver(), Settings.Secure.ANDROID_ID);
        
        // 如果Android ID可用且不是模拟器默认ID
        if (androidId != null && !"9774d56d682e549c".equals(androidId)) {
            deviceId = androidId;
        } else {
            // 备用方案：使用设备的构建信息创建唯一ID
            deviceId = "35" + // 使用电信的IMEI前缀作为前导
                    Build.BOARD.length() % 10 +
                    Build.BRAND.length() % 10 +
                    Build.DEVICE.length() % 10 +
                    Build.DISPLAY.length() % 10 +
                    Build.HOST.length() % 10 +
                    Build.ID.length() % 10 +
                    Build.MANUFACTURER.length() % 10 +
                    Build.MODEL.length() % 10 +
                    Build.PRODUCT.length() % 10 +
                    Build.TAGS.length() % 10 +
                    Build.TYPE.length() % 10 +
                    Build.USER.length() % 10;
        }
        
        // 将ID转换为UUID格式
        try {
            byte[] data = deviceId.getBytes("UTF-8");
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(data);
            
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            
            return sb.toString();
        } catch (Exception e) {
            // 如果转换失败，返回随机UUID
            return UUID.randomUUID().toString();
        }
    }

    /**
     * 初始化参数
     * @param url URL地址
     * @param platformId 机构编号
     * @param promise 用于将结果返回给React Native
     */
    @ReactMethod
    public void initParms(String url, String platformId, Promise promise) {
        try {
            
            int result = iInitCodeParms(url, platformId);
            Log.i(TAG, "initParms执行结果: " + result);
            promise.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "初始化参数错误: " + e.getMessage(), e);
            promise.reject("E_INIT_PARAMS", e.getMessage());
        }
    }
    
    /**
     * 调用硬件接口初始化参数
     * @param url URL地址
     * @param platformId 机构编号
     * @return 返回执行结果，0表示成功
     */
    private int iInitCodeParms(String url, String platformId) {
        try {
            ReadCard readCard = new ReadCard();
            return readCard.iInitParms(url, platformId);
        } catch (Exception e) {
            Log.e(TAG, "调用iInitParms接口错误: " + e.getMessage(), e);
            return -1;
        }
    }
    
    /**
     * 电子二维码解析
     * @param qrCod 电子社保卡二维码数据
     * @param data 业务类型
     * @param promise 用于将结果返回给React Native
     */
    @ReactMethod
    public void checkESSCard(String qrCod, String data, Promise promise) {
        try {
            int result = iCheckESSCard(qrCod, data);
            String errorMsg = ReadCard.getErr();
            String resultStr = ReadCard.getOut();
            Log.i(TAG, "checkESSCard执行结果: " + result + ", 错误信息: " + errorMsg + ", 结果信息: " + resultStr);
            
            com.facebook.react.bridge.WritableMap resultMap = new com.facebook.react.bridge.WritableNativeMap();
            resultMap.putInt("resultCode", result);
            resultMap.putString("errorMsg", errorMsg);
            resultMap.putString("resultStr", resultStr);
            // 提取身份证号（社会保障号码，第二个字段）
            try {
                if (resultStr != null && !resultStr.isEmpty()) {
                    String[] fields = resultStr.split("\\|");
                    if (fields.length > 1) {
                        String idNo = fields[3].trim();
                        resultMap.putString("idNo", idNo);
                        Log.i(TAG, "提取的身份证号: " + idNo);
                    }
                }
            } catch (Exception e) {
                Log.e(TAG, "提取身份证号错误: " + e.getMessage(), e);
            }
            promise.resolve(resultMap);
        } catch (Exception e) {
            Log.e(TAG, "电子二维码解析错误: " + e.getMessage(), e);
            promise.reject("E_CHECK_ESS_CARD", "电子二维码解析错误: " + e.getMessage());
        }
    }
    
    /**
     * 调用硬件接口进行电子二维码解析
     * @param qrCod 电子社保卡二维码数据
     * @param data 业务类型（01 业务查询，02 缴费支付，03 其他，04 异地就医）
     * @return 返回执行结果，0表示成功
     */
    private int iCheckESSCard(String qrCod, String data) {
        try {
            // 调用硬件接口
            ReadCard readCard = new ReadCard();
            Log.i(TAG, "iCheckESSCard: " + qrCod + "   " + data);
            int result = readCard.iCheckESSCard(qrCod, data);
            Log.i(TAG, "错误信息：" +  ReadCard.getErr());  
            return result;
        } catch (Exception e) {
            Log.e(TAG, "调用iCheckESSCard接口错误: " + e.getMessage(), e);
            return -1;
        }
    }

    /**
     * 读取实体社保卡基本信息
     * @param tag NFC标签对象
     * @param iType 操作卡的类型：1-接触式操作卡；2-非接触式操作卡；3-自动寻卡，接触式操作卡优先；4-自动寻卡，非接触式操作卡优先
     * @param sceneCode 场景编码
     * @param promise 用于将结果返回给React Native
     */
    @ReactMethod
    public void readCardInfo(int iType, String sceneCode, Promise promise) {
        try {
            // 由于React Native无法直接传递Tag对象，这里我们传null，实际应用中可能需要通过NFC Manager获取
            Tag tag = null;
            Log.i(TAG, "readCardInfo执行结果: " + iType + ", 场景编码: " + sceneCode);  
            int result = iReadCardBas(tag, iType, sceneCode);
            String errorMsg = ReadCard.getErr();
            String resultStr = ReadCard.getOut();
            
            Log.i(TAG, "readCardInfo执行结果: " + result + ", 错误信息: " + errorMsg + ", 结果信息: " + resultStr);
            
            com.facebook.react.bridge.WritableMap resultMap = new com.facebook.react.bridge.WritableNativeMap();
            resultMap.putInt("resultCode", result);
            resultMap.putString("errorMsg", errorMsg);
            resultMap.putString("data", resultStr);
            
            // 解析返回的数据
            if (result == 0 && resultStr != null && !resultStr.isEmpty()) {
                try {
                    String[] fields = resultStr.split("\\|");
                    
                    if (fields.length > 9) {
                        resultMap.putString("areaCode", fields[0]); // 发卡地区行政区划代码
                        resultMap.putString("socialSecurityNumber", fields[1]); // 社会保障号码
                        resultMap.putString("cardNumber", fields[2]); // 卡号
                        resultMap.putString("identityNumber", fields[3]); // 身份证号
                        resultMap.putString("name", fields[4]); // 姓名
                        // 更多字段可以根据需要解析
                    }
                } catch (Exception e) {
                    Log.e(TAG, "解析社保卡数据错误: " + e.getMessage(), e);
                }
            }
            
            promise.resolve(resultMap);
        } catch (Exception e) {
            Log.e(TAG, "读取社保卡信息错误: " + e.getMessage(), e);
            promise.reject("E_READ_CARD", "读取社保卡信息错误: " + e.getMessage());
        }
    }
    
    /**
     * 调用硬件接口读取实体社保卡基本信息
     * @param tag NFC标签对象
     * @param iType 操作卡的类型：1-接触式操作卡；2-非接触式操作卡；3-自动寻卡，接触式操作卡优先；4-自动寻卡，非接触式操作卡优先
     * @param sceneCode 场景编码
     * @return 返回执行结果，0表示成功
     */
    private int iReadCardBas(Tag tag, int iType, String sceneCode) {
        try {
            ReadCard readCard = new ReadCard();
            return readCard.iReadCardBas(tag, iType, sceneCode);
        } catch (Exception e) {
            Log.e(TAG, "调用iReadCardBas接口错误: " + e.getMessage(), e);
            return -1;
        }
    }

    /**
     * 设置当前读卡类型
     * @param cardType 读卡类型：1-社保卡，2-身份证
     * @param promise 用于将结果返回给React Native
     */
    @ReactMethod
    public void setCardType(int cardType, Promise promise) {
        try {
            Activity currentActivity = reactContext.getCurrentActivity();
            if (currentActivity instanceof MainActivity) {
                MainActivity mainActivity = (MainActivity) currentActivity;
                mainActivity.setCurrentCardType(cardType);
                Log.d(TAG, "设置读卡类型: " + cardType);
                promise.resolve("设置成功");
            } else {
                Log.e(TAG, "无法获取MainActivity实例");
                promise.reject("E_ACTIVITY_ERROR", "无法获取MainActivity实例");
            }
        } catch (Exception e) {
            Log.e(TAG, "设置读卡类型错误: " + e.getMessage(), e);
            promise.reject("E_SET_CARD_TYPE", "设置读卡类型错误: " + e.getMessage());
        }
    }
} 