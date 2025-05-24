let currentFiles = [];

function toAnchor(text) {
  return text.toLowerCase()
    .replace(/[^a-zа-я0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function generateAnchorsAndLinks(html, currentFile) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Добавляем id для заголовков
  doc.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach(heading => {
    const anchor = toAnchor(heading.textContent);
    heading.id = anchor;
  });

  // Обработка [[#якорь]]
  doc.body.innerHTML = doc.body.innerHTML.replace(/\[\[#([^\]]+)\]\]/g, (match, linkText) => {
    const anchor = toAnchor(linkText);
    return `<a href="#${anchor}" onclick="loadNote('${currentFile}', '${anchor}')">[[#${linkText}]]</a>`;
  });

  return doc.body.innerHTML;
}

async function loadNote(filename, anchor = "") {
  try {
    const res = await fetch(filename);
    if (!res.ok) throw new Error(`Ошибка загрузки файла: ${res.status}`);
    
    const text = await res.text();
    const html = marked.parse(text);
    const processed = generateAnchorsAndLinks(html, filename);

    const container = document.getElementById("note-content");
    container.innerHTML = processed;

    if (window.MathJax) MathJax.typesetPromise();

    if (anchor) {
      setTimeout(() => {
        const target = document.getElementById(anchor);
        if (target) {
          target.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  } catch (error) {
    console.error("Ошибка загрузки заметки:", error);
  }
}

function toggleSidebar(force = null) {
  const sidebar = document.querySelector(".mobile-sidebar");
  const overlay = document.querySelector(".overlay");
  const isOpen = sidebar.classList.contains("open");
  const shouldOpen = force === null ? !isOpen : force;

  sidebar.classList.toggle("open", shouldOpen);
  overlay.classList.toggle("active", shouldOpen);
}

window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".load-md").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const file = e.target.dataset.file;
      if (file) {
        loadNote(file);
        toggleSidebar(false);
      }
    });
  });

  document.querySelector(".menu-toggle").addEventListener("click", () => toggleSidebar());
  document.querySelector(".overlay").addEventListener("click", () => toggleSidebar(false));
});
