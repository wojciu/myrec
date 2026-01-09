#!/bin/bash

# ===================================
# Skrypt instalacyjny dla Synology BEZ Dockera
# ===================================

set -e

echo "🚀 Instalacja Hotel Shift Journal na Synology (Native)"
echo "======================================================"
echo ""

# Znajdź Node.js
NODE_PATHS=(
    "/volume1/@appstore/Node.js_v20/usr/local/bin"
    "/volume1/@appstore/Node.js_v18/usr/local/bin"
    "/volume1/@appstore/Node.js_v14/usr/local/bin"
    "/usr/local/bin"
)

NODE_BIN=""
for path in "${NODE_PATHS[@]}"; do
    if [ -f "$path/node" ] && [ -f "$path/npm" ]; then
        NODE_BIN="$path"
        break
    fi
done

if [ -z "$NODE_BIN" ]; then
    echo "❌ Błąd: Nie znaleziono Node.js"
    echo "Zainstaluj Node.js z Centrum Pakietów"
    exit 1
fi

echo "✅ Znaleziono Node.js w: $NODE_BIN"
export PATH="$NODE_BIN:$PATH"

echo "📌 Node.js wersja: $(node --version)"
echo "📌 npm wersja: $(npm --version)"
echo ""

# Sprawdź czy jesteśmy w odpowiednim katalogu
if [ ! -f "package.json" ]; then
    echo "❌ Błąd: Nie znaleziono package.json"
    echo "Uruchom ten skrypt w katalogu projektu!"
    exit 1
fi

# Krok 1: Utwórz .env jeśli nie istnieje
if [ ! -f .env ]; then
    echo "📝 Krok 1: Tworzenie .env..."
    JWT_SECRET=$(openssl rand -base64 32)
    JWT_REFRESH_SECRET=$(openssl rand -base64 32)

    cat > .env << EOF
DATABASE_URL=file:./prisma/prod.db
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

    echo "✅ Utworzono .env"
    echo "⚠️  Zmień NEXT_PUBLIC_APP_URL na właściwy URL!"
else
    echo "✅ .env już istnieje"
fi
echo ""

# Krok 2: Zainstaluj zależności (wraz z dev dependencies do buildu)
echo "📦 Krok 2: Instalowanie zależności..."
npm ci
echo "✅ Zależności zainstalowane"
echo ""

# Krok 3: Sprawdź Prisma Client
echo "🔧 Krok 3: Generowanie Prisma Client..."
if [ -d "node_modules/.prisma" ] && [ -d "node_modules/@prisma/client" ]; then
    echo "✅ Prisma Client już wygenerowany"
else
    echo "Generowanie Prisma Client..."
    $NODE_BIN/npx prisma generate
fi
echo ""

# Krok 4: Zbuduj aplikację
echo "🏗️  Krok 4: Budowanie aplikacji..."
npm run build
echo "✅ Aplikacja zbudowana"
echo ""

# Krok 5: Usuń dev dependencies (opcjonalnie, dla mniejszego node_modules)
echo "🧹 Krok 5: Usuwanie dev dependencies..."
npm prune --production
echo "✅ Dev dependencies usunięte"
echo ""

# Krok 6: Zainstaluj PM2 jeśli nie istnieje
if ! command -v pm2 &> /dev/null; then
    echo "📦 Krok 6: Instalowanie PM2..."
    npm install -g pm2
    echo "✅ PM2 zainstalowane"
else
    echo "✅ PM2 już zainstalowane"
fi
echo ""

# Krok 7: Skonfiguruj PM2
echo "🚀 Krok 7: Konfiguracja PM2..."

# Zatrzymaj stare procesy jeśli istnieją
pm2 delete myrec-app 2>/dev/null || true
pm2 delete myrec-cron 2>/dev/null || true

# Uruchom aplikację
pm2 start npm --name "myrec-app" -- start

# Uruchom cron
pm2 start npm --name "myrec-cron" -- run cron

# Zapisz konfigurację
pm2 save

echo "✅ PM2 skonfigurowane"
echo ""

echo "🎉 Instalacja zakończona pomyślnie!"
echo ""
echo "======================================================"
echo "Aplikacja działa na:"
echo "  http://TWOJE-SYNOLOGY-IP:3000"
echo ""
echo "Przydatne komendy:"
echo "  pm2 status              - Sprawdź status"
echo "  pm2 logs myrec-app      - Zobacz logi"
echo "  pm2 restart myrec-app   - Restart aplikacji"
echo "  pm2 stop myrec-app      - Zatrzymaj"
echo "  pm2 delete myrec-app    - Usuń"
echo "======================================================"
