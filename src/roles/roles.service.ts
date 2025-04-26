import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async assignUserRole(userId: string, role: Role) {
    // ตรวจสอบว่ามี user นี้อยู่จริง
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // สร้าง role ใหม่
    return this.prisma.userRole.create({
      data: {
        userId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            name: true
          }
        }
      }
    });
  }

  async getUserRoles(userId: string) {
    return this.prisma.userRole.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            name: true
          }
        }
      }
    });
  }

  async checkUserRole(userId: string, role: Role): Promise<boolean> {
    const userRole = await this.prisma.userRole.findFirst({
      where: { userId, role }
    });
    return !!userRole;
  }
}
