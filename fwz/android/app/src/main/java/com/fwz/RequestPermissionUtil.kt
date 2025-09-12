package com.fwz

import android.app.Activity
import android.content.pm.PackageManager
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

/**
 * 权限请求工具类
 */
object RequestPermissionUtil {
    private const val REQUEST_CODE = 1001
    
    /**
     * 请求权限
     */
    fun request(activity: Activity, permissions: Array<String>) {
        val needRequestPermissions = mutableListOf<String>()
        
        for (permission in permissions) {
            if (ContextCompat.checkSelfPermission(activity, permission) != PackageManager.PERMISSION_GRANTED) {
                needRequestPermissions.add(permission)
            }
        }
        
        if (needRequestPermissions.isNotEmpty()) {
            ActivityCompat.requestPermissions(
                activity,
                needRequestPermissions.toTypedArray(),
                REQUEST_CODE
            )
        }
    }
}