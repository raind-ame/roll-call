const STORAGE_KEY = 'roll-call-students';

const todayText = document.getElementById('today');
const addForm = document.getElementById('add-form');
const nameInput = document.getElementById('name-input');
const studentList = document.getElementById('student-list');
const emptyTip = document.getElementById('empty-tip');
const clearBtn = document.getElementById('clear-btn');

let students = loadStudents();

function loadStudents() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveStudents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

function render() {
  studentList.innerHTML = '';

  students.forEach((student, index) => {
    const li = document.createElement('li');
    li.className = 'student';

    const no = document.createElement('span');
    no.className = 'student-no';
    no.textContent = index + 1;

    const name = document.createElement('span');
    name.className = 'student-name';
    name.textContent = student.name;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.textContent = '×';
    deleteBtn.title = '刪除';
    deleteBtn.dataset.action = 'delete';
    deleteBtn.dataset.index = index;

    li.append(no, name, deleteBtn);
    studentList.appendChild(li);
  });

  emptyTip.hidden = students.length > 0;
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
      students.push({ name });
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
  if (btn.dataset.action === 'delete') {
    students.splice(index, 1);
  }
  update();
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
