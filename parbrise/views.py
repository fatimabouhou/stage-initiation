from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from django.views.decorators.http import require_POST, require_GET
from django.http import JsonResponse
from django.contrib import messages
from django.db import transaction
import json
import logging
from django.urls import reverse
from .models import Ouvrier, ActivityLog, VerificationLog, PareBrise
from .forms import OuvrierUpdateForm, OuvrierCreationForm
from django.db.models import Q, Count, Case, When, Sum
from django.utils import timezone
from datetime import timedelta
from django.db.models.functions import TruncDay
from django.contrib.auth import logout
from django.contrib.auth.decorators import user_passes_test

from django.contrib.auth.decorators import login_required
from django.db.models import Count, Sum, Case, When, Q
from django.utils import timezone
from datetime import timedelta
from django.db.models.functions import TruncDay
import json
from .models import Ouvrier, VerificationLog, PareBrise



def is_admin(user):
    return user.is_authenticated and user.groups.filter(name='admin').exists()

# Logger configuration
logger = logging.getLogger(__name__)


from PIL import ImageOps

from PIL import Image, ImageOps
import numpy as np

import numpy as np
import cv2
from PIL import Image

def isoler_logo(image_pil, aire_min=1000, aire_max=30000):
    """
    Isole le(s) contour(s) correspondant au logo en filtrant par aire.
    - image_pil : image PIL en mode 'L' ou 'RGB'
    - aire_min, aire_max : seuils pour filtrer les contours
    """
    # Convertir en niveaux de gris si besoin
    if image_pil.mode == "RGB":
        img_gray = cv2.cvtColor(np.array(image_pil), cv2.COLOR_RGB2GRAY)
    else:
        img_gray = np.array(image_pil)

    # Seuillage inversé : noir devient blanc pour trouver contours (car contours détectent blanc)
    _, thresh = cv2.threshold(img_gray, 127, 255, cv2.THRESH_BINARY_INV)

    # Trouver contours externes
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Masque vide
    masque = np.zeros_like(thresh)

    # Filtrer contours selon aire et dessiner seulement ceux-ci dans le masque
    for cnt in contours:
        aire = cv2.contourArea(cnt)
        if aire_min <= aire <= aire_max:
            cv2.drawContours(masque, [cnt], -1, 255, thickness=cv2.FILLED)

    # Appliquer masque pour garder uniquement la zone du logo
    img_isole = cv2.bitwise_and(img_gray, masque)

    # Retourner image PIL du résultat
    return Image.fromarray(img_isole)

def auto_crop(image_pil, seuil=10, marge=0.1):
    """
    Recadre l’image autour du contenu non-blanc avec possibilité de réduire la boîte (marge positive = zoom).
    - seuil : seuil pour binariser (détection du contenu)
    - marge : fraction de la taille (ex: 0.1 = on enlève 10% autour)
    """
    img_cv = cv2.cvtColor(np.array(image_pil), cv2.COLOR_RGB2GRAY)
    _, thresh = cv2.threshold(img_cv, seuil, 255, cv2.THRESH_BINARY_INV)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        return image_pil

    x, y, w, h = cv2.boundingRect(np.vstack(contours))

    # Appliquer réduction de marge
    reduce_w = int(w * marge)
    reduce_h = int(h * marge)
    x_new = x + reduce_w // 2
    y_new = y + reduce_h // 2
    w_new = w - reduce_w
    h_new = h - reduce_h

    # Sécuriser pour ne pas dépasser
    x_new = max(x_new, 0)
    y_new = max(y_new, 0)
    w_new = max(w_new, 1)
    h_new = max(h_new, 1)

    cropped = np.array(image_pil)[y_new:y_new + h_new, x_new:x_new + w_new]
    return Image.fromarray(cropped)

def auto_crop_personnalise(image_pil, marge_haut=20, marge_bas=30):
    """
    Recadre l'image automatiquement en laissant une marge en haut
    et en coupant plus en bas.
    - marge_haut : nombre de pixels à ajouter en haut
    - marge_bas  : nombre de pixels à enlever en bas
    """
    img_cv = cv2.cvtColor(np.array(image_pil), cv2.COLOR_RGB2GRAY)
    _, thresh = cv2.threshold(img_cv, 10, 255, cv2.THRESH_BINARY_INV)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if not contours:
        return image_pil

    x, y, w, h = cv2.boundingRect(np.vstack(contours))

    # Calculer nouvelles bornes
    y_new = max(0, y - marge_haut)
    h_new = max(1, h - marge_bas)

    # Découpe
    cropped = np.array(image_pil)[y_new:y_new+h_new, x:x+w]
    return Image.fromarray(cropped)


def normaliser_luminosite(image_pil):
    """Améliore le contraste global via histogramme égalisé"""
    gray = cv2.cvtColor(np.array(image_pil), cv2.COLOR_RGB2GRAY)
    equalized = cv2.equalizeHist(gray)
    return Image.fromarray(equalized)

from django.http import JsonResponse
from django.views.decorators.http import require_POST
from .models import ActivityLog


from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from .models import Ouvrier, ActivityLog

@login_required
@login_required
def manage_users(request):
    users = Ouvrier.objects.all().order_by('last_name', 'first_name')
    
    # Filtres
    search_term = request.GET.get('search', '')
    role_filter = request.GET.get('role', '')
    department_filter = request.GET.get('department', '')

    if search_term:
        users = users.filter(
            Q(employee_id__icontains=search_term) |
            Q(first_name__icontains=search_term) |
            Q(last_name__icontains=search_term) |
            Q(email__icontains=search_term) |
            Q(department__icontains=search_term)
        )

    if role_filter:
        users = users.filter(role=role_filter)

    if department_filter:
        users = users.filter(department=department_filter)

    # Récupération des notifications non lues
    notifications = ActivityLog.objects.filter(
        Q(user=request.user) | Q(target_user=request.user),
        read=False
    ).order_by('-timestamp')[:10]
    
    notif_count = notifications.count()

    context = {
        'users': users,
        'notifications': notifications,
        'notif_count': notif_count,
        'search_term': search_term,
        'role_filter': role_filter,
        'department_filter': department_filter,
        'role_choices': Ouvrier.ROLE_CHOICES,
        'departments': Ouvrier.objects.values_list('department', flat=True).distinct(),
    }
    return render(request, 'gestion/manage_users.html', context)
from django.views.decorators.http import require_GET
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.db.models import Q
from django.core.cache import cache

@require_GET
@login_required
def get_recent_notifications(request):
    try:
        user = request.user
        cache_key = f'unread_notifications_{user.id}'
        unread_ids = cache.get(cache_key, set())
        
        notifications = ActivityLog.objects.filter(
            Q(user=user) | Q(target_user=user)
        ).exclude(
            action__in=['login', 'Connexion']
        ).select_related('user', 'target_user').order_by('-timestamp')[:10]
        
        notifications_data = []
        for notif in notifications:
            try:
                message = notif.get_message()
            except Exception:
                message = notif.action  # fallback
                
            is_read = str(notif.id) not in unread_ids
            notifications_data.append({
                'id': notif.id,
                'action': notif.action,
                'message': message,
                'timestamp': notif.timestamp.isoformat(),
                'is_read': is_read,
                'icon_class': notif.get_icon_class(),
                'url': '#',
                'details': notif.details
            })
            
        return JsonResponse({
            'success': True,
            'notifications': notifications_data,
            'unread_count': len(unread_ids)
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

# Exemple de vue pour supprimer un utilisateur
@login_required
@user_passes_test(lambda u: u.role == 'admin')
@require_POST
def delete_user(request, user_id):
    try:
        user_to_delete = get_object_or_404(Ouvrier, id=user_id)
        
        # Création de la notification SIMPLIFIÉE
        ActivityLog.objects.create(
            user=request.user,
            action='Suppression utilisateur',
            details=f"{request.user.get_full_name()} a supprimé {user_to_delete.get_full_name()}"
        )
        
        user_to_delete.delete()
        return JsonResponse({'success': True})
    
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})
@login_required
@require_GET
def get_user_details(request, user_id):
    try:
        user = get_object_or_404(Ouvrier, id=user_id)

        verification_stats = VerificationLog.objects.filter(user=user).aggregate(
            total=Count('id'),
            success=Sum(Case(When(success=True, then=1), default=0)),
            barcode_match=Sum(Case(When(barcode_match=True, then=1), default=0))
        )

        last_activities = ActivityLog.objects.filter(
            Q(user=user) | Q(target_user=user)
        ).order_by('-timestamp')[:5]

        return JsonResponse({
            'success': True,
            'user': {
                'id': user.id,
                'employee_id': user.employee_id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'role_display': user.get_role_display(),
                'department': user.department,
                'job_title': user.job_title,
                'is_active': user.is_active,
                'last_login': user.last_login.strftime('%d/%m/%Y %H:%M') if user.last_login else None,
                'date_joined': user.date_joined.strftime('%d/%m/%Y'),
            },
            'stats': verification_stats,
            'activities': [{
                'action': a.action,
                'timestamp': a.timestamp.strftime('%d/%m/%Y %H:%M'),
                'details': a.details
            } for a in last_activities]
        })
    except Exception as e:
        logger.error(f"Erreur récupération détails utilisateur: {str(e)}")
        return JsonResponse({'success': False, 'message': str(e)}, status=500)


@login_required
def user_activity_report(request, user_id):
    user = get_object_or_404(Ouvrier, id=user_id)

    verifications = VerificationLog.objects.filter(user=user).annotate(
        day=TruncDay('timestamp')
    ).values('day').annotate(
        total=Count('id'),
        success=Sum(Case(When(success=True, then=1), default=0)),
        barcode_match=Sum(Case(When(barcode_match=True, then=1), default=0))
    ).order_by('day')

    activities = ActivityLog.objects.filter(
        Q(user=user) | Q(target_user=user)
    ).order_by('-timestamp')[:100]

    total_verifications = VerificationLog.objects.filter(user=user).count()
    total_success = VerificationLog.objects.filter(user=user, success=True).count()
    total_barcode = VerificationLog.objects.filter(user=user, barcode_match=True).count()

    context = {
        'target_user': user,
        'verifications': verifications,
        'activities': activities,
        'stats': {
            'total_verifications': total_verifications,
            'success_rate': (total_success / total_verifications * 100) if total_verifications else 0,
            'barcode_success_rate': (total_barcode / total_verifications * 100) if total_verifications else 0
        }
    }

    return render(request, 'reports/user_activity.html', context)
from django.shortcuts import render, redirect, get_object_or_404
from .models import PareBrise, Ouvrier, VerificationLog, ActivityLog
from PIL import Image
from io import BytesIO
import base64
import cv2
import numpy as np
from pyzbar.pyzbar import decode
import pytesseract
import logging
from .forms import OuvrierCreationForm
from django.contrib.auth import authenticate, login
from django.contrib import messages
from django.contrib.auth.decorators import login_required, user_passes_test
from django.views.decorators.http import require_POST
from django.http import JsonResponse
from django.db.models import Count, Sum, Case, When
from django.utils import timezone
from django.db.models.functions import TruncDay
from datetime import timedelta
from django.db.models import Q  


# Logger configuration
logger = logging.getLogger(__name__)

def image_to_base64(image):
    """Convertit une image PIL en base64 pour affichage HTML"""
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode('utf-8')

def extraire_code_barres(image_pil):
    """Détection de codes-barres via plusieurs méthodes"""
    img_cv = np.array(image_pil)
    methods = [
        
        methode_contraste_eleve,
        methode_seuillage_adaptatif,
        methode_dilatation,
       
    ]
    codes_trouves = set()
    for method in methods:
        try:
            codes = method(img_cv.copy())
            if codes:
                for code in codes:
                    if code.strip():
                        codes_trouves.add(code)
                        logger.info(f"{method.__name__} a trouvé: {code}")
        except Exception as e:
            logger.error(f"Erreur dans {method.__name__}: {str(e)}")
    return list(codes_trouves) if codes_trouves else None

# Méthodes de traitement d'image
def methode_standard(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return [code.data.decode('utf-8') for code in decode(gray)]

def methode_contraste_eleve(img):
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
    cl = clahe.apply(l)
    limg = cv2.merge((cl,a,b))
    gray = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
    gray = cv2.cvtColor(gray, cv2.COLOR_BGR2GRAY)
    return [code.data.decode('utf-8') for code in decode(gray)]

def methode_seuillage_adaptatif(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                   cv2.THRESH_BINARY, 11, 2)
    return [code.data.decode('utf-8') for code in decode(thresh)]

def methode_dilatation(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)
    kernel = np.ones((3,3), np.uint8)
    dilated = cv2.dilate(thresh, kernel, iterations=1)
    return [code.data.decode('utf-8') for code in decode(dilated)]

def methode_erosion(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)
    kernel = np.ones((3,3), np.uint8)
    eroded = cv2.erode(thresh, kernel, iterations=1)
    return [code.data.decode('utf-8') for code in decode(eroded)]

def methode_contours(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)
    return [code.data.decode('utf-8') for code in decode(edges)]

def methode_pytesseract(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    custom_config = r'--oem 3 --psm 11 outputbase digits'
    text = pytesseract.image_to_string(gray, config=custom_config)
    return [s for s in text.split() if s.isdigit() and len(s) >= 6]

def images_similaires(img1_pil, img2_pil, seuil=10):
    """Compare deux images à l’aide d’ORB (seuil = % de similarité)"""
    img1 = cv2.cvtColor(np.array(img1_pil), cv2.COLOR_RGB2GRAY)
    img2 = cv2.cvtColor(np.array(img2_pil), cv2.COLOR_RGB2GRAY)

    orb = cv2.ORB_create()
    kp1, des1 = orb.detectAndCompute(img1, None)
    kp2, des2 = orb.detectAndCompute(img2, None)

    if des1 is None or des2 is None:
        return False, 0.0

    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    matches = bf.match(des1, des2)

    good_matches = [m for m in matches if m.distance < 60]
    similarity = len(good_matches) / max(len(kp1), len(kp2))

    return similarity >= (seuil / 100.0), similarity

def create_verification_log(user, parebrise, success, match_percentage, barcode_match, image=None):
    """Crée un log de vérification"""
    VerificationLog.objects.create(
        user=user,
        parebrise=parebrise,
        success=success,
        match_percentage=match_percentage,
        barcode_match=barcode_match,
        image=image
    )

def create_activity_log(user, action, target_user=None, details=None):
    """Crée un log d'activité"""
    ActivityLog.objects.create(
        user=user,
        action=action,
        target_user=target_user,
        details=details or {}
    )

# Vue principale : vérification du logo
from PIL import ImageOps, ImageEnhance
import numpy as np
import cv2
import base64

def auto_crop(image_pil, seuil=10):
    """Recadre l’image autour du contenu non-blanc."""
    img_cv = cv2.cvtColor(np.array(image_pil), cv2.COLOR_RGB2GRAY)
    _, thresh = cv2.threshold(img_cv, seuil, 255, cv2.THRESH_BINARY_INV)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return image_pil
    x, y, w, h = cv2.boundingRect(np.vstack(contours))
    cropped = np.array(image_pil)[y:y+h, x:x+w]
    return Image.fromarray(cropped)

def redimensionner_image(image_pil, taille=(500, 500)):
    """Redimensionne l’image à taille standard."""
    return image_pil.resize(taille, Image.Resampling.LANCZOS)

def normaliser_luminosite(image_pil):
    """Améliore la luminosité et contraste pour uniformiser."""
    enhancer = ImageEnhance.Contrast(image_pil)
    image_pil = enhancer.enhance(1.5)
    enhancer = ImageEnhance.Brightness(image_pil)
    image_pil = enhancer.enhance(1.2)
    return image_pil
from django.http import HttpResponseNotFound
def verifier_logo(request):
    user = request.user
    if not (user.is_authenticated and (user.is_superuser or user.groups.filter(name="ouvrier").exists())):
        logout(request)
        return redirect('login')
    context = {
        'active_page': 'verifier_logo',
        'message': None,
        'message_tag': None,
        'match_percentage': None,
        'barcode_message': None,
        'uploaded_image': None,
        'reference_image': None,
        'ocr_text_normal': None,
        'ocr_text_flipped': None
    }
    from django.core.files.base import ContentFile
    from io import BytesIO

    def pil_to_django_file(pil_image, name="image.png"):
            buffer = BytesIO()
            pil_image.save(buffer, format="PNG")
            return ContentFile(buffer.getvalue(), name)

    if request.method == 'POST':
        code_sap = request.POST.get('code_sap')
        uploaded_logo = request.FILES.get('logo_uploaded')

        try:
            parebrise = PareBrise.objects.get(code_sap=code_sap)
        except PareBrise.DoesNotExist:
            context.update({
                'message': "❌ Code SAP inconnu dans la base de données.",
                'message_tag': "danger"
            })
            return render(request, 'form.html', context)

        try:
            # --- Chargement des images ---
            img_uploaded = Image.open(uploaded_logo)
            img_reference = Image.open(parebrise.logo_reference.path)

            # ✅ CORRECTION ORIENTATION -------------------
            img_uploaded = ImageOps.exif_transpose(img_uploaded)  # EXIF
            MOTS_CLES = ["SEKURIT", "KENITRA", "SAINT", "GOB", "SÉCURIT", "PVB", "SÉKURIT", "GOBAIN"]
            ZOOM_FACTOR = 1.5
            LANGUE = 'fra+eng'

            def ocr_ameliore(image_pil, zoom=1.0):
                if zoom != 1.0:
                    w, h = image_pil.size
                    image_pil = image_pil.resize((int(w*zoom), int(h*zoom)), Image.LANCZOS)
                gray = image_pil.convert('L')
                enhancer = ImageEnhance.Contrast(gray)
                enhanced = enhancer.enhance(1.8)
                try:
                    config1 = r'--oem 3 --psm 6 -l ' + LANGUE
                    texte = pytesseract.image_to_string(enhanced, config=config1)
                    if len(texte.strip()) < 5:
                        config2 = r'--oem 3 --psm 11 -l ' + LANGUE
                        texte = pytesseract.image_to_string(enhanced, config=config2)
                except:
                    texte = ""
                return texte.strip()

            # OCR normal + miroir
            texte_normal = ocr_ameliore(img_uploaded, ZOOM_FACTOR)
            img_miroir = img_uploaded.transpose(Image.FLIP_LEFT_RIGHT)
            texte_miroir = ocr_ameliore(img_miroir, ZOOM_FACTOR)

            # Décision finale d'orientation
            def detecter_mots_cles(texte, mots_cles):
                texte = texte.upper()
                return any(mot in texte for mot in mots_cles)

            if detecter_mots_cles(texte_normal, MOTS_CLES):
                final_img = img_uploaded
                orientation = "NORMALE (mots-clés détectés)"
            elif detecter_mots_cles(texte_miroir, MOTS_CLES):
                final_img = img_miroir
                orientation = "MIROIR (mots-clés détectés)"
            else:
                final_img = img_uploaded
                orientation = "NORMALE (par défaut)"
            # ----------------------------------------------------------
            
            # ✅ Suite du traitement original ---------------
            final_img = auto_crop(final_img)
            final_img = redimensionner_image(final_img, taille=(500, 500))
            final_img = normaliser_luminosite(final_img)

            # Vérification similarité avec la référence
            similar, similarity = images_similaires(final_img, img_reference)
            match_percentage = round(similarity * 100, 2)
            uploaded_image = f"data:image/png;base64,{image_to_base64(final_img)}"


            # Détection code-barres
            codes_uploaded = extraire_code_barres(final_img)
            codes_reference = extraire_code_barres(img_reference)
            
            # NOUVELLE LOGIQUE DE VALIDATION
            barcode_match = False
            barcode_msg = ""

            if codes_reference:  # Si la référence a un code-barres
                if codes_uploaded:
                    if set(codes_uploaded) & set(codes_reference):
                        barcode_match = True
                        barcode_msg = "✅ Le code-barres correspond."
                    else:
                        barcode_msg = f"❌ Code-barres différent (Soumis: {codes_uploaded}, Réf: {codes_reference})"
                else:
                    barcode_msg = "❌ Aucun code-barres détecté (la référence en a)"
            else:  # Si la référence n'a PAS de code-barres
                if codes_uploaded:
                    barcode_msg = f"⚠ Code-barres détecté (pas de référence): {codes_uploaded}"
                    barcode_match = False
                else:
                    barcode_msg = "ℹ Aucun code-barres détecté (ni dans l'upload ni la référence)"
                    barcode_match = True  # Cas valide: aucun code des deux côtés

            # Résultat final
            if similar and (barcode_match or (not codes_reference and not codes_uploaded)):
                final_message = f"✅ Logo valide ({orientation})"
                final_tag = "success"
                is_success = True
            else:
                final_message = f"❌ Logo invalide ({orientation})"
                final_tag = "danger"
                is_success = False
                reasons = []
                if not similar:
                    reasons.append(f"similarité faible ({match_percentage}%)")
                if not barcode_match:
                    reasons.append("code-barres incompatible")
                if reasons:
                    final_message += f" | Raisons: {', '.join(reasons)}"

            # Mise à jour du contexte
            context.update({
                'uploaded_image': uploaded_image,
                'message': final_message,
                'message_tag': final_tag,
                'match_percentage': match_percentage,
                'barcode_message': barcode_msg,
                'uploaded_image': f"data:image/png;base64,{image_to_base64(final_img)}",
                'reference_image': parebrise.logo_reference.url,
                'ocr_text_normal': texte_normal,
                'ocr_text_flipped': texte_miroir
            })

            if request.user.is_authenticated:
                VerificationLog.objects.create(
                    user=request.user,
                    parebrise=parebrise,
                    success=is_success,
                    match_percentage=match_percentage,
                    barcode_match=barcode_match,
                    image=pil_to_django_file(final_img, name="traitement.png")
                )

        except Exception as e:
            logger.error(f"Erreur lors du traitement : {str(e)}", exc_info=True)
            context.update({
                'message': f"❌ Erreur lors du traitement : {str(e)}",
                'message_tag': "danger"
            })

    return render(request, 'form.html', context)
# Vue de connexion personnalisée avec GSID
def login_view(request):
    if request.method == 'POST':
        gsid = request.POST.get('gsid')
        password = request.POST.get('password')

        try:
            user_obj = Ouvrier.objects.get(employee_id=gsid)
        except Ouvrier.DoesNotExist:
            user_obj = None

        if user_obj:
            user = authenticate(request, username=gsid, password=password)
        else:
            user = None

        if user:
            login(request, user)
            create_activity_log(user=user, action="Connexion")
            
            # Redirection selon rôle
            if user.is_superuser or user.role == 'admin':
                return redirect('manage_roles')
            else:
                return redirect('verifier_logo')
        else:
            messages.error(request, "GSID ou mot de passe incorrect.")

    return render(request, 'registration/login.html')

# Vue d'inscription avec validation du GSID
def register(request):
    if request.method == 'POST':
        form = OuvrierCreationForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.username = user.employee_id

            if Ouvrier.objects.filter(employee_id=user.employee_id).exists():
                messages.error(request, "Ce GSID est déjà utilisé.")
                return render(request, 'registration/register.html', {'form': form})

            user.save()
            create_activity_log(user=user, action="Inscription")
            messages.success(request, "Inscription réussie ! Veuillez vous connecter.")
            return redirect('login')
        else:
            messages.error(request, "Erreur dans le formulaire.")
    else:
        form = OuvrierCreationForm()
    return render(request, 'registration/register.html', {'form': form})

@login_required
def dashboard(request):
    role = request.user.role
    if role == 'admin':
        return redirect('admin_stats')
    elif role == 'superviseur':
        return redirect('superviseur_stats')
    else:
        return redirect('user_activity')



def is_superviseur(user):
    return user.role == 'superviseur'

@login_required
@user_passes_test(is_admin, login_url='/login/')
 
def manage_roles(request):
    users = Ouvrier.objects.all().order_by('role', 'employee_id')
    role_choices = Ouvrier.ROLE_CHOICES
    
    if request.method == 'POST':
        search_term = request.POST.get('search', '').strip()
        role_filter = request.POST.get('role_filter', '')
        
        if search_term:
            # Voici où vous placez le code de filtrage
            users = users.filter(
                Q(employee_id__icontains=search_term) |
                Q(first_name__icontains=search_term) |
                Q(last_name__icontains=search_term) |
                Q(department__icontains=search_term) |
                Q(job_title__icontains=search_term)
            )
        
        if role_filter:
            users = users.filter(role=role_filter)
    
    context = {
        'active_page': 'manage_roles',
        'users': users,
        'role_choices': role_choices,
    }
    return render(request, 'gestion/manage_roles.html', context)

from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
from .models import Ouvrier
import json

from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST


from django.contrib.auth.models import Group

@login_required
@require_POST
def update_role(request, user_id):
    try:
        if not request.user.is_superuser and request.user.role != 'admin':
            return JsonResponse({
                'success': False,
                'message': 'Permission refusée'
            }, status=403)

        new_role = request.POST.get('new_role')
        if not new_role:
            return JsonResponse({
                'success': False,
                'message': 'Le rôle est requis'
            }, status=400)

        user = Ouvrier.objects.get(id=user_id)
        
        # Sauvegarde de l'ancien rôle pour le log
        old_role = user.role
        
        # Mise à jour du rôle
        user.role = new_role
        user.save()

        # Mise à jour des groupes
        user.groups.clear()  # Supprime tous les groupes actuels
        
        if new_role == 'admin':
            group = Group.objects.get(name='admin')
        elif new_role == 'ouvrier':
            group = Group.objects.get(name='ouvrier')
        # Ajoutez d'autres rôles si nécessaire
            
        user.groups.add(group)

       
        # 5. Création de la notification
        ActivityLog.objects.create(
            user=request.user,
            action='USER_CREATE',
            target_user=user,
            details={
                'action': 'Création utilisateur',
                'created_by': {
                    'name': request.user.get_full_name(),
                    'role': request.user.get_role_display()
                },
                'new_user': {
                    'name': user.get_full_name(),
                    'email': user.email,
                    'role': user.get_role_display(),
                    'department': user.department
                }
            }
        )
        init_notification_cache(request.user)

        return JsonResponse({
            'success': True,
            'message': 'Rôle et groupe mis à jour',
            'new_role': new_role,
            'new_role_display': user.get_role_display(),
            'groups': list(user.groups.values_list('name', flat=True))
        })

    except Ouvrier.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Utilisateur non trouvé'
        }, status=404)
    except Group.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Groupe non configuré pour ce rôle'
        }, status=400)
    except Exception as e:
        logger.error(f"Erreur changement rôle: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)
@login_required
def admin_stats(request):
    # Statistiques utilisateurs
    users_by_role = Ouvrier.objects.values('role').annotate(
        count=Count('id'),
        active=Sum(Case(When(last_login__gte=timezone.now()-timedelta(days=30), then=1), default=0))
    ).order_by('-count')

    # Statistiques vérifications
    verifications = VerificationLog.objects.filter(
        timestamp__gte=timezone.now() - timedelta(days=30)
    ).annotate(
        day=TruncDay('timestamp')
    ).values('day').annotate(
        count=Count('id'),
        success=Sum(Case(When(success=True, then=1), default=0)),
        barcode_match=Sum(Case(When(barcode_match=True, then=1), default=0))
    ).order_by('day')

    # Dernières activités
    recent_activity = ActivityLog.objects.select_related('user', 'target_user').order_by('-timestamp')[:20]
    
    
    context = {
        'users_by_role': users_by_role,
        'verifications': list(verifications),
        'recent_activity': recent_activity,
        'total_users': Ouvrier.objects.count(),
        'total_verifications': VerificationLog.objects.count(),
        'success_rate': VerificationLog.objects.filter(success=True).count() / VerificationLog.objects.count() * 100 if VerificationLog.objects.exists() else 0,
    }
    return render(request, 'dashboards/admin_stats.html', context)

@login_required
@user_passes_test(is_superviseur)
def superviseur_stats(request):
    # Statistiques pour l'équipe du superviseur
    team = Ouvrier.objects.filter(department=request.user.department)
    
    team_verifications = VerificationLog.objects.filter(
        user__in=team,
        timestamp__gte=timezone.now() - timedelta(days=30)
    ).annotate(
        day=TruncDay('timestamp')
    ).values('day').annotate(
        count=Count('id'),
        success=Sum(Case(When(success=True, then=1), default=0))
    ).order_by('day')

    team_performance = team.annotate(
        verification_count=Count('verificationlog'),
        success_rate=Sum(Case(When(verificationlog__success=True, then=1), default=0)) / Count('verificationlog') * 100
    ).order_by('-verification_count')

    context = {
        'team': team,
        'team_verifications': list(team_verifications),
        'team_performance': team_performance,
        'department': request.user.department,
    }
    return render(request, 'dashboards/superviseur_stats.html', context)

@login_required
def user_activity(request, user_id=None):
    if user_id and (request.user.role in ['admin', 'superviseur']):
        user = get_object_or_404(Ouvrier, id=user_id)
        can_view_details = True
    else:
        user = request.user
        can_view_details = False
    
    verifications = VerificationLog.objects.filter(user=user).order_by('-timestamp')[:50]
    
    stats = {
        'total': verifications.count(),
        'success': verifications.filter(success=True).count(),
        'success_rate': verifications.filter(success=True).count() / verifications.count() * 100 if verifications.exists() else 0,
        'barcode_match': verifications.filter(barcode_match=True).count(),
    }

    context = {
        'target_user': user,
        'verifications': verifications,
        'stats': stats,
        'can_view_details': can_view_details,
    }
    return render(request, 'dashboards/user_activity.html', context)
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required

@login_required
@require_POST
def update_user(request, user_id):
    try:
        user = user.objects.get(id=user_id)
        data = json.loads(request.body)
        
        # Mettre à jour les champs
        if 'username' in data:
            user.username = data['username']
        if 'email' in data:
            user.email = data['email']
        if 'role' in data:
            role = role.objects.get(id=data['role'])
            user.role = role
        
        user.save()
        
        return JsonResponse({
            'username': user.username,
            'email': user.email,
            'role': user.role.id
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@require_POST
def toggle_user_status(request, user_id):
    """Active ou désactive un utilisateur"""
    try:
        user = get_object_or_404(Ouvrier, id=user_id)
        
        # Empêcher de désactiver le dernier admin actif
        if user.role == 'admin' and user.is_active and Ouvrier.objects.filter(role='admin', is_active=True).count() <= 1:
            return JsonResponse({
                'success': False,
                'message': 'Impossible de désactiver le dernier administrateur actif'
            }, status=400)
        
        # Basculer le statut
        user.is_active = not user.is_active
        user.save()
        
        # Journalisation
        ActivityLog.objects.create(
            user=request.user,
            action="CHANGEMENT_STATUT_UTILISATEUR",
            target_user=user,
            details={
                'new_status': 'Actif' if user.is_active else 'Inactif',
                'changed_by': request.user.username
            }
        )
        
        return JsonResponse({
            'success': True,
            'message': f'Statut utilisateur mis à jour: {"Actif" if user.is_active else "Inactif"}',
            'is_active': user.is_active
        })
        
    except Exception as e:
        logger.error(f"Erreur changement statut utilisateur: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)


def custom_logout(request):
    logout(request)
    return redirect('login')  # Redirige vers la page de connexion
from django.contrib import messages
from django.shortcuts import render, redirect
from .forms import CustomUserCreationForm

from django.template.loader import render_to_string
from django.http import JsonResponse





from django.shortcuts import render
from django.http import JsonResponse
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta
import json

from django.shortcuts import render
from django.http import JsonResponse
from django.utils import timezone
from django.db.models import Count
import json
from datetime import timedelta
from .models import VerificationLog, Ouvrier, PareBrise

def dashboard(request):
    period = request.GET.get('period', '30days')  # '7days' ou '30days'
    days = 7 if period == '7days' else 30

    # Préparation des données pour le graphique
    dates = []
    data = []
    now = timezone.now()

    for i in range(days - 1, -1, -1):
        day = now - timedelta(days=i)
        count = VerificationLog.objects.filter(timestamp__date=day.date()).count()
        dates.append(day.strftime('%d/%m'))
        data.append(count)

    # Réponse AJAX
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({
            'status': 'success',
            'dates': dates,
            'data': data,
            'logoErrors': VerificationLog.objects.filter(success=False, match_percentage__lt=85).count(),
            'barcodeErrors': VerificationLog.objects.filter(success=False, barcode_match=False).count(),
            'otherErrors': VerificationLog.objects.filter(success=False).exclude(match_percentage__lt=85).exclude(barcode_match=False).count()
        })

    # Contexte pour le rendu initial
    context = {
        'active_page': 'dashboard',
        'users_count': Ouvrier.objects.count(),
        'active_users_count': Ouvrier.objects.filter(is_active=True).count(),
        'active_users_percent': round(
            (Ouvrier.objects.filter(is_active=True).count() / Ouvrier.objects.count() * 100) 
            if Ouvrier.objects.count() > 0 else 0, 1),
        'total_verifications': VerificationLog.objects.count(),
        'success_count': VerificationLog.objects.filter(success=True).count(),
        'success_rate': round(
            (VerificationLog.objects.filter(success=True).count() / VerificationLog.objects.count() * 100) 
            if VerificationLog.objects.count() > 0 else 0, 1),
        'parebrises_count': PareBrise.objects.count(),
        'verified_models': PareBrise.objects.annotate(verif_count=Count('verificationlog')).filter(verif_count__gt=0).count(),
        'verified_models_percent': round(
            (PareBrise.objects.annotate(verif_count=Count('verificationlog')).filter(verif_count__gt=0).count() / 
            PareBrise.objects.count() * 100) if PareBrise.objects.count() > 0 else 0, 1),
        'verification_dates': json.dumps(dates, ensure_ascii=False),
        'verification_data': json.dumps(data),
        'logo_errors': VerificationLog.objects.filter(success=False, match_percentage__lt=85).count(),
        'barcode_errors': VerificationLog.objects.filter(success=False, barcode_match=False).count(),
        'other_errors': VerificationLog.objects.filter(success=False).exclude(match_percentage__lt=85).exclude(barcode_match=False).count(),
        'recent_verifications': VerificationLog.objects.select_related('user', 'parebrise').order_by('-timestamp')[:6],
        'period': period,
    }
    return render(request, 'gestion/dashboard.html', context)
from django.core.paginator import Paginator
from django.db.models import Q

@login_required
def verification_history(request):
    # Récupérer les paramètres de filtrage
    search_query = request.GET.get('search', '')
    status_filter = request.GET.get('status', 'all')
    date_from = request.GET.get('date_from', '')
    date_to = request.GET.get('date_to', '')
    
    # Base queryset
    if request.user.is_superuser or request.user.role == 'admin':
        verifications = VerificationLog.objects.all().order_by('-timestamp')
    else:
        verifications = VerificationLog.objects.filter(user=request.user).order_by('-timestamp')
    
    # Appliquer les filtres
    if search_query:
        verifications = verifications.filter(
            Q(parebrise__code_sap__icontains=search_query) |
            Q(parebrise__marque__icontains=search_query) |
            Q(parebrise__modele__icontains=search_query) |
            Q(user__username__icontains=search_query)
        )
    
    if status_filter != 'all':
        if status_filter == 'success':
            verifications = verifications.filter(success=True)
        elif status_filter == 'failed':
            verifications = verifications.filter(success=False)
    
    if date_from:
        verifications = verifications.filter(timestamp__gte=date_from)
    if date_to:
        verifications = verifications.filter(timestamp__lte=date_to)
    
    # Pagination
    paginator = Paginator(verifications, 25)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'active_page': 'historique',
        'page_obj': page_obj,
        'search_query': search_query,
        'status_filter': status_filter,
        'date_from': date_from,
        'date_to': date_to,
        'total_count': verifications.count(),
        'success_count': verifications.filter(success=True).count(),
        'failed_count': verifications.filter(success=False).count(),
    }
    
    return render(request, 'gestion/history.html', context)

@login_required


@login_required
def analytics_dashboard(request):
    # Filtres de période
    period = request.GET.get('period', '30days')
    
    if period == '7days':
        date_threshold = timezone.now() - timedelta(days=7)
    elif period == '24hours':
        date_threshold = timezone.now() - timedelta(hours=24)
    else:  # 30 jours par défaut
        date_threshold = timezone.now() - timedelta(days=30)
    
    # Statistiques globales
    verifications = VerificationLog.objects.filter(timestamp__gte=date_threshold)
    total_verifications = verifications.count()
    
    if total_verifications == 0:
        return render(request, 'gestion/analytics.html', {
            'error': 'Aucune donnée disponible pour la période sélectionnée',
            'period': period
        })
    
    success_rate = round(verifications.filter(success=True).count() / total_verifications * 100, 1)
    barcode_success_rate = round(verifications.filter(barcode_match=True).count() / total_verifications * 100, 1)
    
    # Répartition des échecs
    failure_reasons = {
        'logo': verifications.filter(success=False, match_percentage__lt=85).count(),
        'barcode': verifications.filter(success=False, barcode_match=False).count(),
        'both': verifications.filter(success=False, match_percentage__lt=85, barcode_match=False).count(),
        'other': verifications.filter(success=False).exclude(match_percentage__lt=85).exclude(barcode_match=False).count()
    }
    
    # Performance par modèle de pare-brise
    top_models = PareBrise.objects.annotate(
        verification_count=Count('verificationlog'),
        success_count=Sum(Case(When(verificationlog__success=True, then=1), default=0)),
        success_rate=Sum(Case(When(verificationlog__success=True, then=1), default=0)) * 100 / Count('verificationlog')
    ).filter(verification_count__gt=0).order_by('-verification_count')[:10]
    
    # Performance par utilisateur (corrigé avec 'verifications')
    top_users = Ouvrier.objects.annotate(
        verification_count=Count('verifications'),
        success_count=Sum(Case(When(verifications__success=True, then=1), default=0)),
        success_rate=Sum(Case(When(verifications__success=True, then=1), default=0)) * 100 / Count('verifications')
    ).filter(verification_count__gt=0).order_by('-verification_count')[:10]
    
    # Données pour les graphiques temporels
    daily_data = verifications.annotate(
        day=TruncDay('timestamp')
    ).values('day').annotate(
        total=Count('id'),
        success=Sum(Case(When(success=True, then=1), default=0))
    ).order_by('day')
    
    # Préparation des données pour Chart.js
    chart_labels = [entry['day'].strftime('%d/%m') for entry in daily_data]
    chart_total = [entry['total'] for entry in daily_data]
    chart_success = [entry['success'] for entry in daily_data]
    
    context = {
        'active_page':"analytics",
        'period': period,
        'total_verifications': total_verifications,
        'success_rate': success_rate,
        'barcode_success_rate': barcode_success_rate,
        'failure_reasons': failure_reasons,
        'top_models': top_models,
        'top_users': top_users,
        'chart_labels': json.dumps(chart_labels),
        'chart_total': json.dumps(chart_total),
        'chart_success': json.dumps(chart_success),
    }
    
    return render(request, 'gestion/analytics.html', context)


from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib.auth import get_user_model

User = get_user_model()



from django.contrib.auth.decorators import login_required, user_passes_test
from django.shortcuts import render, redirect
from .models import Ouvrier
from django.http import JsonResponse

from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.models import Group
from django.shortcuts import render, redirect
from .forms import OuvrierCreationForm

def is_admin(user):
    return user.groups.filter(name='admin').exists() or user.role == 'admin'

from django.http import JsonResponse
from django.contrib.auth.decorators import user_passes_test
from django.shortcuts import render
from .forms import OuvrierCreationForm
from django.contrib.auth.models import Group


from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.contrib import messages

def init_notification_cache(user):
    """Initialise ou réinitialise le cache des notifications pour un utilisateur"""
    # Récupérer uniquement les notifications non lues
    unread_ids = set(ActivityLog.objects.filter(
        (Q(user=user) | Q(target_user=user)),
        read=False
    ).values_list('id', flat=True))
    
    cache_key = f'unread_notifications_{user.id}'
    cache.set(cache_key, unread_ids, timeout=3600)  # 1h de timeout
    return unread_ids
from django.shortcuts import render, redirect
from django.contrib import messages
from .forms import ProfileUpdateForm

from django.contrib.auth.decorators import login_required

@login_required
def profile_view(request):
    if request.method == 'POST':
        form = ProfileUpdateForm(request.POST, request.FILES, instance=request.user)
        if form.is_valid():
            form.save()
            return redirect('profile_view')
    else:
        form = ProfileUpdateForm(instance=request.user)

    context = {
        'form': form,
        'active_page': 'profile'  # Ajout du contexte ici
    }

    return render(request, 'gestion/profile.html', context)


import uuid

from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib import messages
from django.contrib.auth import get_user_model
from .models import ActivityLog

Ouvrier = get_user_model()

from django.http import JsonResponse
from django.contrib.auth.models import Group
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import IntegrityError
from .models import ActivityLog
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

def create_user(request):
    if request.method != 'POST':
        return JsonResponse({
            'success': False,
            'error': "Méthode non autorisée. Utilisez POST."
        }, status=405)

    try:
        # 1. Récupération des données
        required_fields = [
            'employee_id', 'first_name', 'last_name', 'email',
            'department', 'job_title', 'role', 'password1', 'password2'
        ]
        
        data = {field: request.POST.get(field, '').strip() for field in required_fields}

        # 2. Validation des champs
        if not all(data.values()):
            return JsonResponse({
                'success': False,
                'error': "Tous les champs obligatoires doivent être remplis."
            }, status=400)

        # 3. Création de l'utilisateur
        try:
            user = User.objects.create(
                employee_id=data['employee_id'],
                first_name=data['first_name'],
                last_name=data['last_name'],
                email=data['email'],
                department=data['department'],
                job_title=data['job_title'],
                role=data['role'],
                is_active=True,
                username=data['employee_id']
            )
            user.set_password(data['password1'])
            user.save()


            # 4. Attribution des groupes
            if data['role'] == 'admin':
                admin_group = Group.objects.get(name='admin')
                user.groups.add(admin_group)
            elif data['role'] == 'ouvrier':
                ouvrier_group = Group.objects.get(name='ouvrier')
                user.groups.add(ouvrier_group)

        except IntegrityError as e:
            error_msg = "Cet employé existe déjà" if 'employee_id' in str(e) else "Cet email existe déjà"
            return JsonResponse({
                'success': False,
                'error': error_msg
            }, status=400)
        except Group.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': "Groupe non configuré dans le système"
            }, status=500)

        # 5. Création de la notification
        ActivityLog.objects.create(
            user=request.user,
            action='USER_CREATE',
            target_user=user,
            details={
                'action': 'Création utilisateur',
                'created_by': {
                    'name': request.user.get_full_name(),
                    'role': request.user.get_role_display()
                },
                'new_user': {
                    'name': user.get_full_name(),
                    'email': user.email,
                    'role': user.get_role_display(),
                    'department': user.department
                }
            }
        )
        init_notification_cache(request.user)

        return JsonResponse({
            'success': True,
            'message': f"Utilisateur créé avec succès (Rôle: {user.get_role_display()})",
            'user_id': user.id,
            'is_active': True,
            'notification': {
                'message': f"Nouvel utilisateur créé: {user.get_full_name()}",
                'type': 'success'
            }
        })
       

    except Exception as e:
        logger.error(f"Erreur création utilisateur: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': "Erreur serveur lors de la création"
        }, status=500)
@login_required
@user_passes_test(lambda u: u.role == 'admin')
@login_required
@login_required
@user_passes_test(lambda u: u.role == 'admin')
@require_POST
def delete_user(request, user_id):
    """
    Vue pour supprimer un utilisateur
    - Accessible seulement aux admins via POST
    - Retourne une réponse JSON
    """
    try:
        # Vérifier que l'utilisateur n'essaie pas de se supprimer lui-même
        if request.user.id == int(user_id):
            return JsonResponse({
                'success': False,
                'error': 'Vous ne pouvez pas supprimer votre propre compte'
            }, status=400)

        # Récupérer l'utilisateur à supprimer
        user_to_delete = Ouvrier.objects.get(id=user_id)

        # Vérifier qu'on ne supprime pas le dernier admin
        if user_to_delete.role == 'admin' and \
           Ouvrier.objects.filter(role='admin').count() <= 1:
            return JsonResponse({
                'success': False,
                'error': 'Impossible de supprimer le dernier administrateur'
            }, status=400)

        # Créer une notification détaillée avant suppression
        ActivityLog.objects.create(
            user=request.user,
            action='USER_DELETE',
            details={
                'action': 'Suppression utilisateur',
                'deleted_by': {
                    'name': request.user.get_full_name(),
                    'gsid': request.user.employee_id,
                    'role': request.user.get_role_display(),
                    'department': request.user.department
                },
                'deleted_user': {
                    'id': user_to_delete.id,
                    'name': user_to_delete.get_full_name(),
                    'gsid': user_to_delete.employee_id,
                    'role': user_to_delete.get_role_display(),
                    'department': user_to_delete.department,
                    'email': user_to_delete.email,
                    'job_title': user_to_delete.job_title
                },
                'timestamp': timezone.now().isoformat()
            }
        )

        # Effectuer la suppression
        deleted_data = {
            'id': user_to_delete.id,
            'name': user_to_delete.get_full_name(),
            'gsid': user_to_delete.employee_id
        }
        user_to_delete.delete()

        # Mettre à jour le cache des notifications
        init_notification_cache(request.user)

        return JsonResponse({
            'success': True,
            'message': f'Utilisateur {deleted_data["name"]} supprimé avec succès',
            'deleted_user': deleted_data
        })

    except Ouvrier.DoesNotExist:
        logger.error(f"Tentative de suppression d'un utilisateur inexistant: {user_id}")
        return JsonResponse({
            'success': False,
            'error': 'Utilisateur non trouvé'
        }, status=404)

    except ValueError:
        logger.error("ID utilisateur invalide reçu")
        return JsonResponse({
            'success': False,
            'error': 'ID utilisateur invalide'
        }, status=400)

    except Exception as e:
        logger.error(f"Erreur lors de la suppression d'utilisateur: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': f'Erreur serveur: {str(e)}'
        }, status=500)
@login_required
def get_notification_count(request):
    """Retourne le nombre de notifications non lues"""
    try:
        user = request.user
        unread_ids = cache.get(f'unread_notifications_{user.id}')
        
        # Si le cache n'existe pas, l'initialiser
        if unread_ids is None:
            unread_ids = init_notification_cache(user)
            
        return JsonResponse({
            'success': True,
            'count': len(unread_ids)
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@require_POST
@require_POST
@login_required
def mark_notification_read(request, notification_id):
    """Marque une notification spécifique comme lue"""
    try:
        user = request.user
        notification = get_object_or_404(ActivityLog, id=notification_id)
        
        # Vérifier que l'utilisateur a le droit de marquer cette notification
        if notification.user != user and notification.target_user != user:
            return JsonResponse({
                'success': False,
                'error': "Non autorisé"
            }, status=403)
        
        # Mettre à jour en base si ce n'est pas déjà fait
        if not notification.read:
            notification.read = True
            notification.save()
        
        # Mettre à jour le cache
        cache_key = f'unread_notifications_{user.id}'
        unread_ids = cache.get(cache_key, set())
        
        # Convertir en string pour la comparaison
        notification_id_str = str(notification_id)
        if notification_id_str in unread_ids:
            unread_ids.remove(notification_id_str)
            cache.set(cache_key, unread_ids, timeout=None)
        
        return JsonResponse({
            'success': True,
            'unread_count': len(unread_ids)
        })
    except Exception as e:
        logger.error(f"Erreur marquage notification: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': "Erreur serveur"
        }, status=500)
@require_POST
@login_required
def mark_all_notifications_read(request):
    """Marque toutes les notifications comme lues"""
    try:
        user = request.user
        cache_key = f'unread_notifications_{user.id}'
        
        # 1. Récupérer les IDs des notifications non lues avant modification
        unread_ids = cache.get(cache_key, set())
        
        # 2. Marquer toutes comme lues en base
        updated = ActivityLog.objects.filter(
            (Q(user=user) | Q(target_user=user)),
            read=False
        ).update(read=True)
        
        # 3. Vider complètement le cache pour cet utilisateur
        cache.delete(cache_key)
        
        # 4. Initialiser un nouveau cache vide
        init_notification_cache(user)
        
        return JsonResponse({
            'success': True,
            'unread_count': 0,
            'marked_read': updated
        })
    except Exception as e:
        logger.error(f"Erreur marquage toutes notifications: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': "Erreur serveur"
        }, status=500)
    
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse, HttpResponseBadRequest
import json

from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse, HttpResponseBadRequest
from .models import CSPReport
import json

@csrf_exempt
def csp_report(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body.decode('utf-8'))["csp-report"]
            CSPReport.objects.create(
                document_uri = data.get("document-uri", ""),
                violated_directive = data.get("violated-directive", ""),
                blocked_uri = data.get("blocked-uri", ""),
                original_policy = data.get("original-policy", ""),
                source_file = data.get("source-file", ""),
                script_sample = data.get("script-sample", "")
            )
            return JsonResponse({'status': 'ok'})
        except Exception as e:
            return HttpResponseBadRequest(f"Erreur : {str(e)}")
    return HttpResponseBadRequest("Only POST allowed")
from django.shortcuts import render
from .models import CSPReport

def csp_report_list(request):
    reports = CSPReport.objects.order_by('-timestamp')[:100]
    return render(request, 'gestion/csp_report_list.html', {'reports': reports})


from django.shortcuts import render, get_object_or_404, redirect
from .models import PareBrise
from .forms import PareBriseForm

def manage_parebrise(request):
    parebrises = PareBrise.objects.all()

    if request.method == 'POST':
        parebrise_id = request.POST.get('parebrise_id')
        delete_id = request.POST.get('delete_id')

        # Suppression
        if delete_id:
            obj = get_object_or_404(PareBrise, pk=delete_id)
            obj.delete()
            return redirect('manage_parebrise')

        # Ajout ou Modification
        if parebrise_id:
            # Modification
            obj = get_object_or_404(PareBrise, pk=parebrise_id)
            form = PareBriseForm(request.POST, request.FILES, instance=obj)
        else:
            # Ajout
            form = PareBriseForm(request.POST, request.FILES)

        if form.is_valid():
            form.save()
            return redirect('manage_parebrise')

    else:
        form = PareBriseForm()

    return render(request, 'gestion/manage_parebrise.html', {
        'parebrises': parebrises,
        'form': form,
        'active_page': 'parebrise', 
    })
