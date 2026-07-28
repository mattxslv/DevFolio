"use strict";

/**
 * Theme toggle (persists via localStorage, respects system preference)
 */

const $HTML = document.documentElement;
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

$HTML.dataset.theme = localStorage.getItem("theme") || (prefersDark ? "dark" : "light");

const applyTheme = () => {
  $HTML.dataset.theme = $HTML.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", $HTML.dataset.theme);
};

const themeBtn = document.querySelector("[data-theme-btn]");

// Sync the morphing sun/moon icon (theme-toggles library) with the current theme
const syncThemeIcon = () => {
  themeBtn.classList.toggle("theme-toggle--toggled", $HTML.dataset.theme === "light");
};
syncThemeIcon();

themeBtn.addEventListener("click", () => {
  const toggle = () => {
    applyTheme();
    syncThemeIcon();
  };

  if (!document.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    toggle();
    return;
  }

  const rect = themeBtn.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

  document.startViewTransition(toggle).ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 700, easing: "cubic-bezier(0.16, 1, 0.3, 1)", pseudoElement: "::view-transition-new(root)" }
    );
  });
});

/**
 * Nav logo typing animation
 */

const navLogo = document.querySelector(".nav-logo");
const logoSpan = navLogo?.querySelector("span");
if (logoSpan) {
  const logoText = logoSpan.textContent;
  navLogo.style.display = "inline-flex";
  navLogo.style.alignItems = "center";
  navLogo.style.minWidth = `${navLogo.offsetWidth + 8}px`;
  logoSpan.textContent = "";

  // Caret lives OUTSIDE the span: background-clip:text on the span would
  // clip the caret's background and make it invisible.
  const caret = document.createElement("span");
  caret.className = "logo-caret";
  logoSpan.after(caret);

  // Drive the blink from JS (Web Animations API) so it cannot be lost
  // to stale cached CSS or overridden keyframes.
  caret.animate(
    [
      { opacity: 1 },
      { opacity: 1, offset: 0.49 },
      { opacity: 0, offset: 0.5 },
      { opacity: 0, offset: 0.99 },
      { opacity: 1 },
    ],
    { duration: 900, iterations: Infinity }
  );

  let logoIndex = 0;
  let logoDeleting = false;

  const typeLogo = () => {
    let delay;

    if (logoDeleting) {
      logoIndex -= 1;
      delay = 45;
    } else {
      logoIndex += 1;
      delay = 85;
    }

    logoSpan.textContent = logoText.substring(0, logoIndex);

    if (!logoDeleting && logoIndex === logoText.length) {
      delay = 5000; // pause with blinking caret before deleting
      logoDeleting = true;
    } else if (logoDeleting && logoIndex === 0) {
      logoDeleting = false;
      delay = 700;
    }

    setTimeout(typeLogo, delay);
  };

  window.addEventListener("load", () => setTimeout(typeLogo, 800));
}

/**
 * Preloader
 */

window.addEventListener("load", () => {
  const preloader = document.getElementById("preloader");
  setTimeout(() => preloader.classList.add("loaded"), 500);
});

/**
 * Navbar - scrolled state, scroll progress, active link highlighting
 */

const navbar = document.getElementById("navbar");
const scrollProgress = document.getElementById("scroll-progress");
const backTop = document.getElementById("back-top");
const navLinks = document.querySelectorAll(".nav-link");
const sections = [...document.querySelectorAll("section[id]")];

const onScroll = () => {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;

  navbar.classList.toggle("scrolled", y > 20);
  scrollProgress.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
  backTop.classList.toggle("show", y > 600);

  // Active section highlighting
  let current = sections[0]?.id;
  for (const section of sections) {
    if (y >= section.offsetTop - 140) current = section.id;
  }
  navLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${current}`);
  });
};

window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

backTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

/**
 * Mobile menu
 */

const menuBtn = document.getElementById("menu-btn");
const navLinksWrap = document.getElementById("nav-links");

menuBtn.addEventListener("click", () => {
  const open = navLinksWrap.classList.toggle("open");
  menuBtn.querySelector(".material-symbols-outlined").textContent = open ? "close" : "menu";
});

navLinks.forEach((link) =>
  link.addEventListener("click", () => {
    navLinksWrap.classList.remove("open");
    menuBtn.querySelector(".material-symbols-outlined").textContent = "menu";
  })
);

/**
 * Typing animation
 */

const typingText = document.getElementById("typing-text");
const phrases = [
  "Full Stack Developer",
  "Government Technology Specialist",
  "Software Engineer at DICT",
  "Building Digital Public Services",
  "React • Next.js • Node.js • Python",
];

let phraseIndex = 0;
let charIndex = 0;
let deleting = false;

function typeEffect() {
  const current = phrases[phraseIndex];
  let delay;

  if (deleting) {
    charIndex--;
    delay = 35;
  } else {
    charIndex++;
    delay = 75;
  }

  typingText.textContent = current.substring(0, charIndex);

  if (!deleting && charIndex === current.length) {
    delay = 2200;
    deleting = true;
  } else if (deleting && charIndex === 0) {
    deleting = false;
    phraseIndex = (phraseIndex + 1) % phrases.length;
    delay = 450;
  }

  setTimeout(typeEffect, delay);
}

window.addEventListener("load", () => setTimeout(typeEffect, 1200));

/**
 * Scroll reveal animations (IntersectionObserver)
 */

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);

document
  .querySelectorAll(".reveal, .reveal-left, .reveal-right, .stagger")
  .forEach((el) => revealObserver.observe(el));

/**
 * Animated stat counters
 */

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = Number(el.dataset.target);
      const duration = 1400;
      const start = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      counterObserver.unobserve(el);
    });
  },
  { threshold: 0.6 }
);

document.querySelectorAll(".counter").forEach((el) => counterObserver.observe(el));

/**
 * Project filtering
 */

const filterBtns = document.querySelectorAll(".filter-btn");
const projectCards = document.querySelectorAll(".project-card");

filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const filter = btn.dataset.filter;
    projectCards.forEach((card) => {
      const show = filter === "all" || card.dataset.category === filter;
      card.classList.toggle("hide", !show);
      if (show) {
        card.style.opacity = "0";
        card.style.transform = "translateY(20px)";
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            card.style.opacity = "1";
            card.style.transform = "";
          })
        );
      }
    });
  });
});

/**
 * 3D tilt effect on project cards (pointer devices only)
 */

if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  projectCards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `translateY(-10px) perspective(900px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg)`;
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
}

/**
 * Clickable card banners - navigate to the card's primary link
 */

document.querySelectorAll(".card-banner").forEach((banner) => {
  const primaryLink = banner.closest(".project-card")?.querySelector(".card-link.primary");
  if (!primaryLink) return;
  banner.addEventListener("click", () => {
    window.open(primaryLink.href, "_blank", "noopener,noreferrer");
  });
});

/**
 * Skills marquee - duplicate items for a seamless loop
 */

const marqueeTrack = document.getElementById("marquee-track");
if (marqueeTrack) {
  marqueeTrack.innerHTML += marqueeTrack.innerHTML;
}

/**
 * GSAP scroll-linked parallax (scrubs with scroll position)
 */

if (window.gsap && window.ScrollTrigger && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  gsap.registerPlugin(ScrollTrigger);

  // Hero content drifts up and fades as you scroll away
  gsap.to(".hero-content", {
    yPercent: -18,
    opacity: 0,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "70% top", scrub: true },
  });

  // Portrait moves slower than the page (classic parallax depth)
  gsap.to(".hero-visual", {
    yPercent: 14,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });

  // Background grid and glow drift subtly
  gsap.to(".hero-bg", {
    yPercent: 22,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });

  // Scroll hint fades out immediately
  gsap.to(".scroll-hint", {
    opacity: 0,
    y: 24,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "25% top", scrub: true },
  });

  // About stats drift up slightly faster than the text column
  gsap.from(".stats-grid", {
    y: 70,
    ease: "none",
    scrollTrigger: { trigger: "#about", start: "top bottom", end: "center 60%", scrub: true },
  });

  // Section tags get a small scroll-linked lift
  gsap.utils.toArray(".skills-marquee").forEach((el) => {
    gsap.from(el, {
      xPercent: 6,
      ease: "none",
      scrollTrigger: { trigger: el, start: "top bottom", end: "bottom center", scrub: true },
    });
  });
}
