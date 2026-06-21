package com.kaito.halousha

import android.content.ComponentName
import android.content.Context
import android.content.SharedPreferences
import android.content.pm.PackageManager

/**
 * يتحكم بتبديل أيقونة التطبيق فعلياً.
 *
 * المبدأ: عندنا 10 خانات (IconAlias00 .. IconAlias09) معرّفة بالـ AndroidManifest.
 * في كل لحظة، خانة واحدة فقط enabled والباقي disabled.
 *
 * إضافة أيقونة جديدة لاحقاً تحتاج فقط:
 *   1. وضع صورة باسم ic_launcher_04 (مثلاً) بمجلد mipmap المناسب
 *   2. (اختياري) تحديث ICON_LABELS تحت لاسم مخصص
 * بدون أي تعديل آخر بالكود أو الـ Manifest.
 */
object IconSwitcher {

    private const val PREFS_NAME = "halousha_icon_prefs"
    private const val KEY_CURRENT_ICON = "current_icon_index"
    private const val ICON_COUNT = 10
    private const val PACKAGE = "com.kaito.halousha"

    private val ICON_LABELS = mapOf(
        0 to "الافتراضية",
        1 to "أيقونة 1", 2 to "أيقونة 2", 3 to "أيقونة 3", 4 to "أيقونة 4",
        5 to "أيقونة 5", 6 to "أيقونة 6", 7 to "أيقونة 7", 8 to "أيقونة 8", 9 to "أيقونة 9"
    )

    private fun prefs(context: Context): SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    private fun aliasClassName(index: Int): String {
        val padded = index.toString().padStart(2, '0')
        return "$PACKAGE.IconAlias$padded"
    }

    fun getCurrentIndex(context: Context): Int {
        return prefs(context).getInt(KEY_CURRENT_ICON, 0)
    }

    fun switchTo(context: Context, newIndex: Int) {
        if (newIndex < 0 || newIndex >= ICON_COUNT) return

        val pm = context.packageManager
        val currentIndex = getCurrentIndex(context)
        if (currentIndex == newIndex) return

        pm.setComponentEnabledSetting(
            ComponentName(PACKAGE, aliasClassName(currentIndex)),
            PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
            PackageManager.DONT_KILL_APP
        )

        pm.setComponentEnabledSetting(
            ComponentName(PACKAGE, aliasClassName(newIndex)),
            PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
            PackageManager.DONT_KILL_APP
        )

        prefs(context).edit().putInt(KEY_CURRENT_ICON, newIndex).apply()
    }

    /**
     * يرجّع JSON بقائمة الأيقونات المتاحة فعلياً (اللي عندها drawable حقيقي بالمشروع).
     */
    fun getAvailableIconsJson(context: Context): String {
        val resources = context.resources
        val pkg = context.packageName
        val sb = StringBuilder("[")
        var first = true

        for (i in 0 until ICON_COUNT) {
            val resName = if (i == 0) "ic_launcher_default" else "ic_launcher_" + i.toString().padStart(2, '0')
            val resId = resources.getIdentifier(resName, "mipmap", pkg)
            if (resId != 0) {
                if (!first) sb.append(",")
                sb.append("{\"index\":$i,\"label\":\"${ICON_LABELS[i] ?: "أيقونة $i"}\"}")
                first = false
            }
        }
        sb.append("]")
        return sb.toString()
    }
}
