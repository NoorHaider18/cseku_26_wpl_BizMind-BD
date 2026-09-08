import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { User } from './entities/user.entity.js';

const SALT_ROUNDS = 10;

/**
 * In-memory repository for Sprint 1. Swap the internals of this class for a
 * TypeORM/Prisma repository in Sprint 2 — the public method signatures
 * (create/findByEmail/findById/toSafeUser) are the contract the rest of the
 * app depends on, so callers won't need to change.
 */
@Injectable()
export class UsersService {
  private users: User[] = [];

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const user: User = {
      id: randomUUID(),
      businessId: dto.businessId,
      name: dto.name,
      email: dto.email,
      passwordHash: await bcrypt.hash(dto.password, SALT_ROUNDS),
      role: dto.role,
      createdAt: new Date(),
    };

    this.users.push(user);
    return user;
  }

  findAll(): User[] {
    return this.users;
  }

  findById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  findByEmail(email: string): User | undefined {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  async update(id: string, dto: UpdateUserDto): Promise<User | undefined> {
    const user = this.findById(id);
    if (!user) return undefined;
    Object.assign(user, dto);
    return user;
  }

  remove(id: string): boolean {
    const before = this.users.length;
    this.users = this.users.filter((u) => u.id !== id);
    return this.users.length < before;
  }

  /** Strip passwordHash before returning a user in any API response. */
  toSafeUser(user: User) {
    const { passwordHash, ...safe } = user;
    return safe;
  }
}
