/*
  Warnings:

  - You are about to drop the `UserPermission` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'GUEST';

-- DropTable
DROP TABLE "UserPermission";
