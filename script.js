/* ====== настройка ====== */
const NOTES_DIR  = 'notes/';            // где лежат *.md
const CONTENT_ID = 'note-content';      // id контейнера для разметки

/* ================= РОУТЕР ================= */
// открываем заметку, когда меняется #hash
window.addEventListener('hashchange', handleHash);
// и при первой загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  bindMenuControls();       // клики по гамбургер‑кнопке и оверлею
  bindMenuLinks();          // клики по <a class="load-md">
  handleHash();             // что открыть прямо сейчас
});

function handleHash() {
  const hash = decodeURIComponent(location.hash.slice(1));
  if (!hash) return; // "Заглавная" страница

  const [file, anchor] = hash.split(':');
  if (!file.endsWith('.md')) return;

  loadNote(file, anchor);
}

/* ================= ЗАГРУЗКА MD ================= */
async function loadNote(filename, anchor = '') {
  try {
    const mdText  = await (await fetch(NOTES_DIR + filename)).text();
    const htmlRaw = marked.parse(mdText);
    const html    = generateAnchorsAndLinks(htmlRaw, filename);

    const box = document.getElementById(CONTENT_ID);
    box.innerHTML = html;

    // формулы
    if (window.MathJax) MathJax.typesetPromise();

    // прокрутка к подзаголовку, если задан
    if (anchor) {
      const target = document.getElementById(anchor);
      target?.scrollIntoView({ behavior: 'smooth' });
    }

    // синхронизируем адресную строку, если функция вызвана напрямую
    const expectedHash = filename + (anchor ? ':' + anchor : '');
    if (location.hash.slice(1) !== expectedHash) {
      history.pushState(null, '', '#' + encodeURIComponent(expectedHash));
    }
  } catch (err) {
    console.error('Не удалось загрузить', filename, err);
  }
}

/* ===== вспомогательные функции ===== */
function toAnchor(text) {
  return text.toLowerCase()
             .replace(/[^a-zа-я0-9]+/gi, '-')
             .replace(/^-+|-+$/g, '');
}

function generateAnchorsAndLinks(html, currentFile) {
  // 1) даём id всем заголовкам
  html = html.replace(/<h(\d)>(.*?)<\/h\1>/g, (m, lvl, txt) =>
    <h${lvl} id="${toAnchor(txt)}">${txt}</h${lvl}>
  );

  // 2) превращаем [[#подзаголовок]] в ссылку
  html = html.replace(/\[\[#([^\]]+?)]]/g, (m, raw) => {
    const anchor = toAnchor(raw);
    const hash   = encodeURIComponent(currentFile + ':' + anchor);
    return <a href="#${hash}">[[#${raw}]]</a>;
  });

  return html;
}

/* ================= МЕНЮ И ОВЕРЛЕЙ ================= */
function bindMenuControls() {
  const toggleBtn = document.querySelector('.menu-toggle');
  const overlay   = document.getElementById('overlay');

  toggleBtn.addEventListener('click', () => toggleSidebar());
  overlay  .addEventListener('click', () => toggleSidebar(false));
}

function bindMenuLinks() {
  // все ссылки, у которых есть data-file
  document.querySelectorAll('.load-md').forEach(a => {
    a.addEventListener('click', evt => {
      evt.preventDefault();
      const file = a.dataset.file?.split('/').pop(); // берём имя.md
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

  const shouldOpen = force === null ? !isOpen : force;
  sidebar.classList.toggle('open',   shouldOpen);
  overlay.classList.toggle('active', shouldOpen);
