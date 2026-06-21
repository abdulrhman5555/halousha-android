/* ============================================
   إعدادات Firebase
   ============================================
   هذا الملف فاضي حالياً عمداً — لسه ما بنينا مشروع Firebase.
   لما نبني الطبقة الثانية (Firestore + Storage + Cloud Function)،
   راح نعبّي القيم تحت من إعدادات مشروعك بـ Firebase Console،
   بدون أي تعديل بباقي الملفات.

   لو تركت الملف فاضي كذا: التطبيق يعمل بشكل طبيعي بالكامل،
   بس يعتمد فقط على الأقسام المخزّنة بالكاش المحلي (sections-loader.js
   يتجاهل Firebase تلقائياً لو الإعدادات غير موجودة).
*/

window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyCMlKPZafKtcqleKA_I4IZ-Qm-bBiuMO1Y",
  authDomain: "halousha-daecb.firebaseapp.com",
  projectId: "halousha-daecb",
  storageBucket: "halousha-daecb.firebasestorage.app",
  messagingSenderId: "695078572113",
  appId: "1:695078572113:android:cbb53da0dcf62e0a3fa870"
};
