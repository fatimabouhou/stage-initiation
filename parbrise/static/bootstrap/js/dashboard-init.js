document.addEventListener('DOMContentLoaded', function () {
    const verificationCanvas = document.getElementById('verificationChart');
    const errorCanvas = document.getElementById('errorDistributionChart');

    const dates = JSON.parse(verificationCanvas.dataset.dates || '[]');
    const values = JSON.parse(verificationCanvas.dataset.values || '[]');
    const logoErrors = parseInt(errorCanvas.dataset.logoErrors || '0');
    const barcodeErrors = parseInt(errorCanvas.dataset.barcodeErrors || '0');
    const otherErrors = parseInt(errorCanvas.dataset.otherErrors || '0');

    initDashboard({
        dates: dates,
        data: values,
        logoErrors: logoErrors,
        barcodeErrors: barcodeErrors,
        otherErrors: otherErrors
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const progressBars = document.querySelectorAll('.stat-card .progress');
    progressBars.forEach((bar, idx) => {
        // Ici, à adapter en fonction de tes variables Django, ou tu peux ajouter des data attributes pour la valeur
        // Exemple : si tu as des data-width dans le HTML, sinon, gérer côté JS Django
        // bar.style.width = valeur + '%';
    });
});

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.progress').forEach(progress => {
    const width = progress.getAttribute('data-width');
    if(width) {
      progress.style.width = width + '%';
    }
  });
  
});



