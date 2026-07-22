document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const menuToggle = document.getElementById('menuToggle') || document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            menuToggle.classList.toggle('open');
            mobileMenu.classList.toggle('open');
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!mobileMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                menuToggle.classList.remove('open');
                mobileMenu.classList.remove('open');
            }
        });
    }

    // Scroll to Top Button
    const goTop = document.getElementById('sys-go-top');
    if (goTop) {
        window.addEventListener('scroll', () => {
            goTop.classList.toggle('show', window.scrollY > 400);
        });
        goTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});
