package com.fwz

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import android.util.Log
import java.io.File
import android.os.Build
import com.oblador.vectoricons.VectorIconsPackage

class MainApplication : Application(), ReactApplication {
  
  companion object {
    private const val TAG = "MainApplication"
  }

  // 检查设备CPU架构
  private fun checkCpuArchitecture() {
    val supportedABIs = Build.SUPPORTED_ABIS
    val primaryABI = supportedABIs.firstOrNull() ?: "unknown"
    
    Log.i(TAG, "设备支持的ABI列表: ${supportedABIs.joinToString()}")
    Log.i(TAG, "设备主要ABI: $primaryABI")
    Log.i(TAG, "是否64位CPU: ${primaryABI.contains("64")}")
    
    // 输出更多系统信息
    Log.i(TAG, "设备型号: ${Build.MODEL}")
    Log.i(TAG, "Android版本: ${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT})")
    
    // 获取应用当前运行的JNI架构
    try {
      val processArch = System.getProperty("os.arch") ?: "unknown"
      val isProcess64Bit = processArch.contains("64")
      Log.i(TAG, "应用进程架构: $processArch (${if (isProcess64Bit) "64位" else "32位"})")
      
      val appInfo = applicationContext.applicationInfo
      val nativeLibraryDir = appInfo.nativeLibraryDir ?: "unknown"
      Log.i(TAG, "应用库目录: $nativeLibraryDir")
      val is64BitApp = nativeLibraryDir.contains("64")
      Log.i(TAG, "应用是否以64位模式运行: $is64BitApp")
    } catch (e: Exception) {
      Log.e(TAG, "获取进程架构信息失败: ${e.message}")
    }
  }

  // 在初始化时加载本地库
  private fun loadNativeLibraries() {
    try {
      // 获取设备主要ABI
      val primaryABI = Build.SUPPORTED_ABIS.firstOrNull() ?: ""
      val is64Bit = primaryABI.contains("64")
      
      Log.i(TAG, "开始加载Native库... 设备架构: $primaryABI (${if (is64Bit) "64位，但将强制使用32位模式" else "32位"})")
      
      // 检查库文件目录
      val nativeLibDir = applicationContext.applicationInfo.nativeLibraryDir
      Log.i(TAG, "Native库目录: $nativeLibDir")
      
      // 列出可用的库文件
      val libDir = File(nativeLibDir)
      if (libDir.exists() && libDir.isDirectory) {
        Log.i(TAG, "库文件列表:")
        libDir.listFiles()?.forEach { file ->
          Log.i(TAG, "- ${file.name} (${file.length()} bytes)")
        }
      }
      
      // 先解除Android 10+对旧版OpenSSL库的限制(仅加载声明但不实际使用)
      // try {
      //   System.loadLibrary("nativeloader")
      //   Log.i(TAG, "加载nativeloader库")
      // } catch (e: UnsatisfiedLinkError) {
      //   Log.w(TAG, "未找到nativeloader库，继续执行: ${e.message}")
      // }
      
      // 按依赖顺序加载基础库
      System.loadLibrary("crypto")
      Log.i(TAG, "成功加载libcrypto.so")

      System.loadLibrary("ssl")
      Log.i(TAG, "成功加载libssl.so")
      
      System.loadLibrary("curl")
      Log.i(TAG, "成功加载libcurl.so")
      
      // 再加载依赖库
      System.loadLibrary("TSCrypt")
      Log.i(TAG, "成功加载libTSCrypt.so")
      
      System.loadLibrary("TSCISCONFIG")
      Log.i(TAG, "成功加载libTSCISCONFIG.so")
      
      Log.i(TAG, "MainApplication中成功加载所有Native库")
    } catch (e: UnsatisfiedLinkError) {
      Log.e(TAG, "加载Native库异常==============: ${e.message}", e)
      // 打印详细的库文件加载路径
      Log.e(TAG, "系统搜索库文件的路径: ${System.getProperty("java.library.path")}")
      e.printStackTrace()
    }
  }
  
  // 检查应用是否包含64位库文件
  // 注: 此方法保留仅作参考，当前配置已设置为仅使用32位库
  private fun checkFor64BitLibs(): Boolean {
    try {
      // 尝试检查arm64-v8a目录是否存在
      val arm64Dir = File(applicationContext.applicationInfo.nativeLibraryDir)
      val dirExists = arm64Dir.exists() && arm64Dir.isDirectory
      
      // 记录目录信息
      if (dirExists) {
        val files = arm64Dir.listFiles()
        Log.i(TAG, "64位库目录: ${arm64Dir.absolutePath}, 包含文件: ${files?.size ?: 0}")
        files?.forEach { file ->
          Log.i(TAG, "库文件: ${file.name} (${file.length()} bytes)")
        }
      } else {
        Log.w(TAG, "64位库目录不存在: ${arm64Dir.absolutePath}")
      }
      
      return dirExists
    } catch (e: Exception) {
      Log.e(TAG, "检查64位库时出错: ${e.message}")
      return false
    }
  }

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              // Packages that cannot be autolinked yet can be added manually here, for example:
              // add(MyReactNativePackage())
              add(XToastPackage())
              add(VectorIconsPackage())
              add(IdCardReaderPackage())
            }

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    checkCpuArchitecture()
    loadNativeLibraries()
    loadReactNative(this)
  }
}
