"use strict";

window.addEventListener("load", () => {
  setTimeout(() => {
    const loader = document.getElementById("pageLoader");
    if (loader) loader.classList.add("hidden");
  }, 2200);
});

const cursorDot  = document.getElementById("cursorDot");
const cursorRing = document.getElementById("cursorRing");

let mouseX = 0, mouseY = 0;
let ringX  = 0, ringY  = 0;

window.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  if (cursorDot) {
    cursorDot.style.left  = mouseX + "px";
    cursorDot.style.top   = mouseY + "px";
  }
});

function animateRing() {
  ringX += (mouseX - ringX) * 0.12;
  ringY += (mouseY - ringY) * 0.12;
  if (cursorRing) {
    cursorRing.style.left = ringX + "px";
    cursorRing.style.top  = ringY + "px";
  }
  requestAnimationFrame(animateRing);
}
animateRing();

document.querySelectorAll("a, button, .skill-card, .tool-card, .cert-card, .project-category-card, .platform-card, .testi-btn").forEach(el => {
  el.addEventListener("mouseenter", () => cursorRing && cursorRing.classList.add("expand"));
  el.addEventListener("mouseleave", () => cursorRing && cursorRing.classList.remove("expand"));
});

document.addEventListener("mouseleave", () => {
  if (cursorDot)  cursorDot.style.opacity  = "0";
  if (cursorRing) cursorRing.style.opacity = "0";
});
document.addEventListener("mouseenter", () => {
  if (cursorDot)  cursorDot.style.opacity  = "1";
  if (cursorRing) cursorRing.style.opacity = "0.6";
});

const themeToggle = document.getElementById("themeToggle");
const html = document.documentElement;

const savedTheme = localStorage.getItem("vydFntTheme") || "dark";
html.setAttribute("data-theme", savedTheme);

themeToggle && themeToggle.addEventListener("click", () => {
  const current = html.getAttribute("data-theme");
  const next    = current === "dark" ? "light" : "dark";

  document.body.classList.add("theme-flash");
  setTimeout(() => document.body.classList.remove("theme-flash"), 400);

  html.setAttribute("data-theme", next);
  localStorage.setItem("vydFntTheme", next);
});

const navbar = document.getElementById("navbar");
const navLinks = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll("section[id]");

window.addEventListener("scroll", () => {
  if (navbar) {
    navbar.classList.toggle("scrolled", window.scrollY > 50);
  }

  let current = "";
  sections.forEach(sec => {
    const top = sec.offsetTop - 100;
    if (window.scrollY >= top) current = sec.getAttribute("id");
  });
  navLinks.forEach(link => {
    link.classList.remove("active");
    if (link.getAttribute("href") === "#" + current) link.classList.add("active");
  });
}, { passive: true });

const hamburger = document.getElementById("hamburger");
const navMenu   = document.getElementById("navMenu");

hamburger && hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("active");
  navMenu.classList.toggle("open");
});

navLinks.forEach(link => {
  link.addEventListener("click", () => {
    hamburger && hamburger.classList.remove("active");
    navMenu  && navMenu.classList.remove("open");
  });
});

function revealOnScroll() {
  const elements = document.querySelectorAll("[data-aos]");
  const windowH  = window.innerHeight;

  elements.forEach(el => {
    const delay  = parseInt(el.getAttribute("data-aos-delay") || "0");
    const rect   = el.getBoundingClientRect();
    const inView = rect.top < windowH - 80;

    if (inView && !el.classList.contains("aos-animate")) {
      setTimeout(() => el.classList.add("aos-animate"), delay);
    }
  });
}

window.addEventListener("scroll", revealOnScroll, { passive: true });
window.addEventListener("resize", revealOnScroll, { passive: true });
setTimeout(revealOnScroll, 300);

function animateCounter(el, target, duration = 1500) {
  let start     = 0;
  const step    = target / (duration / 16);
  const timer   = setInterval(() => {
    start += step;
    if (start >= target) {
      el.textContent = target + "+";
      clearInterval(timer);
    } else {
      el.textContent = Math.floor(start);
    }
  }, 16);
}

function initCounters() {
  const counters = document.querySelectorAll(".stat-num[data-count]");
  counters.forEach(counter => {
    const target = parseInt(counter.getAttribute("data-count"));
    const rect   = counter.getBoundingClientRect();
    if (rect.top < window.innerHeight - 50 && !counter.classList.contains("counted")) {
      counter.classList.add("counted");
      animateCounter(counter, target);
    }
  });
}

window.addEventListener("scroll", initCounters, { passive: true });
setTimeout(initCounters, 800);

function animateSkillBars() {
  const fills = document.querySelectorAll(".skill-fill[data-width]");
  fills.forEach(fill => {
    const rect = fill.getBoundingClientRect();
    if (rect.top < window.innerHeight - 50 && !fill.classList.contains("animated")) {
      fill.classList.add("animated");
      const width = fill.getAttribute("data-width");
      setTimeout(() => {
        fill.style.width = width + "%";
      }, 200);
    }
  });
}

window.addEventListener("scroll", animateSkillBars, { passive: true });
setTimeout(animateSkillBars, 800);

const roleItems = document.querySelectorAll(".role-item");
let currentRole = 0;

function rotateRoles() {
  if (!roleItems.length) return;

  roleItems[currentRole].classList.remove("active");
  roleItems[currentRole].classList.add("exit");

  setTimeout(() => {
    roleItems[currentRole].classList.remove("exit");
    currentRole = (currentRole + 1) % roleItems.length;
    roleItems[currentRole].classList.add("active");
  }, 500);
}

setInterval(rotateRoles, 3000);

const filterBtns = document.querySelectorAll(".filter-btn");
const projectCards = document.querySelectorAll(".project-category-card");

filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    // Update active button
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const filter = btn.getAttribute("data-filter");

    projectCards.forEach((card, idx) => {
      const category = card.getAttribute("data-category");
      const show = filter === "all" || category === filter;

      if (show) {
        card.style.display = "";
        setTimeout(() => {
          card.style.opacity  = "1";
          card.style.transform = "";
        }, idx * 60);
      } else {
        card.style.opacity  = "0";
        card.style.transform = "scale(0.9)";
        setTimeout(() => {
          card.style.display = "none";
        }, 300);
      }
    });
  });
});

(function initTestiSlider() {
  const track    = document.getElementById("testiTrack");
  const dotsWrap = document.getElementById("testiDots");
  const prevBtn  = document.getElementById("testiPrev");
  const nextBtn  = document.getElementById("testiNext");
  if (!track) return;

  const slides = track.querySelectorAll(".testi-slide");
  const total  = slides.length;
  let current  = 0;
  let autoTimer;

  function buildDots() {
    dotsWrap.innerHTML = "";
    slides.forEach((_, i) => {
      const d = document.createElement("button");
      d.className = "testi-dot" + (i === 0 ? " active" : "");
      d.setAttribute("aria-label", "Testimoni " + (i + 1));
      d.addEventListener("click", () => goTo(i));
      dotsWrap.appendChild(d);
    });
  }

  function updateDots(idx) {
    dotsWrap.querySelectorAll(".testi-dot").forEach((d, i) =>
      d.classList.toggle("active", i === idx));
  }

  function goTo(idx) {
    current = (idx + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
    updateDots(current);
    resetAuto();
  }

  function resetAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => goTo(current + 1), 5000);
  }

  buildDots();
  resetAuto();

  prevBtn && prevBtn.addEventListener("click", () => goTo(current - 1));
  nextBtn && nextBtn.addEventListener("click", () => goTo(current + 1));

  document.addEventListener("keydown", e => {
    const inView = track.getBoundingClientRect();
    if (inView.top > window.innerHeight || inView.bottom < 0) return;
    if (e.key === "ArrowLeft")  goTo(current - 1);
    if (e.key === "ArrowRight") goTo(current + 1);
  });

  let startX = 0;
  track.addEventListener("touchstart", e => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener("touchend",   e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) goTo(current + (diff > 0 ? 1 : -1));
  });
})();

const contactForm = document.getElementById("contactForm");
const toast       = document.getElementById("toast");
const toastMsg    = document.getElementById("toastMsg");

function showToast(message, type = "success") {
  if (!toast) return;
  toastMsg.textContent = message;
  toast.querySelector("i").className = type === "success"
    ? "fa-solid fa-check-circle"
    : "fa-solid fa-exclamation-circle";
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3500);
}

contactForm && contactForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const name    = contactForm.querySelector("#name").value.trim();
  const email   = contactForm.querySelector("#email").value.trim();
  const message = contactForm.querySelector("#message").value.trim();

  if (!name || !email || !message) {
    showToast("Mohon lengkapi semua field yang diperlukan.", "error");
    return;
  }

  const submitBtn = contactForm.querySelector("button[type='submit']");
  submitBtn.disabled = true;
  submitBtn.querySelector("span").textContent = "Mengirim...";

  setTimeout(() => {
    submitBtn.disabled = false;
    submitBtn.querySelector("span").textContent = "Kirim Pesan";
    contactForm.reset();
    showToast("Pesan berhasil dikirim! Terima kasih " + name + " 🎉");
  }, 1500);
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", (e) => {
    const target = document.querySelector(anchor.getAttribute("href"));
    if (target) {
      e.preventDefault();
      const offset = 80; // navbar height
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  });
});

function createParticles() {
  const hero = document.querySelector(".hero-bg");
  if (!hero) return;

  const count = 20;
  for (let i = 0; i < count; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";

    const size   = Math.random() * 3 + 1;
    const x      = Math.random() * 100;
    const delay  = Math.random() * 8;
    const dur    = Math.random() * 10 + 8;
    const opacity = Math.random() * 0.3 + 0.05;

    Object.assign(particle.style, {
      position:        "absolute",
      width:           size + "px",
      height:          size + "px",
      background:      "var(--accent)",
      borderRadius:    "50%",
      left:            x + "%",
      bottom:          "-10px",
      opacity:         opacity,
      animation:       `particleRise ${dur}s ${delay}s ease-in-out infinite`,
      pointerEvents:   "none",
    });

    hero.appendChild(particle);
  }

  if (!document.getElementById("particleStyle")) {
    const style = document.createElement("style");
    style.id = "particleStyle";
    style.textContent = `
      @keyframes particleRise {
        0%   { transform: translateY(0) translateX(0);   opacity: 0; }
        10%  { opacity: var(--op, 0.15); }
        90%  { opacity: var(--op, 0.15); }
        100% { transform: translateY(-110vh) translateX(${Math.random()>0.5?"+":"-"}${Math.floor(Math.random()*100)}px); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
}

createParticles();

(function addTypingCursor() {
  const titleName = document.querySelector(".title-name");
  if (!titleName) return;
  const cursor = document.createElement("span");
  cursor.textContent = "_";
  cursor.style.cssText = `
    color: var(--accent);
    animation: blink 1s step-end infinite;
    margin-left: 2px;
    font-weight: 400;
  `;
  if (!document.getElementById("blinkStyle")) {
    const s = document.createElement("style");
    s.id = "blinkStyle";
    s.textContent = `@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`;
    document.head.appendChild(s);
  }
  titleName.appendChild(cursor);
})();

if (window.matchMedia("(hover: hover)").matches) {
  function addTilt(selector, maxTilt = 8) {
    document.querySelectorAll(selector).forEach(el => {
      el.addEventListener("mousemove", (e) => {
        const rect    = el.getBoundingClientRect();
        const x       = e.clientX - rect.left;
        const y       = e.clientY - rect.top;
        const centerX = rect.width  / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -maxTilt;
        const rotateY = ((x - centerX) / centerX) *  maxTilt;
        el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "";
        el.style.transition = "transform 0.5s ease";
        setTimeout(() => el.style.transition = "", 500);
      });
    });
  }

  addTilt(".info-card", 6);
  addTilt(".cert-card", 5);
  addTilt(".project-category-card", 5);
  addTilt(".tool-card", 8);
}

(function addProgressBar() {
  const bar = document.createElement("div");
  Object.assign(bar.style, {
    position:   "fixed",
    top:        "0",
    left:       "0",
    height:     "3px",
    background: "var(--accent)",
    zIndex:     "99999",
    transition: "width 0.1s linear",
    width:      "0%",
  });
  document.body.appendChild(bar);

  window.addEventListener("scroll", () => {
    const scrolled = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
    bar.style.width = Math.min(scrolled, 100) + "%";
  }, { passive: true });
})();

const skillCards = document.querySelectorAll(".skill-card");
const skillObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, idx) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.style.opacity   = "1";
        entry.target.style.transform = "translateY(0)";
      }, idx * 80);
      skillObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

skillCards.forEach(card => {
  card.style.opacity   = "0";
  card.style.transform = "translateY(20px)";
  card.style.transition = "opacity 0.5s ease, transform 0.5s ease";
  skillObserver.observe(card);
});

document.querySelectorAll(".cert-card").forEach(card => {
  card.addEventListener("mousemove", (e) => {
    const rect  = card.getBoundingClientRect();
    const x     = ((e.clientX - rect.left) / rect.width)  * 100;
    const y     = ((e.clientY - rect.top)  / rect.height) * 100;
    card.style.background = `radial-gradient(circle at ${x}% ${y}%, var(--bg-card-hover), var(--bg-card))`;
  });
  card.addEventListener("mouseleave", () => {
    card.style.background = "";
  });
});

document.addEventListener("DOMContentLoaded", () => {
  // Trigger skill bar animation on initial load if visible
  setTimeout(() => {
    animateSkillBars();
    revealOnScroll();
    initCounters();
  }, 2400); // After loader
});

console.log("%cVydFnt Portfolio", "color: #e53e3e; font-size: 24px; font-weight: bold; font-family: monospace;");
console.log("%cDibuat dengan ❤ menggunakan HTML, CSS & Vanilla JS", "color: #888; font-size: 12px;");

(function initCertLightbox() {
  const lightbox   = document.getElementById("certLightbox");
  const backdrop   = document.getElementById("clbBackdrop");
  const closeBtn   = document.getElementById("clbClose");
  const prevBtn    = document.getElementById("clbPrev");
  const nextBtn    = document.getElementById("clbNext");
  const imgFrame   = document.getElementById("clbImgFrame");
  const counter    = document.getElementById("clbCounter");
  const platform   = document.getElementById("clbPlatform");
  const title      = document.getElementById("clbTitle");
  const desc       = document.getElementById("clbDesc");
  const date       = document.getElementById("clbDate");
  const download   = document.getElementById("clbDownload");
  const dotsWrap   = document.getElementById("clbDots");

  if (!lightbox) return;

  const cards = Array.from(document.querySelectorAll(".cert-card"));
  let current = 0;

  function buildDots() {
    dotsWrap.innerHTML = "";
    cards.forEach((_, i) => {
      const d = document.createElement("button");
      d.className = "clb-dot" + (i === 0 ? " active" : "");
      d.setAttribute("aria-label", "Sertifikat " + (i + 1));
      d.addEventListener("click", () => goto(i));
      dotsWrap.appendChild(d);
    });
  }

  function updateDots(idx) {
    dotsWrap.querySelectorAll(".clb-dot").forEach((d, i) =>
      d.classList.toggle("active", i === idx));
  }

  function goto(idx) {
    current = (idx + cards.length) % cards.length;
    const card = cards[current];

    const imgSrc   = card.dataset.certImg;
    const iconCls  = card.dataset.certIcon   || "fa-solid fa-certificate";
    const iconClr  = card.dataset.certColor  || "var(--accent)";
    const cardTitle = card.dataset.certTitle || "";
    const cardPlatform = card.dataset.certPlatform || "";
    const cardDate  = card.dataset.certDate  || "";
    const cardDesc  = card.dataset.certDesc  || "";

    imgFrame.innerHTML = "";
    const img = new Image();
    img.onload = () => { imgFrame.innerHTML = ""; imgFrame.appendChild(img); };
    img.onerror = () => {
      imgFrame.innerHTML = `
        <div class="clb-placeholder">
          <i class="${iconCls}" style="color:${iconClr}"></i>
          <small>Tempatkan file gambar di:<br><code>sertifikat/</code> folder</small>
        </div>`;
    };
    img.src = imgSrc;
    img.alt = cardTitle;
    img.style.cssText = "width:100%;height:100%;object-fit:contain;";

    platform.textContent = cardPlatform;
    title.textContent    = cardTitle;
    desc.textContent     = cardDesc;
    date.textContent     = cardDate;
    download.href        = imgSrc || "#";
    counter.textContent  = (current + 1) + " / " + cards.length;
    updateDots(current);

    const inner = lightbox.querySelector(".clb-info-side");
    if (inner) {
      inner.style.opacity   = "0";
      inner.style.transform = "translateX(12px)";
      requestAnimationFrame(() => {
        inner.style.transition = "opacity 0.3s ease, transform 0.3s ease";
        inner.style.opacity    = "1";
        inner.style.transform  = "translateX(0)";
      });
    }
  }

  function open(idx) {
    buildDots();
    goto(idx);
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function close() {
    lightbox.classList.remove("open");
    document.body.style.overflow = "";
  }

  cards.forEach((card, idx) => {
    card.addEventListener("click", () => open(idx));
  });

  closeBtn  && closeBtn.addEventListener("click", close);
  backdrop  && backdrop.addEventListener("click", close);
  prevBtn   && prevBtn.addEventListener("click", () => goto(current - 1));
  nextBtn   && nextBtn.addEventListener("click", () => goto(current + 1));

  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape")      close();
    if (e.key === "ArrowLeft")   goto(current - 1);
    if (e.key === "ArrowRight")  goto(current + 1);
  });

  let swipeStartX = 0;
  lightbox.addEventListener("touchstart", e => { swipeStartX = e.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener("touchend", e => {
    const diff = swipeStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) goto(current + (diff > 0 ? 1 : -1));
  });
})();
