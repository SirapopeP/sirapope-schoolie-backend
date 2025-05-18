import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
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
            profile: {
              select: {
                fullName: true
              }
            }
          }
        }
      }
    });
  }

  async updateUserRole(userId: string, oldRole: Role, newRole: Role) {
    // ตรวจสอบว่ามี user นี้อยู่จริง
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // ตรวจสอบว่ามี role เดิมอยู่จริง
    const existingRole = await this.prisma.userRole.findFirst({
      where: {
        userId,
        role: oldRole
      }
    });

    if (!existingRole) {
      throw new NotFoundException(`User does not have role ${oldRole}`);
    }

    // ลบ role เดิม
    await this.prisma.userRole.delete({
      where: {
        id: existingRole.id
      }
    });

    // สร้าง role ใหม่
    return this.prisma.userRole.create({
      data: {
        userId,
        role: newRole,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            profile: {
              select: {
                fullName: true
              }
            }
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
            profile: {
              select: {
                fullName: true
              }
            }
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
