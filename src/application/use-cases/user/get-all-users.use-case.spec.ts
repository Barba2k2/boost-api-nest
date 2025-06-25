import { IUserRepository } from '@application/ports/repositories/user.repository.interface';
import { User, UserRole } from '@domain/entities/user.entity';
import { GetAllUsersUseCase } from './get-all-users.use-case';

describe('GetAllUsersUseCase', () => {
  let useCase: GetAllUsersUseCase;
  let userRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    userRepository = {
      findAll: jest.fn(),
      // outros métodos mockados se necessário
    } as any;
    useCase = new GetAllUsersUseCase(userRepository);
  });

  it('deve retornar todos os usuários', async () => {
    const users: User[] = [
      new User(1, 'nick1', 'pass', UserRole.USER, 'email1', 'Nome 1', true),
      new User(2, 'nick2', 'pass', UserRole.ADMIN, 'email2', 'Nome 2', true),
    ];
    userRepository.findAll.mockResolvedValue(users);
    const result = await useCase.execute();
    expect(result).toEqual(users);
    expect(userRepository.findAll).toHaveBeenCalled();
  });
});
