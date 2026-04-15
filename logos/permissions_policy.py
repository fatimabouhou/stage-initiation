# logos/permissions_policy.py

class PermissionsPolicyMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        # Autorise la caméra uniquement sur ton site
        response.headers['Permissions-Policy'] = 'camera=(self)'
        return response
