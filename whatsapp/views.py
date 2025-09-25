from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from twilio.rest import Client
import json
import os
from dotenv import load_dotenv

load_dotenv()  # Charge les variables du fichier .env

@csrf_exempt
def send_whatsapp(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            to = data['to']
            body = data['body']

            # Twilio credentials depuis .env
            account_sid = os.getenv("TWILIO_ACCOUNT_SID")
            auth_token = os.getenv("TWILIO_AUTH_TOKEN")
            from_number = os.getenv("TWILIO_WHATSAPP_NUMBER")
            client = Client(account_sid, auth_token)

            message = client.messages.create(
                from_=from_number,
                to=f'whatsapp:{to}',
                body=body
            )

            return JsonResponse({'sid': message.sid})

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    return JsonResponse({'error': 'Cette URL accepte uniquement POST'}, status=405)
