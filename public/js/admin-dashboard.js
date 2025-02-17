// Initialize GSAP
gsap.registerPlugin(ScrollTrigger);

// Socket.io connection
const socket = io();

// DOM Elements
const sidebar = document.querySelector('.sidebar');
const mainContent = document.querySelector('.main-content');
const menuToggle = document.querySelector('.menu-toggle');
const statCards = document.querySelectorAll('.stat-card');
const dataCards = document.querySelectorAll('.data-card');
const charts = document.querySelectorAll('.chart-card');

let activityChart, distributionChart;

// Toggle Sidebar
function toggleSidebar() {
  sidebar.classList.toggle('collapsed');
  mainContent.classList.toggle('expanded');
}

// Clear all appeals
async function clearAllAppeals() {
  if (!confirm('Are you sure you want to clear all appeals? This action cannot be undone.')) {
    return;
  }

  try {
    const response = await fetch('/admin/clear-appeals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to clear appeals');
    }

    // Remove all appeal rows with animation
    const appealRows = document.querySelectorAll('tr[data-appeal-id]');
    appealRows.forEach(row => {
      gsap.to(row, {
        duration: 0.3,
        height: 0,
        opacity: 0,
        ease: "power3.in",
        onComplete: () => row.remove()
      });
    });

    showNotification('All appeals cleared successfully');
    socket.emit('requestStats');
  } catch (error) {
    console.error('Error:', error);
    showNotification('Failed to clear appeals', 'error');
  }
}

// Initialize Charts
function initializeCharts() {
  // Activity Chart
  const activityChartOptions = {
    series: [{
      name: 'Posts',
      data: [0, 0, 0, 0, 0, 0, 0]
    }, {
      name: 'Appeals',
      data: [0, 0, 0, 0, 0, 0, 0]
    }],
    chart: {
      type: 'area',
      height: 350,
      toolbar: {
        show: false
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      }
    },
    colors: ['#4f46e5', '#ef4444'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3,
        stops: [0, 90, 100]
      }
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    xaxis: {
      categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    tooltip: {
      theme: 'dark'
    }
  };

  activityChart = new ApexCharts(
    document.querySelector('#activityChart'),
    activityChartOptions
  );
  activityChart.render();

  // Distribution Chart
  const distributionChartOptions = {
    series: [0, 0, 0, 0], // Images, Videos, Text, Other
    chart: {
      type: 'donut',
      height: 350
    },
    labels: ['Images', 'Videos', 'Text', 'Other'],
    colors: ['#4f46e5', '#ef4444', '#22c55e', '#f59e0b'],
    plotOptions: {
      pie: {
        donut: {
          size: '70%'
        }
      }
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          height: 300
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
  };

  distributionChart = new ApexCharts(
    document.querySelector('#distributionChart'),
    distributionChartOptions
  );
  distributionChart.render();
}

// Update Stats
function updateStats(data) {
  // Update total posts
  const totalPostsElement = document.getElementById('totalPosts');
  if (totalPostsElement) {
    gsap.to(totalPostsElement, {
      textContent: data.totalPosts,
      duration: 1,
      snap: { textContent: 1 },
      ease: "power1.out"
    });
  }

  // Update total media
  const totalMediaElement = document.getElementById('totalMedia');
  if (totalMediaElement) {
    gsap.to(totalMediaElement, {
      textContent: data.totalMedia,
      duration: 1,
      snap: { textContent: 1 },
      ease: "power1.out"
    });
  }

  // Update pending appeals
  const pendingAppealsElement = document.getElementById('pendingAppeals');
  if (pendingAppealsElement) {
    gsap.to(pendingAppealsElement, {
      textContent: data.pendingAppeals,
      duration: 1,
      snap: { textContent: 1 },
      ease: "power1.out"
    });
  }

  // Update percentage changes
  updatePercentageChange('postsChange', data.postsChangePercentage);
  updatePercentageChange('mediaChange', data.mediaChangePercentage);
  updatePercentageChange('appealsChange', data.appealsChangePercentage);
}

function updatePercentageChange(elementId, percentage) {
  const element = document.getElementById(elementId);
  if (element) {
    const isPositive = percentage >= 0;
    element.textContent = `${isPositive ? '+' : ''}${percentage.toFixed(1)}%`;
    element.style.color = isPositive ? '#22c55e' : '#ef4444';
  }
}

// Update Activity Chart
function updateActivityChart(data) {
  if (activityChart) {
    activityChart.updateSeries([
      {
        name: 'Posts',
        data: data.posts
      },
      {
        name: 'Appeals',
        data: data.appeals
      }
    ]);
  }
}

// Update Distribution Chart
function updateDistributionChart(data) {
  if (distributionChart) {
    distributionChart.updateSeries([
      data.images,
      data.videos,
      data.text,
      data.other
    ]);
  }
}

// Handle Appeals
async function handleAppeal(appealId, postId, status) {
  try {
    const response = await fetch(`/admin/handle-appeal/${appealId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status, postId })
    });

    if (!response.ok) throw new Error('Failed to handle appeal');

    const data = await response.json();
    
    // Animate appeal card update
    const appealCard = document.querySelector(`[data-appeal-id="${appealId}"]`);
    if (appealCard) {
      gsap.to(appealCard, {
        duration: 0.3,
        scale: 0.95,
        opacity: 0,
        ease: "power2.in",
        onComplete: () => {
          updateAppealCard(appealCard, status);
          gsap.to(appealCard, {
            duration: 0.3,
            scale: 1,
            opacity: 1,
            ease: "power2.out"
          });
        }
      });
    }

    showNotification(`Appeal ${status}`, 'success');
  } catch (error) {
    console.error('Error handling appeal:', error);
    showNotification('Failed to handle appeal', 'error');
  }
}

// Delete Post
async function deletePost(postId) {
  if (!confirm('Are you sure you want to delete this post?')) return;

  try {
    const response = await fetch(`/admin/delete-post/${postId}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Failed to delete post');

    const row = document.querySelector(`tr[data-post-id="${postId}"]`);
    if (row) {
      gsap.to(row, {
        duration: 0.3,
        height: 0,
        opacity: 0,
        ease: "power3.in",
        onComplete: () => row.remove()
      });
    }

    showNotification('Post deleted successfully');
    socket.emit('requestStats');
  } catch (error) {
    console.error('Error:', error);
    showNotification('Failed to delete post', 'error');
  }
}

// Show Notification
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  gsap.to(notification, {
    duration: 0.3,
    y: 0,
    opacity: 1,
    ease: "power3.out"
  });
  
  setTimeout(() => {
    gsap.to(notification, {
      duration: 0.3,
      y: -20,
      opacity: 0,
      ease: "power3.in",
      onComplete: () => notification.remove()
    });
  }, 3000);
}

// Socket Events
socket.on('connect', () => {
  console.log('Connected to Street Wall Server');
  socket.emit('requestStats');
});

socket.on('statsUpdate', (data) => {
  updateStats(data);
  updateActivityChart(data.activity);
  updateDistributionChart(data.distribution);
});

socket.on('newPost', () => {
  socket.emit('requestStats');
});

socket.on('newAppeal', () => {
  socket.emit('requestStats');
});

socket.on('postDeleted', () => {
  socket.emit('requestStats');
});

socket.on('appealUpdated', () => {
  socket.emit('requestStats');
});

// Navigation handling
function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-section]');
    const sections = document.querySelectorAll('.section');
    
    // Function to show section
    function showSection(sectionId) {
        sections.forEach(section => {
            section.classList.remove('active');
        });
        
        navItems.forEach(item => {
            item.classList.remove('active');
        });
        
        const targetSection = document.getElementById(sectionId);
        const targetNavItem = document.querySelector(`[data-section="${sectionId}"]`);
        
        if (targetSection && targetNavItem) {
            targetSection.classList.add('active');
            targetNavItem.classList.add('active');
            
            // Animate section entrance
            gsap.fromTo(targetSection,
                {
                    opacity: 0,
                    y: 20
                },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.5,
                    ease: "power2.out"
                }
            );
        }
    }
    
    // Handle navigation clicks
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = item.getAttribute('data-section');
            history.pushState(null, '', item.getAttribute('href'));
            showSection(sectionId);
        });
    });
    
    // Handle browser back/forward
    window.addEventListener('popstate', () => {
        const hash = window.location.hash.slice(1) || 'dashboard';
        showSection(`${hash}-section`);
    });
    
    // Show initial section based on hash
    const initialHash = window.location.hash.slice(1) || 'dashboard';
    showSection(`${initialHash}-section`);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initializeCharts();
  
  // Menu Toggle Event
  menuToggle?.addEventListener('click', toggleSidebar);
  
  // Responsive Sidebar
  if (window.innerWidth <= 768) {
    sidebar.classList.add('collapsed');
    mainContent.classList.add('expanded');
  }
  
  // Window Resize Handler
  window.addEventListener('resize', () => {
    if (window.innerWidth <= 768) {
      sidebar.classList.add('collapsed');
      mainContent.classList.add('expanded');
    } else {
      sidebar.classList.remove('collapsed');
      mainContent.classList.remove('expanded');
    }
  });

  // Request initial stats
  socket.emit('requestStats');
  
  initializeNavigation();
});