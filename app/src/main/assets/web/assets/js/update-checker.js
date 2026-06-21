/* ============================================
   Update Checker
   - يسجّل السيرفس وركر (تشغيل أوفلاين)
   - يكتشف تحديث بالكود نفسه (نسخة جديدة من الملفات) ويطبّقه تلقائياً
   - يتحقق من Firebase هل المسؤول رفع تحديث بيانات جديد، ويحدّث القسم المفتوح
   ============================================ */

// ===== 1) تسجيل الـ Service Worker =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').then((reg) => {

      // لو فيه نسخة جديدة قيد التحميل
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated') {
            window.AppToast && window.AppToast('تم تحديث التطبيق ✓');
          }
        });
      });
    }).catch((err) => console.warn('[SW] فشل التسجيل:', err));

    // لما تتولى نسخة جديدة السيطرة فعلياً (بعد skipWaiting) — تحديث هادئ بدون إزعاج
    let refreshed = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshed) return;
      refreshed = true;
      // لا تعمل location.reload() فجأة أثناء استخدام المستخدم لقسم —
      // فقط حدّث الحالة، والتحديث الكامل يصير تلقائياً بفتحة التطبيق الجاية
    });
  });
}

// ===== 2) التحقق من تحديثات بيانات المسؤول عبر Firebase =====
/*
  هذا القسم Placeholder — عبّيه بإعدادات Firebase الفعلية لمشروعك.
  الفكرة: المسؤول كل ما يحدّث محتوى، يحدّث حقل زمني مثل:
      app_meta/last_update = <timestamp>
  والتطبيق يقارنه بآخر نسخة شافها محلياً (localStorage)،
  ولو فيه فرق → يحدّث القسم المفتوح بدون ما يحتاج المستخدم يسوي شي.
*/

const LAST_SEEN_KEY = 'app_last_update_seen';

async function checkForContentUpdates() {
  if (!navigator.onLine) return;

  try {
    window.AppShell && window.AppShell.setStatusSyncing(true);

    // ---- مثال باستخدام Firebase (عدّل حسب SDK مشروعك الفعلي) ----
    // import { getDatabase, ref, get } from "firebase/database";
    // const db = getDatabase();
    // const snap = await get(ref(db, 'app_meta/last_update'));
    // const remoteTimestamp = snap.val();

    const remoteTimestamp = await fetchRemoteVersionPlaceholder();

    const lastSeen = localStorage.getItem(LAST_SEEN_KEY);

    if (remoteTimestamp && String(remoteTimestamp) !== lastSeen) {
      localStorage.setItem(LAST_SEEN_KEY, remoteTimestamp);

      // حدّث القسم المفتوح حالياً (إن وجد) بإجبار الإطار يعيد التحميل من الشبكة
      const frame = document.getElementById('sectionFrame');
      if (frame && frame.src) {
        const url = new URL(frame.src, location.href);
        url.searchParams.set('_v', remoteTimestamp);
        frame.src = url.toString();
      }

      window.AppToast && window.AppToast('تم تحديث المحتوى من المسؤول ✓');
    }
  } catch (err) {
    console.warn('[Update Check] فشل التحقق:', err);
  } finally {
    window.AppShell && window.AppShell.setStatusSyncing(false);
  }
}

// ---- يُستبدل بقراءة فعلية من Firebase ----
async function fetchRemoteVersionPlaceholder() {
  return null; // ضع هنا الاستدعاء الفعلي لـ Firebase
}

// تحقق عند فتح التطبيق
document.addEventListener('DOMContentLoaded', checkForContentUpdates);

// تحقق فور رجوع الإنترنت
window.addEventListener('online', checkForContentUpdates);

// تحقق دوري كل 5 دقائق (فقط إذا كان التطبيق مفتوحاً فعلياً في الواجهة)
setInterval(checkForContentUpdates, 5 * 60 * 1000);
