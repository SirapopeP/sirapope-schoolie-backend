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

    // Create academy in a transaction to also add owner as first member
    return this.prisma.$transaction(async (tx) => {
      // สร้าง academy
      const academy = await tx.academy.create({
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
              profile: {
                select: {
                  fullName: true
                }
              }
            }
          }
        }
      });

      // เพิ่มเจ้าของเป็น member คนแรกของ academy
      await tx.academyMember.create({
        data: {
          userId: ownerId,
          academyId: academy.id,
          memberStatus: 'ACTIVE',
          memberLevel: 3.0,
          memberIncome: 0
        }
      });

      // อัพเดทข้อมูลสถิติ
      const updatedAcademy = await tx.academy.update({
        where: { id: academy.id },
        data: {
          studentCount: 1
        },
        include: {
          owner: {
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
          },
          members: true
        }
      });

      return updatedAcademy;
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
              profile: {
                select: {
                  fullName: true
                }
              }
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
            profile: {
              select: {
                fullName: true
              }
            }
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

  async updateAcademy(academyId: string, userId: string, data: {
    name?: string;
    bio?: string;
    logoUrl?: string;
  }): Promise<Academy> {
    // ตรวจสอบว่า user เป็นเจ้าของ academy หรือ admin
    const academy = await this.prisma.academy.findUnique({ where: { id: academyId } });
    if (!academy) throw new ForbiddenException('Academy not found');

    const isAdmin = await this.rolesService.checkUserRole(userId, 'ADMIN');
    if (academy.ownerId !== userId && !isAdmin) {
      throw new ForbiddenException('You are not allowed to update this academy');
    }

    return this.prisma.academy.update({
      where: { id: academyId },
      data,
    });
  }

  async deleteAcademy(academyId: string, userId: string): Promise<{ message: string }> {
    // ตรวจสอบว่า user เป็นเจ้าของ academy หรือ admin
    const academy = await this.prisma.academy.findUnique({ where: { id: academyId } });
    if (!academy) throw new ForbiddenException('Academy not found');

    const isAdmin = await this.rolesService.checkUserRole(userId, 'ADMIN');
    if (academy.ownerId !== userId && !isAdmin) {
      throw new ForbiddenException('You are not allowed to delete this academy');
    }

    await this.prisma.academy.delete({ where: { id: academyId } });
    return { message: 'Academy deleted successfully' };
  }

  async addMember(academyId: string, userId: string, requesterId: string) {
    // ตรวจสอบว่า requester เป็นเจ้าของ academy หรือ admin
    const academy = await this.prisma.academy.findUnique({ where: { id: academyId } });
    if (!academy) throw new ForbiddenException('Academy not found');

    const isAdmin = await this.rolesService.checkUserRole(requesterId, 'ADMIN');
    if (academy.ownerId !== requesterId && !isAdmin) {
      throw new ForbiddenException('You are not allowed to add members to this academy');
    }

    // ตรวจสอบว่า user ยังไม่ได้เป็น member
    const existingMember = await this.prisma.academyMember.findUnique({
      where: {
        userId_academyId: {
          userId,
          academyId
        }
      }
    });

    if (existingMember) {
      throw new ForbiddenException('User is already a member of this academy');
    }

    const member = await this.prisma.academyMember.create({
      data: {
        userId,
        academyId,
        memberStatus: 'ACTIVE',
        memberLevel: 3.0,
        memberIncome: 0
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

    // อัพเดทจำนวนสมาชิก
    await this.updateAcademyStats(academyId);

    return member;
  }

  async removeMember(academyId: string, userId: string, requesterId: string) {
    // ตรวจสอบว่า requester เป็นเจ้าของ academy หรือ admin
    const academy = await this.prisma.academy.findUnique({ where: { id: academyId } });
    if (!academy) throw new ForbiddenException('Academy not found');

    const isAdmin = await this.rolesService.checkUserRole(requesterId, 'ADMIN');
    if (academy.ownerId !== requesterId && !isAdmin) {
      throw new ForbiddenException('You are not allowed to remove members from this academy');
    }

    // ตรวจสอบว่า user เป็น member
    const member = await this.prisma.academyMember.findUnique({
      where: {
        userId_academyId: {
          userId,
          academyId
        }
      }
    });

    if (!member) {
      throw new ForbiddenException('User is not a member of this academy');
    }

    await this.prisma.academyMember.delete({
      where: {
        userId_academyId: {
          userId,
          academyId
        }
      }
    });

    // อัพเดทจำนวนสมาชิก
    await this.updateAcademyStats(academyId);

    return { message: 'Member removed successfully' };
  }

  async getAcademyMembers(academyId: string, requesterId: string) {
    // ตรวจสอบว่า requester เป็นเจ้าของ academy, member หรือ admin
    const academy = await this.prisma.academy.findUnique({ where: { id: academyId } });
    if (!academy) throw new ForbiddenException('Academy not found');

    const isAdmin = await this.rolesService.checkUserRole(requesterId, 'ADMIN');
    const isMember = await this.prisma.academyMember.findUnique({
      where: {
        userId_academyId: {
          userId: requesterId,
          academyId
        }
      }
    });

    if (academy.ownerId !== requesterId && !isAdmin && !isMember) {
      throw new ForbiddenException('You are not allowed to view members of this academy');
    }

    return this.prisma.academyMember.findMany({
      where: { academyId },
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

  async isAcademyMember(academyId: string, userId: string) {
    const member = await this.prisma.academyMember.findUnique({
      where: {
        userId_academyId: {
          userId,
          academyId
        }
      }
    });

    return { isMember: !!member };
  }
}