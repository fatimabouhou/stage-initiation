// static/bootstrap/js/notifications.js
document.addEventListener('DOMContentLoaded', function() {
    // Initialisation du dropdown Bootstrap
    const notificationDropdown = new bootstrap.Dropdown(
        document.querySelector('.notif-icon')
    );
    
    // Rafraîchissement des notifications
    function refreshNotifications() {
        fetch('/api/notifications/unread/')
            .then(response => response.json())
            .then(data => {
                const badge = document.getElementById('notif-badge');
                badge.textContent = data.count;
                badge.style.display = data.count > 0 ? 'block' : 'none';
                
                if (data.count > 0) {
                    const dropdownContent = document.querySelector('.notification-list');
                    dropdownContent.innerHTML = data.notifications.map(notif => `
                        <div class="notification-item ${notif.read ? '' : 'unread'}" data-id="${notif.id}">
                            <i class="fas ${notif.icon}"></i>
                            <div class="notification-content">
                                <p>${notif.message}</p>
                                <small>${notif.time}</small>
                            </div>
                        </div>
                    `).join('');
                }
            });
    }
    
    // Rafraîchir toutes les 30 secondes
    setInterval(refreshNotifications, 30000);
    refreshNotifications(); // Chargement initial
});