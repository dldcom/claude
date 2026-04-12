// Teacher Dashboard SPA — pure JS, no framework

let token = null;
let currentClassId = null;
let ws = null;

// ── View helpers ──────────────────────────────────────────────────────────────

function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

function showError(elId, msg) {
  const el = document.getElementById(elId);
  el.textContent = msg;
  el.classList.remove('hidden');
}

function clearError(elId) {
  const el = document.getElementById(elId);
  el.textContent = '';
  el.classList.add('hidden');
}

// ── Auth ──────────────────────────────────────────────────────────────────────

async function apiLogin(login_id, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login_id, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '로그인 실패');
  return data;
}

async function apiRegister(login_id, password) {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login_id, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '회원가입 실패');
  return data;
}

function setToken(t) {
  token = t;
  sessionStorage.setItem('teacher_token', t);
}

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

// ── Classes ───────────────────────────────────────────────────────────────────

async function loadClasses() {
  const res = await fetch('/api/classes', { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '반 목록 로드 실패');
  return data; // array of { id, name, ... }
}

async function populateClassSelect(classes) {
  const sel = document.getElementById('class-select');
  sel.innerHTML = '';
  if (!classes || classes.length === 0) {
    const opt = document.createElement('option');
    opt.textContent = '반 없음';
    sel.appendChild(opt);
    return;
  }
  classes.forEach(cls => {
    const opt = document.createElement('option');
    opt.value = cls.id;
    opt.textContent = cls.name;
    sel.appendChild(opt);
  });
  // Set currentClassId to first class if not set
  if (!currentClassId) {
    currentClassId = parseInt(sel.value);
  }
}

// ── Progress Grid ─────────────────────────────────────────────────────────────

async function loadProgress() {
  if (!currentClassId) return;

  // Fetch students and regions in parallel
  const [studentsRes, regionsRes] = await Promise.all([
    fetch(`/api/classes/${currentClassId}/students`, { headers: authHeaders() }),
    fetch('/api/regions', { headers: authHeaders() }),
  ]);

  const students = await studentsRes.json();
  const regions = await regionsRes.json();

  if (!studentsRes.ok || !regionsRes.ok) {
    document.getElementById('progress-grid').innerHTML = '<p class="error-msg">데이터 로드 실패</p>';
    return;
  }

  // Fetch progress for each student
  const progressByStudent = {};
  await Promise.all(
    students.map(async (s) => {
      const r = await fetch(`/api/progress/${s.id}`, { headers: authHeaders() });
      if (r.ok) {
        const prog = await r.json();
        progressByStudent[s.id] = prog; // array of { npc_id, is_cleared, ... }
      } else {
        progressByStudent[s.id] = [];
      }
    })
  );

  renderGrid(students, regions, progressByStudent);
  renderStats(students, regions, progressByStudent);
}

function renderGrid(students, regions, progressByStudent) {
  const container = document.getElementById('progress-grid');
  if (!students.length) {
    container.innerHTML = '<p style="color:#888; text-align:center; padding:20px">등록된 학생이 없습니다.</p>';
    return;
  }

  // Build set of cleared npc_ids per student
  const clearedMap = {};
  students.forEach(s => {
    const prog = progressByStudent[s.id] || [];
    clearedMap[s.id] = new Set(prog.filter(p => p.is_cleared).map(p => p.npc_id));
  });

  const table = document.createElement('table');

  // Header row: 학생명 + region names
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const thName = document.createElement('th');
  thName.textContent = '학생';
  headerRow.appendChild(thName);
  regions.forEach(region => {
    const th = document.createElement('th');
    th.textContent = region.name;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Body rows: one per student
  const tbody = document.createElement('tbody');
  students.forEach(s => {
    const tr = document.createElement('tr');
    tr.dataset.studentId = s.id;

    const tdName = document.createElement('td');
    tdName.textContent = s.name;
    tr.appendChild(tdName);

    regions.forEach(region => {
      const td = document.createElement('td');
      // Each region has npcs — check if all are cleared or some or none
      const regionNpcIds = (region.npcs || []).map(n => n.id);
      if (regionNpcIds.length === 0) {
        td.textContent = '–';
        td.className = 'status-none';
      } else {
        const clearedCount = regionNpcIds.filter(id => clearedMap[s.id].has(id)).length;
        if (clearedCount === regionNpcIds.length) {
          td.textContent = '완료';
          td.className = 'status-done';
        } else if (clearedCount > 0) {
          td.textContent = `${clearedCount}/${regionNpcIds.length}`;
          td.className = 'status-progress';
        } else {
          td.textContent = '미완';
          td.className = 'status-none';
        }
      }
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  container.innerHTML = '';
  container.appendChild(table);
}

function renderStats(students, regions, progressByStudent) {
  const panel = document.getElementById('stats-panel');

  const totalStudents = students.length;
  let totalNpcs = 0;
  regions.forEach(r => { totalNpcs += (r.npcs || []).length; });

  let totalCleared = 0;
  students.forEach(s => {
    const prog = progressByStudent[s.id] || [];
    totalCleared += prog.filter(p => p.is_cleared).length;
  });

  const completionRate = totalStudents > 0 && totalNpcs > 0
    ? Math.round((totalCleared / (totalStudents * totalNpcs)) * 100)
    : 0;

  panel.innerHTML = `
    <div class="stat-card">
      <div class="stat-value">${totalStudents}</div>
      <div class="stat-label">전체 학생</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${regions.length}</div>
      <div class="stat-label">전체 지역</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${completionRate}%</div>
      <div class="stat-label">전체 완료율</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${totalCleared}</div>
      <div class="stat-label">NPC 클리어 수</div>
    </div>
  `;
}

// ── WebSocket ─────────────────────────────────────────────────────────────────

function connectWebSocket(classId) {
  if (ws) {
    ws.close();
    ws = null;
  }
  const url = `ws://${window.location.host}/ws/dashboard`;
  ws = new WebSocket(url);

  ws.addEventListener('open', () => {
    ws.send(JSON.stringify({ type: 'register', class_id: classId }));
  });

  ws.addEventListener('message', (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === 'quiz_correct' || msg.type === 'quiz_wrong') {
        // Flash the student row in the grid
        const row = document.querySelector(`tr[data-student-id="${msg.student_id}"]`);
        if (row) {
          row.classList.remove('flash');
          void row.offsetWidth; // force reflow
          row.classList.add('flash');
        }
        // Refresh progress grid
        loadProgress();
      }
    } catch {}
  });

  ws.addEventListener('close', () => {
    // Attempt reconnect after 5 seconds
    setTimeout(() => {
      if (currentClassId) connectWebSocket(currentClassId);
    }, 5000);
  });
}

// ── Student Management ────────────────────────────────────────────────────────

async function loadStudents() {
  if (!currentClassId) return;
  const res = await fetch(`/api/classes/${currentClassId}/students`, { headers: authHeaders() });
  const students = await res.json();
  if (!res.ok) return;

  const container = document.getElementById('student-list');
  if (!students.length) {
    container.innerHTML = '<p style="color:#888">등록된 학생이 없습니다.</p>';
    return;
  }

  container.innerHTML = `
    <h3>등록된 학생 (${students.length}명)</h3>
    <ul>
      ${students.map(s => `<li>${s.name}</li>`).join('')}
    </ul>
  `;
}

async function bulkAddStudents(names) {
  const res = await fetch(`/api/classes/${currentClassId}/students/bulk`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ names }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '등록 실패');
  return data;
}

// ── Event Listeners ───────────────────────────────────────────────────────────

document.getElementById('btn-login').addEventListener('click', async () => {
  clearError('login-error');
  const login_id = document.getElementById('login-id').value.trim();
  const password = document.getElementById('login-password').value;
  if (!login_id || !password) {
    showError('login-error', '아이디와 비밀번호를 입력하세요.');
    return;
  }
  try {
    const data = await apiLogin(login_id, password);
    setToken(data.token);
    await enterDashboard();
  } catch (e) {
    showError('login-error', e.message);
  }
});

document.getElementById('btn-register').addEventListener('click', async () => {
  clearError('login-error');
  const login_id = document.getElementById('login-id').value.trim();
  const password = document.getElementById('login-password').value;
  if (!login_id || !password) {
    showError('login-error', '아이디와 비밀번호를 입력하세요.');
    return;
  }
  try {
    const data = await apiRegister(login_id, password);
    setToken(data.token);
    await enterDashboard();
  } catch (e) {
    showError('login-error', e.message);
  }
});

document.getElementById('btn-logout').addEventListener('click', () => {
  token = null;
  currentClassId = null;
  sessionStorage.removeItem('teacher_token');
  if (ws) { ws.close(); ws = null; }
  showView('login-view');
});

document.getElementById('class-select').addEventListener('change', (e) => {
  currentClassId = parseInt(e.target.value);
  connectWebSocket(currentClassId);
  loadProgress();
});

document.getElementById('btn-manage').addEventListener('click', () => {
  loadStudents();
  showView('manage-view');
});

document.getElementById('btn-back').addEventListener('click', () => {
  showView('dashboard-view');
});

document.getElementById('btn-bulk-add').addEventListener('click', async () => {
  clearError('bulk-error');
  const textarea = document.getElementById('bulk-names');
  const names = textarea.value
    .split('\n')
    .map(n => n.trim())
    .filter(n => n.length > 0);
  if (names.length === 0) {
    showError('bulk-error', '학생 이름을 입력하세요.');
    return;
  }
  try {
    await bulkAddStudents(names);
    textarea.value = '';
    await loadStudents();
  } catch (e) {
    showError('bulk-error', e.message);
  }
});

// ── Dashboard entry ───────────────────────────────────────────────────────────

async function enterDashboard() {
  const classes = await loadClasses();
  await populateClassSelect(classes);
  showView('dashboard-view');
  if (currentClassId) {
    connectWebSocket(currentClassId);
    await loadProgress();
  }
}

// ── Auto-login from session ───────────────────────────────────────────────────

(async () => {
  const saved = sessionStorage.getItem('teacher_token');
  if (saved) {
    token = saved;
    try {
      await enterDashboard();
      return;
    } catch {
      token = null;
      sessionStorage.removeItem('teacher_token');
    }
  }
  showView('login-view');
})();
