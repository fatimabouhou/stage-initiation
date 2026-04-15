import cv2
import numpy as np
from pyzbar.pyzbar import decode
from PIL import Image
import pytesseract

def extraire_code_barres(image):
    """
    Version améliorée avec prétraitement d'image et plusieurs méthodes de détection
    """
    # Convertir l'image PIL en format OpenCV
    img_cv = np.array(image)
    
    # Essayer plusieurs méthodes de traitement
    methods = [
        methode_standard,
        methode_contraste_eleve,
        methode_seuillage_adaptatif,
        methode_dilatation,
        methode_erosion,
        methode_pytesseract
    ]
    
    codes_trouves = set()
    
    for method in methods:
        try:
            codes = method(img_cv.copy())
            if codes:
                for code in codes:
                    if code.strip():  # Ne pas ajouter de codes vides
                        codes_trouves.add(code)
        except Exception as e:
            print(f"Erreur dans {method.__name__}: {str(e)}")
            continue
    
    return list(codes_trouves) if codes_trouves else None

# Différentes méthodes de traitement

def methode_standard(img):
    """Méthode de base avec pyzbar"""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    codes = decode(gray)
    return [code.data.decode('utf-8') for code in codes]

def methode_contraste_eleve(img):
    """Amélioration du contraste avant détection"""
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
    cl = clahe.apply(l)
    limg = cv2.merge((cl,a,b))
    final = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
    gray = cv2.cvtColor(final, cv2.COLOR_BGR2GRAY)
    codes = decode(gray)
    return [code.data.decode('utf-8') for code in codes]

def methode_seuillage_adaptatif(img):
    """Seuillage adaptatif"""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                 cv2.THRESH_BINARY, 11, 2)
    codes = decode(thresh)
    return [code.data.decode('utf-8') for code in codes]

def methode_dilatation(img):
    """Dilatation pour épaissir les barres"""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)
    kernel = np.ones((3,3), np.uint8)
    dilated = cv2.dilate(thresh, kernel, iterations=1)
    codes = decode(dilated)
    return [code.data.decode('utf-8') for code in codes]

def methode_erosion(img):
    """Erosion pour affiner les barres"""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)
    kernel = np.ones((3,3), np.uint8)
    eroded = cv2.erode(thresh, kernel, iterations=1)
    codes = decode(eroded)
    return [code.data.decode('utf-8') for code in codes]

def methode_pytesseract(img):
    """Méthode de secours avec OCR"""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    custom_config = r'--oem 3 --psm 11 outputbase digits'
    text = pytesseract.image_to_string(gray, config=custom_config)
    # Filtrer pour ne garder que les séquences qui pourraient être des codes
    possible_codes = [s for s in text.split() if s.isdigit() and len(s) >= 6]
    return possible_codes