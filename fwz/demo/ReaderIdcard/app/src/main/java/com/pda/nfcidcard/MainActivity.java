package com.pda.nfcidcard;

import android.Manifest;
import android.content.*;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.nfc.NfcAdapter;
import android.nfc.Tag;
import android.os.*;

import android.util.Base64;
import android.view.*;
import android.widget.*;

import com.sunrise.reader.IDecodeIDServerListener;

import sunrise.api.CommonUtil;
import sunrise.api.ReaderType;
import sunrise.nfc.SRnfcCardReader;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.ProgressDialog;
import android.util.Log;

import com.sunrizetech.idhelper.ConsantHelper;

import org.json.JSONException;
import org.json.JSONObject;

@SuppressLint("UseValueOf")
public class MainActivity extends Activity {

    private TextView tv_info;
    private TextView nameTextView;
    private TextView sexTextView;
    private TextView folkTextView;
    private TextView birthYearTextView, birthMonthTextView, birthDayTextView;
    private TextView addrTextView;
    private TextView codeTextView;
    private TextView policyTextView;
    private TextView validDateTextView;
    private ImageView photoView;
    private Button buttonBT, buttonHV;
    private TextView otherInfoTv;
    private TextView costTimeTv;
    private TextView startTimeTv;
    private TextView endTimeTv;

    private String deviceId = "";
    private String softVersion = "";

    /**
     * 计时
     */
    private long startTime;
    private long stopTime;

    //IP
    private String server_address = "";
    //端口
    private int server_port = 6000;

    //回调handler
    public static Handler uiHandler;

    //普通NFC方式接口类
    private SRnfcCardReader mNFCReaderHelper;

    private static final String TAG = "SunriseDemo";

    private AlertDialog alertDialog;

    private Context context;

    //NFC开始读取
    private static final int NFC_START = 52;

    //已读身份证次数
    private int iDReadingCount = 0;
    //读身份证次数(用户设定)
    private int iDReadingNum = 1;

    //是否是标准NFC方式
    private boolean isNFC = false;

    //NFC回调
    NfcAdapter.ReaderCallback nfcCallBack;

    //显示服务器
    private static final int SERVER_TV = 5555;

    //读身份证成功次数
    private int readIDSuccessCount = 0;

    private ProgressDialog processDia; //加载框
    private String otherInfoStr;
    private TextView readerNameTv;

    private int hasTag = 0;
    //总耗时统计
    private long readTimeCount = 0;
    //本次耗时统计
    private long currentReadTimeCount = 0;
    //停止批量读证
    private boolean stopReadIDRepeat = false;

    //绑定NFC回调函数, SDK需要Lv.19（android 4.4）以上
    private void initReaderCallback() {
        try {

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                nfcCallBack = new NfcAdapter.ReaderCallback() {
                    @Override
                    public void onTagDiscovered(final Tag tag) {

                        iDReadingCount = 0;
                        readIDSuccessCount = 0;
                        readTimeCount = 0;
                        currentReadTimeCount = 0;
                        stopReadIDRepeat = false;
                        isNFC = true;
                        Message message = new Message();
                        message.what = NFC_START;
                        message.obj = tag;
                        hasTag = 1;
                        uiHandler.sendMessage(message);
                    }
                };
            }
        } catch (NoClassDefFoundError e) {
            Log.e(TAG, "android version too low, can not use nfc");
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        context = this;
        uiHandler = new MyHandler();

        /**
         * 某些6.0系统搜索蓝牙时需要用户提供权限
         */
        if (Build.VERSION.SDK_INT >= 6.0) {
            RequestPermissionUtil.request(this, new String[]{Manifest.permission.READ_PHONE_STATE,
                    Manifest.permission.READ_EXTERNAL_STORAGE, Manifest.permission.WRITE_EXTERNAL_STORAGE});
        }

        alertDialog = new AlertDialog.Builder(this).setTitle("提示").setMessage(R.string.nfc_connect_tip).setCancelable(false).setNegativeButton("停止读证", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                stopRepeat();
            }
        }).create();

        // 初始化接口
        //TODO 请填入分配的接入信息


        CommonUtil.getInstance().setAppKey("BB86ED1828594FE7B232C18AB71209B2");
        CommonUtil.getInstance().setAppSecret("1CF9517C4B52434D997D2475E580C617");
        CommonUtil.getInstance().setPassword("4EBF7F338A914EA9861B5979FD920AFA");
        //设置读证方式
        CommonUtil.getInstance().initReaderType(ReaderType.NFC);
        switch (CommonUtil.getInstance().getReaderType()) {
            case OTG:
            default:
                isNFC = false;
                break;
            case NFC:
                isNFC = true;
                break;
        }

        // 第一个参数handler,用于异步接收读身份证返回结果
        // 第二个参数context,调用接口的Activity上下文对象
        mNFCReaderHelper = new SRnfcCardReader(uiHandler, this);

        //保持屏幕常亮
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        initViews();

        deviceId = mNFCReaderHelper.getDeviceId();
        softVersion = CommonUtil.getInstance().getSDKVersion();
        otherInfoTv.setText("手机id：" + deviceId + "\n SDK版本：" + softVersion);

        initReaderCallback();

        mNFCReaderHelper.setDecodeServerListener(new IDecodeIDServerListener() {
            @Override
            public void getThisServer(String ip, int port) {

            }

            @Override
            public void getThisServer(String ip, int port, int recouunt) {
                uiHandler.obtainMessage(SERVER_TV, ip + "-" + port + "-" + recouunt).sendToTarget();
            }
        });

        ShareReferenceSaver.saveBool(getApplicationContext(), "otg_set", false);
        ShareReferenceSaver.saveBool(getApplicationContext(), "repeat_set", false);
        ShareReferenceSaver.saveData(getApplicationContext(), "repeat_num", "1");

    }

    private void stopRepeat() {
        stopReadIDRepeat = true;
        buttonBT.setVisibility(View.VISIBLE);
    }

    /**
     * 设置特定的解密服务器
     */
    private void initShareReference() {

        if (!"".equals(server_address) && server_port != 0) {
            //若设置只连接特定的解密服务器, 第一步先把管控设为空；第二步设入特定的服务器
            //设入特定的服务器
            mNFCReaderHelper.setTheServer(this.server_address, this.server_port);
        }
    }

    private void initViews() {
        tv_info = findViewById(R.id.readid_res_tv);
        nameTextView = findViewById(R.id.tv_name);
        sexTextView = findViewById(R.id.tv_sex);
        folkTextView = findViewById(R.id.tv_ehtnic);
        birthYearTextView = findViewById(R.id.tv_birthYear);
        birthMonthTextView = findViewById(R.id.tv_birthMonth);
        birthDayTextView = findViewById(R.id.tv_birthDay);
        addrTextView = findViewById(R.id.tv_address);
        codeTextView = findViewById(R.id.tv_number);
        policyTextView = findViewById(R.id.tv_signed);
        validDateTextView = findViewById(R.id.tv_validate);
        readerNameTv = findViewById(R.id.tv_chosedevice);
        startTimeTv = findViewById(R.id.tv_starttime);
        endTimeTv = findViewById(R.id.tv_endtime);
        costTimeTv = findViewById(R.id.tv_readTime);

        photoView = findViewById(R.id.iv_photo);
        buttonHV = findViewById(R.id.btn_nfcreadid);
        buttonBT = findViewById(R.id.btn_btreadid);
        otherInfoTv = findViewById(R.id.tv_otherinfo);

        if (isNFC) {
            findViewById(R.id.button_group_layout).setVisibility(View.GONE);
            findViewById(R.id.button_group2_layout).setVisibility(View.GONE);
        }

        processDia = new ProgressDialog(context);
        //点击提示框外面是否取消提示框
        processDia.setCanceledOnTouchOutside(false);
        //点击返回键是否取消提示框
        processDia.setCancelable(false);
        processDia.setIndeterminate(true);
        processDia.setMessage(getResources().getString(R.string.loading));

    }

    @Override
    protected void onDestroy() {
        CommonUtil.clear();
        super.onDestroy();
    }

    /**
     * 消息handle,包括绑定蓝牙消息、绑定OTG消息、读身份证结果返回消息
     */
    class MyHandler extends Handler {

        @Override
        public void handleMessage(Message msg) {
            switch (msg.what) {
                //成功
                case ConsantHelper.READ_CARD_SUCCESS:
                    handleReturnSuccessMsg(msg);
                    break;

                case 10001:
                    Log.i(TAG, "读证进度：" + msg.obj);
                    if ((Integer) msg.obj == 75) {
                        cancelLoadingDialog();
                    }
                    break;

                //NFC开始读取
                case NFC_START:
                    if (alertDialog.isShowing()) {
                        alertDialog.cancel();
                    }
                    Log.e("MainActivity", "NFC 返回调用");

                    //显示加载框
                    showLoadingDialog();

                    //开始时间
                    startTime();
                    //参数传入唯一订单流水号
                    GuidUtils.getInstance().newRandom();
                    String busiSerial = GuidUtils.getInstance().getCurrentId();
                    CommonUtil.getInstance().setBusiSerial(busiSerial);

                    //根据特殊POS的属性值来判断是使用特殊POS的NFC方式还是普通的NFC方式
                    if (hasTag > 0) {
                        if (hasTag == 1) {
                            //清除信息
                            clearInfo();
                            if (mNFCReaderHelper.isNFC((Tag) msg.obj)) {
                                // NFC读取身份证
                                mNFCReaderHelper.readIDCardByJson();
                            } else {
                                hasTag = 0;
                                stopTime(false);
                                cancelLoadingDialog();
//                                buttonNFC.setVisibility(View.VISIBLE);
                                buttonBT.setVisibility(View.VISIBLE);
                                tv_info.setText(R.string.not_idcard);
                                Log.e("MainActivity", "返回的Tag不可用");
                            }
                        } else {
                            // NFC读取身份证
                            mNFCReaderHelper.readIDCardByJson();
                        }

                    } else {
                        stopTime(false);
                        cancelLoadingDialog();
//                        buttonNFC.setVisibility(View.VISIBLE);
                        buttonBT.setVisibility(View.VISIBLE);
                        tv_info.setText(R.string.no_idcard);
                        Log.e("MainActivity", "请放置身份证");
                    }
                    break;

                //显示服务器
                case SERVER_TV:
                    otherInfoStr = context.getResources().getString(R.string.title_server) + msg.obj.toString();
                    otherInfoTv.setText(otherInfoStr);
                    break;

                //错误
                default:
                    handleReturnErrorMsg(msg);
                    break;
            }
        }

    }

    @Override
    protected void onPause() {
        super.onPause();
        mNFCReaderHelper.DisableSystemNFCMessage();
    }

    @Override
    protected void onResume() {
        super.onResume();
        mNFCReaderHelper.EnableSystemNFCMessage(nfcCallBack);

    }

    /**
     * 读卡成功，显示信息
     *
     * @param identityCardStr
     */
    private void readCardSuccess(String identityCardStr) {
        JSONObject identityCard = null;
        try {
            identityCard = new JSONObject(identityCardStr);
            if (identityCard != null) {
                String idType = null;
                try {
                    idType = identityCard.getString("idType");
                } catch (JSONException ignored) {
                }
                //通过idType来判断是否是外国人身份证，外国人身份证是I,港澳台身份证是J
                if ("I".equals(idType)) {
                    otherInfoStr = otherInfoStr + "\n" + context.getResources().getString(R.string.nationality) + ":"
                            + identityCard.getString("nation") + "\n" + context.getResources().getString(R.string.ename) + ":"
                            + identityCard.getString("englishName");
                    nameTextView.setText(identityCard.getString("name"));
                    policyTextView.setText(identityCard.getString("issueOrg"));

                } else if (idType != null && "J".equals(idType)) {
                    otherInfoStr = otherInfoStr + "\n" + context.getResources().getString(R.string.signnum) + ":"
                            + identityCard.getString("signCount") + "\n" + context.getResources().getString(R.string.acessnum) + ":"
                            + identityCard.getString("passNum");
                    nameTextView.setText(identityCard.getString("name"));
                    policyTextView.setText(identityCard.getString("issueOrg"));
                    addrTextView.setText(identityCard.getString("address"));

                } else {
                    nameTextView.setText(identityCard.getString("name"));
                    folkTextView.setText(identityCard.getString("nation"));
                    policyTextView.setText(identityCard.getString("issueOrg"));
                    addrTextView.setText(identityCard.getString("address"));
                    otherInfoStr = otherInfoStr + "\n" + context.getResources().getString(R.string.dn) + ":"
                            + identityCard.getString("dn");
                }

                validDateTextView.setText(identityCard.getString("effectDate") + " - " +
                        identityCard.getString("expireDate"));
                sexTextView.setText(identityCard.getString("gender"));
                codeTextView.setText(identityCard.getString("idNum"));
                String bornDayDataTemp2 = identityCard.getString("birthday");
                birthYearTextView.setText(bornDayDataTemp2.substring(0, 4));
                birthMonthTextView.setText(bornDayDataTemp2.substring(4, 6));
                birthDayTextView.setText(bornDayDataTemp2.substring(6));

                //  头像图片字节数组转bitmap
                photoView.setImageBitmap(dealIDImage(android.util.Base64.decode(identityCard.getString("photo"), Base64.DEFAULT)));
                Log.e(TAG, "读卡成功!");

                otherInfoStr = otherInfoStr + "\n" + context.getResources().getString(R.string.title_read_times) + (iDReadingCount + 1) + "\n" + context.getResources().getString(R.string.title_times) + readIDSuccessCount;

            } else {
                otherInfoStr = "数据为空,无法显示";
                Log.e(TAG, "数据为空,无法显示");
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
        otherInfoTv.setText(otherInfoStr);
        endTimeTv.setText(readIDSuccessCount * 100 / (iDReadingCount + 1) + "%");
        startTimeTv.setText(readIDSuccessCount + "/" + (iDReadingCount + 1) + "次");


    }

    /**
     * 清除显示信息
     */
    private void clearInfo() {
        otherInfoStr = "";
        nameTextView.setText("");
        sexTextView.setText("");
        folkTextView.setText("");
        birthYearTextView.setText("");
        birthMonthTextView.setText("");
        birthDayTextView.setText("");
        codeTextView.setText("");
        policyTextView.setText("");
        addrTextView.setText("");
        validDateTextView.setText("");
        photoView.setImageBitmap(null);

        tv_info.setText("");
        otherInfoTv.setText("");
        startTimeTv.setText("");
        endTimeTv.setText("");
        costTimeTv.setText("");
    }

    /**
     * 记录开始时间
     */
    private void startTime() {
        Log.i(TAG, "start read");
        startTime = System.currentTimeMillis();
    }

    /**
     * 记录结束时间
     */
    private void stopTime(boolean isSuccess) {
        try {
            stopTime = System.currentTimeMillis();
            if (isSuccess) {
                currentReadTimeCount = stopTime - startTime;
                Log.i(TAG, currentReadTimeCount + "");
                readTimeCount = readTimeCount + currentReadTimeCount;
                costTimeTv.setText((readTimeCount / readIDSuccessCount) + "/" + currentReadTimeCount);
            } else {
                currentReadTimeCount = 0;
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * 返回成功信息后的处理
     *
     * @param message
     */
    private void handleReturnSuccessMsg(Message message) {
        //累加成功次数
        readIDSuccessCount++;
        stopTime(true);
        cancelLoadingDialog();
        tv_info.setText(R.string.read_success);

        // 身份证读取成功，返回所有信息
        readCardSuccess((String) message.obj);

        Log.i(TAG, "读取" + (iDReadingCount + 1) + "次  成功" + readIDSuccessCount + "次");

        repeatRead(false);
    }

    /**
     * 返回错误信息后的处理
     *
     * @param message
     */
    private void handleReturnErrorMsg(Message message) {
        //停止计时
        stopTime(false);
        //取消加载框
        cancelLoadingDialog();
        if (message.what == 2) {
            message.obj = message.obj + ",请检查传入的接入信息";
        }
        tv_info.setText("错误编码: " + message.what + " " + message.obj);
        otherInfoStr = otherInfoStr + "\n" + context.getResources().getString(R.string.title_read_times) + (iDReadingCount + 1) + "\n" + context.getResources().getString(R.string.title_times) + readIDSuccessCount;
        otherInfoTv.setText(otherInfoStr);
        endTimeTv.setText(readIDSuccessCount * 100 / (iDReadingCount + 1) + "%");
        startTimeTv.setText(readIDSuccessCount + "/" + (iDReadingCount + 1) + "次");


        if (message.what == ConsantHelper.READ_CARD_OPEN_FAILED_1) {
            stopReadIDRepeat = true;
        }
        repeatRead(message.what == ConsantHelper.READ_CARD_OPEN_FAILED_3);
    }

    /**
     * 显示加载框
     */
    private void showLoadingDialog() {
        if (!processDia.isShowing()) {
            processDia.show();
        }
    }

    /**
     * 隐藏加载框
     */
    private void cancelLoadingDialog() {
        if (processDia.isShowing()) {
            processDia.cancel();
        }
    }

    /**
     * 根据阅读次数重复读取
     */
    private void repeatRead(boolean isPause) {
        if (!stopReadIDRepeat && isPause) {
            otherInfoStr = "";
            if (!alertDialog.isShowing()) {
                alertDialog.show();
            }
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            new Thread(new Runnable() {
                @Override
                public void run() {
                    if (isNFC) {
                        hasTag = 2;
                        uiHandler.sendEmptyMessage(NFC_START);
                    }
                }
            }).start();
        } else {
            if (alertDialog.isShowing()) {
                alertDialog.cancel();
            }
            iDReadingCount++;

            if (!stopReadIDRepeat && iDReadingCount < iDReadingNum) {
                //clearIDInfo();

                otherInfoStr = "";

                try {
                    Thread.sleep(100);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                showLoadingDialog();

                new Thread(new Runnable() {
                    @Override
                    public void run() {
                        if (isNFC) {
                            hasTag = 2;
                            uiHandler.sendEmptyMessage(NFC_START);
                        }
                    }
                }).start();

            }
        }
    }

    /**
     * 图片字节数组转Bitmap
     *
     * @param bs
     * @return
     */
    public static Bitmap dealIDImage(byte[] bs) {
        Bitmap bitmapTemp = null;
        try {
            bitmapTemp = BitmapFactory.decodeByteArray(bs, 0, bs.length);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return bitmapTemp;
    }

}
