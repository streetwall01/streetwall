// Socket.io connection
const socket = io();

// Listen for new appeals
socket.on('newAppeal', (appeal) => {
    addAppealToList(appeal);
});

// Function to handle appeals (approve/reject)
async function handleAppeal(appealId, postId, status) {
    try {
        const response = await fetch(`/admin/handle-appeal/${appealId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status, postId })
        });

        if (!response.ok) {
            throw new Error('Failed to handle appeal');
        }

        const data = await response.json();
        
        // Update UI
        const appealCard = document.querySelector(`[data-appeal-id="${appealId}"]`);
        if (appealCard) {
            // Update status badge
            const badgeClass = status === 'approved' ? 'success' : 'danger';
            const statusText = status.charAt(0).toUpperCase() + status.slice(1);
            
            // Remove action buttons
            const actionButtons = appealCard.querySelectorAll('.appeal-actions button');
            actionButtons.forEach(button => button.remove());
            
            // Add status badge
            const badge = document.createElement('span');
            badge.className = `badge bg-${badgeClass}`;
            badge.textContent = statusText;
            appealCard.querySelector('.appeal-details').appendChild(badge);
            
            // Update card status
            appealCard.dataset.status = status;
            
            // Show success message
            showAlert('success', `Appeal ${statusText}`);
        }

    } catch (error) {
        console.error('Error handling appeal:', error);
        showAlert('danger', 'Failed to handle appeal');
    }
}

// Function to view appeal reason
function viewAppealReason(appealId, reason) {
    const reasonModal = new bootstrap.Modal(document.getElementById('reasonModal'));
    document.getElementById('appealReason').textContent = reason;
    reasonModal.show();
}

// Function to show alerts
function showAlert(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    const alertContainer = document.querySelector('.card-body');
    alertContainer.insertBefore(alertDiv, alertContainer.firstChild);
    
    // Auto dismiss after 3 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// Filter appeals
document.querySelectorAll('[data-filter]').forEach(button => {
    button.addEventListener('click', (e) => {
        // Update active button
        document.querySelectorAll('[data-filter]').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        const filter = e.target.dataset.filter;
        const appeals = document.querySelectorAll('.appeal-card');
        
        appeals.forEach(appeal => {
            if (filter === 'all' || appeal.dataset.status === filter) {
                appeal.style.display = '';
            } else {
                appeal.style.display = 'none';
            }
        });
    });
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
    appealDiv.className = 'appeal-item';
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

// Confirm delete function
function confirmDelete(postId) {
    if (confirm('Are you sure you want to delete this post?')) {
        deletePost(postId);
    }
}

// Clear all appeals function
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

        if (response.ok) {
            // Clear the appeals list in the UI
            const appealsList = document.getElementById('appeals-list');
            appealsList.innerHTML = `
                <div class="text-center py-4">
                    <p class="text-muted mb-0">No appeals found</p>
                </div>
            `;
            
            // Show success message
            showAlert('success', 'All appeals have been cleared successfully');
        } else {
            throw new Error('Failed to clear appeals');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('danger', 'Failed to clear appeals. Please try again.');
    }
}

// Listen for appeals cleared event
socket.on('appealsCleared', () => {
    const appealsList = document.getElementById('appeals-list');
    appealsList.innerHTML = `
        <div class="text-center py-4">
            <p class="text-muted mb-0">No appeals found</p>
        </div>
    `;
    showAlert('success', 'All appeals have been cleared');
});