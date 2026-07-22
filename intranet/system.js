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

    if (menuToggle && mobileNav && mobileOverlay) {
        function openMenu() {
            menuToggle.classList.add('open');
            mobileNav.classList.add('open');
            mobileOverlay.classList.add('open');
            if (lenis) lenis.stop();
        }

        function closeMenu() {
            menuToggle.classList.remove('open');
            mobileNav.classList.remove('open');
            mobileOverlay.classList.remove('open');
            if (lenis) lenis.start();
        }

        menuToggle.addEventListener('click', () => {
            if (mobileNav.classList.contains('open')) closeMenu();
            else openMenu();
        });

        mobileOverlay.addEventListener('click', closeMenu);
        mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
    }

    // ── LINK HOVER PREFETCHING ──
    function setupPrefetching() {
        const prefLinks = [
            { path: 'clubs', url: './clubs.json' },
            { path: 'communities', url: './communities.json' },
            { path: 'departmental', url: './departmental-societies.json' },
            { path: 'professional', url: './professional-societies.json' }
        ];
        
        prefLinks.forEach(item => {
            document.querySelectorAll(`a[href*="${item.path}"]`).forEach(el => {
                el.addEventListener('mouseenter', () => {
                    if (!localStorage.getItem('cache_' + item.url)) {
                        fetch(item.url)
                            .then(res => res.json())
                            .then(data => localStorage.setItem('cache_' + item.url, JSON.stringify(data)))
                            .catch(() => {});
                    }
                }, { once: true });
            });
        });
    }

    // ── SYSTEM-WIDE AUTOMATED IMAGE LOAD OPTIMIZATION ──
    function optimizeImage(img) {
        if (img.classList.contains('blur-image')) return;
        
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

    // ── LOCAL DEV ROUTE POLYFILL (Supports both clean URLs in prod and raw files in local dev) ──
    function setupRoutePolyfill() {
        const isLocalFile = window.location.protocol === 'file:';
        const isStaticLocal = window.location.hostname === 'localhost' && window.location.port !== '3000' && window.location.port !== '5000';
        const isIpLocal = (window.location.hostname === '127.0.0.1' || window.location.hostname === '::1') && window.location.port !== '3000' && window.location.port !== '5000';

        if (isLocalFile || isStaticLocal || isIpLocal) {
            document.querySelectorAll('a[href]').forEach(el => {
                let href = el.getAttribute('href');
                if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto') && !href.startsWith('javascript')) {
                    if (href.startsWith('/')) {
                        href = href.substring(1);
                    }
                    const parts = href.split('#');
                    let path = parts[0];
                    const hash = parts[1] ? '#' + parts[1] : '';
                    
                    if (path && !path.includes('.') && path !== './' && path !== '/') {
                        el.setAttribute('href', path + '.html' + hash);
                    } else if (path === '' || path === '/') {
                        el.setAttribute('href', 'index.html' + hash);
                    }
                }
            });
        }
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setupPrefetching();
        setupImageOptimization();
        setupRoutePolyfill();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            setupPrefetching();
            setupImageOptimization();
            setupRoutePolyfill();
        });
    }
})();
