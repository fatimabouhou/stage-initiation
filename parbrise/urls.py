from django.urls import path
from . import views
from .views import register
from .views import custom_logout
from .views import get_recent_notifications, get_notification_count, mark_notification_read,mark_all_notifications_read
from .views import create_user,update_role
from .views import dashboard
from .views import verification_history
from .views import analytics_dashboard


urlpatterns = [
    path('', views.verifier_logo, name='verifier_logo'),
    path('login/', views.login_view, name='login'),
    path('register/', register, name='register'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('gestion/roles/', views.manage_roles, name='manage_roles'),
    path('parebrise/', views.manage_parebrise, name='manage_parebrise'),
    path('profile/', views.profile_view, name='profile_view'),
    path('dashboard/stats/', views.admin_stats, name='admin_stats'),
    path('notifications/recent/', get_recent_notifications, name='get_recent_notifications'),
    path('notifications/count/', get_notification_count, name='get_notification_count'),
    path('notifications/mark-all-read/', mark_all_notifications_read, name='mark_all_notifications_read'),
    path('notifications/mark-read/<int:notification_id>/', mark_notification_read, name='mark_notification_read'),
    path('csp-report/', views.csp_report, name='csp_report'),
    path('csp-reports/', views.csp_report_list, name='csp_report_list'),
    path('dashboard/activity/', views.user_activity, name='user_activity'),
    path('dashboard/activity/<int:user_id>/', views.user_activity, name='user_activity_detail'),
    path('users/<int:user_id>/update-role/', views.update_role, name='update_role'),
    path('users/<int:user_id>/delete/', views.delete_user, name='delete_user'), 

    path('notifications/count/', views.get_notification_count, name='get_notification_count'),
    path('users/<int:user_id>/toggle-status/', views.toggle_user_status, name='toggle_user_status'),
    path('users/<int:user_id>/', views.get_user_details, name='user_detail'),
    path('logout/', custom_logout, name='logout'),
    path('users/create/', create_user, name='create_user'),
    path('dashboard/', dashboard, name='dashboard'),
    path('historique/', verification_history, name='verification_history'),
    path('analytics/', analytics_dashboard, name='analytics'),
    
    
    
]
