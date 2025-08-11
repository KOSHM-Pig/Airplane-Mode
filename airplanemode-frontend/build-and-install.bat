@echo off
echo ========================================
echo    AirplaneMode APK 构建和安装脚本
echo ========================================
echo.

echo [1/5] 检查设备连接...
adb devices
if %ERRORLEVEL% neq 0 (
    echo ❌ ADB未找到或设备未连接
    pause
    exit /b 1
)

echo.
echo [2/5] 构建Web应用...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo ❌ Web应用构建失败
    pause
    exit /b 1
)

echo.
echo [3/5] 同步到Android项目...
call npx cap sync android
if %ERRORLEVEL% neq 0 (
    echo ❌ Android同步失败
    pause
    exit /b 1
)

echo.
echo [4/5] 构建APK...
cd android
call gradlew assembleDebug
if %ERRORLEVEL% neq 0 (
    echo ❌ APK构建失败
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo [5/5] 安装到设备...
adb install -r "android\app\build\outputs\apk\debug\app-debug.apk"
if %ERRORLEVEL% neq 0 (
    echo ❌ APK安装失败
    pause
    exit /b 1
)

echo.
echo ✅ AirplaneMode APK 构建和安装完成！
echo 📱 请在平板上查看 "AirplaneMode" 应用
echo.

echo 🚀 启动应用...
adb shell am start -n com.acmetone.airplanemode/.MainActivity

echo.
echo ========================================
echo           构建安装完成！
echo ========================================
pause
