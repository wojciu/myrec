# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps
WORKDIR /app

# Instalacja zależności systemowych wymaganych przez bcrypt
RUN apk add --no-cache libc6-compat

# Kopiowanie package files
COPY package.json package-lock.json* ./

# Instalacja wszystkich zależności (również devDependencies potrzebne do buildu)
RUN npm ci

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder
WORKDIR /app

# Kopiowanie zależności z poprzedniego stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Ustawienie zmiennej środowiskowej dla buildu
ENV NEXT_TELEMETRY_DISABLED=1

# Generowanie Prisma Client (dla SQLite)
RUN npx prisma generate

# Build aplikacji Next.js
RUN npm run build

# ============================================
# Stage 3: Runner (production)
# ============================================
FROM node:20-alpine AS runner
WORKDIR /app

# Instalacja zależności systemowych
RUN apk add --no-cache libc6-compat sqlite

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Tworzenie użytkownika nie-root (bezpieczeństwo)
# UID 1030:1030 odpowiada użytkownikowi 'nextjs' na Synology DSM
RUN addgroup --system --gid 1030 nodejs
RUN adduser --system --uid 1030 nextjs

# Kopiowanie tylko niezbędnych plików z buildu
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/scripts ./scripts

# Tworzenie katalogów z odpowiednimi uprawnieniami
RUN mkdir -p /app/uploads /app/prisma && chown -R nextjs:nodejs /app

# Przełączenie na użytkownika nie-root
USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start aplikacji
CMD ["node", "server.js"]
