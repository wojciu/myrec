#!/bin/sh
set -e

echo "🔍 Sprawdzanie bazy danych..."

# Jeśli baza nie istnieje, utwórz ją
if [ ! -f /app/prisma/prod.db ]; then
    echo "📊 Baza danych nie istnieje. Uruchamiam migracje..."
    ./node_modules/.bin/prisma migrate deploy
    echo "✅ Baza danych utworzona"
else
    echo "✅ Baza danych już istnieje"
fi

# Sprawdź czy schema jest aktualne
echo "🔄 Sprawdzanie schematu bazy..."
./node_modules/.bin/prisma migrate deploy

echo "🚀 Uruchamianie aplikacji..."
exec "$@"
