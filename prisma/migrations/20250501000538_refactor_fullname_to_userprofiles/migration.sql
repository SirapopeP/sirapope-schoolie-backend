/*
  Warnings:

  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "name";

-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "fullName" TEXT,
ADD COLUMN     "nickName" TEXT;
