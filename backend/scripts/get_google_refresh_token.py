"""
Script interactivo moderno para generar el Refresh Token de OAuth 2.0 de Google Calendar.
Utiliza un servidor HTTP local temporal (Loopback) en http://localhost:8080 conforme a las
políticas actuales de seguridad de Google Identity (eliminando el flujo obsoleto oob).
"""

import sys
import webbrowser
from urllib.parse import urlencode, parse_qs, urlparse
from http.server import HTTPServer, BaseHTTPRequestHandler
import httpx

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
PORT = 8080
REDIRECT_URI = f"http://localhost:{PORT}"
SCOPES = "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.freebusy"

auth_code = None

class OAuthCallbackHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        global auth_code
        parsed_url = urlparse(self.path)
        params = parse_qs(parsed_url.query)

        if "code" in params:
            auth_code = params["code"][0]
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            success_html = """
            <html>
            <body style="font-family: sans-serif; text-align: center; padding: 50px; background: #160B1A; color: #F8F4E9;">
                <h1 style="color: #10B981;">✓ ¡Autorización completada con éxito!</h1>
                <p>Puedes cerrar esta pestaña y volver a la terminal de PowerShell.</p>
            </body>
            </html>
            """
            self.wfile.write(success_html.encode("utf-8"))
        else:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b"Error: No se recibio codigo de autorizacion.")

    def log_message(self, format, *args):
        # Silenciar logs HTTP en consola
        return

def main():
    global auth_code
    print("=" * 65)
    print("  ASISTENTE DE CONFIGURACIÓN // GOOGLE CALENDAR REFRESH TOKEN")
    print("=" * 65)

    client_id = input("\n1. Pega tu GOOGLE_CLIENT_ID: ").strip()
    client_secret = input("2. Pega tu GOOGLE_CLIENT_SECRET: ").strip()

    if not client_id or not client_secret:
        print("\n[!] Error: Se requiere Client ID y Client Secret.")
        sys.exit(1)

    params = {
        "client_id": client_id,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": SCOPES,
        "access_type": "offline",
        "prompt": "consent"
    }

    auth_url = f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
    print(f"\nIniciando servidor local en {REDIRECT_URI}...")
    print("Abriendo el navegador para autorizar...")
    print(f"Si no abre automáticamente, visita esta URL:\n{auth_url}\n")

    try:
        webbrowser.open(auth_url)
    except Exception:
        pass

    server = HTTPServer(("localhost", PORT), OAuthCallbackHandler)
    while auth_code is None:
        server.handle_request()
    server.server_close()

    print("\n✓ Código de autorización recibido automáticamente.")
    print("Canjeando código por Refresh Token permanente...")

    payload = {
        "client_id": client_id,
        "client_secret": client_secret,
        "code": auth_code,
        "grant_type": "authorization_code",
        "redirect_uri": REDIRECT_URI
    }

    with httpx.Client() as client:
        resp = client.post(GOOGLE_TOKEN_URL, data=payload)
        if resp.status_code == 200:
            data = resp.json()
            refresh_token = data.get("refresh_token")
            print("\n" + "=" * 65)
            print("  ¡ÉXITO TOTAL! AGREGA ESTAS LÍNEAS A TU backend/.env:")
            print("=" * 65)
            print(f"GOOGLE_CLIENT_ID={client_id}")
            print(f"GOOGLE_CLIENT_SECRET={client_secret}")
            print(f"GOOGLE_REFRESH_TOKEN={refresh_token}")
            print(f"GOOGLE_CALENDAR_ID=primary")
            print("=" * 65)
            print("\nY agrégalas también a las Environment Variables de tu proyecto en Vercel.")
        else:
            print(f"\n[!] Error al canjear el token ({resp.status_code}):\n{resp.text}")

if __name__ == "__main__":
    main()
