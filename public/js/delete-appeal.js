document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('appealForm');
    const emailInput = document.getElementById('email');
    const postIdInput = document.getElementById('postId');
    const reasonTextarea = document.getElementById('reason');
    const charCount = document.getElementById('charCount');
    const submitBtn = document.querySelector('.submit-btn');

    // Initialize Socket.IO
    // const socket = io();

    // Character counter
    reasonTextarea.addEventListener('input', () => {
        const remaining = 500 - reasonTextarea.value.length;
        charCount.textContent = remaining;
        
        if (remaining < 50) {
            charCount.style.color = '#dc2626';
        } else {
            charCount.style.color = '';
        }
    });

    // Form validation
    const validateInput = (input) => {
        const formGroup = input.closest('.form-group');
        let isValid = input.checkValidity();
        
        // Additional validation for email and postId
        if (input.id === 'email') {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            isValid = emailPattern.test(input.value);
        } else if (input.id === 'postId') {
            const postIdPattern = /^[0-9]+$/;
            isValid = postIdPattern.test(input.value);
        }
        
        if (isValid) {
            formGroup.classList.remove('error');
        } else {
            formGroup.classList.add('error');
        }
        
        return isValid;
    };

    [emailInput, postIdInput, reasonTextarea].forEach(input => {
        input.addEventListener('blur', () => validateInput(input));
        input.addEventListener('input', () => validateInput(input));
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate all fields
        const isEmailValid = validateInput(emailInput);
        const isPostIdValid = validateInput(postIdInput);
        const isReasonValid = validateInput(reasonTextarea);

        if (!isEmailValid || !isPostIdValid || !isReasonValid) {
            submitBtn.classList.add('error');
            setTimeout(() => {
                submitBtn.classList.remove('error');
            }, 1000);
            return;
        }

        // Start submit animation
        submitBtn.classList.add('submitting');

        try {
            const response = await fetch('/submit-appeal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: emailInput.value.trim(),
                    postId: postIdInput.value.trim(),
                    reason: reasonTextarea.value.trim()
                })
            });

            if (response.ok) {
                submitBtn.classList.remove('submitting');
                submitBtn.classList.add('success');
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            } else {
                throw new Error('Failed to submit appeal');
            }
        } catch (error) {
            console.error('Error:', error);
            submitBtn.classList.remove('submitting');
            submitBtn.classList.add('error');
            setTimeout(() => {
                submitBtn.classList.remove('error');
            }, 1000);
        }
    });
});