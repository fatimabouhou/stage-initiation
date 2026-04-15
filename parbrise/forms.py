from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import Ouvrier

class OuvrierCreationForm(UserCreationForm):
    class Meta:
        model = Ouvrier
        fields = ['employee_id', 'first_name', 'last_name', 'department', 'job_title', 'password1', 'password2']

    def save(self, commit=True):
        user = super().save(commit=False)
        user.username = user.employee_id
        user.role = 'ouvrier'  # ou 'admin' / 'superviseur' selon la logique
        if commit:
            user.save()
        return user
from django import forms
from .models import Ouvrier

class OuvrierUpdateForm(forms.ModelForm):
    class Meta:
        model = Ouvrier
        fields = [
            'username',
            'email',
            'first_name',
            'last_name',
            'role',
            'department',
            'job_title',
            
        ]
        widgets = {
            'role': forms.Select(attrs={'class': 'form-control'}),
            'department': forms.TextInput(attrs={'class': 'form-control'}),
            'job_title': forms.TextInput(attrs={'class': 'form-control'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields:
            self.fields[field].widget.attrs.update({'class': 'form-control'})
from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import get_user_model

User = get_user_model()

class CustomUserCreationForm(UserCreationForm):
    email = forms.EmailField(required=True)
    first_name = forms.CharField(max_length=30, required=True)
    last_name = forms.CharField(max_length=30, required=True)
    department = forms.CharField(max_length=100, required=True)
    employee_id = forms.CharField(max_length=20, required=True, label="GSID")

    class Meta:
        model = User
        fields = ('employee_id', 'email', 'first_name', 'last_name', 
                 'department', 'role', 'password1', 'password2')            
        
from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import Group
from .models import Ouvrier

class OuvrierCreationForm(UserCreationForm):
    role = forms.ChoiceField(choices=Ouvrier.ROLE_CHOICES)
    groups = forms.ModelMultipleChoiceField(
        queryset=Group.objects.all(),
        required=False,
        widget=forms.CheckboxSelectMultiple
    )

    class Meta:
        model = Ouvrier
        fields = ('employee_id','first_name','last_name','email', 'department', 'job_title', 'role', 'groups', 'password1', 'password2')

from django import forms
from .models import Ouvrier

class ProfileUpdateForm(forms.ModelForm):
    class Meta:
        model = Ouvrier
        fields = ['first_name', 'last_name', 'email', 'profile_picture']
from django import forms
from .models import PareBrise

class PareBriseForm(forms.ModelForm):
    class Meta:
        model = PareBrise
        fields = ['code_sap', 'version', 'logo_reference']
