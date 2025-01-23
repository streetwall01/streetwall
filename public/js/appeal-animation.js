document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.appeal-form');
    const submitBtn = document.querySelector('.submit-btn');
    const emailInput = document.getElementById('email');
    const postIdInput = document.getElementById('postId');
    const reasonTextarea = document.getElementById('reason');
    const charCount = document.getElementById('charCount');

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
        const isValid = input.checkValidity();
        
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
            // Create form data
            const formData = new FormData(form);

            // Send the form data
            const response = await fetch('/appeal', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                // Show success animation
                submitBtn.classList.remove('submitting');
                submitBtn.classList.add('success');

                // Reset form and redirect after success
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            } else {
                throw new Error('Appeal submission failed');
            }
        } catch (error) {
            console.error('Error:', error);
            // Reset button state on error
            submitBtn.classList.remove('submitting');
            
            // Add shake animation
            submitBtn.classList.add('error');
            setTimeout(() => {
                submitBtn.classList.remove('error');
            }, 1000);
        }
    });
});
