/**
 * Ebraheem Al-moqbily - Portfolio Script
 * Interactive features inspired by Braydon Coyer's "Blogfolio"
 */

document.addEventListener('DOMContentLoaded', () => {
  // --------------------------------------------------------------------------
  // 0. Language State & Bilingual Helpers (EN / AR)
  // --------------------------------------------------------------------------
  const i18nData = (window.PORTFOLIO_I18N && window.PORTFOLIO_I18N.ar) || null;
  let currentLang = localStorage.getItem('portfolio_lang') === 'ar' ? 'ar' : 'en';
  let statsCounted = false;

  const originalEn = { text: {}, html: {}, placeholders: {}, titles: {} };
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (!(key in originalEn.text)) originalEn.text[key] = el.textContent;
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    if (!(key in originalEn.html)) originalEn.html[key] = el.innerHTML;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (!(key in originalEn.placeholders)) originalEn.placeholders[key] = el.getAttribute('placeholder') || '';
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (!(key in originalEn.titles)) originalEn.titles[key] = el.getAttribute('title') || '';
  });

  function uiStr(key, enFallback) {
    if (currentLang === 'ar' && i18nData && i18nData.ui && key in i18nData.ui) {
      return i18nData.ui[key];
    }
    return enFallback;
  }

  function getStatSuffix(el) {
    if (currentLang === 'ar' && el.hasAttribute('data-suffix-ar')) {
      return el.getAttribute('data-suffix-ar') || '';
    }
    return el.getAttribute('data-suffix') || '';
  }
  // --------------------------------------------------------------------------
  // 1. Audio System (Synthesized Web Audio API - Zero External Audio Files)
  // --------------------------------------------------------------------------
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.muted = localStorage.getItem('sound_muted') === 'true';
      this.initButton();
    }

    getAudioContext() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    }

    playTone(freq = 440, type = 'sine', duration = 0.08, gainVal = 0.05) {
      if (this.muted) return;
      try {
        const ctx = this.getAudioContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(gainVal, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch (e) {
        // AudioContext not allowed before user gesture
      }
    }

    click() {
      this.playTone(600, 'sine', 0.05, 0.04);
    }

    pop() {
      this.playTone(850, 'triangle', 0.06, 0.05);
    }

    success() {
      if (this.muted) return;
      try {
        const ctx = this.getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, High C
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.07);
          gain.gain.setValueAtTime(0.04, now + idx * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.18);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.07);
          osc.stop(now + idx * 0.07 + 0.2);
        });
      } catch (e) { }
    }

    toggleMute() {
      this.muted = !this.muted;
      localStorage.setItem('sound_muted', this.muted);
      this.updateIcon();
      if (!this.muted) {
        this.pop();
        showToast(uiStr('soundOn', 'Sound effects enabled 🔊'));
      } else {
        showToast(uiStr('soundOff', 'Sound effects muted 🔇'));
      }
    }

    initButton() {
      const btn = document.getElementById('sound-toggle-btn');
      if (btn) {
        this.updateIcon();
        btn.addEventListener('click', () => this.toggleMute());
      }
    }

    updateIcon() {
      const btn = document.getElementById('sound-toggle-btn');
      if (!btn) return;
      if (this.muted) {
        btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`;
        btn.setAttribute('title', uiStr('soundTitleOff', 'Enable sound effects'));
      } else {
        btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
        btn.setAttribute('title', uiStr('soundTitleOn', 'Mute sound effects'));
      }
    }
  }

  const sfx = new SoundFX();

  // Attach sound to interactive buttons
  document.querySelectorAll('button, .nav-link, .filter-btn, .channel-btn, .article-card').forEach(el => {
    el.addEventListener('mouseenter', () => sfx.click());
  });

  // --------------------------------------------------------------------------
  // 2. Theme Toggle (Dark / Light Mode)
  // --------------------------------------------------------------------------
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const storedTheme = localStorage.getItem('portfolio_theme') || 'dark';

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('portfolio_theme', theme);
    if (themeToggleBtn) {
      if (theme === 'light') {
        themeToggleBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
        themeToggleBtn.setAttribute('title', uiStr('themeTitleDark', 'Switch to Dark Mode'));
      } else {
        themeToggleBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
        themeToggleBtn.setAttribute('title', uiStr('themeTitleLight', 'Switch to Light Mode'));
      }
    }
  }

  setTheme(storedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      sfx.pop();
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      setTheme(next);
      const toastMsg = next === 'dark'
        ? uiStr('themeDarkToast', 'Switched to Dark Mode ✨')
        : uiStr('themeLightToast', 'Switched to Light Mode ✨');
      showToast(toastMsg);
    });
  }

  // --------------------------------------------------------------------------
  // 3. Live Clock Widget (Local Time / AST UTC+3)
  // --------------------------------------------------------------------------
  const clockElement = document.getElementById('live-clock');
  function updateClock() {
    if (!clockElement) return;
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    clockElement.textContent = `${hours}:${minutes}:${seconds}`;
  }
  updateClock();
  setInterval(updateClock, 1000);

  // --------------------------------------------------------------------------
  // 4. Bento Grid Mouse Tracking Glow
  // --------------------------------------------------------------------------
  document.querySelectorAll('.bento-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  // --------------------------------------------------------------------------
  // 5. Interactive Photo Fan-Out & 3D Tilt
  // --------------------------------------------------------------------------
  const photoContainer = document.querySelector('.photo-stack-container');
  if (photoContainer) {
    const mainCard = photoContainer.querySelector('.card-main');
    photoContainer.addEventListener('mousemove', e => {
      const rect = photoContainer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -10;
      const rotateY = ((x - centerX) / centerX) * 10;
      if (mainCard) {
        mainCard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
      }
    });

    photoContainer.addEventListener('mouseleave', () => {
      if (mainCard) {
        mainCard.style.transform = 'rotate(-1.5deg) scale(0.98)';
      }
    });

    photoContainer.addEventListener('click', () => {
      sfx.pop();
      photoContainer.classList.toggle('fanned');
      showToast(uiStr('photoToast', 'Ebraheem Al-moqbily • Senior IT Graduate & Engineer 🎓'));
    });

    photoContainer.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        photoContainer.click();
      }
    });
  }

  // --------------------------------------------------------------------------
  // 6. Project Filter Functionality
  // --------------------------------------------------------------------------
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sfx.pop();
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');
      projectCards.forEach(card => {
        const categories = (card.getAttribute('data-category') || '').split(/\s+/);
        if (filter === 'all' || categories.includes(filter)) {
          card.style.display = 'flex';
          card.style.animation = 'fadeIn 0.3s ease-out';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // --------------------------------------------------------------------------
  // 7. Project Details Modal Data & Handlers
  // --------------------------------------------------------------------------
  const projectDetails = {
    'netscope': {
      title: 'NetScope - Real-Time Windows Network & Bandwidth Monitor',
      category: 'Desktop Systems & Network Telemetry',
      tags: ['Flutter Desktop', 'Python 3.11', 'WinSDK', 'FastAPI', 'SQLite WAL', 'WebView2'],
      summary: 'A lightweight, GlassWire-inspired Windows desktop application that monitors live download/upload speeds, daily and monthly bandwidth quotas, and exact per-application consumption using real kernel metrics with zero simulation.',
      problem: 'Built-in Windows network counters only report total adapter usage without attributing traffic per executable over flexible historical ranges, making it hard to identify hidden bandwidth drains.',
      solution: 'Engineered a decoupled Python monitoring service (NetScopeService) combining psutil, Windows.Networking.Connectivity (WinSDK), and live TCP/UDP socket attribution into SQLite WAL storage, streamed over FastAPI & WebSockets to a bilingual Flutter WebView2 interface.',
      features: [
        'Live download/upload speeds, Top 5 consuming apps, and 24-hour network activity charts',
        'Per-application TCP/UDP socket inspection with Windows FileVersionInfo & 32x32 icon caching',
        'Independent background service running in System Tray with optional native Windows Service registration',
        'Configurable daily/monthly MB quota alerts and first-seen application alerts',
        'Full English & Arabic (RTL/LTR) localization with Dark, Light, and System themes'
      ],
      github: 'https://github.com/ENG-Ebraheem/NetScope',
      demo: '#'
    },
    'doculearn-ai': {
      title: 'DocuLearn-AI - Smart Document Learning & Hybrid RAG Platform',
      category: 'AI & Hybrid RAG Systems (Clean Architecture / DDD)',
      tags: ['Python 3.10+', 'Streamlit', 'FAISS', 'Google Gemini', 'BM25', 'SQLite', 'Docker'],
      summary: 'An AI-powered educational document learning platform engineered with Clean Architecture and Domain-Driven Design (DDD) that transforms PDF, Word, Excel, and TXT materials into an active personalized study hub.',
      problem: 'Students reviewing dense Arabic and English course documents struggle with passive static files and generic AI chatbots that hallucinate answers instead of citing verified lecture pages.',
      solution: 'Developed a Hybrid RAG pipeline fusing SentenceTransformers + FAISS semantic retrieval with Arabic-normalized BM25 lexical search via Reciprocal Rank Fusion (RRF), backed by context-sufficiency checks and page citations.',
      features: [
        'Multi-format ingestion (PDF, DOCX, XLSX, TXT) with custom Arabic normalization & OCR health detection',
        'Hybrid RAG engine combining FAISS dense vectors, Arabic-optimized BM25, and RRF score fusion',
        'Hallucination-resistant Q&A strictly grounded in course sources with exact document & page citations',
        'AI Learning Engine generating multi-level summaries, key concepts, quizzes, and spaced-repetition flashcards',
        'Backed by 276 passing unit & integration tests with strict course and document isolation'
      ],
      github: 'https://github.com/ENG-Ebraheem/DocuLearn-AI',
      demo: '#'
    },
    'abu-ali-erp': {
      title: 'Abu-Ali ERP - Offline-First Accounting & Inventory System',
      category: 'Mobile Engineering & Enterprise ERP',
      tags: ['Flutter 3.24+', 'Dart 3.5+', 'SQLite (sqflite)', 'Clean Architecture', 'Arabic RTL PDF'],
      summary: 'A full-featured, offline-first accounting and inventory management ERP solution built with Flutter for small and medium enterprises, supporting multi-organization data isolation and financial statements.',
      problem: 'Businesses in regions with unstable internet need complete multi-tenant accounting, inventory costing, and Arabic RTL PDF invoicing without depending on constant cloud connectivity.',
      solution: 'Built a layered Clean Architecture Flutter application backed by an encrypted local SQLite database with schema migrations (V1 -> V4), automated double-entry balance checks, and a NotoNaskhArabic PDF generator.',
      features: [
        'Multi-organization tenancy with independent logos and complete financial data isolation',
        '4-level hierarchical Chart of Accounts, double-entry journals, and cash/bank vouchers',
        'Sales & purchase invoicing, multi-warehouse stock movements, and weighted-average inventory costing',
        'Trial Balance, General Ledger, Income Statement, Balance Sheet, and native Arabic PDF exports',
        'App lock, security recovery codes, encrypted database backup/restore, and 136 passing automated tests'
      ],
      github: 'https://github.com/ENG-Ebraheem/abu-ali-erp',
      demo: '#'
    },
    'hayy-community': {
      title: 'Hayy Community - Neighborly Mutual-Aid Platform',
      category: 'Full-Stack Mobile & REST API',
      tags: ['Flutter', 'Dart', 'Bloc / Cubit', 'Laravel 10 (PHP)', 'MySQL', 'Firebase Auth'],
      summary: 'A community solidarity mobile application (تطبيق حَيّ) designed to strengthen cooperation among local neighbors by matching everyday assistance requests with community volunteers.',
      problem: 'Local neighborhood members lack a structured, accountable platform to coordinate mutual-aid tasks such as deliveries, moving assistance, tutoring, or tool lending.',
      solution: 'Developed a Clean Architecture / MVVM Flutter client powered by Bloc/Cubit state management connected via Dio to a Laravel 10 + MySQL RESTful API with Firebase ID Token JWT verification middleware.',
      features: [
        'Publish categorized help requests and browse open neighborhood tasks with location details',
        'Structured task lifecycle (Open -> In Progress -> Completed -> Rated) with volunteer approval',
        'Mutual rating and review system alongside detailed user service statistics',
        'Secure Firebase Authentication verified server-side via Laravel FirebaseAuthMiddleware',
        'Clean Architecture modular frontend (Data, Domain, Presentation) with Bloc/Cubit state management'
      ],
      github: 'https://github.com/ENG-Ebraheem/hayy-community',
      demo: '#'
    }
  };

  const modalBackdrop = document.getElementById('project-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  let lastFocusedTrigger = null;

  function openProjectModal(projectId) {
    sfx.pop();
    const arProject = currentLang === 'ar' && i18nData && i18nData.projects ? i18nData.projects[projectId] : null;
    const data = arProject || projectDetails[projectId];
    if (!data || !modalBackdrop) return;

    lastFocusedTrigger = document.activeElement;
    document.getElementById('modal-title').textContent = data.title;
    document.getElementById('modal-category').textContent = data.category;
    document.getElementById('modal-summary').textContent = data.summary;
    document.getElementById('modal-problem').textContent = data.problem;
    document.getElementById('modal-solution').textContent = data.solution;

    const tagsContainer = document.getElementById('modal-tags');
    tagsContainer.innerHTML = '';
    data.tags.forEach(t => {
      const pill = document.createElement('span');
      pill.className = 'tech-pill';
      pill.textContent = t;
      tagsContainer.appendChild(pill);
    });

    const featuresList = document.getElementById('modal-features');
    featuresList.innerHTML = '';
    data.features.forEach(f => {
      const li = document.createElement('li');
      li.textContent = f;
      featuresList.appendChild(li);
    });

    const ghLink = document.getElementById('modal-github-link');
    if (ghLink) ghLink.href = data.github;

    modalBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (modalCloseBtn) modalCloseBtn.focus();
  }

  function closeModal() {
    sfx.click();
    if (modalBackdrop) modalBackdrop.classList.remove('active');
    const articleModalEl = document.getElementById('article-modal');
    if (articleModalEl) articleModalEl.classList.remove('active');
    document.body.style.overflow = '';
    if (lastFocusedTrigger && typeof lastFocusedTrigger.focus === 'function') {
      lastFocusedTrigger.focus();
      lastFocusedTrigger = null;
    }
  }

  document.querySelectorAll('.open-project-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.getAttribute('data-project');
      openProjectModal(id);
    });
  });

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeModal();
    });
  }

  // --------------------------------------------------------------------------
  // 8. Article Reading Modal
  // --------------------------------------------------------------------------
  const articlesData = {
    'art-1': {
      title: 'Building Resilient REST APIs with Node.js & TypeScript',
      date: 'October 2026',
      readTime: '6 min read',
      tag: 'Backend Architecture',
      content: `
        <p>In modern web engineering, writing a functioning API is only the first step. Ensuring that your API remains resilient under stress, graceful when failing, and strictly typed from request payload to database response is what distinguishes production-grade systems.</p>
        <h4 style="margin: 1.25rem 0 0.5rem; color: var(--text-primary); font-size: 1.1rem;">1. Type Safety with Zod Validation</h4>
        <p>Never trust client input. By pairing TypeScript interfaces with runtime validation schemas using Zod, you eliminate an entire class of runtime TypeError exceptions before your controllers even execute.</p>
        <h4 style="margin: 1.25rem 0 0.5rem; color: var(--text-primary); font-size: 1.1rem;">2. Centralized Error Handling & RFC 7807</h4>
        <p>Instead of scattering arbitrary try/catch blocks with inconsistent JSON response structures, implement an application-wide error middleware conforming to the RFC 7807 Problem Details specification. This gives frontend consumers predictable error objects with human-readable guidance.</p>
        <h4 style="margin: 1.25rem 0 0.5rem; color: var(--text-primary); font-size: 1.1rem;">3. Graceful Shutdown & Connection Draining</h4>
        <p>During zero-downtime rolling deployments, your Node.js process must intercept SIGTERM signals, stop accepting new HTTP connections, and wait for active database transactions to commit before terminating cleanly.</p>
      `
    },
    'art-2': {
      title: 'Modern IT Infrastructure: Why Every Developer Should Master Linux & Docker',
      date: 'September 2026',
      readTime: '8 min read',
      tag: 'IT & DevOps',
      content: `
        <p>As a 4th-year Information Technology student, the single most valuable synergy I discovered was bridging the gap between application code and the underlying Linux operating system and container virtualization.</p>
        <h4 style="margin: 1.25rem 0 0.5rem; color: var(--text-primary); font-size: 1.1rem;">1. The "It Works on My Machine" Cure</h4>
        <p>Docker is not merely a deployment tool—it is a standardized specification for your entire runtime environment. From environment variables to system libraries and networking ports, containers ensure exact parity between development workstations and production cloud clusters.</p>
        <h4 style="margin: 1.25rem 0 0.5rem; color: var(--text-primary); font-size: 1.1rem;">2. Linux Kernel Essentials: cgroups and namespaces</h4>
        <p>Understanding how Linux isolates processes through cgroups (resource limits) and namespaces (filesystem, network, and process table isolation) empowers engineers to debug real-world memory leaks and permission bottlenecks rather than treating containers as black boxes.</p>
        <h4 style="margin: 1.25rem 0 0.5rem; color: var(--text-primary); font-size: 1.1rem;">3. Practical Networking</h4>
        <p>Knowing how iptables, bridge networks, and DNS resolution work under Linux directly accelerates your ability to diagnose microservice communication timeouts and configure secure reverse proxies with Nginx.</p>
      `
    },
    'art-3': {
      title: 'My 4-Year Journey in Information Technology: Lessons & Milestones',
      date: 'August 2026',
      readTime: '5 min read',
      tag: 'Career & Reflection',
      content: `
        <p>Entering college as an eager freshman and now completing my senior year in Information Technology, this retrospective highlights the pivotal concepts, mindset shifts, and hands-on projects that shaped my engineering foundation.</p>
        <h4 style="margin: 1.25rem 0 0.5rem; color: var(--text-primary); font-size: 1.1rem;">1. Theory Meets Practice</h4>
        <p>Textbook algorithms, discrete mathematics, and relational database normalization can initially feel theoretical. However, when building high-concurrency systems or optimizing complex SQL joins with explain plans, those academic fundamentals become your greatest superpower.</p>
        <h4 style="margin: 1.25rem 0 0.5rem; color: var(--text-primary); font-size: 1.1rem;">2. The Value of Building in Public</h4>
        <p>Inspired by developers like Braydon Coyer, learning in public and sharing technical findings through documentation and open-source code accelerates learning faster than private studying alone.</p>
        <h4 style="margin: 1.25rem 0 0.5rem; color: var(--text-primary); font-size: 1.1rem;">3. Looking Forward</h4>
        <p>As I prepare to graduate and transition into full-time software engineering and cloud systems, my commitment remains focused on continuous learning, craft excellence, and building impactful digital solutions.</p>
      `
    }
  };

  const articleModal = document.getElementById('article-modal');
  const articleCloseBtn = document.getElementById('article-modal-close-btn');

  document.querySelectorAll('.article-card').forEach(card => {
    const openArticle = () => {
      sfx.pop();
      const id = card.getAttribute('data-article');
      const arArticle = currentLang === 'ar' && i18nData && i18nData.articles ? i18nData.articles[id] : null;
      const article = arArticle || articlesData[id];
      if (!article || !articleModal) return;

      lastFocusedTrigger = document.activeElement;
      document.getElementById('art-modal-title').textContent = article.title;
      document.getElementById('art-modal-meta').textContent = `${article.date} • ${article.readTime} • ${article.tag}`;
      document.getElementById('art-modal-body').innerHTML = article.content;

      articleModal.classList.add('active');
      document.body.style.overflow = 'hidden';
      if (articleCloseBtn) articleCloseBtn.focus();
    };

    card.addEventListener('click', openArticle);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openArticle();
      }
    });
  });

  if (articleCloseBtn) articleCloseBtn.addEventListener('click', closeModal);
  if (articleModal) {
    articleModal.addEventListener('click', (e) => {
      if (e.target === articleModal) closeModal();
    });
  }

  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // --------------------------------------------------------------------------
  // 9. Toast Notification Helper
  // --------------------------------------------------------------------------
  const toastContainer = document.getElementById('toast-container');
  function showToast(message, duration = 3200) {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    const span = document.createElement('span');
    span.textContent = message;
    toast.appendChild(span);
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // --------------------------------------------------------------------------
  // 10. Copy Email to Clipboard
  // --------------------------------------------------------------------------
  const copyEmailBtn = document.getElementById('copy-email-btn');
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', () => {
      sfx.success();
      const email = 'ibraheem770556950@gmail.com';
      navigator.clipboard.writeText(email).then(() => {
        showToast(`${uiStr('copySuccess', 'Email copied to clipboard! 📋')} (${email})`);
      }).catch(() => {
        showToast(uiStr('copyFallback', 'Email: ibraheem770556950@gmail.com'));
      });
    });
  }

  // --------------------------------------------------------------------------
  // 11. Contact Form Submission (Web3Forms -> ibraheem770556950@gmail.com)
  // --------------------------------------------------------------------------
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    const contactStatus = document.getElementById('contact-status');
    let statusHideTimer = null;
    let statusFadeTimer = null;

    function clearStatusTimers() {
      if (statusHideTimer) clearTimeout(statusHideTimer);
      if (statusFadeTimer) clearTimeout(statusFadeTimer);
    }

    function setContactStatus(type, contentNodeOrText) {
      if (!contactStatus) return;
      clearStatusTimers();
      contactStatus.className = `form-status ${type}`;
      contactStatus.innerHTML = '';
      if (typeof contentNodeOrText === 'string') {
        contactStatus.textContent = contentNodeOrText;
      } else {
        contactStatus.appendChild(contentNodeOrText);
      }
      contactStatus.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
      contactStatus.style.opacity = '1';
      contactStatus.style.transform = 'translateY(0)';
      contactStatus.style.display = 'block';

      if (type === 'success') {
        statusFadeTimer = setTimeout(() => {
          contactStatus.style.opacity = '0';
          contactStatus.style.transform = 'translateY(-4px)';
          statusHideTimer = setTimeout(() => {
            contactStatus.style.display = 'none';
          }, 350);
        }, 4500);
      }
    }

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const botCheck = contactForm.querySelector('input[name="botcheck"]');
      if (botCheck && botCheck.checked) return;

      const nameVal = document.getElementById('name').value.trim();
      const emailVal = document.getElementById('email').value.trim();
      const subjectVal = document.getElementById('subject').value.trim();
      const messageVal = document.getElementById('message').value.trim();

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;

      submitBtn.innerHTML = `<span>${uiStr('sending', 'Sending...')}</span>`;
      submitBtn.disabled = true;
      clearStatusTimers();
      if (contactStatus) contactStatus.style.display = 'none';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          signal: controller.signal,
          body: JSON.stringify({
            access_key: '15821e6c-daef-443b-b5e1-c15ad90d75b0',
            from_name: 'Ebraheem Portfolio Contact',
            name: nameVal,
            email: emailVal,
            subject: `Portfolio Contact: ${subjectVal}`,
            message: messageVal,
            replyto: emailVal
          })
        });

        clearTimeout(timeoutId);
        const result = await response.json().catch(() => ({}));

        if (response.ok && result.success === true) {
          sfx.success();
          contactForm.reset();
          setContactStatus('success', uiStr('sentStatus', '✅ Message sent successfully! Thank you for reaching out.'));
          showToast(uiStr('sentToast', 'Thank you! Your message has been sent to my inbox. 🚀'));
        } else {
          throw new Error(result.message || 'Unable to send message right now.');
        }
      } catch (err) {
        clearTimeout(timeoutId);
        const mailtoSubject = encodeURIComponent(subjectVal);
        const mailtoBody = encodeURIComponent(`From: ${nameVal} (${emailVal})\n\n${messageVal}`);
        const mailtoHref = `mailto:ibraheem770556950@gmail.com?subject=${mailtoSubject}&body=${mailtoBody}`;
        const frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode(uiStr('errorPrefix', '⚠️ Could not deliver automatically right now. ')));
        const linkEl = document.createElement('a');
        linkEl.href = mailtoHref;
        linkEl.textContent = uiStr('errorLink', 'Click here to send via your email app');
        frag.appendChild(linkEl);
        frag.appendChild(document.createTextNode('.'));
        setContactStatus('error', frag);
        showToast(uiStr('errorToast', 'Could not send via form. Please use the email link below.'), 4500);
      } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  // --------------------------------------------------------------------------
  // 12. Rotating Quotes in Footer (Braydon Coyer Signature Touch)
  // --------------------------------------------------------------------------
  const quotes = [
    { quote: "Good code is its own best documentation.", author: "Steve McConnell" },
    { quote: "Simplicity is prerequisite for reliability.", author: "Edsger W. Dijkstra" },
    { quote: "Make it work, make it right, make it fast.", author: "Kent Beck" },
    { quote: "First, solve the problem. Then, write the code.", author: "John Johnson" },
    { quote: "Talk is cheap. Show me the code.", author: "Linus Torvalds" }
  ];

  const quoteText = document.getElementById('footer-quote-text');
  const quoteAuthor = document.getElementById('footer-quote-author');
  let quoteIdx = 0;

  function renderCurrentQuote() {
    if (!quoteText || !quoteAuthor) return;
    const activeQuotes = (currentLang === 'ar' && i18nData && i18nData.quotes) ? i18nData.quotes : quotes;
    const item = activeQuotes[quoteIdx % activeQuotes.length];
    quoteText.textContent = `“${item.quote}”`;
    quoteAuthor.textContent = `— ${item.author}`;
  }

  if (quoteText && quoteAuthor) {
    setInterval(() => {
      quoteIdx = (quoteIdx + 1) % quotes.length;
      quoteText.style.opacity = '0';
      quoteAuthor.style.opacity = '0';
      setTimeout(() => {
        renderCurrentQuote();
        quoteText.style.opacity = '1';
        quoteAuthor.style.opacity = '1';
      }, 300);
    }, 8000);
  }

  // --------------------------------------------------------------------------
  // 13. Mobile Menu Drawer
  // --------------------------------------------------------------------------
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileDrawer = document.getElementById('mobile-nav-drawer');

  if (mobileMenuBtn && mobileDrawer) {
    mobileMenuBtn.addEventListener('click', () => {
      sfx.pop();
      const isOpen = mobileDrawer.classList.toggle('open');
      mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
    });

    mobileDrawer.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        mobileDrawer.classList.remove('open');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('click', (e) => {
      if (!mobileMenuBtn.contains(e.target) && !mobileDrawer.contains(e.target)) {
        mobileDrawer.classList.remove('open');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // --------------------------------------------------------------------------
  // 14. Scrollspy & Smooth Active Nav State (rAF-throttled passive listener)
  // --------------------------------------------------------------------------
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links .nav-link');
  let scrollTicking = false;

  function updateActiveNavLink() {
    scrollTicking = false;
    let current = '';
    const scrollPos = window.scrollY + 180;

    sections.forEach(sec => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        current = sec.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
  }

  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      scrollTicking = true;
      window.requestAnimationFrame(updateActiveNavLink);
    }
  }, { passive: true });

  // --------------------------------------------------------------------------
  // 15. Animated Stats Counter (IntersectionObserver — Zero Scroll Overhead)
  // --------------------------------------------------------------------------
  const statsSection = document.getElementById('stats');

  function runStatsCounter() {
    if (statsCounted || !statsSection) return;
    statsCounted = true;
    document.querySelectorAll('.stat-number').forEach(el => {
      const target = parseInt(el.getAttribute('data-target'), 10);
      let count = 0;
      const step = Math.max(1, Math.floor(target / 40));
      const timer = setInterval(() => {
        count += step;
        if (count >= target) {
          el.textContent = `${target}${getStatSuffix(el)}`;
          clearInterval(timer);
        } else {
          el.textContent = `${count}${getStatSuffix(el)}`;
        }
      }, 30);
    });
  }

  if (statsSection && 'IntersectionObserver' in window) {
    const statsObserver = new IntersectionObserver((entries, observer) => {
      if (entries.some(entry => entry.isIntersecting)) {
        runStatsCounter();
        observer.disconnect();
      }
    }, { threshold: 0.25 });
    statsObserver.observe(statsSection);
  } else {
    runStatsCounter();
  }

  // --------------------------------------------------------------------------
  // 16. Language Toggle Application (EN <-> AR)
  // --------------------------------------------------------------------------
  const langToggleBtn = document.getElementById('lang-toggle-btn');
  const langToggleLabel = document.getElementById('lang-toggle-label');

  function applyLanguage(lang, announce = false) {
    currentLang = lang === 'ar' && i18nData ? 'ar' : 'en';
    localStorage.setItem('portfolio_lang', currentLang);
    document.documentElement.setAttribute('lang', currentLang);
    document.documentElement.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (currentLang === 'ar' && key in i18nData.text) {
        el.textContent = i18nData.text[key];
      } else if (key in originalEn.text) {
        el.textContent = originalEn.text[key];
      }
    });

    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      if (currentLang === 'ar' && key in i18nData.html) {
        el.innerHTML = i18nData.html[key];
      } else if (key in originalEn.html) {
        el.innerHTML = originalEn.html[key];
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (currentLang === 'ar' && key in i18nData.placeholders) {
        el.setAttribute('placeholder', i18nData.placeholders[key]);
      } else if (key in originalEn.placeholders) {
        el.setAttribute('placeholder', originalEn.placeholders[key]);
      }
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (currentLang === 'ar' && key in i18nData.titles) {
        el.setAttribute('title', i18nData.titles[key]);
      } else if (key in originalEn.titles) {
        el.setAttribute('title', originalEn.titles[key]);
      }
    });

    document.querySelectorAll('[data-hide-on-lang]').forEach(el => {
      const hideLang = el.getAttribute('data-hide-on-lang');
      el.style.display = currentLang === hideLang ? 'none' : '';
    });

    if (langToggleLabel) {
      langToggleLabel.textContent = currentLang === 'ar' ? 'EN' : 'عربي';
    }

    if (statsCounted) {
      document.querySelectorAll('.stat-number').forEach(el => {
        const target = el.getAttribute('data-target');
        el.textContent = `${target}${getStatSuffix(el)}`;
      });
    }

    renderCurrentQuote();
    sfx.updateIcon();
    setTheme(document.documentElement.getAttribute('data-theme') || 'dark');

    if (announce) {
      showToast(
        currentLang === 'ar'
          ? uiStr('switchedToAr', 'تم التحويل إلى اللغة العربية 🇸🇦')
          : 'Switched to English ✨'
      );
    }
  }

  if (langToggleBtn) {
    langToggleBtn.addEventListener('click', () => {
      sfx.pop();
      applyLanguage(currentLang === 'ar' ? 'en' : 'ar', true);
    });
  }

  applyLanguage(currentLang, false);
});

