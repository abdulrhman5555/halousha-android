/**
 * Cloud Function: ترسل إشعار FCM (صامت أو مرئي حسب نوع السجل) فور حدوث أي
 * إضافة/تعديل بمجموعة "updates" بـ Firestore.
 *
 * شكل الوثيقة المتوقع بمجموعة "updates" (تضيفها يدوياً من Firebase Console،
 * أو لاحقاً من صفحة المسؤول لو بنيتها):
 *
 *   {
 *     type: "update",                              // ثابت دايماً لهذا النوع
 *     relativePath: "sections/cooking/index.html", // المسار النسبي بـ assets/web
 *     downloadUrl: "https://...",                  // رابط الملف بـ Firebase Storage
 *     version: 3                                    // اختياري، للمتابعة فقط
 *   }
 *
 * لإشعار مرئي مستقبلي (تذكير مثلاً)، تضيف وثيقة بمجموعة "notifications":
 *   { title: "تذكير", body: "نص الرسالة" }
 */

const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();

const TOPIC = "all_devices";

// ---------- تحديثات صامتة (محتوى الأقسام) ----------
exports.onUpdatePublished = onDocumentWritten("updates/{docId}", async (event) => {
  const data = event.data?.after?.data();
  if (!data) return; // وثيقة حُذفت، لا حاجة لإرسال شي

  const { relativePath, downloadUrl } = data;
  if (!relativePath || !downloadUrl) {
    console.warn("وثيقة تحديث ناقصة الحقول المطلوبة (relativePath / downloadUrl)، تم تجاهلها.");
    return;
  }

  const message = {
    topic: TOPIC,
    data: {
      type: "update",
      relativePath: String(relativePath),
      downloadUrl: String(downloadUrl),
    },
    android: {
      priority: "high", // يضمن استيقاظ الجهاز بسرعة حتى لو التطبيق مقفول
    },
  };

  await getMessaging().send(message);
  console.log(`تم إرسال إشعار تحديث صامت لـ: ${relativePath}`);
});

// ---------- إشعارات مرئية مستقبلية (تذكيرات، رسائل) ----------
exports.onNotificationCreated = onDocumentWritten("notifications/{docId}", async (event) => {
  const data = event.data?.after?.data();
  if (!data) return;

  const { title, body } = data;
  if (!title) return;

  const message = {
    topic: TOPIC,
    notification: {
      title: String(title),
      body: String(body || ""),
    },
  };

  await getMessaging().send(message);
  console.log(`تم إرسال إشعار مرئي: ${title}`);
});
