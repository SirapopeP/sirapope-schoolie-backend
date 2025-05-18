import { Controller, Get, Post, Body, Param, UseGuards, Patch, Delete, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AcademyMembersService } from './academy-members.service';

@Controller('academy-members')
@UseGuards(JwtAuthGuard)
export class AcademyMembersController {
  constructor(
    private academyMembersService: AcademyMembersService
  ) {}

  @Get(':academyId/members/:userId')
  async getMemberDetails(
    @Param('academyId') academyId: string,
    @Param('userId') userId: string,
    @Query('requesterId') requesterId: string
  ) {
    return this.academyMembersService.getMemberDetails(academyId, userId, requesterId);
  }

  @Patch(':academyId/members/:userId/status')
  async updateMemberStatus(
    @Param('academyId') academyId: string,
    @Param('userId') userId: string,
    @Body() data: { memberStatus: string; requesterId: string }
  ) {
    return this.academyMembersService.updateMemberStatus(
      academyId, 
      userId, 
      data.memberStatus, 
      data.requesterId
    );
  }

  @Patch(':academyId/members/:userId/level')
  async updateMemberLevel(
    @Param('academyId') academyId: string,
    @Param('userId') userId: string,
    @Body() data: { memberLevel: number; requesterId: string }
  ) {
    return this.academyMembersService.updateMemberLevel(
      academyId, 
      userId, 
      data.memberLevel, 
      data.requesterId
    );
  }

  @Patch(':academyId/members/:userId/income')
  async updateMemberIncome(
    @Param('academyId') academyId: string,
    @Param('userId') userId: string,
    @Body() data: { incomeToAdd: number; requesterId: string }
  ) {
    return this.academyMembersService.updateMemberIncome(
      academyId, 
      userId, 
      data.incomeToAdd, 
      data.requesterId
    );
  }
} 