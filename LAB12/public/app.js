const loginCard = document.querySelector('#loginCard');
const dashboard = document.querySelector('#dashboard');
const form = document.querySelector('#loginForm');
const statusLine = document.querySelector('#status');
const roleNames = { student: 'Студент', teacher: 'Преподаватель', admin: 'Администратор' };

function showStatus(message, kind = '') {
  statusLine.textContent = message;
  statusLine.className = `status ${kind}`;
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error || 'Запрос не выполнен.');
    error.status = response.status;
    throw error;
  }
  return data;
}

function renderUser(user) {
  loginCard.hidden = Boolean(user);
  dashboard.hidden = !user;
  if (!user) return;
  document.querySelector('#profileName').textContent = user.displayName;
  document.querySelector('#profileMeta').textContent = `${user.username} · ${roleNames[user.role] || user.role}`;
  document.querySelector('#studentPanel').hidden = user.role !== 'student';
  document.querySelector('#teacherPanel').hidden = user.role !== 'teacher';
  document.querySelector('#adminPanel').hidden = user.role !== 'admin';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  showStatus('');
  const formData = new FormData(form);
  try {
    const result = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: formData.get('username'), password: formData.get('password') })
    });
    form.reset();
    renderUser(result.user);
    showStatus(result.message, 'success');
  } catch (error) {
    showStatus(error.message, 'error');
  }
});

document.querySelector('#logoutButton').addEventListener('click', async () => {
  try {
    const result = await request('/api/auth/logout', { method: 'POST', body: '{}' });
    renderUser(null);
    showStatus(result.message, 'success');
  } catch (error) {
    showStatus(error.message, 'error');
  }
});

document.querySelectorAll('[data-load]').forEach((button) => {
  button.addEventListener('click', async () => {
    const resultBox = document.querySelector('#adminResult');
    try {
      switch (button.dataset.load) {
        case 'student': {
          const result = await request('/api/student/lessons');
          const list = document.querySelector('#studentLessons');
          list.replaceChildren(...result.lessons.map((lesson) => {
            const item = document.createElement('li');
            item.textContent = lesson;
            return item;
          }));
          showStatus('Защищенный список занятий загружен.', 'success');
          break;
        }
        case 'teacher': {
          const result = await request('/api/teacher/summary');
          document.querySelector('#teacherSummary').textContent = `${result.summary} Активных курсов: ${result.activeCourses}.`;
          showStatus('Сводка загружена.', 'success');
          break;
        }
        case 'users': {
          const result = await request('/api/admin/users');
          resultBox.textContent = `Пользователи: ${result.users.map((user) => `${user.username} (${roleNames[user.role]})`).join(', ')}`;
          showStatus('Список получен из защищенного API.', 'success');
          break;
        }
        case 'audit': {
          const result = await request('/api/admin/audit');
          resultBox.textContent = result.events.length
            ? result.events.map((event) => `${new Date(event.at).toLocaleString('ru-RU')} — ${event.username}: ${event.action}`).join('\n')
            : 'Событий пока нет.';
          resultBox.style.whiteSpace = 'pre-line';
          showStatus('Журнал событий загружен.', 'success');
          break;
        }
      }
    } catch (error) {
      showStatus(error.status === 401 ? 'Сессия завершена. Войдите снова.' : error.message, 'error');
      if (error.status === 401) renderUser(null);
    }
  });
});

request('/api/auth/me')
  .then(({ user }) => renderUser(user))
  .catch(() => showStatus('Не удалось проверить сессию.', 'error'));
