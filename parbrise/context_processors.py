# accounts/context_processors.py
def role_flags(request):
    user = request.user
    if user.is_authenticated:
        return {
            'is_admin': user.is_superuser or user.groups.filter(name='admin').exists(),
            'is_worker': user.groups.filter(name='ouvrier').exists(),
            # Ajoute d’autres rôles si besoin
        }
    return {}
