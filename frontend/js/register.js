document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('reg-form');
    const daySelect = document.getElementById('day');
    const monthSelect = document.getElementById('month');
    const yearSelect = document.getElementById('year');
    const genderCustomRadio = document.getElementById('gender-custom');
    const customGenderContainer = document.getElementById('custom-gender-container');

    // Populate day dropdown (1-31)
    for (let i = 1; i <= 31; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.text = i;
        daySelect.appendChild(option);
    }

    // Populate month dropdown
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    months.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index + 1;
        option.text = month;
        monthSelect.appendChild(option);
    });

    // Populate year dropdown (current year down to 100 years ago)
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 100; i--) {
        const option = document.createElement('option');
        option.value = i;
        option.text = i;
        yearSelect.appendChild(option);
    }

    // Show/hide custom gender input
    const genderRadios = document.querySelectorAll('input[name="sex"]');
    genderRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (genderCustomRadio.checked) {
                customGenderContainer.classList.remove('hidden');
            } else {
                customGenderContainer.classList.add('hidden');
            }
        });
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                // Store token in localStorage
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                
                alert('Account created successfully!');
                window.location.href = '/';
            } else {
                alert('Registration failed: ' + result.message);
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Error connecting to server. Make sure the backend is running.');
        }
    });
});
