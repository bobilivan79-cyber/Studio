/* ============ ALONE STUDIO — shared behavior ============ */
const CONFIG = {
  telegram: 'Alone991',
  usdUah: 45.3,   // NBU official rate, 12.11.2026 — change the rate ONLY here
  uahRound: 10    // UAH prices are rounded to the nearest 10
};
const LANGS = ['ru', 'uk', 'en'];
const T = {
  from: {ru: 'от', uk: 'від', en: 'from'},
  msg: {
    ru: (s, t) => `Здравствуйте! Хочу заказать: ${s}${t ? ' — ' + t : ''}.\nЯзык сайта: RU\nПожелания: `,
    uk: (s, t) => `Вітаю! Хочу замовити: ${s}${t ? ' — ' + t : ''}.\nМова сайту: UA\nПобажання: `,
    en: (s, t) => `Hello! I'd like to order: ${s}${t ? ' — ' + t : ''}.\nSite language: EN\nWishes: `
  },
  order: {ru: 'Заказать', uk: 'Замовити', en: 'Order'},
  svc: {
    ru: ['Монтаж коротких видео', 'Инфографика товаров', 'Превью для YouTube', 'Дизайн для соцсетей', 'Другое'],
    uk: ['Монтаж коротких відео', 'Інфографіка товарів', 'Прев’ю для YouTube', 'Дизайн для соцмереж', 'Інше'],
    en: ['Short-form video editing', 'Product infographics', 'YouTube thumbnails', 'Social media design', 'Other']
  },
  choose: {ru: 'Выберите услугу', uk: 'Оберіть послугу', en: 'Choose a service'},
  ph: {
    name: {ru: 'Ваше имя', uk: 'Ваше ім’я', en: 'Your name'},
    details: {
      ru: 'Опишите проект: формат, длительность, референсы, сроки...',
      uk: 'Опишіть проєкт: формат, тривалість, референси, терміни...',
      en: 'Describe the project: format, length, references, deadline...'
    }
  }
};
const curLang = () => document.documentElement.getAttribute('lang') || 'ru';
const tgUrl = (s, t) => `https://t.me/${CONFIG.telegram}?text=${encodeURIComponent(T.msg[curLang()](s, t))}`;
const vis = el => {
  if (!el) return '';
  const s = el.querySelector('[data-' + curLang() + ']');
  return (s || el).textContent.replace(/[^\p{L}\p{N}\s+().,'’«»-]/gu, '').replace(/\s+/g, ' ').trim();
};

/* preloader */
function hidePreloader() {
  const p = document.getElementById('preloader');
  if (p) p.classList.add('hide');
}
window.addEventListener('load', () => setTimeout(hidePreloader, 500));
setTimeout(hidePreloader, 3000);

/* prices: $10 / 450 ₴ — rate comes from CONFIG only */
function renderPrices() {
  const lang = curLang();
  document.querySelectorAll('b.px').forEach(b => {
    const usd = +b.dataset.usd;
    const uah = Math.round(usd * CONFIG.usdUah / CONFIG.uahRound) * CONFIG.uahRound;
    b.textContent = (b.dataset.sfx === '+' ? T.from[lang] + ' ' : '') + '$' + usd + ' ';
    const i = document.createElement('i');
    i.textContent = '/ ' + uah.toLocaleString('ru-RU') + ' ₴';
    b.appendChild(i);
  });
}

/* order page helpers */
function fillOrderPage() {
  const lang = curLang();
  document.querySelectorAll('[data-ph]').forEach(el => { el.placeholder = T.ph[el.dataset.ph][lang]; });
  const sel = document.getElementById('svc');
  if (!sel) return;
  const keep = sel.selectedIndex > 0 ? sel.selectedIndex : 0;
  sel.innerHTML = '';
  const first = new Option('— ' + T.choose[lang] + ' —', '', true, true);
  first.disabled = true;
  sel.add(first);
  const icons = ['🎬', '🎨', '🖼', '📱', '💬'];
  T.svc[lang].forEach((n, i) => sel.add(new Option(icons[i] + ' ' + n, icons[i] + ' ' + T.svc.ru[i] + ' / ' + T.svc.en[i])));
  sel.selectedIndex = keep;
  updateTgBtn();
}
function updateTgBtn() {
  const b = document.getElementById('tgBtn');
  if (!b) return;
  const lang = curLang();
  const sel = document.getElementById('svc');
  const svc = sel && sel.selectedIndex > 0 ? T.svc[lang][sel.selectedIndex - 1] : T.svc[lang][4];
  const tier = document.querySelector('input[name="Тариф"]:checked');
  const det = document.querySelector('[name="Детали"]');
  b.href = `https://t.me/${CONFIG.telegram}?text=${encodeURIComponent(T.msg[lang](svc, tier ? tier.value : '') + (det ? det.value : ''))}`;
}

/* language switch (RU / UA / EN), persisted */
function setLang(lang) {
  if (!LANGS.includes(lang)) lang = 'ru';
  document.documentElement.setAttribute('lang', lang);
  LANGS.forEach(l => {
    const b = document.getElementById('btn-' + l);
    if (b) b.classList.toggle('active', l === lang);
  });
  try { localStorage.setItem('alone-lang', lang); } catch (e) {}
  renderPrices();
  fillOrderPage();
}

/* Telegram order buttons for every service / tariff */
function addOrderButtons() {
  const mk = () => {
    const a = document.createElement('a');
    a.className = 'btn btn-primary order-btn';
    a.target = '_blank';
    a.rel = 'noopener';
    a.href = 'https://t.me/' + CONFIG.telegram;
    a.innerHTML = `<span data-ru>${T.order.ru}</span><span data-uk>${T.order.uk}</span><span data-en>${T.order.en}</span>`;
    return a;
  };
  document.querySelectorAll('.price-card').forEach(c => { const a = mk(); a.dataset.kind = 'tier'; c.appendChild(a); });
  document.querySelectorAll('.price-panel .simple-price').forEach(c => { const a = mk(); a.dataset.kind = 'item'; c.appendChild(a); });
  document.querySelectorAll('#services .card').forEach((c, i) => { if (i < 4) { const a = mk(); a.dataset.kind = 'svc'; c.appendChild(a); } });
}
document.addEventListener('click', e => {
  const a = e.target.closest('.order-btn');
  if (!a) return;
  const box = a.parentElement;
  let svc = '', tier = '';
  if (a.dataset.kind === 'svc') svc = vis(box.querySelector('h3'));
  else {
    const key = box.closest('.price-panel').id.replace('panel-', '');
    svc = vis(document.querySelector(`.price-tab[onclick*="'${key}'"]`));
    tier = a.dataset.kind === 'tier' ? box.querySelector('.tier').textContent.replace(/[^\p{L}\p{N}\s]/gu, '').trim() : vis(box.querySelector('.label'));
  }
  a.href = tgUrl(svc, tier);
});

/* mobile menu */
function toggleMenu() {
  const m = document.getElementById('mobileMenu');
  const b = document.getElementById('hamburgerBtn');
  if (!m) return;
  m.classList.toggle('open');
  b.classList.toggle('open');
}

/* price tabs */
function showPanel(id, btn) {
  document.querySelectorAll('.price-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-' + id).classList.add('active');
  document.querySelectorAll('.price-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
  addOrderButtons();
  let saved = 'ru';
  try { saved = localStorage.getItem('alone-lang') || 'ru'; } catch (e) {}
  setLang(saved);

  document.querySelectorAll('.mobile-menu a').forEach(a => a.addEventListener('click', () => {
    const m = document.getElementById('mobileMenu');
    if (m) m.classList.remove('open');
  }));

  const form = document.getElementById('orderForm');
  if (form) ['input', 'change'].forEach(ev => form.addEventListener(ev, updateTgBtn));

  /* scroll reveal */
  const targets = document.querySelectorAll('.reveal, .reveal-stagger');
  if (!('IntersectionObserver' in window)) { targets.forEach(t => t.classList.add('in')); }
  else {
    const io = new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), {threshold: 0.15, rootMargin: '0px 0px -60px 0px'});
    targets.forEach(t => io.observe(t));
  }

  /* card cursor glow */
  document.querySelectorAll('.card').forEach(card => card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
    card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
  }));
});
