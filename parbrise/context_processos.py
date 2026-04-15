from .models import ActivityLog
from django.db.models import Q

def notifications(request):
    if request.user.is_authenticated:
        return {
            'unread_count': ActivityLog.objects.filter(
                Q(read=False) & 
                (Q(target_user=request.user) | Q(user=request.user))
            ).count()
        }
    return {}