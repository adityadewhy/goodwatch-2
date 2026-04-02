-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('MOVIE', 'TV');

-- AlterTable
ALTER TABLE "Movie" ADD COLUMN     "mediaType" "MediaType" NOT NULL DEFAULT 'MOVIE';
