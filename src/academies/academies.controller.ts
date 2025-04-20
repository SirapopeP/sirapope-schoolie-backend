// src/academies/academies.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AcademiesService } from './academies.service';

@Controller('academies')
@UseGuards(JwtAuthGuard)
export class AcademiesController {
  constructor(private academiesService: AcademiesService) {}

  @Post()
  async createAcademy(
    @Body() data: {
      ownerId: number;
      name: string;
      bio?: string;
      logoUrl?: string;
    }
  ) {
    return this.academiesService.createAcademy(data.ownerId, {
      name: data.name,
      bio: data.bio,
      logoUrl: data.logoUrl
    });
  }

  @Get('user/:userId')
  async getAcademies(@Param('userId') userId: string) {
    return this.academiesService.getAcademies(Number(userId));
  }
}