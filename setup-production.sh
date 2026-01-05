#!/bin/bash

# Script do przygotowania środowiska produkcyjnego

echo "🔧 Setting up production environment..."

# Generuj JWT secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

echo "Generated JWT secrets"

# Zapytaj o domenę
read -p "Enter your domain (e.g., https://myrec.example.com): " DOMAIN

# Utwórz .env.production
cat > .env.production << EOF
# Database
DATABASE_URL="file:./prisma/prod.db"

# JWT Secrets - CHANGE THESE IN PRODUCTION!
JWT_SECRET="$JWT_SECRET"
JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET"

# Server
NODE_ENV="production"
PORT=3000

# Application URL
NEXT_PUBLIC_APP_URL="$DOMAIN"
EOF

echo ""
echo "✅ Created .env.production"
echo ""
echo "⚠️  IMPORTANT: Save your JWT secrets securely:"
echo "   JWT_SECRET=$JWT_SECRET"
echo "   JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
echo ""
echo "Next steps:"
echo "1. Review .env.production"
echo "2. Run: ./deploy.sh"
