#!/bin/sh
set -e

echo "🔍 Sprawdzanie bazy danych..."

# Jeśli baza nie istnieje, utwórz ją
if [ ! -f /app/prisma/prod.db ]; then
    echo "📊 Baza danych nie istnieje. Tworzę bazę..."
    # Użyj push zamiast migrate - wymaga mniej zależności
    export DATABASE_URL="file:./prisma/prod.db"
    npx prisma db push --skip-generate
    echo "✅ Baza danych utworzona"
else
    echo "✅ Baza danych już istnieje"
fi

echo "🚀 Uruchamianie aplikacji..."
exec "$@"
