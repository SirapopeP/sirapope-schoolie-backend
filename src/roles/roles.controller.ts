// src/roles/roles.controller.ts
import { Controller, Post, Body, UseGuards, Get, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesService } from './roles.service';
import { Role } from '@prisma/client';

@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Post('assign')
  async assignRole(@Body() body: { userId: string; role: Role }) {
    return this.rolesService.assignUserRole(body.userId, body.role);
  }

  @Get('user/:userId')
  async getUserRoles(@Param('userId') userId: string) {
    return this.rolesService.getUserRoles(userId);
  }
}