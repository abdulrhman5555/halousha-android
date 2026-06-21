/* ============================================
   Shell Navigation — التنقل بين الأقسام
   كل قسم يبقى ملف منفصل تماماً (iframe) — صفر تعارض أكواد
   ============================================ */

(() => {
  const header      = document.getElementById('appHeader');
  const homeGrid     = document.getElementById('homeGrid');
  const sectionView  = document.getElementById('sectionView');
  const sectionFrame = document.getElementById('sectionFrame');
  const sectionTitle = document.getElementById('sectionTitle');
  const backBtn       = document.getElementById('backBtn');
  const loadBar       = document.getElementById('loadBar');
  const statusDot     = document.getElementById('statusDot');

  const SECTION_NAMES = {
    music: 'الأغاني', drawing: 'الرسم', ai: 'AI', stories: 'الروايات',
    cooking: 'الطبخ', photos: 'الصور', games: 'الألعاب', admin: 'المسؤول'
  };

  // ---------- فتح قسم ----------
  function openSection(key, src, { pushState = true } = {}) {
    if (!key || !src) return;

    loadBar.classList.add('is-active');

    sectionFrame.onload = () => {
      loadBar.classList.remove('is-active');
    };

    // إعادة تحميل الإطار فقط لو القسم اختلف (تجنب إعادة تحميل بلا داعي)
    if (sectionFrame.dataset.currentSrc !== src) {
      sectionFrame.src = src;
      sectionFrame.dataset.currentSrc = src;
    } else {
      loadBar.classList.remove('is-active');
    }

    homeGrid.style.display = 'none';
    sectionView.classList.add('is-active');

    header.classList.add('is-section');
    sectionTitle.textContent = SECTION_NAMES[key] || key;
    sectionTitle.style.display = 'inline';

    if (pushState) {
      history.pushState({ section: key, src }, '', '#' + key);
    }
  }

  // ---------- الرجوع للرئيسية ----------
  function goHome({ pushState = true } = {}) {
    sectionView.classList.remove('is-active');
    homeGrid.style.display = 'grid';

    header.classList.remove('is-section');
    sectionTitle.style.display = 'none';

    if (pushState) {
      history.pushState({ section: null }, '', '#');
    }
  }

  // ---------- ربط البطاقات (delegation: يدعم البطاقات المُضافة ديناميكياً من sections-loader.js) ----------
  homeGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.section-card');
    if (!card) return;
    openSection(card.dataset.section, card.dataset.src);
  });

  // إعادة محاولة فتح القسم من الهاش لو البطاقات تأخرت بالتحميل (تُستدعى من sections-loader.js بعد الحقن)
  window.tryOpenFromHash = function () {
    const key = location.hash.replace('#', '');
    const card = key && homeGrid.querySelector(`[data-section="${key}"]`);
    if (card) {
      openSection(key, card.dataset.src, { pushState: false });
    }
  };

  backBtn.addEventListener('click', () => goHome());

  // ---------- دعم زر الرجوع في أندرويد (popstate) ----------
  window.addEventListener('popstate', (e) => {
    const state = e.state;
    if (state && state.section) {
      openSection(state.section, state.src, { pushState: false });
    } else {
      goHome({ pushState: false });
    }
  });

  // ملاحظة: فتح القسم من الهاش (بعد تحديث الصفحة) يصير الآن عبر window.tryOpenFromHash()
  // التي تُستدعى من sections-loader.js فور ما تُحقن البطاقات بالـ DOM (تجنباً لفرصة سباق race condition)

  // ---------- مؤشر الاتصال بالإنترنت ----------
  function updateStatus() {
    statusDot.classList.toggle('is-offline', !navigator.onLine);
    statusDot.title = navigator.onLine ? 'متصل' : 'غير متصل (أوفلاين)';
  }
  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);
  updateStatus();

  // واجهة بسيطة يستخدمها update-checker.js لإظهار رسائل للمستخدم
  window.AppToast = function (msg, ms = 2200) {
    const toast = document.getElementById('syncToast');
    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => toast.classList.remove('is-visible'), ms);
  };

  window.AppShell = { openSection, goHome, setStatusSyncing: (on) => {
    statusDot.classList.toggle('is-syncing', !!on);
  }};
})();
