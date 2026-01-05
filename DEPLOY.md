# Deployment Guide - MyRec (Hotel Shift Journal)

## Wymagania serwera

- Node.js 18+
- PM2 (globalnie)
- Git

## 1. Przygotowanie serwera

### Zainstaluj Node.js (jeśli nie masz)

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
```

### Zainstaluj PM2 globalnie

```bash
npm install -g pm2
```

## 2. Konfiguracja aplikacji

### Sklonuj repozytorium

```bash
git clone <twoje-repo> myrec
cd myrec
```

### Zainstaluj zależności

```bash
npm install
```

### Utwórz plik produkcyjnych zmiennych środowiskowych

```bash
cp .env.example .env.production
nano .env.production
```

**WAŻNE:** W `.env.production` ustaw:

1. **Wygeneruj silne sekrety JWT:**
   ```bash
   openssl rand -base64 32
   ```
   Użyj wygenerowanych wartości dla `JWT_SECRET` i `JWT_REFRESH_SECRET`

2. **Ustaw URL aplikacji:**
   ```
   NEXT_PUBLIC_APP_URL="https://twoja-domena.com"
   ```

3. **Ścieżka do bazy danych:**
   ```
   DATABASE_URL="file:./prisma/prod.db"
   ```

## 3. Deploy

### Uruchom skrypt deploy

```bash
./deploy.sh
```

Lub ręcznie:

```bash
# 1. Zbuduj aplikację
npm run build

# 2. Utwórz katalogi
mkdir -p logs uploads

# 3. Migracje bazy danych
npx prisma migrate deploy

# 4. Uruchom z PM2
pm2 start ecosystem.config.js
pm2 save
```

## 4. Konfiguracja Nginx (opcjonalnie, ale zalecane)

Stwórz konfigurację Nginx:

```nginx
server {
    listen 80;
    server_name twoja-domena.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name twoja-domena.com;

    # SSL certificates (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/twoja-domena.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/twoja-domena.com/privkey.pem;

    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads directory - increased limits
    client_max_body_size 10M;

    location /uploads/ {
        proxy_pass http://localhost:3000/uploads/;
    }
}
```

## 5. Automatyczny start po restarcie serwera

```bash
pm2 startup
# Skopiuj i wklej wygenerowaną komendę
pm2 save
```

## 6. Zarządzanie aplikacją

### Status procesów

```bash
pm2 status
```

### Logi

```bash
pm2 logs myrec-web
pm2 logs myrec-cron
```

### Restart

```bash
pm2 reload myrec-web
pm2 reload myrec-cron
```

### Stop

```bash
pm2 stop myrec-web myrec-cron
```

## 7. Backup bazy danych

Dodaj do crona (`crontab -e`):

```bash
# Codzienny backup o 2:00 rano
0 2 * * * cp /path/to/myrec/prisma/prod.db /backups/prod-$(date +\%Y\%m\%d).db
```

## 8. Aktualizacje

```bash
git pull
npm install
npm run build
npx prisma migrate deploy
pm2 reload ecosystem.config.js --update-env
```

## Troubleshooting

### Aplikacja nie startuje

```bash
# Sprawdź logi
pm2 logs --lines 100

# Sprawdź czy port 3000 jest wolny
lsof -i :3000
```

### Problemy z bazą danych

```bash
# Reset bazy (OSTRZEŻENIE: usuwa dane!)
rm prisma/prod.db
npx prisma migrate deploy
npx prisma db seed
```

### Brak uprawnień do zapisu plików

```bash
sudo chown -R user:group /path/to/myrec/uploads
sudo chmod -R 755 /path/to/myrec/uploads
```

## Monitorowanie

PM2 Plus (opcjonalnie):
```bash
pm2 link <secret-key> <public-key>
```

Lub lokalnie:
```bash
pm2 monit
```
