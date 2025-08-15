# 飞行模式 APK 打包指南

## 📱 环境准备

### 1. 安装 Node.js 依赖
```bash
npm install
```

### 2. 安装 Android 开发环境

#### 安装 Android Studio
1. 下载并安装 [Android Studio](https://developer.android.com/studio)
2. 安装 Android SDK (API Level 34)
3. 安装 Android Build Tools
4. 配置 ANDROID_HOME 环境变量

#### 安装 Java JDK
1. 安装 JDK 11 或更高版本
2. 配置 JAVA_HOME 环境变量

### 3. 安装 Capacitor CLI
```bash
npm install -g @capacitor/cli
```

## 🔧 项目配置

### 1. 初始化 Capacitor
```bash
npx cap init
```

### 2. 添加 Android 平台
```bash
npx cap add android
```

### 3. 构建 Web 应用
```bash
npm run build
```

### 4. 同步到 Android
```bash
npx cap sync android
```

## 📦 打包 APK

### 方法一：使用 npm 脚本（推荐）

#### 开发版本
```bash
npm run android:build
```

#### 发布版本
```bash
npm run android:release
```

### 方法二：手动打包

#### 1. 构建项目
```bash
npm run build
npx cap copy android
```

#### 2. 在 Android Studio 中打开项目
```bash
npx cap open android
```

#### 3. 在 Android Studio 中构建 APK
- 选择 `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`
- 或者选择 `Build` > `Generate Signed Bundle / APK`

## 🎯 输出文件位置

### Debug APK
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Release APK
```
android/app/build/outputs/apk/release/app-release.apk
```

## 🔑 签名配置（发布版本）

### 1. 生成密钥库
```bash
keytool -genkey -v -keystore airplanemode-release-key.keystore -alias airplanemode -keyalg RSA -keysize 2048 -validity 10000
```

### 2. 配置签名
在 `android/app/build.gradle` 中添加：
```gradle
android {
    signingConfigs {
        release {
            storeFile file('../../airplanemode-release-key.keystore')
            storePassword 'your_store_password'
            keyAlias 'airplanemode'
            keyPassword 'your_key_password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

## 🚀 快速打包命令

```bash
# 一键打包开发版本
npm run android:build

# 一键打包发布版本
npm run android:release
```

## 📋 应用信息

- **应用名称**: 飞行模式
- **包名**: com.airplanemode.gaode
- **版本**: 1.0.0
- **最小 SDK**: 22 (Android 5.1)
- **目标 SDK**: 34 (Android 14)

## 🔧 权限说明

应用请求以下权限：
- `INTERNET` - 网络访问（地图数据）
- `ACCESS_NETWORK_STATE` - 网络状态检测
- `ACCESS_WIFI_STATE` - WiFi状态检测
- `ACCESS_FINE_LOCATION` - 精确定位
- `ACCESS_COARSE_LOCATION` - 粗略定位
- `WRITE_EXTERNAL_STORAGE` - 外部存储写入
- `READ_EXTERNAL_STORAGE` - 外部存储读取

## 🐛 常见问题

### 1. Gradle 构建失败
```bash
cd android
./gradlew clean
./gradlew build
```

### 2. SDK 版本问题
确保 Android SDK 和 Build Tools 版本匹配

### 3. 权限问题
检查 AndroidManifest.xml 中的权限配置

### 4. 网络请求失败
确保 `android:usesCleartextTraffic="true"` 已配置

## 📱 测试安装

```bash
# 安装到连接的设备
adb install android/app/build/outputs/apk/debug/app-debug.apk

# 或使用 Capacitor 直接运行
npm run android
```
