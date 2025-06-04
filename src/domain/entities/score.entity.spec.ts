import { Score } from './score.entity';

describe('Score Entity', () => {
  const mockScoreData = {
    id: 1,
    streamerId: 1,
    points: 100,
    reason: 'Completed stream session',
    createdAt: new Date('2024-01-01'),
  };

  describe('constructor', () => {
    it('deve criar uma instância de Score com todos os parâmetros', () => {
      const score = new Score(
        mockScoreData.id,
        mockScoreData.streamerId,
        mockScoreData.points,
        mockScoreData.reason,
        mockScoreData.createdAt,
      );

      expect(score.id).toBe(mockScoreData.id);
      expect(score.streamerId).toBe(mockScoreData.streamerId);
      expect(score.points).toBe(mockScoreData.points);
      expect(score.reason).toBe(mockScoreData.reason);
      expect(score.createdAt).toBe(mockScoreData.createdAt);
    });

    it('deve criar uma instância de Score sem createdAt', () => {
      const score = new Score(
        mockScoreData.id,
        mockScoreData.streamerId,
        mockScoreData.points,
        mockScoreData.reason,
      );

      expect(score.createdAt).toBeUndefined();
      expect(score.id).toBe(mockScoreData.id);
      expect(score.streamerId).toBe(mockScoreData.streamerId);
      expect(score.points).toBe(mockScoreData.points);
      expect(score.reason).toBe(mockScoreData.reason);
    });

    it('deve criar uma instância de Score com pontos negativos', () => {
      const score = new Score(1, 1, -50, 'Penalty for late stream');

      expect(score.points).toBe(-50);
      expect(score.reason).toBe('Penalty for late stream');
    });

    it('deve criar uma instância de Score com zero pontos', () => {
      const score = new Score(1, 1, 0, 'Neutral action');

      expect(score.points).toBe(0);
      expect(score.reason).toBe('Neutral action');
    });
  });

  describe('isPositive', () => {
    it('deve retornar true para pontos positivos', () => {
      const score = new Score(1, 1, 100, 'Good performance');
      expect(score.isPositive()).toBe(true);
    });

    it('deve retornar true para pontos muito pequenos positivos', () => {
      const score = new Score(1, 1, 1, 'Minimal positive');
      expect(score.isPositive()).toBe(true);
    });

    it('deve retornar false para pontos negativos', () => {
      const score = new Score(1, 1, -50, 'Penalty');
      expect(score.isPositive()).toBe(false);
    });

    it('deve retornar false para zero pontos', () => {
      const score = new Score(1, 1, 0, 'Neutral');
      expect(score.isPositive()).toBe(false);
    });
  });

  describe('isNegative', () => {
    it('deve retornar true para pontos negativos', () => {
      const score = new Score(1, 1, -50, 'Penalty');
      expect(score.isNegative()).toBe(true);
    });

    it('deve retornar true para pontos muito pequenos negativos', () => {
      const score = new Score(1, 1, -1, 'Minimal penalty');
      expect(score.isNegative()).toBe(true);
    });

    it('deve retornar false para pontos positivos', () => {
      const score = new Score(1, 1, 100, 'Good performance');
      expect(score.isNegative()).toBe(false);
    });

    it('deve retornar false para zero pontos', () => {
      const score = new Score(1, 1, 0, 'Neutral');
      expect(score.isNegative()).toBe(false);
    });
  });

  describe('getAbsolutePoints', () => {
    it('deve retornar o valor absoluto de pontos positivos', () => {
      const score = new Score(1, 1, 150, 'Excellent stream');
      expect(score.getAbsolutePoints()).toBe(150);
    });

    it('deve retornar o valor absoluto de pontos negativos', () => {
      const score = new Score(1, 1, -75, 'Late penalty');
      expect(score.getAbsolutePoints()).toBe(75);
    });

    it('deve retornar zero para zero pontos', () => {
      const score = new Score(1, 1, 0, 'Neutral action');
      expect(score.getAbsolutePoints()).toBe(0);
    });

    it('deve retornar o valor absoluto para números decimais positivos', () => {
      const score = new Score(1, 1, 25.5, 'Partial score');
      expect(score.getAbsolutePoints()).toBe(25.5);
    });

    it('deve retornar o valor absoluto para números decimais negativos', () => {
      const score = new Score(1, 1, -33.7, 'Partial penalty');
      expect(score.getAbsolutePoints()).toBe(33.7);
    });
  });

  describe('cenários de uso realistas', () => {
    it('deve validar comportamento para score de conclusão de stream', () => {
      const completionScore = new Score(
        1,
        5,
        200,
        'Stream completed successfully',
        new Date('2024-01-15'),
      );

      expect(completionScore.isPositive()).toBe(true);
      expect(completionScore.isNegative()).toBe(false);
      expect(completionScore.getAbsolutePoints()).toBe(200);
    });

    it('deve validar comportamento para score de penalidade', () => {
      const penaltyScore = new Score(
        2,
        3,
        -100,
        'Stream canceled without notice',
        new Date('2024-01-15'),
      );

      expect(penaltyScore.isPositive()).toBe(false);
      expect(penaltyScore.isNegative()).toBe(true);
      expect(penaltyScore.getAbsolutePoints()).toBe(100);
    });

    it('deve validar comportamento para score neutro', () => {
      const neutralScore = new Score(
        3,
        2,
        0,
        'No action taken',
        new Date('2024-01-15'),
      );

      expect(neutralScore.isPositive()).toBe(false);
      expect(neutralScore.isNegative()).toBe(false);
      expect(neutralScore.getAbsolutePoints()).toBe(0);
    });
  });
});
