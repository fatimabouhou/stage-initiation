document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', function () {
            if (!confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) return;

            const userId = this.getAttribute('data-user-id');

            fetch(`/users/delete/${userId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    this.closest('tr').remove();
                    alert('Utilisateur supprimé avec succès.');
                } else {
                    alert('Erreur: ' + (data.error || 'Impossible de supprimer.'));
                }
            })
            .catch(() => alert('Erreur réseau.'));
        });
    });
});

// Fonction pour obtenir le CSRF token depuis les cookies
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const trimmed = cookie.trim();
            if (trimmed.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(trimmed.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
