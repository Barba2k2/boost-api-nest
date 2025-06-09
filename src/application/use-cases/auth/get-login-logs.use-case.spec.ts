import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '@application/ports/repositories/user.repository.interface';
import { User, UserRole } from '@domain/entities/user.entity';
import { Test, TestingModule } from '@nestjs/testing';
import {
  GetLoginLogsQuery,
  GetLoginLogsUseCase,
} from './get-login-logs.use-case';

describe('GetLoginLogsUseCase', () => {
  let useCase: GetLoginLogsUseCase;
  let userRepository: jest.Mocked<IUserRepository>;

  const mockUserRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByNickname: jest.fn(),
    findByEmail: jest.fn(),
    findByEmailOrNickname: jest.fn(),
    updateTokens: jest.fn(),
    updateLastLogin: jest.fn(),
    updatePassword: jest.fn(),
    updateProfile: jest.fn(),
    existsByNickname: jest.fn(),
    existsByEmail: jest.fn(),
    findUsersWithLogin: jest.fn(),
    countUsersWithLogin: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetLoginLogsUseCase,
        {
          provide: USER_REPOSITORY_TOKEN,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetLoginLogsUseCase>(GetLoginLogsUseCase);
    userRepository = module.get(USER_REPOSITORY_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockUsers = [
      new User(
        1,
        'user1',
        'password1',
        UserRole.USER,
        'user1@example.com',
        'User One',
        undefined,
        undefined,
        undefined,
        new Date('2024-01-01T10:00:00Z'),
        new Date('2024-01-01T09:00:00Z'),
        new Date('2024-01-01T10:00:00Z'), // lastLogin
      ),
      new User(
        2,
        'admin1',
        'password2',
        UserRole.ADMIN,
        'admin1@example.com',
        'Admin One',
        undefined,
        undefined,
        undefined,
        new Date('2024-01-02T11:00:00Z'),
        new Date('2024-01-02T10:00:00Z'),
        new Date('2024-01-02T11:00:00Z'), // lastLogin
      ),
      new User(
        3,
        'assistant1',
        'password3',
        UserRole.ASSISTANT,
        'assistant1@example.com',
        'Assistant One',
        undefined,
        undefined,
        undefined,
        new Date('2024-01-03T12:00:00Z'),
        new Date('2024-01-03T11:00:00Z'),
        new Date('2024-01-03T12:00:00Z'), // lastLogin
      ),
    ];

    it('deve retornar logs de login com parâmetros padrão', async () => {
      // Arrange
      userRepository.findUsersWithLogin.mockResolvedValue(mockUsers);
      userRepository.countUsersWithLogin.mockResolvedValue(150);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(userRepository.findUsersWithLogin).toHaveBeenCalledWith(50, 0);
      expect(userRepository.countUsersWithLogin).toHaveBeenCalled();

      expect(result.total).toBe(150);
      expect(result.logs).toHaveLength(3);

      expect(result.logs[0]).toEqual({
        userId: 1,
        nickname: 'user1',
        role: UserRole.USER,
        lastLogin: new Date('2024-01-01T10:00:00Z'),
      });

      expect(result.logs[1]).toEqual({
        userId: 2,
        nickname: 'admin1',
        role: UserRole.ADMIN,
        lastLogin: new Date('2024-01-02T11:00:00Z'),
      });

      expect(result.logs[2]).toEqual({
        userId: 3,
        nickname: 'assistant1',
        role: UserRole.ASSISTANT,
        lastLogin: new Date('2024-01-03T12:00:00Z'),
      });
    });

    it('deve retornar logs com limit e offset personalizados', async () => {
      // Arrange
      const query: GetLoginLogsQuery = {
        limit: 10,
        offset: 20,
      };

      userRepository.findUsersWithLogin.mockResolvedValue(
        mockUsers.slice(0, 2),
      );
      userRepository.countUsersWithLogin.mockResolvedValue(100);

      // Act
      const result = await useCase.execute(query);

      // Assert
      expect(userRepository.findUsersWithLogin).toHaveBeenCalledWith(10, 20);
      expect(userRepository.countUsersWithLogin).toHaveBeenCalled();

      expect(result.total).toBe(100);
      expect(result.logs).toHaveLength(2);
    });

    it('deve retornar lista vazia quando não há usuários com login', async () => {
      // Arrange
      userRepository.findUsersWithLogin.mockResolvedValue([]);
      userRepository.countUsersWithLogin.mockResolvedValue(0);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(userRepository.findUsersWithLogin).toHaveBeenCalledWith(50, 0);
      expect(userRepository.countUsersWithLogin).toHaveBeenCalled();

      expect(result.total).toBe(0);
      expect(result.logs).toHaveLength(0);
    });

    it('deve funcionar apenas com limit personalizado', async () => {
      // Arrange
      const query: GetLoginLogsQuery = {
        limit: 100,
      };

      userRepository.findUsersWithLogin.mockResolvedValue(mockUsers);
      userRepository.countUsersWithLogin.mockResolvedValue(3);

      // Act
      const result = await useCase.execute(query);

      // Assert
      expect(userRepository.findUsersWithLogin).toHaveBeenCalledWith(100, 0);
      expect(userRepository.countUsersWithLogin).toHaveBeenCalled();

      expect(result.total).toBe(3);
      expect(result.logs).toHaveLength(3);
    });

    it('deve funcionar apenas com offset personalizado', async () => {
      // Arrange
      const query: GetLoginLogsQuery = {
        offset: 25,
      };

      userRepository.findUsersWithLogin.mockResolvedValue(mockUsers);
      userRepository.countUsersWithLogin.mockResolvedValue(75);

      // Act
      const result = await useCase.execute(query);

      // Assert
      expect(userRepository.findUsersWithLogin).toHaveBeenCalledWith(50, 25);
      expect(userRepository.countUsersWithLogin).toHaveBeenCalled();

      expect(result.total).toBe(75);
      expect(result.logs).toHaveLength(3);
    });

    it('deve mapear corretamente os dados do usuário para log entry', async () => {
      // Arrange
      const singleUser = [mockUsers[0]];
      userRepository.findUsersWithLogin.mockResolvedValue(singleUser);
      userRepository.countUsersWithLogin.mockResolvedValue(1);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.logs[0]).toEqual({
        userId: mockUsers[0].id,
        nickname: mockUsers[0].nickname,
        role: mockUsers[0].role,
        lastLogin: mockUsers[0].lastLogin,
      });
    });

    it('deve lidar com limit zero', async () => {
      // Arrange
      const query: GetLoginLogsQuery = {
        limit: 0,
      };

      userRepository.findUsersWithLogin.mockResolvedValue([]);
      userRepository.countUsersWithLogin.mockResolvedValue(100);

      // Act
      const result = await useCase.execute(query);

      // Assert
      expect(userRepository.findUsersWithLogin).toHaveBeenCalledWith(0, 0);
      expect(result.total).toBe(100);
      expect(result.logs).toHaveLength(0);
    });

    it('deve usar valores padrão quando query é undefined', async () => {
      // Arrange
      userRepository.findUsersWithLogin.mockResolvedValue(mockUsers);
      userRepository.countUsersWithLogin.mockResolvedValue(3);

      // Act
      const result = await useCase.execute(undefined);

      // Assert
      expect(userRepository.findUsersWithLogin).toHaveBeenCalledWith(50, 0);
      expect(result.logs).toHaveLength(3);
    });
  });
});
