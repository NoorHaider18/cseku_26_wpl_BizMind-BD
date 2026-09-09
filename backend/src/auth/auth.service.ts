import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: string;
  businessId: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.usersService.create(dto);
    return this.buildAuthResponse(user.id, user.email, user.role, user.businessId, user.name);
  }

  async login(dto: LoginDto) {
    const user = this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildAuthResponse(user.id, user.email, user.role, user.businessId, user.name);
  }

  private buildAuthResponse(
    id: string,
    email: string,
    role: string,
    businessId: string,
    name: string,
  ) {
    const payload: JwtPayload = { sub: id, email, role, businessId };
    return {
      accessToken: this.jwtService.sign(payload),
      user: { id, email, role, businessId, name },
    };
  }
}
