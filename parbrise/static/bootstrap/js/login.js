document.addEventListener('DOMContentLoaded', () => {
    const gsidInput = document.getElementById('id_gsid');

    gsidInput.addEventListener('input', () => {
        gsidInput.value = gsidInput.value.replace(/\D/g, '').slice(0, 7);
    });

    const form = document.getElementById('login-form');
    form.addEventListener('submit', function (e) {
        if (!/^\d{7}$/.test(gsidInput.value)) {
            alert("Le GSID doit contenir exactement 7 chiffres.");
            gsidInput.focus();
            e.preventDefault();
        }
    });
});
