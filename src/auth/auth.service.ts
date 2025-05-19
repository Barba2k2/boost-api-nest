import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
// import { LoginDto } from './dto/login.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ConfirmLoginDto } from './dto/confirm-login.dto';
import { StreamersService } from '../streamers/streamers.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private streamersService: StreamersService,
  ) {}

  async validateUser(nickname: string, password: string): Promise<any> {
    const user = await this.usersService.findByNickname(nickname);

    if (!user) {
      throw new UnauthorizedException(
        'Usuário não encontrado ou senha inválida',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Usuário não encontrado ou senha inválida',
      );
    }

    const { ...result } = user;
    return result;
  }

  async register(registerDto: RegisterDto): Promise<any> {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const newUser = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    // Certifique-se de que a senha não seja retornada
    const { ...result } = newUser;
    return result;
  }

  async login(user: any): Promise<TokenResponseDto> {
    const streamerId = user.streamer?.id || null;

    // Se o usuário for um streamer, atualize o status para online
    if (streamerId) {
      await this.streamersService.updateStatus(streamerId, true);
    }

    const payload = {
      sub: user.id,
      nickname: user.nickname,
      role: user.role,
      streamerId: streamerId,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async confirmLogin(
    userId: number,
    dto: ConfirmLoginDto,
  ): Promise<TokenResponseDto> {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const streamerId = user.streamer?.id || null;

    const payload = {
      sub: user.id,
      nickname: user.nickname,
      role: user.role,
      streamerId: streamerId,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(
      { sub: user.id, role: user.role },
      { expiresIn: '20d' },
    );

    // Atualize os tokens do usuário
    await this.usersService.updateTokens(userId, {
      refreshToken,
      webToken: dto.web_token,
      windowsToken: dto.windows_token,
    });

    // Se o usuário for um streamer e não estiver com status ativo, atualize para ativo
    if (streamerId) {
      await this.streamersService.updateStatus(streamerId, true);
    }

    return {
      access_token: `Bearer ${accessToken}`,
      refresh_token: `Bearer ${refreshToken}`,
    };
  }

  async refreshToken(
    userId: number,
    dto: RefreshTokenDto,
  ): Promise<TokenResponseDto> {
    try {
      // Remover o prefixo 'Bearer ' do token
      const refreshToken = dto.refresh_token.replace('Bearer ', '');

      // Verificar se o token é válido
      const decoded = this.jwtService.verify(refreshToken);

      if (decoded.sub !== userId) {
        throw new UnauthorizedException('Token inválido');
      }

      const user = await this.usersService.findById(userId);
      const streamerId = user.streamer?.id || null;

      const payload = {
        sub: user.id,
        nickname: user.nickname,
        role: user.role,
        streamerId: streamerId,
      };

      const newAccessToken = this.jwtService.sign(payload);
      const newRefreshToken = this.jwtService.sign(
        { sub: user.id, role: user.role },
        { expiresIn: '20d' },
      );

      // Atualize o refresh token do usuário
      await this.usersService.updateTokens(userId, {
        refreshToken: newRefreshToken,
      });

      return {
        access_token: `Bearer ${newAccessToken}`,
        refresh_token: `Bearer ${newRefreshToken}`,
      };
    } catch (error) {
      console.error('Erro ao verificar o token:', error);
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }
}
