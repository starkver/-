/* ====== настройка ====== */
const NOTES_DIR  = 'notes/';            // где лежат *.md
const CONTENT_ID = 'note-content';      // id контейнера для разметки

/* ================= РОУТЕР ================= */
window.addEventListener('hashchange', handleHash);
document.addEventListener('DOMContentLoaded', () => {
  bindMenuControls();      // гамбургер + оверлей
  bindMenuLinks();         // ссылки на *.md
  handleHash();            // открыть то, что уже в адресной строке
});

function handleHash() {
  const hash = decodeURIComponent(location.hash.slice(1));
  if (!hash) return;                  // «Заглавная»

  const [file, anchor] = hash.split(':');
  if (!file || !file.endsWith('.md')) return; // не MD — игнорируем

  loadNote(file, anchor);
}

/* ================= ЗАГРУЗКА MD ================= */
async function loadNote(filename, anchor = '') {
  try {
    const res = await fetch(NOTES_DIR + filename);
    if (!res.ok) throw new Error(res.statusText);

    const mdText  = await res.text();
    const htmlRaw = marked.parse(mdText);
    const html    = generateAnchorsAndLinks(htmlRaw, filename);

    const box = document.getElementById(CONTENT_ID);
    box.innerHTML = html;

    if (window.MathJax) await MathJax.typesetPromise();

    if (anchor) {
      document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' });
    }

    const expected = filename + (anchor ? ':' + anchor : '');
    if (location.hash.slice(1) !== expected) {
      history.pushState(null, '', '#' + encodeURIComponent(expected));
    }
  } catch (err) {
    console.error('Ошибка загрузки', filename, err);
  }
}

/* ===== УТИЛИТЫ ===== */
function toAnchor(text) {
  return text.toLowerCase()
             .replace(/[^a-zа-я0-9]+/gi, '-')
             .replace(/^-+|-+$/g, '');
}

function generateAnchorsAndLinks(html, currentFile) {
  // 1) присваиваем id всем <h1>…<h6>
  html = html.replace(/<h(\\d)>([\\s\\S]*?)<\\/h\\1>/g, (m, lvl, txt) =>
    <h${lvl} id="${toAnchor(txt)}">${txt}</h${lvl}>
  );

  // 2) [[#подзаголовок]] → ссылка
  html = html.replace(/\\[\\[#([^\\]]+?)]]/g, (m, raw) => {
    const anchor = toAnchor(raw);
    const hash   = encodeURIComponent(`${currentFile}:${anchor}`);
    return <a href="#${hash}">[[#${raw}]]</a>;
  });

  return html;
}

/* ================= МЕНЮ ================= */
function bindMenuControls() {
  document.querySelector('.menu-toggle')
          .addEventListener('click', () => toggleSidebar());
  document.getElementById('overlay')
          .addEventListener('click', () => toggleSidebar(false));
}

function bindMenuLinks() {
  document.querySelectorAll('.load-md').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const file = a.dataset.file?.split('/').pop();
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
