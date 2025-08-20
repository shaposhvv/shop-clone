// Global client-side cart with localStorage persistence
(function () {
  var storageKey = 'cart';
  var cartCountEl = document.getElementById('cart-count');
  var cartCount = 0;

  function readCart() {
    try {
      var raw = localStorage.getItem(storageKey);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function writeCart(items) {
    try { localStorage.setItem(storageKey, JSON.stringify(items)); } catch (_) {}
  }

  function getTotalQty(items) {
    return items.reduce(function (sum, it) { return sum + (parseInt(it.qty || 1, 10) || 1); }, 0);
  }

  function updateCartBadge() {
    if (cartCountEl) {
      cartCountEl.textContent = String(cartCount);
    }
  }

  function syncCartCountFromStorage() {
    var items = readCart();
    cartCount = getTotalQty(items);
    updateCartBadge();
  }

  function addItemToCart(item) {
    var items = readCart();
    var idx = items.findIndex(function (it) { return it.id === item.id; });
    if (idx >= 0) {
      items[idx].qty = (parseInt(items[idx].qty || 1, 10) || 1) + (parseInt(item.qty || 1, 10) || 1);
    } else {
      items.push({ id: item.id, title: item.title, price: item.price, image: item.image, qty: parseInt(item.qty || 1, 10) || 1 });
    }
    writeCart(items);
    cartCount = getTotalQty(items);
    updateCartBadge();
  }

  // Back-compat simple increment if details are not provided
  function incrementCountOnly() {
    cartCount += 1;
    updateCartBadge();
  }

  // Expose API
  try {
    window.addToCart = function (item) {
      if (item && item.id) { addItemToCart(item); } else { incrementCountOnly(); }
    };
  } catch (_) {}

  // Hook up "Add to cart" buttons
  function bindAddToCartButtons() {
    var buttons = document.querySelectorAll('.add-to-cart');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-id');
        var title = btn.getAttribute('data-title');
        var price = parseInt(btn.getAttribute('data-price') || '0', 10) || 0;
        var image = btn.getAttribute('data-image') || '';
        if (id && title) {
          try { window.addToCart({ id: id, title: title, price: price, image: image, qty: 1 }); } catch (_) { addItemToCart({ id: id, title: title, price: price, image: image, qty: 1 }); }
        } else {
          try { window.addToCart(); } catch (_) { incrementCountOnly(); }
        }
      });
    });
  }

  // Hero slider with autoplay, dots, arrows, and swipe
  function initHeroSlider() {
    var slider = document.querySelector('.hero-slider');
    if (!slider) return;

    var slidesWrap = slider.querySelector('.slides');
    var slides = slider.querySelectorAll('.slide');
    var prevBtn = slider.querySelector('.arrow.prev');
    var nextBtn = slider.querySelector('.arrow.next');
    var dotsWrap = slider.querySelector('.dots');

    if (!slidesWrap || slides.length === 0) return;

    var index = 0;
    var timerId = null;
    var autoplayMs = 5000;

    function goTo(i) {
      index = (i + slides.length) % slides.length;
      slidesWrap.style.transform = 'translateX(' + (-index * 100) + '%)';
      if (dotsWrap) {
        Array.from(dotsWrap.children).forEach(function (dot, di) {
          dot.classList.toggle('active', di === index);
          dot.setAttribute('aria-current', di === index ? 'true' : 'false');
        });
      }
    }

    function next() { goTo(index + 1); }
    function prev() { goTo(index - 1); }

    // Dots
    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      slides.forEach(function (_, i) {
        var dot = document.createElement('button');
        dot.className = 'dot' + (i === 0 ? ' active' : '');
        dot.type = 'button';
        dot.setAttribute('aria-label', 'Перейти к слайду ' + (i + 1));
        dot.addEventListener('click', function () { goTo(i); });
        dotsWrap.appendChild(dot);
      });
    }

    // Arrows
    if (prevBtn) prevBtn.addEventListener('click', prev);
    if (nextBtn) nextBtn.addEventListener('click', next);

    // Autoplay
    var timer = setInterval(next, autoplayMs);
    slider.addEventListener('mouseenter', function () { clearInterval(timer); });
    slider.addEventListener('mouseleave', function () { timer = setInterval(next, autoplayMs); });

    // Swipe support
    var startX = 0;
    var deltaX = 0;
    var swiping = false;
    var threshold = 30;

    slider.addEventListener('touchstart', function (e) {
      if (!e.touches || e.touches.length === 0) return;
      startX = e.touches[0].clientX;
      deltaX = 0;
      swiping = true;
    }, { passive: true });

    slider.addEventListener('touchmove', function (e) {
      if (!swiping || !e.touches || e.touches.length === 0) return;
      deltaX = e.touches[0].clientX - startX;
    }, { passive: true });

    slider.addEventListener('touchend', function () {
      if (!swiping) return;
      if (Math.abs(deltaX) > threshold) {
        if (deltaX < 0) next(); else prev();
      }
      swiping = false;
    });

    // Init
    goTo(0);
  }

  // IntersectionObserver-based reveal animations
  function initScrollReveal() {
    var supportsIO = 'IntersectionObserver' in window;
    var elements = document.querySelectorAll('.reveal');
    if (elements.length === 0) return;

    if (!supportsIO) {
      elements.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

    elements.forEach(function (el) { observer.observe(el); });
  }

  // Theme toggle with localStorage persistence
  function initThemeToggle() {
    var storageKey = 'theme';
    var html = document.documentElement;

    function applyTheme(t) {
      var isDark = t === 'dark';
      html.classList.toggle('theme-dark', isDark);
    }

    var stored = null;
    try { stored = localStorage.getItem(storageKey); } catch (_) {}
    if (stored !== 'dark' && stored !== 'light') {
      var prefersDark = false;
      try { prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; } catch (_) {}
      stored = prefersDark ? 'dark' : 'light';
    }
    applyTheme(stored);

    var btn = document.querySelector('.theme-toggle');
    function updateButton() {
      if (!btn) return;
      var isDark = html.classList.contains('theme-dark');
      btn.textContent = isDark ? '☀️' : '🌙';
      btn.setAttribute('aria-label', isDark ? 'Светлая тема' : 'Тёмная тема');
      btn.setAttribute('title', isDark ? 'Переключить на светлую' : 'Переключить на тёмную');
    }
    updateButton();
    if (btn) {
      btn.addEventListener('click', function () {
        var next = html.classList.contains('theme-dark') ? 'light' : 'dark';
        applyTheme(next);
        try { localStorage.setItem(storageKey, next); } catch (_) {}
        updateButton();
      });
    }
  }

  // Product page: gallery (click + swipe)
  function initProductGallery() {
    var gallery = document.getElementById('product-gallery');
    if (!gallery) return;
    var mainImg = document.getElementById('product-main-image');
    var thumbs = gallery.querySelectorAll('.thumb');
    var images = [
      './assets/images/product1.jpg',
      './assets/images/hero1.jpg',
      './assets/images/hero2.jpg',
      './assets/images/hero3.jpg'
    ];
    var index = 0;

    function goTo(i) {
      index = (i + images.length) % images.length;
      if (mainImg) { mainImg.src = images[index]; }
      Array.from(thumbs).forEach(function (t, ti) {
        t.classList.toggle('is-active', ti === index);
        t.setAttribute('aria-selected', ti === index ? 'true' : 'false');
      });
    }

    thumbs.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var i = parseInt(btn.getAttribute('data-index') || '0', 10) || 0;
        goTo(i);
      });
    });

    // Swipe on main image
    var frame = gallery.querySelector('.product-image-frame');
    if (frame) {
      var startX = 0; var deltaX = 0; var swiping = false; var threshold = 30;
      frame.addEventListener('touchstart', function (e) {
        if (!e.touches || e.touches.length === 0) return;
        startX = e.touches[0].clientX; deltaX = 0; swiping = true;
      }, { passive: true });
      frame.addEventListener('touchmove', function (e) {
        if (!swiping || !e.touches || e.touches.length === 0) return;
        deltaX = e.touches[0].clientX - startX;
      }, { passive: true });
      frame.addEventListener('touchend', function () {
        if (!swiping) return;
        if (Math.abs(deltaX) > threshold) { if (deltaX < 0) goTo(index + 1); else goTo(index - 1); }
        swiping = false;
      });
    }

    goTo(0);
  }

  // Product page: tabs
  function initProductTabs() {
    var tabs = document.getElementById('product-tabs');
    if (!tabs) return;
    var buttons = tabs.querySelectorAll('.tab-button');
    var panels = tabs.querySelectorAll('.tab-panel');
    function activate(id) {
      buttons.forEach(function (b) {
        var on = b.getAttribute('aria-controls') === id;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      panels.forEach(function (p) {
        var on = p.id === id;
        p.classList.toggle('is-active', on);
        if (on) { p.removeAttribute('hidden'); } else { p.setAttribute('hidden', ''); }
      });
    }
    buttons.forEach(function (b) {
      b.addEventListener('click', function () { activate(b.getAttribute('aria-controls')); });
    });
  }

  function initOneClickBuy() {
    var btn = document.querySelector('.one-click-buy');
    if (!btn) return;
    btn.addEventListener('click', function () {
      alert('Спасибо! Наш менеджер свяжется с вами в ближайшее время. (имитация)');
    });
  }

  // Initialize modules
  document.addEventListener('DOMContentLoaded', function () {
    syncCartCountFromStorage();
    bindAddToCartButtons();
    initHeroSlider();

    // Mark sections for reveal if not already
    document.querySelectorAll('.section').forEach(function (el) {
      el.classList.add('reveal');
    });
    initScrollReveal();
    initThemeToggle();

    // Product page features
    initProductGallery();
    initProductTabs();
    initOneClickBuy();

    // Mobile menu toggle
    var menuBtn = document.querySelector('.menu-toggle');
    var nav = document.getElementById('site-nav');
    if (menuBtn && nav) {
      menuBtn.addEventListener('click', function () {
        var isOpen = nav.classList.toggle('open');
        menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
    }

    // Search toggle on mobile
    var searchBtn = document.querySelector('.search-toggle');
    var searchForm = document.getElementById('site-search');
    if (searchBtn && searchForm) {
      searchBtn.addEventListener('click', function () {
        var isOpen = searchForm.classList.toggle('open');
        searchBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        if (isOpen) {
          var input = searchForm.querySelector('input');
          if (input) setTimeout(function(){ input.focus(); }, 0);
        }
      });
    }

    // Header search submit -> redirect to catalog with query param
    if (searchForm) {
      searchForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var qInput = searchForm.querySelector('input[type="search"]');
        var qVal = qInput ? (qInput.value || '').trim() : '';
        var url = 'catalog.html' + (qVal ? ('?q=' + encodeURIComponent(qVal)) : '');
        window.location.href = url;
      });
    }

    // Cookie consent
    (function(){
      var bar = document.getElementById('cookie-bar');
      var btn = document.getElementById('cookie-accept');
      if (bar && btn) {
        var accepted = false;
        try { accepted = localStorage.getItem('cookieAccepted') === '1'; } catch(_) {}
        if (!accepted) bar.classList.add('show');
        btn.addEventListener('click', function(){
          try { localStorage.setItem('cookieAccepted', '1'); } catch(_) {}
          bar.classList.remove('show');
        });
      }
    })();

    // Mega menu interactions
    (function(){
      var items = document.querySelectorAll('.mega-item');
      if (!items || items.length === 0) return;
      var panels = {
        laundry: document.getElementById('mega-laundry'),
        kitchen: document.getElementById('mega-kitchen'),
        home: document.getElementById('mega-home'),
        chem: document.getElementById('mega-chem'),
        pro: document.getElementById('mega-pro')
      };
      function closeAll(){
        Object.keys(panels).forEach(function(k){ var p = panels[k]; if (p) p.classList.remove('open'); });
      }
      items.forEach(function(it){
        it.addEventListener('mouseenter', function(){
          closeAll();
          var key = it.getAttribute('data-mega');
          var panel = panels[key];
          if (panel) panel.classList.add('open');
        });
      });
      var megaBar = document.querySelector('.mega-bar');
      if (megaBar) megaBar.addEventListener('mouseleave', closeAll);
    })();

    // Render cart page if present
    renderCartPage();
  });
})();

// -----------------------
// Catalog (filters/sort/pagination)
// -----------------------
(function () {
  var productsListEl;
  var paginationEl;
  var resultsCountEl;
  var sortSelectEl;
  var perPageSelectEl;
  var availabilitySwitchEl;
  var priceInputMinEl;
  var priceInputMaxEl;
  var priceRangeMinEl;
  var priceRangeMaxEl;

  var allProducts = [];
  var filteredProducts = [];
  var currentPage = 1;

  var categories = ['oven', 'hob', 'fridge', 'dishwasher', 'washing'];
  var brands = ['Miele', 'Bosch', 'Siemens', 'AEG', 'Samsung', 'LG'];

  function rand(seed) {
    var x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  function generateProducts(count) {
    var items = [];
    for (var i = 1; i <= count; i++) {
      var c = categories[i % categories.length];
      var b = brands[i % brands.length];
      var priceBase = 14990 + Math.floor(rand(i) * 180000);
      var available = rand(i * 7) > 0.25; // ~75% в наличии
      var createdAt = Date.now() - Math.floor(rand(i * 13) * 1000 * 60 * 60 * 24 * 180); // до 6 мес
      var popularity = Math.floor(rand(i * 17) * 1000);
      var titleMap = {
        oven: 'Духовой шкаф',
        hob: 'Варочная панель',
        fridge: 'Холодильник',
        dishwasher: 'Посудомоечная машина',
        washing: 'Стиральная машина'
      };
      var title = titleMap[c] + ' ' + b + ' ' + (100 + (i % 900));
      var imageByCategory = {
        oven: './assets/images/hero1.jpg',
        hob: './assets/images/hero2.jpg',
        fridge: './assets/images/hero3.jpg',
        dishwasher: './assets/images/cat1.jpg',
        washing: './assets/images/cat2.jpg'
      };
      items.push({
        id: i,
        title: title,
        category: c,
        brand: b,
        price: priceBase,
        available: available,
        createdAt: createdAt,
        popularity: popularity,
        image: imageByCategory[c] || './assets/images/cat3.jpg'
      });
    }
    return items;
  }

  function formatPriceRub(num) {
    try {
      return num.toLocaleString('ru-RU') + ' ₽';
    } catch (_) {
      return String(num) + ' ₽';
    }
  }

  function createProductCard(product) {
    // Современная карточка каталога: .thumb + .content + .footer
    var article = document.createElement('article');
    article.className = 'product-card';
    article.setAttribute('data-category', product.category);
    article.setAttribute('data-brand', product.brand);
    article.setAttribute('data-price', String(product.price));
    article.setAttribute('data-available', product.available ? 'true' : 'false');

    var safeTitle = product.title.replace(/"/g, '&quot;');
    article.innerHTML = '' +
      '<div class="thumb"><img src="' + product.image + '" alt="' + safeTitle + '" loading="lazy"></div>' +
      '<div class="content">' +
      '  <div class="title">' + product.title + '</div>' +
      '  <div class="meta"><span class="rating" aria-label="Рейтинг 5 из 5">★★★★★</span></div>' +
      '</div>' +
      '<div class="footer">' +
      '  <div class="price">' + formatPriceRub(product.price) + '</div>' +
      '  <div class="actions">' +
      '    <a class="btn" href="product.html">Подробнее</a>' +
      '    <button class="btn primary add-to-cart" type="button" data-id="p-' + product.id + '" data-title="' + safeTitle + '" data-price="' + product.price + '" data-image="' + product.image + '">В корзину</button>' +
      '  </div>' +
      '</div>';

    return article;
  }

  function getCheckedValues(name) {
    var inputs = document.querySelectorAll('input[name="' + name + '"]:checked');
    return Array.from(inputs).map(function (el) { return el.value; });
  }

  function getFilters() {
    var cats = getCheckedValues('category');
    var brs = getCheckedValues('brand');
    var onlyAvailable = !!(availabilitySwitchEl && availabilitySwitchEl.checked);
    var minPrice = priceInputMinEl ? parseInt(priceInputMinEl.value || '0', 10) : 0;
    var maxPrice = priceInputMaxEl ? parseInt(priceInputMaxEl.value || '200000', 10) : 200000;
    return { categories: cats, brands: brs, onlyAvailable: onlyAvailable, minPrice: minPrice, maxPrice: maxPrice };
  }

  function applyFilters() {
    var f = getFilters();
    filteredProducts = allProducts.filter(function (p) {
      if (f.categories.length && f.categories.indexOf(p.category) === -1) return false;
      if (f.brands.length && f.brands.indexOf(p.brand) === -1) return false;
      if (f.onlyAvailable && !p.available) return false;
      if (p.price < f.minPrice || p.price > f.maxPrice) return false;
      return true;
    });
  }

  function applySort() {
    var sort = sortSelectEl ? sortSelectEl.value : 'popular';
    var arr = filteredProducts.slice();
    if (sort === 'price-asc') arr.sort(function (a, b) { return a.price - b.price; });
    else if (sort === 'price-desc') arr.sort(function (a, b) { return b.price - a.price; });
    else if (sort === 'new') arr.sort(function (a, b) { return b.createdAt - a.createdAt; });
    else arr.sort(function (a, b) { return b.popularity - a.popularity; });
    filteredProducts = arr;
  }

  function renderResultsCount(displayed, total) {
    if (!resultsCountEl) return;
    var shown = typeof displayed === 'number' ? displayed : total;
    resultsCountEl.textContent = 'Показано ' + shown + ' из ' + total;
  }

  function getPerPage() {
    var n = perPageSelectEl ? parseInt(perPageSelectEl.value || '12', 10) : 12;
    if (!n || n < 1) n = 12;
    return n;
  }

  function renderPagination(total, perPage) {
    if (!paginationEl) return;
    paginationEl.innerHTML = '';
    var totalPages = Math.max(1, Math.ceil(total / perPage));
    if (currentPage > totalPages) currentPage = totalPages;

    function addBtn(label, page, disabled, current, aria) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'page-btn' + (current ? ' current' : '') + (disabled ? ' disabled' : '');
      btn.textContent = label;
      if (aria) btn.setAttribute('aria-label', aria);
      if (!disabled && !current) {
        btn.addEventListener('click', function () {
          currentPage = page;
          update();
        });
      }
      paginationEl.appendChild(btn);
    }

    addBtn('«', Math.max(1, currentPage - 1), currentPage === 1, false, 'Предыдущая страница');
    var maxButtons = 7;
    var start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    var end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, Math.min(start, end - maxButtons + 1));
    for (var i = start; i <= end; i++) {
      addBtn(String(i), i, false, i === currentPage);
    }
    addBtn('»', Math.min(totalPages, currentPage + 1), currentPage === totalPages, false, 'Следующая страница');
  }

  function renderProducts() {
    if (!productsListEl) return;
    productsListEl.innerHTML = '';
    var perPage = getPerPage();
    var start = (currentPage - 1) * perPage;
    var pageItems = filteredProducts.slice(start, start + perPage);
    pageItems.forEach(function (p) { productsListEl.appendChild(createProductCard(p)); });
    // Re-bind cart buttons for newly rendered cards
    try { if (typeof bindAddToCartButtons === 'function') bindAddToCartButtons(); } catch (_) {}
    renderResultsCount(pageItems.length, filteredProducts.length);
  }

  function clampPriceInputs() {
    if (!priceInputMinEl || !priceInputMaxEl || !priceRangeMinEl || !priceRangeMaxEl) return;
    var min = parseInt(priceInputMinEl.value || '0', 10);
    var max = parseInt(priceInputMaxEl.value || '200000', 10);
    if (min > max) { var t = min; min = max; max = t; }
    var rmin = parseInt(priceRangeMinEl.value, 10);
    var rmax = parseInt(priceRangeMaxEl.value, 10);
    if (rmin > rmax) { var s = rmin; rmin = rmax; rmax = s; }
    // sync number -> range
    priceRangeMinEl.value = String(min);
    priceRangeMaxEl.value = String(max);
    // ensure constraints visually
    priceInputMinEl.value = String(min);
    priceInputMaxEl.value = String(max);
  }

  function update() {
    applyFilters();
    applySort();
    renderPagination(filteredProducts.length, getPerPage());
    renderProducts();
  }

  function bindFilterEvents() {
    document.getElementById('filters-form')?.addEventListener('change', function (e) {
      if (e && e.target && (e.target.matches('input[type="checkbox"]') || e.target.matches('input[type="range"]') || e.target.matches('input[type="number"]'))) {
        currentPage = 1;
        update();
      }
    });

    if (priceRangeMinEl) priceRangeMinEl.addEventListener('input', function () {
      if (parseInt(priceRangeMinEl.value, 10) > parseInt(priceRangeMaxEl.value, 10)) {
        priceRangeMinEl.value = priceRangeMaxEl.value;
      }
      priceInputMinEl.value = priceRangeMinEl.value;
    });
    if (priceRangeMaxEl) priceRangeMaxEl.addEventListener('input', function () {
      if (parseInt(priceRangeMaxEl.value, 10) < parseInt(priceRangeMinEl.value, 10)) {
        priceRangeMaxEl.value = priceRangeMinEl.value;
      }
      priceInputMaxEl.value = priceRangeMaxEl.value;
    });
    if (priceInputMinEl) priceInputMinEl.addEventListener('change', function () { clampPriceInputs(); currentPage = 1; update(); });
    if (priceInputMaxEl) priceInputMaxEl.addEventListener('change', function () { clampPriceInputs(); currentPage = 1; update(); });

    if (sortSelectEl) sortSelectEl.addEventListener('change', function () { currentPage = 1; update(); });
    if (perPageSelectEl) perPageSelectEl.addEventListener('change', function () { currentPage = 1; update(); });
    if (availabilitySwitchEl) availabilitySwitchEl.addEventListener('change', function () { currentPage = 1; update(); });
  }

  function initCatalog() {
    productsListEl = document.getElementById('products-list');
    if (!productsListEl) return; // не на странице каталога
    paginationEl = document.getElementById('pagination');
    resultsCountEl = document.querySelector('.catalog-toolbar .results-count');
    // Новый select#sort, с обратной совместимостью со старым #sort-select
    sortSelectEl = document.getElementById('sort') || document.getElementById('sort-select');
    perPageSelectEl = document.getElementById('per-page-select');
    availabilitySwitchEl = document.getElementById('availability-switch');
    priceInputMinEl = document.getElementById('price-input-min');
    priceInputMaxEl = document.getElementById('price-input-max');
    priceRangeMinEl = document.getElementById('price-range-min');
    priceRangeMaxEl = document.getElementById('price-range-max');

    allProducts = generateProducts(72);
    // Search by ?q= from URL
    var q = '';
    try { q = new URLSearchParams(window.location.search).get('q') || ''; } catch (_) { q = ''; }
    filteredProducts = allProducts.slice();
    if (q) {
      var qLower = q.toLowerCase();
      filteredProducts = filteredProducts.filter(function (p) { return p.title.toLowerCase().indexOf(qLower) !== -1; });
      var headerSearchInput = document.querySelector('#site-search input[type="search"]');
      if (headerSearchInput) headerSearchInput.value = q;
    }
    clampPriceInputs();
    bindFilterEvents();
    update();
  }

  document.addEventListener('DOMContentLoaded', initCatalog);
})();

// -----------------------
// Cart page rendering
// -----------------------
(function(){
  function formatRub(n){ try { return Number(n||0).toLocaleString('ru-RU') + ' ₽'; } catch(_) { return String(n||0) + ' ₽'; } }

  function readCart(){
    try { var raw = localStorage.getItem('cart'); return raw ? (JSON.parse(raw)||[]) : []; } catch(_) { return []; }
  }
  function writeCart(items){ try { localStorage.setItem('cart', JSON.stringify(items||[])); } catch(_) {}
    try { var badge = document.getElementById('cart-count'); if (badge) { var qty = (items||[]).reduce(function(s,it){return s + (parseInt(it.qty||1,10)||1);},0); badge.textContent = String(qty); } } catch(_){}
  }

  function renderCartPage(){
    var listEl = document.getElementById('cart-list');
    var totalEl = document.getElementById('cart-total');
    if (!listEl || !totalEl) return;

    var items = readCart();
    listEl.innerHTML = '';
    var total = 0;

    if (!items.length) {
      var empty = document.createElement('div');
      empty.textContent = 'Ваша корзина пуста.';
      empty.className = 'cart-empty';
      listEl.appendChild(empty);
      totalEl.textContent = formatRub(0);
      return;
    }

    items.forEach(function(it, idx){
      var row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = ''+
        '<div class="thumb">'+ (it.image ? ('<img alt="'+ (it.title||'') +'" src="'+ it.image +'"/>') : '') +'</div>'+
        '<div class="info">'+
        '  <div class="title">'+ (it.title||'Товар') +'</div>'+
        '  <div class="meta">'+ formatRub(it.price||0) +'</div>'+
        '</div>'+
        '<div class="qty">'+
        '  <button class="qty-btn dec" type="button" aria-label="Уменьшить">−</button>'+
        '  <span class="q">'+ (it.qty||1) +'</span>'+
        '  <button class="qty-btn inc" type="button" aria-label="Увеличить">+</button>'+
        '  <button class="qty-btn rm" type="button" aria-label="Удалить">✕</button>'+
        '</div>';
      listEl.appendChild(row);

      total += (parseInt(it.qty||1,10)||1) * (parseInt(it.price||0,10)||0);

      var dec = row.querySelector('.dec');
      var inc = row.querySelector('.inc');
      var rm = row.querySelector('.rm');
      var qEl = row.querySelector('.q');
      function updateQty(delta){
        var arr = readCart();
        var cur = arr[idx];
        if (!cur) return;
        var next = (parseInt(cur.qty||1,10)||1) + delta;
        if (next <= 0) { arr.splice(idx,1); } else { cur.qty = next; }
        writeCart(arr);
        renderCartPage();
      }
      if (dec) dec.addEventListener('click', function(){ updateQty(-1); });
      if (inc) inc.addEventListener('click', function(){ updateQty(1); });
      if (rm) rm.addEventListener('click', function(){ updateQty(-9999); });
    });

    totalEl.textContent = formatRub(total);

    var checkoutBtn = document.getElementById('cart-checkout');
    if (checkoutBtn) checkoutBtn.onclick = function(){ alert('Оформление заказа: демо.'); };
  }

  document.addEventListener('DOMContentLoaded', renderCartPage);
})();
