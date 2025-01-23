// Preview files before upload
let selectedFiles = new Set();

function previewFiles(event) {
    const preview = document.getElementById('preview');
    preview.innerHTML = '';
    const files = event.target.files;
    const fileInput = event.target;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        
        // Add checkbox for selection
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'file-select';
        checkbox.dataset.index = i;
        checkbox.onclick = (e) => {
            e.stopPropagation();
            if (e.target.checked) {
                selectedFiles.add(i);
            } else {
                selectedFiles.delete(i);
            }
        };
        previewItem.appendChild(checkbox);

        reader.onload = function(e) {
            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.onclick = () => openMediaViewer(e.target.result);
                previewItem.appendChild(img);
            } else if (file.type.startsWith('video/')) {
                const video = document.createElement('video');
                video.src = e.target.result;
                video.controls = true;
                previewItem.appendChild(video);
            }
        };

        reader.readAsDataURL(file);
        preview.appendChild(previewItem);
    }
}

function selectAllFiles() {
    const checkboxes = document.querySelectorAll('.file-select');
    const allSelected = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach((checkbox, index) => {
        checkbox.checked = !allSelected;
        if (!allSelected) {
            selectedFiles.add(index);
        } else {
            selectedFiles.delete(index);
        }
    });
}

function deleteSelectedFiles() {
    const fileInput = document.getElementById('media');
    const preview = document.getElementById('preview');
    
    // Convert FileList to Array and remove selected files
    let files = Array.from(fileInput.files);
    selectedFiles = new Set(Array.from(selectedFiles).sort((a, b) => b - a));
    
    selectedFiles.forEach(index => {
        files.splice(index, 1);
    });
    
    // Create new FileList
    const dataTransfer = new DataTransfer();
    files.forEach(file => dataTransfer.items.add(file));
    fileInput.files = dataTransfer.files;
    
    // Clear selection and update preview
    selectedFiles.clear();
    previewFiles({ target: fileInput });
}

// Media viewer functionality
function openMediaViewer(src) {
    const viewer = document.getElementById('mediaViewer');
    const expandedImg = document.getElementById('expandedMedia');
    expandedImg.src = src;
    viewer.style.display = 'flex';
}

function closeMediaViewer() {
    document.getElementById('mediaViewer').style.display = 'none';
}

// Close viewer when clicking outside the image
document.getElementById('mediaViewer').addEventListener('click', function(e) {
    if (e.target === this) {
        closeMediaViewer();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Add smooth page transitions
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // Don't prevent default if it's the active item
            if (item.classList.contains('active')) return;
            
            e.preventDefault();
            const href = item.getAttribute('href');
            
            // Remove active class from all items
            navItems.forEach(navItem => navItem.classList.remove('active'));
            // Add active class to clicked item
            item.classList.add('active');
            
            // Animate current page out
            document.body.style.opacity = '0';
            
            // Navigate to new page after animation
            setTimeout(() => {
                window.location.href = href;
            }, 300);
        });
    });
    
    // Fade in page on load
    document.body.style.opacity = '1';
    document.body.style.transition = 'opacity 0.3s ease';
});