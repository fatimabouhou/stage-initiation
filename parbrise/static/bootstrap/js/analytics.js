document.addEventListener('DOMContentLoaded', function () {
    const activityChartEl = document.getElementById('activityChart');
    const failureChartEl = document.getElementById('failureChart');

    if (activityChartEl) {
        const labels = JSON.parse(activityChartEl.dataset.labels);
        const total = JSON.parse(activityChartEl.dataset.total);
        const success = JSON.parse(activityChartEl.dataset.success);

        new Chart(activityChartEl, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Total vérifications',
                        data: total,
                        borderColor: '#4e73df',
                        backgroundColor: 'rgba(78, 115, 223, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Vérifications réussies',
                        data: success,
                        borderColor: '#1cc88a',
                        backgroundColor: 'rgba(28, 200, 138, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                    tooltip: { mode: 'index', intersect: false }
                },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } }
                }
            }
        });
    }

    if (failureChartEl) {
        const failureData = {
            logo: parseInt(failureChartEl.dataset.logo),
            barcode: parseInt(failureChartEl.dataset.barcode),
            both: parseInt(failureChartEl.dataset.both),
            other: parseInt(failureChartEl.dataset.other),
        };

        new Chart(failureChartEl, {
            type: 'doughnut',
            data: {
                labels: ['Logo incorrect', 'Code-barres invalide', 'Les deux', 'Autre'],
                datasets: [{
                    data: [
                        failureData.logo,
                        failureData.barcode,
                        failureData.both,
                        failureData.other
                    ],
                    backgroundColor: ['#e74a3b', '#f6c23e', '#36b9cc', '#858796'],
                    hoverBorderColor: "rgba(234, 236, 244, 1)"
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'right' },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${context.label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '70%',
            }
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
                    <div class="notification-details small text-muted mt-2">
                        ${notif.details ? JSON.stringify(notif.details) : 'Aucun détail supplémentaire'}
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
