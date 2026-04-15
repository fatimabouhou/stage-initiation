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

    document.querySelector('.chart-filter').addEventListener('change', function () {
        const period = this.value;
        const canvas = document.getElementById('verificationChart');

        canvas.classList.add('fading');

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

                canvas.classList.remove('fading');
            })
            .catch(error => {
                console.error('Erreur:', error);
                canvas.classList.remove('fading');
            });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const topbar = document.querySelector('.sg-topbar');
    if (topbar) topbar.classList.add('visible');

    const carousel = new bootstrap.Carousel('#headerCarousel', {
        interval: 1000,
        ride: 'carousel',
        wrap: true
    });

    document.querySelectorAll('.carousel').forEach(carousel => {
        carousel.classList.add('carousel-fast-transition');
    });
});

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

$(document).ready(function () {
    const $notifBadge = $('#notif-badge');
    const $notifDropdown = $('#notif-dropdown');
    const $notifIcon = $('.notif-icon');

    function loadNotifications() {
        $.ajax({
            url: "/notifications/recent/",
            method: 'GET',
            dataType: 'json',
            success: function (data) {
                if (data.success) {
                    updateNotificationBadge(data.unread_count || 0);
                    renderNotifications(data.notifications);
                }
            },
            error: function (xhr, status, error) {
                console.error("Erreur lors du chargement des notifications:", error);
            }
        });
    }

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
                        <div class="notification-details small text-muted mt-2 d-none">
                            ${notif.details ? JSON.stringify(notif.details) : 'Aucun détail supplémentaire'}
                        </div>
                    </a>
                </li>
            `;
            $notifDropdown.append(notificationItem);
        });

        $notifDropdown.append(`
            <li class="dropdown-divider"></li>
            <li>
                <a class="dropdown-item text-center small mark-all-read" href="#">
                    <i class="fas fa-check-circle me-2"></i>Tout marquer comme lu
                </a>
            </li>
        `);
    }

    $(document).on('click', '.notification-item', function (e) {
        e.preventDefault();
        $(this).find('.notification-details').toggleClass('d-none');

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
            success: function (response) {
                if (response.success) {
                    updateNotificationBadge(response.unread_count);
                    loadNotifications();
                }
            }
        });
    });

    $notifIcon.on('click', function () {
        loadNotifications();
        $notifDropdown.toggle();
    });

    $(document).on('click', function (e) {
        if (!$(e.target).closest('.notif-icon').length) {
            $notifDropdown.hide();
        }
    });

    setInterval(loadNotifications, 30000);
    loadNotifications();

    function applyFilters() {
        const searchTerm = $('#search-input').val().toLowerCase();
        const roleFilter = $('#role-filter').val();
        const deptFilter = $('#department-filter').val();

        $('.role-table tbody tr').each(function () {
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

    $('#create-user-form').submit(function (e) {
        e.preventDefault();
        const form = $(this);

        $.ajax({
            url: form.attr('action'),
            type: 'POST',
            headers: {
                "X-CSRFToken": getCookie('csrftoken')
            },
            data: form.serialize(),
            success: function (response) {
                if (response.success) {
                    $('#addUserModal').modal('hide');
                    location.reload();
                } else {
                    alert('Erreur: ' + (response.error || 'Erreur lors de la création'));
                }
            },
            error: function (xhr) {
                alert('Erreur serveur: ' + xhr.responseText);
            }
        });
    });

    $('.edit-role-btn').click(function () {
        const userId = $(this).data('user-id');
        const currentRole = $(this).data('current-role');

        $('#edit-user-id').val(userId);
        $('#new-role-select').val(currentRole);
        $('#edit-role-form').attr('action', `/users/${userId}/update-role/`);

        $('#editRoleModal').modal('show');
    });

    $('#edit-role-form').submit(function (e) {
        e.preventDefault();
        const form = $(this);

        $.ajax({
            url: form.attr('action'),
            type: 'POST',
            headers: {
                "X-CSRFToken": getCookie('csrftoken')
            },
            data: form.serialize(),
            success: function (response) {
                if (response.success) {
                    $('#editRoleModal').modal('hide');
                    location.reload();
                } else {
                    alert('Erreur: ' + (response.message || 'Erreur lors de la modification'));
                }
            },
            error: function (xhr) {
                alert('Erreur serveur: ' + xhr.responseText);
            }
        });
    });

    $(document).on('click', '.delete-user-btn', function () {
        const userId = $(this).data('user-id');
        const userName = $(this).data('user-name');

        $('#delete-user-name').text(userName);
        $('#confirm-delete-btn').data('user-id', userId);
        $('#deleteUserModal').modal('show');
    });

    $(document).on('click', '#confirm-delete-btn', function () {
        const userId = $(this).data('user-id');
        const csrfToken = $('[name=csrfmiddlewaretoken]').val();

        $.ajax({
            url: `/users/${userId}/delete/`,
            type: 'POST',
            headers: {
                'X-CSRFToken': csrfToken
            },
            success: function (response) {
                if (response.success) {
                    window.location.reload();
                } else {
                    alert('Erreur : ' + response.error);
                }
            },
            error: function (xhr) {
                alert('Erreur serveur : ' + xhr.statusText);
            }
        });
    });
});
