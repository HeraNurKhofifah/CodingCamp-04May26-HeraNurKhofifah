/* ============================================================
   Life Dashboard — script.js
   Tahap 2: Logika JavaScript (Data & Interaksi)

   Fitur:
   1. Onboarding  — cek username di localStorage
   2. Clock & Greeting — real-time, berubah sesuai waktu
   3. To-Do List  — CRUD, localStorage, duplicate check, sort
   4. Focus Timer — 25 menit, Start/Pause/Reset, custom durasi
   5. Quick Links — tambah & hapus, localStorage
   6. Dark Mode   — toggle + simpan ke localStorage
   ============================================================ */

'use strict';

/* ── Helpers ─────────────────────────────────────────────── */
const $  = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, '0');

function saveLS(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* quota */ }
}
function loadLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

/* ══════════════════════════════════════════════════════════
   1. ONBOARDING — Cek username saat halaman dimuat
   ══════════════════════════════════════════════════════════ */
let username = loadLS('username', '');

function initApp() {
  if (username) {
    showDashboard(false); // langsung tampil tanpa animasi onboarding
  } else {
    showOnboarding();
  }
}

function showOnboarding() {
  $('onboarding-overlay').classList.remove('hidden');
  $('main-dashboard').classList.add('hidden');
  setTimeout(() => $('onboarding-name-input').focus(), 100);
}

function showDashboard(animate = true) {
  const overlay = $('onboarding-overlay');
  const dash    = $('main-dashboard');

  if (animate) {
    // Animasi fade-out overlay lalu fade-in dashboard
    overlay.classList.add('fade-out');
    setTimeout(() => {
      overlay.classList.add('hidden');
      overlay.classList.remove('fade-out');
      dash.classList.remove('hidden');
      dash.classList.add('fade-in');
      setTimeout(() => dash.classList.remove('fade-in'), 500);
    }, 400);
  } else {
    overlay.classList.add('hidden');
    dash.classList.remove('hidden');
  }

  renderGreeting();
  startClock();
}

/* Submit onboarding */
$('onboarding-submit').addEventListener('click', submitOnboarding);
$('onboarding-name-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') submitOnboarding();
});

function submitOnboarding() {
  const val = $('onboarding-name-input').value.trim();
  if (!val) {
    $('onboarding-error').textContent = 'Please enter your name to continue.';
    $('onboarding-name-input').focus();
    return;
  }
  $('onboarding-error').textContent = '';
  username = val;
  saveLS('username', username);
  showDashboard(true);
}

/* Change name (dari dashboard) */
$('change-name-btn').addEventListener('click', () => {
  const newName = prompt('Enter your new name:', username);
  if (newName === null) return; // cancelled
  const trimmed = newName.trim();
  if (!trimmed) return;
  username = trimmed;
  saveLS('username', username);
  renderGreeting();
});

/* ══════════════════════════════════════════════════════════
   2. REAL-TIME CLOCK & GREETING
   ══════════════════════════════════════════════════════════ */
const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

function startClock() {
  updateClock();
  setInterval(updateClock, 1000);
}

function updateClock() {
  const now = new Date();
  $('clock').textContent =
    `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  $('date-display').textContent =
    `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
}

function getGreetingWord() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return { word: 'Good Morning',   emoji: '☀️' };
  if (h >= 12 && h < 17) return { word: 'Good Afternoon', emoji: '🌤️' };
  if (h >= 17 && h < 21) return { word: 'Good Evening',   emoji: '🌆' };
  return                         { word: 'Good Night',     emoji: '🌙' };
}

function renderGreeting() {
  const { word, emoji } = getGreetingWord();
  $('greeting-label').textContent = `${emoji} ${word},`;
  $('greeting-name').textContent  = username;
}

// Refresh greeting setiap menit (waktu bisa berubah)
setInterval(() => { if (username) renderGreeting(); }, 60_000);

/* ══════════════════════════════════════════════════════════
   3. DARK / LIGHT MODE
   ══════════════════════════════════════════════════════════ */
let isDark = loadLS('ls_theme', false);

function applyTheme() {
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  $('theme-toggle').textContent = isDark ? '☀️' : '🌙';
  $('theme-toggle').title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
}

applyTheme(); // terapkan saat load

$('theme-toggle').addEventListener('click', () => {
  isDark = !isDark;
  saveLS('ls_theme', isDark);
  applyTheme();
});

/* ══════════════════════════════════════════════════════════
   4. FOCUS TIMER
   ══════════════════════════════════════════════════════════ */
let timerDuration = loadLS('ls_timer_min', 25); // menit
let timerTotal    = timerDuration * 60;
let timerLeft     = timerTotal;
let timerInterval = null;
let timerRunning  = false;

$('timer-minutes').value = timerDuration;

function renderTimerDisplay() {
  $('timer-display').textContent =
    `${pad(Math.floor(timerLeft / 60))}:${pad(timerLeft % 60)}`;
}

function renderTimerProgress() {
  const pct = timerTotal > 0 ? (timerLeft / timerTotal) * 100 : 0;
  $('timer-progress').style.width = `${pct}%`;
}

function setTimerState(state) {
  $('timer-display').classList.remove('running', 'finished');
  if (state === 'running' || state === 'finished') {
    $('timer-display').classList.add(state);
  }
}

function setTimerStatus(msg) { $('timer-status').textContent = msg; }

renderTimerDisplay();
renderTimerProgress();

/* Start */
$('timer-start').addEventListener('click', () => {
  if (timerRunning) return;
  if (timerLeft === 0) { timerLeft = timerTotal; renderTimerProgress(); }
  timerRunning = true;
  $('timer-start').disabled = true;
  setTimerState('running');
  setTimerStatus('Focus session in progress…');

  timerInterval = setInterval(() => {
    timerLeft--;
    renderTimerDisplay();
    renderTimerProgress();
    if (timerLeft <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      $('timer-start').disabled = false;
      setTimerState('finished');
      setTimerStatus('🎉 Session complete! Time for a break.');
      tryNotify('⏰ Focus session complete!', 'Time to take a break.');
    }
  }, 1000);
});

/* Pause */
$('timer-stop').addEventListener('click', () => {
  if (!timerRunning) return;
  clearInterval(timerInterval);
  timerRunning = false;
  $('timer-start').disabled = false;
  setTimerState('idle');
  setTimerStatus('Paused.');
});

/* Reset */
$('timer-reset').addEventListener('click', () => {
  clearInterval(timerInterval);
  timerRunning = false;
  $('timer-start').disabled = false;
  timerLeft = timerTotal;
  renderTimerDisplay();
  renderTimerProgress();
  setTimerState('idle');
  setTimerStatus('');
});

/* Set custom duration */
$('timer-set-btn').addEventListener('click', applyCustomDuration);
$('timer-minutes').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') applyCustomDuration();
});

function applyCustomDuration() {
  const val = parseInt($('timer-minutes').value, 10);
  if (isNaN(val) || val < 1 || val > 99) {
    $('timer-minutes').focus();
    $('timer-minutes').select();
    return;
  }
  clearInterval(timerInterval);
  timerRunning = false;
  $('timer-start').disabled = false;
  timerDuration = val;
  timerTotal    = val * 60;
  timerLeft     = timerTotal;
  saveLS('ls_timer_min', timerDuration);
  renderTimerDisplay();
  renderTimerProgress();
  setTimerState('idle');
  setTimerStatus(`Timer set to ${val} minute${val > 1 ? 's' : ''}.`);
}

function tryNotify(title, body) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') new Notification(title, { body });
}

document.addEventListener('click', () => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}, { once: true });

/* ══════════════════════════════════════════════════════════
   5. TO-DO LIST
      - CRUD (tambah, edit, hapus, centang)
      - localStorage
      - Prevent Duplicate
      - Sort (done otomatis ke bawah + manual sort)
   ══════════════════════════════════════════════════════════ */
let todos  = loadLS('ls_todos', []);   // [{id, text, done, createdAt}]
let todoId = loadLS('ls_todos_id', 1);

function saveTodos() {
  saveLS('ls_todos', todos);
  saveLS('ls_todos_id', todoId);
}

/* ── Sort logic ── */
function getSortedTodos() {
  const mode = $('todo-sort').value;
  const copy = [...todos];
  switch (mode) {
    case 'az':   return copy.sort((a, b) => a.text.localeCompare(b.text));
    case 'za':   return copy.sort((a, b) => b.text.localeCompare(a.text));
    // "done last" = tugas selesai otomatis ke bawah
    case 'done': return copy.sort((a, b) => Number(a.done) - Number(b.done));
    default:
      // Default: undone dulu, lalu done — sesuai waktu dibuat
      return copy.sort((a, b) => {
        if (a.done !== b.done) return Number(a.done) - Number(b.done);
        return a.createdAt - b.createdAt;
      });
  }
}

/* ── Render ── */
function renderTodos() {
  const list  = $('todo-list');
  const empty = $('todo-empty');
  const count = $('todo-count');
  list.innerHTML = '';

  const sorted = getSortedTodos();
  const total  = todos.length;
  const done   = todos.filter(t => t.done).length;

  count.textContent  = total > 0 ? `${done}/${total} done` : '';
  empty.style.display = total === 0 ? 'block' : 'none';

  sorted.forEach((todo) => {
    const li = document.createElement('li');
    li.className = `todo-item${todo.done ? ' done' : ''}`;
    li.dataset.id = todo.id;

    // Checkbox
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'todo-checkbox';
    cb.checked = todo.done;
    cb.setAttribute('aria-label', `Mark "${todo.text}" as done`);
    cb.addEventListener('change', () => toggleTodo(todo.id));

    // Text
    const span = document.createElement('span');
    span.className = 'todo-text';
    span.textContent = todo.text;

    // Actions
    const actions = document.createElement('div');
    actions.className = 'todo-actions';

    const editBtn = document.createElement('button');
    editBtn.innerHTML = '✏️';
    editBtn.title = 'Edit task';
    editBtn.setAttribute('aria-label', `Edit: ${todo.text}`);
    editBtn.addEventListener('click', () => startEditTodo(todo.id, li, span));

    const delBtn = document.createElement('button');
    delBtn.innerHTML = '🗑️';
    delBtn.className = 'btn-delete';
    delBtn.title = 'Delete task';
    delBtn.setAttribute('aria-label', `Delete: ${todo.text}`);
    delBtn.addEventListener('click', () => deleteTodo(todo.id));

    actions.append(editBtn, delBtn);
    li.append(cb, span, actions);
    list.appendChild(li);
  });
}

/* ── Add ── */
function addTodo() {
  const input = $('todo-input');
  const text  = input.value.trim();
  if (!text) { input.focus(); return; }

  // Prevent Duplicate
  if (isDuplicateTodo(text)) {
    showTodoWarning('⚠️ Task already exists!');
    input.select();
    return;
  }

  todos.push({ id: todoId++, text, done: false, createdAt: Date.now() });
  saveTodos();
  input.value = '';
  hideTodoWarning();
  renderTodos();
}

function isDuplicateTodo(text, excludeId = null) {
  return todos.some(
    t => t.id !== excludeId && t.text.toLowerCase() === text.toLowerCase()
  );
}

function showTodoWarning(msg) { $('todo-warning').textContent = msg; }
function hideTodoWarning()    { $('todo-warning').textContent = ''; }

/* ── Toggle done ── */
function toggleTodo(id) {
  const t = todos.find(t => t.id === id);
  if (t) { t.done = !t.done; saveTodos(); renderTodos(); }
}

/* ── Delete ── */
function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  renderTodos();
}

/* ── Inline Edit ── */
function startEditTodo(id, li, span) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;

  const editInput = document.createElement('input');
  editInput.type = 'text';
  editInput.className = 'todo-edit-input';
  editInput.value = todo.text;
  editInput.maxLength = 100;
  li.replaceChild(editInput, span);
  editInput.focus();
  editInput.select();

  let committed = false;

  function commitEdit() {
    if (committed) return;
    committed = true;
    const newText = editInput.value.trim();
    if (!newText) { li.replaceChild(span, editInput); return; }
    if (isDuplicateTodo(newText, id)) {
      editInput.classList.add('input-error');
      editInput.title = '⚠️ Duplicate task!';
      committed = false;
      editInput.focus();
      return;
    }
    todo.text = newText;
    saveTodos();
    renderTodos();
  }

  editInput.addEventListener('blur', commitEdit);
  editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  { e.preventDefault(); commitEdit(); }
    if (e.key === 'Escape') { committed = true; li.replaceChild(span, editInput); }
  });
}

/* ── Event listeners ── */
$('todo-add-btn').addEventListener('click', addTodo);
$('todo-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') addTodo(); });
$('todo-input').addEventListener('input',   hideTodoWarning);
$('todo-sort').addEventListener('change',   renderTodos);

/* ══════════════════════════════════════════════════════════
   6. QUICK LINKS
   ══════════════════════════════════════════════════════════ */
let links  = loadLS('ls_links', []);   // [{id, label, url}]
let linkId = loadLS('ls_links_id', 1);

function saveLinks() {
  saveLS('ls_links', links);
  saveLS('ls_links_id', linkId);
}

function renderLinks() {
  const grid  = $('links-grid');
  const empty = $('links-empty');
  grid.innerHTML = '';

  if (links.length === 0) { empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  links.forEach((link) => {
    const chip = document.createElement('a');
    chip.className = 'link-chip';
    chip.href   = link.url;
    chip.target = '_blank';
    chip.rel    = 'noopener noreferrer';
    chip.title  = link.url;

    const labelEl = document.createElement('span');
    labelEl.className   = 'link-label';
    labelEl.textContent = link.label;

    const delBtn = document.createElement('button');
    delBtn.className   = 'link-delete';
    delBtn.textContent = '✕';
    delBtn.title = `Remove ${link.label}`;
    delBtn.setAttribute('aria-label', `Remove link: ${link.label}`);
    delBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      deleteLink(link.id);
    });

    chip.append(labelEl, delBtn);
    grid.appendChild(chip);
  });
}

function addLink() {
  const labelEl = $('link-label-input');
  const urlEl   = $('link-url-input');
  const label   = labelEl.value.trim();
  let   url     = urlEl.value.trim();

  if (!label || !url) {
    showLinkWarning('Please fill in both label and URL.');
    return;
  }

  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  try { new URL(url); } catch {
    showLinkWarning('Please enter a valid URL.');
    urlEl.focus();
    return;
  }

  hideLinkWarning();
  links.push({ id: linkId++, label, url });
  saveLinks();
  labelEl.value = '';
  urlEl.value   = '';
  renderLinks();
}

function deleteLink(id) {
  links = links.filter(l => l.id !== id);
  saveLinks();
  renderLinks();
}

function showLinkWarning(msg) { $('link-warning').textContent = msg; }
function hideLinkWarning()    { $('link-warning').textContent = ''; }

$('link-add-btn').addEventListener('click', addLink);
$('link-url-input').addEventListener('keydown',  (e) => { if (e.key === 'Enter') addLink(); });
$('link-label-input').addEventListener('keydown',(e) => { if (e.key === 'Enter') $('link-url-input').focus(); });
$('link-url-input').addEventListener('input',    hideLinkWarning);
$('link-label-input').addEventListener('input',  hideLinkWarning);

/* ══════════════════════════════════════════════════════════
   INIT — Jalankan saat halaman dimuat
   ══════════════════════════════════════════════════════════ */
renderTodos();
renderLinks();
initApp();
