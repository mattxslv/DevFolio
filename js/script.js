"use strict";


/**
 * Light and dark mode
 */

const /** {NodeElement} */ $themeBtn = document.querySelector("[data-theme-btn]");
const /** {NodeElement} */ $HTML = document.documentElement;
let /** {Boolean | String} */ isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

if (sessionStorage.getItem("theme")) {
  $HTML.dataset.theme = sessionStorage.getItem("theme");
} else {
  $HTML.dataset.theme = isDark ? "dark" : "light";
}

const changeTheme = () => {

  $HTML.dataset.theme = sessionStorage.getItem("theme") === "light" ? "dark" : "light";
  sessionStorage.setItem("theme", $HTML.dataset.theme);

}

$themeBtn.addEventListener("click", changeTheme);


/**
 * Smooth Scrolling
 */

// Add smooth scrolling to all anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Add smooth scrolling CSS
const smoothScrollCSS = `
  html {
    scroll-behavior: smooth;
  }
`;
const style = document.createElement('style');
style.textContent = smoothScrollCSS;
document.head.appendChild(style);


/**
 * Typing Animation
 */

const typingText = document.getElementById('typing-text');
const phrases = [
  'Full Stack Developer | Government Technology Specialist',
  'Computer Programmer I at DICT Philippines',
  'Building Digital Solutions for Public Services',
  'React • Node.js • Python • Government Tech'
];

let currentPhrase = 0;
let currentChar = 0;
let isDeleting = false;
let typeSpeed = 100;

function typeEffect() {
  const current = phrases[currentPhrase];
  
  if (isDeleting) {
    typingText.textContent = current.substring(0, currentChar - 1);
    currentChar--;
    typeSpeed = 50;
  } else {
    typingText.textContent = current.substring(0, currentChar + 1);
    currentChar++;
    typeSpeed = 100;
  }
  
  if (!isDeleting && currentChar === current.length) {
    typeSpeed = 2000;
    isDeleting = true;
  } else if (isDeleting && currentChar === 0) {
    isDeleting = false;
    currentPhrase = (currentPhrase + 1) % phrases.length;
    typeSpeed = 500;
  }
  
  setTimeout(typeEffect, typeSpeed);
}

// Start typing animation after page load
window.addEventListener('load', () => {
  // Hide preloader
  const preloader = document.getElementById('preloader');
  if (preloader) {
    setTimeout(() => {
      preloader.classList.add('loaded');
    }, 1000);
  }
  
  setTimeout(typeEffect, 1500);
});


/**
 * Loading Skeleton Screens
 */

// Show skeleton screens while content loads
document.addEventListener('DOMContentLoaded', () => {
  // Add skeleton loading to images
  document.querySelectorAll('img').forEach(img => {
    if (!img.complete) {
      img.style.display = 'none';
      const skeleton = document.createElement('div');
      skeleton.className = 'skeleton skeleton-card';
      img.parentNode.insertBefore(skeleton, img);
      
      img.addEventListener('load', () => {
        skeleton.remove();
        img.style.display = 'block';
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
          img.style.opacity = '1';
        }, 50);
      });
    }
  });
});


/**
 * Scroll-triggered Animations
 */

// Initialize Intersection Observer for scroll animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const animateOnScroll = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate');
      
      // Animate skill progress bars when they come into view
      if (entry.target.classList.contains('skill-progress')) {
        const width = entry.target.getAttribute('data-width');
        setTimeout(() => {
          entry.target.style.width = width + '%';
        }, 100);
      }
    }
  });
}, observerOptions);

// Add animation classes and observe elements
document.addEventListener('DOMContentLoaded', () => {
  // Add fade-in animation to cards
  document.querySelectorAll('.card').forEach((card, index) => {
    card.classList.add('fade-in');
    animateOnScroll.observe(card);
  });
  
  // Add slide-in animations to sections
  document.querySelectorAll('.section-title').forEach((title) => {
    title.classList.add('slide-in-left');
    animateOnScroll.observe(title);
  });
  
  // Add scale-in animation to profile image
  const profileImg = document.querySelector('.hero-banner');
  if (profileImg) {
    profileImg.classList.add('scale-in');
    animateOnScroll.observe(profileImg);
  }
  
  // Add fade-in to about content
  const aboutCard = document.querySelector('.about-card');
  if (aboutCard) {
    aboutCard.classList.add('fade-in');
    animateOnScroll.observe(aboutCard);
  }
  
  // Observe skill progress bars
  document.querySelectorAll('.skill-progress').forEach((progress) => {
    animateOnScroll.observe(progress);
  });
  
  // Add slide-in to contact form
  const contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    contactForm.classList.add('slide-in-right');
    animateOnScroll.observe(contactForm);
  }
});


/**
 * TAB
 */

const /** {NodeList} */ $tabBtn = document.querySelectorAll("[data-tab-btn]");
let /** {NodeElement} */[lastActiveTab] = document.querySelectorAll("[data-tab-content]");
let /** {NodeElement} */[lastActiveTabBtn] = $tabBtn;

$tabBtn.forEach(item => {
  item.addEventListener("click", function () {

    lastActiveTab.classList.remove("active");
    lastActiveTabBtn.classList.remove("active");

    const /** {NodeElement} */ $tabContent = document.querySelector(`[data-tab-content="${item.dataset.tabBtn}"]`);
    $tabContent.classList.add("active");
    this.classList.add("active");

    lastActiveTab = $tabContent;
    lastActiveTabBtn = this;

  });
});