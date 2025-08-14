package com.acmetone.airplanemode

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.acmetone.airplanemode.ui.LoginScreen
import com.acmetone.airplanemode.ui.theme.AirplanemodeTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            AirplanemodeTheme {
                LoginScreen()
            }
        }
    }
}