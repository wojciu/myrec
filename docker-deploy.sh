#!/bin/bash

# Kolory do wyświetlania komunikatów
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🐳 MyRec Docker Build & Deploy${NC}"
echo "=================================="

# Sprawdź czy .env.docker istnieje, jeśli nie - utwórz z wygenerowanymi sekretami
if [ ! -f .env.docker ]; then
    echo -e "${YELLOW}Tworzę .env.docker z wygenerowanymi sekretami...${NC}"

    # Generuj sekrety
    JWT_SECRET=$(openssl rand -base64 32)
    JWT_REFRESH_SECRET=$(openssl rand -base64 32)

    # Utwórz .env.docker
    cat > .env.docker << EOF
# Database (SQLite w Docker - persisted volume)
DATABASE_URL=file:./prisma/prod.db

# JWT Secrets - auto-generated
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

    echo -e "${GREEN}✅ Utworzono .env.docker${NC}"
    echo -e "${YELLOW}⚠️  JWT_SECRET zostały wygenerowane. Zapisz je bezpiecznie!${NC}"
    echo ""
fi

# Funkcja do wyboru akcji
show_menu() {
    echo ""
    echo "Wybierz akcję:"
    echo "  1) Buduj obraz Docker"
    echo "  2) Uruchom (docker-compose up)"
    echo "  3) Zatrzymaj (docker-compose down)"
    echo "  4) Pokaż logi"
    echo "  5) Restart"
    echo "  6) Buduj i uruchom (wszystko)"
    echo "  7) Backup bazy danych"
    echo "  8) Wyjście"
    echo -n "Wybierz (1-8): "
}

# Budowanie obrazu
build_image() {
    echo -e "${YELLOW}🏗️  Budowanie obrazu Docker...${NC}"
    docker-compose build
    echo -e "${GREEN}✅ Budowa zakończona${NC}"
}

# Uruchamianie
start_containers() {
    echo -e "${YELLOW}🚀 Uruchamianie kontenerów...${NC}"
    docker-compose up -d
    echo -e "${GREEN}✅ Kontenery uruchomione${NC}"
    echo ""
    echo "Aplikacja dostępna pod: http://localhost:3000"
    echo ""
    echo "Sprawdź status:"
    docker-compose ps
}

# Zatrzymywanie
stop_containers() {
    echo -e "${YELLOW}🛑 Zatrzymywanie kontenerów...${NC}"
    docker-compose down
    echo -e "${GREEN}✅ Kontenery zatrzymane${NC}"
}

# Logi
show_logs() {
    echo ""
    echo "Którego kontenera logi pokazać?"
    echo "  1) app"
    echo "  2) cron"
    echo "  3) oba"
    echo -n "Wybierz (1-3): "
    read log_choice

    case $log_choice in
        1)
            docker-compose logs -f app
            ;;
        2)
            docker-compose logs -f cron
            ;;
        3)
            docker-compose logs -f
            ;;
        *)
            echo -e "${RED}Nieprawidłowy wybór${NC}"
            ;;
    esac
}

# Restart
restart_containers() {
    echo -e "${YELLOW}🔄 Restart kontenerów...${NC}"
    docker-compose restart
    echo -e "${GREEN}✅ Restart zakończony${NC}"
}

# Wszystko (build + start)
build_and_start() {
    build_image
    start_containers
}

# Backup bazy
backup_database() {
    BACKUP_DIR="backups"
    mkdir -p $BACKUP_DIR

    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/myrec-backup-$timestamp.db"

    echo -e "${YELLOW}💾 Backup bazy danych...${NC}"

    # Sprawdź czy kontener działa
    if ! docker-compose ps | grep -q "myrec-app.*Up"; then
        echo -e "${RED}Błąd: Kontener app nie działa${NC}"
        return 1
    fi

    docker cp myrec-app:/app/prisma/prod.db "$BACKUP_FILE"
    echo -e "${GREEN}✅ Backup zapisany: $BACKUP_FILE${NC}"
}

# Główna pętla
while true; do
    show_menu
    read choice

    case $choice in
        1)
            build_image
            ;;
        2)
            start_containers
            ;;
        3)
            stop_containers
            ;;
        4)
            show_logs
            ;;
        5)
            restart_containers
            ;;
        6)
            build_and_start
            ;;
        7)
            backup_database
            ;;
        8)
            echo -e "${GREEN}Do widzenia!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Nieprawidłowy wybier. Spróbuj ponownie.${NC}"
            ;;
    esac
done
