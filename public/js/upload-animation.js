document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.post-form');
    const submitBtn = document.querySelector('.submit-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Start submit animation
        submitBtn.classList.add('submitting');

        try {
            // Create form data
            const formData = new FormData(form);

            // Send the form data
            const response = await fetch('/post', {
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
                throw new Error('Upload failed');
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
