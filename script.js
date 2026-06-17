/**
 * Muhammed Shibili MP - Portfolio JavaScript
 * Interactive engines: Custom Cursor, Electronics Signal Canvas, 3D Circuit Canvas, Dynamic text, validations
 * Cloud integration: Firebase Auth, Firestore Database, Firebase Storage, and Local Storage fallback
 */

// Global state variables
let projects = [];
let skills = [];
let timeline = [];
let db = null;
let auth = null;
let storage = null;
let isFirebaseEnabled = false;
let currentAdminUser = null;
let currentUploadUrl = null;
let isCurrentlyUploading = false;

// Firebase Configuration Block
// Insert your Firebase credentials here to enable cloud syncing and storage uploads!
const firebaseConfig = {
  apiKey: "AIzaSyCx4eWo2Yn6yJrgvVuCfv1N38CMY-a-3Us",
  authDomain: "portfolio-4e9fd.firebaseapp.com",
  projectId: "portfolio-4e9fd",
  storageBucket: "portfolio-4e9fd.firebasestorage.app",
  messagingSenderId: "878894246428",
  appId: "1:878894246428:web:61fe4e27b38de079434dd9",
  measurementId: "G-GQEBS7M8TP"
};

// Default projects list to populate database/local storage initially
const defaultProjects = [
  {
    id: "1",
    title: "AI Powered Web Platform",
    desc: "A futuristic, intelligent web application bridging cloud workflows, prompt systems, and user controls with responsive visual boards.",
    tech: "React, Django, API Integration, Tailwind",
    category: "web",
    image: "assets/ai_platform.png",
    demo: "https://demo.shibili.dev/",
    repo: "https://github.com/msshibili"
  },
  {
    id: "2",
    title: "Dynamic Poster Generator",
    desc: "Algorithmic image and layout engine generating highly structured modern design systems and custom poster graphics using math.",
    tech: "HTML5 Canvas, JavaScript, Node.js, Illustrator",
    category: "design",
    image: "assets/poster_generator.png",
    demo: "https://demo.shibili.dev/",
    repo: "https://github.com/msshibili"
  },
  {
    id: "3",
    title: "E-commerce Website",
    desc: "Premium storefront designed with subtle glassmorphic components, payment gateway routing, and responsive dashboard controls.",
    tech: "Django, SQL, JavaScript, Vanilla CSS",
    category: "web",
    image: "assets/ecommerce.png",
    demo: "https://demo.shibili.dev/",
    repo: "https://github.com/msshibili"
  },
  {
    id: "4",
    title: "Branding Design Collection",
    desc: "An elegant corporate identity layout, featuring logo systems, dark charcoal patterns, business stationery, and brand books.",
    tech: "Photoshop, Illustrator, Affinity, InDesign",
    category: "design",
    image: "assets/branding.png",
    demo: "https://www.behance.net/shibilimp",
    repo: "https://github.com/msshibili"
  },
  {
    id: "5",
    title: "Electronics Mini Projects",
    desc: "Custom-built circuits focusing on analog signals, power regulation boards, operational amplifiers, and sensor interface units.",
    tech: "Circuit Design, Simulation, PCB Layout, Breadboarding",
    category: "engineering",
    image: "assets/electronics.png",
    demo: "https://demo.shibili.dev/",
    repo: "https://github.com/msshibili"
  },
  {
    id: "6",
    title: "Embedded Systems Projects",
    desc: "Hardware prototype using OLED feedback, sensor reading, microprocessors, and custom-written C/C++ firmware stacks.",
    tech: "Embedded C, Arduino/ESP32, SPI/I2C, Firmware",
    category: "engineering",
    image: "assets/embedded.png",
    demo: "https://demo.shibili.dev/",
    repo: "https://github.com/msshibili"
  }
];

document.addEventListener('DOMContentLoaded', () => {

  // Remove loading class from body
  document.body.classList.remove('loading');

  // Initialize Firebase if credentials are supplied
  initFirebase();

  // Load databases (Firebase or Local fallback)
  loadProjectsDatabase();
  loadSkillsDatabase();
  loadTimelineDatabase();

  // Initialize animations and telemetry UI
  initCustomCursor();
  initBackgroundParticles();
  initHeroCircuit3D();
  initTextCycler();
  initScrollReveal();
  initProjectFilters();
  initContactForm();
  initAdminDashboard();
});

/* ==========================================================================
   0. FIREBASE INTEGRATION SETUP
   ========================================================================== */
function initFirebase() {
  const isPlaceholder = !firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith("YOUR_");

  if (!isPlaceholder) {
    try {
      firebase.initializeApp(firebaseConfig);
      db = firebase.firestore();
      auth = firebase.auth();
      storage = firebase.storage();
      isFirebaseEnabled = true;
      console.log("[SYSTEM] Firebase integrated successfully. Cloud mode online.");

      // Listen to auth state changes from Firebase
      auth.onAuthStateChanged((user) => {
        if (user) {
          currentAdminUser = user;
          setAdminState(true);
        } else {
          currentAdminUser = null;
          setAdminState(false);
        }
      });
    } catch (e) {
      console.error("[SYSTEM] Firebase initialization failed. Falling back to local storage.", e);
      isFirebaseEnabled = false;
    }
  } else {
    console.log("[SYSTEM] Using Local Sandbox Mode (Local Storage fallback). To connect live databases, configure firebaseConfig in script.js.");

    // Check local session storage for sandbox admin persistence
    const isLocalAdmin = sessionStorage.getItem("shibili_admin_logged_in") === "true";
    if (isLocalAdmin) {
      setAdminState(true);
    }
  }
}

/* ==========================================================================
   PROJECTS DATA STORAGE SYNC (FIREBASE OR LOCAL STORAGE FALLBACK)
   ========================================================================== */
function loadProjectsDatabase() {
  if (isFirebaseEnabled) {
    // Fetch live from Firestore
    db.collection("projects").orderBy("id", "asc").onSnapshot((querySnapshot) => {
      projects = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        data.firebaseId = doc.id; // Store firestore document reference
        projects.push(data);
      });

      if (projects.length === 0) {
        console.log("[SYSTEM] Firestore projects list is empty. Initializing with defaults...");
        defaultProjects.forEach(proj => {
          db.collection("projects").add(proj);
        });
      } else {
        renderProjectsGrid(projects);
      }
    }, (error) => {
      console.error("[SYSTEM] Firestore fetch failed. Reverting to defaults:", error);
      renderProjectsGrid(defaultProjects);
    });
  } else {
    // Fetch from Local Storage
    const cached = localStorage.getItem("shibili_projects");
    if (!cached) {
      localStorage.setItem("shibili_projects", JSON.stringify(defaultProjects));
      projects = defaultProjects;
    } else {
      projects = JSON.parse(cached);
    }
    renderProjectsGrid(projects);
  }
}

// Render dynamic project elements in DOM
function renderProjectsGrid(projectsArray) {
  const grid = document.getElementById("projects-grid");
  if (!grid) return;

  grid.innerHTML = "";

  // Render cards
  projectsArray.forEach(proj => {
    const card = document.createElement("div");
    card.className = "project-card glass-panel reveal-reveal revealed";
    card.setAttribute("data-category", proj.category);

    const adminEditButton = `
      <div class="project-admin-overlay">
        <button type="button" class="btn-admin-edit" onclick="openProjectEditor('${proj.id}')">
          <i class="fa-solid fa-pen"></i> Edit
        </button>
        <button type="button" class="btn-admin-delete" onclick="deleteProject('${proj.id}')">
          <i class="fa-solid fa-trash"></i> Delete
        </button>
      </div>
    `;

    card.innerHTML = `
      <div class="project-img-wrapper">
        <img src="${proj.image}" alt="${proj.title}" class="project-img">
        <div class="project-overlay">
          <span class="system-id">SYS_REF: ${proj.title.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_V2</span>
        </div>
        ${adminEditButton}
      </div>
      <div class="project-content">
        <h3 class="project-title">${proj.title}</h3>
        <p class="project-desc">${proj.desc}</p>
        <div class="project-tech">
          ${proj.tech.split(',').map(tag => `<span class="tech-tag">${tag.trim()}</span>`).join('')}
        </div>
        <div class="project-links">
          <a href="${proj.demo || '#'}" target="_blank" class="btn btn-icon" aria-label="Live Demo">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> Demo
          </a>
          <a href="${proj.repo || '#'}" target="_blank" class="btn btn-icon-outline" aria-label="GitHub Repository">
            <i class="fa-brands fa-github"></i> Repository
          </a>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });

  // Re-trigger visual updates for cursor coordinates on new cards
  initCardHoverCoordinates();

  // Re-sync filter display state
  const activeFilter = document.querySelector(".filter-btn.active");
  if (activeFilter) {
    const filter = activeFilter.getAttribute("data-filter");
    filterProjects(filter);
  }
}

function initCardHoverCoordinates() {
  document.addEventListener('mousemove', (e) => {
    const cards = document.querySelectorAll('.glass-panel');
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });
}

/* ==========================================================================
   SKILLS & TIMELINE DYNAMIC STATE & DATABASE CONNECTORS
   ========================================================================== */
const defaultSkills = [
  // Development
  { id: "s1", name: "Python Django", percent: 85, category: "development" },
  { id: "s2", name: "HTML", percent: 95, category: "development" },
  { id: "s3", name: "CSS", percent: 90, category: "development" },
  { id: "s4", name: "JavaScript", percent: 80, category: "development" },
  { id: "s5", name: "Responsive Web Design", percent: 92, category: "development" },
  // Design
  { id: "s6", name: "Adobe Photoshop", percent: 85, category: "design" },
  { id: "s7", name: "Illustrator", percent: 88, category: "design" },
  { id: "s8", name: "InDesign", percent: 75, category: "design" },
  { id: "s9", name: "Canva", percent: 90, category: "design" },
  { id: "s10", name: "Affinity Suite", percent: 78, category: "design" },
  { id: "s11", name: "Basic Figma", percent: 82, category: "design" },
  // Engineering
  { id: "s12", name: "Electronics", percent: 80, category: "engineering" },
  { id: "s13", name: "Embedded Systems", percent: 85, category: "engineering" },
  { id: "s14", name: "Circuit Analysis", percent: 78, category: "engineering" },
  { id: "s15", name: "Hardware Problem Solving", percent: 88, category: "engineering" },
  // AI Tools
  { id: "s16", name: "AI Web Development", percent: 90, category: "ai_tools" },
  { id: "s17", name: "Prompt Engineering", percent: 95, category: "ai_tools" },
  { id: "s18", name: "Vibe Coding", percent: 92, category: "ai_tools" },
  { id: "s19", name: "Workflow Automation", percent: 85, category: "ai_tools" }
];

const defaultTimeline = [
  // Experience
  {
    id: "t1",
    type: "experience",
    date: "2026 – PRESENT",
    title: "Graphic Designer",
    institution: "Ryleni",
    subInfo: "",
    details: [
      "Digital marketing creatives.",
      "Branding assets.",
      "Social media design."
    ]
  },
  {
    id: "t2",
    type: "experience",
    date: "FREELANCE",
    title: "Freelance Web Developer",
    institution: "",
    subInfo: "",
    details: [
      "Developing responsive websites.",
      "Full-stack web development.",
      "Client project management."
    ]
  },
  // Education
  {
    id: "t3",
    type: "education",
    date: "2024 – PRESENT",
    title: "Bachelor of Electronics Engineering",
    institution: "Government Engineering College Wayanad",
    subInfo: "APJ Abdul Kalam Technological University",
    details: []
  },
  {
    id: "t4",
    type: "education",
    date: "2023",
    title: "Higher Secondary – Biology Science",
    institution: "Madin Higher Secondary School Melmuri",
    subInfo: "Board of HSE, Kerala",
    details: []
  }
];

function loadSkillsDatabase() {
  if (isFirebaseEnabled) {
    db.collection("skills").orderBy("id", "asc").onSnapshot((querySnapshot) => {
      skills = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        data.firebaseId = doc.id;
        skills.push(data);
      });

      if (skills.length === 0) {
        console.log("[SYSTEM] Firestore skills list is empty. Initializing defaults...");
        defaultSkills.forEach(skill => {
          db.collection("skills").add(skill);
        });
      } else {
        renderSkills(skills);
      }
    }, (error) => {
      console.error("[SYSTEM] Firestore skills fetch failed. Reverting to defaults:", error);
      renderSkills(defaultSkills);
    });
  } else {
    const cached = localStorage.getItem("shibili_skills");
    if (!cached) {
      localStorage.setItem("shibili_skills", JSON.stringify(defaultSkills));
      skills = defaultSkills;
    } else {
      skills = JSON.parse(cached);
    }
    renderSkills(skills);
  }
}

function loadTimelineDatabase() {
  if (isFirebaseEnabled) {
    db.collection("timeline").orderBy("id", "asc").onSnapshot((querySnapshot) => {
      timeline = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        data.firebaseId = doc.id;
        timeline.push(data);
      });

      if (timeline.length === 0) {
        console.log("[SYSTEM] Firestore timeline list is empty. Initializing defaults...");
        defaultTimeline.forEach(item => {
          db.collection("timeline").add(item);
        });
      } else {
        renderTimeline(timeline);
      }
    }, (error) => {
      console.error("[SYSTEM] Firestore timeline fetch failed. Reverting to defaults:", error);
      renderTimeline(defaultTimeline);
    });
  } else {
    const cached = localStorage.getItem("shibili_timeline");
    if (!cached) {
      localStorage.setItem("shibili_timeline", JSON.stringify(defaultTimeline));
      timeline = defaultTimeline;
    } else {
      timeline = JSON.parse(cached);
    }
    renderTimeline(timeline);
  }
}

function renderSkills(skillsArray) {
  const categories = {
    development: document.getElementById("skills-list-development"),
    design: document.getElementById("skills-list-design"),
    engineering: document.getElementById("skills-list-engineering"),
    ai_tools: document.getElementById("skills-list-ai_tools")
  };

  // Clear existing items in DOM
  Object.values(categories).forEach(container => {
    if (container) container.innerHTML = "";
  });

  skillsArray.forEach(skill => {
    const container = categories[skill.category];
    if (!container) return;

    const skillItem = document.createElement("div");
    skillItem.className = "skill-item";
    skillItem.setAttribute("data-percent", skill.percent);

    const adminControls = `
      <div class="skill-admin-controls">
        <button type="button" onclick="openSkillEditor('${skill.id}')"><i class="fa-solid fa-pen"></i></button>
        <button type="button" class="btn-delete" onclick="deleteSkill('${skill.id}')"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;

    skillItem.innerHTML = `
      <div class="skill-info">
        <span class="skill-name">${skill.name}</span>
        <span class="skill-value">${skill.percent}%</span>
      </div>
      <div class="skill-bar">
        <div class="skill-progress" style="width: ${skill.percent}%"></div>
      </div>
      ${adminControls}
    `;

    container.appendChild(skillItem);
  });
}

function renderTimeline(timelineArray) {
  const containers = {
    experience: document.getElementById("experience-timeline"),
    education: document.getElementById("education-timeline")
  };

  // Clear existing elements in DOM
  Object.values(containers).forEach(container => {
    if (container) container.innerHTML = "";
  });

  timelineArray.forEach(item => {
    const container = containers[item.type];
    if (!container) return;

    const card = document.createElement("div");
    card.className = "timeline-item-card glass-panel reveal-reveal revealed";

    // Build details bullets HTML
    let detailsHTML = "";
    if (item.details && item.details.length > 0) {
      detailsHTML = `<ul class="timeline-details">` +
        item.details.map(bullet => `<li><i class="fa-solid fa-caret-right"></i> ${bullet}</li>`).join('') +
        `</ul>`;
    }

    const subInfoHTML = item.subInfo ? `<p class="timeline-sub-company">${item.subInfo}</p>` : "";
    const companyHTML = item.institution ? `<h4 class="timeline-company">${item.institution}</h4>` : "";

    const adminControls = `
      <div class="timeline-admin-controls">
        <button type="button" onclick="openTimelineEditor('${item.id}')"><i class="fa-solid fa-pen"></i> Edit</button>
        <button type="button" class="btn-delete" onclick="deleteTimeline('${item.id}')"><i class="fa-solid fa-trash"></i> Delete</button>
      </div>
    `;

    card.innerHTML = `
      <div class="timeline-marker"></div>
      <div class="timeline-date">${item.date}</div>
      <h3 class="timeline-job">${item.title}</h3>
      ${companyHTML}
      ${subInfoHTML}
      ${detailsHTML}
      ${adminControls}
    `;

    container.appendChild(card);
  });

  initCardHoverCoordinates();
}

/* ==========================================================================
   1. CUSTOM CURSOR & GLOW EFFECT
   ========================================================================== */
function initCustomCursor() {
  const glow = document.getElementById('cursor-glow');
  const dot = document.getElementById('cursor-dot');

  if (!glow || !dot) return;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let currentX = mouseX;
  let currentY = mouseY;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Set absolute position for dot immediately
    dot.style.left = `${mouseX}px`;
    dot.style.top = `${mouseY}px`;
  });

  // Smooth ease-out animation for the larger background glow
  function animateGlow() {
    currentX += (mouseX - currentX) * 0.08;
    currentY += (mouseY - currentY) * 0.08;

    glow.style.left = `${currentX}px`;
    glow.style.top = `${currentY}px`;

    requestAnimationFrame(animateGlow);
  }
  animateGlow();

  // Hover states for interactive items
  const interactiveElements = document.querySelectorAll('a, button, .filter-btn, .project-card, .social-box, select, input, textarea');
  interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
      dot.style.transform = 'translate(-50%, -50%) scale(2)';
      dot.style.backgroundColor = 'var(--secondary)';
      glow.style.width = '550px';
      glow.style.height = '550px';
    });
    el.addEventListener('mouseleave', () => {
      dot.style.transform = 'translate(-50%, -50%) scale(1)';
      dot.style.backgroundColor = 'var(--primary)';
      glow.style.width = '450px';
      glow.style.height = '450px';
    });
  });

  initCardHoverCoordinates();
}

/* ==========================================================================
   2. BACKGROUND PARTICLES (ELECTRONICS SIGNALS)
   ========================================================================== */
function initBackgroundParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let particles = [];
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
      this.radius = Math.random() * 1.5 + 0.5;
      this.alpha = Math.random() * 0.5 + 0.1;
      this.flash = false;
      this.flashAlpha = 0;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0) this.x = width;
      if (this.x > width) this.x = 0;
      if (this.y < 0) this.y = height;
      if (this.y > height) this.y = 0;

      if (!this.flash && Math.random() < 0.0005) {
        this.flash = true;
        this.flashAlpha = 1;
      }

      if (this.flash) {
        this.flashAlpha -= 0.01;
        if (this.flashAlpha <= 0) {
          this.flash = false;
        }
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
      ctx.fill();

      if (this.flash) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 107, 43, ${this.flashAlpha * 0.4})`;
        ctx.fill();
      }
    }
  }

  const count = width < 768 ? 40 : 100;
  for (let i = 0; i < count; i++) {
    particles.push(new Particle());
  }

  function loop() {
    if (document.querySelector('.modal.active')) {
      requestAnimationFrame(loop);
      return;
    }
    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
    ctx.lineWidth = 1;
    const gridSize = 80;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    particles.forEach(p => {
      p.update();
      p.draw();
    });

    ctx.lineWidth = 0.5;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const connectionLimit = width < 768 ? 80 : 120;
        if (dist < connectionLimit) {
          const alpha = (1 - dist / connectionLimit) * 0.12;
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();

          if (particles[i].flash || particles[j].flash) {
            const flashAlpha = Math.max(particles[i].flashAlpha || 0, particles[j].flashAlpha || 0) * 0.3;
            ctx.strokeStyle = `rgba(255, 107, 43, ${flashAlpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
            ctx.lineWidth = 0.5;
          }
        }
      }
    }

    requestAnimationFrame(loop);
  }
  loop();
}

/* ==========================================================================
   3. 3D ROTATING CIRCUIT BOARD CANVAS IN HERO
   ========================================================================== */
function initHeroCircuit3D() {
  const canvas = document.getElementById('circuit-canvas');
  const telemetryX = document.getElementById('telemetry-x');
  const telemetryY = document.getElementById('telemetry-y');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = canvas.width = canvas.offsetWidth;
  let height = canvas.height = canvas.offsetHeight;

  window.addEventListener('resize', () => {
    if (canvas.offsetWidth > 0) {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    }
  });

  const fov = 350;
  let mouseTiltX = 0;
  let mouseTiltY = 0;

  document.addEventListener('mousemove', (e) => {
    const nx = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
    const ny = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
    mouseTiltX = nx * 0.4;
    mouseTiltY = ny * 0.4;
  });

  const vertices = [];
  const connections = [];

  const size = 150;
  const boardY = 20;

  vertices.push({ x: -size, y: boardY, z: -size, type: 'corner' });
  vertices.push({ x: size, y: boardY, z: -size, type: 'corner' });
  vertices.push({ x: size, y: boardY, z: size, type: 'corner' });
  vertices.push({ x: -size, y: boardY, z: size, type: 'corner' });

  connections.push([0, 1], [1, 2], [2, 3], [3, 0]);

  const chipSize = 50;
  const chipHeight = 5;
  const chipY = boardY - chipHeight;

  vertices.push({ x: -chipSize, y: chipY, z: -chipSize, type: 'chip' });
  vertices.push({ x: chipSize, y: chipY, z: -chipSize, type: 'chip' });
  vertices.push({ x: chipSize, y: chipY, z: chipSize, type: 'chip' });
  vertices.push({ x: -chipSize, y: chipY, z: chipSize, type: 'chip' });

  connections.push([4, 5], [5, 6], [6, 7], [7, 4]);
  connections.push([0, 4], [1, 5], [2, 6], [3, 7]);

  vertices.push({ x: -100, y: boardY, z: -80, type: 'comp' });
  vertices.push({ x: -100, y: boardY - 30, z: -80, type: 'comp' });
  connections.push([8, 9]);

  vertices.push({ x: -110, y: boardY, z: -60, type: 'comp' });
  vertices.push({ x: -110, y: boardY - 30, z: -60, type: 'comp' });
  connections.push([10, 11]);

  const pinCount = 12;
  const pinStartIdx = vertices.length;
  for (let i = 0; i < pinCount; i++) {
    const angle = (i / pinCount) * Math.PI * 2;
    const px = Math.cos(angle) * 90;
    const pz = Math.sin(angle) * 90;
    vertices.push({ x: px, y: boardY, z: pz, type: 'node', val: Math.random() });

    const chipTarget = 4 + (i % 4);
    connections.push([pinStartIdx + i, chipTarget]);
  }

  const busY = boardY;
  const lineStartIdx = vertices.length;
  for (let i = 0; i < 4; i++) {
    const offset = i * 12;
    vertices.push({ x: -140, y: busY, z: -20 + offset, type: 'node' });
    vertices.push({ x: -80, y: busY, z: -20 + offset, type: 'node' });
    connections.push([lineStartIdx + i * 2, lineStartIdx + i * 2 + 1]);
  }

  let angleX = 0.4;
  let angleY = 0.5;

  const pulses = [];
  for (let i = 0; i < 5; i++) {
    pulses.push({
      connIndex: Math.floor(Math.random() * connections.length),
      progress: Math.random(),
      speed: 0.005 + Math.random() * 0.01
    });
  }

  function rotate3D() {
    if (document.querySelector('.modal.active')) {
      requestAnimationFrame(rotate3D);
      return;
    }
    ctx.clearRect(0, 0, width, height);

    const targetAngleY = angleY + 0.003;
    const targetAngleX = 0.4 + mouseTiltY;

    angleY = targetAngleY;
    angleX += (targetAngleX - angleX) * 0.15;

    const dynamicAngleY = angleY + mouseTiltX;

    if (telemetryX && telemetryY) {
      telemetryX.textContent = `${(dynamicAngleY * (180 / Math.PI) % 360).toFixed(1)}°`;
      telemetryY.textContent = `${(angleX * (180 / Math.PI) % 360).toFixed(1)}°`;
    }

    const cosX = Math.cos(angleX);
    const sinX = Math.sin(angleX);
    const cosY = Math.cos(dynamicAngleY);
    const sinY = Math.sin(dynamicAngleY);

    const projected = vertices.map(v => {
      let x1 = v.x * cosY - v.z * sinY;
      let z1 = v.x * sinY + v.z * cosY;

      let y2 = v.y * cosX - z1 * sinX;
      let z2 = v.y * sinX + z1 * cosX;

      const zoom = 1.1;
      const s = fov / (fov + z2) * zoom;
      const x2d = x1 * s + width / 2;
      const y2d = y2 * s + height / 2 - 20;

      return { x: x2d, y: y2d, z: z2, type: v.type };
    });

    connections.forEach((conn) => {
      const p1 = projected[conn[0]];
      const p2 = projected[conn[1]];
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 107, 43, 0.15)';
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });

    pulses.forEach(pulse => {
      pulse.progress += pulse.speed;
      if (pulse.progress >= 1) {
        pulse.progress = 0;
        pulse.connIndex = Math.floor(Math.random() * connections.length);
      }

      const conn = connections[pulse.connIndex];
      const p1 = projected[conn[0]];
      const p2 = projected[conn[1]];

      const pulseX = p1.x + (p2.x - p1.x) * pulse.progress;
      const pulseY = p1.y + (p2.y - p1.y) * pulse.progress;

      ctx.beginPath();
      ctx.arc(pulseX, pulseY, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 107, 43, 0.95)';
      ctx.shadowColor = 'var(--primary)';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    projected.forEach((p) => {
      if (p.type === 'chip') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ff8855';
        ctx.fill();
      } else if (p.type === 'node') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();
      }
    });

    requestAnimationFrame(rotate3D);
  }

  rotate3D();
}

/* ==========================================================================
   4. DYNAMIC TEXT CYCLER
   ========================================================================== */
function initTextCycler() {
  const dynamicText = document.getElementById('dynamic-text');
  if (!dynamicText) return;

  const phraseList = [
    "I Design.",
    "I Develop.",
    "I Engineer.",
    "I Build with AI."
  ];

  let currentPhraseIdx = 0;

  function cycle() {
    dynamicText.style.opacity = 0;
    dynamicText.style.transform = 'translateY(10px)';

    setTimeout(() => {
      currentPhraseIdx = (currentPhraseIdx + 1) % phraseList.length;
      dynamicText.textContent = phraseList[currentPhraseIdx];
      dynamicText.style.opacity = 1;
      dynamicText.style.transform = 'translateY(0)';
    }, 400);
  }

  dynamicText.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
  setInterval(cycle, 3000);
}

/* ==========================================================================
   5. SCROLL REVEAL & INTERSECTION OBSERVERS
   ========================================================================== */
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal-reveal');

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  const header = document.getElementById('main-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  const mobileToggle = document.getElementById('mobile-toggle');
  const navMenu = document.getElementById('nav-menu');
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      mobileToggle.classList.toggle('active');
      navMenu.classList.toggle('active');
    });

    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileToggle.classList.remove('active');
        navMenu.classList.remove('active');
      });
    });
  }

  const skillsSection = document.getElementById('skills');
  if (skillsSection) {
    const skillsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateSkillBars();
          skillsObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    skillsObserver.observe(skillsSection);
  }
}

function animateSkillBars() {
  const skillItems = document.querySelectorAll('.skill-item');
  skillItems.forEach(item => {
    const percent = item.getAttribute('data-percent');
    const progressBar = item.querySelector('.skill-progress');
    if (progressBar) {
      setTimeout(() => {
        progressBar.style.width = `${percent}%`;
      }, 150);
    }
  });
}

/* ==========================================================================
   6. INTERACTIVE PROJECT FILTERING
   ========================================================================== */
function initProjectFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      const filter = button.getAttribute('data-filter');
      filterProjects(filter);
    });
  });
}

function filterProjects(filter) {
  const projectCards = document.querySelectorAll('.project-card');
  projectCards.forEach(card => {
    const category = card.getAttribute('data-category');

    if (filter === 'all' || category === filter) {
      card.classList.remove('filtered-out');
      setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'scale(1)';
      }, 50);
    } else {
      card.style.opacity = '0';
      card.style.transform = 'scale(0.95)';
      setTimeout(() => {
        card.classList.add('filtered-out');
      }, 300);
    }
  });
}

/* ==========================================================================
   7. CONTACT FORM VALIDATION & TRANSMISSION
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const nameInput = document.getElementById('form-name');
  const emailInput = document.getElementById('form-email');
  const messageInput = document.getElementById('form-message');
  const submitBtn = document.getElementById('btn-submit');
  const successBanner = document.getElementById('form-success');

  nameInput.addEventListener('input', () => validateField(nameInput, 'name-error'));
  emailInput.addEventListener('input', () => validateField(emailInput, 'email-error', true));
  messageInput.addEventListener('input', () => validateField(messageInput, 'message-error'));

  function validateField(input, errorId, isEmail = false) {
    const errorEl = document.getElementById(errorId);
    let isValid = true;

    if (input.value.trim() === '') {
      isValid = false;
    } else if (isEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      isValid = emailRegex.test(input.value.trim());
    }

    if (isValid) {
      input.closest('.form-group').classList.remove('invalid');
      if (errorEl) errorEl.style.display = 'none';
    } else {
      input.closest('.form-group').classList.add('invalid');
    }

    return isValid;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const isNameValid = validateField(nameInput, 'name-error');
    const isEmailValid = validateField(emailInput, 'email-error', true);
    const isMessageValid = validateField(messageInput, 'message-error');

    if (isNameValid && isEmailValid && isMessageValid) {
      // Check honeypot for spam bots
      const honeyInput = document.getElementById('form-honey');
      if (honeyInput && honeyInput.value.trim() !== '') {
        console.warn("[SYSTEM] Spam bot detected (honeypot triggered). Form submission simulated.");
        // Simulate a successful submission to fool the bot
        submitBtn.disabled = true;
        const origText = submitBtn.innerHTML;
        submitBtn.innerHTML = `<span>TRANSMITTING...</span> <i class="fa-solid fa-satellite-dish fa-spin"></i>`;
        setTimeout(() => {
          submitBtn.innerHTML = `<span>TRANSMITTED</span> <i class="fa-solid fa-check"></i>`;
          successBanner.classList.add('active');
          form.reset();
          document.querySelectorAll('.form-group').forEach(group => group.classList.remove('invalid'));
          setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = origText;
            successBanner.classList.remove('active');
          }, 5000);
        }, 1000);
        return;
      }

      submitBtn.disabled = true;
      const origText = submitBtn.innerHTML;
      submitBtn.innerHTML = `<span>TRANSMITTING...</span> <i class="fa-solid fa-satellite-dish fa-spin"></i>`;

      const subjectInput = document.getElementById('form-subject');
      const subject = subjectInput ? subjectInput.value : `[Portfolio Connect] Message from ${nameInput.value.trim()}`;

      // Call FormSubmit API
      fetch("https://formsubmit.co/ajax/muhammedshibilmp1401@gmail.com", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          name: nameInput.value.trim(),
          email: emailInput.value.trim(),
          message: messageInput.value.trim(),
          _subject: subject
        })
      })
        .then(response => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then(data => {
          console.log("[SYSTEM] FormSubmit success:", data);
          submitBtn.innerHTML = `<span>TRANSMITTED</span> <i class="fa-solid fa-check"></i>`;
          successBanner.classList.add('active');
          form.reset();

          document.querySelectorAll('.form-group').forEach(group => group.classList.remove('invalid'));

          setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = origText;
            successBanner.classList.remove('active');
          }, 5000);
        })
        .catch(error => {
          console.error("[SYSTEM] FormSubmit error:", error);
          // Visual indicator of error
          submitBtn.innerHTML = `<span>TRANSMISSION FAILED</span> <i class="fa-solid fa-triangle-exclamation"></i>`;
          alert("Oops! There was a problem transmitting your message. Please check your internet connection and try again.");
          setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = origText;
          }, 5000);
        });
    } else {
      if (!isNameValid) document.getElementById('name-error').style.display = 'block';
      if (!isEmailValid) document.getElementById('email-error').style.display = 'block';
      if (!isMessageValid) document.getElementById('message-error').style.display = 'block';
    }
  });
}

/* ==========================================================================
   8. CLIENT-SIDE ADMIN PANEL & CRUD SYSTEM
   ========================================================================== */
function initAdminDashboard() {
  const loginModal = document.getElementById("admin-login-modal");
  const loginClose = document.getElementById("login-modal-close");
  const loginForm = document.getElementById("admin-login-form");
  const loginError = document.getElementById("login-error-msg");
  const adminHeaderTrigger = document.getElementById("admin-header-trigger");
  const adminFooterTrigger = document.getElementById("admin-footer-status");

  const editorModal = document.getElementById("project-editor-modal");
  const editorClose = document.getElementById("editor-modal-close");
  const editorForm = document.getElementById("project-editor-form");
  const editorCancel = document.getElementById("btn-editor-cancel");

  const exportModal = document.getElementById("project-export-modal");
  const exportClose = document.getElementById("export-modal-close");
  const btnExportHtml = document.getElementById("btn-export-html");
  const btnCopyExport = document.getElementById("btn-copy-export");
  const exportTextarea = document.getElementById("export-textarea");

  const btnAddProject = document.getElementById("btn-add-project");
  const btnAdminLogout = document.getElementById("btn-admin-logout");

  const skillModal = document.getElementById("skill-editor-modal");
  const skillClose = document.getElementById("skill-modal-close");
  const skillForm = document.getElementById("skill-editor-form");
  const skillCancel = document.getElementById("btn-skill-cancel");
  const btnAddSkill = document.getElementById("btn-add-skill");

  const timelineModal = document.getElementById("timeline-editor-modal");
  const timelineClose = document.getElementById("timeline-modal-close");
  const timelineForm = document.getElementById("timeline-editor-form");
  const timelineCancel = document.getElementById("btn-timeline-cancel");
  const btnAddTimeline = document.getElementById("btn-add-timeline");

  // --- MODAL TRIGGERS ---
  const toggleLoginModal = (show) => {
    if (show) {
      if (document.body.classList.contains("admin-active")) {
        // Already logged in, clicking trigger should prompt log out
        if (confirm("Would you like to log out of Admin mode?")) {
          adminLogout();
        }
      } else {
        loginModal.classList.add("active");
        loginError.style.display = "none";
        loginForm.reset();
      }
    } else {
      loginModal.classList.remove("active");
    }
  };

  if (adminHeaderTrigger) adminHeaderTrigger.addEventListener("click", () => toggleLoginModal(true));
  if (adminFooterTrigger) adminFooterTrigger.addEventListener("click", () => toggleLoginModal(true));
  if (loginClose) loginClose.addEventListener("click", () => toggleLoginModal(false));

  // --- LOGIN SUBMISSION ---
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("admin-email").value.trim();
      const password = document.getElementById("admin-password").value.trim();
      const loginSubmitBtn = document.getElementById("btn-login-submit");

      const origBtnHTML = loginSubmitBtn.innerHTML;
      loginSubmitBtn.disabled = true;
      loginSubmitBtn.innerHTML = `<span>DECRYPTING...</span> <i class="fa-solid fa-microchip fa-spin"></i>`;
      loginError.style.display = "none";

      if (isFirebaseEnabled) {
        // Firebase Cloud auth
        auth.signInWithEmailAndPassword(email, password)
          .then((userCredential) => {
            toggleLoginModal(false);
            loginSubmitBtn.disabled = false;
            loginSubmitBtn.innerHTML = origBtnHTML;
          })
          .catch((error) => {
            console.error("Firebase Login failed:", error);
            loginError.textContent = `ACCESS DENIED: ${error.message}`;
            loginError.style.display = "block";
            loginSubmitBtn.disabled = false;
            loginSubmitBtn.innerHTML = origBtnHTML;
          });
      } else {
        // Sandbox fallback Auth
        setTimeout(() => {
          if (email === "admin@shibili.dev" && password === "shibili2026") {
            sessionStorage.setItem("shibili_admin_logged_in", "true");
            setAdminState(true);
            toggleLoginModal(false);
          } else {
            loginError.textContent = "ACCESS DENIED: Invalid Decryption Key or Username";
            loginError.style.display = "block";
          }
          loginSubmitBtn.disabled = false;
          loginSubmitBtn.innerHTML = origBtnHTML;
        }, 1200);
      }
    });
  }

  // --- ADMIN SYSTEM LOGOUT ---
  function adminLogout() {
    if (isFirebaseEnabled) {
      auth.signOut().then(() => {
        setAdminState(false);
      });
    } else {
      sessionStorage.removeItem("shibili_admin_logged_in");
      setAdminState(false);
    }
  }
  if (btnAdminLogout) btnAdminLogout.addEventListener("click", adminLogout);

  // --- OPEN ADD PROJECT MODAL ---
  if (btnAddProject) {
    btnAddProject.addEventListener("click", () => {
      document.getElementById("editor-project-id").value = "";
      document.getElementById("editor-modal-title").textContent = "CREATE_NEW_PROJECT.sys";
      editorForm.reset();

      // Reset upload state
      currentUploadUrl = null;
      isCurrentlyUploading = false;

      // Clear progress
      document.getElementById("upload-progress-container").style.display = "none";
      document.getElementById("upload-progress-fill").style.width = "0%";

      editorModal.classList.add("active");
    });
  }

  if (editorClose) editorClose.addEventListener("click", () => editorModal.classList.remove("active"));
  if (editorCancel) editorCancel.addEventListener("click", () => editorModal.classList.remove("active"));

  // --- OPEN ADD SKILL MODAL ---
  if (btnAddSkill) {
    btnAddSkill.addEventListener("click", () => {
      document.getElementById("editor-skill-id").value = "";
      document.getElementById("skill-modal-title").textContent = "CREATE_NEW_SKILL.sys";
      skillForm.reset();
      skillModal.classList.add("active");
    });
  }

  if (skillClose) skillClose.addEventListener("click", () => skillModal.classList.remove("active"));
  if (skillCancel) skillCancel.addEventListener("click", () => skillModal.classList.remove("active"));

  // --- OPEN ADD TIMELINE MODAL ---
  if (btnAddTimeline) {
    btnAddTimeline.addEventListener("click", () => {
      document.getElementById("editor-timeline-id").value = "";
      document.getElementById("timeline-modal-title").textContent = "CREATE_TIMELINE_ITEM.sys";
      timelineForm.reset();
      timelineModal.classList.add("active");
    });
  }

  if (timelineClose) timelineClose.addEventListener("click", () => timelineModal.classList.remove("active"));
  if (timelineCancel) timelineCancel.addEventListener("click", () => timelineModal.classList.remove("active"));

  // --- IMAGE COMPRESSION UTILITY ---
  function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.75) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error("Canvas compression failed"));
            },
            "image/jpeg",
            quality
          );
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  }

  // --- UPLOAD FILE IMMEDIATELY ON FILE SELECT ---
  const fileInput = document.getElementById("editor-image-file");
  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const progressContainer = document.getElementById("upload-progress-container");
      const progressPercent = document.getElementById("upload-progress-percent");
      const progressFill = document.getElementById("upload-progress-fill");

      isCurrentlyUploading = true;
      progressContainer.style.display = "block";
      progressPercent.textContent = "Compressing image...";
      progressFill.style.width = "10%";

      if (isFirebaseEnabled) {
        // Free Option: Compress image and convert it to Base64 to save directly in Firestore
        // (Bypasses Firebase Storage entirely so you can stay on the 100% free Spark plan)
        compressImage(file, 600, 600, 0.6)
          .then((compressedBlob) => {
            progressPercent.textContent = "Processing image...";
            progressFill.style.width = "50%";

            const reader = new FileReader();
            reader.onload = function (event) {
              currentUploadUrl = event.target.result;
              isCurrentlyUploading = false;
              progressPercent.textContent = "Ready to Save (Optimized Base64)";
              progressFill.style.width = "100%";
            };
            reader.onerror = function (err) {
              console.error("FileReader failed:", err);
              alert("Processing image failed: " + err.message);
              isCurrentlyUploading = false;
              progressPercent.textContent = "Processing failed";
            };
            reader.readAsDataURL(compressedBlob);
          })
          .catch((err) => {
            console.error("Compression failed, using original file as Base64:", err);
            progressPercent.textContent = "Converting original file...";
            progressFill.style.width = "50%";

            const reader = new FileReader();
            reader.onload = function (event) {
              currentUploadUrl = event.target.result;
              isCurrentlyUploading = false;
              progressPercent.textContent = "Ready to Save (Base64)";
              progressFill.style.width = "100%";
            };
            reader.onerror = function (err) {
              console.error("FileReader failed:", err);
              alert("Processing image failed: " + err.message);
              isCurrentlyUploading = false;
              progressPercent.textContent = "Processing failed";
            };
            reader.readAsDataURL(file);
          });
      } else {
        // Sandbox FileReader base64 fallback
        const reader = new FileReader();
        reader.onload = function (event) {
          currentUploadUrl = event.target.result;
          isCurrentlyUploading = false;
          progressPercent.textContent = "Sandbox Mode: Load Complete!";
          progressFill.style.width = "100%";
        };
        reader.onerror = function (err) {
          console.error("FileReader failed:", err);
          isCurrentlyUploading = false;
          progressPercent.textContent = "Load failed";
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // --- SAVE/EDIT PROJECT FORM ---
  if (editorForm) {
    editorForm.addEventListener("submit", (e) => {
      e.preventDefault();

      if (isCurrentlyUploading) {
        alert("Please wait for the image to finish uploading before saving.");
        return;
      }

      const id = document.getElementById("editor-project-id").value;
      const title = document.getElementById("editor-title").value.trim();
      const category = document.getElementById("editor-category").value;
      const desc = document.getElementById("editor-desc").value.trim();
      const tech = document.getElementById("editor-tech").value.trim();
      const demo = document.getElementById("editor-demo").value.trim();
      const repo = document.getElementById("editor-repo").value.trim();

      const saveBtn = document.getElementById("btn-editor-save");
      const origSaveText = saveBtn.innerHTML;

      saveBtn.disabled = true;
      saveBtn.innerHTML = `<span>SAVING CONFIG...</span> <i class="fa-solid fa-spinner fa-spin"></i>`;

      const processSave = (imageUrl) => {
        // If updating an existing card
        if (id) {
          const originalProj = projects.find(p => p.id === id);
          const finalImage = imageUrl || (originalProj ? originalProj.image : "assets/electronics.png");

          const updatedRecord = {
            id: id,
            title: title,
            category: category,
            desc: desc,
            tech: tech,
            demo: demo,
            repo: repo,
            image: finalImage
          };

          if (isFirebaseEnabled) {
            db.collection("projects").doc(originalProj.firebaseId).update(updatedRecord)
              .catch(err => alert("Firestore update failed: " + err));
            finishSave();
          } else {
            const index = projects.findIndex(p => p.id === id);
            projects[index] = updatedRecord;
            localStorage.setItem("shibili_projects", JSON.stringify(projects));
            renderProjectsGrid(projects);
            finishSave();
          }
        }
        // If creating a new card
        else {
          const newId = (projects.length > 0) ? (Math.max(...projects.map(p => parseInt(p.id))) + 1).toString() : "1";
          const finalImage = imageUrl || "assets/electronics.png";

          const newRecord = {
            id: newId,
            title: title,
            category: category,
            desc: desc,
            tech: tech,
            demo: demo,
            repo: repo,
            image: finalImage
          };

          if (isFirebaseEnabled) {
            db.collection("projects").add(newRecord)
              .catch(err => alert("Firestore write failed: " + err));
            finishSave();
          } else {
            projects.push(newRecord);
            localStorage.setItem("shibili_projects", JSON.stringify(projects));
            renderProjectsGrid(projects);
            finishSave();
          }
        }
      };

      function finishSave() {
        saveBtn.disabled = false;
        saveBtn.innerHTML = origSaveText;
        editorModal.classList.remove("active");
      }

      // Process save immediately using pre-uploaded image URL
      processSave(currentUploadUrl);
    });
  }

  // --- SAVE/EDIT SKILL FORM ---
  if (skillForm) {
    skillForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const id = document.getElementById("editor-skill-id").value;
      const name = document.getElementById("editor-skill-name").value.trim();
      const percent = parseInt(document.getElementById("editor-skill-percent").value);
      const category = document.getElementById("editor-skill-category").value;

      const saveBtn = document.getElementById("btn-skill-save");
      const origSaveText = saveBtn.innerHTML;

      saveBtn.disabled = true;
      saveBtn.innerHTML = `<span>SAVING...</span> <i class="fa-solid fa-spinner fa-spin"></i>`;

      const record = {
        name: name,
        percent: percent,
        category: category
      };

      if (id) {
        // Edit existing skill
        record.id = id;
        const originalSkill = skills.find(s => s.id === id);

        if (isFirebaseEnabled) {
          db.collection("skills").doc(originalSkill.firebaseId).update(record)
            .then(() => finishSave())
            .catch(err => alert("Firestore update failed: " + err));
        } else {
          const index = skills.findIndex(s => s.id === id);
          skills[index] = record;
          localStorage.setItem("shibili_skills", JSON.stringify(skills));
          renderSkills(skills);
          finishSave();
        }
      } else {
        // Create new skill
        const newId = (skills.length > 0) ? "s" + (Math.max(...skills.map(s => parseInt(s.id.replace("s", "")))) + 1).toString() : "s1";
        record.id = newId;

        if (isFirebaseEnabled) {
          db.collection("skills").add(record)
            .then(() => finishSave())
            .catch(err => alert("Firestore write failed: " + err));
        } else {
          skills.push(record);
          localStorage.setItem("shibili_skills", JSON.stringify(skills));
          renderSkills(skills);
          finishSave();
        }
      }

      function finishSave() {
        saveBtn.disabled = false;
        saveBtn.innerHTML = origSaveText;
        skillModal.classList.remove("active");
      }
    });
  }

  // --- SAVE/EDIT TIMELINE FORM ---
  if (timelineForm) {
    timelineForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const id = document.getElementById("editor-timeline-id").value;
      const type = document.getElementById("editor-timeline-type").value;
      const date = document.getElementById("editor-timeline-date").value.trim();
      const title = document.getElementById("editor-timeline-title").value.trim();
      const institution = document.getElementById("editor-timeline-institution").value.trim();
      const subInfo = document.getElementById("editor-timeline-subinfo").value.trim();
      const detailsText = document.getElementById("editor-timeline-details").value.trim();

      // Split bullet points by line breaks
      const details = detailsText ? detailsText.split("\n").map(line => line.trim()).filter(line => line !== "") : [];

      const saveBtn = document.getElementById("btn-timeline-save");
      const origSaveText = saveBtn.innerHTML;

      saveBtn.disabled = true;
      saveBtn.innerHTML = `<span>SAVING...</span> <i class="fa-solid fa-spinner fa-spin"></i>`;

      const record = {
        type: type,
        date: date,
        title: title,
        institution: institution,
        subInfo: subInfo,
        details: details
      };

      if (id) {
        // Edit existing timeline item
        record.id = id;
        const originalItem = timeline.find(t => t.id === id);

        if (isFirebaseEnabled) {
          db.collection("timeline").doc(originalItem.firebaseId).update(record)
            .then(() => finishSave())
            .catch(err => alert("Firestore update failed: " + err));
        } else {
          const index = timeline.findIndex(t => t.id === id);
          timeline[index] = record;
          localStorage.setItem("shibili_timeline", JSON.stringify(timeline));
          renderTimeline(timeline);
          finishSave();
        }
      } else {
        // Create new timeline item
        const newId = (timeline.length > 0) ? "t" + (Math.max(...timeline.map(t => parseInt(t.id.replace("t", "")))) + 1).toString() : "t1";
        record.id = newId;

        if (isFirebaseEnabled) {
          db.collection("timeline").add(record)
            .then(() => finishSave())
            .catch(err => alert("Firestore write failed: " + err));
        } else {
          timeline.push(record);
          localStorage.setItem("shibili_timeline", JSON.stringify(timeline));
          renderTimeline(timeline);
          finishSave();
        }
      }

      function finishSave() {
        saveBtn.disabled = false;
        saveBtn.innerHTML = origSaveText;
        timelineModal.classList.remove("active");
      }
    });
  }

  // --- EXPORT PROJECTS GRID HTML ---
  if (btnExportHtml) {
    btnExportHtml.addEventListener("click", () => {
      let exportHTML = "";

      projects.forEach((proj, index) => {
        // Prepare tags list
        const tagsHTML = proj.tech.split(',').map(tag => `\n              <span class="tech-tag">${tag.trim()}</span>`).join('');

        exportHTML += `        <!-- Project ${index + 1}: ${proj.title} -->
        <div class="project-card glass-panel reveal-reveal revealed" data-category="${proj.category}">
          <div class="project-img-wrapper">
            <img src="${proj.image}" alt="${proj.title}" class="project-img">
            <div class="project-overlay">
              <span class="system-id">SYS_REF: ${proj.title.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_V1</span>
            </div>
          </div>
          <div class="project-content">
            <h3 class="project-title">${proj.title}</h3>
            <p class="project-desc">
              ${proj.desc}
            </p>
            <div class="project-tech">${tagsHTML}
            </div>
            <div class="project-links">
              <a href="${proj.demo || '#'}" class="btn btn-icon" aria-label="Live Demo"><i
                  class="fa-solid fa-arrow-up-right-from-square"></i> Demo</a>
              <a href="${proj.repo || '#'}" class="btn btn-icon-outline" aria-label="GitHub Repository"><i
                  class="fa-brands fa-github"></i> Repository</a>
            </div>
          </div>
        </div>\n\n`;
      });

      exportTextarea.value = exportHTML;
      document.getElementById("copy-success-text").style.display = "none";
      exportModal.classList.add("active");
    });
  }

  if (exportClose) exportClose.addEventListener("click", () => exportModal.classList.remove("active"));

  if (btnCopyExport) {
    btnCopyExport.addEventListener("click", () => {
      exportTextarea.select();
      document.execCommand("copy");
      document.getElementById("copy-success-text").style.display = "block";
    });
  }
}

// Set visual theme toggles when logged in as admin
function setAdminState(isLoggedIn) {
  const footerStatus = document.getElementById("admin-footer-status");
  const actionsBar = document.getElementById("admin-actions-bar");

  if (isLoggedIn) {
    document.body.classList.add("admin-active");
    if (footerStatus) {
      footerStatus.textContent = "ACTIVE";
      footerStatus.className = "status-unlocked";
    }
    if (actionsBar) actionsBar.style.display = "flex";

    // Update Firebase connection status badge
    const statusDot = document.getElementById("firebase-status-dot");
    const statusText = document.getElementById("firebase-status-text");
    if (statusDot && statusText) {
      if (isFirebaseEnabled) {
        statusDot.style.backgroundColor = "#10b981"; // neon green
        statusDot.style.boxShadow = "0 0 10px #10b981";
        statusText.textContent = "CLOUD DB ONLINE (FIREBASE)";
        statusText.style.color = "#10b981";
      } else {
        statusDot.style.backgroundColor = "#ff6b2b"; // custom theme orange/amber
        statusDot.style.boxShadow = "0 0 10px #ff6b2b";
        statusText.textContent = "LOCAL SANDBOX MODE";
        statusText.style.color = "#ff6b2b";
      }
    }
  } else {
    document.body.classList.remove("admin-active");
    if (footerStatus) {
      footerStatus.textContent = "LOCKED";
      footerStatus.className = "status-locked";
    }
    if (actionsBar) actionsBar.style.display = "none";
  }

  // Refresh dynamic grids to toggle overlay buttons
  renderProjectsGrid(projects);
  renderSkills(skills);
  renderTimeline(timeline);
}

// Global functions exposed to inline events
function openProjectEditor(id) {
  const proj = projects.find(p => p.id === id);
  if (!proj) return;

  document.getElementById("editor-project-id").value = proj.id;
  document.getElementById("editor-modal-title").textContent = "EDIT_PROJECT_CONFIG.sys";
  document.getElementById("editor-title").value = proj.title;
  document.getElementById("editor-category").value = proj.category;
  document.getElementById("editor-desc").value = proj.desc;
  document.getElementById("editor-tech").value = proj.tech;
  document.getElementById("editor-demo").value = proj.demo;
  document.getElementById("editor-repo").value = proj.repo;

  // Reset upload state to current project image
  currentUploadUrl = proj.image || null;
  isCurrentlyUploading = false;

  // Clear progress
  document.getElementById("upload-progress-container").style.display = "none";
  document.getElementById("upload-progress-fill").style.width = "0%";

  document.getElementById("project-editor-modal").classList.add("active");
}

function deleteProject(id) {
  if (confirm("Are you sure you want to delete this project from the database? This action is irreversible.")) {
    if (isFirebaseEnabled) {
      const proj = projects.find(p => p.id === id);
      db.collection("projects").doc(proj.firebaseId).delete()
        .catch(err => alert("Firestore delete failed: " + err));
    } else {
      projects = projects.filter(p => p.id !== id);
      localStorage.setItem("shibili_projects", JSON.stringify(projects));
      renderProjectsGrid(projects);
    }
  }
}

function openSkillEditor(id) {
  const skill = skills.find(s => s.id === id);
  if (!skill) return;

  document.getElementById("editor-skill-id").value = skill.id;
  document.getElementById("skill-modal-title").textContent = "EDIT_SKILL_CONFIG.sys";
  document.getElementById("editor-skill-name").value = skill.name;
  document.getElementById("editor-skill-percent").value = skill.percent;
  document.getElementById("editor-skill-category").value = skill.category;

  document.getElementById("skill-editor-modal").classList.add("active");
}

function deleteSkill(id) {
  if (confirm("Are you sure you want to delete this skill? This action is irreversible.")) {
    if (isFirebaseEnabled) {
      const skill = skills.find(s => s.id === id);
      db.collection("skills").doc(skill.firebaseId).delete()
        .catch(err => alert("Firestore delete failed: " + err));
    } else {
      skills = skills.filter(s => s.id !== id);
      localStorage.setItem("shibili_skills", JSON.stringify(skills));
      renderSkills(skills);
    }
  }
}

function openTimelineEditor(id) {
  const item = timeline.find(t => t.id === id);
  if (!item) return;

  document.getElementById("editor-timeline-id").value = item.id;
  document.getElementById("timeline-modal-title").textContent = "EDIT_TIMELINE_CONFIG.sys";
  document.getElementById("editor-timeline-type").value = item.type;
  document.getElementById("editor-timeline-date").value = item.date;
  document.getElementById("editor-timeline-title").value = item.title;
  document.getElementById("editor-timeline-institution").value = item.institution || "";
  document.getElementById("editor-timeline-subinfo").value = item.subInfo || "";
  document.getElementById("editor-timeline-details").value = item.details ? item.details.join("\n") : "";

  document.getElementById("timeline-editor-modal").classList.add("active");
}

function deleteTimeline(id) {
  if (confirm("Are you sure you want to delete this timeline item? This action is irreversible.")) {
    if (isFirebaseEnabled) {
      const item = timeline.find(t => t.id === id);
      db.collection("timeline").doc(item.firebaseId).delete()
        .catch(err => alert("Firestore delete failed: " + err));
    } else {
      timeline = timeline.filter(t => t.id !== id);
      localStorage.setItem("shibili_timeline", JSON.stringify(timeline));
      renderTimeline(timeline);
    }
  }
}

// Expose functions globally for dynamic elements
window.openProjectEditor = openProjectEditor;
window.deleteProject = deleteProject;
window.openSkillEditor = openSkillEditor;
window.deleteSkill = deleteSkill;
window.openTimelineEditor = openTimelineEditor;
window.deleteTimeline = deleteTimeline;
