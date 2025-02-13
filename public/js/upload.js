const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('files');
const preview = document.getElementById('preview');
const selectionControls = document.getElementById('selectionControls');
const form = document.getElementById('uploadForm');
const submitBtn = document.getElementById('submitBtn');

// Prevent default drag behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
});

// Highlight drop zone when item is dragged over it
['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, unhighlight, false);
});

// Handle dropped files
dropZone.addEventListener('drop', handleDrop, false);

// Handle selected files
fileInput.addEventListener('change', handleFiles, false);

function preventDefaults (e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight(e) {
    dropZone.classList.add('highlight');
}

function unhighlight(e) {
    dropZone.classList.remove('highlight');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles({ target: { files: files } });
}

function handleFiles(e) {
    const files = [...e.target.files];
    files.forEach(previewFile);
    if (files.length > 0) {
        selectionControls.style.display = 'flex';
    }
}

function previewFile(file) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = function() {
        const div = document.createElement('div');
        div.className = 'preview-item';
        
        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = reader.result;
            div.appendChild(img);
        } else if (file.type.startsWith('video/')) {
            const video = document.createElement('video');
            video.src = reader.result;
            video.controls = true;
            div.appendChild(video);
        }

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'file-select';
        div.appendChild(checkbox);

        preview.appendChild(div);
    }
}

function selectAllFiles() {
    const checkboxes = preview.querySelectorAll('.file-select');
    checkboxes.forEach(checkbox => checkbox.checked = true);
}

function deleteSelectedFiles() {
    const selectedItems = preview.querySelectorAll('.preview-item');
    selectedItems.forEach(item => {
        if (item.querySelector('.file-select').checked) {
            item.remove();
        }
    });
    
    if (preview.children.length === 0) {
        selectionControls.style.display = 'none';
        fileInput.value = '';
    }
}

// Handle form submission
form.addEventListener('submit', async function(e) {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-text').textContent = 'Posting...';

    const formData = new FormData(form);
    
    try {
        const response = await fetch('/', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            window.location.href = '/';
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Failed to upload post');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error uploading post: ' + error.message);
        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-text').textContent = 'Share Post';
    }
});
