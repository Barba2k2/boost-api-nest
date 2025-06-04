import { UserRole } from '@domain/entities/user.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../../prisma/prisma.service';
import { UserRepository } from './user.repository';

describe('UserRepository', () => {
  let repository: UserRepository;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockPrismaUser = {
    id: 1,
    nickname: 'testuser',
    password: 'hashedpassword',
    role: 'USER',
    refreshToken: null,
    webToken: null,
    windowsToken: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar um usuário com sucesso', async () => {
      // Arrange
      const userData = {
        nickname: 'testuser',
        password: 'hashedpassword',
        role: UserRole.USER,
      };
      mockPrismaService.user.create.mockResolvedValue(mockPrismaUser);

      // Act
      const result = await repository.create(userData);

      // Assert
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          nickname: 'testuser',
          password: 'hashedpassword',
          role: UserRole.USER,
        },
      });
      expect(result.id).toBe(1);
      expect(result.nickname).toBe('testuser');
      expect(result.role).toBe('USER'); // Valor do banco é string uppercase
    });

    it('deve criar um usuário com role ADMIN', async () => {
      // Arrange
      const userData = {
        nickname: 'admin',
        password: 'hashedpassword',
        role: UserRole.ADMIN,
      };
      const mockAdminUser = { ...mockPrismaUser, role: 'ADMIN' };
      mockPrismaService.user.create.mockResolvedValue(mockAdminUser);

      // Act
      const result = await repository.create(userData);

      // Assert
      expect(result.role).toBe('ADMIN'); // Valor do banco é string uppercase
    });
  });

  describe('findById', () => {
    it('deve encontrar um usuário por ID', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(mockPrismaUser);

      // Act
      const result = await repository.findById(1);

      // Assert
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toBeDefined();
      expect(result!.id).toBe(1);
    });

    it('deve retornar null quando usuário não encontrado', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await repository.findById(999);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByNickname', () => {
    it('deve encontrar um usuário por nickname', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(mockPrismaUser);

      // Act
      const result = await repository.findByNickname('testuser');

      // Assert
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { nickname: 'testuser' },
      });
      expect(result).toBeDefined();
      expect(result!.nickname).toBe('testuser');
    });

    it('deve retornar null quando nickname não encontrado', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await repository.findByNickname('inexistente');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('updateTokens', () => {
    it('deve atualizar os tokens do usuário', async () => {
      // Arrange
      const tokens = {
        refreshToken: 'refresh-token-123',
        webToken: 'web-token-456',
        windowsToken: 'windows-token-789',
      };
      const updatedUser = { ...mockPrismaUser, ...tokens };
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      // Act
      const result = await repository.updateTokens(1, tokens);

      // Assert
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          refreshToken: 'refresh-token-123',
          webToken: 'web-token-456',
          windowsToken: 'windows-token-789',
        },
      });
      expect(result.refreshToken).toBe('refresh-token-123');
      expect(result.webToken).toBe('web-token-456');
      expect(result.windowsToken).toBe('windows-token-789');
    });

    it('deve atualizar apenas alguns tokens', async () => {
      // Arrange
      const tokens = { refreshToken: 'new-refresh-token' };
      const updatedUser = {
        ...mockPrismaUser,
        refreshToken: 'new-refresh-token',
      };
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      // Act
      const result = await repository.updateTokens(1, tokens);

      // Assert
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          refreshToken: 'new-refresh-token',
          webToken: undefined,
          windowsToken: undefined,
        },
      });
      expect(result.refreshToken).toBe('new-refresh-token');
    });
  });

  describe('existsByNickname', () => {
    it('deve retornar true quando usuário existe', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 1 });

      // Act
      const result = await repository.existsByNickname('testuser');

      // Assert
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { nickname: 'testuser' },
        select: { id: true },
      });
      expect(result).toBe(true);
    });

    it('deve retornar false quando usuário não existe', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await repository.existsByNickname('inexistente');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('toDomain', () => {
    it('deve converter dados do Prisma para entidade de domínio corretamente', async () => {
      // Arrange
      const userData = {
        nickname: 'testuser',
        password: 'hashedpassword',
        role: UserRole.USER,
      };
      mockPrismaService.user.create.mockResolvedValue(mockPrismaUser);

      // Act
      const result = await repository.create(userData);

      // Assert
      expect(result.id).toBe(1);
      expect(result.nickname).toBe('testuser');
      expect(result.password).toBe('hashedpassword');
      expect(result.role).toBe('USER'); // Valor do banco é string uppercase
      expect(result.refreshToken).toBeNull();
      expect(result.webToken).toBeNull();
      expect(result.windowsToken).toBeNull();
      expect(result.createdAt).toEqual(new Date('2024-01-01'));
      expect(result.updatedAt).toEqual(new Date('2024-01-01'));
    });
  });
});
