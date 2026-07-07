/*
  Warnings:

  - You are about to drop the column `callsign` on the `positions` table. All the data in the column will be lost.
  - You are about to drop the column `ground_speed` on the `positions` table. All the data in the column will be lost.
  - You are about to drop the column `messages` on the `positions` table. All the data in the column will be lost.
  - You are about to drop the column `on_ground` on the `positions` table. All the data in the column will be lost.
  - You are about to drop the column `rssi` on the `positions` table. All the data in the column will be lost.
  - You are about to drop the column `squawk` on the `positions` table. All the data in the column will be lost.
  - You are about to drop the column `track` on the `positions` table. All the data in the column will be lost.
  - You are about to drop the column `vert_rate` on the `positions` table. All the data in the column will be lost.
  - You are about to alter the column `altitude` on the `positions` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - Made the column `lat` on table `positions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lon` on table `positions` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "positions" DROP COLUMN "callsign",
DROP COLUMN "ground_speed",
DROP COLUMN "messages",
DROP COLUMN "on_ground",
DROP COLUMN "rssi",
DROP COLUMN "squawk",
DROP COLUMN "track",
DROP COLUMN "vert_rate",
ALTER COLUMN "captured_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "altitude" SET DATA TYPE INTEGER,
ALTER COLUMN "lat" SET NOT NULL,
ALTER COLUMN "lon" SET NOT NULL;

-- RenameIndex
ALTER INDEX "idx_positions_icao_captured" RENAME TO "positions_icao_hex_captured_at_idx";
