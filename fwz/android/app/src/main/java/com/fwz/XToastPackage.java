package com.fwz;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.BaseActivityEventListener;
import android.app.Activity;
import android.content.Intent;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class XToastPackage implements ReactPackage {
    private XToastModule xToastModule;
    
    private final ActivityEventListener activityEventListener = new BaseActivityEventListener() {
        @Override
        public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
            if (xToastModule != null) {
                xToastModule.onActivityResult(activity, requestCode, resultCode, data);
            }
        }
    };
    
    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        
        // 创建XToastModule实例
        xToastModule = new XToastModule(reactContext);
        
        // 注册活动结果监听器
        reactContext.addActivityEventListener(activityEventListener);
        
        modules.add(xToastModule);
        return modules;
    }
} 