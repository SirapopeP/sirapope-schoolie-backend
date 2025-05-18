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
          { username: usernameOrEmail }
        ]
      },
      include: {
        profile: true,
        roles: {
          select: {
            role: true
          }
        }
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
      username: user.username
    };
    
    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        roles: user.roles.map(role => role.role),
        profile: user.profile ? {
          id: user.profile.id,
          fullName: user.profile.fullName,
          nickName: user.profile.nickName,
          birthDate: user.profile.birthDate,
          bio: user.profile.bio,
          avatarUrl: user.profile.avatarUrl,
          phoneNumber: user.profile.phoneNumber,
          address: user.profile.address
        } : null
      },
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(registerDto: {
    email: string;
    password: string;
    username: string;
    fullName?: string;
    nickName?: string;
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
        email: registerDto.email,
        username: registerDto.username,
        password: hashedPassword,
        profile: {
          create: {
            fullName: registerDto.fullName,
            nickName: registerDto.nickName
          }
        },
        roles: {
          create: {
            role: 'GUEST'
          }
        }
      },
      include: {
        profile: true,
        roles: true
      }
    });

    const { password, ...result } = user;
    return result;
  }
}