import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserProfile, Prisma } from '@prisma/client';

@Injectable()
export class UserProfilesService {
  constructor(private prisma: PrismaService) {}

  async userProfile(where: Prisma.UserProfileWhereUniqueInput): Promise<UserProfile | null> {
    return this.prisma.userProfile.findUnique({ where });
  }

  async createUserProfile(data: Prisma.UserProfileCreateInput): Promise<UserProfile> {
    return this.prisma.userProfile.create({ data });
  }

  async updateUserProfile(params: {
    where: Prisma.UserProfileWhereUniqueInput;
    data: Prisma.UserProfileUpdateInput;
  }): Promise<UserProfile> {
    const { where, data } = params;
    return this.prisma.userProfile.update({
      data,
      where,
    });
  }
}