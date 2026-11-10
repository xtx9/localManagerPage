// 파일명: docs/gitpage/script.js
(() => {
  'use strict';

  const manifestPath = './manifest.json';
  const siteTitleNode = document.getElementById('site-title');
  const currentTitleNode = document.getElementById('current-doc-title');
  const githubLinkNode = document.getElementById('github-link');
  const sidebarNode = document.getElementById('sidebar');
  const sidebarNavNode = document.getElementById('sidebar-nav');
  const sidebarToggleNode = document.getElementById('sidebar-toggle');
  const sidebarBackdropNode = document.getElementById('sidebar-backdrop');
  const contentNode = document.getElementById('content');
  const previousNode = document.getElementById('prev-btn');
  const nextNode = document.getElementById('next-btn');
  let manifest = null;
  let lastRouteHash = null;
  let renderSequence = 0;

  if (!siteTitleNode || !currentTitleNode || !githubLinkNode || !sidebarNode || !sidebarNavNode
    || !sidebarToggleNode || !sidebarBackdropNode || !contentNode || !previousNode || !nextNode) {
    return;
  }

  /**
   * 메뉴와 문서 파일 경로를 manifest 규격에 맞는지 검사한다.
   * @param {object} data manifest JSON 객체
   * @returns {void}
   */
  function validateManifest(data) {
    if (!data || typeof data.siteTitle !== 'string' || !data.siteTitle.trim() || !Array.isArray(data.menu) || data.menu.length === 0) {
      throw new Error('manifest.json의 사이트 이름 또는 메뉴가 올바르지 않습니다.');
    }

    let githubUrl;
    if (typeof data.githubUrl === 'string') {
      try {
        githubUrl = new URL(data.githubUrl);
      } catch {
        githubUrl = null;
      }
    }
    if (!githubUrl || githubUrl.protocol !== 'https:' || githubUrl.hostname !== 'github.com' || githubUrl.username || githubUrl.password) {
      throw new Error('manifest.json의 GitHub 주소가 올바르지 않습니다.');
    }

    const ids = new Set();
    data.menu.forEach((entry) => {
      const validId = typeof entry.id === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(entry.id);
      let decodedPath = '';
      try {
        decodedPath = decodeURIComponent(entry.path);
      } catch {
        decodedPath = '';
      }
      const validPath = typeof entry.path === 'string'
        && entry.path.startsWith('./')
        && !entry.path.includes('\\')
        && !decodedPath.includes('\\')
        && !/[?#]/.test(entry.path)
        && !/[?#]/.test(decodedPath)
        && decodedPath !== ''
        && decodedPath.split('/').slice(1).every((segment) => segment && segment !== '.' && segment !== '..')
        && /\.(md|html)$/i.test(entry.path);

      if (!validId || typeof entry.title !== 'string' || !entry.title.trim() || typeof entry.category !== 'string' || !entry.category.trim() || !validPath) {
        throw new Error('manifest.json의 메뉴 항목은 id, title, category와 상대 .md/.html 경로가 필요합니다.');
      }

      if (ids.has(entry.id)) {
        throw new Error(`manifest.json에 중복된 문서 ID가 있습니다: ${entry.id}`);
      }
      ids.add(entry.id);
    });
  }

  /**
   * manifest의 카테고리와 문서 항목으로 사이드바를 만든다.
   * @returns {void}
   */
  function renderSidebar() {
    const categoryNodes = new Map();

    manifest.menu.forEach((entry) => {
      let linksNode = categoryNodes.get(entry.category);
      if (!linksNode) {
        const categoryNode = document.createElement('section');
        categoryNode.className = 'nav-category';

        const headingNode = document.createElement('h2');
        headingNode.className = 'nav-category-title';
        headingNode.textContent = entry.category;

        linksNode = document.createElement('div');
        linksNode.className = 'nav-category-links';
        categoryNode.append(headingNode, linksNode);
        sidebarNavNode.append(categoryNode);
        categoryNodes.set(entry.category, linksNode);
      }

      const linkNode = document.createElement('a');
      linkNode.className = 'sidebar-link';
      linkNode.href = `#/${encodeURIComponent(entry.id)}`;
      linkNode.dataset.pageId = entry.id;
      linkNode.textContent = entry.title;
      linksNode.append(linkNode);
    });
  }

  /**
   * 현재 문서를 사이드바에서 강조한다.
   * @param {string} activeId 현재 문서 ID
   * @returns {void}
   */
  function updateActiveLink(activeId) {
    sidebarNavNode.querySelectorAll('[data-page-id]').forEach((linkNode) => {
      const isActive = linkNode.dataset.pageId === activeId;
      linkNode.classList.toggle('active', isActive);
      if (isActive) {
        linkNode.setAttribute('aria-current', 'page');
      } else {
        linkNode.removeAttribute('aria-current');
      }
    });
  }

  /**
   * 문서 제목과 브라우저 탭 제목을 동기화한다.
   * @param {string} title 현재 문서 제목
   * @returns {void}
   */
  function updateDocumentTitle(title) {
    currentTitleNode.textContent = title;
    document.title = manifest?.siteTitle ? `${title} | ${manifest.siteTitle}` : title;
  }

  /**
   * 문서 순서에 맞춰 하단 이전/다음 링크를 갱신한다.
   * @param {number} index 현재 문서의 메뉴 인덱스
   * @returns {void}
   */
  function updateFooterNavigation(index) {
    const previousEntry = manifest.menu[index - 1];
    const nextEntry = manifest.menu[index + 1];

    previousNode.hidden = !previousEntry;
    nextNode.hidden = !nextEntry;

    if (previousEntry) {
      previousNode.href = `#/${encodeURIComponent(previousEntry.id)}`;
      previousNode.textContent = `← ${previousEntry.title}`;
      previousNode.setAttribute('aria-label', `이전 문서: ${previousEntry.title}`);
    }

    if (nextEntry) {
      nextNode.href = `#/${encodeURIComponent(nextEntry.id)}`;
      nextNode.textContent = `${nextEntry.title} →`;
      nextNode.setAttribute('aria-label', `다음 문서: ${nextEntry.title}`);
    }
  }

  /**
   * 로딩 중임을 문서 본문에 표시한다.
   * @returns {void}
   */
  function showLoadingMessage() {
    const messageNode = document.createElement('p');
    messageNode.className = 'loading-message';
    messageNode.setAttribute('role', 'status');
    messageNode.textContent = '문서를 불러오는 중입니다.';
    contentNode.replaceChildren(messageNode);
  }

  /**
   * 본문 링크를 해시 라우트 또는 문서 내부 앵커로 정규화한다.
   * @param {Element} articleNode 렌더링 중인 문서 본문
   * @param {object} entry 현재 manifest 메뉴 항목
   * @returns {void}
   */
  function prepareDocumentLinks(articleNode, entry) {
    const sourceUrl = new URL(entry.path, window.location.href);
    const indexPath = new URL('./index.html', window.location.href).pathname;

    articleNode.addEventListener('click', (event) => {
      const linkNode = event.target.closest('a[href^="#"]:not([href^="#/"])');
      if (!linkNode) return;

      const anchorId = linkNode.getAttribute('href').slice(1);
      let decodedAnchorId;
      try {
        decodedAnchorId = decodeURIComponent(anchorId);
      } catch {
        return;
      }

      const anchorNode = Array.from(articleNode.querySelectorAll('[id]'))
        .find((candidate) => candidate.id === decodedAnchorId);
      if (!anchorNode) return;

      event.preventDefault();
      anchorNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    articleNode.querySelectorAll('a[href]').forEach((linkNode) => {
      const href = linkNode.getAttribute('href');
      if (!href || href.startsWith('#')) return;

      let destination;
      try {
        destination = new URL(href, sourceUrl);
      } catch {
        linkNode.removeAttribute('href');
        linkNode.setAttribute('aria-disabled', 'true');
        return;
      }

      if (destination.protocol === 'mailto:' || destination.protocol === 'tel:') return;

      if (destination.origin !== window.location.origin) {
        if (destination.protocol === 'https:' || destination.protocol === 'http:') {
          if (linkNode.target === '_blank') linkNode.rel = 'noopener noreferrer';
          return;
        }

        linkNode.removeAttribute('href');
        linkNode.setAttribute('aria-disabled', 'true');
        return;
      }

      const destinationPath = destination.pathname;
      const matchingEntry = manifest.menu.find((menuEntry) => (
        new URL(menuEntry.path, window.location.href).pathname === destinationPath
      ));

      if (matchingEntry) {
        linkNode.href = `#/${encodeURIComponent(matchingEntry.id)}${destination.hash}`;
      } else if (destinationPath === indexPath) {
        linkNode.href = `#/${encodeURIComponent(manifest.menu[0].id)}${destination.hash}`;
      } else {
        linkNode.removeAttribute('href');
        linkNode.setAttribute('aria-disabled', 'true');
      }
    });
  }

  /**
   * HTML 문서의 본문 조각을 Shadow DOM 안에 표시해 스타일 충돌을 막는다.
   * @param {string} source HTML 문서 원문
   * @param {object} entry manifest 메뉴 항목
   * @returns {void}
   */
  function renderHtmlDocument(source, entry) {
    const parsedDocument = new DOMParser().parseFromString(source, 'text/html');
    const sourceContent = parsedDocument.querySelector('.doc-content') || parsedDocument.body;
    const hostNode = document.createElement('div');
    hostNode.className = 'html-document-host';

    const shadowRoot = hostNode.attachShadow({ mode: 'open' });
    const stylesheetNode = document.createElement('link');
    stylesheetNode.rel = 'stylesheet';
    stylesheetNode.href = './styles.css';

    const styleNode = document.createElement('style');
    styleNode.textContent = `
      :host {
        --line: #e2e8f0;
        --primary: #2563eb;
        --primary-soft: #eff6ff;
        --ink: #0f172a;
        --muted: #64748b;
        display: block;
        color: var(--ink);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        line-height: 1.75;
      }
      :host, :host * { box-sizing: border-box; }
      .doc-content { width: 100%; margin: 0; padding: 0; }
      .doc-content h1 {
        margin: 0 0 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--line);
        font-size: 2rem;
        line-height: 1.25;
      }
      .doc-content h2 { margin: 2.5rem 0 1rem; font-size: 1.45rem; line-height: 1.35; }
      .doc-content a { color: var(--primary); }
      .doc-content blockquote {
        margin: 1.5rem 0;
        padding: 0.8rem 1rem;
        border-left: 4px solid var(--primary);
        background: var(--primary-soft);
      }
      .doc-content pre[class*="language-"] {
        max-width: 100%;
        overflow-x: auto;
        padding: 1rem 1.2rem;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #f1f5f9;
      }
      .doc-content table { display: block; width: 100%; overflow-x: auto; border-collapse: collapse; }
      .doc-content .doc-section {
        margin: 0;
        padding: 1.75rem 0;
        border: 0;
        border-top: 1px solid var(--line);
        border-radius: 0;
        background: transparent;
        box-shadow: none;
      }
    `;

    const articleNode = document.createElement('article');
    articleNode.className = 'doc-content';
    articleNode.innerHTML = sourceContent.innerHTML;
    prepareDocumentLinks(articleNode, entry);
    shadowRoot.append(stylesheetNode, styleNode, articleNode);
    contentNode.replaceChildren(hostNode);
  }

  /**
   * 문서 파일을 확장자에 따라 Markdown 또는 HTML로 렌더링한다.
   * @param {object} entry manifest 메뉴 항목
   * @param {number} sequence 오래된 요청의 화면 덮어쓰기를 막는 순번
   * @returns {Promise<void>}
   */
  async function loadDocument(entry, sequence) {
    try {
      const response = await fetch(entry.path);
      if (!response.ok) {
        throw new Error(`문서 파일 요청 실패: HTTP ${response.status}`);
      }

      const source = await response.text();
      if (sequence !== renderSequence) return;

      if (/\.md$/i.test(entry.path)) {
        if (!window.marked || typeof window.marked.parse !== 'function') {
          throw new Error('Markdown 파서를 불러오지 못했습니다.');
        }
        if (!window.Prism || typeof window.Prism.highlightAllUnder !== 'function') {
          throw new Error('코드 하이라이터를 불러오지 못했습니다.');
        }

        const articleNode = document.createElement('article');
        articleNode.className = 'markdown-document';
        articleNode.innerHTML = window.marked.parse(source);
        prepareDocumentLinks(articleNode, entry);
        contentNode.replaceChildren(articleNode);
        window.Prism.highlightAllUnder(contentNode);
      } else if (/\.html$/i.test(entry.path)) {
        renderHtmlDocument(source, entry);
      } else {
        throw new Error('지원하지 않는 문서 형식입니다.');
      }
    } catch (error) {
      if (sequence === renderSequence) {
        showDocumentError(error);
      }
    }
  }

  /**
   * 문서 로딩 실패를 본문에 명확한 오류 상태로 표시한다.
   * @param {Error} error 발생한 오류
   * @returns {void}
   */
  function showDocumentError(error) {
    console.error('문서를 불러오지 못했습니다.', error);
    updateDocumentTitle('문서를 찾을 수 없습니다');

    const messageNode = document.createElement('section');
    messageNode.className = 'error-message';
    messageNode.setAttribute('role', 'alert');

    const headingNode = document.createElement('h1');
    headingNode.textContent = '문서를 찾을 수 없습니다';

    const detailNode = document.createElement('p');
    detailNode.textContent = error.message || '문서 파일을 불러오지 못했습니다.';

    messageNode.append(headingNode, detailNode);
    contentNode.replaceChildren(messageNode);
  }

  /**
   * 메뉴 ID에 해당하는 문서를 본문과 탐색 UI에 반영한다.
   * @param {string} pageId 문서 ID
   * @returns {Promise<void>}
   */
  async function renderPage(pageId, fragment = '') {
    const index = manifest.menu.findIndex((entry) => entry.id === pageId);
    const entry = manifest.menu[index];

    if (!entry) {
      renderSequence += 1;
      updateActiveLink('');
      updateDocumentTitle('문서를 찾을 수 없습니다');
      previousNode.hidden = true;
      nextNode.hidden = true;
      showDocumentError(new Error(`등록되지 않은 문서 ID입니다: ${pageId}`));
      return;
    }

    renderSequence += 1;
    const sequence = renderSequence;
    updateActiveLink(entry.id);
    updateDocumentTitle(entry.title);
    updateFooterNavigation(index);
    showLoadingMessage();
    await loadDocument(entry, sequence);

    if (fragment && sequence === renderSequence) {
      let anchorId;
      try {
        anchorId = decodeURIComponent(fragment);
      } catch {
        return;
      }

      const shadowRoot = contentNode.querySelector('.html-document-host')?.shadowRoot;
      const documentRoot = shadowRoot || contentNode;
      const anchorNode = Array.from(documentRoot.querySelectorAll('[id]'))
        .find((candidate) => candidate.id === anchorId);
      anchorNode?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * 현재 해시를 문서 ID로 해석하고 필요한 문서를 표시한다.
   * @returns {void}
   */
  function routeFromHash() {
    if (!manifest || !window.location.hash.startsWith('#/') || window.location.hash === lastRouteHash) return;

    lastRouteHash = window.location.hash;
    const route = window.location.hash.match(/^#\/([^/?#]+)(?:#([^?]+))?/);
    const pageId = route ? route[1] : manifest.menu[0].id;
    renderPage(pageId, route?.[2] || '');
  }

  /**
   * 모바일 문서 메뉴를 닫고 접근성 상태를 원복한다.
   * @param {boolean} returnFocus 메뉴 버튼으로 포커스를 돌려보낼지 여부
   * @returns {void}
   */
  function closeSidebar(returnFocus) {
    sidebarNode.classList.remove('open');
    sidebarBackdropNode.hidden = true;
    sidebarToggleNode.setAttribute('aria-expanded', 'false');
    sidebarToggleNode.setAttribute('aria-label', '문서 메뉴 열기');
    document.body.classList.remove('drawer-open');
    const isMobile = window.matchMedia ? window.matchMedia('(max-width: 768px)').matches : window.innerWidth <= 768;
    sidebarNode.inert = isMobile;
    if (isMobile) {
      sidebarNode.setAttribute('aria-hidden', 'true');
    } else {
      sidebarNode.removeAttribute('aria-hidden');
    }
    if (returnFocus) sidebarToggleNode.focus();
  }

  /**
   * 모바일 메뉴 버튼으로 사이드바를 열거나 닫는다.
   * @returns {void}
   */
  function toggleSidebar() {
    const isOpen = sidebarNode.classList.toggle('open');
    sidebarBackdropNode.hidden = !isOpen;
    sidebarToggleNode.setAttribute('aria-expanded', String(isOpen));
    sidebarToggleNode.setAttribute('aria-label', isOpen ? '문서 메뉴 닫기' : '문서 메뉴 열기');
    document.body.classList.toggle('drawer-open', isOpen);
    sidebarNode.inert = !isOpen;
    sidebarNode.setAttribute('aria-hidden', String(!isOpen));
    if (isOpen) sidebarNavNode.querySelector('a')?.focus();
  }

  /**
   * 화면 크기가 바뀌면 데스크톱 메뉴와 모바일 Drawer의 접근성을 동기화한다.
   * @returns {void}
   */
  function synchronizeSidebarMode() {
    const isMobile = window.matchMedia ? window.matchMedia('(max-width: 768px)').matches : window.innerWidth <= 768;
    if (isMobile) {
      const isOpen = sidebarNode.classList.contains('open');
      sidebarNode.inert = !isOpen;
      sidebarNode.setAttribute('aria-hidden', String(!isOpen));
      return;
    }

    closeSidebar(false);
  }

  /**
   * manifest를 불러와 사이트 공통 정보와 문서 메뉴를 초기화한다.
   * @returns {Promise<void>}
   */
  async function initializeViewer() {
    try {
      const response = await fetch(manifestPath);
      if (!response.ok) {
        throw new Error(`문서 목록 요청 실패: HTTP ${response.status}`);
      }

      manifest = await response.json();
      validateManifest(manifest);

      siteTitleNode.textContent = manifest.siteTitle;
      siteTitleNode.href = `#/${encodeURIComponent(manifest.menu[0].id)}`;
      githubLinkNode.href = manifest.githubUrl;
      renderSidebar();

      if (!window.location.hash.startsWith('#/')) {
        window.location.hash = `/${encodeURIComponent(manifest.menu[0].id)}`;
      }
      routeFromHash();
    } catch (error) {
      console.error('문서 뷰어를 초기화하지 못했습니다.', error);
      contentNode.replaceChildren();
      showDocumentError(error);
    }
  }

  sidebarToggleNode.addEventListener('click', toggleSidebar);
  sidebarBackdropNode.addEventListener('click', () => closeSidebar(true));
  sidebarNavNode.addEventListener('click', (event) => {
    if (event.target.closest('a[data-page-id]')) {
      closeSidebar(false);
      const isMobile = window.matchMedia ? window.matchMedia('(max-width: 768px)').matches : window.innerWidth <= 768;
      if (isMobile) contentNode.focus();
    }
  });
  window.addEventListener('hashchange', routeFromHash);
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && sidebarNode.classList.contains('open')) {
      closeSidebar(true);
    }
  });
  window.addEventListener('resize', synchronizeSidebarMode);

  synchronizeSidebarMode();
  initializeViewer();
})();
