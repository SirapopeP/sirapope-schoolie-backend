import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async user(where: Prisma.UserWhereUniqueInput): Promise<User | null> {
    return this.prisma.user.findUnique({ where });
  }

  async users(params: {
    skip?: number;
    take?: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<User[]> {
    const { skip, take, where, orderBy } = params;
    return this.prisma.user.findMany({
      skip,
      take,
      where,
      orderBy,
    });
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async updateUser(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const { where, data } = params;
    return this.prisma.user.update({
      data,
      where,
    });
  }

  async deleteUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.delete({ where });
  }

  async findUserByEmailOrUsername(emailOrUsername: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrUsername },
          { username: emailOrUsername }
        ]
      }
    });
  }

  async initiatePasswordChange(emailOrUsername: string): Promise<{ 
    token: string;
    userId: string;
  }> {
    // ค้นหาผู้ใช้
    const user = await this.findUserByEmailOrUsername(emailOrUsername);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // สร้าง token สำหรับยืนยันการเปลี่ยนรหัสผ่าน (หมดอายุใน 1 ชั่วโมง)
    const token = await bcrypt.hash(user.email + Date.now().toString(), 10);
    
    // บันทึก token ลงในฐานข้อมูล
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpires: new Date(Date.now() + 3600000) // 1 hour
      }
    });

    return {
      token,
      userId: user.id
    };
  }

  async confirmPasswordChange(
    userId: string, 
    token: string, 
    newPassword: string
  ): Promise<User> {
    // ค้นหาผู้ใช้และตรวจสอบ token
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired password reset token');
    }

    // ตรวจสอบความซับซ้อนของรหัสผ่านใหม่
    if (newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    // เข้ารหัสและบันทึกรหัสผ่านใหม่
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // อัพเดทรหัสผ่านและล้าง token
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null
      }
    });
  }
} 