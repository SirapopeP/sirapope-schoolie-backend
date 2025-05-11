import { Module } from '@nestjs/common';
import { AcademiesController } from './academies.controller';
import { AcademiesService } from './academies.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RolesModule } from '../roles/roles.module';
import { StudentManagementService } from './student-management.service';
import { StudentManagementController } from './student-management.controller';
import { AcademyMembersService } from './academy-members.service';
import { AcademyMembersController } from './academy-members.controller';

@Module({
  imports: [
    PrismaModule,
    RolesModule, // import เพื่อใช้ RolesService
  ],
  controllers: [AcademiesController, StudentManagementController, AcademyMembersController],
  providers: [AcademiesService, StudentManagementService, AcademyMembersService],
  exports: [AcademiesService, StudentManagementService, AcademyMembersService],
})
export class AcademiesModule {}