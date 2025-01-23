// Initialize GSAP
gsap.registerPlugin(ScrollTrigger);

// Hero section animation - Modified to prevent disappearing
gsap.fromTo('.hero-content', 
  {
    opacity: 0,
    y: 50,
    rotationX: 15
  },
  {
    opacity: 1,
    y: 0,
    rotationX: 0,
    duration: 2,
    ease: 'power4.out'
  }
);

// Floating animation for the logo
gsap.to('.logo-image', {
  rotationY: 360,
  duration: 20,
  repeat: -1,
  ease: 'none'
});

// Feature cards animation with 3D rotation
gsap.utils.toArray('.feature-card').forEach((card, i) => {
  gsap.from(card, {
    scrollTrigger: {
      trigger: card,
      start: 'top bottom-=100',
      toggleActions: 'play none none reverse'
    },
    opacity: 0,
    y: 100,
    rotationX: 45,
    duration: 1,
    delay: i * 0.2,
    ease: 'power3.out'
  });
  
  // Animate feature icons
  gsap.to(card.querySelector('.feature-icon'), {
    scrollTrigger: {
      trigger: card,
      start: 'top center',
      toggleActions: 'play none none reverse'
    },
    rotateY: 360,
    duration: 1.5,
    ease: 'power2.inOut'
  });
});

// Enhanced 3D tilt effect for cards
document.querySelectorAll('.feature-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / 10) * -1;
    const rotateY = (x - centerX) / 10;
    
    gsap.to(card, {
      duration: 0.5,
      rotateX: rotateX,
      rotateY: rotateY,
      scale: 1.05,
      ease: 'power2.out',
      transformPerspective: 1000,
      transformOrigin: 'center'
    });
    
    // Animate shadow based on movement
    gsap.to(card, {
      duration: 0.5,
      boxShadow: `${(x - centerX) / 10}px ${(y - centerY) / 10}px 30px rgba(0,0,0,0.1)`,
      ease: 'power2.out'
    });
  });
  
  card.addEventListener('mouseleave', () => {
    gsap.to(card, {
      duration: 0.5,
      rotateX: 0,
      rotateY: 0,
      scale: 1,
      boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
      ease: 'power2.out'
    });
  });
});

// Parallax scroll effect for owner section with 3D rotation
gsap.to('.owner-card', {
  scrollTrigger: {
    trigger: '.owner-section',
    start: 'top center',
    end: 'bottom top',
    scrub: 1
  },
  y: -50,
  rotateX: 10,
  scale: 1.05
});

// Smooth scroll for navigation with enhanced easing
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    
    gsap.to(window, {
      duration: 1.5,
      scrollTo: target,
      ease: 'power4.inOut'
    });
  });
});