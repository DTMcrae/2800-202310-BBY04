    const buttons = document.querySelectorAll('button');
    const forms = document.querySelectorAll('.form-class');
    const spinner = document.getElementById('spinner');
    buttons.forEach((button) => {
        button.addEventListener('click', () => {
            spinner.style.display = 'block';
            forms.forEach((form) => {
                form.style.visibility = 'hidden';
            });
        });
    });
    // When the spinner is not active, make the forms visible again
    if (spinner.style.display !== 'block') {
        forms.forEach((form) => {
            form.style.visibility = 'visible';
        });
    }