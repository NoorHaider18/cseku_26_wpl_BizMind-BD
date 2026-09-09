import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return this.usersService.toSafeUser(user);
  }

  @Get()
  findAll() {
    return this.usersService.findAll().map((u) => this.usersService.toSafeUser(u));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const user = this.usersService.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return this.usersService.toSafeUser(user);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(id, updateUserDto);
    if (!user) throw new NotFoundException('User not found');
    return this.usersService.toSafeUser(user);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    const removed = this.usersService.remove(id);
    if (!removed) throw new NotFoundException('User not found');
    return { deleted: true };
  }
}
