const STORAGE_KEY = 'roll-call-students';
const DATE_KEY = 'roll-call-date';
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

let students = loadStudents();

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

// 儲存後重新渲染畫面
function update() {
  saveStudents();
  render();
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

todayText.textContent = new Date().toLocaleDateString('zh-TW', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
});

render();
