import { ScoreReportResult } from '@application/use-cases/streamer/get-score-report.use-case';
import { ApiProperty } from '@nestjs/swagger';

export class ScoreEntryDto {
  @ApiProperty({ example: 1, description: 'ID do score' })
  id: number;

  @ApiProperty({ example: 10, description: 'Quantidade de pontos' })
  points: number;

  @ApiProperty({
    example: '2025-01-07T18:25:32Z',
    description: 'Data e hora do registro',
  })
  date: Date;

  @ApiProperty({ example: 18, description: 'Hora do registro (0-23)' })
  hour: number;

  @ApiProperty({ example: 25, description: 'Minuto do registro (0-59)' })
  minute: number;
}

export class ScoreReportResponseDto {
  @ApiProperty({ example: 750, description: 'Total de pontos no período' })
  totalPoints: number;

  @ApiProperty({ example: 5476314, description: 'Sequencial do relatório' })
  reportId: number;

  @ApiProperty({ example: 'aggeotv', description: 'Nickname do streamer' })
  nickname: string;

  @ApiProperty({ example: 'novais86', description: 'Lista A' })
  listaA: string;

  @ApiProperty({ example: 'millastorm', description: 'Lista B' })
  listaB: string;

  @ApiProperty({
    example: '2025-01-07T18:25:32Z',
    description: 'Data/hora do registro',
  })
  registrationDate: Date;

  @ApiProperty({
    type: [ScoreEntryDto],
    description: 'Detalhes dos scores no período',
  })
  scores: ScoreEntryDto[];

  @ApiProperty({
    example: '2025-01-01T00:00:00Z',
    description: 'Data de início do período',
  })
  startDate: Date;

  @ApiProperty({
    example: '2025-01-07T23:59:59Z',
    description: 'Data de fim do período',
  })
  endDate: Date;

  static fromDomain(result: ScoreReportResult): ScoreReportResponseDto {
    const dto = new ScoreReportResponseDto();

    dto.totalPoints = result.totalPoints;
    dto.reportId = Math.floor(Math.random() * 9999999); // Gerar ID sequencial
    dto.nickname = result.nickname;
    dto.listaA = 'novais86'; // Valores fixos por enquanto
    dto.listaB = 'millastorm'; // Valores fixos por enquanto
    dto.registrationDate = result.registrationDate;
    dto.startDate = result.startDate;
    dto.endDate = result.endDate;

    dto.scores = result.scores.map((score) => ({
      id: score.id,
      points: score.points,
      date: score.date,
      hour: score.hour,
      minute: score.minute,
    }));

    return dto;
  }
}
