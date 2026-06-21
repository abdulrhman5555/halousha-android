package com.kaito.halousha

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

/**
 * يحمّل ملف محدّث من رابط Firebase Storage ويحفظه بمجلد قابل للكتابة
 * (filesDir/web_override/...) — لأن مجلد assets/ بالـ APK غير قابل للتعديل
 * وقت التشغيل (read-only)، فلا يمكن "تحديث" ملف فيه مباشرة.
 *
 * AssetOverrideWebViewClient (بـ MainActivity) يتحقق من هذا المجلد أولاً
 * قبل assets/web — فلو الملف موجود هنا، يُستخدم تلقائياً بدل النسخة الأصلية.
 */
class UpdateDownloadWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val relativePath = inputData.getString("relativePath") ?: return Result.failure()
        val downloadUrl = inputData.getString("downloadUrl") ?: return Result.failure()

        return try {
            val destFile = File(applicationContext.filesDir, "web_override/$relativePath")
            destFile.parentFile?.mkdirs()

            val connection = URL(downloadUrl).openConnection() as HttpURLConnection
            connection.connectTimeout = 15000
            connection.readTimeout = 15000
            connection.connect()

            if (connection.responseCode == HttpURLConnection.HTTP_OK) {
                connection.inputStream.use { input ->
                    destFile.outputStream().use { output ->
                        input.copyTo(output)
                    }
                }
                Result.success()
            } else {
                Result.retry()
            }
        } catch (e: Exception) {
            Result.retry()
        }
    }
}
