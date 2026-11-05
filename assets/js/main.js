/**
 * Ebraheem Al-moqbily - Portfolio Script
 * Interactive features inspired by Braydon Coyer's "Blogfolio"
 */

document.addEventListener('DOMContentLoaded', () => {
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
      } catch (e) {}
    }

    toggleMute() {
      this.muted = !this.muted;
      localStorage.setItem('sound_muted', this.muted);
      this.updateIcon();
      if (!this.muted) {
        this.pop();
        showToast('Sound effects enabled 🔊');
      } else {
        showToast('Sound effects muted 🔇');
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
        btn.setAttribute('title', 'Enable sound effects');
      } else {
        btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
        btn.setAttribute('title', 'Mute sound effects');
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
        themeToggleBtn.setAttribute('title', 'Switch to Dark Mode');
      } else {
        themeToggleBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
        themeToggleBtn.setAttribute('title', 'Switch to Light Mode');
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
      showToast(`Switched to ${next === 'dark' ? 'Dark' : 'Light'} Mode ✨`);
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
      showToast('Ebraheem Al-moqbily • Senior IT Graduate & Engineer 🎓');
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
        const category = card.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
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
    'campus-it': {
      title: 'CampusIT Helpdesk & Asset Management System',
      category: 'IT & Infrastructure / Full-Stack',
      tags: ['Node.js', 'Express', 'PostgreSQL', 'Docker', 'Tailwind CSS', 'JWT'],
      summary: 'A centralized enterprise IT management platform built specifically for university colleges and academic institutions to manage IT assets, track hardware/software life cycles, automate support ticket assignments, and deliver real-time network infrastructure diagnostics.',
      problem: 'College computer labs and departmental offices suffered from fragmented spreadsheets, delayed maintenance reports, and unmonitored server rooms, causing student lab downtime.',
      solution: 'Engineered an end-to-end web system with role-based access control (Students, IT Staff, Lab Administrators), interactive lab workstation visual maps, automated ticket dispatching, and automated email/SMS status alerts.',
      features: [
        'Interactive Lab Topology & Workstation health monitoring',
        'Ticket triage queue with priority-based SLA escalation',
        'Hardware warranty & software license expiration tracker',
        'PostgreSQL database optimized with indexed audit logs and relations',
        'Docker containerized deployment with Nginx reverse proxy'
      ],
      github: 'https://github.com/ENG-Ebraheem/campus-it-system',
      demo: '#'
    },
    'cloudvault': {
      title: 'CloudVault - Secure Cloud Storage & File Sharing',
      category: 'Full-Stack Web & Cloud',
      tags: ['Next.js', 'TypeScript', 'Node.js', 'AWS S3 / MinIO', 'Prisma', 'Tailwind'],
      summary: 'A zero-trust personal and collaborative cloud storage service inspired by Dropbox and Google Drive, designed with end-to-end client-side encryption and high-throughput chunked file uploads.',
      problem: 'Existing file sharing tools often lack transparent security controls, upload resumption over unstable networks, or lightweight self-hosting options for organizations.',
      solution: 'Built an ultra-responsive web application supporting drag-and-drop file chunking, AES-256 encrypted storage, time-expiring shareable download links, and granular folder permissions.',
      features: [
        'Resumable multi-part upload engine handling files up to 10GB',
        'Expiring password-protected share links with view-count limits',
        'Live file preview for PDFs, code files, audio, and media',
        'Detailed access logging and IP audit trail',
        'Full keyboard navigation and accessible UI'
      ],
      github: 'https://github.com/ENG-Ebraheem/cloudvault',
      demo: '#'
    },
    'smartclinic': {
      title: 'SmartClinic - Medical Records & Appointment Hub',
      category: 'Full-Stack Web / Database Systems',
      tags: ['React', 'Python', 'FastAPI', 'PostgreSQL', 'Redis', 'Docker'],
      summary: 'A secure, HIPAA-compliant patient health records and online doctor scheduling platform engineered for clinics and hospitals to streamline patient intake and doctor agendas.',
      problem: 'Physical paperwork and double-booked doctor appointments created long clinic waiting times and lost medical test records.',
      solution: 'Developed an asynchronous FastAPI microservice backend connected to a React frontend, featuring instant slot conflict resolution via Redis locks, and electronic health record (EHR) PDF generation.',
      features: [
        'Real-time doctor calendar booking with instant conflict prevention',
        'Secure patient portal with lab results and prescription history',
        'Doctor dashboard with digital prescription signer',
        'Role-based permissions for Doctors, Nurses, and Receptionists',
        'Automated appointment reminder notifications'
      ],
      github: 'https://github.com/ENG-Ebraheem/smartclinic',
      demo: '#'
    },
    'netpulse': {
      title: 'NetPulse - Real-time Network Monitoring & Diagnostics',
      category: 'IT & Networking / Systems',
      tags: ['Python', 'Scapy', 'WebSockets', 'Chart.js', 'Bash', 'Linux'],
      summary: 'A lightweight network inspection daemon and web dashboard providing live ping latency monitoring, ICMP/TCP packet analysis, port scanning, and instant bandwidth anomaly alerts.',
      problem: 'Commercial network monitoring suites like SolarWinds or PRTG are heavyweight, costly, and complex for small enterprise networks or college lab clusters.',
      solution: 'Engineered a modular Python service that polls lab gateways and servers, analyzes round-trip time (RTT), detects rogue MAC addresses, and streams live telemetry to a browser dashboard via WebSockets.',
      features: [
        'Live latency heatmaps and packet jitter graphs',
        'Automated port scanner with known vulnerability flag checks',
        'Subnet IP discovery and host availability alerts',
        'Configurable Telegram/Email alert thresholds for service downtime',
        'Runs as an ultra-lightweight systemd daemon on Linux/Raspberry Pi'
      ],
      github: 'https://github.com/ENG-Ebraheem/netpulse-monitor',
      demo: '#'
    }
  };

  const modalBackdrop = document.getElementById('project-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');

  function openProjectModal(projectId) {
    sfx.pop();
    const data = projectDetails[projectId];
    if (!data || !modalBackdrop) return;

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
  }

  function closeModal() {
    sfx.click();
    if (modalBackdrop) modalBackdrop.classList.remove('active');
    const articleModal = document.getElementById('article-modal');
    if (articleModal) articleModal.classList.remove('active');
    document.body.style.overflow = '';
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
    card.addEventListener('click', () => {
      sfx.pop();
      const id = card.getAttribute('data-article');
      const article = articlesData[id];
      if (!article || !articleModal) return;

      document.getElementById('art-modal-title').textContent = article.title;
      document.getElementById('art-modal-meta').textContent = `${article.date} • ${article.readTime} • ${article.tag}`;
      document.getElementById('art-modal-body').innerHTML = article.content;

      articleModal.classList.add('active');
      document.body.style.overflow = 'hidden';
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
    toast.innerHTML = `<span>${message}</span>`;
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
      const email = 'ebraheem.almoqbily@example.com';
      navigator.clipboard.writeText(email).then(() => {
        showToast('Email copied to clipboard! 📋 (' + email + ')');
      }).catch(() => {
        showToast('Email: ebraheem.almoqbily@example.com');
      });
    });
  }

  // --------------------------------------------------------------------------
  // 11. Contact Form Submission
  // --------------------------------------------------------------------------
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;

      submitBtn.innerHTML = `<span>Sending...</span>`;
      submitBtn.disabled = true;

      setTimeout(() => {
        sfx.success();
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        contactForm.reset();
        showToast('Thank you! Your message has been sent successfully. 🚀');
      }, 1000);
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
  if (quoteText && quoteAuthor) {
    let quoteIdx = 0;
    setInterval(() => {
      quoteIdx = (quoteIdx + 1) % quotes.length;
      quoteText.style.opacity = '0';
      quoteAuthor.style.opacity = '0';
      setTimeout(() => {
        quoteText.textContent = `“${quotes[quoteIdx].quote}”`;
        quoteAuthor.textContent = `— ${quotes[quoteIdx].author}`;
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
      mobileDrawer.classList.toggle('open');
    });

    mobileDrawer.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        mobileDrawer.classList.remove('open');
      });
    });

    document.addEventListener('click', (e) => {
      if (!mobileMenuBtn.contains(e.target) && !mobileDrawer.contains(e.target)) {
        mobileDrawer.classList.remove('open');
      }
    });
  }

  // --------------------------------------------------------------------------
  // 14. Scrollspy & Smooth Active Nav State
  // --------------------------------------------------------------------------
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links .nav-link');

  window.addEventListener('scroll', () => {
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
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });

  // --------------------------------------------------------------------------
  // 15. Animated Stats Counter
  // --------------------------------------------------------------------------
  let statsCounted = false;
  const statsSection = document.getElementById('stats');

  function runStatsCounter() {
    if (statsCounted || !statsSection) return;
    const rect = statsSection.getBoundingClientRect();
    if (rect.top <= window.innerHeight * 0.85) {
      statsCounted = true;
      document.querySelectorAll('.stat-number').forEach(el => {
        const target = parseInt(el.getAttribute('data-target'), 10);
        let count = 0;
        const step = Math.max(1, Math.floor(target / 40));
        const timer = setInterval(() => {
          count += step;
          if (count >= target) {
            el.textContent = `${target}${el.getAttribute('data-suffix') || ''}`;
            clearInterval(timer);
          } else {
            el.textContent = `${count}${el.getAttribute('data-suffix') || ''}`;
          }
        }, 30);
      });
    }
  }

  window.addEventListener('scroll', runStatsCounter);
  runStatsCounter();
});

