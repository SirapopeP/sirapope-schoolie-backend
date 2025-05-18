import { Controller, Post, Get, Body, Param, UseGuards, Patch, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StudentManagementService } from './student-management.service';

@Controller('academies/students')
@UseGuards(JwtAuthGuard)
export class StudentManagementController {
  constructor(
    private studentManagementService: StudentManagementService
  ) {}

  @Get('available')
  async getAvailableStudents() {
    return this.studentManagementService.getAvailableStudents();
  }

  @Post(':academyId/create')
  async createStudentAndAddToAcademy(
    @Param('academyId') academyId: string,
    @Body() data: {
      requesterId: string;
      email: string;
      username: string;
      password: string;
      fullName?: string;
      nickName?: string;
    }
  ) {
    return this.studentManagementService.createStudentAndAddToAcademy(
      academyId,
      data.requesterId,
      {
        email: data.email,
        username: data.username,
        password: data.password,
        fullName: data.fullName,
        nickName: data.nickName
      }
    );
  }

  @Post(':academyId/invite/:userId')
  async inviteExistingStudent(
    @Param('academyId') academyId: string,
    @Param('userId') userId: string,
    @Body() data: { requesterId: string }
  ) {
    return this.studentManagementService.inviteExistingStudent(
      academyId,
      userId,
      data.requesterId
    );
  }

  @Patch('invitations/:invitationId/respond')
  async respondToInvitation(
    @Param('invitationId') invitationId: string,
    @Body() data: {
      userId: string;
      status: 'ACCEPTED' | 'REJECTED';
    }
  ) {
    return this.studentManagementService.respondToInvitation(
      invitationId,
      data.userId,
      data.status
    );
  }

  @Get('invitations/user/:userId')
  async getUserPendingInvitations(@Param('userId') userId: string) {
    return this.studentManagementService.getUserPendingInvitations(userId);
  }

  @Get(':academyId/students')
  async getAcademyStudents(
    @Param('academyId') academyId: string,
    @Query('requesterId') requesterId: string
  ) {
    return this.studentManagementService.getAcademyStudents(academyId, requesterId);
  }
} 