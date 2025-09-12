package com.fwz

import android.content.Context
import android.content.SharedPreferences

/**
 * SharedPreferences工具类
 */
object ShareReferenceSaver {
    
    private const val PREF_NAME = "app_preferences"
    
    /**
     * 保存布尔值
     */
    fun saveBool(context: Context, key: String, value: Boolean) {
        val prefs: SharedPreferences = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        val editor = prefs.edit()
        editor.putBoolean(key, value)
        editor.apply()
    }
    
    /**
     * 保存字符串
     */
    fun saveData(context: Context, key: String, value: String) {
        val prefs: SharedPreferences = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        val editor = prefs.edit()
        editor.putString(key, value)
        editor.apply()
    }
    
    /**
     * 获取布尔值
     */
    fun getBool(context: Context, key: String, defaultValue: Boolean = false): Boolean {
        val prefs: SharedPreferences = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        return prefs.getBoolean(key, defaultValue)
    }
    
    /**
     * 获取字符串
     */
    fun getData(context: Context, key: String, defaultValue: String = ""): String {
        val prefs: SharedPreferences = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        return prefs.getString(key, defaultValue) ?: defaultValue
    }
}