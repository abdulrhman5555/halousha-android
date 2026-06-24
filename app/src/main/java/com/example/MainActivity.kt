package com.example

import android.annotation.SuppressLint
import android.content.ComponentName
import android.content.Context
import android.content.pm.PackageManager
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.example.ui.theme.MyApplicationTheme

// Premium Space Slate Theme Colors for Native screens & fallback placeholders
private val SlateBg = Color(0xFF0F172A)
private val CardBg = Color(0xFF1E293B)
private val BorderColor = Color(0xFF334155)
private val AccentTeal = Color(0xFF0EA5E9)
private val AccentIndigo = Color(0xFF6366F1)
private val SoftWhite = Color(0xFFF8FAFC)
private val MutedGray = Color(0xFF94A3B8)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MyApplicationTheme {
                Scaffold(
                    modifier = Modifier.fillMaxSize(),
                    contentWindowInsets = WindowInsets.safeDrawing
                ) { innerPadding ->
                    WebViewScreen(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding),
                        context = this@MainActivity
                    )
                }
            }
        }
    }
}

// Fullscreen WebView Composable that loads the local assets/index.html offline shell
@SuppressLint("SetJavaScriptEnabled")
@Composable
fun WebViewScreen(modifier: Modifier = Modifier, context: Context) {
    AndroidView(
        modifier = modifier.fillMaxSize(),
        factory = { ctx ->
            WebView(ctx).apply {
                webViewClient = object : WebViewClient() {
                    override fun shouldOverrideUrlLoading(
                        view: WebView?,
                        request: WebResourceRequest?
                    ): Boolean {
                        // Keep navigation internal inside the WebView
                        return false
                    }
                }
                
                settings.apply {
                    javaScriptEnabled = true
                    domStorageEnabled = true
                    databaseEnabled = true
                    allowFileAccess = true
                    allowContentAccess = true
                    allowFileAccessFromFileURLs = true
                    allowUniversalAccessFromFileURLs = true
                    mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                    useWideViewPort = true
                    loadWithOverviewMode = true
                }
                
                // Add JavaScript↔Kotlin native bridge
                addJavascriptInterface(AndroidBridge(context), "AndroidBridge")
                
                loadUrl("file:///android_asset/index.html")
            }
        }
    )
}

// Javascript Bridge Interface to allow JS in assets/index.html to call Kotlin functions
class AndroidBridge(private val context: Context) {

    @JavascriptInterface
    fun showToast(message: String) {
        val handler = android.os.Handler(android.os.Looper.getMainLooper())
        handler.post {
            Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
        }
    }

    @JavascriptInterface
    fun changeAppIcon(colorName: String) {
        val handler = android.os.Handler(android.os.Looper.getMainLooper())
        handler.post {
            changeIcon(context, colorName)
        }
    }
}

// Dynamic Icon Switching helper using Android Component Enabling / Activity-Alias
fun changeIcon(context: Context, colorName: String) {
    val pm = context.packageManager
    val basePackage = context.packageName
    
    val defaultComponent = ComponentName(context, "$basePackage.MainActivityAliasDefault")
    val tealComponent = ComponentName(context, "$basePackage.MainActivityAliasTeal")
    val purpleComponent = ComponentName(context, "$basePackage.MainActivityAliasPurple")
    val goldComponent = ComponentName(context, "$basePackage.MainActivityAliasGold")
    
    val components = listOf(defaultComponent, tealComponent, purpleComponent, goldComponent)
    
    val targetComponent = when (colorName.lowercase()) {
        "teal" -> tealComponent
        "purple" -> purpleComponent
        "gold" -> goldComponent
        else -> defaultComponent
    }
    
    for (comp in components) {
        val state = if (comp == targetComponent) {
            PackageManager.COMPONENT_ENABLED_STATE_ENABLED
        } else {
            PackageManager.COMPONENT_ENABLED_STATE_DISABLED
        }
        try {
            pm.setComponentEnabledSetting(
                comp,
                state,
                PackageManager.DONT_KILL_APP
            )
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}

// GreetingScreen Composable kept for 100% backward-compatibility with screenshot & unit tests
@Composable
fun GreetingScreen(name: String = "Android", modifier: Modifier = Modifier) {
    val infiniteTransition = rememberInfiniteTransition(label = "FloatTransition")
    val floatOffset by infiniteTransition.animateFloat(
        initialValue = -8f,
        targetValue = 8f,
        animationSpec = infiniteRepeatable(
            animation = tween(2500, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "FloatOffset"
    )

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier
                .offset(y = floatOffset.dp)
                .size(80.dp)
                .clip(RoundedCornerShape(24.dp))
                .background(
                    Brush.linearGradient(
                        colors = listOf(AccentTeal, AccentIndigo)
                    )
                )
                .border(1.dp, SoftWhite.copy(alpha = 0.2f), RoundedCornerShape(24.dp)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Star,
                contentDescription = "Star Decoration",
                tint = SoftWhite,
                modifier = Modifier.size(36.dp)
            )
        }

        Spacer(modifier = Modifier.height(32.dp))

        Card(
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, BorderColor, RoundedCornerShape(24.dp))
                .clip(RoundedCornerShape(24.dp)),
            colors = CardDefaults.cardColors(containerColor = CardBg)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 40.dp, horizontal = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "Hello, $name!",
                    color = SoftWhite,
                    fontSize = 32.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.SansSerif,
                    letterSpacing = (-0.5).sp,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = "Welcome to your stable, high-performance, and crash-free Android application built with Jetpack Compose.",
                    color = MutedGray,
                    fontSize = 14.sp,
                    lineHeight = 20.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(horizontal = 16.dp)
                )
            }
        }
    }
}

@Composable
fun Greeting(name: String, modifier: Modifier = Modifier) {
    GreetingScreen(name = name, modifier = modifier)
}

@Preview(showBackground = true)
@Composable
fun GreetingPreview() {
    MyApplicationTheme {
        GreetingScreen("Android")
    }
}
