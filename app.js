/* ═══════════════════════════════════════════════════════════
   КОНСТАНТЫ
═══════════════════════════════════════════════════════════ */
const SHIFTS      = ['Отсыпной', 'Выходной', 'День', 'Ночь'];
const SHIFT_ICONS = ['🌅', '☀️', '🌤', '🌙'];
const SHIFT_CLS   = ['s-sleep', 's-off', 's-day', 's-night'];
const SHIFT_HINT  = ['dp-hint-sleep', 'dp-hint-off', 'dp-hint-day', 'dp-hint-night'];
const SHIFT_SHORT = ['Отсып', 'Выход', 'День', 'Ночь'];
const DOW_RU      = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
const MONTHS      = ['Январь','Февраль','Март','Апрель','Май','Июнь',
                     'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const MONTHS_SHORT = ['янв','фев','мар','апр','май','июн',
                      'июл','авг','сен','окт','ноя','дек'];

/* ═══════════════════════════════════════════════════════════
   СОСТОЯНИЕ
═══════════════════════════════════════════════════════════ */
let anchor   = null;   // { date: Date, shift: 0-3 }
let calYear, calMonth;

/* ═══════════════════════════════════════════════════════════
   УТИЛИТЫ ДАТ
═══════════════════════════════════════════════════════════ */
function todayLocal() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

function parseDateLocal(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function dateToStr(dt) {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDate(dt) {
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
}

function formatDateShort(dt) {
  return `${dt.getDate()} ${MONTHS_SHORT[dt.getMonth()]} ${dt.getFullYear()}`;
}

/* ═══════════════════════════════════════════════════════════
   ЛОГИКА ГРАФИКА
═══════════════════════════════════════════════════════════ */
function shiftForDate(dt) {
  if (!anchor) return null;
  const diffDays = Math.round((dt - anchor.date) / 86_400_000);
  const idx = ((diffDays % 4) + 4) % 4;
  return (anchor.shift + idx) % 4;
}

/* ═══════════════════════════════════════════════════════════
   КАСТОМНЫЙ ДЕЙТ-ПИКЕР
═══════════════════════════════════════════════════════════ */
const dp = {
  el:        document.getElementById('dp'),
  backdrop:  document.getElementById('dpBackdrop'),
  body:      document.getElementById('dpBody'),
  prevBtn:   document.getElementById('dpPrev'),
  nextBtn:   document.getElementById('dpNext'),
  monthBtn:  document.getElementById('dpMonthBtn'),
  yearBtn:   document.getElementById('dpYearBtn'),

  // текущий режим: 'days' | 'months' | 'years'
  mode:      'days',
  // просматриваемый месяц/год в пикере
  viewYear:  0,
  viewMonth: 0,
  // выбранное значение (Date или null)
  selected:  null,
  // целевой инпут: 'anchor' | 'query'
  target:    null,
  // callback(dateStr) после выбора
  onPick:    null,

  open(wrapId, currentVal, onPick) {
    this.target = wrapId;
    this.onPick = onPick;
    const now = currentVal ? parseDateLocal(currentVal) : todayLocal();
    this.selected  = currentVal ? parseDateLocal(currentVal) : null;
    this.viewYear  = now.getFullYear();
    this.viewMonth = now.getMonth();
    this.mode      = 'days';

    // позиционируем под инпутом
    const wrap = document.getElementById(wrapId);
    const rect = wrap.getBoundingClientRect();
    const dpW  = 280;
    let left   = rect.left;
    if (left + dpW > window.innerWidth - 8) left = window.innerWidth - dpW - 8;
    let top = rect.bottom + 6;
    if (top + 320 > window.innerHeight) top = rect.top - 320 - 6;

    this.el.style.left = `${left}px`;
    this.el.style.top  = `${top}px`;
    this.el.classList.add('open');
    this.backdrop.classList.add('open');
    wrap.classList.add('open');

    this.render();
  },

  close() {
    this.el.classList.remove('open');
    this.backdrop.classList.remove('open');
    if (this.target) {
      document.getElementById(this.target)?.classList.remove('open');
    }
  },

  render() {
    this.monthBtn.textContent = MONTHS[this.viewMonth];
    this.yearBtn.textContent  = this.viewYear;

    if (this.mode === 'days')   this.renderDays();
    if (this.mode === 'months') this.renderMonths();
    if (this.mode === 'years')  this.renderYears();
  },

  renderDays() {
    const today    = todayLocal();
    const firstDay = new Date(this.viewYear, this.viewMonth, 1);
    const days     = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();
    let startDow   = firstDay.getDay();
    startDow = startDow === 0 ? 6 : startDow - 1;

    let html = DOW_RU.map(d => `<div class="dp-dow">${d}</div>`).join('');
    for (let i = 0; i < startDow; i++) html += `<div class="dp-day dp-empty"></div>`;

    for (let d = 1; d <= days; d++) {
      const dt       = new Date(this.viewYear, this.viewMonth, d);
      const isToday  = dt.getTime() === today.getTime();
      const isSel    = this.selected && dt.getTime() === this.selected.getTime();
      const shift    = shiftForDate(dt);
      const hintCls  = (!isSel && shift !== null) ? SHIFT_HINT[shift] : '';
      const todayCls = (!isSel && isToday) ? ' dp-today' : '';

      html += `<div class="dp-day ${hintCls}${isSel ? ' dp-selected' : ''}${todayCls}"
                    data-d="${d}">${d}</div>`;
    }

    this.body.innerHTML = `<div class="dp-days-grid">${html}</div>`;

    // клики по дням
    this.body.querySelectorAll('.dp-day:not(.dp-empty)').forEach(el => {
      el.addEventListener('click', () => {
        const d   = parseInt(el.dataset.d);
        const dt  = new Date(this.viewYear, this.viewMonth, d);
        const str = dateToStr(dt);
        this.selected = dt;
        if (this.onPick) this.onPick(str);
        this.close();
      });
    });
  },

  renderMonths() {
    const curMonth = new Date().getMonth();
    let html = '';
    MONTHS_SHORT.forEach((m, i) => {
      const isCur = (i === curMonth && this.viewYear === new Date().getFullYear());
      const isSel = (i === this.viewMonth);
      html += `<div class="dp-month-cell ${isSel ? 'dp-sel-month' : (isCur ? 'dp-cur-month' : '')}"
                    data-m="${i}">${m}</div>`;
    });
    this.body.innerHTML = `<div class="dp-months-grid">${html}</div>`;
    this.body.querySelectorAll('.dp-month-cell').forEach(el => {
      el.addEventListener('click', () => {
        this.viewMonth = parseInt(el.dataset.m);
        this.mode = 'days';
        this.render();
      });
    });
  },

  renderYears() {
    const curYear = new Date().getFullYear();
    const start   = curYear - 10;
    const end     = curYear + 5;
    let html = '';
    for (let y = start; y <= end; y++) {
      const isCur = (y === curYear);
      const isSel = (y === this.viewYear);
      html += `<div class="dp-year-cell ${isSel ? 'dp-sel-year' : (isCur ? 'dp-cur-year' : '')}"
                    data-y="${y}">${y}</div>`;
    }
    this.body.innerHTML = `<div class="dp-years-grid">${html}</div>`;
    // прокрутить к выбранному году
    const selEl = this.body.querySelector('.dp-sel-year');
    if (selEl) selEl.scrollIntoView({ block: 'center' });

    this.body.querySelectorAll('.dp-year-cell').forEach(el => {
      el.addEventListener('click', () => {
        this.viewYear = parseInt(el.dataset.y);
        this.mode = 'months';
        this.render();
      });
    });
  },

  prevNav() {
    if (this.mode === 'days') {
      if (this.viewMonth === 0) { this.viewMonth = 11; this.viewYear--; }
      else this.viewMonth--;
    } else if (this.mode === 'months') {
      this.viewYear--;
    } else {
      this.viewYear -= 10;
    }
    this.render();
  },

  nextNav() {
    if (this.mode === 'days') {
      if (this.viewMonth === 11) { this.viewMonth = 0; this.viewYear++; }
      else this.viewMonth++;
    } else if (this.mode === 'months') {
      this.viewYear++;
    } else {
      this.viewYear += 10;
    }
    this.render();
  }
};

// навешиваем события пикера
dp.prevBtn.addEventListener('click', () => dp.prevNav());
dp.nextBtn.addEventListener('click', () => dp.nextNav());
dp.monthBtn.addEventListener('click', () => { dp.mode = 'months'; dp.render(); });
dp.yearBtn.addEventListener('click',  () => { dp.mode = 'years';  dp.render(); });
dp.backdrop.addEventListener('click', () => dp.close());

/* открытие пикера по клику на инпут-обёртку */
function bindDateInput(wrapId, hiddenId, textId) {
  const wrap = document.getElementById(wrapId);
  wrap.addEventListener('click', () => {
    const cur = document.getElementById(hiddenId).value;
    dp.open(wrapId, cur || null, (str) => {
      document.getElementById(hiddenId).value = str;
      document.getElementById(textId).textContent = formatDateShort(parseDateLocal(str));
      wrap.classList.add('has-value');
    });
  });
}

/* ═══════════════════════════════════════════════════════════
   ОПОРНАЯ ТОЧКА
═══════════════════════════════════════════════════════════ */
function saveAnchor() {
  const ds = document.getElementById('anchorDate').value;
  const sv = parseInt(document.getElementById('anchorShift').value);
  if (!ds) { alert('Выберите дату'); return; }

  anchor = { date: parseDateLocal(ds), shift: sv };
  localStorage.setItem('shiftAnchor', JSON.stringify({ dateStr: ds, shift: sv }));

  updateAnchorDisplay();
  renderAll();
}

function updateAnchorDisplay() {
  const dot = document.getElementById('anchorDot');
  const txt = document.getElementById('anchorText');
  if (!anchor) {
    dot.className = 'dot off';
    txt.innerHTML = 'Не задана — выберите дату и смену ниже';
  } else {
    dot.className = 'dot';
    txt.innerHTML =
      `<strong>${formatDate(anchor.date)}</strong> — ` +
      `<strong>${SHIFT_ICONS[anchor.shift]} ${SHIFTS[anchor.shift]}</strong>`;
  }
}

/* ═══════════════════════════════════════════════════════════
   РАСЧЁТ СМЕНЫ НА ДАТУ
═══════════════════════════════════════════════════════════ */
function calcQuery() {
  const ds = document.getElementById('queryDate').value;
  if (!ds)     { alert('Выберите дату'); return; }
  if (!anchor) { alert('Сначала сохраните опорную точку'); return; }

  const dt       = parseDateLocal(ds);
  const s        = shiftForDate(dt);
  const diffDays = Math.round((dt - anchor.date) / 86_400_000);

  const block = document.getElementById('resultBlock');
  block.className = `result-block vis ${SHIFT_CLS[s]}`;

  document.getElementById('resultIcon').textContent      = SHIFT_ICONS[s];
  document.getElementById('resultDateLabel').textContent = formatDate(dt);
  document.getElementById('resultShift').textContent     = SHIFTS[s];

  const sign   = diffDays > 0 ? '+' : '';
  const abs    = Math.abs(diffDays);
  const plural = abs === 1 ? 'день' : abs < 5 ? 'дня' : 'дней';
  document.getElementById('resultMeta').textContent =
    diffDays === 0
      ? 'Это опорная точка'
      : `${sign}${diffDays} ${plural} от опорной точки · цикл: ${SHIFTS.join(' → ')}`;
}

/* ═══════════════════════════════════════════════════════════
   ПОЛОСКА ТЕКУЩЕЙ НЕДЕЛИ
═══════════════════════════════════════════════════════════ */
function renderWeekStrip() {
  const today  = todayLocal();
  const dow    = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - dow);

  let html = '';
  for (let i = 0; i < 7; i++) {
    const d       = new Date(monday);
    d.setDate(monday.getDate() + i);
    const s       = shiftForDate(d);
    const isToday = d.getTime() === today.getTime();
    const cls     = s !== null ? SHIFT_CLS[s] : '';

    html += `
      <div class="week-cell ${cls}${isToday ? ' today' : ''}">
        <div class="wd">${DOW_RU[i]}</div>
        <div class="wn">${d.getDate()}</div>
        <div class="ws">${s !== null ? SHIFT_ICONS[s] : ''}</div>
      </div>`;
  }
  document.getElementById('weekStrip').innerHTML = html;
}

/* ═══════════════════════════════════════════════════════════
   ОСНОВНОЙ КАЛЕНДАРЬ
═══════════════════════════════════════════════════════════ */
function renderCalendar() {
  document.getElementById('calMonthLabel').textContent =
    `${MONTHS[calMonth]} ${calYear}`;

  const today       = todayLocal();
  const firstDay    = new Date(calYear, calMonth, 1);
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  let startDow      = firstDay.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;

  let html = DOW_RU.map(d => `<div class="cal-dow">${d}</div>`).join('');
  for (let i = 0; i < startDow; i++) html += `<div class="cal-cell cal-empty"></div>`;

  for (let d = 1; d <= daysInMonth; d++) {
    const dt      = new Date(calYear, calMonth, d);
    const s       = shiftForDate(dt);
    const isToday = dt.getTime() === today.getTime();
    const cls     = s !== null ? SHIFT_CLS[s] : '';
    const icon    = s !== null ? SHIFT_ICONS[s] : '';
    const lbl     = s !== null ? SHIFT_SHORT[s] : '';

    html += `
      <div class="cal-cell ${cls}${isToday ? ' today' : ''}">
        <span class="cal-num">${d}</span>
        ${lbl  ? `<span class="cal-lbl">${lbl}</span>`  : ''}
        ${icon ? `<span class="cal-icon">${icon}</span>` : ''}
      </div>`;
  }
  document.getElementById('calGrid').innerHTML = html;
}

function prevMonth() {
  if (calMonth === 0) { calMonth = 11; calYear--; } else calMonth--;
  renderCalendar();
}
function nextMonth() {
  if (calMonth === 11) { calMonth = 0; calYear++; } else calMonth++;
  renderCalendar();
}
function goToday() {
  const t  = todayLocal();
  calYear  = t.getFullYear();
  calMonth = t.getMonth();
  renderCalendar();
}

function renderAll() {
  renderWeekStrip();
  renderCalendar();
}

/* ═══════════════════════════════════════════════════════════
   ИНИЦИАЛИЗАЦИЯ
═══════════════════════════════════════════════════════════ */
function init() {
  const t  = todayLocal();
  calYear  = t.getFullYear();
  calMonth = t.getMonth();

  // привязка кастомных инпутов
  bindDateInput('anchorDateWrap', 'anchorDate', 'anchorDateText');
  bindDateInput('queryDateWrap',  'queryDate',  'queryDateText');

  // восстановить сохранённую опорную точку
  const saved = localStorage.getItem('shiftAnchor');
  if (saved) {
    try {
      const { dateStr, shift } = JSON.parse(saved);
      anchor = { date: parseDateLocal(dateStr), shift };
      document.getElementById('anchorDate').value  = dateStr;
      document.getElementById('anchorShift').value = shift;

      const anchorTextEl = document.getElementById('anchorDateText');
      anchorTextEl.textContent = formatDateShort(parseDateLocal(dateStr));
      document.getElementById('anchorDateWrap').classList.add('has-value');
    } catch (e) {
      console.warn('Не удалось восстановить опорную точку:', e);
    }
  }

  // инициализировать поле "рассчитать" на сегодня
  const todayStr = dateToStr(t);
  document.getElementById('queryDate').value = todayStr;
  document.getElementById('queryDateText').textContent = formatDateShort(t);
  document.getElementById('queryDateWrap').classList.add('has-value');

  updateAnchorDisplay();
  renderAll();
}

init();
