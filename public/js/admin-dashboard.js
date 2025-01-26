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
