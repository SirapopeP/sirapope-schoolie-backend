import { Controller, Get, Post, Body, Put, Param, NotFoundException } from '@nestjs/common';
import { UserProfilesService } from './user-profiles.service';
import { UserProfile as UserProfileModel } from '@prisma/client';

@Controller('user-profiles')
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
    const { userId, ...rest } = profileData;
    return this.userProfilesService.createUserProfile({
      ...rest,
      user: { connect: { id: userId } }
    });
  }

  @Put(':id')
  async updateUserProfile(
    @Param('id') id: string,
    @Body() profileData: {
      bio?: string;
      avatarUrl?: string;
      phoneNumber?: string;
      address?: string;
    },
  ): Promise<UserProfileModel> {
    return this.userProfilesService.updateUserProfile({
      where: { id: Number(id) },
      data: profileData,
    });
  }
}