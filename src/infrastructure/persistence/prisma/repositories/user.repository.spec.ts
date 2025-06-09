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
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockPrismaUser = {
    id: 1,
    nickname: 'testuser',
    password: 'hashedpassword',
    role: 'USER',
    email: 'test@example.com',
    fullName: 'Test User',
    status: true,
    lastLogin: null,
    refreshToken: null,
    webToken: null,
    windowsToken: null,
    phone: null,
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
        fullName: 'Test User',
        nickname: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: UserRole.USER,
      };
      mockPrismaService.user.create.mockResolvedValue(mockPrismaUser);

      // Act
      const result = await repository.create(userData);

      // Assert
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          fullName: 'Test User',
          nickname: 'testuser',
          email: 'test@example.com',
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
        fullName: 'Admin User',
        nickname: 'admin',
        email: 'admin@example.com',
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

  describe('findByEmail', () => {
    it('deve encontrar um usuário por email', async () => {
      // Arrange
      const userWithEmail = { ...mockPrismaUser, email: 'test@example.com' };
      jest
        .spyOn(prismaService.user, 'findFirst')
        .mockResolvedValue(userWithEmail);

      // Act
      const result = await repository.findByEmail('test@example.com');

      // Assert
      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toBeDefined();
      expect(result!.email).toBe('test@example.com');
    });

    it('deve retornar null quando email não encontrado', async () => {
      // Arrange
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(null);

      // Act
      const result = await repository.findByEmail('inexistente@example.com');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByEmailOrNickname', () => {
    it('deve encontrar um usuário por email', async () => {
      // Arrange
      const userWithEmail = { ...mockPrismaUser, email: 'test@example.com' };
      jest
        .spyOn(prismaService.user, 'findFirst')
        .mockResolvedValue(userWithEmail);

      // Act
      const result = await repository.findByEmailOrNickname('test@example.com');

      // Assert
      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ email: 'test@example.com' }, { nickname: 'test@example.com' }],
        },
      });
      expect(result).toBeDefined();
    });

    it('deve encontrar um usuário por nickname', async () => {
      // Arrange
      jest
        .spyOn(prismaService.user, 'findFirst')
        .mockResolvedValue(mockPrismaUser);

      // Act
      const result = await repository.findByEmailOrNickname('testuser');

      // Assert
      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ email: 'testuser' }, { nickname: 'testuser' }],
        },
      });
      expect(result).toBeDefined();
    });

    it('deve retornar null quando não encontrado', async () => {
      // Arrange
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(null);

      // Act
      const result = await repository.findByEmailOrNickname('inexistente');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('updateLastLogin', () => {
    it('deve atualizar o último login do usuário', async () => {
      // Arrange
      const updatedUser = {
        ...mockPrismaUser,
        lastLogin: new Date('2024-01-15'),
      };
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(updatedUser);

      // Act
      const result = await repository.updateLastLogin(1);

      // Assert
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          lastLogin: expect.any(Date),
        },
      });
      expect(result.lastLogin).toEqual(new Date('2024-01-15'));
    });
  });

  describe('updatePassword', () => {
    it('deve atualizar a senha do usuário', async () => {
      // Arrange
      const updatedUser = { ...mockPrismaUser, password: 'newhashedpassword' };
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(updatedUser);

      // Act
      const result = await repository.updatePassword(1, 'newhashedpassword');

      // Assert
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          password: 'newhashedpassword',
        },
      });
      expect(result.password).toBe('newhashedpassword');
    });
  });

  describe('updateProfile', () => {
    it('deve atualizar o perfil do usuário', async () => {
      // Arrange
      const profileData = {
        fullName: 'Updated Name',
        nickname: 'updateduser',
        email: 'updated@example.com',
        phone: '123456789',
      };
      const updatedUser = { ...mockPrismaUser, ...profileData };
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(updatedUser);

      // Act
      const result = await repository.updateProfile(1, profileData);

      // Assert
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          fullName: 'Updated Name',
          nickname: 'updateduser',
          email: 'updated@example.com',
          phone: '123456789',
        },
      });
      expect(result.fullName).toBe('Updated Name');
    });

    it('deve atualizar apenas campos fornecidos', async () => {
      // Arrange
      const profileData = { fullName: 'Only Name Updated' };
      const updatedUser = { ...mockPrismaUser, fullName: 'Only Name Updated' };
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(updatedUser);

      // Act
      const result = await repository.updateProfile(1, profileData);

      // Assert
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          fullName: 'Only Name Updated',
          nickname: undefined,
          email: undefined,
          phone: undefined,
        },
      });
      expect(result.fullName).toBe('Only Name Updated');
    });
  });

  describe('findUsersWithLogin', () => {
    it('deve encontrar usuários com último login', async () => {
      // Arrange
      const usersWithLogin = [
        { ...mockPrismaUser, lastLogin: new Date('2024-01-15') },
        {
          ...mockPrismaUser,
          id: 2,
          nickname: 'user2',
          lastLogin: new Date('2024-01-14'),
        },
      ];
      jest
        .spyOn(prismaService.user, 'findMany')
        .mockResolvedValue(usersWithLogin);

      // Act
      const result = await repository.findUsersWithLogin(10, 0);

      // Assert
      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        where: {
          lastLogin: {
            not: null,
          },
        },
        orderBy: {
          lastLogin: 'desc',
        },
        take: 10,
        skip: 0,
      });
      expect(result).toHaveLength(2);
      expect(result[0].lastLogin).toEqual(new Date('2024-01-15'));
    });

    it('deve aplicar limit e offset corretamente', async () => {
      // Arrange
      jest.spyOn(prismaService.user, 'findMany').mockResolvedValue([]);

      // Act
      await repository.findUsersWithLogin(5, 10);

      // Assert
      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        where: {
          lastLogin: {
            not: null,
          },
        },
        orderBy: {
          lastLogin: 'desc',
        },
        take: 5,
        skip: 10,
      });
    });
  });

  describe('countUsersWithLogin', () => {
    it('deve contar usuários com último login', async () => {
      // Arrange
      jest.spyOn(prismaService.user, 'count').mockResolvedValue(15);

      // Act
      const result = await repository.countUsersWithLogin();

      // Assert
      expect(prismaService.user.count).toHaveBeenCalledWith({
        where: {
          lastLogin: {
            not: null,
          },
        },
      });
      expect(result).toBe(15);
    });

    it('deve retornar zero quando não há usuários com login', async () => {
      // Arrange
      jest.spyOn(prismaService.user, 'count').mockResolvedValue(0);

      // Act
      const result = await repository.countUsersWithLogin();

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('existsByEmail', () => {
    it('deve retornar true quando email existe', async () => {
      // Arrange
      jest
        .spyOn(prismaService.user, 'findFirst')
        .mockResolvedValue({ id: 1 } as any);

      // Act
      const result = await repository.existsByEmail('test@example.com');

      // Assert
      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: { id: true },
      });
      expect(result).toBe(true);
    });

    it('deve retornar false quando email não existe', async () => {
      // Arrange
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(null);

      // Act
      const result = await repository.existsByEmail('inexistente@example.com');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('toDomain', () => {
    it('deve converter dados do Prisma para entidade de domínio corretamente', async () => {
      // Arrange
      const userData = {
        fullName: 'Test User',
        nickname: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: UserRole.USER,
      };
      jest
        .spyOn(prismaService.user, 'create')
        .mockResolvedValue(mockPrismaUser);

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

    it('deve converter corretamente com todos os campos preenchidos', async () => {
      // Arrange
      const fullPrismaUser = {
        ...mockPrismaUser,
        email: 'test@example.com',
        fullName: 'Test User',
        refreshToken: 'refresh-123',
        webToken: 'web-456',
        windowsToken: 'windows-789',
        lastLogin: new Date('2024-01-10'),
        phone: '123456789',
      };
      jest
        .spyOn(prismaService.user, 'create')
        .mockResolvedValue(fullPrismaUser);

      // Act
      const result = await repository.create({
        fullName: 'Test User',
        nickname: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: UserRole.USER,
      });

      // Assert
      expect(result.email).toBe('test@example.com');
      expect(result.fullName).toBe('Test User');
      expect(result.refreshToken).toBe('refresh-123');
      expect(result.webToken).toBe('web-456');
      expect(result.windowsToken).toBe('windows-789');
      expect(result.lastLogin).toEqual(new Date('2024-01-10'));
    });
  });
});
