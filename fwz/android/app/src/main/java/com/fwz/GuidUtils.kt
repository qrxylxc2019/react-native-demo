package com.fwz

import java.util.*

/**
 * GUID工具类
 */
class GuidUtils private constructor() {
    
    private var currentId: String = ""
    
    companion object {
        @Volatile
        private var INSTANCE: GuidUtils? = null
        
        fun getInstance(): GuidUtils {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: GuidUtils().also { INSTANCE = it }
            }
        }
    }
    
    /**
     * 生成新的随机ID
     */
    fun newRandom() {
        currentId = UUID.randomUUID().toString().replace("-", "")
    }
    
    /**
     * 获取当前ID
     */
    fun getCurrentId(): String {
        return currentId
    }
}