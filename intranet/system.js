/* ═══════════════════════════════════════════════════════
   SYSTEM.JS — CU Co-Curricular Intranet Interactions
   Shared across all pages for smooth scrolling & animations
   ═══════════════════════════════════════════════════════ */

(function () {
    let preloaderDismissed = false;

    // ── DISMISS PRELOADER ──
    function dismissPreloader() {
        if (preloaderDismissed) return;
        preloaderDismissed = true;
        const preloader = document.getElementById('sys-preloader');
        if (!preloader) return;

        if (typeof gsap !== 'undefined') {
            gsap.to(preloader, {
                opacity: 0,
                y: -40,
                duration: 0.8,
                ease: 'power4.inOut',
                onComplete: () => {
                    preloader.style.display = 'none';
                    runPageEntrances();
                }
            });
        } else {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 800);
            runPageEntrances();
        }
    }

    // Safety timeout
    setTimeout(dismissPreloader, 2000);
    window.addEventListener('load', dismissPreloader);
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        dismissPreloader();
    }

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
})();
