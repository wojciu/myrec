# Szybki start - Deploy na własny serwer

## Na serwerze

### 1. Zainstaluj PM2 (raz)

```bash
npm install -g pm2
pm2 startup
# wklej wygenerowaną komendę
```

### 2. Sklonuj i zdeployuj

```bash
git clone <repo-url> myrec
cd myrec

# Uruchom setup
./setup-production.sh

# Zdeployuj
./deploy.sh
```

## Lokalnie (przed wypchnięciem na serwer)

### Test build

```bash
npm run build
npm start
# Testuj pod http://localhost:3000
```

### Przygotuj .env.production

```bash
cp .env.example .env.production
# Edytuj .env.production i ustaw:
# - JWT_SECRET (wygeneruj przez openssl rand -base64 32)
# - JWT_REFRESH_SECRET (tak samo)
# - NEXT_PUBLIC_APP_URL="https://twoja-domena.com"
```

## Na serwerze - aktualizacje

```bash
cd myrec
git pull
npm install
npm run build
npx prisma migrate deploy
pm2 reload ecosystem.config.js --update-env
```

## Komendy PM2

```bash
npm run pm2:start     # Uruchom
npm run pm2:stop      # Zatrzymaj
npm run pm2:restart   # Restart
npm run pm2:logs      # Logi
npm run pm2:monit     # Monitor
```

## Struktura po deploy

```
myrec/
├── .next/           # Zbudowana aplikacja
├── node_modules/    # Zależności
├── prisma/
│   └── prod.db      # Produkcyjna baza SQLite
├── uploads/         # Uploadowane pliki
├── logs/            # Logi PM2
└── ecosystem.config.js
```

## Backup

```bash
# Backup bazy
cp prisma/prod.db backups/prod-$(date +%Y%m%d).db

# Backup uploads
tar -czf backups/uploads-$(date +%Y%m%d).tar.gz uploads/
```
