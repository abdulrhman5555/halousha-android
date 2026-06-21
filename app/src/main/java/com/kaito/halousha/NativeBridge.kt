package com.kaito.halousha

import android.content.Context
import android.webkit.JavascriptInterface

/**
 * الجسر بين صفحات الويب (JavaScript) وكود Android (Kotlin).
 *
 * من صفحة الويب، يُستدعى بالشكل:
 *   AndroidBridge.switchIcon(3)     // يبدّل لأيقونة رقم 3
 *   AndroidBridge.getCurrentIcon()  // يرجّع رقم الأيقونة الحالية
 *
 * فقط الدوال المعلّمة بـ @JavascriptInterface مرئية لـ JS — أي شي غير معلّم
 * يبقى مخفي تماماً عن صفحات الويب.
 */
class NativeBridge(private val context: Context) {

    @JavascriptInterface
    fun switchIcon(iconIndex: Int) {
        IconSwitcher.switchTo(context, iconIndex)
    }

    @JavascriptInterface
    fun getCurrentIcon(): Int {
        return IconSwitcher.getCurrentIndex(context)
    }

    @JavascriptInterface
    fun getAvailableIcons(): String {
        // يرجّع قائمة بأرقام الأيقونات المتاحة فعلياً (اللي عندها صورة حقيقية مرفوعة)
        return IconSwitcher.getAvailableIconsJson(context)
    }
}
