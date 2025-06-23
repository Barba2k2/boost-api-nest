import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpeza do banco antes de popular
  console.log('🧹 Limpando dados existentes...');
  await prisma.score.deleteMany();
  await prisma.socialMedia.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.streamer.deleteMany();
  await prisma.user.deleteMany();

  // Hash da senha padrão
  const defaultPassword = await bcrypt.hash('123456', 12);

  // 1. Criar usuários
  console.log('👥 Criando usuários...');

  // Admin
  const adminUser = await prisma.user.create({
    data: {
      nickname: 'admin',
      email: 'admin@boostteam.com',
      password: defaultPassword,
      fullName: 'Administrador Sistema',
      role: 'admin',
      status: true,
      lastLogin: new Date(),
      phone: '+55 11 99999-0001',
    },
  });

  // Streamers usuários
  const streamersData = [
    {
      nickname: 'aggeotv',
      email: 'aggeo@streaming.com',
      fullName: 'Aggeo Silva',
      platforms: ['twitch', 'youtube'],
      streamDays: ['monday', 'wednesday', 'friday'],
      twitchChannel: 'aggeotv',
      youtubeChannel: 'AggeoPLayz',
    },
    {
      nickname: 'barba_09a',
      email: 'barba@streaming.com',
      fullName: 'Barba Streamer',
      platforms: ['twitch'],
      streamDays: ['tuesday', 'thursday', 'saturday'],
      twitchChannel: 'barba_09a',
      instagramHandle: '@barba_09a',
    },
    {
      nickname: 'millastorm',
      email: 'milla@streaming.com',
      fullName: 'Milla Storm',
      platforms: ['youtube', 'tiktok'],
      streamDays: ['monday', 'tuesday', 'friday', 'sunday'],
      youtubeChannel: 'MillaStormGaming',
      tiktokHandle: '@millastorm',
    },
    {
      nickname: 'novais86',
      email: 'novais@streaming.com',
      fullName: 'Novais Player',
      platforms: ['twitch', 'facebook'],
      streamDays: ['wednesday', 'saturday', 'sunday'],
      twitchChannel: 'novais86',
      facebookPage: 'NovaitsGaming',
    },
    {
      nickname: 'thundergamer',
      email: 'thunder@streaming.com',
      fullName: 'Thunder Gamer',
      platforms: ['twitch', 'youtube', 'instagram'],
      streamDays: ['monday', 'thursday', 'friday'],
      twitchChannel: 'thundergamer',
      youtubeChannel: 'ThunderGamerBR',
      instagramHandle: '@thundergamer_br',
    },
    {
      nickname: 'pixelqueen',
      email: 'pixel@streaming.com',
      fullName: 'Pixel Queen',
      platforms: ['youtube', 'tiktok'],
      streamDays: ['tuesday', 'thursday', 'saturday'],
      youtubeChannel: 'PixelQueenGames',
      tiktokHandle: '@pixelqueen',
    },
    {
      nickname: 'gamerstorm',
      email: 'gamer@streaming.com',
      fullName: 'Gamer Storm',
      platforms: ['twitch'],
      streamDays: ['monday', 'wednesday', 'friday', 'sunday'],
      twitchChannel: 'gamerstorm',
    },
    {
      nickname: 'ninjaplayer',
      email: 'ninja@streaming.com',
      fullName: 'Ninja Player',
      platforms: ['twitch', 'instagram'],
      streamDays: ['tuesday', 'friday', 'saturday'],
      twitchChannel: 'ninjaplayer',
      instagramHandle: '@ninjaplayer_br',
    },
  ];

  // Criar usuários streamers e seus perfis
  console.log('🎬 Criando streamers...');
  const createdStreamers: any[] = [];

  for (const data of streamersData) {
    const user = await prisma.user.create({
      data: {
        nickname: data.nickname,
        email: data.email,
        password: defaultPassword,
        fullName: data.fullName,
        role: 'user',
        status: true,
        lastLogin: new Date(
          Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
        ), // Últimos 7 dias
      },
    });

    const streamer = await prisma.streamer.create({
      data: {
        userId: user.id,
        platforms: data.platforms,
        streamDays: data.streamDays,
        usualStartTime: '20:00',
        usualEndTime: '00:00',
        isOnline: Math.random() > 0.5, // 50% chance de estar online
        points: 0, // Será atualizado pelos scores
      },
    });

    // Criar redes sociais
    await prisma.socialMedia.create({
      data: {
        streamerId: streamer.id,
        twitchChannel: data.twitchChannel || null,
        youtubeChannel: data.youtubeChannel || null,
        instagramHandle: data.instagramHandle || null,
        tiktokHandle: data.tiktokHandle || null,
        facebookPage: data.facebookPage || null,
      },
    });

    createdStreamers.push({ user, streamer });
  }

  // 2. Criar alguns usuários simples sem streamer
  console.log('👤 Criando usuários simples...');
  await prisma.user.createMany({
    data: [
      {
        nickname: 'viewer1',
        email: 'viewer1@test.com',
        password: defaultPassword,
        fullName: 'Viewer Um',
        role: 'user',
        status: true,
      },
      {
        nickname: 'viewer2',
        email: 'viewer2@test.com',
        password: defaultPassword,
        fullName: 'Viewer Dois',
        role: 'user',
        status: false,
      },
    ],
  });

  // 3. Criar schedules
  console.log('📅 Criando schedules...');
  const scheduleData: any[] = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);

    scheduleData.push(
      {
        streamerUrl: 'twitch.tv/aggeotv',
        date: date,
        startTime: '20:00',
        endTime: '23:30',
      },
      {
        streamerUrl: 'youtube.com/@barba_09a',
        date: date,
        startTime: '21:00',
        endTime: '00:00',
      },
    );
  }

  await prisma.schedule.createMany({
    data: scheduleData,
  });

  // 4. Criar scores para os últimos 30 dias
  console.log('📊 Criando scores...');
  const scoresData: any[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  for (const { streamer } of createdStreamers) {
    let totalPoints = 0;

    // Para cada dia dos últimos 30 dias
    for (let day = 0; day < 30; day++) {
      const scoreDate = new Date(startDate);
      scoreDate.setDate(scoreDate.getDate() + day);

      // Chance de 70% de ter atividade no dia
      if (Math.random() < 0.7) {
        // Número aleatório de scores por dia (1-20)
        const scoresPerDay = Math.floor(Math.random() * 20) + 1;

        // Criar um set para rastrear horários usados
        const usedTimes = new Set();

        for (let i = 0; i < scoresPerDay; i++) {
          let hour: number, minute: number, timeKey: string;
          let attempts = 0;

          // Tentar encontrar um horário único (máximo 50 tentativas)
          do {
            hour = Math.floor(Math.random() * 6) + 18; // Entre 18h e 23h
            minute = Math.floor(Math.random() * 60);
            timeKey = `${hour}:${minute}`;
            attempts++;
          } while (usedTimes.has(timeKey) && attempts < 50);

          // Se encontrou um horário único
          if (!usedTimes.has(timeKey)) {
            usedTimes.add(timeKey);

            const points = Math.floor(Math.random() * 15) + 1; // 1-15 pontos

            // Verificar se não excede 240 pontos por dia
            const dailyTotal = scoresData
              .filter(
                (s) =>
                  s.streamerId === streamer.id &&
                  s.date.toDateString() === scoreDate.toDateString(),
              )
              .reduce((sum, s) => sum + s.points, 0);

            if (dailyTotal + points <= 240) {
              scoresData.push({
                streamerId: streamer.id,
                date: scoreDate,
                hour: hour,
                minute: minute,
                points: points,
              });
              totalPoints += points;
            }
          }
        }
      }
    }

    // Atualizar pontos totais do streamer
    await prisma.streamer.update({
      where: { id: streamer.id },
      data: { points: totalPoints },
    });
  }

  // Inserir scores em lotes para melhor performance
  const batchSize = 1000;
  for (let i = 0; i < scoresData.length; i += batchSize) {
    const batch = scoresData.slice(i, i + batchSize);
    await prisma.score.createMany({
      data: batch,
    });
  }

  // 5. Estatísticas finais
  const userCount = await prisma.user.count();
  const streamerCount = await prisma.streamer.count();
  const scoreCount = await prisma.score.count();
  const scheduleCount = await prisma.schedule.count();

  console.log('✅ Seed completo!');
  console.log(`📊 Estatísticas:`);
  console.log(`   👥 Usuários: ${userCount}`);
  console.log(`   🎬 Streamers: ${streamerCount}`);
  console.log(`   📊 Scores: ${scoreCount}`);
  console.log(`   📅 Schedules: ${scheduleCount}`);
  console.log('');
  console.log('🔑 Credenciais de teste:');
  console.log('   Admin: admin@boostteam.com / 123456');
  console.log('   Streamers: [nickname]@streaming.com / 123456');
  console.log('   Viewers: viewer1@test.com, viewer2@test.com / 123456');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
