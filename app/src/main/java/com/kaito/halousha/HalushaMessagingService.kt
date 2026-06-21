package com.kaito.halousha

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.work.Data
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

/**
 * تستقبل كل رسائل FCM.
 *
 * نوعين من الرسائل:
 * 1) رسالة صامتة (data فقط، بدون notification) — تحتوي مفاتيح:
 *      type        = "update"
 *      relativePath = "sections/cooking/index.html"   (المسار النسبي داخل assets/web)
 *      downloadUrl  = رابط الملف الجديد من Firebase Storage
 *    هذي تُعالج بصمت تام عبر WorkManager (يحمّل الملف بالخلفية، بدون أي إشعار يشوفه المستخدم).
 *
 * 2) رسالة فيها notification payload (مستقبلية، مثل تذكير) — تُعرض كإشعار عادي يشوفه أخوك.
 */
class HalushaMessagingService : FirebaseMessagingService() {

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)

        val data = message.data

        // ---------- حالة 1: تحديث صامت ----------
        if (data["type"] == "update") {
            val relativePath = data["relativePath"]
            val downloadUrl = data["downloadUrl"]

            if (!relativePath.isNullOrBlank() && !downloadUrl.isNullOrBlank()) {
                val workData = Data.Builder()
                    .putString("relativePath", relativePath)
                    .putString("downloadUrl", downloadUrl)
                    .build()

                val request = OneTimeWorkRequestBuilder<UpdateDownloadWorker>()
                    .setInputData(workData)
                    .build()

                WorkManager.getInstance(applicationContext).enqueue(request)
            }
            return // مهم: ما نعرض أي إشعار لهذا النوع
        }

        // ---------- حالة 2: إشعار مرئي مستقبلي (تذكير، رسالة...) ----------
        message.notification?.let { notif ->
            showVisibleNotification(
                title = notif.title ?: "Halousha",
                body = notif.body ?: ""
            )
        }
    }

    private fun showVisibleNotification(title: String, body: String) {
        val channelId = "halousha_default_channel"
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "إشعارات Halousha",
                NotificationManager.IMPORTANCE_DEFAULT
            )
            manager.createNotificationChannel(channel)
        }

        val builder = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.mipmap.ic_launcher_default)
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)

        manager.notify(System.currentTimeMillis().toInt(), builder.build())
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        // التوكن يُسجَّل تلقائياً بـ Firebase — ما نحتاج نرسله ليدنا لأننا نستخدم نظام Topics
        // (التطبيق يشترك بـ topic "all_devices" من MainActivity، فالإشعار يوصل بدون حفظ توكن فردي)
    }
}
