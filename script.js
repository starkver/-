/* ===== НАСТРОЙКА ===== */
const NOTES_DIR   = 'notes/';          // папка с *.md и index.json
const JSON_INDEX  = 'index.json';      // список файлов
const CONTENT_ID  = 'note-content';
const SIDEBAR_ID  = 'mobile-sidebar';
const FILE_LIST_ID = 'file-list';

/* =========== ИНИЦИАЛИЗАЦИЯ =========== */
window.addEventListener('hashchange', handleHash);
document.addEventListener('DOMContentLoaded', async () => {
  // 1. СРАЗУ вешаем обработчики меню, чтобы гамбургер жил даже при ошибках
  bindSidebar();

  // 2. Пробуем подтянуть список файлов — если не выйдет, просто покажем оболочку
  try {
    await loadFileList();
  } catch (err) {
    console.error('loadFileList() сломался:', err);
  }

  // 3. Открываем ссылку из адресной строки (если есть)
  handleHash();
});

/* ========= РОУТЕР (#hash) ========= */
function handleHash() {
  const raw = decodeURIComponent(location.hash.slice(1));
  if (!raw) return; // "Заглавная"

  const [file, anchor] = raw.split(':');
  if (!file.endsWith('.md')) return;

  loadNote(file, anchor);
  toggleSidebar(false); // закрываем меню после перехода
}

/* ======== ЗАГРУЗКА MD ======== */
async function loadNote(file, anchor = '') {
  try {
    const res = await fetch(`${NOTES_DIR}${file}`);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

    const md   = await res.text();
    const html = injectAnchors(marked.parse(md), file);

    const box = document.getElementById(CONTENT_ID);
    box.innerHTML = html;

    if (window.MathJax) await MathJax.typesetPromise();
    if (anchor) document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    console.error('Ошибка загрузки Markdown:', err);
  }
}

/* ====== СТРОИМ СПИСОК ФАЙЛОВ ====== */
async function loadFileList() {
  try {
    const res = await fetch(`${NOTES_DIR}${JSON_INDEX}`);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

    const files = await res.json(); // массив имён *.md
    const ul = document.getElementById(FILE_LIST_ID);
    ul.innerHTML = '';

    files.forEach(name => {
      const li   = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#${encodeURIComponent(name)}`;
      link.textContent = name.replace(/\.md$/i, '');
      link.className = 'load-md';
      link.dataset.file = name;
      li.appendChild(link);
      ul.appendChild(li);
    });
  } catch (err) {
    console.error('Не удалось получить список файлов:', err);
  }
}

/* ===== ВСПОМОГАТЕЛЬНЫЕ ===== */
function slug(text) {
  return text.toLowerCase().trim().replace(/[^a-zа-я0-9]+/gi, '-').replace(/^-+|-+$/g, '');
}

function injectAnchors(html, currentFile) {
  html = html.replace(/<h(\d)>([\s\S]*?)<\/h\1>/g, (_, lvl, txt) => {
    const id = slug(txt);
    return `<h${lvl} id="${id}">${txt}</h${lvl}>`;
  });

  html = html.replace(/\[\[#([^\]]+?)\]\]/g, (_, raw) => {
    const id = slug(raw);
    const hash = encodeURIComponent(`${currentFile}:${id}`);
    return `<a href='#${hash}'>[[#${raw}]]</a>`;
  });

  return html;
}

/* =========== САЙДБАР =========== */
function bindSidebar() {
  const sidebar = document.getElementById(SIDEBAR_ID);
  const overlay = document.getElementById('overlay');
  document.querySelector('.menu-toggle').addEventListener('click', () => toggleSidebar());
  overlay.addEventListener('click', () => toggleSidebar(false));

  // делегируем клики внутри боковой панели
  sidebar.addEventListener('click', e => {
    if (e.target.classList.contains('load-md')) {
      e.preventDefault();
      const file = e.target.dataset.file;
      loadNote(file);
      toggleSidebar(false);
    }
  });
}

function toggleSidebar(force = null) {
  const sidebar = document.getElementById(SIDEBAR_ID);
  const overlay = document.getElementById('overlay');
  const open = force === null ? !sidebar.classList.contains('open') : force;
  sidebar.classList.toggle('open', open);
  overlay.classList.toggle('active', open);
}
