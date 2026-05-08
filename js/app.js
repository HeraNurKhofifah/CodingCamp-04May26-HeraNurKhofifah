/* ============================================================
   Life Dashboard — app.js
   Single JS file (Folder Rule: only 1 JS file)

   Features:
   ✅ Clock & Date (real-time)
   ✅ Greeting (time-based, custom name)
   ✅ Focus Timer (start/pause/reset, custom duration, progress bar)
   ✅ To-Do List (add/edit/done/delete, sort, prevent duplicates)
   ✅ Quick Links (add/delete, localStorage)
   ✅ Light / Dark Mode
   ✅ All data persisted in localStorage
   ============================================================ */

'use strict';

/* ── Utility helpers ─────────────────────────────────────── */
const $  = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, '0');

function saveLS(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
}

function loadLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

/* ══════════════════════════════════════════════════════════
   1. CLOCK & DATE
   ══════════════════════════════════════════════════════════ */
const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

function updateClock() {
  const now = new Date();
  $('clock').textContent =
    `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  $('date-display').textContent =
    `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
}

setInterval(updateClock, 1000);
updateClock();

/* ══════════════════════════════════════════════════════════
   2. GREETING + CUSTOM NAME  (Challenge ✅)
   ══════════════════════════════════════════════════════════ */
let userName = loadLS('ls_name', '');

function getGreetingWord() {
  const h = new Date().getHours();
  if (h <  5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

function renderGreeting() {
  const word = getGreetingWord();
  if (userName) {
    $('greeting-text').textContent = `${word},`;
    $('greeting-name').textContent = `${userName} 👋`;
  } else {
    $('greeting-text').textContent = `${word}!`;
    $('greeting-name').textContent = '';
  }
}

renderGreeting();
setInterval(renderGreeting, 60_000); // refresh every minute

/* Name modal */
$('edit-name-btn').addEventListener('click', openNameModal);
$('save-name-btn').addEventListener('click', saveName);
$('cancel-name-btn').addEventListener('click', closeNameModal);
$('name-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter')  saveName();
  if (e.key === 'Escape') closeNameModal();
});
// Close on backdrop click
$('name-modal').addEventListener('click', (e) => {
  if (e.target === $('name-modal')) closeNameModal();
});

function openNameModal() {
  $('name-input').value = userName;
  $('name-modal').classList.remove('hidden');
  $('name-input').focus();
}

function closeNameModal() {
  $('name-modal').classList.add('hidden');
}

function saveName() {
  userName = $('name-input').value.trim();
  saveLS('ls_name', userName);
  renderGreeting();
  closeNameModal();
}

/* ══════════════════════════════════════════════════════════
   3. DARK / LIGHT MODE  (Challenge ✅)
   ══════════════════════════════════════════════════════════ */
let isDark = loadLS('ls_theme', false);

function applyTheme() {
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  $('theme-toggle').textContent = isDark ? '☀️' : '🌙';
  $('theme-toggle').title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
}

applyTheme();

$('theme-toggle').addEventListener('click', () => {
  isDark = !isDark;
  saveLS('ls_theme', isDark);
  applyTheme();
});

/* ══════════════════════════════════════════════════════════
   4. FOCUS TIMER  (Challenge: Change Pomodoro time ✅)
   ══════════════════════════════════════════════════════════ */
let timerDuration = loadLS('ls_timer_duration', 25); // minutes
let timerTotal    = timerDuration * 60;              // seconds
let timerLeft     = timerTotal;
let timerInterval = null;
let timerRunning  = false;

$('timer-minutes').value = timerDuration;

function renderTimerDisplay() {
  $('timer-display').textContent = `${pad(Math.floor(timerLeft / 60))}:${pad(timerLeft % 60)}`;
}

function renderTimerProgress() {
  const pct = timerTotal > 0 ? (timerLeft / timerTotal) * 100 : 0;
  $('timer-progress').style.width = `${pct}%`;
}

function setTimerVisualState(state) {
  // state: 'idle' | 'running' | 'finished'
  $('timer-display').classList.remove('running', 'finished');
  if (state !== 'idle') $('timer-display').classList.add(state);
}

function setTimerStatus(msg) {
  $('timer-status').textContent = msg;
}

renderTimerDisplay();
renderTimerProgress();

/* Start / Pause */
$('timer-start').addEventListener('click', () => {
  if (timerRunning) return;
  if (timerLeft === 0) {
    timerLeft = timerTotal; // auto-restart if finished
    renderTimerProgress();
  }
  timerRunning = true;
  setTimerVisualState('running');
  setTimerStatus('Focus session in progress…');
  $('timer-start').disabled = true;

  timerInterval = setInterval(() => {
    timerLeft--;
    renderTimerDisplay();
    renderTimerProgress();

    if (timerLeft <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      $('timer-start').disabled = false;
      setTimerVisualState('finished');
      setTimerStatus('🎉 Session complete! Take a break.');
      notifyUser('⏰ Focus session complete!', 'Time to take a break.');
    }
  }, 1000);
});

/* Pause */
$('timer-stop').addEventListener('click', () => {
  if (!timerRunning) return;
  clearInterval(timerInterval);
  timerRunning = false;
  $('timer-start').disabled = false;
  setTimerVisualState('idle');
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
  setTimerVisualState('idle');
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
  saveLS('ls_timer_duration', timerDuration);
  renderTimerDisplay();
  renderTimerProgress();
  setTimerVisualState('idle');
  setTimerStatus(`Timer set to ${val} minute${val > 1 ? 's' : ''}.`);
}

/* Browser notification helper */
function notifyUser(title, body) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification(title, { body });
  }
}

// Request permission on first user interaction
document.addEventListener('click', () => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}, { once: true });

/* ══════════════════════════════════════════════════════════
   5. TO-DO LIST
      Challenges: Prevent duplicates ✅ | Sort tasks ✅
   ══════════════════════════════════════════════════════════ */
let todos  = loadLS('ls_todos', []);       // [{id, text, done, createdAt}]
let todoId = loadLS('ls_todos_id', 1);

function saveTodos() {
  saveLS('ls_todos', todos);
  saveLS('ls_todos_id', todoId);
}

/* ── Sort ── */
function getSortedTodos() {
  const mode = $('todo-sort').value;
  const copy = [...todos];
  switch (mode) {
    case 'az':   return copy.sort((a, b) => a.text.localeCompare(b.text));
    case 'za':   return copy.sort((a, b) => b.text.localeCompare(a.text));
    case 'done': return copy.sort((a, b) => Number(a.done) - Number(b.done));
    default:     return copy; // insertion order
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

  count.textContent = total === 0 ? '' : `${done}/${total} done`;
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

    // Text span
    const span = document.createElement('span');
    span.className = 'todo-text';
    span.textContent = todo.text;

    // Action buttons
    const actions = document.createElement('div');
    actions.className = 'todo-actions';

    const editBtn = document.createElement('button');
    editBtn.textContent = '✏️';
    editBtn.title = 'Edit task';
    editBtn.setAttribute('aria-label', `Edit task: ${todo.text}`);
    editBtn.addEventListener('click', () => startEditTodo(todo.id, li, span));

    const delBtn = document.createElement('button');
    delBtn.textContent = '🗑️';
    delBtn.className = 'btn-delete';
    delBtn.title = 'Delete task';
    delBtn.setAttribute('aria-label', `Delete task: ${todo.text}`);
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

  // Prevent duplicates (Challenge ✅)
  if (isDuplicateTodo(text)) {
    showTodoWarning('⚠️ This task already exists!');
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
    (t) => t.id !== excludeId && t.text.toLowerCase() === text.toLowerCase()
  );
}

function showTodoWarning(msg) {
  $('duplicate-warning').textContent = msg;
}
function hideTodoWarning() {
  $('duplicate-warning').textContent = '';
}

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

/* ── Inline edit ── */
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
    if (!newText) {
      li.replaceChild(span, editInput);
      return;
    }
    if (isDuplicateTodo(newText, id)) {
      editInput.style.borderColor = 'var(--danger)';
      editInput.title = '⚠️ Duplicate task!';
      committed = false; // allow retry
      editInput.focus();
      return;
    }
    todo.text = newText;
    saveTodos();
    renderTodos();
  }

  editInput.addEventListener('blur',    commitEdit);
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

renderTodos();

/* ══════════════════════════════════════════════════════════
   6. QUICK LINKS
   ══════════════════════════════════════════════════════════ */
let links  = loadLS('ls_links', []);   // [{id, label, url}]
let linkId = loadLS('ls_links_id', 1);

function saveLinks() {
  saveLS('ls_links', links);
  saveLS('ls_links_id', linkId);
}

/* ── Render ── */
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

    const label = document.createElement('span');
    label.className   = 'link-label';
    label.textContent = link.label;

    const del = document.createElement('button');
    del.className = 'link-delete';
    del.textContent = '✕';
    del.title = `Remove ${link.label}`;
    del.setAttribute('aria-label', `Remove link: ${link.label}`);
    del.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      deleteLink(link.id);
    });

    chip.append(label, del);
    grid.appendChild(chip);
  });
}

/* ── Add ── */
function addLink() {
  const labelEl = $('link-name-input');
  const urlEl   = $('link-url-input');
  const label   = labelEl.value.trim();
  let   url     = urlEl.value.trim();

  if (!label || !url) {
    showLinkError('Please fill in both label and URL.');
    return;
  }

  // Auto-prepend https:// if missing
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  // Validate URL
  try { new URL(url); } catch {
    showLinkError('Please enter a valid URL.');
    urlEl.focus();
    return;
  }

  hideLinkError();
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

function showLinkError(msg) { $('link-error').textContent = msg; }
function hideLinkError()    { $('link-error').textContent = ''; }

/* ── Event listeners ── */
$('link-add-btn').addEventListener('click', addLink);
$('link-url-input').addEventListener('keydown',  (e) => { if (e.key === 'Enter') addLink(); });
$('link-name-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('link-url-input').focus(); });
$('link-url-input').addEventListener('input',    hideLinkError);
$('link-name-input').addEventListener('input',   hideLinkError);

renderLinks();
