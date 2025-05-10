import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RolesService } from '../roles/roles.service';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StudentManagementService {
  constructor(
    private prisma: PrismaService,
    private rolesService: RolesService,
  ) {}

  // ดึงรายชื่อผู้ใช้ที่มีบทบาทเป็น STUDENT แต่ยังไม่ได้เป็นสมาชิกของ academy ใดๆ
  async getAvailableStudents(): Promise<User[]> {
    return this.prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: 'STUDENT'
          }
        },
        academyMember: {
          none: {}
        }
      },
      include: {
        profile: {
          select: {
            fullName: true,
            nickName: true,
            avatarUrl: true
          }
        }
      }
    });
  }

  // สร้างผู้ใช้ใหม่และเพิ่มเป็นนักเรียนของ academy
  async createStudentAndAddToAcademy(
    academyId: string, 
    requesterId: string,
    userData: {
      email: string;
      username: string;
      password: string;
      fullName?: string;
      nickName?: string;
    }
  ) {
    // ตรวจสอบว่า requester เป็นเจ้าของ academy หรือ admin
    const academy = await this.prisma.academy.findUnique({ 
      where: { id: academyId }
    });
    
    if (!academy) {
      throw new NotFoundException('Academy not found');
    }

    const isAdmin = await this.rolesService.checkUserRole(requesterId, 'ADMIN');
    if (academy.ownerId !== requesterId && !isAdmin) {
      throw new ForbiddenException('You are not allowed to add students to this academy');
    }

    // สร้างผู้ใช้ใหม่โดยใช้ transaction
    return this.prisma.$transaction(async (tx) => {
      // เข้ารหัสรหัสผ่าน
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // สร้างผู้ใช้ใหม่พร้อม profile และบทบาท STUDENT
      const newUser = await tx.user.create({
        data: {
          email: userData.email,
          username: userData.username,
          password: hashedPassword,
          profile: {
            create: {
              fullName: userData.fullName,
              nickName: userData.nickName
            }
          },
          roles: {
            create: {
              role: 'STUDENT'
            }
          }
        }
      });

      // เพิ่มผู้ใช้เป็นสมาชิกของ academy
      await tx.academyMember.create({
        data: {
          userId: newUser.id,
          academyId
        }
      });

      // อัพเดทจำนวนนักเรียนใน academy
      await tx.academy.update({
        where: { id: academyId },
        data: {
          studentCount: {
            increment: 1
          }
        }
      });

      return newUser;
    });
  }

  // สร้างคำเชิญให้นักเรียนที่มีอยู่แล้วเข้าร่วม academy
  async inviteExistingStudent(
    academyId: string, 
    userId: string, 
    requesterId: string
  ) {
    // ตรวจสอบว่า requester เป็นเจ้าของ academy หรือ admin
    const academy = await this.prisma.academy.findUnique({ 
      where: { id: academyId }
    });
    
    if (!academy) {
      throw new NotFoundException('Academy not found');
    }

    const isAdmin = await this.rolesService.checkUserRole(requesterId, 'ADMIN');
    if (academy.ownerId !== requesterId && !isAdmin) {
      throw new ForbiddenException('You are not allowed to invite students to this academy');
    }

    // ตรวจสอบว่าผู้ใช้มีบทบาทเป็น STUDENT
    const isStudent = await this.rolesService.checkUserRole(userId, 'STUDENT');
    if (!isStudent) {
      throw new ForbiddenException('User must be a STUDENT to be invited to an academy');
    }

    // ตรวจสอบว่ายังไม่มีคำเชิญที่ยังไม่ได้ตอบกลับ
    const existingInvitation = await this.prisma.academyInvitation.findUnique({
      where: {
        academyId_userId: {
          academyId,
          userId
        }
      }
    });

    if (existingInvitation && existingInvitation.status === 'PENDING') {
      throw new ForbiddenException('An invitation is already pending for this user');
    }

    // สร้างหรืออัพเดทคำเชิญ
    return this.prisma.academyInvitation.upsert({
      where: {
        academyId_userId: {
          academyId,
          userId
        }
      },
      update: {
        status: 'PENDING'
      },
      create: {
        academyId,
        userId,
        status: 'PENDING'
      }
    });
  }

  // ตอบรับหรือปฏิเสธคำเชิญเข้าร่วม academy
  async respondToInvitation(
    invitationId: string, 
    userId: string, 
    status: 'ACCEPTED' | 'REJECTED'
  ) {
    // ตรวจสอบว่าคำเชิญมีอยู่จริงและเป็นของผู้ใช้ที่ร้องขอ
    const invitation = await this.prisma.academyInvitation.findFirst({
      where: {
        id: invitationId,
        userId,
        status: 'PENDING'
      }
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found or already processed');
    }

    // ดำเนินการตามการตอบกลับ
    if (status === 'ACCEPTED') {
      // ใช้ transaction เพื่อทำการตอบรับคำเชิญและเพิ่มเป็นสมาชิก
      return this.prisma.$transaction(async (tx) => {
        // อัพเดทสถานะคำเชิญ
        await tx.academyInvitation.update({
          where: { id: invitationId },
          data: { status }
        });

        // เพิ่มผู้ใช้เป็นสมาชิกของ academy
        await tx.academyMember.create({
          data: {
            userId,
            academyId: invitation.academyId
          }
        });

        // อัพเดทจำนวนนักเรียนใน academy
        await tx.academy.update({
          where: { id: invitation.academyId },
          data: {
            studentCount: {
              increment: 1
            }
          }
        });

        return { message: 'Invitation accepted successfully' };
      });
    } else {
      // เพียงแค่อัพเดทสถานะคำเชิญเป็นปฏิเสธ
      await this.prisma.academyInvitation.update({
        where: { id: invitationId },
        data: { status }
      });

      return { message: 'Invitation rejected' };
    }
  }

  // ดึงคำเชิญทั้งหมดของผู้ใช้
  async getUserPendingInvitations(userId: string) {
    return this.prisma.academyInvitation.findMany({
      where: {
        userId,
        status: 'PENDING'
      },
      include: {
        academy: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            owner: {
              select: {
                id: true,
                username: true,
                profile: {
                  select: {
                    fullName: true
                  }
                }
              }
            }
          }
        }
      }
    });
  }
} 