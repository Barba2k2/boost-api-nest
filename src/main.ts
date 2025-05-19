import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuração global de validação de pipes
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Configuração CORS
  app.enableCors();

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('Boost Twitch API')
    .setDescription('API para gerenciamento de streamers na plataforma Twitch')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Configuração do Prisma para lidar corretamente com o desligamento da aplicação
  const prismaService = app.get(PrismaService);
  prismaService.enableShutdownHooks(app);

  // Inicialização do servidor
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Aplicação rodando na porta ${port}`);
}
void bootstrap();
