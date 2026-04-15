from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Ouvrier, PareBrise, VerificationLog, ActivityLog

class OuvrierAdmin(UserAdmin):
    model = Ouvrier
    list_display = ('employee_id', 'username', 'email', 'role', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_active')
    fieldsets = (
        (None, {'fields': ('employee_id', 'username', 'password')}),
        ('Informations personnelles', {'fields': ('email', 'first_name', 'last_name', 'department', 'job_title', 'role')}),
        ('Permissions', {'fields': ('is_staff', 'is_active', 'groups', 'user_permissions')}),
        ('Dates importantes', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('employee_id', 'username', 'email', 'department', 'job_title', 'role', 'password1', 'password2', 'is_staff', 'is_active')}
        ),
    )
    search_fields = ('employee_id', 'username', 'email')
    ordering = ('employee_id',)

admin.site.register(Ouvrier, OuvrierAdmin)

# ✅ Ajouter PareBrise
@admin.register(PareBrise)
class PareBriseAdmin(admin.ModelAdmin):
    list_display = ('code_sap', 'version')
    search_fields = ('code_sap', 'version')

# ✅ Ajouter VerificationLog
@admin.register(VerificationLog)
class VerificationLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'parebrise', 'timestamp', 'success', 'match_percentage')
    search_fields = ('user__username', 'parebrise__code_sap')

# ✅ Ajouter ActivityLog
@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'timestamp')
    search_fields = ('user__username', 'action')
