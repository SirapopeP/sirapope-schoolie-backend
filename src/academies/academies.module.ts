import { Module } from '@nestjs/common';
import { AcademiesController } from './academies.controller';
import { AcademiesService } from './academies.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RolesModule } from '../roles/roles.module';
import { StudentManagementService } from './student-management.service';
import { StudentManagementController } from './student-management.controller';

@Module({
  imports: [
    PrismaModule,
    RolesModule, // import เพื่อใช้ RolesService
  ],
  controllers: [AcademiesController, StudentManagementController],
  providers: [AcademiesService, StudentManagementService],
  exports: [AcademiesService, StudentManagementService],
})
export class AcademiesModule {}