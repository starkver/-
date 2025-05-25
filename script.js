/* ====== настройка ====== */
const NOTES_DIR  = 'notes/';            // папка с *.md
const CONTENT_ID = 'note-content';      // куда рендерим разметку

/* ================== РОУТЕР ================== */
window.addEventListener('hashchange', handleHash);
document.addEventListener('DOMContentLoaded', () => {
  bindSidebar();          // кнопка‑гамбургер и оверлей
  bindMenuLinks();        // ссылки на заметки в сайдбаре
  handleHash();           // «глубокая» ссылка, если есть
});

function handleHash() {
  const raw = decodeURIComponent(location.hash.slice(1));
  if (!raw) return; // открыта «Заглавная»
  const [file, anchor] = raw.split(':');
  if (file && file.endsWith('.md')) loadNote(file, anchor);
}

/* ================= ЗАГРУЗКА MD ================= */
async function loadNote(file, anchor = '') {
  try {
    const res = await fetch(`${NOTES_DIR}${file}`);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

    const md      = await res.text();
    const parsed  = marked.parse(md);
    const html    = injectAnchors(parsed, file);

    const box = document.getElementById(CONTENT_ID);
    box.innerHTML = html;

    if (window.MathJax) await MathJax.typesetPromise();

    if (anchor) {
      document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' });
    }

    const expected = file + (anchor ? ':' + anchor : '');
    if (location.hash.slice(1) !== expected) {
      history.replaceState(null, '', `#${encodeURIComponent(expected)}`);
    }
  } catch (err) {
    console.error('Ошибка загрузки Markdown:', err);
  }
}

/* ============ ВСПОМОГАТЕЛЬНЫЕ ============ */
function slug(text) {
  return text.toLowerCase()
             .trim()
             .replace(/[^a-zа-я0-9]+/gi, '-')
             .replace(/^-+|-+$/g, '');
}

function injectAnchors(html, currentFile) {
  // 1) добавляем id ко всем <h1>…<h6>
  html = html.replace(/<h(\d)>([\s\S]*?)<\/h\1>/g, (_, level, txt) => {
    const id = slug(txt);
    return `<h${level} id="${id}">${txt}</h${level}>`;
  });

  // 2) превращаем [[#Подзаголовок]] → ссылку с хэшем
  html = html.replace(/\[\[#([^\]]+?)\]\]/g, (_, raw) => {
    const id = slug(raw);
    const hash = encodeURIComponent(`${currentFile}:${id}`);
    return `<a href="#${hash}">[[#${raw}]]</a>`;
  });

  return html;
}

/* ============== САЙДБАР ============== */
function bindSidebar() {
  const toggle  = document.querySelector('.menu-toggle');
  const overlay = document.getElementById('overlay');
  toggle.addEventListener('click', () => toggleSidebar());
  overlay.addEventListener('click', () => toggleSidebar(false));
}

function bindMenuLinks() {
  document.querySelectorAll('.load-md').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const file = link.dataset.file?.split('/').pop();
      if (!file) return;
      loadNote(file);
      toggleSidebar(false);
    });
  });
}

function toggleSidebar(force = null) {
  const sidebar = document.getElementById('mobile-sidebar');
  const overlay = document.getElementById('overlay');
  const isOpen  = sidebar.classList.contains('open');
  const open    = force === null ? !isOpen : force;
  sidebar.classList.toggle('open',   open);
  overlay.classList.toggle('active', open);
}
