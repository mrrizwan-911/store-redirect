#!/bin/bash
set -e  # Exit on any error

echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║        CALNZA E-COMMERCE SETUP            ║"
echo "╚═══════════════════════════════════════════╝"
echo ""

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js 18+ required. Found: $(node -v)"
  exit 1
fi

echo "✓ Node.js $(node -v) detected"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps
echo "✓ Dependencies installed"

# Check .env existence
if [ ! -f ".env" ] && [ ! -f ".env.local" ]; then
  echo "⚠️  No .env or .env.local found. Creating .env from .env.example..."
  cp .env.example .env
  echo "⚠️  Action Required: Update .env with your credentials before proceeding."
  exit 0
fi

# Run database migrations
echo ""
echo "🗄️  Running database migrations..."
npx prisma db push
echo "✓ Schema pushed to database"

# Generate Prisma client
echo "⚙️  Generating Prisma client..."
npx prisma generate
echo "✓ Prisma client generated"

# Seed initial data
echo ""
echo "🌱 Seeding initial data (Admin user + Categories)..."
npm run seed
echo "✓ Seed complete"

echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║   Setup complete!                         ║"
echo "╠══════════════════════════════════════════╣"
echo "║   Start development: npm run dev          ║"
echo "║   Production build:  npm run build        ║"
echo "║                                           ║"
echo "║   Admin Login: admin@calnza.com           ║"
echo "║   Password:    Admin@123                  ║"
echo "╚═══════════════════════════════════════════╝"
echo ""
