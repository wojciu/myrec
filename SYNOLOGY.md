# Deployment na Synology DSM + Docker

## Strategia

Budujemy obrazy Docker **lokalnie** (na Twoim Macu/PC), a na Synology tylko uruchamiamy gotowe kontenery. Dlaczego?

- Synology ma słaby CPU → budowanie obrazów trwa wieki
- `npm install` w Dockerze na Synology często wisi
- Lokalne budowanie jest szybkie i niezawodne

---

## Krok 1: Struktura katalogów na Synology

Utwórz w File Station:

```
/volume1/docker/myrec/
├── prisma-data/          #UTWÓRZ ten folder (pusty)
├── uploads-data/         #UTWÓRZ ten folder (pusty)
├── .env.docker          #UTWÓRZ (patrz niżej)
└── docker-compose.yml   #UTWÓRZ (skopiuj z projektu)
```

**Ważne:** Foldery `prisma-data` i `uploads-data` utwórz jako PUSTE - baza zostanie utworzona automatycznie przy pierwszym uruchomieniu.

---

## Krok 2: Przygotowanie na TWOIM komputerze (lokalnie)

### 2.1. Zbuduj obrazy

```bash
cd /path/to/myrec
./build-for-synology.sh
```

To zbuduje dwa obrazy:
- `myrec-app:latest`
- `myrec-cron:latest`

### 2.2. Eksportuj obrazy do plików

```bash
docker save myrec-app:latest | gzip > myrec-app.tar.gz
docker save myrec-cron:latest | gzip > myrec-cron.tar.gz
```

### 2.3. Przygotuj pliki do skopiowania

Potrzebujesz tych plików z projektu:

1. **docker-compose.synology.yml** → zmień nazwę na **docker-compose.yml**
2. **.env.docker** (zostanie utworzony przez skrypt, lub utwórz ręcznie)
3. **myrec-app.tar.gz** (utworzony powyżej)
4. **myrec-cron.tar.gz** (utworzony powyżej)

---

## Krok 3: Przeniesienie na Synology

### Opcja A: Przez File Station (GUI)

1. Otwórz File Station
2. Idź do `/volume1/docker/myrec/`
3. Upload pliki:
   - `docker-compose.yml`
   - `.env.docker`
   - `myrec-app.tar.gz`
   - `myrec-cron.tar.gz`

### Opcja B: Przez SSH (szybsze dla dużych plików)

```bash
scp docker-compose.yml .env.docker myrec-app.tar.gz myrec-cron.tar.gz \
    admin@TWÓJ-SYNOLOGY:/volume1/docker/myrec/
```

---

## Krok 4: Konfiguracja na Synology

### 4.1. Utwórz .env.docker

Jeśli nie został skopiowany, utwórz go w `/volume1/docker/myrec/.env.docker`:

```bash
DATABASE_URL=file:./prisma/prod.db
JWT_SECRET=TWOJ_SECRET_HERE
JWT_REFRESH_SECRET=TWOJ_REFRESH_SECRET_HERE
NEXT_PUBLIC_APP_URL=http://TWÓJ-SYNOLOGY-IP:3000
```

**Sekrety wygeneruj przez:**
```bash
openssl rand -base64 32
```

### 4.2. Załaduj obrazy do Dockera

Przez SSH na Synology:

```bash
cd /volume1/docker/myrec
docker load < myrec-app.tar.gz
docker load < myrec-cron.tar.gz
```

Sprawdź czy obrazy się załadowały:

```bash
docker images
# Powinieneś widzieć:
# myrec-app    latest    ...
# myrec-cron   latest    ...
```

---

## Krok 5: Uruchomienie

### 5.1. Upewnij się że foldery istnieją

```bash
mkdir -p /volume1/docker/myrec/prisma-data
mkdir -p /volume1/docker/myrec/uploads-data
```

### 5.2. Uruchom kontenery

```bash
cd /volume1/docker/myrec
docker-compose up -d
```

### 5.3. Sprawdź status

```bash
docker-compose ps
```

Powinieneś widzieć:
- `myrec-app` - status `Up (healthy)`
- `myrec-cron` - status `Up`

---

## Krok 6: Pierwsze uruchomienie

Przy pierwszym starcie:

1. **Skrypt entrypoint** automatycznie utworzy bazę danych
2. **Zaaplikuje migracje** Prisma
3. Uruchomi aplikację

Zobaczysz logi:

```bash
docker-compose logs -f app
```

Powinieneś widzieć:
```
🔍 Sprawdzanie bazy danych...
📊 Baza danych nie istnieje. Uruchamiam migracje...
✅ Baza danych utworzona
🚀 Uruchamianie aplikacji...
```

---

## Dostęp do aplikacji

Otwórz przeglądarkę:

```
http://TWOJE-SYNOLOGY-IP:3000
```

**Loginy domyślne (z seed):**
- Email: `test@hotel.com`
- Hasło: `password123`

---

## Zarządzanie

### Zobacz logi

```bash
# Wszystkie logi
docker-compose logs -f

# Tylko aplikacja
docker-compose logs -f app

# Tylko cron
docker-compose logs -f cron
```

### Restart

```bash
docker-compose restart
```

### Zatrzymaj

```bash
docker-compose down
```

### Aktualizacja (gdy zmienisz kod)

1. Na swoim komputerze zbuduj nowe obrazy
2. Eksportuj:
   ```bash
   docker save myrec-app:latest | gzip > myrec-app.tar.gz
   docker save myrec-cron:latest | gzip > myrec-cron.tar.gz
   ```
3. Przenieś na Synology
4. Na Synology:
   ```bash
   docker-compose down
   docker load < myrec-app.tar.gz
   docker load < myrec-cron.tar.gz
   docker-compose up -d
   ```

---

## Backup bazy danych

### Backup ręczny

```bash
cd /volume1/docker/myrec
cp prisma-data/prod.db prisma-data/prod.db.backup.$(date +%Y%m%d)
```

### Backup automatyczny (cron)

Dodaj do Task Scheduler w DSM:

```bash
# Backup bazy co dzień o 2:00 rano
0 2 * * * cp /volume1/docker/myrec/prisma-data/prod.db /volume1/backup/myrec/prod.db.$(date +\%Y\%m\%d)
```

---

## Troubleshooting

### Baza danych się nie tworzy

Sprawdź uprawnienia:

```bash
ls -la /volume1/docker/myrec/prisma-data
```

Powinno być własnością użytkownika dockera. Jeśli nie:

```bash
chown -R 1024:1024 /volume1/docker/myrec/prisma-data
```

### Kontener nie startuje

```bash
docker-compose logs app
```

### Brak uprawnień do zapisu plików

```bash
chown -R 1024:1024 /volume1/docker/myrec/uploads-data
```

### Pamięć podręczka Prisma

Jeśli zmieniłeś schema:

```bash
docker-compose down
rm -rf /volume1/docker/myrec/prisma-data/*
docker-compose up -d
```

---

## Integracja z reverse proxy (opcjonalnie)

Jeśli chcesz mieć dostęp przez `https://myrec.twojadomena.pl`:

1. Otwórz **Nginx Web Server** w DSM
2. Dodaj **Reverse Proxy**:
   - Source: `myrec.twojadomena.pl`
   - Destination: `localhost:3000`
   - Włącz **Custom Header**: `X-Forwarded-Proto: https`

Pamiętaj zmienić `NEXT_PUBLIC_APP_URL` w `.env.docker` na `https://myrec.twojadomena.pl`

---

## Zasoby

- Port aplikacji: `3000`
- Użycie dysku: ~500MB dla obrazów + baza
- RAM: ~200MB per kontener
- CPU: Minimalne (tylko przy requestach)
