package com.fwz

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import android.os.Bundle
import android.content.pm.PackageManager
import com.facebook.react.ReactApplication
import android.util.Log
import android.os.Environment
import android.nfc.NfcAdapter
import android.nfc.Tag
import android.widget.Toast
import com.tecsun.jni.TSCISCONFIG
import com.tecsun.readic.ReadCard
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import android.os.Build
import android.Manifest
import android.os.Handler
import android.os.Message
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import org.json.JSONObject
import org.json.JSONException
import sunrise.api.CommonUtil
import sunrise.api.ReaderType
import sunrise.nfc.SRnfcCardReader
import com.sunrise.reader.IDecodeIDServerListener
import com.sunrizetech.idhelper.ConsantHelper

class MainActivity : ReactActivity() {
  
  // NFC 相关变量
  private var nfcAdapter: NfcAdapter? = null
  
  // 身份证读取相关变量
  private var idCardNfcAdapter: NfcAdapter? = null
  private var IdCardReaderHelper: SRnfcCardReader? = null
  private var idCardHandler: Handler? = null
  private var idCardNfcCallback: NfcAdapter.ReaderCallback? = null
  private var isIdCardReading = false
  private var hasTag = 0
  
  companion object {
    private const val TAG = "MainActivity"
    private const val ID_CARD_NFC_START = 52
    private const val ID_CARD_SERVER_TV = 5555
    
    // 在类加载时加载本地库
    init {
    }
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "fwz"

  /**
   * 添加对 react-native-screens 的支持
   */
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    // 请求权限
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      RequestPermissionUtil.request(this, arrayOf(
        Manifest.permission.READ_PHONE_STATE,
        Manifest.permission.READ_EXTERNAL_STORAGE,
        Manifest.permission.WRITE_EXTERNAL_STORAGE,
        Manifest.permission.NFC,
        Manifest.permission.ACCESS_FINE_LOCATION
      ))
    }
    
    // 初始化 TSCISCONFIG
    try {
      val strLibVer = TSCISCONFIG.GetLibVer()
      Log.d(TAG, strLibVer)
      
      val strLogDir = Environment.getExternalStorageDirectory().absolutePath
      TSCISCONFIG.iInitTSLOG(strLogDir.toByteArray(), 4)
      TSCISCONFIG.TSLOG_NORMAL(strLogDir)
      Log.d(TAG, "TSCISCONFIG 初始化成功: $strLogDir")
    } catch (e: Exception) {
      Log.e(TAG, "TSCISCONFIG 初始化失败", e)
    }
    
    // 初始化身份证读取功能
    initIdCardReader() 
    Log.d(TAG, "MainActivity 初始化完成")



  }

  /**
   * Returns the instance of the [ReactActivityDelegate]. Here we use a util class [DefaultReactActivityDelegate]
   * which allows you to easily enable Fabric and Concurrent React (aka React 18) with two boolean flags.
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
      
  /**
   * 启用NFC读卡模式
   */
  fun enableReaderMode() {
    nfcAdapter = NfcAdapter.getDefaultAdapter(this)
    
    if (nfcAdapter == null) {
      Toast.makeText(this, "设备不支持NFC", Toast.LENGTH_SHORT).show()
      return
    }
    
    if (nfcAdapter?.isEnabled != true) {
      Toast.makeText(this, "请在系统设置中先启用NFC功能", Toast.LENGTH_SHORT).show()
      return
    }
    
    val options = Bundle().apply {
      putInt(NfcAdapter.EXTRA_READER_PRESENCE_CHECK_DELAY, 300)
    }
    
    val readerFlags = NfcAdapter.FLAG_READER_NFC_B or 
                     NfcAdapter.FLAG_READER_NFC_V or
                     NfcAdapter.FLAG_READER_NFC_F or 
                     NfcAdapter.FLAG_READER_NFC_A or
                     NfcAdapter.FLAG_READER_NFC_BARCODE
    
    nfcAdapter?.enableReaderMode(this, { tag ->
      runOnUiThread {
        // 通过NFC Tag 获取社保卡信息
        try {
          Log.d(TAG, "获取到tag = $tag")
          // 发送开始状态
          val startParams: WritableMap = WritableNativeMap()
          startParams.putString("status", "start")
          val readCard = ReadCard()
          Log.d(TAG, "readCard")
          // 先调用iInitParms进行初始化
          val url = "https://qyykt.e-tecsun.com/prod-api/outInterface/api/r0/doPost"
          val platformId = "gdly"
          val initResult = readCard.iInitParms(url, platformId)
          
          Log.i(TAG, "iInitParms初始化成功 initResult = $initResult")

          val iType = 2 // 非接触式操作卡
          val sceneCode = "000001"
          
          
          
          sendErrorInfoToJS(startParams)
          
          val result = readCard.iReadCardBas(tag, iType, sceneCode)
          Log.d(TAG, "NFC卡片读取, ReadCardInfo return: $result")
          
          // 获取错误信息和输出结果
          val errorInfo = ReadCard.getErr()
          Log.d(TAG, "读卡错误信息 (getErr): $errorInfo")
          
          // 获取错误信息和输出结果
          val resultInfo = ReadCard.getOut()
          Log.d(TAG, "读卡信息 (getOut): $resultInfo")

          // 发送结果状态
          val resultParams: WritableMap = WritableNativeMap()
          resultParams.putString("status", "result")
          resultParams.putString("errorInfo", errorInfo ?: "")
          resultParams.putString("resultInfo", resultInfo ?: "")
          resultParams.putInt("resultCode", result)
          sendErrorInfoToJS(resultParams)
          
          // 可以在这里添加更多的卡片读取逻辑
          // 比如通过 React Native Bridge 将结果传递给 JS 层
          
        } catch (e: Exception) {
          Log.e(TAG, "NFC读卡失败", e)
        }
      }
    }, readerFlags, options)
  }
  
  /**
   * 禁用NFC读卡模式
   */
  fun disableReaderMode() {
    nfcAdapter?.disableReaderMode(this)
  }
  

  
  /**
   * 处理权限请求结果
   */
  override fun onRequestPermissionsResult(
    requestCode: Int,
    permissions: Array<String>,
    grantResults: IntArray
  ) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults)
    
    // 获取XToastModule实例
    val reactInstanceManager = (application as ReactApplication).reactNativeHost.reactInstanceManager
    val reactContext = reactInstanceManager.currentReactContext
    
    if (reactContext != null) {
      val modules = reactContext.getNativeModule(XToastModule::class.java)
      modules?.onRequestPermissionsResult(requestCode, permissions, grantResults)
    }
  }
  
  /**
   * 将错误信息发送到JS层
   */
  private fun sendErrorInfoToJS(params: WritableMap) {
    try {
      val reactInstanceManager = (application as ReactApplication).reactNativeHost.reactInstanceManager
      val reactContext = reactInstanceManager.currentReactContext
      
      if (reactContext != null) {
        // 添加时间戳
        params.putLong("timestamp", System.currentTimeMillis())
        
        // 在发送前记录日志（不能在发送后记录，因为对象会被消费）
        val status = if (params.hasKey("status")) params.getString("status") else "unknown"
        Log.d(TAG, "准备发送信息到JS层: status=$status")
        
        reactContext
          .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
          .emit("onReadCardError", params)
          
        Log.d(TAG, "信息已成功发送到JS层")
      } else {
        Log.w(TAG, "ReactContext为空，无法发送信息到JS层")
      }
    } catch (e: Exception) {
      Log.e(TAG, "发送信息到JS层失败", e)
    }
  }
  

  private fun initIdCardReader() {
    try {
      CommonUtil.getInstance().setAppKey("BB86ED1828594FE7B232C18AB71209B2")
      CommonUtil.getInstance().setAppSecret("1CF9517C4B52434D997D2475E580C617")
      CommonUtil.getInstance().setPassword("4EBF7F338A914EA9861B5979FD920AFA")
      CommonUtil.getInstance().initReaderType(ReaderType.NFC)
      
      idCardHandler = object : Handler(mainLooper) {
        override fun handleMessage(msg: Message) {
          Log.d(TAG, "Handler收到消息: ${msg}")
          handleIdCardMessage(msg)
        }
      }
      
      IdCardReaderHelper = SRnfcCardReader(idCardHandler, this)
      initIdCardNfcCallback()
      Log.d(TAG, "NFC回调初始化完成")
      
      // 设置解密服务器监听
      IdCardReaderHelper?.setDecodeServerListener(object : IDecodeIDServerListener {
        override fun getThisServer(ip: String?, port: Int) {
          Log.d(TAG, "获取解密服务器信息: $ip:$port")
          // 可以在这里处理服务器信息
        }
        
        override fun getThisServer(ip: String?, port: Int, recouunt: Int) {
          Log.d(TAG, "身份证解密服务器: $ip:$port, 重连次数: $recouunt")
        }
      })
      
      Log.d(TAG, "身份证读取功能初始化成功")
    } catch (e: Exception) {
      Log.e(TAG, "身份证读取功能初始化失败", e)
    }
  }
  
  /**
   * 初始化身份证NFC回调
   */
  private fun initIdCardNfcCallback() {
    Log.d(TAG, "开始初始化身份证NFC回调")
    Log.d(TAG, "检查Android版本: ${Build.VERSION.SDK_INT}")
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
      Log.d(TAG, "Android版本支持NFC，创建ReaderCallback")
      idCardNfcCallback = NfcAdapter.ReaderCallback { tag ->
        Log.d(TAG, "NFC标签检测到: $tag")
        if (!isIdCardReading) {
          Log.d(TAG, "开始身份证流程")
          isIdCardReading = true
          hasTag = 1
          val message = Message()
          message.what = ID_CARD_NFC_START
          message.obj = tag
          Log.d(TAG, "发送NFC开始消息到Handler")
          idCardHandler?.sendMessage(message)
        } else {
          Log.d(TAG, "身份证正在读取中，忽略新的NFC标签")
        }
      }
      Log.d(TAG, "NFC ReaderCallback创建完成")
    } else {
      Log.w(TAG, "Android版本不支持NFC ReaderCallback")
    }
    Log.d(TAG, "身份证NFC回调初始化完成")
  }
  
  /**
   * 处理身份证读取消息
   */
  private fun handleIdCardMessage(msg: Message) {
    Log.d(TAG, "处理身份证读取消息: what=${msg.what}")
    when (msg.what) {
      ConsantHelper.READ_CARD_SUCCESS -> {
        Log.d(TAG, "身份证读取成功")
        handleIdCardSuccess(msg.obj as String)
        isIdCardReading = false
        Log.d(TAG, "身份证读取状态重置为false")
      }
      
      ID_CARD_NFC_START -> {
        Log.d(TAG, "开始处理NFC身份证读取")
        val startParams: WritableMap = WritableNativeMap()
        startParams.putString("status", "idcard_start")
        startParams.putString("type", "idcard")
        Log.d(TAG, "发送身份证开始读取事件到JS")
        sendErrorInfoToJS(startParams)
        
        Log.d(TAG, "检查标签状态: hasTag=$hasTag")
        if (hasTag > 0) {
          if (hasTag == 1) {
            Log.d(TAG, "验证NFC标签是否为身份证")
            if (IdCardReaderHelper?.isNFC(msg.obj as Tag) == true) {
              Log.d(TAG, "确认为有效身份证标签，开始读取")
              // 生成业务流水号
              GuidUtils.getInstance().newRandom()
              val busiSerial = GuidUtils.getInstance().getCurrentId()
              Log.d(TAG, "生成业务流水号: $busiSerial")
              CommonUtil.getInstance().setBusiSerial(busiSerial)
              
              // 读取身份证
              Log.d(TAG, "调用身份证读取接口")
              IdCardReaderHelper?.readIDCardByJson()
            } else {
              Log.w(TAG, "不是有效的身份证标签")
              hasTag = 0
              isIdCardReading = false
              val errorParams: WritableMap = WritableNativeMap()
              errorParams.putString("status", "idcard_error")
              errorParams.putString("type", "idcard")
              errorParams.putString("errorInfo", "不是有效的身份证")
              Log.d(TAG, "发送身份证错误事件到JS: 不是有效的身份证")
              sendErrorInfoToJS(errorParams)
            }
          } else {
            Log.d(TAG, "继续读取身份证 (hasTag=$hasTag)")
            // 继续读取
            IdCardReaderHelper?.readIDCardByJson()
          }
        } else {
          Log.w(TAG, "未检测到身份证标签")
          isIdCardReading = false
          val errorParams: WritableMap = WritableNativeMap()
          errorParams.putString("status", "idcard_error")
          errorParams.putString("type", "idcard")
          errorParams.putString("errorInfo", "请放置身份证")
          Log.d(TAG, "发送身份证错误事件到JS: 请放置身份证")
          sendErrorInfoToJS(errorParams)
        }
      }
      
      ID_CARD_SERVER_TV -> {
        Log.d(TAG, "身份证服务器信息: ${msg.obj}")
      }
      
      else -> {
        Log.w(TAG, "身份证读取出现错误，消息类型: ${msg.what}")
        // 身份证读取错误
        handleIdCardError(msg)
        isIdCardReading = false
        Log.d(TAG, "身份证读取状态重置为false")
      }
    }
    Log.d(TAG, "身份证消息处理完成")
  }
  
  /**
   * 处理身份证读取成功
   */
  private fun handleIdCardSuccess(identityCardStr: String) {
    Log.d(TAG, "开始处理身份证读取成功结果")
    try {
      Log.d(TAG, "身份证读取成功，原始数据长度: ${identityCardStr.length}")
      Log.d(TAG, "身份证原始数据: $identityCardStr")
      
      Log.d(TAG, "开始解析身份证JSON数据")
      val identityCard = JSONObject(identityCardStr)
      Log.d(TAG, "JSON解析成功")
      
      val resultParams: WritableMap = WritableNativeMap()
      resultParams.putString("status", "idcard_success")
      resultParams.putString("type", "idcard")
      Log.d(TAG, "创建返回参数对象")
      
      // 提取身份证信息
      val name = identityCard.optString("name", "")
      val gender = identityCard.optString("gender", "")
      val nation = identityCard.optString("nation", "")
      val birthday = identityCard.optString("birthday", "")
      val address = identityCard.optString("address", "")
      val idNum = identityCard.optString("idNum", "")
      val issueOrg = identityCard.optString("issueOrg", "")
      val effectDate = identityCard.optString("effectDate", "")
      val expireDate = identityCard.optString("expireDate", "")
      
      Log.d(TAG, "提取身份证基本信息: 姓名=$name, 性别=$gender, 民族=$nation")
      Log.d(TAG, "身份证号码: $idNum")
      Log.d(TAG, "出生日期: $birthday, 地址: $address")
      Log.d(TAG, "签发机关: $issueOrg, 有效期: $effectDate - $expireDate")
      
      resultParams.putString("name", name)
      resultParams.putString("gender", gender)
      resultParams.putString("nation", nation)
      resultParams.putString("birthday", birthday)
      resultParams.putString("address", address)
      resultParams.putString("idNum", idNum)
      resultParams.putString("issueOrg", issueOrg)
      resultParams.putString("effectDate", effectDate)
      resultParams.putString("expireDate", expireDate)
      
      // 处理照片
      val photoBase64 = identityCard.optString("photo", "")
      if (photoBase64.isNotEmpty()) {
        Log.d(TAG, "身份证照片数据长度: ${photoBase64.length}")
        resultParams.putString("photo", photoBase64)
      } else {
        Log.d(TAG, "未获取到身份证照片数据")
      }
      
      // 处理特殊身份证类型
      val idType = identityCard.optString("idType", "")
      resultParams.putString("idType", idType)
      Log.d(TAG, "身份证类型: $idType")
      
      when (idType) {
        "I" -> {
          Log.d(TAG, "处理外国人身份证")
          // 外国人身份证
          resultParams.putString("nationality", identityCard.optString("nation", ""))
          resultParams.putString("englishName", identityCard.optString("englishName", ""))
        }
        "J" -> {
          Log.d(TAG, "处理港澳台身份证")
          // 港澳台身份证
          resultParams.putString("signCount", identityCard.optString("signCount", ""))
          resultParams.putString("passNum", identityCard.optString("passNum", ""))
        }
        else -> {
          Log.d(TAG, "处理普通身份证")
          // 普通身份证
          resultParams.putString("dn", identityCard.optString("dn", ""))
        }
      }
      
      Log.d(TAG, "发送身份证读取成功结果到JS层")
      sendErrorInfoToJS(resultParams)
      Log.d(TAG, "身份证读取成功处理完成")
      
    } catch (e: JSONException) {
      Log.e(TAG, "解析身份证信息失败", e)
      val errorParams: WritableMap = WritableNativeMap()
      errorParams.putString("status", "idcard_error")
      errorParams.putString("type", "idcard")
      errorParams.putString("errorInfo", "身份证信息解析失败")
      Log.d(TAG, "发送身份证解析错误到JS层")
      sendErrorInfoToJS(errorParams)
    }
  }
  
  /**
   * 处理身份证读取错误
   */
  private fun handleIdCardError(msg: Message) {
    Log.d(TAG, "开始处理身份证读取错误")
    Log.d(TAG, "错误消息对象: ${msg.obj}")
    Log.d(TAG, "错误码: ${msg.what}")
    
    var errorMsg = msg.obj?.toString() ?: "未知错误"
    Log.d(TAG, "基础错误信息: $errorMsg")
    
    if (msg.what == 2) {
      errorMsg += ",请检查传入的接入信息"
      Log.d(TAG, "错误码为2，添加接入信息检查提示")
    }
    
    Log.e(TAG, "身份证读取失败: 错误码=${msg.what}, 错误信息=$errorMsg")
    
    Log.d(TAG, "创建错误参数对象")
    val errorParams: WritableMap = WritableNativeMap()
    errorParams.putString("status", "idcard_error")
    errorParams.putString("type", "idcard")
    errorParams.putString("errorInfo", errorMsg)
    errorParams.putInt("errorCode", msg.what)
    
    Log.d(TAG, "发送身份证错误信息到JS层")
    sendErrorInfoToJS(errorParams)
    Log.d(TAG, "身份证错误处理完成")
  }
  
  /**
   * 启用身份证读取模式
   */
  fun enableIdCardReaderMode() {
    Log.d(TAG, "打开身份证=================================")
    idCardNfcAdapter = NfcAdapter.getDefaultAdapter(this)
    
    if (idCardNfcAdapter == null) {
      Toast.makeText(this, "设备不支持NFC", Toast.LENGTH_SHORT).show()
      return
    }
    
    if (idCardNfcAdapter?.isEnabled != true) {
      Toast.makeText(this, "请在系统设置中先启用NFC功能", Toast.LENGTH_SHORT).show()
      return
    }
    val options = Bundle().apply {
      putInt(NfcAdapter.EXTRA_READER_PRESENCE_CHECK_DELAY, 300)
    }
    
    val readerFlags = NfcAdapter.FLAG_READER_NFC_B or 
                     NfcAdapter.FLAG_READER_NFC_V or
                     NfcAdapter.FLAG_READER_NFC_F or 
                     NfcAdapter.FLAG_READER_NFC_A or
                     NfcAdapter.FLAG_READER_NFC_BARCODE
    
    // 创建身份证NFC回调，类似于社保卡的回调
    val callback = NfcAdapter.ReaderCallback { tag ->
      runOnUiThread {
        Log.d(TAG, "身份证收到: $tag")
        if (!isIdCardReading) {
          Log.d(TAG, "开始身份证读取流程")
          isIdCardReading = true
          hasTag = 1
          val message = Message()
          message.what = ID_CARD_NFC_START
          message.obj = tag
          Log.d(TAG, "发送NFC开始消息到Handler")
          idCardHandler?.sendMessage(message)
        } else {
          Log.d(TAG, "身份证正在读取中，忽略新的NFC标签")
        }
      }
    }
    
    idCardNfcAdapter?.enableReaderMode(this, callback, readerFlags, options)
    Log.d(TAG, "NFC读取模式启用成功")
    
    IdCardReaderHelper?.EnableSystemNFCMessage(callback)
    Log.d(TAG, "SDK NFC消息处理启用完成")
  }
  
  /**
   * 禁用身份证读取模式
   */
  fun disableIdCardReaderMode() {
    Log.d(TAG, "开始禁用身份证读取模式")
    Log.d(TAG, "禁用NFC读取模式")
    idCardNfcAdapter?.disableReaderMode(this)
    Log.d(TAG, "NFC读取模式已禁用")
    
    Log.d(TAG, "禁用SDK的NFC消息处理")
    IdCardReaderHelper?.DisableSystemNFCMessage()
    Log.d(TAG, "SDK NFC消息处理已禁用")
    
    Log.d(TAG, "重置身份证读取状态")
    isIdCardReading = false
    hasTag = 0
    Log.d(TAG, "身份证读取状态已重置: isIdCardReading=$isIdCardReading, hasTag=$hasTag")
    Log.d(TAG, "身份证读取模式禁用完成")
  }

  /**
   * Activity恢复时启用NFC读卡模式
   */
  override fun onResume() {
    super.onResume()
    // 启用社保卡读取模式
    enableReaderMode()
    // 启用身份证读取模式
    enableIdCardReaderMode() 
  }
  
  /**
   * Activity暂停时禁用NFC读卡模式
   */
  override fun onPause() {
    super.onPause()
    disableReaderMode()
    disableIdCardReaderMode()
  }
  
  /**
   * 资源释放
   */
  override fun onDestroy() {
    super.onDestroy()
    // NFC资源会自动释放
    CommonUtil.clear()
    Log.d(TAG, "MainActivity 销毁完成")
  }
}
