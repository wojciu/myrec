#!/bin/bash

# Kolory do wyświetlania komunikatów
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🐳 MyRec Docker Build & Deploy${NC}"
echo "=================================="

# Sprawdź czy .env.docker istnieje
if [ ! -f .env.docker ]; then
    echo -e "${RED}Błąd: .env.docker nie istnieje!${NC}"
    echo "Utwórz go z .env.docker.example:"
    echo "  cp .env.docker .env.docker"
    echo "Następnie edytuj i ustaw JWT_SECRET"
    exit 1
fi

# Załaduj zmienne środowiskowe
export $(cat .env.docker | grep -v '^#' | xargs)

# Sprawdź JWT_SECRET
if [ "$JWT_SECRET" = "CHANGE_THIS_GENERATE_WITH_OPENSSL" ]; then
    echo -e "${YELLOW}⚠️  OSTRZEŻENIE: JWT_SECRET nie jest ustawiony!${NC}"
    read -p "Czy chcesz wygenerować nowe sekrety teraz? (t/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Tt]$ ]]; then
        JWT_SECRET=$(openssl rand -base64 32)
        JWT_REFRESH_SECRET=$(openssl rand -base64 32)

        sed -i.bak "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env.docker
        sed -i.bak "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET/" .env.docker
        rm .env.docker.bak

        echo -e "${GREEN}✅ Sekrety wygenerowane i zapisane w .env.docker${NC}"
    else
        echo -e "${RED}Anulowano. Ustaw sekrety ręcznie w .env.docker${NC}"
        exit 1
    fi
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
}

# Zatrzymywanie
stop_containers() {
    echo -e "${YELLOW}🛑 Zatrzymywanie kontenerów...${NC}"
    docker-compose down
    echo -e "${GREEN}✅ Kontenery zatrzymane${NC}"
}

# Logi
show_logs() {
    echo -e "${YELLOW}📝 Pokazywanie logów (Ctrl+C aby wyjść)...${NC}"
    docker-compose logs -f
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

    # Kopiuj bazę z kontenera
    docker-compose exec -T app cp prisma/prod.db - > /dev/null 2>&1 || {
        echo -e "${RED}Błąd: Kontener nie działa lub baza nie istnieje${NC}"
        return 1
    }

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
