-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'VOLUNTEER', 'COORDINATOR', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('VIEW_CONTENT', 'EDIT_CONTENT', 'MANAGE_USERS', 'MANAGE_ADMIN', 'SUPER_ADMIN', 'ALL_PERMISSIONS');

-- CreateEnum
CREATE TYPE "MissionStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "password" VARCHAR(255) NOT NULL,
    "phone_number" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "permissions" "Permission"[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "profile_picture" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerProfile" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "availability" TEXT[],
    "location" TEXT,
    "experience" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VolunteerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mission" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" "MissionStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Applications" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MissionToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MissionToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_number_key" ON "User"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "VolunteerProfile_user_id_key" ON "VolunteerProfile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Applications_email_key" ON "Applications"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Applications_phone_number_key" ON "Applications"("phone_number");

-- CreateIndex
CREATE INDEX "_MissionToUser_B_index" ON "_MissionToUser"("B");

-- AddForeignKey
ALTER TABLE "VolunteerProfile" ADD CONSTRAINT "VolunteerProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MissionToUser" ADD CONSTRAINT "_MissionToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MissionToUser" ADD CONSTRAINT "_MissionToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
