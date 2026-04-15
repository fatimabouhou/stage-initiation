/**
 * Gestion des pare-brises - Saint-Gobain Sekurit Kenitra
 * Script principal pour la gestion des interactions
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('[Parebrise] DOM chargé - Initialisation');

    // 1. Gestion de l'ouverture/fermeture du modal
    const modalElement = document.getElementById('ajouterParebrise');
    if (modalElement) {
        // Écouteur pour les événements du modal
        modalElement.addEventListener('show.bs.modal', function() {
            console.log('[Parebrise] Modal ouvert');
            resetForm();
        });

        modalElement.addEventListener('hidden.bs.modal', function() {
            console.log('[Parebrise] Modal fermé');
        });
    }

    // 2. Gestion du formulaire
    const form = document.getElementById('parebriseForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('[Parebrise] Tentative de soumission');

            if (validateForm()) {
                console.log('[Parebrise] Formulaire valide - Envoi au serveur');
                submitForm();
            }
        });
    }

    // 3. Fonction de validation du formulaire
    function validateForm() {
        let isValid = true;
        const requiredFields = [
            { id: 'id_code_sap', message: 'Le code SAP est requis' },
            { id: 'id_version', message: 'La version est requise' }
        ];

        requiredFields.forEach(field => {
            const element = document.getElementById(field.id);
            if (element && !element.value.trim()) {
                markAsInvalid(element, field.message);
                isValid = false;
            } else if (element) {
                markAsValid(element);
            }
        });

        return isValid;
    }

    // 4. Fonctions utilitaires
    function markAsInvalid(element, message) {
        element.classList.add('is-invalid');
        const feedback = element.nextElementSibling;
        if (feedback && feedback.classList.contains('invalid-feedback')) {
            feedback.textContent = message;
            feedback.style.display = 'block';
        }
    }

    function markAsValid(element) {
        element.classList.remove('is-invalid');
        const feedback = element.nextElementSibling;
        if (feedback && feedback.classList.contains('invalid-feedback')) {
            feedback.style.display = 'none';
        }
    }

    function resetForm() {
        const form = document.getElementById('parebriseForm');
        if (form) {
            form.reset();
            form.querySelectorAll('.is-invalid').forEach(el => {
                el.classList.remove('is-invalid');
            });
            const feedbacks = form.querySelectorAll('.invalid-feedback');
            feedbacks.forEach(fb => fb.style.display = 'none');
        }
    }

    // 5. Soumission AJAX (optionnelle)
    function submitForm() {
        const form = document.getElementById('parebriseForm');
        const formData = new FormData(form);

        // Option 1: Soumission standard (recharge la page)
        form.submit();

        // Option 2: Soumission AJAX (décommentez pour utiliser)
        /*
        fetch(form.action, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': formData.get('csrfmiddlewaretoken')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                location.reload();
            } else {
                showError(data.message || 'Erreur lors de l\'enregistrement');
            }
        })
        .catch(error => {
            console.error('[Parebrise] Erreur:', error);
            showError('Erreur réseau');
        });
        */
    }

    // 6. Gestion des erreurs
    function showError(message) {
        const errorAlert = document.createElement('div');
        errorAlert.className = 'alert alert-danger alert-dismissible fade show';
        errorAlert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const container = document.querySelector('.container-fluid');
        if (container) {
            container.prepend(errorAlert);
            
            // Fermeture automatique après 5s
            setTimeout(() => {
                const bsAlert = new bootstrap.Alert(errorAlert);
                bsAlert.close();
            }, 5000);
        }
    }

    // 7. Gestion des actions (édition/suppression)
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('[Parebrise] Édition demandée');
            // Implémentez la logique d'édition ici
        });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Êtes-vous sûr de vouloir supprimer ce pare-brise ?')) {
                console.log('[Parebrise] Suppression confirmée');
                // Implémentez la logique de suppression ici
            }
        });
    });

    // 8. Initialisation terminée
    console.log('[Parebrise] Initialisation terminée');
});