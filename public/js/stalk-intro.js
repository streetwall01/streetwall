document.addEventListener('DOMContentLoaded', () => {
    gsap.registerPlugin(ScrollTrigger);

    // Initial setup
    gsap.set('.logo-image', { scale: 0, rotation: -180 });
    gsap.set('.logo-text', { opacity: 0, y: 20 });
    gsap.set('.loading-text', { opacity: 0, y: 10 });
    gsap.set('.line', { width: 0 });
    
    // Create timeline for intro animation
    const tl = gsap.timeline({
        defaults: { ease: "power3.out" }
    });

    // Animate logo and text
    tl.to('.logo-image', {
        scale: 1,
        rotation: 0,
        duration: 1.2,
        ease: "elastic.out(1, 0.5)"
    })
    .to('.logo-text', {
        opacity: 1,
        y: 0,
        duration: 0.8
    }, "-=0.5")
    .to('.loading-text', {
        opacity: 1,
        y: 0,
        duration: 0.6
    }, "-=0.3")
    .to('.line', {
        width: '100%',
        duration: 1.5,
        ease: "power1.inOut"
    }, "-=0.8");

    // After 2.5 seconds, start content reveal
    setTimeout(() => {
        // Hide intro animation
        gsap.to('.intro-animation', {
            opacity: 0,
            duration: 0.5,
            onComplete: () => {
                document.querySelector('.intro-animation').style.display = 'none';
            }
        });

        // Reveal content animations
        const contentTl = gsap.timeline();

        // Animate post header
        contentTl.from('.post-header', {
            y: -50,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out"
        });

        // Animate media items with stagger
        if (document.querySelectorAll('.reveal-item').length > 0) {
            contentTl.to('.reveal-item', {
                opacity: 1,
                y: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: "power2.out"
            }, "-=0.4");
        }

        // Animate text and footer
        contentTl.to('.reveal-text', {
            opacity: 1,
            x: 0,
            duration: 0.8,
            ease: "power2.out"
        }, "-=0.2")
        .to('.reveal-footer', {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power2.out"
        }, "-=0.4");

        // Add hover animations for media items
        const mediaItems = document.querySelectorAll('.media-item');
        mediaItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                gsap.to(item, {
                    scale: 1.02,
                    duration: 0.3,
                    ease: "power2.out"
                });
                gsap.to(item.querySelector('.media-overlay'), {
                    opacity: 1,
                    duration: 0.3
                });
            });

            item.addEventListener('mouseleave', () => {
                gsap.to(item, {
                    scale: 1,
                    duration: 0.3,
                    ease: "power2.out"
                });
                gsap.to(item.querySelector('.media-overlay'), {
                    opacity: 0,
                    duration: 0.3
                });
            });
        });

        // Add scroll trigger animations
        ScrollTrigger.batch(".media-item", {
            onEnter: batch => gsap.to(batch, {
                opacity: 1,
                y: 0,
                stagger: 0.15,
                overwrite: true
            }),
            start: "top bottom-=100px",
            end: "bottom top+=100px",
            markers: false
        });

    }, 2500);
});