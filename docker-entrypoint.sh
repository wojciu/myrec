#!/bin/sh
set -e

echo "🔍 Sprawdzanie bazy danych..."

# Jeśli baza nie istnieje, utwórz ją
if [ ! -f /app/prisma/prod.db ]; then
    echo "📊 Baza danych nie istnieje. Tworzę bazę..."
    # Użyj node_modules/.bin/prisma - to jest wrapper do właściwej binarki
    export DATABASE_URL="file:./prisma/prod.db"
    ./node_modules/.bin/prisma db push --accept-data-loss
    echo "✅ Baza danych utworzona"
else
    echo "✅ Baza danych już istnieje"
fi

echo "🚀 Uruchamianie aplikacji..."
exec "$@"
