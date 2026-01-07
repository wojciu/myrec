#!/bin/bash

# ===================================
# Skrypt instalacyjny dla Synology DSM
# Uruchomić na Synology przez SSH
# ===================================

set -e

echo "🚀 Instalacja Hotel Shift Journal na Synology"
echo "=============================================="
echo ""

# Sprawdź czy jesteśmy w odpowiednim katalogu
if [ ! -f "package.json" ]; then
    echo "❌ Błąd: Nie znaleziono package.json"
    echo "Uruchom ten skrypt w katalogu projektu!"
    exit 1
fi

# Sprawdź czy Docker jest zainstalowany
if ! command -v docker &> /dev/null; then
    echo "❌ Błąd: Docker nie jest zainstalowany"
    echo "Zainstaluj Docker (Container Manager) z Centrum Pakietów"
    exit 1
fi

echo "✅ Docker wersja: $(docker --version)"
echo ""

# Krok 1: Utwórz .env.docker jeśli nie istnieje
if [ ! -f .env.docker ]; then
    echo "📝 Krok 1: Tworzenie .env.docker..."
    JWT_SECRET=$(openssl rand -base64 32)
    JWT_REFRESH_SECRET=$(openssl rand -base64 32)

    cat > .env.docker << EOF
DATABASE_URL=file:./prisma/prod.db
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

    echo "✅ Utworzono .env.docker"
    echo "⚠️  Zmień NEXT_PUBLIC_APP_URL na właściwy URL!"
else
    echo "✅ .env.docker już istnieje"
fi
echo ""

# Krok 2: Utwórz foldery
echo "📁 Krok 2: Tworzenie struktur katalogów..."
mkdir -p prisma-data
mkdir -p uploads-data
echo "✅ Utworzono foldery"
echo ""

# Krok 3: Zmień nazwę docker-compose
if [ -f docker-compose.synology.yml ] && [ ! -f docker-compose.yml ]; then
    echo "📝 Krok 3: Przygotowywanie docker-compose.yml..."
    mv docker-compose.synology.yml docker-compose.yml
    echo "✅ Utworzono docker-compose.yml"
else
    echo "✅ docker-compose.yml już istnieje"
fi
echo ""

# Krok 4: Buduj obrazy Docker
echo "🏗️  Krok 4: Budowanie obrazów Docker..."
echo "To może zająć 5-10 minut (zależnie od CPU Synology)..."
echo ""

# Buduj app
echo "📦 Budowanie myrec-app..."
sudo docker build -f Dockerfile.synology -t myrec-app:latest .

if [ $? -eq 0 ]; then
    echo "✅ Obraz myrec-app zbudowany"
else
    echo "❌ Błąd podczas budowania myrec-app"
    exit 1
fi
echo ""

# Buduj cron
echo "📦 Budowanie myrec-cron..."
sudo docker build -f Dockerfile.cron.synology -t myrec-cron:latest .

if [ $? -eq 0 ]; then
    echo "✅ Obraz myrec-cron zbudowany"
else
    echo "❌ Błąd podczas budowania myrec-cron"
    exit 1
fi

echo ""
echo "🎉 Instalacja zakończona pomyślnie!"
echo ""
echo "=============================================="
echo "Następne kroki:"
echo ""
echo "1. Edytuj .env.docker:"
echo "   nano .env.docker"
echo ""
echo "2. Zmień NEXT_PUBLIC_APP_URL na:"
echo "   NEXT_PUBLIC_APP_URL=http://TWOJE-SYNOLOGY-IP:3000"
echo ""
echo "3. Uruchom kontenery:"
echo "   docker-compose up -d"
echo ""
echo "4. Sprawdź status:"
echo "   docker-compose ps"
echo ""
echo "5. Zobacz logi:"
echo "   docker-compose logs -f"
echo ""
echo "=============================================="
