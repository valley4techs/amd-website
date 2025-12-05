/**
 * AMD Internationalization (i18n)
 * Language detection and switching
 */

(function () {
    'use strict';

    const I18n = {
        STORAGE_KEY: 'amd-lang',
        SUPPORTED_LANGS: ['en', 'ar'],
        DEFAULT_LANG: 'en',

        /**
         * Initialize language handling
         */
        init() {
            this.detectAndRedirect();
            this.bindEvents();
        },

        /**
         * Get the current language from URL path
         */
        getCurrentLang() {
            const path = window.location.pathname;

            // Handle both server paths and file:// protocol paths
            if (path.includes('ar/') || path.endsWith('ar') || path.includes('\\ar\\') || path.includes('ar/index.html')) {
                return 'ar';
            }
            if (path.includes('en/') || path.endsWith('en') || path.includes('\\en\\') || path.includes('en/index.html')) {
                return 'en';
            }

            return null;
        },

        /**
         * Get user's preferred language
         */
        getPreferredLang() {
            // Check localStorage first
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored && this.SUPPORTED_LANGS.includes(stored)) {
                return stored;
            }

            // Check browser language
            const browserLang = navigator.language.split('-')[0].toLowerCase();
            if (this.SUPPORTED_LANGS.includes(browserLang)) {
                return browserLang;
            }

            return this.DEFAULT_LANG;
        },

        /**
         * Save language preference
         */
        savePreference(lang) {
            localStorage.setItem(this.STORAGE_KEY, lang);
        },

        /**
         * Detect language and redirect if needed
         */
        detectAndRedirect() {
            const currentLang = this.getCurrentLang();

            // If we're on a language-specific page, save the preference
            if (currentLang) {
                this.savePreference(currentLang);
                this.updateHtmlAttributes(currentLang);
                this.updateLanguageSwitcher(currentLang);
                return;
            }

            // If we're on the root page, redirect to preferred language
            const path = window.location.pathname;
            if (path === '/' || path === '') {
                const preferredLang = this.getPreferredLang();
                window.location.href = `./${preferredLang}/`;
            }
        },

        /**
         * Update HTML attributes for current language
         */
        updateHtmlAttributes(lang) {
            document.documentElement.setAttribute('lang', lang);
            document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
        },

        /**
         * Update language switcher UI
         */
        updateLanguageSwitcher(currentLang) {
            document.querySelectorAll('.lang-switch__btn').forEach(btn => {
                const btnLang = btn.dataset.lang;
                if (btnLang === currentLang) {
                    btn.classList.add('lang-switch__btn--active');
                    btn.setAttribute('aria-current', 'true');
                } else {
                    btn.classList.remove('lang-switch__btn--active');
                    btn.removeAttribute('aria-current');
                }
            });
        },

        /**
         * Switch to a different language
         */
        switchTo(newLang) {
            if (!this.SUPPORTED_LANGS.includes(newLang)) {
                console.warn(`Unsupported language: ${newLang}`);
                return;
            }

            const currentLang = this.getCurrentLang();
            if (currentLang === newLang) return;

            this.savePreference(newLang);

            // Get the current page path
            let path = window.location.pathname;
            let filename = path.split('/').pop() || 'index.html';

            // Handle file:// protocol (opening files directly)
            if (window.location.protocol === 'file:') {
                // Get the current directory path
                let currentDir = path.substring(0, path.lastIndexOf('/'));
                let newPath = '';

                if (currentDir.endsWith('/' + currentLang)) {
                    // If currently in a language folder (e.g., /AMD/ar/index.html)
                    let parentDir = currentDir.substring(0, currentDir.lastIndexOf('/'));
                    if (newLang === 'en') {
                        newPath = parentDir + '/' + filename; // English files are in the root
                    } else {
                        newPath = parentDir + '/' + newLang + '/' + filename;
                    }
                } else {
                // If currently in the root folder (e.g., /AMD/index.html)
                if (currentLang === 'en' && newLang === 'ar') {
                    newPath = currentDir + '/ar/' + filename; // From root (en) to ar folder
                } else {
                    // This case should not happen if currentLang is correctly detected, but keep for safety
                    newPath = currentDir + '/' + newLang + '/' + filename;
                }
                }
                window.location.href = newPath;
            } else {
                // Server-based navigation (assuming root is the base)
                let newPath = '';
                if (currentLang) {
                    // Remove current language prefix
                    path = path.replace(new RegExp(`^/${currentLang}`), '');
                }

                // Ensure path starts with /
                if (!path.startsWith('/')) {
                    path = '/' + path;
                }

                // If path is just /, go to language root
                if (newLang === 'en') {
                    // English is in the root, so no language prefix
                    newPath = path === '/' ? '/' : path;
                } else {
                    // Other languages (e.g., 'ar') have a prefix
                    newPath = path === '/' ? `/${newLang}/` : `/${newLang}${path}`;
                }
                window.location.href = newPath;
            }
        },

        /**
         * Get equivalent page URL in another language
         */
        getAlternateUrl(lang) {
            const currentLang = this.getCurrentLang() || this.DEFAULT_LANG;
            let path = window.location.pathname;

            // Remove current language prefix
            path = path.replace(new RegExp(`^/${currentLang}`), '');

            // Ensure path starts with /
            if (!path.startsWith('/')) {
                path = '/' + path;
            }

            return `/${lang}${path === '/' ? '/' : path}`;
        },

        /**
         * Bind event listeners
         */
        bindEvents() {
            // Language switch buttons
            document.querySelectorAll('.lang-switch__btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const lang = btn.dataset.lang;
                    if (lang) {
                        this.switchTo(lang);
                    }
                });
            });

            // Any element with data-switch-lang attribute
            document.querySelectorAll('[data-switch-lang]').forEach(el => {
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    const lang = el.dataset.switchLang;
                    if (lang) {
                        this.switchTo(lang);
                    }
                });
            });
        },

        /**
         * Get translation for a key (for dynamic content)
         * Uses data attributes on script tag or global config
         */
        t(key, fallback = '') {
            if (window.AMD_TRANSLATIONS && window.AMD_TRANSLATIONS[key]) {
                return window.AMD_TRANSLATIONS[key];
            }
            return fallback;
        }
    };

    // ============================================
    // Date/Number Formatting for Arabic
    // ============================================
    const Formatter = {
        /**
         * Format number with proper locale
         */
        number(num, options = {}) {
            const lang = I18n.getCurrentLang() || I18n.DEFAULT_LANG;
            const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
            return new Intl.NumberFormat(locale, options).format(num);
        },

        /**
         * Format currency
         */
        currency(num, currency = 'EGP') {
            const lang = I18n.getCurrentLang() || I18n.DEFAULT_LANG;
            const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: currency
            }).format(num);
        },

        /**
         * Format date
         */
        date(date, options = {}) {
            const lang = I18n.getCurrentLang() || I18n.DEFAULT_LANG;
            const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
            const defaultOptions = {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            };
            return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options })
                .format(new Date(date));
        }
    };

    // Initialize on DOM ready
    function init() {
        I18n.init();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose globally
    window.AMD = window.AMD || {};
    window.AMD.I18n = I18n;
    window.AMD.Formatter = Formatter;

})();
