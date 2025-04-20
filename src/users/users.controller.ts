import { Controller, Get, Post, Body, Put, Delete, Param, Query, NotFoundException, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { User as UserModel } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ต้องล็อกอินถึงจะดูรายการ users ได้
  @UseGuards(JwtAuthGuard)
  @Get()
  async getUsers(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<UserModel[]> {
    return this.usersService.users({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
    });
  }

  // ต้องล็อกอินถึงจะดูข้อมูล user ได้
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getUserById(@Param('id') id: string): Promise<UserModel> {
    const user = await this.usersService.user({ id: Number(id) });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  // ไม่ต้องใส่ Guard เพราะเป็นการลงทะเบียน
  @Post('register')
  async registerUser(
    @Body() userData: { 
      name?: string; 
      email: string; 
      password: string;
      username: string; // เพิ่ม username
    },
  ): Promise<UserModel> {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      return this.usersService.createUser({
      ...userData,
      password: hashedPassword,
    });
  }

  // ต้องล็อกอินถึงจะแก้ไขข้อมูลได้
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() userData: { name?: string; email?: string },
  ): Promise<UserModel> {
    return this.usersService.updateUser({
      where: { id: Number(id) },
      data: userData,
    });
  }

  // ต้องล็อกอินถึงจะลบข้อมูลได้
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteUser(@Param('id') id: string): Promise<UserModel> {
    return this.usersService.deleteUser({ id: Number(id) });
  }
}