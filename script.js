const firebaseConfig = {
  apiKey: "AIzaSyBVY11Qp7xRUemNDGJ6DttzmNmGTUi8Ue4",
  authDomain: "todo-21f70.firebaseapp.com",
  databaseURL: "https://todo-21f70-default-rtdb.firebaseio.com",
  projectId: "todo-21f70",
  storageBucket: "todo-21f70.firebasestorage.app",
  messagingSenderId: "1064515594353",
  appId: "1:1064515594353:web:aba5ebe2ae6a85fcdf93d0",
  measurementId: "G-MYQCHJK82E"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const tasksRef = database.ref('tasks');

const todayLabelEl = document.getElementById('today-label');
const todayListEl = document.getElementById('today-list');
const allListEl = document.getElementById('all-list');
const todayCountEl = document.getElementById('today-count');
const allCountEl = document.getElementById('all-count');
const todayEmptyEl = document.getElementById('today-empty');
const allEmptyEl = document.getElementById('all-empty');
const modalOverlayEl = document.getElementById('modal-overlay');
const detailOverlayEl = document.getElementById('detail-overlay');
const taskFormEl = document.getElementById('task-form');
const taskTitleEl = document.getElementById('task-title');
const taskContentEl = document.getElementById('task-content');
const taskDateEl = document.getElementById('task-date');
const detailTitleEl = document.getElementById('detail-title');
const detailContentEl = document.getElementById('detail-content');
const detailDateEl = document.getElementById('detail-date');
const detailEditBtn = document.getElementById('detail-edit-btn');
const detailToggleDoneBtn = document.getElementById('detail-toggle-done-btn');
const detailDeleteBtn = document.getElementById('detail-delete-btn');
const detailModalTitleEl = document.getElementById('detail-modal-title');
const listViewSectionEl = document.getElementById('list-view-section');
const calendarViewSectionEl = document.getElementById('calendar-view-section');
const listViewBtn = document.getElementById('list-view-btn');
const calendarViewBtn = document.getElementById('calendar-view-btn');
const calendarMonthLabelEl = document.getElementById('calendar-month-label');
const calendarGridEl = document.getElementById('calendar-grid');
const dayListOverlayEl = document.getElementById('day-list-overlay');
const dayListDateLabelEl = document.getElementById('day-list-date-label');
const dayTaskListEl = document.getElementById('day-task-list');
const dayListEmptyEl = document.getElementById('day-list-empty');

let tasks = [];
let detailTaskId = null;
let detailIsEditing = false;
let currentView = 'list';
let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth();
let selectedDayDate = null;

function normalizeFirebaseTask(id, data) {
  return {
    id,
    title: data.title || '',
    content: data.discription || '',
    date: data.date || getTodayString(),
    done: Boolean(data.done),
    createdAt: data.createdAt || 0,
  };
}

function listenTasksFromFirebase() {
  tasksRef.on('value', (snapshot) => {
    const data = snapshot.val() || {};
    tasks = Object.entries(data).map(([id, task]) => normalizeFirebaseTask(id, task));
    render();
  }, (error) => {
    console.error('Firebase 할 일 불러오기 오류:', error);
    alert('Firebase에서 할 일을 불러오지 못했습니다. 데이터베이스 규칙과 연결 상태를 확인해 주세요.');
  });
}

function saveTasks() {
  // Firebase Realtime Database를 사용하므로 별도의 localStorage 저장은 하지 않습니다.
}

function getTodayString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateLabel(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  return `${y}년 ${m}월 ${d}일 (${weekdays[date.getDay()]})`;
}

function formatDisplayDate(dateStr) {
  const today = getTodayString();
  const label = formatDateLabel(dateStr);
  if (dateStr === today) return `오늘 · ${label}`;
  return label;
}

function updateHeader() {
  const today = getTodayString();
  todayLabelEl.textContent = formatDateLabel(today);
}

function sortTasks(list) {
  return [...list].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.done !== b.done) return a.done ? 1 : -1;
    return b.createdAt - a.createdAt;
  });
}

function createTaskElement(task, { clickable = false, showTodayActions = false } = {}) {
  const today = getTodayString();
  const li = document.createElement('li');
  li.className = `task-item${task.done ? ' done' : ''}`;
  li.dataset.id = task.id;

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task-checkbox';
  checkbox.checked = task.done;
  checkbox.addEventListener('change', () => toggleDone(task.id));
  checkbox.addEventListener('click', (e) => e.stopPropagation());

  const body = document.createElement('div');
  body.className = `task-body${clickable ? ' task-body-clickable' : ''}`;
  if (clickable) {
    body.addEventListener('click', () => openDetailModal(task.id));
  }

  const title = document.createElement('div');
  title.className = 'task-title';
  title.textContent = task.title;

  body.appendChild(title);

  if (task.content) {
    const content = document.createElement('div');
    content.className = 'task-content';
    content.textContent = task.content;
    body.appendChild(content);
  }

  const meta = document.createElement('div');
  meta.className = 'task-meta';

  const dateSpan = document.createElement('span');
  dateSpan.className = 'task-date';
  if (task.date === today) dateSpan.classList.add('today');
  else if (task.date < today && !task.done) dateSpan.classList.add('past');
  dateSpan.textContent = `📅 ${formatDisplayDate(task.date)}`;
  meta.appendChild(dateSpan);
  body.appendChild(meta);

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = showTodayActions ? 'task-action-btn task-delete-btn' : 'task-delete';
  deleteBtn.title = '삭제';
  deleteBtn.textContent = showTodayActions ? '삭제' : '×';
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteTask(task.id);
  });

  li.appendChild(checkbox);
  li.appendChild(body);

  if (showTodayActions) {
    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const completeBtn = document.createElement('button');
    completeBtn.type = 'button';
    completeBtn.className = 'task-action-btn task-complete-btn';
    completeBtn.textContent = task.done ? '미완료' : '완료';
    completeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDone(task.id);
    });

    actions.appendChild(completeBtn);
    actions.appendChild(deleteBtn);
    li.appendChild(actions);
  } else {
    li.appendChild(deleteBtn);
  }

  return li;
}

function createAllListItem(task) {
  const today = getTodayString();
  const li = document.createElement('li');
  li.className = `all-list-item${task.done ? ' done' : ''}`;
  li.dataset.id = task.id;

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task-checkbox';
  checkbox.checked = task.done;
  checkbox.addEventListener('change', () => toggleDone(task.id));
  checkbox.addEventListener('click', (e) => e.stopPropagation());

  const body = document.createElement('div');
  body.className = 'all-list-body';
  body.addEventListener('click', () => openDetailModal(task.id));

  const title = document.createElement('div');
  title.className = 'all-list-title';
  title.textContent = task.title;
  body.appendChild(title);

  if (task.content) {
    const content = document.createElement('div');
    content.className = 'all-list-content';
    content.textContent = task.content;
    body.appendChild(content);
  }

  const dateSpan = document.createElement('div');
  dateSpan.className = 'all-list-date';
  if (task.date === today) dateSpan.classList.add('today');
  else if (task.date < today && !task.done) dateSpan.classList.add('past');
  dateSpan.textContent = `📅 ${formatDisplayDate(task.date)}`;
  body.appendChild(dateSpan);

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'task-delete';
  deleteBtn.title = '삭제';
  deleteBtn.textContent = '×';
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteTask(task.id);
  });

  li.appendChild(checkbox);
  li.appendChild(body);
  li.appendChild(deleteBtn);

  return li;
}

function dateToString(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function setViewMode(mode) {
  currentView = mode;
  const isList = mode === 'list';

  listViewBtn.classList.toggle('active', isList);
  calendarViewBtn.classList.toggle('active', !isList);
  listViewSectionEl.classList.toggle('hidden', !isList);
  calendarViewSectionEl.classList.toggle('hidden', isList);

  if (!isList) renderCalendar();
}

function renderListView() {
  const allTasks = sortTasks(tasks);

  allListEl.innerHTML = '';

  allTasks.forEach((task) => {
    allListEl.appendChild(createAllListItem(task));
  });

  allCountEl.textContent = allTasks.length;
  allEmptyEl.classList.toggle('hidden', allTasks.length > 0);
  allListEl.classList.toggle('hidden', allTasks.length === 0);
}

function renderCalendar() {
  const today = getTodayString();
  const firstDay = new Date(calendarYear, calendarMonth, 1);
  const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
  const startWeekday = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  calendarMonthLabelEl.textContent = `${calendarYear}년 ${calendarMonth + 1}월`;
  calendarGridEl.innerHTML = '';

  const tasksByDate = {};
  tasks.forEach((task) => {
    if (!tasksByDate[task.date]) tasksByDate[task.date] = [];
    tasksByDate[task.date].push(task);
  });

  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;

  for (let i = 0; i < totalCells; i++) {
    const dayOffset = i - startWeekday + 1;
    const cellDate = new Date(calendarYear, calendarMonth, dayOffset);
    const cellYear = cellDate.getFullYear();
    const cellMonth = cellDate.getMonth();
    const cellDay = cellDate.getDate();
    const dateStr = dateToString(cellYear, cellMonth, cellDay);
    const isCurrentMonth = cellMonth === calendarMonth;
    const isToday = dateStr === today;

    const cell = document.createElement('div');
    cell.className = 'calendar-day';
    if (!isCurrentMonth) cell.classList.add('other-month');
    if (isToday) cell.classList.add('today');

    const dayNumber = document.createElement('div');
    dayNumber.className = 'calendar-day-number';
    dayNumber.textContent = cellDay;
    cell.appendChild(dayNumber);

    const taskList = document.createElement('ul');
    taskList.className = 'calendar-day-tasks';

    const dayTasks = sortTasks(tasksByDate[dateStr] || []);
    dayTasks.forEach((task) => {
      const item = document.createElement('li');
      item.className = `calendar-task${task.done ? ' done' : ''}`;
      item.textContent = task.title;
      item.title = task.title;
      taskList.appendChild(item);
    });

    cell.appendChild(taskList);
    cell.addEventListener('click', () => openDayListModal(dateStr));
    calendarGridEl.appendChild(cell);
  }
}

function createDayListItem(task) {
  const li = document.createElement('li');
  li.className = `day-list-item${task.done ? ' done' : ''}`;

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task-checkbox';
  checkbox.checked = task.done;
  checkbox.addEventListener('change', () => toggleDone(task.id));
  checkbox.addEventListener('click', (e) => e.stopPropagation());

  const body = document.createElement('div');
  body.className = 'day-list-item-body';
  body.addEventListener('click', () => openDetailModal(task.id));

  const title = document.createElement('div');
  title.className = 'day-list-item-title';
  title.textContent = task.title;
  body.appendChild(title);

  if (task.content) {
    const content = document.createElement('div');
    content.className = 'day-list-item-content';
    content.textContent = task.content;
    body.appendChild(content);
  }

  li.appendChild(checkbox);
  li.appendChild(body);

  return li;
}

function renderDayListModal() {
  if (!selectedDayDate) return;

  const dayTasks = sortTasks(tasks.filter((t) => t.date === selectedDayDate));

  dayListDateLabelEl.textContent = formatDateLabel(selectedDayDate);
  dayTaskListEl.innerHTML = '';

  dayTasks.forEach((task) => {
    dayTaskListEl.appendChild(createDayListItem(task));
  });

  dayListEmptyEl.classList.toggle('hidden', dayTasks.length > 0);
  dayTaskListEl.classList.toggle('hidden', dayTasks.length === 0);
}

function openDayListModal(dateStr) {
  selectedDayDate = dateStr;
  renderDayListModal();
  dayListOverlayEl.classList.remove('hidden');
}

function closeDayListModal() {
  dayListOverlayEl.classList.add('hidden');
  selectedDayDate = null;
}

function render() {
  const today = getTodayString();
  const todayTasks = sortTasks(tasks.filter((t) => t.date === today));

  todayListEl.innerHTML = '';

  todayTasks.forEach((task) => {
    todayListEl.appendChild(createTaskElement(task, { clickable: true, showTodayActions: true }));
  });

  todayCountEl.textContent = todayTasks.length;
  todayEmptyEl.classList.toggle('hidden', todayTasks.length > 0);
  todayListEl.classList.toggle('hidden', todayTasks.length === 0);

  renderListView();
  if (currentView === 'calendar') renderCalendar();
  if (selectedDayDate) renderDayListModal();
}

function openModal(date = getTodayString()) {
  taskFormEl.reset();
  taskDateEl.value = date;
  modalOverlayEl.classList.remove('hidden');
  taskTitleEl.focus();
}

function openModalForSelectedDay() {
  if (!selectedDayDate) return;
  openModal(selectedDayDate);
}

function closeModal() {
  modalOverlayEl.classList.add('hidden');
}

function setDetailFieldsReadonly(readonly) {
  [detailTitleEl, detailContentEl, detailDateEl].forEach((el) => {
    el.readOnly = readonly;
    el.classList.toggle('readonly', readonly);
  });
}

function populateDetailFields(task) {
  detailTitleEl.value = task.title;
  detailContentEl.value = task.content || '';
  detailDateEl.value = task.date;
}

function updateDetailToggleButton(task) {
  detailToggleDoneBtn.textContent = task.done ? '미완료로 만들기' : '완료하기';
}

function setDetailEditMode(editing) {
  detailIsEditing = editing;
  setDetailFieldsReadonly(!editing);
  detailEditBtn.textContent = editing ? '저장' : '상세 정보 편집';
  detailModalTitleEl.textContent = editing ? '할 일 편집' : '할 일 상세';
  detailToggleDoneBtn.disabled = editing;
  detailDeleteBtn.disabled = editing;

  if (editing) {
    detailTitleEl.focus();
  }
}

function refreshDetailModal() {
  const task = tasks.find((t) => t.id === detailTaskId);
  if (!task) {
    closeDetailModal();
    return;
  }
  populateDetailFields(task);
  updateDetailToggleButton(task);
}

function openDetailModal(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  detailTaskId = id;
  detailIsEditing = false;
  populateDetailFields(task);
  setDetailEditMode(false);
  updateDetailToggleButton(task);
  detailOverlayEl.classList.remove('hidden');
}

function closeDetailModal() {
  detailOverlayEl.classList.add('hidden');
  detailTaskId = null;
  detailIsEditing = false;
  setDetailFieldsReadonly(true);
  detailEditBtn.textContent = '상세 정보 편집';
  detailModalTitleEl.textContent = '할 일 상세';
  detailToggleDoneBtn.disabled = false;
  detailDeleteBtn.disabled = false;
}

async function updateTask(id, title, content, date) {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) return false;

  try {
    await tasksRef.child(id).update({
      title: trimmedTitle,
      discription: content.trim(),
      date,
    });
    return true;
  } catch (error) {
    console.error('Firebase 할 일 수정 오류:', error);
    alert('할 일을 수정하지 못했습니다. Firebase 연결 상태를 확인해 주세요.');
    return false;
  }
}

async function addTask(title, content, date) {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) return false;

  try {
    await tasksRef.push({
      title: trimmedTitle,
      discription: content.trim(),
      date,
      done: false,
      createdAt: Date.now(),
    });
    return true;
  } catch (error) {
    console.error('Firebase 할 일 저장 오류:', error);
    alert('할 일을 Firebase에 저장하지 못했습니다. 데이터베이스 규칙과 연결 상태를 확인해 주세요.');
    return false;
  }
}

async function toggleDone(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  try {
    await tasksRef.child(id).update({ done: !task.done });
  } catch (error) {
    console.error('Firebase 완료 상태 변경 오류:', error);
    alert('완료 상태를 변경하지 못했습니다. Firebase 연결 상태를 확인해 주세요.');
  }
}

async function deleteTask(id) {
  if (!confirm('이 할 일을 삭제할까요?')) return;

  try {
    if (detailTaskId === id) closeDetailModal();
    await tasksRef.child(id).remove();
  } catch (error) {
    console.error('Firebase 할 일 삭제 오류:', error);
    alert('할 일을 삭제하지 못했습니다. Firebase 연결 상태를 확인해 주세요.');
  }
}

document.getElementById('add-btn').addEventListener('click', openModal);
document.getElementById('cancel-btn').addEventListener('click', closeModal);
document.getElementById('detail-close-btn').addEventListener('click', closeDetailModal);
document.getElementById('day-list-close-btn').addEventListener('click', closeDayListModal);
document.getElementById('day-list-add-btn').addEventListener('click', openModalForSelectedDay);

listViewBtn.addEventListener('click', () => setViewMode('list'));
calendarViewBtn.addEventListener('click', () => setViewMode('calendar'));

document.getElementById('prev-month').addEventListener('click', () => {
  calendarMonth -= 1;
  if (calendarMonth < 0) {
    calendarMonth = 11;
    calendarYear -= 1;
  }
  renderCalendar();
});

document.getElementById('next-month').addEventListener('click', () => {
  calendarMonth += 1;
  if (calendarMonth > 11) {
    calendarMonth = 0;
    calendarYear += 1;
  }
  renderCalendar();
});

detailEditBtn.addEventListener('click', async () => {
  if (!detailTaskId) return;

  if (!detailIsEditing) {
    setDetailEditMode(true);
    return;
  }

  const saved = await updateTask(
    detailTaskId,
    detailTitleEl.value,
    detailContentEl.value,
    detailDateEl.value
  );
  if (!saved) {
    detailTitleEl.focus();
    return;
  }

  setDetailEditMode(false);
  refreshDetailModal();
});

detailToggleDoneBtn.addEventListener('click', () => {
  if (!detailTaskId || detailIsEditing) return;
  toggleDone(detailTaskId);
  refreshDetailModal();
});

detailDeleteBtn.addEventListener('click', () => {
  if (!detailTaskId || detailIsEditing) return;
  deleteTask(detailTaskId);
});

modalOverlayEl.addEventListener('click', (e) => {
  if (e.target === modalOverlayEl) closeModal();
});

detailOverlayEl.addEventListener('click', (e) => {
  if (e.target === detailOverlayEl) closeDetailModal();
});

dayListOverlayEl.addEventListener('click', (e) => {
  if (e.target === dayListOverlayEl) closeDayListModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!modalOverlayEl.classList.contains('hidden')) {
    closeModal();
    return;
  }
  if (!detailOverlayEl.classList.contains('hidden')) {
    if (detailIsEditing) {
      setDetailEditMode(false);
      refreshDetailModal();
    } else {
      closeDetailModal();
    }
    return;
  }
  if (!dayListOverlayEl.classList.contains('hidden')) closeDayListModal();
});

taskFormEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = taskTitleEl.value.trim();
  if (!title) return;

  const saved = await addTask(title, taskContentEl.value, taskDateEl.value);
  if (saved) closeModal();
});

updateHeader();
listenTasksFromFirebase();
