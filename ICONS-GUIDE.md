# دليل إضافة الأيقونات البديلة (10 خانات)

النظام يدعم 10 أيقونات من الأساس بالكود (`IconSwitcher.kt` + `AndroidManifest.xml`).
حالياً فقط **الأيقونة 0** (الافتراضية) عندها صورة فعلية. لإضافة أيقونة جديدة (مثلاً رقم 1):

## الخطوات
1. جهّز صورة الأيقونة بـ 5 أحجام (مربعة، خلفية معتمة تناسب الذهبي الداكن):
   - `48x48`, `72x72`, `96x96`, `144x144`, `192x192` بكسل

2. سمّ كل صورة `ic_launcher_01.png` (للأيقونة رقم 1، أو `_02` للي بعدها، إلخ).

3. ضعها بكل واحد من هذي المجلدات (نفس الصورة بحجمها المناسب لكل مجلد):
   ```
   app/src/main/res/mipmap-mdpi/ic_launcher_01.png      (48x48)
   app/src/main/res/mipmap-hdpi/ic_launcher_01.png      (72x72)
   app/src/main/res/mipmap-xhdpi/ic_launcher_01.png     (96x96)
   app/src/main/res/mipmap-xxhdpi/ic_launcher_01.png    (144x144)
   app/src/main/res/mipmap-xxxhdpi/ic_launcher_01.png   (192x192)
   ```

4. ارفع التعديل لـ GitHub — يبني APK جديد تلقائياً وفيه الأيقونة الجديدة جاهزة للاستخدام.

## ملاحظة مهمة
ما تحتاج تلمس `AndroidManifest.xml` أو أي كود Kotlin — الخانات (`IconAlias01` لين `IconAlias09`) موجودة مسبقاً بالمشروع، فقط تحتاج الصورة عشان تصير "متاحة" تلقائياً (دالة `getAvailableIcons()` تكتشفها لحالها).

لتفعيل أيقونة معيّنة من صفحة ويب (لاحقاً عبر صفحة إعدادات بالتطبيق)، تستدعي:
```javascript
AndroidBridge.switchIcon(1); // يبدّل لأيقونة رقم 1
```
