import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RolesService } from '../roles/roles.service';
import { AcademyMember } from '@prisma/client';

@Injectable()
export class AcademyMembersService {
  constructor(
    private prisma: PrismaService,
    private rolesService: RolesService,
  ) {}

  async updateMemberStatus(
    academyId: string, 
    userId: string, 
    memberStatus: string,
    requesterId: string
  ): Promise<AcademyMember> {
    // Verify requester is academy owner or admin
    const academy = await this.prisma.academy.findUnique({ where: { id: academyId } });
    if (!academy) throw new ForbiddenException('Academy not found');

    const isAdmin = await this.rolesService.checkUserRole(requesterId, 'ADMIN');
    if (academy.ownerId !== requesterId && !isAdmin) {
      throw new ForbiddenException('You are not allowed to update member status');
    }

    // Verify user is a member
    const existingMember = await this.prisma.academyMember.findUnique({
      where: {
        userId_academyId: {
          userId,
          academyId
        }
      }
    });

    if (!existingMember) {
      throw new ForbiddenException('User is not a member of this academy');
    }

    // Update member status
    return this.prisma.academyMember.update({
      where: {
        userId_academyId: {
          userId,
          academyId
        }
      },
      data: {
        memberStatus
      }
    });
  }

  async updateMemberLevel(
    academyId: string, 
    userId: string, 
    memberLevel: number,
    requesterId: string
  ): Promise<AcademyMember> {
    // Verify requester is academy owner or admin
    const academy = await this.prisma.academy.findUnique({ where: { id: academyId } });
    if (!academy) throw new ForbiddenException('Academy not found');

    const isAdmin = await this.rolesService.checkUserRole(requesterId, 'ADMIN');
    if (academy.ownerId !== requesterId && !isAdmin) {
      throw new ForbiddenException('You are not allowed to update member level');
    }

    // Verify user is a member
    const existingMember = await this.prisma.academyMember.findUnique({
      where: {
        userId_academyId: {
          userId,
          academyId
        }
      }
    });

    if (!existingMember) {
      throw new ForbiddenException('User is not a member of this academy');
    }

    // Update member level
    return this.prisma.academyMember.update({
      where: {
        userId_academyId: {
          userId,
          academyId
        }
      },
      data: {
        memberLevel
      }
    });
  }

  async updateMemberIncome(
    academyId: string, 
    userId: string, 
    incomeToAdd: number,
    requesterId: string
  ): Promise<AcademyMember> {
    // Verify requester is academy owner or admin
    const academy = await this.prisma.academy.findUnique({ where: { id: academyId } });
    if (!academy) throw new ForbiddenException('Academy not found');

    const isAdmin = await this.rolesService.checkUserRole(requesterId, 'ADMIN');
    if (academy.ownerId !== requesterId && !isAdmin) {
      throw new ForbiddenException('You are not allowed to update member income');
    }

    // Verify user is a member
    const existingMember = await this.prisma.academyMember.findUnique({
      where: {
        userId_academyId: {
          userId,
          academyId
        }
      }
    });

    if (!existingMember) {
      throw new ForbiddenException('User is not a member of this academy');
    }

    // Update member income (add to existing value)
    return this.prisma.academyMember.update({
      where: {
        userId_academyId: {
          userId,
          academyId
        }
      },
      data: {
        memberIncome: {
          increment: incomeToAdd
        }
      }
    });
  }

  async getMemberDetails(
    academyId: string,
    userId: string,
    requesterId: string
  ): Promise<AcademyMember> {
    // Verify requester is academy owner, member or admin
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
      throw new ForbiddenException('You are not allowed to view member details');
    }

    // Get member details
    const member = await this.prisma.academyMember.findUnique({
      where: {
        userId_academyId: {
          userId,
          academyId
        }
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

    if (!member) {
      throw new ForbiddenException('User is not a member of this academy');
    }

    return member;
  }
} 