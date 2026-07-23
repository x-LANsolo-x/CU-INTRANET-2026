/* ═══════════════════════════════════════════════════════
   SYSTEM.JS — CU Co-Curricular Intranet Interactions
   Shared across all pages for smooth scrolling & animations
   ═══════════════════════════════════════════════════════ */

(function () {
    let preloaderDismissed = false;

    // ── DISMISS PRELOADER (Snappy Instant Display) ──
    function dismissPreloader() {
        if (preloaderDismissed) return;
        preloaderDismissed = true;
        const preloader = document.getElementById('sys-preloader');
        if (!preloader) return;

        if (typeof gsap !== 'undefined') {
            gsap.to(preloader, {
                opacity: 0,
                y: -20,
                duration: 0.35,
                ease: 'power2.out',
                onComplete: () => {
                    preloader.style.display = 'none';
                    runPageEntrances();
                }
            });
        } else {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 350);
            runPageEntrances();
        }
    }

    // Safety timeout - trigger immediately when DOM is interactive to feel zero loading
    setTimeout(dismissPreloader, 100);
    window.addEventListener('load', dismissPreloader);
    document.addEventListener('DOMContentLoaded', dismissPreloader);
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        dismissPreloader();
    }

    // ── STALE-WHILE-REVALIDATE CACHE & PREFETCH ──
    window.fetchWithCache = async function (url) {
        const cacheKey = 'cache_' + url;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                
                // Return cache instantly, fetch updates silently in background
                fetch(url)
                    .then(res => res.json())
                    .then(freshData => {
                        localStorage.setItem(cacheKey, JSON.stringify(freshData));
                        if (JSON.stringify(parsed) !== JSON.stringify(freshData)) {
                            // Dispatch event if content changed
                            window.dispatchEvent(new CustomEvent('cache_updated', { 
                                detail: { url, data: freshData } 
                            }));
                        }
                    })
                    .catch(() => {});
                return parsed;
            } catch (e) {
                localStorage.removeItem(cacheKey);
            }
        }
        
        const res = await fetch(url);
        const data = await res.json();
        localStorage.setItem(cacheKey, JSON.stringify(data));
        return data;
    };

    // Preload list of key images in background
    window.preloadImages = function (imageUrls) {
        if (!imageUrls || !imageUrls.length) return;
        setTimeout(() => {
            imageUrls.forEach(url => {
                const img = new Image();
                img.src = url;
            });
        }, 100);
    };

    // ── PAGE ENTRANCES ──
    function runPageEntrances() {
        if (typeof gsap === 'undefined') return;

        // Animate hero title and description
        gsap.from('.sys-page-title', {
            y: 30,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.out'
        });

        gsap.from('.sys-page-desc', {
            y: 20,
            opacity: 0,
            duration: 0.8,
            delay: 0.15,
            ease: 'power3.out'
        });

        gsap.from('.sys-breadcrumb', {
            y: 10,
            opacity: 0,
            duration: 0.6,
            delay: 0.05,
            ease: 'power3.out'
        });
    }

    /* ── LENIS SMOOTH SCROLL ── */
    let lenis;
    if (typeof Lenis !== 'undefined') {
        lenis = new Lenis({
            duration: 1.2,
            easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smooth: true,
            smoothTouch: false,
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            lenis.on('scroll', ScrollTrigger.update);
        }
    }

    /* ── SCROLL TRIGGER REVEALS ── */
    /* ── NATIVE SCROLL REVEALS & ANIMATIONS ── */
    // 1. Word reveal using local observer
    document.querySelectorAll('.word-reveal').forEach(el => {
        if (el.querySelector('.word') || el.getAttribute('data-word-reveal-processed')) return;
        el.setAttribute('data-word-reveal-processed', 'true');
        el.innerHTML = el.innerHTML
            .replace(/<br>/gi, ' <br> ')
            .replace(/([^<>\s][^<>]*?)(?=\s|$|<)/g, w => `<span class="word" style="opacity: 0.15; transition: opacity 0.4s ease;">${w}</span>`);
        
        const wordObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const words = el.querySelectorAll('.word');
                    words.forEach((w, idx) => {
                        w.style.transitionDelay = `${idx * 0.03}s`;
                        w.style.opacity = '1';
                    });
                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.15 });
        wordObserver.observe(el);
    });

    // 2. data-reveal and data-stagger observers
    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    };

    const revealObserver = new IntersectionObserver(revealCallback, {
        root: null,
        threshold: 0.06,
        rootMargin: '0px 0px -40px 0px'
    });

    document.querySelectorAll('[data-reveal], [data-stagger]').forEach(el => {
        revealObserver.observe(el);
    });

    window.observeNewElements = (selectorOrElements) => {
        const elements = typeof selectorOrElements === 'string'
            ? document.querySelectorAll(selectorOrElements)
            : selectorOrElements;
        if (elements && elements.forEach) {
            elements.forEach(el => revealObserver.observe(el));
        }
    };

    /* ── STICKY & HIDING HEADER ── */
    const header = document.getElementById('mainHeader');
    let lastScroll = 0;

    function handleScroll(scrollVal) {
        if (!header) return;
        if (scrollVal > 80) header.classList.add('sticky');
        else header.classList.remove('sticky');

        if (Math.abs(scrollVal - lastScroll) < 8) return;

        if (scrollVal <= 80) {
            header.classList.remove('header-hidden');
        } else if (scrollVal > lastScroll) {
            header.classList.add('header-hidden');
        } else {
            header.classList.remove('header-hidden');
        }
        lastScroll = scrollVal;
    }

    if (lenis) {
        lenis.on('scroll', ({ scroll }) => handleScroll(scroll));
    } else {
        window.addEventListener('scroll', () => handleScroll(window.scrollY));
    }

    /* ── GO TOP BUTTON ── */
    const goTop = document.getElementById('sys-go-top');
    if (goTop) {
        if (lenis) {
            lenis.on('scroll', ({ scroll }) => goTop.classList.toggle('show', scroll > 400));
            goTop.addEventListener('click', () => lenis.scrollTo(0, { duration: 1.2 }));
        } else {
            window.addEventListener('scroll', () => goTop.classList.toggle('show', window.scrollY > 400));
            goTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        }
    }

    /* ── MOBILE MENU DRAWER ── */
    const menuToggle = document.getElementById('menuToggle');
    const mobileNav = document.getElementById('mobileNav');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const mobileMenu = document.getElementById('mobileMenu');

    if (menuToggle && (mobileNav || mobileMenu)) {
        function openMenu() {
            menuToggle.classList.add('open');
            if (mobileNav) mobileNav.classList.add('open');
            if (mobileMenu) mobileMenu.classList.add('open');
            if (mobileOverlay) mobileOverlay.classList.add('open');
            if (lenis) lenis.stop();
        }

        function closeMenu() {
            menuToggle.classList.remove('open');
            if (mobileNav) mobileNav.classList.remove('open');
            if (mobileMenu) mobileMenu.classList.remove('open');
            if (mobileOverlay) mobileOverlay.classList.remove('open');
            if (lenis) lenis.start();
        }

        menuToggle.addEventListener('click', () => {
            const isOpen = (mobileNav && mobileNav.classList.contains('open')) || (mobileMenu && mobileMenu.classList.contains('open'));
            if (isOpen) closeMenu();
            else openMenu();
        });

        if (mobileOverlay) mobileOverlay.addEventListener('click', closeMenu);
        
        const links = (mobileNav ? Array.from(mobileNav.querySelectorAll('a')) : []).concat(mobileMenu ? Array.from(mobileMenu.querySelectorAll('a')) : []);
        links.forEach(a => a.addEventListener('click', closeMenu));

        // Close mobile nav on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const isOpen = (mobileNav && mobileNav.classList.contains('open')) || (mobileMenu && mobileMenu.classList.contains('open'));
                if (isOpen) { e.preventDefault(); closeMenu(); menuToggle.focus(); }
            }
        });

        // Make hamburger button accessible
        menuToggle.setAttribute('role', 'button');
        menuToggle.setAttribute('tabindex', '0');
        menuToggle.setAttribute('aria-label', 'Toggle navigation menu');
        menuToggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); menuToggle.click(); }
        });
    }

    // ── ZERO-LATENCY PREFETCH ENGINE ──
    function setupPrefetching() {
        // 1. Pre-cache all 4 entity JSON datasets immediately during idle
        const jsonUrls = [
            './clubs.json',
            './communities.json',
            './departmental-societies.json',
            './professional-societies.json'
        ];

        const preCacheAll = () => {
            jsonUrls.forEach(url => {
                if (window.fetchWithCache) {
                    window.fetchWithCache(url).catch(() => {});
                }
            });
        };

        if ('requestIdleCallback' in window) {
            requestIdleCallback(preCacheAll, { timeout: 1500 });
        } else {
            setTimeout(preCacheAll, 300);
        }

        // 2. Instant link prefetching on hover, focus, or touch
        const prefetchedUrls = new Set();

        function prefetchTarget(href) {
            if (!href || prefetchedUrls.has(href)) return;
            prefetchedUrls.add(href);

            // Add rel=prefetch tag to browser head
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = href;
            document.head.appendChild(link);

            // Also trigger background fetch for JSON assets if linking to explore
            if (href.includes('explore')) {
                jsonUrls.forEach(u => {
                    if (window.fetchWithCache) window.fetchWithCache(u).catch(() => {});
                });
            }
        }

        const handleLinkInteraction = (e) => {
            const a = e.target.closest('a');
            if (!a) return;
            const href = a.getAttribute('href');
            if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
                prefetchTarget(href.split('#')[0]);
            }
        };

        document.addEventListener('mouseover', handleLinkInteraction, { passive: true });
        document.addEventListener('touchstart', handleLinkInteraction, { passive: true });
        document.addEventListener('focusin', handleLinkInteraction, { passive: true });
    }


    // ── SYSTEM-WIDE AUTOMATED IMAGE LOAD OPTIMIZATION ──
    function optimizeImage(img) {
        if (img.classList.contains('blur-image')) return;
        
        // Skip header/footer logos, icons, and carousels
        if (img.closest('.sys-logo') || img.closest('.sys-footer-logo') || img.closest('.sys-header') || img.closest('.sys-footer') || img.closest('.modal-carousel') || img.closest('.card-mini-carousel')) return;
        
        // Skip tiny icons, decorations, or SVGs
        const src = img.getAttribute('src') || '';
        if (src.includes('favicon') || src.endsWith('.svg') || (img.width > 0 && img.width < 32)) return;
        
        img.classList.add('blur-image');
        
        // Ensure parent shows shimmer placeholder
        const parent = img.parentElement;
        if (parent) {
            const parentStyles = window.getComputedStyle(parent);
            if (parentStyles.position === 'static') {
                parent.style.position = 'relative';
            }
            parent.style.overflow = 'hidden';
            if (!parent.classList.contains('ov-img-wrap') && 
                !parent.classList.contains('pillar-img-wrap') && 
                !parent.classList.contains('card-img') && 
                !parent.classList.contains('card-logo-wrap') &&
                parentStyles.backgroundColor === 'rgba(0, 0, 0, 0)') {
                parent.style.backgroundColor = '#f0f0f4';
            }
        }

        if (img.complete) {
            img.classList.add('loaded');
        } else {
            img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
            img.addEventListener('error', () => img.classList.add('loaded'), { once: true });
        }
    }

    function setupImageOptimization() {
        // Optimize existing images
        document.querySelectorAll('img').forEach(optimizeImage);

        // Listen for new images added to DOM dynamically
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeName === 'IMG') {
                        optimizeImage(node);
                    } else if (node.querySelectorAll) {
                        node.querySelectorAll('img').forEach(optimizeImage);
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // ── ENFORCE SINGLE-DOMAIN SAME-TAB ROUTING ──
    function enforceSingleDomainTabs() {
        document.querySelectorAll('a[href]').forEach(a => {
            const href = a.getAttribute('href') || '';
            const isExternal = href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//');
            if (!isExternal) {
                // Internal route: remove target="_blank" to ensure single tab navigation
                if (a.getAttribute('target') === '_blank') {
                    a.removeAttribute('target');
                }
            } else {
                // External webservice link: secure with noopener noreferrer
                if (a.getAttribute('target') === '_blank' && !a.getAttribute('rel')) {
                    a.setAttribute('rel', 'noopener noreferrer');
                }
            }
        });
    }

    // ── LIVE FEEDBACK POPUP SYSTEM ──
    function initLiveFeedbackModal() {
        if (document.getElementById('fb-modal-overlay')) return;

        const modalHTML = `
            <button id="fb-trigger-btn" aria-label="Open Live Feedback Form">
                <span class="fb-pulse"></span>
                <i class="fas fa-comments fb-icon"></i>
                <span>Live Feedback</span>
            </button>

            <div id="fb-modal-overlay" aria-hidden="true">
                <div id="fb-modal-card" role="dialog" aria-modal="true" aria-labelledby="fb-modal-title">
                    <div class="fb-header">
                        <h3 id="fb-modal-title"><i class="fas fa-star-half-alt"></i> Freshman 2026 Feedback</h3>
                        <p>Share your experience about Freshman 2026 stalls & activities</p>
                        <button class="fb-close-btn" id="fb-close-btn" aria-label="Close Feedback Form">&times;</button>
                    </div>
                    <div class="fb-body">
                        <form id="fb-live-form">
                            <div class="fb-q-group">
                                <label class="fb-q-label">1. Rate the Co-curricular Stalls <span class="req">*</span></label>
                                <div class="fb-stars-wrapper" data-rating-id="stalls">
                                    <div class="fb-stars">
                                        <i class="fas fa-star fb-star" data-val="1"></i>
                                        <i class="fas fa-star fb-star" data-val="2"></i>
                                        <i class="fas fa-star fb-star" data-val="3"></i>
                                        <i class="fas fa-star fb-star" data-val="4"></i>
                                        <i class="fas fa-star fb-star" data-val="5"></i>
                                    </div>
                                    <span class="fb-rating-hint">Tap to rate</span>
                                </div>
                            </div>

                            <div class="fb-q-group">
                                <label class="fb-q-label">2. Rate Freshman 2026 Activities <span class="req">*</span></label>
                                <div class="fb-stars-wrapper" data-rating-id="activities">
                                    <div class="fb-stars">
                                        <i class="fas fa-star fb-star" data-val="1"></i>
                                        <i class="fas fa-star fb-star" data-val="2"></i>
                                        <i class="fas fa-star fb-star" data-val="3"></i>
                                        <i class="fas fa-star fb-star" data-val="4"></i>
                                        <i class="fas fa-star fb-star" data-val="5"></i>
                                    </div>
                                    <span class="fb-rating-hint">Tap to rate</span>
                                </div>
                            </div>

                            <div class="fb-q-group">
                                <label class="fb-q-label">3. Overall Co-curricular Experience <span class="req">*</span></label>
                                <div class="fb-stars-wrapper" data-rating-id="cocurricular">
                                    <div class="fb-stars">
                                        <i class="fas fa-star fb-star" data-val="1"></i>
                                        <i class="fas fa-star fb-star" data-val="2"></i>
                                        <i class="fas fa-star fb-star" data-val="3"></i>
                                        <i class="fas fa-star fb-star" data-val="4"></i>
                                        <i class="fas fa-star fb-star" data-val="5"></i>
                                    </div>
                                    <span class="fb-rating-hint">Tap to rate</span>
                                </div>
                            </div>

                            <div class="fb-q-group">
                                <label class="fb-q-label" for="fb-stall-cat">4. Which category stall did you like the most? <span class="req">*</span></label>
                                <select id="fb-stall-cat" class="fb-select" required>
                                    <option value="" disabled selected>-- Select Stall Category --</option>
                                    <option value="Science Innovation and Technology">Science Innovation and Technology</option>
                                    <option value="Social Impact and Development">Social Impact and Development</option>
                                    <option value="Business Media and Management">Business Media and Management</option>
                                    <option value="E-sport and Game Development">E-sport and Game Development</option>
                                </select>
                            </div>

                            <div class="fb-q-group">
                                <label class="fb-q-label" for="fb-comments">5. Any suggestions or comments?</label>
                                <textarea id="fb-comments" class="fb-textarea" placeholder="Share your suggestions or feedback..."></textarea>
                            </div>

                            <button type="submit" class="fb-submit-btn" id="fb-submit-btn">
                                <span>Submit Feedback</span> <i class="fas fa-paper-plane"></i>
                            </button>
                        </form>

                        <div class="fb-success-view" id="fb-success-view">
                            <div class="fb-success-icon"><i class="fas fa-check"></i></div>
                            <h4>Thank You for Your Feedback!</h4>
                            <p>Your feedback for Freshman 2026 has been submitted successfully.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const overlay = document.getElementById('fb-modal-overlay');
        const triggerBtn = document.getElementById('fb-trigger-btn');
        const closeBtn = document.getElementById('fb-close-btn');
        const form = document.getElementById('fb-live-form');
        const successView = document.getElementById('fb-success-view');

        const ratings = { stalls: 0, activities: 0, cocurricular: 0 };
        const hints = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'];

        // Rating Stars Handler
        document.querySelectorAll('.fb-stars-wrapper').forEach(wrapper => {
            const groupKey = wrapper.getAttribute('data-rating-id');
            const stars = wrapper.querySelectorAll('.fb-star');
            const hintEl = wrapper.querySelector('.fb-rating-hint');

            stars.forEach(star => {
                star.addEventListener('mouseenter', () => {
                    const val = parseInt(star.getAttribute('data-val'), 10);
                    stars.forEach((s, idx) => {
                        s.classList.toggle('active', idx < val);
                    });
                    if (hintEl) hintEl.textContent = hints[val];
                });

                wrapper.addEventListener('mouseleave', () => {
                    const currentVal = ratings[groupKey];
                    stars.forEach((s, idx) => {
                        s.classList.toggle('active', idx < currentVal);
                    });
                    if (hintEl) hintEl.textContent = currentVal ? hints[currentVal] : 'Tap to rate';
                });

                star.addEventListener('click', () => {
                    const val = parseInt(star.getAttribute('data-val'), 10);
                    ratings[groupKey] = val;
                    stars.forEach((s, idx) => {
                        s.classList.toggle('active', idx < val);
                    });
                    if (hintEl) hintEl.textContent = hints[val];
                });
            });
        });

        // Open & Close
        window.openFeedbackForm = function () {
            if (overlay) {
                overlay.classList.add('active');
                overlay.setAttribute('aria-hidden', 'false');
            }
        };

        window.closeFeedbackForm = function () {
            if (overlay) {
                overlay.classList.remove('active');
                overlay.setAttribute('aria-hidden', 'true');
            }
        };

        if (triggerBtn) {
            triggerBtn.addEventListener('click', window.openFeedbackForm);
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', window.closeFeedbackForm);
        }

        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) window.closeFeedbackForm();
            });
        }

        // Form Submit
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();

                if (!ratings.stalls || !ratings.activities || !ratings.cocurricular) {
                    alert('Please rate all 3 rating questions before submitting.');
                    return;
                }

                const catSelect = document.getElementById('fb-stall-cat');
                if (!catSelect || !catSelect.value) {
                    alert('Please select which category stall you liked the most.');
                    return;
                }

                form.style.display = 'none';
                if (successView) successView.classList.add('active');

                setTimeout(() => {
                    window.closeFeedbackForm();
                    setTimeout(() => {
                        form.reset();
                        form.style.display = 'block';
                        if (successView) successView.classList.remove('active');
                        ratings.stalls = 0;
                        ratings.activities = 0;
                        ratings.cocurricular = 0;
                        document.querySelectorAll('.fb-star').forEach(s => s.classList.remove('active'));
                        document.querySelectorAll('.fb-rating-hint').forEach(h => h.textContent = 'Tap to rate');
                    }, 400);
                }, 2500);
            });
        }
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setupPrefetching();
        setupImageOptimization();
        enforceSingleDomainTabs();
        initLiveFeedbackModal();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            setupPrefetching();
            setupImageOptimization();
            enforceSingleDomainTabs();
            initLiveFeedbackModal();
        });
    }
})();


