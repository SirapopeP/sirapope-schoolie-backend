import { Module } from '@nestjs/common';
import { AcademiesController } from './academies.controller';
import { AcademiesService } from './academies.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    PrismaModule,
    RolesModule, // import เพื่อใช้ RolesService
  ],
  controllers: [AcademiesController],
  providers: [AcademiesService],
  exports: [AcademiesService],
})
export class AcademiesModule {}