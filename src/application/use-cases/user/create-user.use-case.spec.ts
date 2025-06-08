import {
  IStreamerRepository,
  STREAMER_REPOSITORY_TOKEN,
} from '@application/ports/repositories/streamer.repository.interface';
import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '@application/ports/repositories/user.repository.interface';
import { User, UserRole } from '@domain/entities/user.entity';
import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateUserCommand, CreateUserUseCase } from './create-user.use-case';

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let userRepository: jest.Mocked<IUserRepository>;
  let streamerRepository: jest.Mocked<IStreamerRepository>;

  const mockUserRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByNickname: jest.fn(),
    updateTokens: jest.fn(),
    existsByNickname: jest.fn(),
    existsByEmail: jest.fn(),
  };

  const mockStreamerRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    addPoints: jest.fn(),
    updateOnlineStatus: jest.fn(),
    findOnlineStreamers: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUserUseCase,
        {
          provide: USER_REPOSITORY_TOKEN,
          useValue: mockUserRepository,
        },
        {
          provide: STREAMER_REPOSITORY_TOKEN,
          useValue: mockStreamerRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateUserUseCase>(CreateUserUseCase);
    userRepository = module.get(USER_REPOSITORY_TOKEN);
    streamerRepository = module.get(STREAMER_REPOSITORY_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validCommand: CreateUserCommand = {
      fullName: 'Test User',
      nickname: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword',
      role: UserRole.USER,
    };

    const mockUser = new User(
      1,
      'testuser',
      'hashedpassword',
      UserRole.USER,
      'test@example.com',
      'Test User',
    );

    it('deve criar um usuário USER e também um streamer', async () => {
      // Arrange
      userRepository.existsByNickname.mockResolvedValue(false);
      userRepository.existsByEmail.mockResolvedValue(false);
      userRepository.create.mockResolvedValue(mockUser);
      streamerRepository.create.mockResolvedValue({} as any);

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(userRepository.existsByNickname).toHaveBeenCalledWith('testuser');
      expect(userRepository.create).toHaveBeenCalledWith(validCommand);
      expect(result).toEqual(mockUser);
      expect(streamerRepository.create).toHaveBeenCalledWith({
        userId: 1,
        points: 0,
        platforms: [],
        streamDays: [],
      });
    });

    it('deve criar um usuário ADMIN e também um streamer', async () => {
      // Arrange
      const adminCommand = { ...validCommand, role: UserRole.ADMIN };
      const adminUser = new User(
        1,
        'testuser',
        'hashedpassword',
        UserRole.ADMIN,
        'test@example.com',
        'Test User',
      );

      userRepository.existsByNickname.mockResolvedValue(false);
      userRepository.existsByEmail.mockResolvedValue(false);
      userRepository.create.mockResolvedValue(adminUser);
      streamerRepository.create.mockResolvedValue({} as any);

      // Act
      const result = await useCase.execute(adminCommand);

      // Assert
      expect(userRepository.existsByNickname).toHaveBeenCalledWith('testuser');
      expect(userRepository.create).toHaveBeenCalledWith(adminCommand);
      expect(result).toEqual(adminUser);
      expect(streamerRepository.create).toHaveBeenCalledWith({
        userId: 1,
        points: 0,
        platforms: [],
        streamDays: [],
      });
    });

    it('deve criar apenas usuário ASSISTANT sem streamer', async () => {
      // Arrange
      const assistantCommand = { ...validCommand, role: UserRole.ASSISTANT };
      const assistantUser = new User(
        1,
        'testuser',
        'hashedpassword',
        UserRole.ASSISTANT,
        'test@example.com',
        'Test User',
      );

      userRepository.existsByNickname.mockResolvedValue(false);
      userRepository.existsByEmail.mockResolvedValue(false);
      userRepository.create.mockResolvedValue(assistantUser);

      // Act
      const result = await useCase.execute(assistantCommand);

      // Assert
      expect(userRepository.existsByNickname).toHaveBeenCalledWith('testuser');
      expect(userRepository.create).toHaveBeenCalledWith(assistantCommand);
      expect(streamerRepository.create).not.toHaveBeenCalled();
      expect(result).toEqual(assistantUser);
    });

    it('deve lançar ConflictException quando usuário já existe', async () => {
      // Arrange
      userRepository.existsByNickname.mockResolvedValue(true);
      userRepository.existsByEmail.mockResolvedValue(false);

      // Act & Assert
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        new ConflictException('Nickname já está em uso'),
      );

      expect(userRepository.existsByNickname).toHaveBeenCalledWith('testuser');
      expect(userRepository.create).not.toHaveBeenCalled();
      expect(streamerRepository.create).not.toHaveBeenCalled();
    });
  });
});
