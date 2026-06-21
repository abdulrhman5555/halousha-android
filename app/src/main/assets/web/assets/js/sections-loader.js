/* ============================================
   Sections Loader — بناء الشاشة الرئيسية ديناميكياً
   ============================================
   المبدأ:
   1) عند فتح التطبيق: نعرض فوراً آخر قائمة أقسام محفوظة محلياً (localStorage)
      — يعمل أوفلاين 100%، بدون أي انتظار.
   2) لو فيه نت ومُعرَّف FIREBASE_CONFIG (assets/js/firebase-config.js):
      نتصل بـ Firestore ونستمع لحظياً (onSnapshot) لمجموعة "sections".
      أي إضافة/تعديل/حذف قسم من جهتك (المسؤول) ينعكس فوراً وهو التطبيق مفتوح.
   3) أول ما تستلم بيانات من Firestore، تُحفظ بالكاش المحلي فوراً،
      فتصير "آخر نسخة معروفة" تُستخدم بالمرة الجاية حتى بدون نت.

   شكل سجل القسم الواحد بـ Firestore (مجموعة sections، كل وثيقة = قسم):
   {
     key:   "music",                         // مفتاح فريد للقسم
     label: "الأغاني",                        // الاسم المعروض
     icon:  "🎵",                             // إيموجي/أيقونة العرض
     hint:  "المكتبة الصوتية",                 // وصف قصير تحت الاسم
     src:   "sections/music/index.html",      // مسار الملف المحلي بعد التحديث
     order: 1,                                // ترتيب العرض بالشبكة
     fullWidth: false                         // true لبطاقات بعرض كامل (مثل المسؤول)
   }
*/

(() => {
  const CACHE_KEY = 'halousha_sections_cache_v1';
  const homeGrid = document.getElementById('homeGrid');

  // ---------- القائمة الافتراضية (تُستخدم فقط أول تشغيل قبل أي كاش) ----------
  const FALLBACK_SECTIONS = [
    { key: 'music',   label: 'الأغاني',   icon: '🎵', hint: 'المكتبة الصوتية',        src: 'sections/music/index.html',   order: 1 },
    { key: 'drawing', label: 'الرسم',     icon: '🎨', hint: 'لوحة الرسم',             src: 'sections/drawing/index.html', order: 2 },
    { key: 'ai',      label: 'AI',        icon: '🤖', hint: 'المساعد الذكي',          src: 'sections/ai/index.html',      order: 3 },
    { key: 'stories', label: 'الروايات',  icon: '📖', hint: 'القراءة والكتابة',       src: 'sections/stories/index.html', order: 4 },
    { key: 'cooking', label: 'الطبخ',     icon: '🍳', hint: 'وصفات',                  src: 'sections/cooking/index.html', order: 5 },
    { key: 'photos',  label: 'الصور',     icon: '🖼️', hint: 'المعرض',                src: 'sections/photos/index.html',  order: 6 },
    { key: 'games',   label: 'الألعاب',   icon: '🎮', hint: 'ألعاب',                  src: 'sections/games/index.html',   order: 7 },
    { key: 'admin',   label: 'المسؤول',   icon: '⚙️', hint: 'لوحة التحكم بكل الأقسام', src: 'sections/admin/index.html',   order: 8, fullWidth: true },
  ];

  // ---------- بناء بطاقة واحدة ----------
  function buildCard(section) {
    const btn = document.createElement('button');
    btn.className = 'section-card' + (section.fullWidth ? ' section-card--full' : '');
    btn.dataset.section = section.key;
    btn.dataset.src = section.src;
    btn.innerHTML = `
      <span class="section-card__icon">${section.icon || '📦'}</span>
      <span class="section-card__label">${section.label || section.key}</span>
      <span class="section-card__hint">${section.hint || ''}</span>
    `;
    return btn;
  }

  // ---------- رسم الشبكة كاملة من قائمة أقسام ----------
  function renderSections(sections) {
    const sorted = [...sections].sort((a, b) => (a.order || 0) - (b.order || 0));
    homeGrid.innerHTML = '';
    sorted.forEach(s => homeGrid.appendChild(buildCard(s)));

    // بعد ما تجهز البطاقات، نحاول نفتح القسم من الهاش لو موجود (مثلاً بعد تحديث الصفحة)
    if (window.tryOpenFromHash) window.tryOpenFromHash();
  }

  // ---------- الكاش المحلي ----------
  function loadFromCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveToCache(sections) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(sections));
    } catch (e) {
      // تخزين ممتلئ أو غير متاح — تجاهل، التطبيق يستمر بالعمل بآخر بطاقات معروضة
    }
  }

  // ---------- الخطوة 1: عرض فوري (كاش أو افتراضي) ----------
  const cached = loadFromCache();
  renderSections(cached || FALLBACK_SECTIONS);

  // ---------- الخطوة 2: الاتصال اللحظي بـ Firestore (لو متاح) ----------
  function startRealtimeSync() {
    if (!window.FIREBASE_CONFIG) return; // ملف الإعدادات فاضي حالياً = تجاهل تماماً
    if (typeof firebase === 'undefined') return; // SDK ما تحمّل (غالباً لعدم وجود نت)

    try {
      if (!firebase.apps || !firebase.apps.length) {
        firebase.initializeApp(window.FIREBASE_CONFIG);
      }
      const db = firebase.firestore();

      db.collection('sections').onSnapshot(
        (snapshot) => {
          const sections = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            if (data && data.key && data.src) sections.push(data);
          });
          if (sections.length > 0) {
            renderSections(sections);
            saveToCache(sections);
          }
        },
        (error) => {
          // فشل الاتصال (مثلاً انقطع النت أثناء الاستماع) — نستمر بآخر بطاقات معروضة بدون أي كسر
          console.warn('sections-loader: تعذّر الاتصال اللحظي بـ Firestore، الاستمرار بالكاش المحلي', error);
        }
      );
    } catch (e) {
      console.warn('sections-loader: تعذّر تهيئة Firebase', e);
    }
  }

  // نبدأ المزامنة اللحظية بعد عرض الكاش فوراً، وما تمنع ظهور الشاشة لو تأخرت أو فشلت
  startRealtimeSync();

  // لو رجع النت بعد انقطاع، نحاول نبدأ الاستماع من جديد (في حال فشلت أول مرة)
  window.addEventListener('online', () => startRealtimeSync());
})();
