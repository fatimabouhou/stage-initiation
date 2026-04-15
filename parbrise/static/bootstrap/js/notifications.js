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

// Gestionnaire principal des notifications
class NotificationManager {
    constructor() {
        this.notifBadge = $('#notif-badge');
        this.notifDropdown = $('#notif-dropdown');
        this.notifIcon = $('.notif-icon');
        this.unreadCount = 0;
        
        this.initEvents();
        this.loadNotifications();
        this.startAutoRefresh();
    }
    
    initEvents() {
        // Clic sur l'icône de notification
        this.notifIcon.on('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });
        
        // Clic en dehors pour fermer
        $(document).on('click', () => this.closeDropdown());
        
        // Empêcher la fermeture quand on clique dans le dropdown
        this.notifDropdown.on('click', (e) => e.stopPropagation());
        
        // Gestion de l'affichage des détails
        $(document).on('click', '.notification-header', this.toggleDetails.bind(this));
        
        // Marquer toutes comme lues
        $(document).on('click', '.mark-all-read', this.markAllAsRead.bind(this));
    }
    
    toggleDropdown() {
        this.notifDropdown.toggle();
        if (this.notifDropdown.is(':visible')) {
            this.loadNotifications();
        }
    }
    
    closeDropdown() {
        this.notifDropdown.hide();
    }
    
    // Charger les notifications depuis le serveur
    async loadNotifications() {
        try {
            const response = await $.ajax({
                url: "/notifications/recent/",
                method: 'GET',
                dataType: 'json'
            });
            
            if (response.success) {
                this.updateUnreadCount(response.unread_count);
                this.renderNotifications(response.notifications);
            }
        } catch (error) {
            console.error("Erreur lors du chargement des notifications:", error);
        }
    }
    
    // Mettre à jour le badge de notification
    updateUnreadCount(count) {
        this.unreadCount = count || 0;
        
        if (this.unreadCount > 0) {
            this.notifBadge.text(this.unreadCount).show();
        } else {
            this.notifBadge.hide();
        }
    }
    
    // Afficher les notifications dans le dropdown
    renderNotifications(notifications) {
        this.notifDropdown.empty();
        
        if (notifications.length === 0) {
            this.notifDropdown.append(`
                <li class="notification-empty">
                    <i class="fas fa-bell-slash"></i>
                    <span>Aucune notification</span>
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
            
            const notificationItem = `
                <li class="notification-item ${isRead ? '' : 'unread'}" data-notif-id="${notif.id}">
                    <div class="notification-header">
                        <div class="notification-icon">
                            <i class="fas ${notif.icon_class || 'fa-bell'} ${this.getNotificationColor(notif)}"></i>
                        </div>
                        <div class="notification-content">
                            <div class="notification-title">${notif.message || 'Nouvelle notification'}</div>
                            <div class="notification-time">${timestamp}</div>
                        </div>
                        ${notif.details ? `
                        <button class="toggle-details-btn">
                            <i class="fas fa-chevron-down"></i>
                        </button>` : ''}
                    </div>
                    ${notif.details ? `
                    <div class="notification-details">
                        ${this.formatNotificationDetails(notif.details)}
                    </div>` : ''}
                </li>
            `;
            
            this.notifDropdown.append(notificationItem);
        });
        
        // Ajouter le bouton "Tout marquer comme lu" si nécessaire
        if (this.unreadCount > 0) {
            this.notifDropdown.append(`
                <li class="notification-footer">
                    <a href="#" class="mark-all-read">
                        <i class="fas fa-check-circle"></i>
                        Tout marquer comme lu
                    </a>
                </li>
            `);
        }
    }
    
    // Basculer l'affichage des détails
    toggleDetails(event) {
        const $header = $(event.currentTarget);
        const $item = $header.closest('.notification-item');
        const $details = $item.find('.notification-details');
        const $chevron = $header.find('.toggle-details-btn i');
        
        // Toggle les détails avec animation
        $details.slideToggle(200);
        $chevron.toggleClass('fa-chevron-down fa-chevron-up');
        
        // Marquer comme lu si nécessaire
        if ($item.hasClass('unread')) {
            const notifId = $item.data('notif-id');
            this.markAsRead(notifId);
            $item.removeClass('unread');
            this.updateUnreadCount(this.unreadCount - 1);
        }
    }
    
    // Marquer une notification comme lue
    async markAsRead(notifId) {
        try {
            await $.ajax({
                url: '/notifications/mark-read/',
                method: 'POST',
                headers: {
                    "X-CSRFToken": getCookie('csrftoken')
                },
                data: { notification_id: notifId }
            });
        } catch (error) {
            console.error("Erreur lors du marquage comme lu:", error);
        }
    }
    
    // Marquer toutes les notifications comme lues
    async markAllAsRead(event) {
        event.preventDefault();
        
        try {
            const response = await $.ajax({
                url: '/notifications/mark-all-read/',
                method: 'POST',
                headers: {
                    "X-CSRFToken": getCookie('csrftoken')
                }
            });
            
            if (response.success) {
                $('.notification-item').removeClass('unread');
                this.updateUnreadCount(0);
            }
        } catch (error) {
            console.error("Erreur lors du marquage toutes comme lues:", error);
        }
    }
    
    // Formater les détails de notification
    formatNotificationDetails(details) {
        if (!details) return '';
        
        // Si les détails sont une chaîne JSON
        if (typeof details === 'string') {
            try {
                details = JSON.parse(details);
            } catch (e) {
                return `<div class="details-content">${details}</div>`;
            }
        }
        
        let html = '<div class="details-content"><ul class="details-list">';
        
        for (const [key, value] of Object.entries(details)) {
            html += `<li class="detail-row">
                <span class="detail-label">${this.formatKey(key)}:</span>
                <span class="detail-value">${this.formatValue(value)}</span>
            </li>`;
        }
        
        html += '</ul></div>';
        return html;
    }
    
    formatKey(key) {
        return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    formatValue(value) {
        if (value === null || value === undefined) return 'N/A';
        if (typeof value === 'object') return JSON.stringify(value, null, 2);
        return value;
    }
    
    // Couleur selon le type de notification
    getNotificationColor(notif) {
        const type = notif.type || notif.action || 'default';
        const colors = {
            'success': 'text-success',
            'error': 'text-danger',
            'warning': 'text-warning',
            'info': 'text-info',
            'default': 'text-primary'
        };
        
        return colors[type.toLowerCase()] || colors['default'];
    }
    
    // Actualisation automatique
    startAutoRefresh() {
        setInterval(() => {
            if (this.notifDropdown.is(':visible')) {
                this.loadNotifications();
            }
        }, 30000); // Toutes les 30 secondes
    }
}

// Initialisation quand le DOM est prêt
$(document).ready(() => {
    window.notificationManager = new NotificationManager();
});