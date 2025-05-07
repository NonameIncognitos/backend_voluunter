/*
  Warnings:

  - A unique constraint covering the columns `[user_id]` on the table `Applications` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `first_name` to the `Applications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_name` to the `Applications` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Applications" ADD COLUMN     "first_name" TEXT NOT NULL,
ADD COLUMN     "last_name" TEXT NOT NULL,
ADD COLUMN     "user_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Applications_user_id_key" ON "Applications"("user_id");

-- AddForeignKey
ALTER TABLE "Applications" ADD CONSTRAINT "Applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
