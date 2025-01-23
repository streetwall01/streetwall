// Socket.io connection
const socket = io();

// Listen for new appeals
socket.on('newAppeal', (appeal) => {
    addAppealToList(appeal);
});

// Function to add appeal to the list
function addAppealToList(appeal) {
    const appealsList = document.getElementById('appeals-list');
    const appealElement = createAppealElement(appeal);
    appealsList.insertBefore(appealElement, appealsList.firstChild);
}

// Function to create appeal element
function createAppealElement(appeal) {
    const appealDiv = document.createElement('div');
    appealDiv.className = 'appeal-card';
    appealDiv.dataset.appealId = appeal.id;
    appealDiv.innerHTML = `
        <div class="appeal-header">
            <span class="appeal-id">ID: ${appeal.id}</span>
            <span class="appeal-status ${appeal.status}">${appeal.status}</span>
        </div>
        <div class="appeal-content">
            <p><strong>Email:</strong> ${appeal.email}</p>
            <p><strong>Post ID:</strong> ${appeal.postId}</p>
            <p><strong>Reason:</strong> ${appeal.reason}</p>
            <p><strong>Time:</strong> ${new Date(appeal.timestamp).toLocaleString()}</p>
        </div>
        <div class="appeal-actions">
            <button onclick="updateAppealStatus('${appeal.id}', 'approved')" class="btn btn-success btn-sm">Approve</button>
            <button onclick="updateAppealStatus('${appeal.id}', 'rejected')" class="btn btn-danger btn-sm">Reject</button>
            <button onclick="deleteAppeal('${appeal.id}')" class="btn btn-danger btn-sm">Delete</button>
        </div>
    `;
    return appealDiv;
}

// Function to update appeal status
function updateAppealStatus(appealId, status) {
    // Add your logic to update appeal status
    console.log(`Updating appeal ${appealId} to ${status}`);
}

// Delete post function
async function deletePost(postId) {
    try {
        const response = await fetch(`/admin/delete-post/${postId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            // Remove the post row from the table
            const postRow = document.querySelector(`tr[data-post-id="${postId}"]`);
            if (postRow) {
                postRow.remove();
            }
            showAlert('success', 'Post deleted successfully');
        } else {
            throw new Error('Failed to delete post');
        }
    } catch (error) {
        console.error('Error deleting post:', error);
        showAlert('danger', 'Failed to delete post. Please try again.');
    }
}

// Show alert function
function showAlert(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.querySelector('#posts .card-body').insertBefore(alertDiv, document.querySelector('#postsTable'));
    
    // Auto dismiss after 3 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// Confirm delete function
function confirmDelete(postId) {
    if (confirm('Are you sure you want to delete this post?')) {
        deletePost(postId);
    }
}

// Delete a single appeal
function deleteAppeal(appealId) {
    if (confirm('Are you sure you want to delete this appeal?')) {
        fetch(`/admin/delete-appeal/${appealId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Find and remove the appeal card
                const appealCard = document.querySelector(`.appeal-card[data-appeal-id="${appealId}"]`);
                if (appealCard) {
                    appealCard.remove();
                }
                // Check if there are any appeals left
                const appealsList = document.getElementById('appeals-list');
                if (!appealsList.querySelector('.appeal-card')) {
                    appealsList.innerHTML = '<div class="text-center"><p class="text-muted">No appeals found</p></div>';
                }
                // Update stats if the function exists
                if (typeof updateStats === 'function') {
                    updateStats();
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while deleting the appeal');
        });
    }
}

// Clear all appeals
function clearAllAppeals() {
    if (confirm('Are you sure you want to delete all appeals? This action cannot be undone.')) {
        fetch('/admin/clear-appeals', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                const appealsList = document.getElementById('appeals-list');
                appealsList.innerHTML = '<div class="text-center"><p class="text-muted">No appeals found</p></div>';
                // Update stats if the function exists
                if (typeof updateStats === 'function') {
                    updateStats();
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while clearing appeals');
        });
    }
}

// Search appeals
function searchAppeals() {
    const searchTerm = document.getElementById('appealSearch').value.toLowerCase();
    const appeals = document.querySelectorAll('.appeal-card');
    
    appeals.forEach(appeal => {
        const appealText = appeal.textContent.toLowerCase();
        if (appealText.includes(searchTerm)) {
            appeal.style.display = '';
        } else {
            appeal.style.display = 'none';
        }
    });
}

// Add event listener for search input
document.getElementById('appealSearch').addEventListener('input', searchAppeals);

// Socket.IO event handlers for real-time updates
socket.on('appealDeleted', (appealId) => {
    const appealCard = document.querySelector(`.appeal-card[data-appeal-id="${appealId}"]`);
    if (appealCard) {
        appealCard.remove();
        // Check if there are any appeals left
        const appealsList = document.getElementById('appeals-list');
        if (!appealsList.querySelector('.appeal-card')) {
            appealsList.innerHTML = '<div class="text-center"><p class="text-muted">No appeals found</p></div>';
        }
        // Update stats if the function exists
        if (typeof updateStats === 'function') {
            updateStats();
        }
    }
});

socket.on('appealsCleared', () => {
    const appealsList = document.getElementById('appeals-list');
    appealsList.innerHTML = '<div class="text-center"><p class="text-muted">No appeals found</p></div>';
    // Update stats if the function exists
    if (typeof updateStats === 'function') {
        updateStats();
    }
});
