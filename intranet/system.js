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
            gsap.ticker.add(time => lenis.raf(time * 1000));
            gsap.ticker.lagSmoothing(0);
        }
    }

    /* ── SCROLL TRIGGER REVEALS ── */
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        // Word reveal
        document.querySelectorAll('.word-reveal').forEach(el => {
            el.innerHTML = el.innerHTML
                .replace(/<br>/gi, ' <br> ')
                .replace(/([^<>\s][^<>]*?)(?=\s|$|<)/g, w => `<span class="word" style="opacity: 0.1; transition: opacity 0.15s ease;">${w}</span>`);
            
            gsap.to(el.querySelectorAll('.word'), {
                opacity: 1,
                stagger: 0.05,
                ease: 'none',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 88%',
                    end: 'bottom 60%',
                    scrub: 0.3
                }
            });
        });

        // Stagger list elements
        gsap.utils.toArray('[data-stagger]').forEach(group => {
            const items = group.querySelectorAll('[data-stagger-item]');
            gsap.from(items, {
                y: 50,
                opacity: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: group,
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                }
            });
        });

        // Standard fade reveals
        gsap.utils.toArray('[data-reveal]').forEach(el => {
            const revealType = el.getAttribute('data-reveal');
            let vars = {
                opacity: 1,
                duration: 0.9,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 88%',
                    toggleActions: 'play none none none'
                }
            };

            if (revealType === 'left') {
                gsap.fromTo(el, { x: -40, opacity: 0 }, { x: 0, ...vars });
            } else if (revealType === 'right') {
                gsap.fromTo(el, { x: 40, opacity: 0 }, { x: 0, ...vars });
            } else if (revealType === 'scale') {
                gsap.fromTo(el, { scale: 0.92, opacity: 0 }, { scale: 1, ...vars });
            } else {
                gsap.fromTo(el, { y: 40, opacity: 0 }, { y: 0, ...vars });
            }
        });
    }

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
