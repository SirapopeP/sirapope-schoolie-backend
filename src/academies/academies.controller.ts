// src/academies/academies.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards, Patch, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AcademiesService } from './academies.service';
import { ForbiddenException } from '@nestjs/common';
import { RolesService } from '../roles/roles.service';

@Controller('academies')
@UseGuards(JwtAuthGuard)
export class AcademiesController {
  constructor(
    private academiesService: AcademiesService,
    private rolesService: RolesService
  ) {}

  @Post()
  async createAcademy(
    @Body() data: {
      ownerId: string;
      name: string;
      bio?: string;
      logoUrl?: string;
    }
  ) {
    const isOwner = await this.rolesService.checkUserRole(data.ownerId, 'ACADEMY_OWNER');
    if (!isOwner) {
      throw new ForbiddenException('User must be an ACADEMY_OWNER to create an academy');
    }

    return this.academiesService.createAcademy(data.ownerId, {
      name: data.name,
      bio: data.bio,
      logoUrl: data.logoUrl
    });
  }

  @Get('user/:userId')
  async getAcademies(@Param('userId') userId: string) {
    return this.academiesService.getAcademies(userId);
  }

  @Patch(':academyId')
  async updateAcademy(
    @Param('academyId') academyId: string,
    @Body() data: {
      userId: string;
      name?: string;
      bio?: string;
      logoUrl?: string;
    }
  ) {
    return this.academiesService.updateAcademy(academyId, data.userId, {
      name: data.name,
      bio: data.bio,
      logoUrl: data.logoUrl
    });
  }

  @Delete(':academyId')
  async deleteAcademy(
    @Param('academyId') academyId: string,
    @Body() data: { userId: string }
  ) {
    return this.academiesService.deleteAcademy(academyId, data.userId);
  }
}