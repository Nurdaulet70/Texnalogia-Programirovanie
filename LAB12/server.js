const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET;
const SESSION_DURATION_MS = 15 * 60 * 1000;

if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
  console.error('Укажите SESSION_SECRET длиной не менее 32 символов.');
  process.exit(1);
}

app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(session({
  name: 'lab12.sid',
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_DURATION_MS
  }
}));

// Только демонстрационные учетные записи. Для реального приложения используйте БД,
// переменные окружения/секрет-хранилище и индивидуально заданные пароли.
const DEMO_ACCOUNTS = [
  { id: 1, username: 'student', displayName: 'Алия Студентова', role: 'student', password: 'Student123!' },
  { id: 2, username: 'teacher', displayName: 'Данияр Преподаватель', role: 'teacher', password: 'Teacher123!' },
  { id: 3, username: 'admin', displayName: 'Администратор', role: 'admin', password: 'Admin123!' }
];
let users = [];
const auditLog = [];

function recordEvent(action, username, req) {
  auditLog.unshift({
    action,
    username: username || 'неизвестный пользователь',
    at: new Date().toISOString(),
    // В учебном журнале сохраняется адрес запроса; не используйте его как надежную личность клиента.
    ip: req.ip
  });
  if (auditLog.length > 100) auditLog.length = 100;
}

function publicUser(user) {
  return { id: user.id, username: user.username, displayName: user.displayName, role: user.role };
}

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Требуется вход в систему.' });
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session.user) return res.status(401).json({ error: 'Требуется вход в систему.' });
    if (!roles.includes(req.session.user.role)) {
      return res.status(403).json({ error: 'Недостаточно прав для доступа к этому ресурсу.' });
    }
    next();
  };
}

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (!username || !password) return res.status(400).json({ error: 'Введите логин и пароль.' });

    const user = users.find((item) => item.username === username);
    const validPassword = user && await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      recordEvent('login_failed', username, req);
      return res.status(401).json({ error: 'Неверный логин или пароль.' });
    }

    // Новый идентификатор после входа снижает риск фиксации сессии.
    req.session.regenerate((error) => {
      if (error) return next(error);
      req.session.user = publicUser(user);
      req.session.save((saveError) => {
        if (saveError) return next(saveError);
        recordEvent('login_success', user.username, req);
        res.json({ message: 'Вход выполнен.', user: req.session.user });
      });
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/auth/me', (req, res) => {
  res.json({ user: req.session.user || null });
});

app.post('/api/auth/logout', (req, res, next) => {
  const username = req.session.user?.username;
  if (!username) return res.json({ message: 'Вы уже вышли из системы.' });
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie('lab12.sid', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    recordEvent('logout', username, req);
    res.json({ message: 'Выход выполнен, сессия закрыта.' });
  });
});

// Вариант базового уровня: приватный кабинет студента.
app.get('/api/student/lessons', requireRole('student'), (req, res) => {
  res.json({ lessons: ['Языки программирования', 'Основы веб-разработки', 'Алгоритмы'] });
});

// Вариант среднего уровня: проверка ролей на сервере.
app.get('/api/teacher/summary', requireRole('teacher'), (req, res) => {
  res.json({ summary: 'Доступ к кабинету преподавателя разрешен.', activeCourses: 3 });
});

// Вариант повышенного уровня: защищенные API управления пользователями и аудит событий.
app.get('/api/admin/users', requireRole('admin'), (req, res) => {
  res.json({ users: users.map(publicUser) });
});

app.get('/api/admin/audit', requireRole('admin'), (req, res) => {
  res.json({ events: auditLog });
});

app.use('/api', (req, res) => res.status(404).json({ error: 'API-маршрут не найден.' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  res.status(500).json({ error: 'Внутренняя ошибка сервера.' });
});

async function start() {
  users = await Promise.all(DEMO_ACCOUNTS.map(async (account) => ({
    ...account,
    passwordHash: await bcrypt.hash(account.password, 10)
  })));
  // Не держим исходные пароли в памяти после создания хешей.
  for (const user of users) delete user.password;
  app.listen(PORT, () => console.log(`LAB12 запущена: http://localhost:${PORT}`));
}

start().catch((error) => {
  console.error('Не удалось запустить сервер:', error);
  process.exit(1);
});
