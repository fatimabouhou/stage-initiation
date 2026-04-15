from django.db import models
from django.contrib.auth.models import AbstractUser
import os
from uuid import uuid4
from django.contrib.auth import get_user_model
from django.utils import timezone

def rename_logo(instance, filename):
    """Génère un nom de fichier unique pour les logos"""
    ext = filename.split('.')[-1]
    filename = f"{uuid4().hex}.{ext}"
    return os.path.join('logos_reference', filename)

class PareBrise(models.Model):
    code_sap = models.CharField(max_length=20, unique=True)
    version = models.CharField(max_length=50)
    logo_reference = models.ImageField(upload_to=rename_logo)
    
    def __str__(self):
        return f"{self.code_sap} - {self.version}"

class Ouvrier(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Administrateur'),
        
        ('ouvrier', 'Ouvrier'),
    ]

    employee_id = models.CharField(max_length=20, unique=True, verbose_name="GSID")
    department = models.CharField(max_length=100, verbose_name="Département")
    job_title = models.CharField(max_length=100, verbose_name="Poste")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='ouvrier')
    profile_picture = models.ImageField(
        upload_to='profile_pictures/',
        null=True,
        blank=True,
    )
    
    USERNAME_FIELD = 'employee_id'
    REQUIRED_FIELDS = ['username', 'email', 'department', 'job_title']

    def __str__(self):
        return f"{self.get_full_name()} ({self.employee_id})"
    
    def get_initials(self):
        """Retourne les initiales pour l'avatar"""
        if self.first_name and self.last_name:
            return f"{self.first_name[0]}{self.last_name[0]}".upper()
        return self.username[0].upper()

class VerificationLog(models.Model):
    user = models.ForeignKey(get_user_model(), on_delete=models.SET_NULL, null=True, related_name='verifications')
    parebrise = models.ForeignKey(PareBrise, on_delete=models.SET_NULL, null=True)
    timestamp = models.DateTimeField(default=timezone.now)
    success = models.BooleanField(default=False)
    match_percentage = models.FloatField(null=True, blank=True)
    barcode_match = models.BooleanField(default=False)
    image = models.ImageField(upload_to='verification_logs/')
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name = "Log de vérification"
        verbose_name_plural = "Logs de vérification"
    
    def __str__(self):
        return f"Vérification par {self.user} le {self.timestamp}"

from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Q

class ActivityLog(models.Model):
    ACTION_CHOICES = [
        ('LOGIN', 'Connexion'),
        ('LOGOUT', 'Déconnexion'), 
        ('REGISTER', 'Inscription'),
        ('ROLE_CHANGE', 'Changement de rôle'),
        ('USER_CREATE', 'Création utilisateur'),
        ('USER_UPDATE', 'Mise à jour utilisateur'),
        ('USER_DELETE', 'Suppression utilisateur'),
        ('VERIFICATION', 'Vérification logo'),
        ('PASSWORD_CHANGE', 'Changement mot de passe'),
        ('PROFILE_UPDATE', 'Mise à jour profil'),
    ]
    
    user = models.ForeignKey(get_user_model(), on_delete=models.SET_NULL, null=True, related_name='activities')
    target_user = models.ForeignKey(get_user_model(), on_delete=models.SET_NULL, null=True, blank=True, related_name='targeted_activities')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    timestamp = models.DateTimeField(default=timezone.now)
    details = models.JSONField(default=dict)
    read = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'read']),
            models.Index(fields=['target_user', 'read']),
        ]
    
    def __str__(self):
        return f"{self.get_action_display()} - {self.user}"
    
    def get_icon_class(self):
        """Retourne la classe Font Awesome correspondante"""
        icons = {
            'LOGIN': 'fa-sign-in-alt',
            'LOGOUT': 'fa-sign-out-alt',
            'REGISTER': 'fa-user-plus',
            'ROLE_CHANGE': 'fa-user-tag',
            'USER_CREATE': 'fa-user-plus',
            'USER_UPDATE': 'fa-user-edit',
            'USER_DELETE': 'fa-user-times',
            'VERIFICATION': 'fa-check-circle',
            'PASSWORD_CHANGE': 'fa-key',
            'PROFILE_UPDATE': 'fa-id-card',
        }
        return icons.get(self.action, 'fa-bell')
    
    def get_message(self):
        """Génère un message lisible selon le type d'action"""
        if self.action == 'ROLE_CHANGE':
            return f"Rôle changé de {self.details.get('old_role')} à {self.details.get('new_role')}"
        elif self.action == 'USER_CREATE':
            return f"Nouvel utilisateur créé: {self.target_user.get_full_name()}"
        elif self.action == 'VERIFICATION':
            return f"Vérification {'réussie' if self.details.get('success') else 'échouée'}"
        return self.get_action_display()
    
from django.db import models

class CSPReport(models.Model):
    document_uri = models.URLField()
    violated_directive = models.CharField(max_length=255)
    blocked_uri = models.TextField()
    original_policy = models.TextField()
    source_file = models.TextField(blank=True, null=True)
    script_sample = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
