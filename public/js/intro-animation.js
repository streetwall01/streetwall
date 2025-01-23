document.addEventListener('DOMContentLoaded', () => {
    const hasSeenIntro = sessionStorage.getItem('hasSeenIntro');
    const introAnimation = document.querySelector('.intro-animation');
    const rainContainer = document.querySelector('.rain-container');

    if (hasSeenIntro) {
        introAnimation.style.display = 'none';
        return;
    }

    sessionStorage.setItem('hasSeenIntro', 'true');

    // Words for the rain effect
    const words = ['Community', 'Expression', 'Freedom', 'Street Wall', 'Share', 'Connect', 'Create', 'Inspire', 'Together', 'Stories'];

    // Create raining words
    function createRainWords() {
        for (let i = 0; i < 50; i++) {
            const word = document.createElement('div');
            word.className = 'rain-word';
            word.textContent = words[Math.floor(Math.random() * words.length)];
            word.style.left = `${Math.random() * 100}%`;
            word.style.top = `-${50 + Math.random() * 100}px`;
            word.style.fontSize = `${12 + Math.random() * 24}px`;
            word.style.opacity = 0.1 + Math.random() * 0.3;
            rainContainer.appendChild(word);

            gsap.to(word, {
                y: window.innerHeight + 100,
                duration: 3 + Math.random() * 7,
                delay: Math.random() * 2,
                ease: "none",
                repeat: -1
            });
        }
    }

    const tl = gsap.timeline({
        defaults: { ease: "power3.out" }
    });

    // Initial setup
    gsap.set('.logo-container', { 
        opacity: 1,
        rotationX: -30,
        transformPerspective: 1000
    });

    gsap.set('.text-3d', { 
        opacity: 0,
        rotationX: 90,
        transformOrigin: "50% 50% -50px"
    });

    // Create rain effect
    createRainWords();

    // Responsive mouse/touch movement effect
    const handleMovement = (e) => {
        const isTouchEvent = e.type.startsWith('touch');
        const pageX = isTouchEvent ? e.touches[0].pageX : e.pageX;
        const pageY = isTouchEvent ? e.touches[0].pageY : e.pageY;

        const xAxis = (window.innerWidth / 2 - pageX) / (window.innerWidth > 768 ? 25 : 40);
        const yAxis = (window.innerHeight / 2 - pageY) / (window.innerWidth > 768 ? 25 : 40);

        gsap.to('.logo-container', {
            rotationY: xAxis,
            rotationX: yAxis,
            duration: 0.5,
            ease: "power2.out"
        });
    };

    introAnimation.addEventListener('mousemove', handleMovement);
    introAnimation.addEventListener('touchmove', handleMovement);

    // Animation sequence
    tl.to('.text-3d', {
        opacity: 1,
        rotationX: 0,
        duration: 1.5,
        stagger: 0.3,
        ease: "back.out(1.7)"
    })
    .to('.line', {
        width: '100%',
        opacity: 1,
        duration: 1,
        stagger: 0.3,
        ease: "power2.inOut"
    }, "-=1")
    .to('.glow', {
        width: '200%',
        height: '200%',
        opacity: 0.5,
        duration: 1.5,
        ease: "power2.inOut"
    }, "-=0.5")
    .to('.rain-word', {
        opacity: 0,
        duration: 0.5,
        stagger: 0.02
    }, "+=1")
    .to('.logo-container', {
        rotationX: 720,
        rotationY: 360,
        scale: 0,
        opacity: 0,
        duration: 1.5,
        ease: "power3.inOut"
    }, "-=0.3")
    .to('.intro-animation', {
        opacity: 0,
        duration: 0.5,
        onComplete: () => {
            introAnimation.style.display = 'none';
        }
    }, "-=0.3");
});