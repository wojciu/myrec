# Nginx Reverse Proxy - MyRec

## Instalacja Nginx

```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```

## Konfiguracja

Utwórz plik `/etc/nginx/sites-available/myrec`:

```nginx
# HTTP - redirect do HTTPS
server {
    listen 80;
    server_name twoja-domena.com;

    # Let's Encrypt validation
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect wszystkie zapytania do HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS - główna konfiguracja
server {
    listen 443 ssl http2;
    server_name twoja-domena.com;

    # SSL Certificate (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/twoja-domena.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/twoja-domena.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';

    # Max upload size (dla plików)
    client_max_body_size 10M;

    # Proxy do Docker
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Cache bypass
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads directory - przekieruj do aplikacji
    location /uploads/ {
        proxy_pass http://localhost:3000/uploads/;
    }

    # Statyczne pliki (opcjonalnie - cache)
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header X-Cache-Status "HIT";
    }
}
```

## Włącz konfigurację

```bash
# Usuń domyślną konfigurację
sudo rm /etc/nginx/sites-enabled/default

# Włącz swoją konfigurację
sudo ln -s /etc/nginx/sites-available/myrec /etc/nginx/sites-enabled/

# Testuj konfigurację
sudo nginx -t

# Załaduj ponownie Nginx
sudo systemctl reload nginx
```

## SSL z Let's Encrypt

```bash
# Zdobądź certyfikat SSL
sudo certbot --nginx -d twoja-domena.com

# Auto-renewal jest już skonfigurowany przez certbot
```

## Firewall

```bash
# Otwórz porty
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## Sprawdź czy działa

```bash
# Sprawdź status Nginx
sudo systemctl status nginx

# Sprawdź logi
sudo tail -f /var/log/nginx/error.log
```

---

## Pełny proces od zera

```bash
# 1. Zainstaluj Docker i Nginx
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
sudo apt update && sudo apt install nginx certbot python3-certbot-nginx -y

# 2. Sklonuj i uruchom aplikację
git clone <repo> myrec
cd myrec
cp .env.docker .env.docker.local
# Edytuj .env.docker.local z sekretami JWT
./docker-deploy.sh  # wybierz 6

# 3. Skonfiguruj Nginx (powyższa konfiguracja)

# 4. Zdobądź SSL
sudo certbot --nginx -d twoja-domena.com

# Gotowe!
```
