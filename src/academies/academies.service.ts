import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RolesService } from '../roles/roles.service';
import { Academy, Prisma } from '@prisma/client';

@Injectable()
export class AcademiesService {
  constructor(
    private prisma: PrismaService,
    private rolesService: RolesService,
  ) {}

  async createAcademy(ownerId: string, data: {
    name: string;
    bio?: string;
    logoUrl?: string;
  }): Promise<Academy> {
    // ตรวจสอบว่าเป็น ACADEMY_OWNER
    const isOwner = await this.rolesService.checkUserRole(ownerId, 'ACADEMY_OWNER');
    if (!isOwner) {
      throw new ForbiddenException('User must be an ACADEMY_OWNER to create an academy');
    }

    return this.prisma.academy.create({
      data: {
        ...data,
        ownerId,
      },
      include: {
        owner: {
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

  async getAcademies(userId: string) {
    const isAdmin = await this.rolesService.checkUserRole(userId, 'ADMIN');
    
    if (isAdmin) {
      return this.prisma.academy.findMany({
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              username: true,
              name: true
            }
          },
          members: true
        }
      });
    }

    return this.prisma.academy.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            username: true,
            name: true
          }
        },
        members: true
      }
    });
  }

  async updateAcademyStats(academyId: string) {
    const members = await this.prisma.academyMember.count({
      where: { academyId }
    });

    const teachers = await this.prisma.userRole.count({
      where: {
        role: 'TEACHER',
        user: {
          academyMember: {
            some: { academyId }
          }
        }
      }
    });

    return this.prisma.academy.update({
      where: { id: academyId },
      data: {
        studentCount: members - teachers,
        teacherCount: teachers
      }
    });
  }
}