from django.shortcuts import render
from rest_framework_simplejwt.views import TokenObtainPairView

from accounts.serializers import LifelineTokenObtainPairSerializer

# Create your views here.

def home(request):
    return render(request, "accounts/home.html")


class LifelineTokenObtainPairView(TokenObtainPairView):
    serializer_class = LifelineTokenObtainPairSerializer
