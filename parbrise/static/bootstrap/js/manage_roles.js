// charts.js
let verificationChart;

function initDashboard(data) {
    const ctx = document.getElementById('verificationChart').getContext('2d');
    verificationChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.dates,
            datasets: [{
                label: 'Vérifications',
                data: data.data,
                borderColor: '#4e73df',
                backgroundColor: 'rgba(78, 115, 223, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#4e73df',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#2c3e50',
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 12 },
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0, 0, 0, 0.05)' }
                },
                x: {
                    grid: { display: false }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            }
        }
    });

    const ctx2 = document.getElementById('errorDistributionChart').getContext('2d');
    new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: ['Logos incorrects', 'Codes-barres invalides', 'Autres erreurs'],
            datasets: [{
                data: [data.logoErrors, data.barcodeErrors, data.otherErrors],
                backgroundColor: ['#ff6384', '#36a2eb', '#ffce56'],
                borderWidth: 0,
                hoverOffset: 15,
                weight: 0.5
            }]
        },
        options: {
            responsive: true,
            cutout: '75%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#2c3e50',
                    bodyFont: { size: 12 },
                    padding: 10,
                    cornerRadius: 8
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true,
                duration: 1500
            }
        }
    });

document.querySelector('.chart-filter').addEventListener('change', function() {
    const period = this.value;  // Valeurs directes : "24hours", "7days", "30days"

    const canvas = document.getElementById('verificationChart');

    fetch(`?period=${period}`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur réseau');
        }
        return response.json();
    })
    .then(data => {
        verificationChart.data.labels = data.dates;
        verificationChart.data.datasets[0].data = data.data;
        verificationChart.update();

     
    })
    .catch(error => {
        console.error('Erreur:', error);
  });
});

}
// dashboard.js ou topbar.js
document.addEventListener('DOMContentLoaded', () => {
    const topbar = document.querySelector('.sg-topbar');
    if (topbar) {
        topbar.classList.add('visible');
    }
});
document.addEventListener('DOMContentLoaded', function() {
  // Configuration du carousel
  const carousel = new bootstrap.Carousel('#headerCarousel', {
    interval: 1000, // 3 secondes au lieu des 5 secondes par défaut
    ride: 'carousel',
    wrap: true
  });
  
  // Option: Accélérer aussi la vitesse de transition
  document.querySelectorAll('.carousel').forEach(carousel => {
  });
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
    // Références aux éléments DOM
    const $notifBadge = $('#notif-badge');
    const $notifDropdown = $('#notif-dropdown');
    const $notifIcon = $('.notif-icon');

    // Charge les notifications depuis le serveur
    function loadNotifications() {
        $.ajax({
            url: "/notifications/recent/",
            method: 'GET',
            dataType: 'json',
            success: function(data) {
                if (data.success) {
                    updateNotificationBadge(data.unread_count || 0);
                    renderNotifications(data.notifications);
                }
            },
            error: function(xhr, status, error) {
                console.error("Erreur lors du chargement des notifications:", error);
            }
        });
    }
    // Fonction pour charger les notifications
function loadNotifications() {
    $.ajax({
        url: "/notifications/recent/",
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            if (data.success) {
                updateNotificationBadge(data.unread_count || 0);
                renderNotifications(data.notifications);
            }
        },
        error: function(xhr, status, error) {
            console.error("Erreur lors du chargement des notifications:", error);
        }
    });
}

// Fonction pour afficher les notifications
function renderNotifications(notifications) {
    const $notifDropdown = $('#notif-dropdown');
    $notifDropdown.empty();
    
    if (notifications.length === 0) {
        $notifDropdown.append('<li><span class="dropdown-item small">Aucune notification</span></li>');
        return;
    }

    notifications.forEach(notif => {
        const isRead = notif.is_read || false;
        const timestamp = new Date(notif.timestamp).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const notificationItem = `
            <li>
                <a href="${notif.url || '#'}" class="dropdown-item ${isRead ? '' : 'fw-bold'} notification-item" 
                   data-notif-id="${notif.id}">
                    <div class="d-flex justify-content-between">
                        <div>
                            <i class="fas ${notif.icon_class || 'fa-bell'} me-2"></i>
                            ${notif.message || 'Nouvelle notification'}
                        </div>
                        <small class="text-muted">${timestamp}</small>
                    </div>
                </a>
            </li>
        `;
        $notifDropdown.append(notificationItem);
    });

    // Ajouter le bouton "Tout marquer comme lu"
    $notifDropdown.append(`
        <li class="dropdown-divider"></li>
        <li>
            <a class="dropdown-item text-center small mark-all-read" href="#">
                <i class="fas fa-check-circle me-2"></i>Tout marquer comme lu
            </a>
        </li>
    `);
}

// Gestion du clic sur "Tout marquer comme lu"
$(document).on('click', '.mark-all-read', function(e) {
    e.preventDefault();
    
    $.ajax({
        url: '/notifications/mark-all-read/',
        method: 'POST',
        headers: {
            "X-CSRFToken": getCookie('csrftoken')
        },
        success: function(response) {
            if (response.success) {
                $('#notif-badge').hide();
                loadNotifications();
            }
        },
        error: function(xhr, status, error) {
            console.error("Erreur marquage toutes notifications:", error);
        }
    });
});

// Rafraîchir les notifications toutes les 30 secondes
setInterval(loadNotifications, 30000);

// Chargement initial
loadNotifications();

    // Met à jour le badge de notification
    function updateNotificationBadge(count) {
        count = parseInt(count) || 0;
        if (count > 0) {
            $notifBadge.text(count).show();
        } else {
            $notifBadge.hide();
        }
    }

  function renderNotifications(notifications) {
    const $notifDropdown = $('#notif-dropdown');
    $notifDropdown.empty();
    
    if (notifications.length === 0) {
        $notifDropdown.append(`
            <li>
                <div class="notification-empty">
                    <i class="fas fa-bell-slash"></i>
                    <span>Aucune nouvelle notification</span>
                </div>
            </li>
        `);
        return;
    }

    notifications.forEach(notif => {
        const isRead = notif.is_read || false;
        const timestamp = new Date(notif.timestamp).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Formatage des détails si présents
        let detailsHtml = '';
        if (notif.details) {
            try {
                const details = typeof notif.details === 'string' ? JSON.parse(notif.details) : notif.details;
                detailsHtml = `
                <div class="notification-details collapse" id="details-${notif.id}">
                    <div class="details-content">
                        ${formatNotificationDetails(details)}
                    </div>
                </div>`;
            } catch (e) {
                console.error("Erreur formatage détails:", e);
            }
        }

      const notificationItem = `
    <li class="notification-item ${isRead ? '' : 'unread'}">
        <div class="notification-header">
            <div class="notification-icon">
                <i class="fas ${notif.icon_class || 'fa-bell'} ${getNotificationColorClass(notif.action)}"></i>
            </div>
            <div class="notification-main">
                <div class="notification-title">${notif.message || 'Nouvelle notification'}</div>
                <div class="notification-time">${timestamp}</div>
            </div>
        </div>
        ${notif.details ? `
        <div class="notification-details" id="details-${notif.id}" >
            <div class="details-content">
                ${formatNotificationDetails(typeof notif.details === 'string' ? JSON.parse(notif.details) : notif.details)}
            </div>
        </div>` : ''}
    </li>
`;

        $notifDropdown.append(notificationItem);
    });

    // Ajouter le bouton "Tout marquer comme lu"
    $notifDropdown.append(`
        <li class="notification-footer">
            <a href="#" class="mark-all-read">
                <i class="fas fa-check-circle"></i>
                Tout marquer comme lu
            </a>
        </li>
    `);
}

// Fonction pour formater les détails de notification
function formatNotificationDetails(details) {
    if (!details) return '';
    
    let html = '<ul class="details-list">';
    
    for (const [key, value] of Object.entries(details)) {
        if (value && typeof value === 'object') {
            html += `<li><strong>${key}:</strong> ${formatNotificationDetails(value)}</li>`;
        } else {
            html += `<li><strong>${key}:</strong> ${value || 'N/A'}</li>`;
        }
    }
    
    html += '</ul>';
    return html;
}

// Fonction pour déterminer la couleur en fonction du type de notification
function getNotificationColorClass(action) {
    const actionTypes = {
        'user_create': 'text-success',
        'user_delete': 'text-danger',
        'verification_success': 'text-success',
        'verification_failed': 'text-warning',
        'default': 'text-primary'
    };
    
    return actionTypes[action] || actionTypes['default'];
}
// Ajoutez ce gestionnaire pour afficher/masquer les détails
$(document).on('click', '.notification-item', function(e) {
    e.preventDefault();
    $(this).find('.notification-details').toggle();
    
    // Marquer comme lu si ce n'est pas déjà fait
    const notifId = $(this).data('notif-id');
    if (!$(this).hasClass('fw-bold')) return;
    
    $.ajax({
        url: `/notifications/mark-read/`,
        method: 'POST',
        headers: {
            "X-CSRFToken": getCookie('csrftoken')
        },
        data: {
            notification_id: notifId
        },
        success: function(response) {
            if (response.success) {
                updateNotificationBadge(response.unread_count);
                loadNotifications();
            }
        }
    });
});
    // Gestion de l'affichage du dropdown
    $notifIcon.on('click', function() {
        // Recharger les notifications à chaque ouverture
        loadNotifications();
        $notifDropdown.toggle();
    });

    // Fermer le dropdown quand on clique ailleurs
    $(document).on('click', function(e) {
        if (!$(e.target).closest('.notif-icon').length) {
            $notifDropdown.hide();
        }
    });

    // Rafraîchir les notifications toutes les 30 secondes
    setInterval(loadNotifications, 30000);
    
    // Chargement initial
    loadNotifications();

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
document.getElementById('create-user-form').addEventListener('submit', function(e) {
    const isActive = document.querySelector('select[name="is_active"]').value;
    if (isActive === '0') {
        if (!confirm('Vous créez un utilisateur inactif. Il ne pourra pas se connecter. Continuer ?')) {
            e.preventDefault();
        }
    }
});

// Au chargement de la page
$(document).ready(function() {
    // Charger le compteur initial
    $.get('/notifications/unread_count/', function(data) {
        if(data.count > 0) {
            $('#notification-badge').text(data.count).show();
        }
    });
    
    // Configurer l'actualisation périodique
    setInterval(updateNotificationCount, 30000);
});

function updateNotificationCount() {
    $.get('/notifications/unread_count/', function(data) {
        const $badge = $('#notification-badge');
        if(data.count > 0) {
            $badge.text(data.count).show();
        } else {
            $badge.hide();
        }
    });
}
