package com.fwz;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.KeyEvent;
import android.view.View;
import android.widget.Button;
import android.widget.Toast;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.ResultPoint;
import com.journeyapps.barcodescanner.BarcodeCallback;
import com.journeyapps.barcodescanner.BarcodeResult;
import com.journeyapps.barcodescanner.DecoratedBarcodeView;
import com.journeyapps.barcodescanner.DefaultDecoderFactory;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;

public class QRScanActivity extends Activity {
    private static final String TAG = "QRScanActivity";
    private DecoratedBarcodeView barcodeView;
    private boolean isTorchOn = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_qr_scan);

        // 初始化扫码视图
        barcodeView = findViewById(R.id.barcode_scanner);
        
        // 配置扫码格式
        Collection<BarcodeFormat> formats = Arrays.asList(
                BarcodeFormat.QR_CODE, 
                BarcodeFormat.CODE_39,
                BarcodeFormat.CODE_93,
                BarcodeFormat.CODE_128,
                BarcodeFormat.EAN_13,
                BarcodeFormat.EAN_8,
                BarcodeFormat.UPC_A,
                BarcodeFormat.DATA_MATRIX
        );
        
        barcodeView.getBarcodeView().setDecoderFactory(new DefaultDecoderFactory(formats));
        barcodeView.initializeFromIntent(getIntent());
        barcodeView.decodeContinuous(callback);

        // 闪光灯按钮
        Button flashButton = findViewById(R.id.flash_button);
        if (flashButton != null) {
            flashButton.setOnClickListener(v -> {
                if (isTorchOn) {
                    barcodeView.setTorchOff();
                    isTorchOn = false;
                } else {
                    barcodeView.setTorchOn();
                    isTorchOn = true;
                }
            });
        }
        
        // 取消按钮
        Button cancelButton = findViewById(R.id.cancel_button);
        if (cancelButton != null) {
            cancelButton.setOnClickListener(v -> {
                setResult(RESULT_CANCELED);
                finish();
            });
        }
    }

    private BarcodeCallback callback = new BarcodeCallback() {
        @Override
        public void barcodeResult(BarcodeResult result) {
            if (result.getText() != null) {
                // 播放蜂鸣声
                barcodeView.setStatusText(result.getText());
                
                // 返回扫码结果
                Intent intent = new Intent();
                intent.putExtra("SCAN_RESULT", result.getText());
                setResult(RESULT_OK, intent);
                
                // 关闭扫码界面
                finish();
            }
        }

        @Override
        public void possibleResultPoints(List<ResultPoint> resultPoints) {
            // 可选实现，用于显示可能的结果点
        }
    };

    @Override
    protected void onResume() {
        super.onResume();
        barcodeView.resume();
    }

    @Override
    protected void onPause() {
        super.onPause();
        barcodeView.pause();
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        return barcodeView.onKeyDown(keyCode, event) || super.onKeyDown(keyCode, event);
    }
} 