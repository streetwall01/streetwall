document.addEventListener('DOMContentLoaded', () => {
    const mediaViewer = document.querySelector('.media-viewer');
    const mediaItems = document.querySelectorAll('.media-item');
    const viewCount = document.querySelector('.view-count');
    const postId = document.querySelector('[data-post-id]')?.dataset.postId;
    const mediaGrid = document.querySelector('.media-grid');
    let currentMediaIndex = 0;
    const ITEMS_PER_PAGE = 12;
    let currentPage = 1;

    // Initialize Socket.IO
    const socket = io();

    // Update view count
    if (postId) {
        socket.emit('viewPost', postId);
    }

    socket.on('updateViews', (count) => {
        if (viewCount) {
            viewCount.textContent = count;
        }
    });

    // Pagination controls
    const prevPageBtn = document.querySelector('.prev-page');
    const nextPageBtn = document.querySelector('.next-page');
    const pageInfo = document.querySelector('.page-info');

    if (prevPageBtn && nextPageBtn) {
        prevPageBtn.addEventListener('click', () => changePage(-1));
        nextPageBtn.addEventListener('click', () => changePage(1));
    }

    function changePage(delta) {
        const totalPages = Math.ceil(mediaItems.length / ITEMS_PER_PAGE);
        currentPage = Math.max(1, Math.min(currentPage + delta, totalPages));
        updateGrid();
    }

    function updateGrid() {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;

        mediaItems.forEach((item, index) => {
            item.style.display = (index >= start && index < end) ? '' : 'none';
        });

        if (prevPageBtn) prevPageBtn.disabled = currentPage === 1;
        if (nextPageBtn) nextPageBtn.disabled = currentPage === Math.ceil(mediaItems.length / ITEMS_PER_PAGE);
        if (pageInfo) pageInfo.textContent = `${currentPage} / ${Math.ceil(mediaItems.length / ITEMS_PER_PAGE)}`;
    }

    // Initialize grid
    if (mediaItems.length > ITEMS_PER_PAGE) {
        updateGrid();
    }

    // Media viewer functionality
    function openMediaViewer(index) {
        currentMediaIndex = index;
        const media = mediaItems[index].querySelector('img, video');
        const isVideo = media.tagName.toLowerCase() === 'video';
        
        const viewerMain = document.querySelector('.viewer-main');
        viewerMain.innerHTML = isVideo 
            ? `<video src="${media.src}" controls autoplay></video>`
            : `<img src="${media.src}" alt="Full size media">`;
        
        mediaViewer.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        updateMediaCounter();
    }

    function closeMediaViewer() {
        mediaViewer.style.display = 'none';
        document.body.style.overflow = '';
    }

    function updateMediaCounter() {
        const counter = document.querySelector('.media-counter');
        if (counter) {
            counter.textContent = `${currentMediaIndex + 1} / ${mediaItems.length}`;
        }
    }

    function showNextMedia() {
        currentMediaIndex = (currentMediaIndex + 1) % mediaItems.length;
        const media = mediaItems[currentMediaIndex].querySelector('img, video');
        openMediaViewer(currentMediaIndex);
    }

    function showPrevMedia() {
        currentMediaIndex = (currentMediaIndex - 1 + mediaItems.length) % mediaItems.length;
        const media = mediaItems[currentMediaIndex].querySelector('img, video');
        openMediaViewer(currentMediaIndex);
    }

    // Event listeners
    mediaItems.forEach((item, index) => {
        item.addEventListener('click', () => openMediaViewer(index));
    });

    document.querySelector('.close-viewer')?.addEventListener('click', closeMediaViewer);
    document.querySelector('.next-media')?.addEventListener('click', showNextMedia);
    document.querySelector('.prev-media')?.addEventListener('click', showPrevMedia);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (mediaViewer.style.display === 'flex') {
            if (e.key === 'Escape') closeMediaViewer();
            if (e.key === 'ArrowRight') showNextMedia();
            if (e.key === 'ArrowLeft') showPrevMedia();
        }
    });

    // Touch gestures using Hammer.js
    if (mediaViewer) {
        const hammer = new Hammer(mediaViewer);
        
        hammer.on('swipeleft', () => {
            if (mediaViewer.style.display === 'flex') {
                showNextMedia();
            }
        });

        hammer.on('swiperight', () => {
            if (mediaViewer.style.display === 'flex') {
                showPrevMedia();
            }
        });

        hammer.on('tap', (e) => {
            if (e.target === mediaViewer) {
                closeMediaViewer();
            }
        });
    }

    // Grid touch gestures
    if (mediaGrid) {
        const gridHammer = new Hammer(mediaGrid);
        
        gridHammer.on('swipeleft', () => {
            if (nextPageBtn && !nextPageBtn.disabled) {
                changePage(1);
            }
        });

        gridHammer.on('swiperight', () => {
            if (prevPageBtn && !prevPageBtn.disabled) {
                changePage(-1);
            }
        });
    }
});