import { ValidateUserUseCase } from '@application/use-cases/auth/validate-user.use-case';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private validateUserUseCase: ValidateUserUseCase) {
    super({ usernameField: 'nickname' });
  }

  async validate(emailOrNickname: string, password: string): Promise<any> {
    const user = await this.validateUserUseCase.execute({
      emailOrNickname,
      password,
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
