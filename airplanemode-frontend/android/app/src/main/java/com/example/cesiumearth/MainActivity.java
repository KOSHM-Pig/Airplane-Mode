package com.example.cesiumearth;

import android.os.Bundle;
import android.webkit.WebView;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 强制启用硬件加速
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
        );

        // 启用WebView硬件加速和GPU渲染
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.KITKAT) {
            WebView.setWebContentsDebuggingEnabled(true);
        }

        // 配置WebView性能优化
        configureWebViewPerformance();
    }

    private void configureWebViewPerformance() {
        // 获取WebView实例并配置
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            // 启用硬件加速
            webView.setLayerType(android.view.View.LAYER_TYPE_HARDWARE, null);

            // WebView设置优化
            webView.getSettings().setJavaScriptEnabled(true);
            webView.getSettings().setDomStorageEnabled(true);
            webView.getSettings().setDatabaseEnabled(true);
            webView.getSettings().setCacheMode(android.webkit.WebSettings.LOAD_DEFAULT);

            // GPU和渲染优化
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.KITKAT) {
                webView.getSettings().setRenderPriority(android.webkit.WebSettings.RenderPriority.HIGH);
            }

            // 内存和性能优化
            webView.getSettings().setGeolocationEnabled(true);

            // 禁用一些不必要的功能以提升性能
            webView.getSettings().setSupportZoom(false);
            webView.getSettings().setBuiltInZoomControls(false);
            webView.getSettings().setDisplayZoomControls(false);
        }
    }
}
