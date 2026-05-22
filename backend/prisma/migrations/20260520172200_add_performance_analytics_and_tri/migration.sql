/*
  Warnings:

  - You are about to drop the `pvp_achievements` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pvp_leaderboards` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pvp_matches` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pvp_player_answers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pvp_player_results` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pvp_player_stats` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pvp_room_players` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pvp_room_questions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pvp_rooms` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "pvp_achievements" DROP CONSTRAINT "pvp_achievements_user_id_fkey";

-- DropForeignKey
ALTER TABLE "pvp_leaderboards" DROP CONSTRAINT "pvp_leaderboards_user_id_fkey";

-- DropForeignKey
ALTER TABLE "pvp_matches" DROP CONSTRAINT "pvp_matches_room_id_fkey";

-- DropForeignKey
ALTER TABLE "pvp_player_answers" DROP CONSTRAINT "pvp_player_answers_enem_question_id_fkey";

-- DropForeignKey
ALTER TABLE "pvp_player_answers" DROP CONSTRAINT "pvp_player_answers_result_id_fkey";

-- DropForeignKey
ALTER TABLE "pvp_player_results" DROP CONSTRAINT "pvp_player_results_match_id_fkey";

-- DropForeignKey
ALTER TABLE "pvp_player_results" DROP CONSTRAINT "pvp_player_results_user_id_fkey";

-- DropForeignKey
ALTER TABLE "pvp_player_stats" DROP CONSTRAINT "pvp_player_stats_user_id_fkey";

-- DropForeignKey
ALTER TABLE "pvp_room_players" DROP CONSTRAINT "pvp_room_players_room_id_fkey";

-- DropForeignKey
ALTER TABLE "pvp_room_players" DROP CONSTRAINT "pvp_room_players_user_id_fkey";

-- DropForeignKey
ALTER TABLE "pvp_room_questions" DROP CONSTRAINT "pvp_room_questions_enem_question_id_fkey";

-- DropForeignKey
ALTER TABLE "pvp_room_questions" DROP CONSTRAINT "pvp_room_questions_room_id_fkey";

-- DropForeignKey
ALTER TABLE "pvp_rooms" DROP CONSTRAINT "pvp_rooms_host_id_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "estimated_tri_score" INTEGER NOT NULL DEFAULT 500,
ADD COLUMN     "overall_accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "total_questions_answered" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "pvp_achievements";

-- DropTable
DROP TABLE "pvp_leaderboards";

-- DropTable
DROP TABLE "pvp_matches";

-- DropTable
DROP TABLE "pvp_player_answers";

-- DropTable
DROP TABLE "pvp_player_results";

-- DropTable
DROP TABLE "pvp_player_stats";

-- DropTable
DROP TABLE "pvp_room_players";

-- DropTable
DROP TABLE "pvp_room_questions";

-- DropTable
DROP TABLE "pvp_rooms";

-- DropEnum
DROP TYPE "PvPAchievementType";

-- DropEnum
DROP TYPE "PvPLeaderboardScope";

-- DropEnum
DROP TYPE "PvPMatchStatus";

-- DropEnum
DROP TYPE "PvPRoomDifficulty";

-- DropEnum
DROP TYPE "PvPRoomMode";

-- DropEnum
DROP TYPE "PvPRoomVisibility";

-- CreateTable
CREATE TABLE "question_difficulties" (
    "id" UUID NOT NULL,
    "enem_question_id" VARCHAR(64) NOT NULL,
    "discrimination" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "difficulty" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "guessing" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "average_accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "estimated_irf_value" DOUBLE PRECISION,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "question_difficulties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tri_analytics" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "source" VARCHAR(30) NOT NULL,
    "source_id" UUID NOT NULL,
    "proficiency" DOUBLE PRECISION NOT NULL,
    "estimatedTriScore" INTEGER NOT NULL,
    "linguagensScore" INTEGER,
    "humanasScore" INTEGER,
    "naturezaScore" INTEGER,
    "matematicaScore" INTEGER,
    "redacaoScore" INTEGER,
    "pedagogical_coherence" DOUBLE PRECISION NOT NULL,
    "incoherence_level" TEXT,
    "correct_count" INTEGER NOT NULL,
    "total_count" INTEGER NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tri_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_analytics" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "period" VARCHAR(20) NOT NULL,
    "start_date" TIMESTAMPTZ(6) NOT NULL,
    "end_date" TIMESTAMPTZ(6) NOT NULL,
    "questions_answered" INTEGER NOT NULL,
    "correct_answers" INTEGER NOT NULL,
    "overallAccuracy" DOUBLE PRECISION NOT NULL,
    "average_time_per_question" DOUBLE PRECISION NOT NULL,
    "weekly_evolution" DOUBLE PRECISION,
    "monthly_evolution" DOUBLE PRECISION,
    "study_days" INTEGER NOT NULL,
    "current_streak" INTEGER NOT NULL,
    "max_streak" INTEGER NOT NULL,
    "frequency_per_week" DOUBLE PRECISION NOT NULL,
    "simulado_count" INTEGER NOT NULL DEFAULT 0,
    "average_simulado_score" DOUBLE PRECISION,
    "abandonment_rate" DOUBLE PRECISION,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "performance_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "area_performance" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "area" VARCHAR(50) NOT NULL,
    "period" VARCHAR(20) NOT NULL DEFAULT 'all_time',
    "start_date" TIMESTAMPTZ(6) NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "correct_count" INTEGER NOT NULL,
    "total_count" INTEGER NOT NULL,
    "estimated_tri_score" INTEGER NOT NULL,
    "easy_accuracy" DOUBLE PRECISION,
    "medium_accuracy" DOUBLE PRECISION,
    "hard_accuracy" DOUBLE PRECISION,
    "average_difficulty_level" DOUBLE PRECISION,
    "average_time_per_question" DOUBLE PRECISION NOT NULL,
    "previous_accuracy" DOUBLE PRECISION,
    "evolution_percentage" DOUBLE PRECISION,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "area_performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weakness_analytics" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "area" VARCHAR(50) NOT NULL,
    "topic" VARCHAR(100) NOT NULL,
    "competence" VARCHAR(150),
    "accuracy" DOUBLE PRECISION NOT NULL,
    "correct_count" INTEGER NOT NULL,
    "total_count" INTEGER NOT NULL,
    "severity" VARCHAR(20) NOT NULL,
    "improvement_potential" DOUBLE PRECISION NOT NULL,
    "previous_accuracy" DOUBLE PRECISION,
    "trend" VARCHAR(20),
    "last_updated" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weakness_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "category" VARCHAR(30) NOT NULL,
    "icon_url" TEXT,
    "criteria" JSONB NOT NULL,
    "xp_reward" INTEGER NOT NULL DEFAULT 0,
    "coin_reward" INTEGER NOT NULL DEFAULT 0,
    "rarity" VARCHAR(20) NOT NULL DEFAULT 'common',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "badge_id" UUID NOT NULL,
    "unlocked_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "category" VARCHAR(30) NOT NULL,
    "criteria" JSONB NOT NULL,
    "xp_reward" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "achievement_id" UUID NOT NULL,
    "completed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 100,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "question_difficulties_enem_question_id_key" ON "question_difficulties"("enem_question_id");

-- CreateIndex
CREATE INDEX "question_difficulties_enem_question_id_idx" ON "question_difficulties"("enem_question_id");

-- CreateIndex
CREATE INDEX "tri_analytics_user_id_idx" ON "tri_analytics"("user_id");

-- CreateIndex
CREATE INDEX "tri_analytics_source_id_idx" ON "tri_analytics"("source_id");

-- CreateIndex
CREATE INDEX "performance_analytics_user_id_idx" ON "performance_analytics"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "performance_analytics_user_id_period_start_date_end_date_key" ON "performance_analytics"("user_id", "period", "start_date", "end_date");

-- CreateIndex
CREATE INDEX "area_performance_user_id_area_idx" ON "area_performance"("user_id", "area");

-- CreateIndex
CREATE UNIQUE INDEX "area_performance_user_id_area_period_start_date_key" ON "area_performance"("user_id", "area", "period", "start_date");

-- CreateIndex
CREATE INDEX "weakness_analytics_user_id_severity_idx" ON "weakness_analytics"("user_id", "severity");

-- CreateIndex
CREATE UNIQUE INDEX "weakness_analytics_user_id_area_topic_key" ON "weakness_analytics"("user_id", "area", "topic");

-- CreateIndex
CREATE UNIQUE INDEX "badges_code_key" ON "badges"("code");

-- CreateIndex
CREATE INDEX "user_badges_user_id_idx" ON "user_badges"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_user_id_badge_id_key" ON "user_badges"("user_id", "badge_id");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_code_key" ON "achievements"("code");

-- CreateIndex
CREATE INDEX "user_achievements_user_id_idx" ON "user_achievements"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_user_id_achievement_id_key" ON "user_achievements"("user_id", "achievement_id");

-- AddForeignKey
ALTER TABLE "tri_analytics" ADD CONSTRAINT "tri_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_analytics" ADD CONSTRAINT "performance_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weakness_analytics" ADD CONSTRAINT "weakness_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
