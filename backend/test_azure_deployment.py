"""
Azure OpenAI Deployment Test Script
Bu script turli deployment nomlarini sinab ko'radi
"""

from openai import AzureOpenAI
import os

# Azure OpenAI credentials - environment variables dan olinadi
ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT", "")
API_KEY = os.getenv("AZURE_OPENAI_API_KEY", "")
API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview")

# Common deployment names to try
DEPLOYMENT_NAMES = [
    "gpt-4o",
    "gpt-4",
    "gpt-4-vision",
    "gpt-4-turbo",
    "gpt-35-turbo",
    "gpt-4o-mini",
    "gpt-4-vision-preview",
]

print("🔍 Azure OpenAI deployment nomlarini tekshiryapman...\n")

for deployment_name in DEPLOYMENT_NAMES:
    try:
        print(f"Sinab ko'rilmoqda: {deployment_name}...", end=" ")
        
        client = AzureOpenAI(
            api_key=API_KEY,
            api_version=API_VERSION,
            azure_endpoint=ENDPOINT
        )
        
        response = client.chat.completions.create(
            model=deployment_name,
            messages=[{"role": "user", "content": "Test"}],
            max_tokens=10
        )
        
        print(f"✅ ISHLAYAPTI!")
        print(f"   Model: {deployment_name}")
        print(f"   Javob: {response.choices[0].message.content}\n")
        
        # If successful, save to config
        print(f"✅ To'g'ri deployment nomi: {deployment_name}")
        print(f"\nConfig.py faylida AZURE_OPENAI_DEPLOYMENT_NAME ni '{deployment_name}' ga o'zgartiring")
        break
        
    except Exception as e:
        error_msg = str(e)
        if "DeploymentNotFound" in error_msg:
            print("❌ Topilmadi")
        elif "InvalidRequestError" in error_msg:
            print("⚠️  Mavjud, lekin vision qo'llab-quvvatlamaydi")
        else:
            print(f"❌ Xatolik: {error_msg[:50]}...")
else:
    print("\n❌ Hech qanday deployment topilmadi!")
    print("\nAzure portalda deployment yaratishingiz kerak:")
    print("1. https://portal.azure.com ga kiring")
    print("2. Azure OpenAI resursini oching")
    print("3. 'Model deployments' bo'limiga o'ting")
    print("4. Yangi deployment yarating (gpt-4o yoki gpt-4-vision)")
