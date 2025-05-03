// src/roles/roles.controller.ts
import { Controller, Post, Body, UseGuards, Get, Param, Put } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesService } from './roles.service';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';

@ApiTags('roles')
@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Post('assign')
  @ApiOperation({ summary: 'Assign a new role to a user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        role: { type: 'string', enum: ['ADMIN', 'ACADEMY_OWNER', 'TEACHER', 'STUDENT', 'GUEST'] }
      }
    }
  })
  async assignRole(@Body() body: { userId: string; role: Role }) {
    return this.rolesService.assignUserRole(body.userId, body.role);
  }

  @Put('update')
  @ApiOperation({ summary: 'Update a user role from one role to another' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        oldRole: { type: 'string', enum: ['ADMIN', 'ACADEMY_OWNER', 'TEACHER', 'STUDENT', 'GUEST'] },
        newRole: { type: 'string', enum: ['ADMIN', 'ACADEMY_OWNER', 'TEACHER', 'STUDENT', 'GUEST'] }
      }
    }
  })
  async updateRole(
    @Body() body: { userId: string; oldRole: Role; newRole: Role }
  ) {
    return this.rolesService.updateUserRole(
      body.userId,
      body.oldRole,
      body.newRole
    );
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all roles for a user' })
  async getUserRoles(@Param('userId') userId: string) {
    return this.rolesService.getUserRoles(userId);
  }
}