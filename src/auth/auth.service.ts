import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(usernameOrEmail: string, password: string) {
    // ค้นหา user จาก email หรือ username
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: usernameOrEmail },
          { username: usernameOrEmail } // ต้องเพิ่ม field username ใน schema ก่อน
        ]
      }
    });

    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { 
      email: user.email, 
      sub: user.id,
      username: user.username // เพิ่ม username ใน payload
    };
    
    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name
      },
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(registerDto: {
    email: string;
    password: string;
    username: string;
    name?: string;
  }) {
    // เช็คว่ามี email หรือ username ซ้ำไหม
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: registerDto.email },
          { username: registerDto.username }
        ]
      }
    });

    if (existingUser) {
      throw new UnauthorizedException(
        existingUser.email === registerDto.email 
          ? 'Email already exists' 
          : 'Username already exists'
      );
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        ...registerDto,
        password: hashedPassword,
      },
    });

    const { password, ...result } = user;
    return result;
  }
}