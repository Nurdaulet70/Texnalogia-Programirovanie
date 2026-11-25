import { useEffect, useMemo, useState } from 'react';

const assignments = [
  { id: 'basic', number: '01', level: 'Базовый', title: 'Счетчик лайков', caption: 'Props + локальное состояние' },
  { id: 'medium', number: '02', level: 'Средний', title: 'Список задач', caption: 'События и фильтрация' },
  { id: 'advanced', number: '03', level: 'Повышенный', title: 'Планировщик расходов', caption: 'Формы, категории и аналитика' },
];

function Badge({ children, tone = 'violet' }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="section-heading">
      <div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p className="muted">{description}</p></div>
      {action}
    </div>
  );
}

function LikeButton({ label, initialLikes = 128 }) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const toggleLike = () => {
    setLiked((current) => !current);
    setLikes((current) => current + (liked ? -1 : 1));
  };
  return (
    <div className="like-card">
      <div className="like-art" aria-hidden="true"><span>✦</span><span>♥</span><span>✧</span></div>
      <div className="like-copy"><Badge tone="pink">БАЗОВЫЙ · ВАРИАНТ 1</Badge><h3>{label}</h3><p>Передаем подпись через props, а счетчик лайков храним в state.</p></div>
      <button className={`like-button ${liked ? 'is-liked' : ''}`} onClick={toggleLike} aria-pressed={liked}>
        <span aria-hidden="true">{liked ? '♥' : '♡'}</span><strong>{likes}</strong><small>{liked ? 'Нравится' : 'Мне нравится'}</small>
      </button>
    </div>
  );
}

const initialTasks = [
  { id: 1, text: 'Разобраться с передачей props', done: true },
  { id: 2, text: 'Создать компонент списка задач', done: false },
  { id: 3, text: 'Проверить обновление state', done: false },
];

function TodoItem({ task, onToggle, onDelete }) {
  return (
    <li className={`todo-item ${task.done ? 'todo-item--done' : ''}`}>
      <button className="check-button" onClick={() => onToggle(task.id)} aria-label={task.done ? 'Вернуть задачу в работу' : 'Отметить выполненной'}>{task.done ? '✓' : ''}</button>
      <span>{task.text}</span>
      <button className="icon-button todo-delete" onClick={() => onDelete(task.id)} aria-label="Удалить задачу">×</button>
    </li>
  );
}

function TodoList() {
  const [tasks, setTasks] = useState(initialTasks);
  const [text, setText] = useState('');
  const [filter, setFilter] = useState('Все');
  const visibleTasks = tasks.filter((task) => filter === 'Все' || (filter === 'В работе' ? !task.done : task.done));
  const completed = tasks.filter((task) => task.done).length;

  function addTask(event) {
    event.preventDefault();
    const cleanText = text.trim();
    if (!cleanText) return;
    setTasks((current) => [...current, { id: Date.now(), text: cleanText, done: false }]);
    setText('');
  }

  return (
    <div className="panel todo-panel">
      <SectionHeading eyebrow="СРЕДНИЙ · ВАРИАНТ 8" title="Список задач" description="Добавляйте дела, отмечайте готовое и фильтруйте список." action={<div className="completion"><span>{completed}/{tasks.length}</span><small>готово</small></div>} />
      <form className="add-form" onSubmit={addTask}>
        <label className="sr-only" htmlFor="new-task">Новая задача</label>
        <input id="new-task" value={text} onChange={(event) => setText(event.target.value)} placeholder="Например, повторить useState…" maxLength={100} />
        <button className="button button--primary" type="submit">Добавить <span aria-hidden="true">＋</span></button>
      </form>
      <div className="filter-row" role="group" aria-label="Фильтр задач">
        {['Все', 'В работе', 'Выполнено'].map((item) => <button key={item} className={`filter-chip ${filter === item ? 'active' : ''}`} onClick={() => setFilter(item)}>{item}</button>)}
      </div>
      <ul className="todo-list">
        {visibleTasks.length ? visibleTasks.map((task) => <TodoItem key={task.id} task={task} onToggle={(id) => setTasks((current) => current.map((item) => item.id === id ? { ...item, done: !item.done } : item))} onDelete={(id) => setTasks((current) => current.filter((item) => item.id !== id))} />) : <li className="empty-state">Здесь пока пусто — добавьте задачу выше.</li>}
      </ul>
      <p className="component-note"><span className="dot dot--green" /> <b>Поток данных:</b> TodoList хранит массив задач в state и передает данные и обработчики компоненту TodoItem через props.</p>
    </div>
  );
}

const categories = ['Еда', 'Транспорт', 'Учёба', 'Другое'];
const starterExpenses = [
  { id: 1, title: 'Обед в кампусе', category: 'Еда', amount: 2400, date: '2026-11-24' },
  { id: 2, title: 'Проездной', category: 'Транспорт', amount: 4500, date: '2026-11-23' },
  { id: 3, title: 'Учебные материалы', category: 'Учёба', amount: 3200, date: '2026-11-21' },
];
const formatMoney = (value) => new Intl.NumberFormat('ru-RU').format(value);

function ExpenseForm({ onAdd }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  function submitExpense(event) {
    event.preventDefault();
    const numericAmount = Number(amount);
    if (!title.trim()) { setError('Введите название расхода.'); return; }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) { setError('Сумма должна быть больше нуля.'); return; }
    onAdd({ id: Date.now(), title: title.trim(), category, amount: numericAmount, date: new Date().toISOString().slice(0, 10) });
    setTitle(''); setAmount(''); setError('');
  }

  return (
    <form className="expense-form" onSubmit={submitExpense}>
      <div className="form-title"><span className="form-icon">＋</span><div><h3>Новый расход</h3><p>Запишите покупку, чтобы ничего не забыть</p></div></div>
      <label>Название<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Например, кофе" maxLength={60} /></label>
      <div className="form-grid">
        <label>Категория<select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Сумма, ₸<input type="number" min="1" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0" /></label>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button--primary button--wide" type="submit">Добавить расход <span aria-hidden="true">↗</span></button>
    </form>
  );
}

function ExpenseList({ expenses, onDelete }) {
  if (!expenses.length) return <div className="empty-expenses"><span>◇</span><b>Расходов пока нет</b><small>Добавьте первую запись в форме.</small></div>;
  return <ul className="expense-list">{expenses.map((expense) => (
    <li className="expense-item" key={expense.id}>
      <span className={`category-icon category-icon--${expense.category === 'Еда' ? 'food' : expense.category === 'Транспорт' ? 'transport' : expense.category === 'Учёба' ? 'study' : 'other'}`}>{expense.category === 'Еда' ? '◒' : expense.category === 'Транспорт' ? '↗' : expense.category === 'Учёба' ? '▤' : '✳'}</span>
      <span className="expense-detail"><b>{expense.title}</b><small>{expense.category} · {new Date(`${expense.date}T00:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</small></span>
      <strong className="expense-amount">−{formatMoney(expense.amount)} ₸</strong>
      <button className="icon-button expense-delete" onClick={() => onDelete(expense.id)} aria-label={`Удалить расход: ${expense.title}`}>×</button>
    </li>
  ))}</ul>;
}

function ExpensePlanner() {
  const [expenses, setExpenses] = useState(() => {
    try { const saved = localStorage.getItem('lab11-expenses'); return saved ? JSON.parse(saved) : starterExpenses; }
    catch { return starterExpenses; }
  });
  const [filter, setFilter] = useState('Все категории');
  useEffect(() => { localStorage.setItem('lab11-expenses', JSON.stringify(expenses)); }, [expenses]);
  const total = useMemo(() => expenses.reduce((sum, item) => sum + item.amount, 0), [expenses]);
  const visible = filter === 'Все категории' ? expenses : expenses.filter((item) => item.category === filter);
  const average = expenses.length ? Math.round(total / expenses.length) : 0;

  return (
    <div className="panel planner-panel">
      <SectionHeading eyebrow="ПОВЫШЕННЫЙ · ВАРИАНТ 16" title="Планировщик расходов" description="Управляйте покупками и следите за бюджетом." action={<Badge tone="green">СОХРАНЯЕТСЯ НА ЭТОМ УСТРОЙСТВЕ</Badge>} />
      <div className="summary-grid">
        <div className="summary-card summary-card--total"><span className="summary-label">Всего потрачено</span><strong>{formatMoney(total)} <small>₸</small></strong><span className="summary-foot">за все записи</span><span className="summary-decoration">₸</span></div>
        <div className="summary-card"><span className="summary-label">Покупок</span><strong>{expenses.length}</strong><span className="summary-foot">в списке расходов</span><span className="summary-icon">▤</span></div>
        <div className="summary-card"><span className="summary-label">Средний расход</span><strong>{formatMoney(average)} <small>₸</small></strong><span className="summary-foot">на одну покупку</span><span className="summary-icon">⌁</span></div>
      </div>
      <div className="planner-grid">
        <ExpenseForm onAdd={(expense) => setExpenses((current) => [expense, ...current])} />
        <section className="recent-card">
          <div className="recent-heading"><div><h3>Последние расходы</h3><p>{visible.length} {visible.length === 1 ? 'запись' : 'записей'}</p></div><label className="sr-only" htmlFor="expense-filter">Фильтр расходов</label><select id="expense-filter" className="compact-select" value={filter} onChange={(event) => setFilter(event.target.value)}><option>Все категории</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></div>
          <ExpenseList expenses={visible} onDelete={(id) => setExpenses((current) => current.filter((item) => item.id !== id))} />
          <p className="component-note"><span className="dot dot--green" /> Данные расходов сохраняются в <code>localStorage</code>.</p>
        </section>
      </div>
    </div>
  );
}

function App() {
  const [active, setActive] = useState('basic');
  const current = assignments.find((item) => item.id === active);
  return (
    <main className="app-shell">
      <header className="topbar"><a className="brand" href="#top" aria-label="LAB 11 — главная"><span className="brand-mark">L<span>11</span></span><span className="brand-name">LEARN<span>LAB</span></span></a><div className="topbar-right"><span className="course-name">Языки и технология программирования</span><span className="avatar" title="Лабораторная работа">11</span></div></header>
      <section className="hero" id="top"><div className="hero-copy"><div className="hero-kicker"><span className="live-dot" /> ПРАКТИЧЕСКАЯ РАБОТА <span className="kicker-divider">/</span> 2 АКАДЕМИЧЕСКИХ ЧАСА</div><h1>Компоненты,<br /><span>которые работают.</span></h1><p>Познакомьтесь с React на практике: передавайте данные через props, управляйте состоянием и создавайте интерфейсы, которые реагируют на каждое действие.</p><div className="hero-meta"><span><b>01</b> React + JavaScript</span><span><b>02</b> Props &amp; State</span><span><b>03</b> 3 уровня сложности</span></div></div><div className="hero-visual" aria-hidden="true"><div className="orbit orbit--one" /><div className="orbit orbit--two" /><div className="code-card"><span className="code-dots"><i /><i /><i /></span><span className="code-line code-muted">function <b>Counter</b>({'{ title }'}) {'{'}</span><span className="code-line"> &nbsp;const [count, setCount]</span><span className="code-line"> &nbsp;= <em>useState</em>(<strong>0</strong>);</span><span className="code-line code-muted"> &nbsp;return (</span><span className="code-line"> &nbsp; &nbsp;&lt;button <i>onClick</i>=&#123;...&#125;&gt;</span><span className="code-line"> &nbsp; &nbsp; &#123;title&#125; · &#123;count&#125;</span><span className="code-line code-muted"> &nbsp; &lt;/button&gt;</span><span className="code-line code-muted">); {'}'}</span><span className="code-cursor" /></div><div className="float-tag float-tag--props"><span>↗</span> props <small>передаем</small></div><div className="float-tag float-tag--state"><span>◉</span> state <small>обновляем</small></div><div className="visual-spark">✳</div></div></section>
      <section className="workspace">
        <div className="workspace-intro"><div><p className="eyebrow">ИНТЕРАКТИВНАЯ ПРАКТИКА</p><h2>Выберите задание</h2></div><p>Три уровня сложности — от первого клика до мини-приложения.</p></div>
        <nav className="assignment-tabs" aria-label="Выбор задания">{assignments.map((item) => <button key={item.id} className={`assignment-tab ${active === item.id ? 'selected' : ''}`} onClick={() => setActive(item.id)} aria-current={active === item.id ? 'page' : undefined}><span className="tab-number">{item.number}</span><span className="tab-copy"><b>{item.title}</b><small>{item.caption}</small></span><span className="tab-level">{item.level}</span><span className="tab-arrow">↗</span></button>)}</nav>
        <div className="active-label"><span className="active-indicator" /> Сейчас открыто: <b>{current.title}</b></div>
        {active === 'basic' && <div className="panel"><SectionHeading eyebrow="БАЗОВЫЙ · ВАРИАНТ 1" title="Счетчик лайков" description="Небольшой компонент — наглядный пример работы props и state." action={<Badge tone="pink">ПЕРВОЕ ЗАДАНИЕ</Badge>} /><LikeButton label="React-компоненты — это красиво" initialLikes={128} /><p className="component-note"><span className="dot dot--green" /> <b>Поток данных:</b> родитель передает <code>label</code> и <code>initialLikes</code> через props; LikeButton хранит лайки и свое состояние в useState.</p></div>}
        {active === 'medium' && <TodoList />}
        {active === 'advanced' && <ExpensePlanner />}
      </section>
      <section className="concept-strip"><div className="concept-item"><span className="concept-symbol concept-symbol--purple">P</span><div><b>Props — входные данные</b><small>Родитель передает, ребенок читает</small></div></div><span className="concept-plus">+</span><div className="concept-item"><span className="concept-symbol concept-symbol--green">S</span><div><b>State — память компонента</b><small>Меняется от действий пользователя</small></div></div><span className="concept-equals">=</span><div className="concept-result"><span>Живой интерфейс</span><b>Реагирует на вас <span>✦</span></b></div></section>
      <footer className="footer"><span>LAB 11 <i>·</i> React / JavaScript <i>·</i> 2026</span><span>Собрано с пониманием <b>♥</b></span></footer>
    </main>
  );
}

export default App;
