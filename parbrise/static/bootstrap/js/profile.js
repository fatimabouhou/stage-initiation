document.addEventListener('DOMContentLoaded', function() {
    const profileForm = document.getElementById('profile-form');
    const fileInput = document.getElementById('id_profile_picture');
    const removeLink = document.getElementById('remove-picture');
    
    // Gestion du changement de photo
    fileInput.addEventListener('change', function(e) {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                // Vérifier si une image existe déjà
                let profileImage = document.getElementById('profile-image');
                const defaultAvatar = document.getElementById('default-avatar');
                
                if (profileImage) {
                    // Mettre à jour l'image existante
                    profileImage.src = e.target.result;
                } else if (defaultAvatar) {
                    // Remplacer l'avatar par défaut par une image
                    profileImage = document.createElement('img');
                    profileImage.src = e.target.result;
                    profileImage.className = 'profile-picture';
                    profileImage.id = 'profile-image';
                    profileImage.alt = 'Nouvelle photo de profil';
                    defaultAvatar.parentNode.replaceChild(profileImage, defaultAvatar);
                    
                    // Afficher le lien de suppression
                    if (removeLink) {
                    }
                }
            };
            
            reader.readAsDataURL(this.files[0]);
            
            // Soumettre automatiquement le formulaire après 100ms
            setTimeout(() => {
                profileForm.submit();
            }, 100);
        }
    });
    
    // Gestion de la suppression de photo
    if (removeLink) {
        removeLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Créer un champ caché pour indiquer la suppression
            const deleteInput = document.createElement('input');
            deleteInput.type = 'hidden';
            deleteInput.name = 'profile_picture-clear';
            deleteInput.value = '1';
            profileForm.appendChild(deleteInput);
            
            // Remplacer l'image par l'avatar avec initiales
            const profileImage = document.getElementById('profile-image');
            if (profileImage) {
                const defaultDiv = document.createElement('div');
                defaultDiv.className = 'default-picture';
                defaultDiv.id = 'default-avatar';
                
                const firstName = document.getElementById('id_first_name').value || '';
                const lastName = document.getElementById('id_last_name').value || '';
                
                if (firstName || lastName) {
                    defaultDiv.textContent = (firstName ? firstName[0] : '') + (lastName ? lastName[0] : '');
                } else {
                    defaultDiv.textContent = '{{ user.username|first|upper }}';
                }
                
                profileImage.parentNode.replaceChild(defaultDiv, profileImage);
            }
            
            // Masquer le lien de suppression
            
            // Soumettre le formulaire
            profileForm.submit();
        });
    }
});
// Fonction utilitaire pour récupérer le token CSRF
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

$(document).ready(function() {
   

    // --------------------------------------------------
    // Gestion des filtres du tableau des utilisateurs
    // --------------------------------------------------
    function applyFilters() {
        const searchTerm = $('#search-input').val().toLowerCase();
        const roleFilter = $('#role-filter').val();
        const deptFilter = $('#department-filter').val();

        $('.role-table tbody tr').each(function() {
            const $row = $(this);
            const name = $row.find('td:nth-child(2)').text().toLowerCase();
            const gsid = $row.find('td:nth-child(1)').text().toLowerCase();
            const email = $row.find('td:nth-child(3)').text().toLowerCase();
            const dept = $row.find('td:nth-child(4)').text();
            const role = $row.find('td:nth-child(5) span').attr('class').split(' ')[1].replace('role-badge-', '');

            const matchesSearch = searchTerm === '' || 
                name.includes(searchTerm) || 
                gsid.includes(searchTerm) || 
                email.includes(searchTerm);
            
            const matchesRole = roleFilter === '' || role === roleFilter;
            const matchesDept = deptFilter === '' || dept === deptFilter;

            $row.toggle(matchesSearch && matchesRole && matchesDept);
        });
    }

    $('#search-input, #role-filter, #department-filter').on('input change', applyFilters);

    // --------------------------------------------------
    // Gestion des modals (utilisateurs, rôles, etc.)
    // --------------------------------------------------
    $('#create-user-form').submit(function(e) {
        e.preventDefault();
        const form = $(this);

        $.ajax({
            url: form.attr('action'),
            type: 'POST',
            headers: {
                "X-CSRFToken": getCookie('csrftoken')
            },
            data: form.serialize(),
            success: function(response) {
                if (response.success) {
                    $('#addUserModal').modal('hide');
                    location.reload();
                } else {
                    alert('Erreur: ' + (response.error || 'Erreur lors de la création'));
                }
            },
            error: function(xhr) {
                alert('Erreur serveur: ' + xhr.responseText);
            }
        });
    });

    $('.edit-role-btn').click(function() {
        const userId = $(this).data('user-id');
        const currentRole = $(this).data('current-role');
        
        $('#edit-user-id').val(userId);
        $('#new-role-select').val(currentRole);
        $('#edit-role-form').attr('action', `/users/${userId}/update-role/`);
        
        $('#editRoleModal').modal('show');
    });

    $('#edit-role-form').submit(function(e) {
        e.preventDefault();
        const form = $(this);

        $.ajax({
            url: form.attr('action'),
            type: 'POST',
            headers: {
                "X-CSRFToken": getCookie('csrftoken')
            },
            data: form.serialize(),
            success: function(response) {
                if (response.success) {
                    $('#editRoleModal').modal('hide');
                    location.reload();
                } else {
                    alert('Erreur: ' + (response.message || 'Erreur lors de la modification'));
                }
            },
            error: function(xhr) {
                alert('Erreur serveur: ' + xhr.responseText);
            }
        });
    });
// Correction du code de suppression
$(document).on('click', '.delete-user-btn', function() {
    const userId = $(this).data('user-id');
    const userName = $(this).data('user-name');
    
    $('#delete-user-name').text(userName);
    $('#confirm-delete-btn').data('user-id', userId);
    $('#deleteUserModal').modal('show');
});

$(document).on('click', '#confirm-delete-btn', function() {
    const userId = $(this).data('user-id');
    const csrfToken = $('[name=csrfmiddlewaretoken]').val();
    
    $.ajax({
        url: `/users/${userId}/delete/`,
        type: 'POST',
        headers: {
            'X-CSRFToken': csrfToken
        },
        success: function(response) {
            if (response.success) {
                window.location.reload();
            } else {
                alert('Erreur : ' + response.error);
            }
        },
        error: function(xhr) {
            alert('Erreur serveur : ' + xhr.statusText);
        }
    });
});
});
