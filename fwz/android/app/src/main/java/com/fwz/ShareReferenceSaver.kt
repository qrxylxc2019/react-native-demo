package com.fwz

import android.content.Context
import android.preference.PreferenceManager

/**
 * 共享偏好设置工具类
 * 用于保存和读取应用配置信息
 */
object ShareReferenceSaver {
    
    /**
     * 保存字符串数据
     * @param context 上下文
     * @param key 键名
     * @param value 值
     */
    fun saveData(context: Context, key: String, value: String) {
        PreferenceManager.getDefaultSharedPreferences(context)
            .edit()
            .putString(key, value)
            .apply()
    }
    
    /**
     * 获取字符串数据
     * @param context 上下文
     * @param key 键名
     * @return 值，如果不存在则返回空字符串
     */
    fun getData(context: Context, key: String): String {
        return PreferenceManager.getDefaultSharedPreferences(context)
            .getString(key, "") ?: ""
    }
    
    /**
     * 保存布尔值数据
     * @param context 上下文
     * @param key 键名
     * @param value 值
     */
    fun saveBool(context: Context, key: String, value: Boolean) {
        PreferenceManager.getDefaultSharedPreferences(context)
            .edit()
            .putBoolean(key, value)
            .apply()
    }
    
    /**
     * 获取布尔值数据
     * @param context 上下文
     * @param key 键名
     * @return 值，如果不存在则返回false
     */
    fun getBool(context: Context, key: String): Boolean {
        return PreferenceManager.getDefaultSharedPreferences(context)
            .getBoolean(key, false)
    }
}