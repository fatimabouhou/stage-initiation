# Logos

Application web Django dediee a la verification de logos et a la gestion des utilisateurs, des rapports de verification et de la supervision applicative.

## Apercu

Le projet combine plusieurs fonctions metier autour de la validation d images de reference, du suivi des actions utilisateurs et de la gestion d un espace d administration.

### Fonctions principales

- verification de logos / pare-brise a partir d images importees ou capturees
- gestion des comptes utilisateurs avec roles et statuts
- tableau de bord avec statistiques et activite recente
- historique des verifications et journalisation des actions
- gestion des notifications
- prise en charge des rapports CSP
- pages de connexion, inscription, profil et administration

## Stack technique

- Django 5.2.3
- django-crispy-forms
- django-csp
- Pillow
- OpenCV
- pytesseract
- pyzbar
- scikit-image
- scipy
- SQLite en base de donnees locale

## Arborescence utile

- `logos/` contient la configuration Django du projet
- `parbrise/` contient l application principale, les modeles, vues, formulaires, templates et assets
- `media/` contient les fichiers televerses ou generes a l execution
- `static/` contient les assets statiques locaux

## Prerequis

- Python 3.12 ou plus recent
- `pip`
- un environnement virtuel Python

## Installation locale

```bash
python -m venv env
env\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
```

## Lancer le projet

```bash
python manage.py runserver
```

Ensuite, ouvre l application a l adresse suivante:

```text
http://127.0.0.1:8000/
```

## Configuration

Le projet fonctionne actuellement avec une configuration locale dans `logos/settings.py`.

Pour une version plus propre et plus sure, il est recommande de deplacer les valeurs sensibles vers un fichier `.env` et de charger ces valeurs depuis les settings.

Les variables attendues peuvent ressembler a ceci:

```env
SECRET_KEY=change-me
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost
```

## Utilisation rapide

1. Cree un super utilisateur avec `python manage.py createsuperuser`.
2. Connecte-toi a l interface d administration.
3. Ajoute les donnees de reference et teste le flux de verification.
4. Consulte le tableau de bord, l historique et les notifications.

## Points importants avant publication sur GitHub

- ne pas versionner le dossier de l environnement virtuel `env/`
- ne pas versionner `db.sqlite3` si la base contient des donnees locales sensibles
- ne pas versionner `media/` si elle contient des fichiers utilisateurs
- verifier que les secrets de production ne sont pas commits dans le code

## Contribution

Les contributions sont bienvenues.

Avant de proposer une modification, verifie que le projet se lance correctement, puis teste ton changement localement.

## Licence

Ajoute un fichier `LICENSE` si tu veux publier le projet avec des conditions d utilisation claires.
