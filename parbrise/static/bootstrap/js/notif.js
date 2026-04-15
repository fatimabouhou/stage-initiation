// Dans votre fichier manage_roles.js
$(document).ready(function() {
  // Gestion de l'affichage des détails
  $(document).on('click', '.btn-toggle-details', function(e) {
    e.stopPropagation();
    const item = $(this).closest('.notification-item');
    item.toggleClass('expanded');
    
    // Marquer comme lu quand on ouvre
    if (item.hasClass('unread') && item.hasClass('expanded')) {
      const notifId = item.data('notif-id');
      markNotificationAsRead(notifId);
      item.removeClass('unread');
    }
  });

  // Marquer une notification comme lue
  $(document).on('click', '.mark-as-read', function(e) {
    e.stopPropagation();
    const notifId = $(this).data('notif-id');
    markNotificationAsRead(notifId);
    $(this).closest('.notification-item').removeClass('unread');
  });

  function markNotificationAsRead(notifId) {
    $.ajax({
      url: '/mark-notification-read/' + notifId + '/',
      method: 'POST',
      headers: {
        'X-CSRFToken': getCookie('csrftoken')
      },
      success: function(data) {
        if (data.success) {
          updateNotificationBadge(data.unread_count);
        }
      }
    });
  }

  function updateNotificationBadge(count) {
    const badge = $('#notif-badge');
    badge.text(count);
    if (count > 0) {
      badge.addClass('has-notifications');
    } else {
      badge.removeClass('has-notifications');
    }
  }

  // Fermer le dropdown quand on clique ailleurs
  $(document).click(function(e) {
    if (!$(e.target).closest('.notif-icon, .notification-item').length) {
      $('.notification-item').removeClass('expanded');
    }
  });
});

// Fonction utilitaire pour récupérer le cookie CSRF
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