import { Controller, Get, Post, Body, Put, Param, NotFoundException, UseGuards } from '@nestjs/common';
import { UserProfilesService } from './user-profiles.service';
import { UserProfile as UserProfileModel } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('user-profiles')
@UseGuards(JwtAuthGuard) // ป้องกันทุก route ในคลาส
export class UserProfilesController {
  constructor(private readonly userProfilesService: UserProfilesService) {}

  @Get('user/:userId')
  async getUserProfile(@Param('userId') userId: string): Promise<UserProfileModel> {
    const profile = await this.userProfilesService.userProfile({ userId: Number(userId) });
    if (!profile) {
      throw new NotFoundException(`User profile for user ID ${userId} not found`);
    }
    return profile;
  }

  @Post()
  async createUserProfile(
    @Body() profileData: { 
      bio?: string;
      avatarUrl?: string;
      phoneNumber?: string;
      address?: string;
      userId: number;
    },
  ): Promise<UserProfileModel> {
    // ตรวจสอบว่า profile ยังไม่มีอยู่
    const existingProfile = await this.userProfilesService.userProfile({ 
      userId: profileData.userId 
    });
    if (existingProfile) {
      throw new NotFoundException(`Profile already exists for user ID ${profileData.userId}`);
    }

    const { userId, ...rest } = profileData;
    return this.userProfilesService.createUserProfile({
      ...rest,
      user: { connect: { id: userId } }
    });
  }

  @Put('user/:userId')  // เปลี่ยนจาก :id เป็น user/:userId
  async updateUserProfile(
    @Param('userId') userId: string,
    @Body() profileData: {
      bio?: string;
      avatarUrl?: string;
      phoneNumber?: string;
      address?: string;
    },
  ): Promise<UserProfileModel> {
    // ตรวจสอบว่า profile มีอยู่จริง
    const profile = await this.userProfilesService.userProfile({ 
      userId: Number(userId) 
    });
    if (!profile) {
      throw new NotFoundException(`Profile not found for user ID ${userId}`);
    }

    return this.userProfilesService.updateUserProfile({
      where: { userId: Number(userId) },  // เปลี่ยนจาก id เป็น userId
      data: profileData,
    });
  }

}