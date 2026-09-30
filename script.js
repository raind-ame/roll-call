const STORAGE_KEY = 'roll-call-students';
const DATE_KEY = 'roll-call-date';
const HOMEWORK_KEY = 'roll-call-homework';
const STATUS_LABELS = { present: '出席', late: '遲到', absent: '缺席' };
const today = new Date().toLocaleDateString('zh-TW');

const todayText = document.getElementById('today');
const addForm = document.getElementById('add-form');
const nameInput = document.getElementById('name-input');
const studentList = document.getElementById('student-list');
const emptyTip = document.getElementById('empty-tip');
const restPresentBtn = document.getElementById('rest-present-btn');
const resetBtn = document.getElementById('reset-btn');
const clearBtn = document.getElementById('clear-btn');
const statTotal = document.getElementById('stat-total');
const statPresent = document.getElementById('stat-present');
const statLate = document.getElementById('stat-late');
const statAbsent = document.getElementById('stat-absent');
const statUnmarked = document.getElementById('stat-unmarked');
const pickedName = document.getElementById('picked-name');
const pickBtn = document.getElementById('pick-btn');
const tabs = document.querySelectorAll('.tab');
const tabPanels = document.querySelectorAll('.tab-panel');
const homeworkForm = document.getElementById('homework-form');
const homeworkTitle = document.getElementById('homework-title');
const homeworkDue = document.getElementById('homework-due');
const homeworkList = document.getElementById('homework-list');
const homeworkEmpty = document.getElementById('homework-empty');

let students = loadStudents();
let pickedStudent = ''; // 最近一次抽中的姓名，用來在名單中標示
let homework = loadHomework();
let openHomeworkId = null; // 目前展開的作業

function loadStudents() {
  let data;
  try {
    data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    data = [];
  }

  // 換日後清掉前一天的點名狀態，名單保留
  if (localStorage.getItem(DATE_KEY) !== today) {
    data.forEach((student) => (student.status = ''));
  }
  return data;
}

function saveStudents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  localStorage.setItem(DATE_KEY, today);
}

function render() {
  studentList.innerHTML = '';

  students.forEach((student, index) => {
    const li = document.createElement('li');
    li.className = 'student';
    if (student.status) li.classList.add(student.status);
    if (student.name === pickedStudent) li.classList.add('picked');

    const no = document.createElement('span');
    no.className = 'student-no';
    no.textContent = index + 1;

    const name = document.createElement('span');
    name.className = 'student-name';
    name.textContent = student.name;

    const statusGroup = document.createElement('div');
    statusGroup.className = 'status-group';
    Object.entries(STATUS_LABELS).forEach(([status, label]) => {
      const btn = document.createElement('button');
      btn.className = `status-btn ${status}`;
      btn.classList.toggle('active', student.status === status);
      btn.textContent = label;
      btn.dataset.action = 'status';
      btn.dataset.status = status;
      btn.dataset.index = index;
      statusGroup.appendChild(btn);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.textContent = '×';
    deleteBtn.title = '刪除';
    deleteBtn.dataset.action = 'delete';
    deleteBtn.dataset.index = index;

    li.append(no, name, statusGroup, deleteBtn);
    studentList.appendChild(li);
  });

  emptyTip.hidden = students.length > 0;
  renderStats();
}

function renderStats() {
  const count = (status) => students.filter((student) => student.status === status).length;

  statTotal.textContent = students.length;
  statPresent.textContent = count('present');
  statLate.textContent = count('late');
  statAbsent.textContent = count('absent');
  statUnmarked.textContent = count('');
}

// 儲存後重新渲染畫面；名單變動會影響作業的繳交人數，所以作業也要重畫
function update() {
  saveStudents();
  render();
  renderHomework();
}

function addStudents() {
  const names = nameInput.value
    .split(/[,，、\n]/)
    .map((name) => name.trim())
    .filter(Boolean);

  names.forEach((name) => {
    // 跳過已存在的姓名，避免重複加入
    if (!students.some((student) => student.name === name)) {
      students.push({ name, status: '' });
    }
  });

  nameInput.value = '';
  update();
}

function pickRandom() {
  // 缺席的學生不會被抽到
  const candidates = students.filter((student) => student.status !== 'absent');
  if (candidates.length === 0) {
    pickedName.textContent = '沒有可抽的學生';
    return;
  }

  let times = 0;
  pickBtn.disabled = true;
  pickedName.classList.add('rolling');

  // 快速輪播名字，最後停下來的就是抽中的人
  const timer = setInterval(() => {
    const student = candidates[Math.floor(Math.random() * candidates.length)];
    pickedName.textContent = student.name;
    times++;

    if (times >= 15) {
      clearInterval(timer);
      pickedName.classList.remove('rolling');
      pickBtn.disabled = false;
      pickedStudent = student.name;
      render();
    }
  }, 60);
}

addForm.addEventListener('submit', (e) => {
  e.preventDefault();
  addStudents();
});

// Enter 直接新增、Shift + Enter 換行；中文輸入法選字時按的 Enter 不算
nameInput.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' || e.shiftKey || e.isComposing || e.keyCode === 229) return;
  e.preventDefault();
  addStudents();
});

studentList.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;

  const index = Number(btn.dataset.index);
  const student = students[index];

  if (btn.dataset.action === 'delete') {
    students.splice(index, 1);
  } else if (btn.dataset.action === 'status') {
    // 再點一次同一個狀態就取消
    student.status = student.status === btn.dataset.status ? '' : btn.dataset.status;
  }
  update();
});

pickBtn.addEventListener('click', pickRandom);

restPresentBtn.addEventListener('click', () => {
  students.forEach((student) => {
    if (!student.status) student.status = 'present';
  });
  update();
});

resetBtn.addEventListener('click', () => {
  if (students.length === 0) return;
  if (confirm('確定要清除今天的點名紀錄嗎？')) {
    students.forEach((student) => (student.status = ''));
    update();
  }
});

clearBtn.addEventListener('click', () => {
  if (students.length === 0) return;
  if (confirm('確定要清空所有學生嗎？')) {
    students = [];
    update();
  }
});

// ===== 分頁切換 =====

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((item) => item.classList.toggle('active', item === tab));
    tabPanels.forEach((panel) => {
      panel.hidden = panel.id !== `tab-${tab.dataset.tab}`;
    });
  });
});

// ===== 作業管理 =====

function loadHomework() {
  try {
    return JSON.parse(localStorage.getItem(HOMEWORK_KEY)) || [];
  } catch {
    return [];
  }
}

function saveHomework() {
  localStorage.setItem(HOMEWORK_KEY, JSON.stringify(homework));
}

function updateHomework() {
  saveHomework();
  renderHomework();
}

// 建立元素的小工具，作業卡片層數比較多，用這個比較好讀
function createEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

// 截止日（YYYY-MM-DD）距離今天還有幾天，負數代表已經過了
function daysUntil(due) {
  const [year, month, day] = due.split('-').map(Number);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((new Date(year, month - 1, day) - todayStart) / 86400000);
}

function formatDue(due) {
  const [year, month, day] = due.split('-').map(Number);
  const weekday = '日一二三四五六'[new Date(year, month - 1, day).getDay()];
  return `${month}/${day}（${weekday}）`;
}

function createDueBadge(due, allDone) {
  if (allDone) return createEl('span', 'badge complete', '全部繳交');

  const days = daysUntil(due);
  if (days < 0) return createEl('span', 'badge overdue', '已截止');
  if (days === 0) return createEl('span', 'badge today', '今天截止');
  return createEl('span', 'badge', `剩 ${days} 天`);
}

function renderHomework() {
  homeworkList.innerHTML = '';

  // 依截止日期排序，最早到期的在最上面
  const sorted = [...homework].sort((a, b) => a.due.localeCompare(b.due));

  sorted.forEach((hw) => {
    // 只算目前名單裡的學生，已刪除的學生不列入
    const missing = students.filter((student) => !hw.submitted.includes(student.name));
    const doneCount = students.length - missing.length;
    const isOpen = hw.id === openHomeworkId;

    const li = createEl('li', 'card homework');
    li.classList.toggle('open', isOpen);

    const header = createEl('button', 'homework-header');
    header.type = 'button';
    header.dataset.action = 'toggle';
    header.dataset.id = hw.id;

    const meta = createEl('span', 'homework-meta', `截止 ${formatDue(hw.due)}`);
    meta.appendChild(createDueBadge(hw.due, students.length > 0 && missing.length === 0));

    const info = createEl('span', 'homework-info');
    info.append(createEl('span', 'homework-title', hw.title), meta);

    const fill = createEl('span', 'progress-fill');
    fill.style.width = students.length ? `${(doneCount / students.length) * 100}%` : '0';
    const bar = createEl('span', 'progress-bar');
    bar.appendChild(fill);

    const progress = createEl('span', 'homework-progress', `${doneCount} / ${students.length}`);
    progress.appendChild(bar);

    header.append(info, progress);
    li.appendChild(header);
    if (isOpen) li.appendChild(createHomeworkDetail(hw, missing));
    homeworkList.appendChild(li);
  });

  homeworkEmpty.hidden = homework.length > 0;
}

// 展開後的內容：未交名單、勾選繳交、操作按鈕
function createHomeworkDetail(hw, missing) {
  const detail = createEl('div', 'homework-detail');

  if (students.length === 0) {
    detail.appendChild(createEl('p', 'hint', '還沒有學生，請先到「點名」分頁新增名單。'));
  } else {
    const missingText = missing.length
      ? `未交（${missing.length}）：${missing.map((student) => student.name).join('、')}`
      : '全部都交齊了！';
    detail.appendChild(createEl('p', 'missing-list', missingText));

    const grid = createEl('div', 'submit-grid');
    students.forEach((student) => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = hw.submitted.includes(student.name);
      checkbox.dataset.id = hw.id;
      checkbox.dataset.name = student.name;

      const label = createEl('label', 'submit-item');
      label.classList.toggle('done', checkbox.checked);
      label.append(checkbox, student.name);
      grid.appendChild(label);
    });
    detail.appendChild(grid);
  }

  const submitAllBtn = createEl('button', 'btn', '全部已交');
  submitAllBtn.dataset.action = 'submit-all';
  submitAllBtn.dataset.id = hw.id;

  const deleteBtn = createEl('button', 'btn btn-danger', '刪除作業');
  deleteBtn.dataset.action = 'delete-homework';
  deleteBtn.dataset.id = hw.id;

  const actions = createEl('div', 'actions');
  actions.append(submitAllBtn, deleteBtn);
  detail.appendChild(actions);
  return detail;
}

homeworkForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = homeworkTitle.value.trim();
  if (!title) return;

  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  homework.push({ id, title, due: homeworkDue.value, submitted: [] });
  // 截止日期保留不清空，方便連續新增同一天要交的作業
  homeworkTitle.value = '';
  updateHomework();
});

homeworkList.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const hw = homework.find((item) => item.id === btn.dataset.id);
  const action = btn.dataset.action;

  if (action === 'toggle') {
    openHomeworkId = openHomeworkId === hw.id ? null : hw.id;
    renderHomework();
  } else if (action === 'submit-all') {
    hw.submitted = students.map((student) => student.name);
    updateHomework();
  } else if (action === 'delete-homework' && confirm(`確定要刪除「${hw.title}」嗎？`)) {
    homework = homework.filter((item) => item !== hw);
    updateHomework();
  }
});

// 勾選／取消勾選繳交
homeworkList.addEventListener('change', (e) => {
  const { id, name } = e.target.dataset;
  const hw = homework.find((item) => item.id === id);

  if (e.target.checked) {
    hw.submitted.push(name);
  } else {
    hw.submitted = hw.submitted.filter((submittedName) => submittedName !== name);
  }
  updateHomework();
});

todayText.textContent = new Date().toLocaleDateString('zh-TW', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
});

render();
renderHomework();
