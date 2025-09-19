package com.fwz

import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import android.util.Log

/**
 * 身份证读取React Native模块
 */
class IdCardReaderModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    companion object {
        private const val TAG = "IdCardReaderModule"
    }
    
    override fun getName(): String {
        return "IdCardReader"
    }
    
    /**
     * 开始身份证读取
     */
    @ReactMethod
    fun startIdCardReading(promise: Promise) {
        try {
            val activity = currentActivity
            if (activity is MainActivity) {
                activity.enableIdCardReaderMode()
                promise.resolve("身份证读取模式已启用")
            } else {
                promise.reject("ERROR", "Activity不可用")
            }
        } catch (e: Exception) {
            Log.e(TAG, "启用身份证读取失败", e)
            promise.reject("ERROR", e.message)
        }
    }
    
    /**
     * 停止身份证读取
     */
    @ReactMethod
    fun stopIdCardReading(promise: Promise) {
        try {
            val activity = currentActivity
            if (activity is MainActivity) {
                activity.disableIdCardReaderMode()
                promise.resolve("身份证读取模式已禁用")
            } else {
                promise.reject("ERROR", "Activity不可用")
            }
        } catch (e: Exception) {
            Log.e(TAG, "禁用身份证读取失败", e)
            promise.reject("ERROR", e.message)
        }
    }
    
    /**
     * 检查NFC是否可用
     */
    @ReactMethod
    fun checkNfcAvailable(promise: Promise) {
        try {
            val activity = currentActivity
            if (activity != null) {
                val nfcAdapter = android.nfc.NfcAdapter.getDefaultAdapter(activity)
                val result = WritableNativeMap()
                result.putBoolean("available", nfcAdapter != null)
                result.putBoolean("enabled", nfcAdapter?.isEnabled == true)
                promise.resolve(result)
            } else {
                promise.reject("ERROR", "Activity不可用")
            }
        } catch (e: Exception) {
            Log.e(TAG, "检查NFC状态失败", e)
            promise.reject("ERROR", e.message)
        }
    }
}