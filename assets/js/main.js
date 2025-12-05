/**
 * AMD Main JavaScript
 * Core functionality: Theme, Navigation, Forms, Animations
 */

(function () {
  'use strict';

  // ============================================
  // Theme Management
  // ============================================
  const ThemeManager = {
    STORAGE_KEY: 'amd-theme',

    init() {
      this.applyTheme(this.getPreferredTheme());
      this.bindEvents();
    },

    getPreferredTheme() {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) return stored;

      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    },

    applyTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem(this.STORAGE_KEY, theme);

      // Update meta theme-color for mobile browsers
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.setAttribute('content', theme === 'dark' ? '#0d1f2d' : '#ffffff');
      }
    },

    toggle() {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      this.applyTheme(next);
    },

    bindEvents() {
      // Theme toggle buttons
      document.querySelectorAll('.theme-toggle').forEach(btn => {
        btn.addEventListener('click', () => this.toggle());
      });

      // Listen for system preference changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
          this.applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  };

  // ============================================
  // Mobile Navigation
  // ============================================
  const MobileNav = {
    init() {
      this.toggle = document.querySelector('.menu-toggle');
      this.nav = document.querySelector('.mobile-nav');
      this.body = document.body;

      if (!this.toggle || !this.nav) return;

      this.bindEvents();
    },

    bindEvents() {
      this.toggle.addEventListener('click', () => this.toggleMenu());

      // Close on link click
      this.nav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => this.close());
      });

      // Close on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen()) {
          this.close();
        }
      });

      // Close on outside click
      document.addEventListener('click', (e) => {
        if (this.isOpen() &&
          !this.nav.contains(e.target) &&
          !this.toggle.contains(e.target)) {
          this.close();
        }
      });
    },

    isOpen() {
      return this.nav.classList.contains('is-open');
    },

    toggleMenu() {
      if (this.isOpen()) {
        this.close();
      } else {
        this.open();
      }
    },

    open() {
      this.nav.classList.add('is-open');
      this.toggle.classList.add('is-active');
      this.toggle.setAttribute('aria-expanded', 'true');
      this.body.style.overflow = 'hidden';
    },

    close() {
      this.nav.classList.remove('is-open');
      this.toggle.classList.remove('is-active');
      this.toggle.setAttribute('aria-expanded', 'false');
      this.body.style.overflow = '';
    }
  };

  // ============================================
  // Header Scroll Behavior
  // ============================================
  const HeaderScroll = {
    init() {
      this.header = document.querySelector('.header');
      if (!this.header) return;

      this.lastScrollY = 0;
      this.ticking = false;

      window.addEventListener('scroll', () => this.onScroll(), { passive: true });
    },

    onScroll() {
      if (!this.ticking) {
        requestAnimationFrame(() => {
          this.update();
          this.ticking = false;
        });
        this.ticking = true;
      }
    },

    update() {
      const scrollY = window.scrollY;

      // Add shadow when scrolled
      if (scrollY > 10) {
        this.header.classList.add('header--scrolled');
      } else {
        this.header.classList.remove('header--scrolled');
      }

      // Hide on scroll down, show on scroll up (optional - can be enabled)
      // if (scrollY > this.lastScrollY && scrollY > 100) {
      //   this.header.classList.add('header--hidden');
      // } else {
      //   this.header.classList.remove('header--hidden');
      // }

      this.lastScrollY = scrollY;
    }
  };

  // ============================================
  // Form Validation
  // ============================================
  const FormValidator = {
    init() {
      document.querySelectorAll('form[data-validate]').forEach(form => {
        this.setupForm(form);
      });
    },

    setupForm(form) {
      form.setAttribute('novalidate', '');

      form.addEventListener('submit', (e) => {
        e.preventDefault();

        if (this.validate(form)) {
          this.handleSubmit(form);
        }
      });

      // Real-time validation
      form.querySelectorAll('input, textarea, select').forEach(field => {
        field.addEventListener('blur', () => this.validateField(field));
        field.addEventListener('input', () => {
          if (field.classList.contains('is-invalid')) {
            this.validateField(field);
          }
        });
      });
    },

    validate(form) {
      let isValid = true;

      form.querySelectorAll('input, textarea, select').forEach(field => {
        if (!this.validateField(field)) {
          isValid = false;
        }
      });

      return isValid;
    },

    validateField(field) {
      const rules = {
        required: field.hasAttribute('required'),
        email: field.type === 'email',
        tel: field.type === 'tel',
        minlength: field.getAttribute('minlength'),
        pattern: field.getAttribute('pattern')
      };

      let isValid = true;
      let message = '';

      const value = field.value.trim();

      // Required check
      if (rules.required && !value) {
        isValid = false;
        message = field.dataset.errorRequired || 'This field is required';
      }

      // Email check
      if (isValid && value && rules.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          isValid = false;
          message = field.dataset.errorEmail || 'Please enter a valid email';
        }
      }

      // Phone check
      if (isValid && value && rules.tel) {
        const phoneRegex = /^[\d\s\-+()]{8,}$/;
        if (!phoneRegex.test(value)) {
          isValid = false;
          message = field.dataset.errorTel || 'Please enter a valid phone number';
        }
      }

      // Minlength check
      if (isValid && value && rules.minlength) {
        if (value.length < parseInt(rules.minlength)) {
          isValid = false;
          message = field.dataset.errorMinlength ||
            `Minimum ${rules.minlength} characters required`;
        }
      }

      // Pattern check
      if (isValid && value && rules.pattern) {
        const regex = new RegExp(rules.pattern);
        if (!regex.test(value)) {
          isValid = false;
          message = field.dataset.errorPattern || 'Invalid format';
        }
      }

      this.setFieldState(field, isValid, message);
      return isValid;
    },

    setFieldState(field, isValid, message) {
      const errorEl = field.parentElement.querySelector('.form-error');

      if (isValid) {
        field.classList.remove('is-invalid');
        field.classList.add('is-valid');
        field.setAttribute('aria-invalid', 'false');
        if (errorEl) errorEl.textContent = '';
      } else {
        field.classList.remove('is-valid');
        field.classList.add('is-invalid');
        field.setAttribute('aria-invalid', 'true');
        if (errorEl) {
          errorEl.textContent = message;
          errorEl.setAttribute('role', 'alert');
        }
      }
    },

    async handleSubmit(form) {
      const submitBtn = form.querySelector('[type="submit"]');
      const originalText = submitBtn.textContent;

      // Check honeypot
      const honeypot = form.querySelector('.form-honeypot input');
      if (honeypot && honeypot.value) {
        console.log('Spam detected');
        return;
      }

      // Loading state
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span>';

      try {
        // Collect form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Remove honeypot from data
        delete data.website;

        // Simulate API call (replace with actual endpoint)
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Success
        this.showSuccess(form);
        form.reset();

      } catch (error) {
        console.error('Form submission error:', error);
        this.showError(form);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    },

    showSuccess(form) {
      const successEl = form.querySelector('.form-success');
      if (successEl) {
        successEl.style.display = 'block';
        successEl.setAttribute('role', 'status');
        setTimeout(() => {
          successEl.style.display = 'none';
        }, 5000);
      }
    },

    showError(form) {
      const errorEl = form.querySelector('.form-error-global');
      if (errorEl) {
        errorEl.style.display = 'block';
        errorEl.setAttribute('role', 'alert');
      }
    }
  };

  // ============================================
  // Scroll Animations
  // ============================================
  const ScrollAnimations = {
    init() {
      if (!('IntersectionObserver' in window)) return;

      this.observer = new IntersectionObserver(
        (entries) => this.handleIntersection(entries),
        {
          root: null,
          rootMargin: '0px 0px -50px 0px',
          threshold: 0.1
        }
      );

      document.querySelectorAll('[data-animate]').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        this.observer.observe(el);
      });
    },

    handleIntersection(entries) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = el.dataset.animateDelay || 0;

          setTimeout(() => {
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
          }, delay);

          this.observer.unobserve(el);
        }
      });
    }
  };

  // ============================================
  // Smooth Scroll
  // ============================================
  const SmoothScroll = {
    init() {
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
          const href = anchor.getAttribute('href');
          if (href === '#') return;

          const target = document.querySelector(href);
          if (target) {
            e.preventDefault();
            const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
            const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight - 20;

            window.scrollTo({
              top: targetPosition,
              behavior: 'smooth'
            });
          }
        });
      });
    }
  };

  // ============================================
  // Image Gallery (for project detail pages)
  // ============================================
  const ImageGallery = {
    init() {
      document.querySelectorAll('.gallery').forEach(gallery => {
        this.setupGallery(gallery);
      });
    },

    setupGallery(gallery) {
      const main = gallery.querySelector('.gallery__main');
      const thumbs = gallery.querySelectorAll('.gallery__thumb');

      if (!main || !thumbs.length) return;

      thumbs.forEach((thumb, index) => {
        thumb.addEventListener('click', () => {
          // Update main image
          const src = thumb.dataset.src || thumb.src;
          const alt = thumb.alt;
          main.src = src;
          main.alt = alt;

          // Update active state
          thumbs.forEach(t => t.classList.remove('is-active'));
          thumb.classList.add('is-active');
        });

        // Keyboard support
        thumb.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            thumb.click();
          }
        });
      });
    }
  };

  // ============================================
  // Counter Animation
  // ============================================
  const CounterAnimation = {
    init() {
      if (!('IntersectionObserver' in window)) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.animate(entry.target);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );

      document.querySelectorAll('[data-counter]').forEach(el => {
        observer.observe(el);
      });
    },

    animate(el) {
      const target = parseInt(el.dataset.counter, 10);
      const duration = parseInt(el.dataset.duration, 10) || 2000;
      const suffix = el.dataset.suffix || '';
      const start = 0;
      const startTime = performance.now();

      const update = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (target - start) * eased);

        el.textContent = current.toLocaleString() + suffix;

        if (progress < 1) {
          requestAnimationFrame(update);
        }
      };

      requestAnimationFrame(update);
    }
  };

  // ============================================
  // Project Filter
  // ============================================
  const ProjectFilter = {
    init() {
      this.filters = document.querySelectorAll('[data-filter]');
      this.projects = document.querySelectorAll('[data-category]');

      if (!this.filters.length || !this.projects.length) return;

      this.bindEvents();
    },

    bindEvents() {
      this.filters.forEach(btn => {
        btn.addEventListener('click', () => {
          const filter = btn.getAttribute('data-filter');
          this.filterProjects(filter);
          this.updateActiveButton(btn);
        });
      });
    },

    filterProjects(filter) {
      this.projects.forEach(project => {
        const category = project.getAttribute('data-category');

        if (filter === 'all' || filter === category) {
          project.style.display = '';
          // Trigger animation if available
          project.style.opacity = '0';
          project.style.transform = 'translateY(20px)';
          setTimeout(() => {
            project.style.opacity = '1';
            project.style.transform = 'translateY(0)';
          }, 50);
        } else {
          project.style.display = 'none';
        }
      });
    },

    updateActiveButton(activeBtn) {
      this.filters.forEach(btn => {
        btn.classList.remove('btn--primary');
        btn.classList.add('btn--outline');
      });

      activeBtn.classList.remove('btn--outline');
      activeBtn.classList.add('btn--primary');
    }
  };

  // ============================================
  // Initialize Everything
  // ============================================
  function init() {
    ThemeManager.init();
    MobileNav.init();
    HeaderScroll.init();
    FormValidator.init();
    ScrollAnimations.init();
    SmoothScroll.init();
    ImageGallery.init();
    CounterAnimation.init();
    ProjectFilter.init();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for external use if needed
  window.AMD = {
    ThemeManager,
    MobileNav,
    FormValidator
  };

})();
