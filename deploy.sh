#!/bin/bash
set -e

echo "🚀 Deploying MyRec to production..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}Error: .env.production not found!${NC}"
    echo "Create .env.production from .env.example first"
    exit 1
fi

# Install dependencies if needed
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Generate Prisma Client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Build the application
echo "🏗️  Building application..."
npm run build

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p uploads

# Run database migrations
echo "🗄️  Running database migrations..."
npx prisma migrate deploy

# Seed database if needed (optional)
# npx prisma db seed

# Restart PM2 processes
if command -v pm2 &> /dev/null; then
    echo "🔄 Restarting PM2 processes..."
    pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js
    pm2 save
    echo "✅ Deployed successfully!"
    echo ""
    echo "📊 PM2 Status:"
    pm2 status
    echo ""
    echo "📝 Logs:"
    echo "  pm2 logs myrec-web"
    echo "  pm2 logs myrec-cron"
else
    echo -e "${YELLOW}PM2 not found. Install it globally:${NC}"
    echo "  npm install -g pm2"
    echo ""
    echo "Then run:"
    echo "  pm2 start ecosystem.config.js"
fi
