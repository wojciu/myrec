#!/bin/bash

# ===================================
# Skrypt do budowania na Macu i pakowania dla Synology
# ===================================

set -e

echo "🏗️  Budowanie aplikacji na Macu dla Synology"
echo "=============================================="
echo ""

# Sprawdź czy jesteśmy w proper directory
if [ ! -f "package.json" ]; then
    echo "❌ Błąd: Nie znaleziono package.json"
    echo "Uruchom ten skrypt w katalogu projektu!"
    exit 1
fi

# Krok 1: Zainstaluj zależności
echo "📦 Krok 1: Instalowanie zależności..."
rm -rf node_modules
npm install
echo "✅ Zależności zainstalowane"
echo ""

# Krok 2: Generuj Prisma Client
echo "🔧 Krok 2: Generowanie Prisma Client..."
npx prisma generate
echo "✅ Prisma Client wygenerowany"
echo ""

# Krok 3: Zbuduj aplikację
echo "🏗️  Krok 3: Budowanie aplikacji..."
npm run build
echo "✅ Aplikacja zbudowana"
echo ""

# Krok 4: Usuń dev dependencies
echo "🧹 Krok 4: Usuwanie dev dependencies..."
npm prune --production
echo "✅ Dev dependencies usunięte"
echo ""

# Krok 5: Spakuj dla Synology
echo "📦 Krok 5: Pakowanie dla Synology..."
tar -czf myrec-synology-build.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=*.db \
    --exclude=myrec-synology-build.tar.gz \
    .

echo "✅ Spakowane do myrec-synology-build.tar.gz"
echo ""

echo "🎉 Gotowe!"
echo ""
echo "=============================================="
echo "Skopiuj myrec-synology-build.tar.gz na Synology"
echo "i rozpakuj: tar -xzf myrec-synology-build.tar.gz"
echo ""
echo "Na Synology uruchom:"
echo "  cd /volume1/docker/myrec"
echo "  npm ci --production"
echo "  pm2 start npm --name myrec-app -- start"
echo "=============================================="
