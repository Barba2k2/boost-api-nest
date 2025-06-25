import { Streamer } from './streamer.entity';

describe('Streamer Entity', () => {
  describe('constructor', () => {
    it('deve criar um streamer com parâmetros básicos', () => {
      const streamer = new Streamer(
        1,
        1,
        100,
        ['twitch'],
        ['monday', 'friday'],
      );

      expect(streamer.id).toBe(1);
      expect(streamer.userId).toBe(1);
      expect(streamer.points).toBe(100);
      expect(streamer.platforms).toEqual(['twitch']);
      expect(streamer.streamDays).toEqual(['monday', 'friday']);
    });
  });

  describe('addPoints', () => {
    it('deve retornar pontos adicionados', () => {
      const streamer = new Streamer(1, 1, 100, [], []);
      const newPoints = streamer.addPoints(50);
      expect(newPoints).toBe(150);
      expect(streamer.points).toBe(100); // Original não muda
    });

    it('deve adicionar pontos negativos', () => {
      const streamer = new Streamer(1, 1, 100, [], []);
      const newPoints = streamer.addPoints(-30);
      expect(newPoints).toBe(70);
    });
  });

  describe('addPlatform', () => {
    it('deve retornar nova array com plataforma adicionada', () => {
      const streamer = new Streamer(1, 1, 100, [], []);
      const newPlatforms = streamer.addPlatform('twitch');
      expect(newPlatforms).toEqual(['twitch']);
      expect(streamer.platforms).toEqual([]); // Original não muda
    });

    it('não deve adicionar plataforma duplicada', () => {
      const streamer = new Streamer(1, 1, 100, ['twitch'], []);
      const newPlatforms = streamer.addPlatform('twitch');
      expect(newPlatforms).toEqual(['twitch']);
    });
  });

  describe('addStreamDay', () => {
    it('deve retornar nova array com dia adicionado', () => {
      const streamer = new Streamer(1, 1, 100, [], []);
      const newDays = streamer.addStreamDay('monday');
      expect(newDays).toEqual(['monday']);
      expect(streamer.streamDays).toEqual([]); // Original não muda
    });

    it('não deve adicionar dia duplicado', () => {
      const streamer = new Streamer(1, 1, 100, [], ['monday']);
      const newDays = streamer.addStreamDay('monday');
      expect(newDays).toEqual(['monday']);
    });
  });

  describe('removePlatform', () => {
    it('deve remover plataforma existente', () => {
      const streamer = new Streamer(1, 1, 100, ['twitch', 'youtube'], []);
      const newPlatforms = streamer.removePlatform('twitch');
      expect(newPlatforms).toEqual(['youtube']);
    });

    it('deve retornar array inalterada se plataforma não existe', () => {
      const streamer = new Streamer(1, 1, 100, ['twitch'], []);
      const newPlatforms = streamer.removePlatform('youtube');
      expect(newPlatforms).toEqual(['twitch']);
    });
  });

  describe('removeStreamDay', () => {
    it('deve remover dia existente', () => {
      const streamer = new Streamer(1, 1, 100, [], ['monday', 'friday']);
      const newDays = streamer.removeStreamDay('monday');
      expect(newDays).toEqual(['friday']);
    });

    it('deve retornar array inalterada se dia não existe', () => {
      const streamer = new Streamer(1, 1, 100, [], ['monday']);
      const newDays = streamer.removeStreamDay('friday');
      expect(newDays).toEqual(['monday']);
    });
  });
});
