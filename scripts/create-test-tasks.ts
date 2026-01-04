import { PrismaClient } from '@prisma/client';
import path from 'path';

const getDatabaseUrl = () => {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl?.startsWith('file:')) {
    const relativePath = dbUrl.replace('file:', '');
    const absolutePath = path.join(process.cwd(), relativePath);
    return `file:${absolutePath}`;
  }
  return dbUrl;
};

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
});

const taskTitles = [
  'Sprawdzić rezerwację pokoju 101',
  'Zadzwonić do gościa z pokoju 205',
  'Przygotować rachunek dla firmy ABC',
  'Uzupełnić zapasy w minibarze',
  'Zgłosić usterkę w łazience pokoju 302',
  'Przyjąć dostawę ręczników',
  'Sprawdzić stan pokojów na piętrze 2',
  'Przygotować sala konferencyjna A',
  'Zamówić świeże kwiaty do lobby',
  'Zaktualizować system rezerwacji',
  'Pomóc gościom z zameldowaniem',
  'Sprawdzić wyżywienie dla konferencji',
  'Zorganizować transport dla gościa VIP',
  'Przygotować informacje o atrakcjach turystycznych',
  'Sprawdzić dostępność pokojów na weekend',
  'Zameldować grupę z Polski',
  'Wymeldować gości z pokoi 401-405',
  'Sprawdzić czystość basenu',
  'Zamówić chemię gospodarczą',
  'Przeprowadzić szkolenie z obsługi recepcji',
  'Zaktualizować cennik pokojów',
  'Sprawdzić system alarmowy',
  'Przygotować Pokoje dla grupy weselnej',
  'Złożyć zamówienie do pralni',
  'Sprawdzić rezerwacje śniadania',
  'Zorganizować parking dla autobusu turystycznego',
  'Przygotować faktury VAT',
  'Sprawdzić system kluczy elektronicznych',
  'Zamówić materiały biurowe',
];

const taskDescriptions = [
  'Proszę o dokładne sprawdzenie i zgłoszenie ewentualnych problemów',
  'Wymagana jest natychmiastowa interwencja',
  'Zadanie do wykonania do końca zmiany',
  'Standardowa procedura operacyjna',
  'Zgłoszenie od gościa hotelowego - wymaga potwierdzenia',
  'Zadanie cykliczne - powtarzać codziennie',
];

async function main() {
  // Pobierz użytkowników i działy
  const users = await prisma.user.findMany();
  const departments = await prisma.department.findMany();

  console.log('Znaleziono użytkowników:', users.length);
  console.log('Znaleziono działów:', departments.length);

  if (users.length === 0) {
    console.error('Brak użytkowników w bazie!');
    return;
  }

  // Losowe daty - od tygodnia wstecz do 2 tygodni w przód
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const statuses: ('open' | 'in_progress' | 'done' | 'cancelled')[] = ['open', 'in_progress', 'done', 'cancelled'];
  const priorities = [1, 2, 3];

  const tasksToCreate = [];

  for (let i = 0; i < 30; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    
    // Losowy użytkownik (lub null)
    const assignee = Math.random() > 0.3 ? users[Math.floor(Math.random() * users.length)] : null;
    
    // Losowy dział (lub null)
    const assigneeDept = departments.length > 0 && Math.random() > 0.5 
      ? departments[Math.floor(Math.random() * departments.length)]
      : null;

    // Losowa data utworzenia (ostatni tydzień)
    const createdAt = new Date(weekAgo.getTime() + Math.random() * (now.getTime() - weekAgo.getTime()));

    // Losowa data dueAt (od 3 dni wstecz do 2 tygodni w przód)
    const dueAt = new Date(createdAt.getTime() + (Math.random() * 17 - 3) * 24 * 60 * 60 * 1000);

    // Data updatedAt - zależy od statusu
    let updatedAt = createdAt;
    if (status === 'done' || status === 'cancelled') {
      updatedAt = new Date(createdAt.getTime() + Math.random() * (dueAt.getTime() - createdAt.getTime()));
    } else if (status === 'in_progress') {
      updatedAt = new Date(createdAt.getTime() + Math.random() * (now.getTime() - createdAt.getTime()));
    }

    tasksToCreate.push({
      title: taskTitles[i % taskTitles.length] + (i >= taskTitles.length ? ` #${i + 1}` : ''),
      description: taskDescriptions[Math.floor(Math.random() * taskDescriptions.length)],
      status,
      priority,
      createdById: users[Math.floor(Math.random() * users.length)].id,
      assigneeId: assignee?.id || null,
      assigneeDepartmentId: assigneeDept?.id || null,
      dueAt,
      createdAt,
      updatedAt,
    });
  }

  // Tworzymy zadania
  console.log('Tworzenie 30 zadań...');
  const result = await prisma.task.createMany({
    data: tasksToCreate,
  });

  console.log(`Utworzono ${result.count} zadań!`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('Błąd:', e);
    prisma.$disconnect();
    process.exit(1);
  });
