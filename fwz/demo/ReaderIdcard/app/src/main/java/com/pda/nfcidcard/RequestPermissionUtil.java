/**
 * 版权所有.(c)2008-2016.广州市森锐科技股份有限公司
 * 作者: Leo
 * 日期: 2016/7/13 16:16
 */
package com.pda.nfcidcard;

import android.app.Activity;
import android.content.pm.PackageManager;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.widget.Toast;

/**
 * 安卓6.0请求权限工具类
 * Created by Leo on 2016/12/1 0001.
 */
public class RequestPermissionUtil {

    private static final int MY_PERMISSIONS_REQUEST = 10222;

    public static void request(Activity activity, String[] permissions){

        for(int i = 0; i < permissions.length; i++){
            if (ContextCompat.checkSelfPermission(activity, permissions[i]) != PackageManager.PERMISSION_GRANTED) {
                if (ActivityCompat.shouldShowRequestPermissionRationale(activity, permissions[i])) {
                    // 拒绝过一次之后，再次请求权限时的操作
                    Toast.makeText(activity, "缺少权限", Toast.LENGTH_SHORT).show();
                    ActivityCompat.requestPermissions(activity, permissions, MY_PERMISSIONS_REQUEST);

                } else {
                    // No explanation needed, we can request the permission.
                    ActivityCompat.requestPermissions(activity, permissions, MY_PERMISSIONS_REQUEST);
                }

            }else{
                //已经获取到权限
            }

        }

    }
}
