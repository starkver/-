let currentFiles = [];

async function loadFileList() {
  const res = await fetch("notes/" + encodeURIComponent(filename));
  const files = await res.json();
  currentFiles = files;

  const list = document.getElementById("file-list");
  list.innerHTML = "";

  files.forEach(file => {
    const li = document.createElement("li");
    li.textContent = file.replace(".md", "");
    li.onclick = () => {
      loadNote(file);
      toggleSidebar(false);
    };
    list.appendChild(li);
  });

  if (window.MathJax) MathJax.typesetPromise();
}

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
  const res = await fetch("notes/" + encodeURIComponent(filename)); // ← ключевое изменение
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
}
