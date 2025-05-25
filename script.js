function toAnchor(text) {
  return text.toLowerCase().replace(/[^a-zа-я0-9]+/gi, "-").replace(/^-+|-+$/g, "");
}

function generateAnchorsAndLinks(html, currentFile) {
  html = html.replace(/<h(\d)>(.*?)<\/h\d>/g, (match, tag, text) => {
    const anchor = toAnchor(text);
    return `<h${tag} id="${anchor}">${text}</h${tag}>`;
  });

  html = html.replace(/\[\[#([^\]]+)\]\]/g, (match, linkText) => {
    const anchorPart = toAnchor(linkText);
    return `<a href="#${anchorPart}" onclick="loadNote('${currentFile}', '${anchorPart}')">[[#${linkText}]]</a>`;
  });

  return html;
}

async function loadNote(filename, anchor = "") {
  const isExternal = filename.startsWith("http");

  try {
    const res = await fetch(filename);
    if (!res.ok) throw new Error("Файл не найден");

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

  } catch (err) {
    document.getElementById("note-content").innerHTML = `<p>Ошибка загрузки: ${err.message}</p>`;
  }
}

function toggleSidebar(force = null) {
  const sidebar = document.querySelector(".mobile-sidebar");
  const overlay = document.querySelector(".overlay");
  const isOpen = sidebar.classList.contains("open");
  const shouldOpen = force === null ? !isOpen : force;

  if (shouldOpen) {
    sidebar.classList.add("open");
    overlay.classList.add("active");
  } else {
    sidebar.classList.remove("open");
    overlay.classList.remove("active");
  }
}

window.onload = () => {
  // Гамбургер-меню
  document.querySelector(".menu-toggle").addEventListener("click", () => {
    toggleSidebar();
  });

  document.querySelector(".overlay").addEventListener("click", () => {
    toggleSidebar(false);
  });

  // Обработка ссылок .load-md
  document.querySelectorAll('.load-md').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const fileUrl = link.getAttribute('data-file');
      loadNote(fileUrl);
      toggleSidebar(false);
    });
  });
};
