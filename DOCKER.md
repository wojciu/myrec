# Docker Deploy - MyRec (Hotel Shift Journal)

## Dlaczego Docker?

✅ **Brak problemów z "npm install hangs"** - wszystko jest w obrazie
✅ **Działa tak samo na dev i prod**
✅ **Łatwy rollback** - jedna komenda
✅ **Nie potrzeba PM2** - Docker zarządza procesami
✅ **Trwałe dane** - baza i pliki są w volumach

---

## Szybki start

### 1. Zainstaluj Docker na serwerze

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Wyloguj i zaloguj ponownie
```

### 2. Sklonuj repo

```bash
git clone <twoje-repo> myrec
cd myrec
```

### 3. Skonfiguruj środowisko

```bash
# Skopiuj szablon
cp .env.docker .env.docker.local

# Wygeneruj sekrety JWT
openssl rand -base64 32  # użyj jako JWT_SECRET
openssl rand -base64 32  # użyj jako JWT_REFRESH_SECRET

# Edytuj .env.docker.local
nano .env.docker.local
```

**Ustaw w `.env.docker.local`:**
```env
DATABASE_URL=file:./prisma/prod.db
JWT_SECRET=<wygenerowany-sekret-1>
JWT_REFRESH_SECRET=<wygenerowany-sekret-2>
NEXT_PUBLIC_APP_URL=https://twoja-domena.com
```

### 4. Uruchom

```bash
./docker-deploy.sh
# Wybierz opcję 6 (Buduj i uruchom)
```

Lub ręcznie:
```bash
docker-compose up -d --build
```

---

## Komendy Docker

### Podstawowe

```bash
# Uruchom
docker-compose up -d

# Zatrzymaj
docker-compose down

# Pokaż status
docker-compose ps

# Logi
docker-compose logs -f app
docker-compose logs -f cron

# Restart
docker-compose restart
```

### Aktualizacja aplikacji

```bash
git pull
docker-compose down
docker-compose up -d --build
```

### Wejście do kontenera (debug)

```bash
docker-compose exec app sh
```

---

## Struktura volumów (trwałe dane)

```
volumes/
├── prisma-data/     # Baza SQLite (trwała)
└── uploads-data/     # Uploadowane pliki (trwałe)
```

Dane są zachowane nawet po `docker-compose down`.

---

## Backup

### Automatyczny (skrypt)

```bash
./docker-deploy.sh
# Wybierz opcję 7
```

### Ręcznie

```bash
# Backup bazy
docker cp myrec-app:/app/prisma/prod.db backups/prod-$(date +%Y%m%d).db

# Backup uploads
docker cp myrec-app:/app/uploads backups/uploads-$(date +%Y%m%d).tar.gz
```

---

## Monitorowanie

### Status kontenerów

```bash
docker-compose ps
```

### Zasoby

```bash
docker stats myrec-app
```

### Logi

```bash
# Wszystkie logi
docker-compose logs

# Ostatnie 100 linii
docker-compose logs --tail=100 app

# Śledź na żywo
docker-compose logs -f app
```

---

## Troubleshooting

### Kontener nie startuje

```bash
# Sprawdź logi
docker-compose logs app

# Sprawdź status
docker-compose ps
```

### Błąd bazy danych

```bash
# Wejdź do kontenera
docker-compose exec app sh

# W środku:
npx prisma migrate deploy
npx prisma db seed  # jeśli potrzebne
exit
```

### Reset aplikacji (ostateczność)

```bash
# Zatrzymaj
docker-compose down

# Usuń volumy (OSTRZEŻENIE: usuwa bazę!)
docker volume rm myrec_prisma-data myrec_uploads-data

# Uruchom od nowa
docker-compose up -d --build
```

### Brak miejsca na dysku

```bash
# Sprawdź rozmiar obrazów
docker system df

# Wyczyść nieużywane obrazy
docker system prune -a
```

---

## Produkcyjny deploy z domeną

### Opcja 1: Bez reverse proxy (proste)

Docker nasłuchuje na porcie 3000:
- Otwórz port 3000 w firewall
- Użyj IP: http://twoje-ip:3000

### Opcja 2: Z Nginx (zalecane)

Zobacz [NGINX.md](./NGINX.md) dla konfiguracji reverse proxy z SSL.

---

## Koszty zasobów

Typowe zużycie dla małej aplikacji:

| Zasób | Minimalny | Zalecany |
|-------|-----------|----------|
| RAM | 512MB | 1GB |
| CPU | 1 core | 1-2 cores |
| Dysk | 10GB | 20GB |

Na VPS za $5-6/miesiąc (np. DigitalOcean, Hetzner) wystarczy.

---

## Aktualizacja produkcyjna

```bash
# Na serwerze
cd myrec
git pull
docker-compose down
docker-compose up -d --build
```

To wszystko! Docker zajmuje się resztą.
