#!/bin/bash

# ===================================
# Skrypt budowania obrazów Docker na LOCALnym komputerze
# dla deploymentu na Synology
# ===================================

set -e

echo "🏗️  Budowanie obrazów Docker lokalnie (nie na Synology)..."
echo ""

# Sprawdź czy .env.docker istnieje
if [ ! -f .env.docker ]; then
    echo "📝 Tworzę .env.docker z wygenerowanymi sekretami..."
    JWT_SECRET=$(openssl rand -base64 32)
    JWT_REFRESH_SECRET=$(openssl rand -base64 32)
    cat > .env.docker << EOF
DATABASE_URL=file:./prisma/prod.db
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
    echo "✅ Utworzono .env.docker"
fi

# Buduj obraz app
echo "📦 Budowanie obrazu myrec-app:latest..."
docker build -f Dockerfile -t myrec-app:latest .
echo "✅ Obraz myrec-app:latest zbudowany"

# Buduj obraz cron
echo "📦 Budowanie obrazu myrec-cron:latest..."
docker build -f Dockerfile.cron -t myrec-cron:latest .
echo "✅ Obraz myrec-cron:latest zbudowany"

echo ""
echo "🎉 Obrazy zbudowane pomyślnie!"
echo ""
echo "Następne kroki:"
echo "1. Zapisz obrazy do plików tar:"
echo "   docker save myrec-app:latest | gzip > myrec-app.tar.gz"
echo "   docker save myrec-cron:latest | gzip > myrec-cron.tar.gz"
echo ""
echo "2. Przenieś pliki na Synology:"
echo "   - myrec-app.tar.gz"
echo "   - myrec-cron.tar.gz"
echo "   - docker-compose.synology.yml -> docker-compose.yml"
echo "   - .env.docker"
echo ""
echo "3. Na Synology:"
echo "   docker load < myrec-app.tar.gz"
echo "   docker load < myrec-cron.tar.gz"
echo "   docker-compose up -d"
