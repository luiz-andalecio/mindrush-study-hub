-- CreateEnum
CREATE TYPE "SimuladoAttemptStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SimuladoExamPart" AS ENUM ('DAY1', 'DAY2');

-- CreateEnum
CREATE TYPE "JourneyNodeStatus" AS ENUM ('LOCKED', 'AVAILABLE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PvPRoomVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "PvPRoomMode" AS ENUM ('CASUAL', 'RANKED');

-- CreateEnum
CREATE TYPE "PvPRoomDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'MIXED');

-- CreateEnum
CREATE TYPE "PvPMatchStatus" AS ENUM ('WAITING', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "PvPAchievementType" AS ENUM ('FIRST_MATCH', 'THREE_WINS', 'TEN_WINS', 'FIFTY_WINS', 'SPEEDSTER', 'PERFECT_MATCH', 'STREAK_3', 'STREAK_10', 'SPECIALIST_MATH', 'SPECIALIST_LANGUAGE', 'SPECIALIST_SCIENCE', 'SPECIALIST_HUMANITIES', 'UNDEFEATED_SESSION', 'COMEBACK_KING', 'NIGHT_WARRIOR', 'SOCIAL_BUTTERFLY');

-- CreateEnum
CREATE TYPE "PvPLeaderboardScope" AS ENUM ('ALL_TIME', 'WEEKLY', 'DAILY');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "email" VARCHAR(200) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "level" INTEGER NOT NULL,
    "xp" INTEGER NOT NULL,
    "coins" INTEGER NOT NULL,
    "streak" INTEGER NOT NULL,
    "last_streak_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulado_attempts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "part" "SimuladoExamPart" NOT NULL DEFAULT 'DAY1',
    "language_choice" VARCHAR(30),
    "time_limit_seconds" INTEGER NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "duration_seconds" INTEGER,
    "status" "SimuladoAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "paused_at" TIMESTAMPTZ(6),
    "paused_seconds" INTEGER NOT NULL DEFAULT 0,
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "total_count" INTEGER NOT NULL DEFAULT 0,
    "xp_earned" INTEGER NOT NULL DEFAULT 0,
    "coins_earned" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "simulado_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulado_attempt_questions" (
    "id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "order" INTEGER NOT NULL,
    "enem_question_id" VARCHAR(64) NOT NULL,

    CONSTRAINT "simulado_attempt_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulado_answers" (
    "id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "enem_question_id" VARCHAR(64) NOT NULL,
    "selected_alternative" VARCHAR(1) NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "answered_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simulado_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journeys" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "area" VARCHAR(60) NOT NULL,
    "discipline" VARCHAR(60) NOT NULL,
    "language" VARCHAR(30),
    "year" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "journeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journey_nodes" (
    "id" UUID NOT NULL,
    "journey_id" UUID NOT NULL,
    "order" INTEGER NOT NULL,
    "status" "JourneyNodeStatus" NOT NULL DEFAULT 'LOCKED',
    "min_correct" INTEGER NOT NULL DEFAULT 3,
    "total_questions" INTEGER NOT NULL DEFAULT 5,
    "xp_per_correct" INTEGER NOT NULL DEFAULT 10,
    "coins_on_complete" INTEGER NOT NULL DEFAULT 20,
    "year" INTEGER NOT NULL,
    "language" VARCHAR(30),
    "discipline" VARCHAR(60) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "journey_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journey_node_questions" (
    "id" UUID NOT NULL,
    "node_id" UUID NOT NULL,
    "order" INTEGER NOT NULL,
    "enem_question_id" VARCHAR(64) NOT NULL,

    CONSTRAINT "journey_node_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journey_node_attempts" (
    "id" UUID NOT NULL,
    "node_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "total_count" INTEGER NOT NULL DEFAULT 0,
    "passed" BOOLEAN,
    "xp_earned" INTEGER NOT NULL DEFAULT 0,
    "coins_earned" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "journey_node_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journey_question_answers" (
    "id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "enem_question_id" VARCHAR(64) NOT NULL,
    "selected_alternative" VARCHAR(1) NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "answered_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journey_question_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "refresh_token_hash" VARCHAR(128) NOT NULL,
    "csrf_token" VARCHAR(128) NOT NULL,
    "user_agent" VARCHAR(300),
    "ip" VARCHAR(80),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "replaced_by_id" UUID,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flyway_schema_history" (
    "installed_rank" INTEGER NOT NULL,
    "version" VARCHAR(50),
    "description" VARCHAR(200) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "script" VARCHAR(1000) NOT NULL,
    "checksum" INTEGER,
    "installed_by" VARCHAR(100) NOT NULL,
    "installed_on" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "execution_time" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,

    CONSTRAINT "flyway_schema_history_pk" PRIMARY KEY ("installed_rank")
);

-- CreateTable
CREATE TABLE "enem_exams" (
    "year" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "disciplines" JSONB NOT NULL,
    "languages" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "enem_exams_pkey" PRIMARY KEY ("year")
);

-- CreateTable
CREATE TABLE "enem_questions" (
    "id" VARCHAR(64) NOT NULL,
    "year" INTEGER NOT NULL,
    "index" INTEGER NOT NULL,
    "language" VARCHAR(30),
    "discipline" VARCHAR(50),
    "title" VARCHAR(200) NOT NULL,
    "context" TEXT,
    "files" JSONB NOT NULL,
    "correct_alternative" VARCHAR(1) NOT NULL,
    "alternatives_introduction" TEXT,
    "alternatives" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "enem_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pvp_rooms" (
    "id" UUID NOT NULL,
    "host_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "visibility" "PvPRoomVisibility" NOT NULL DEFAULT 'PUBLIC',
    "mode" "PvPRoomMode" NOT NULL DEFAULT 'CASUAL',
    "difficulty" "PvPRoomDifficulty" NOT NULL DEFAULT 'MIXED',
    "invite_code" VARCHAR(12),
    "maxPlayers" INTEGER NOT NULL DEFAULT 2,
    "totalQuestions" INTEGER NOT NULL DEFAULT 5,
    "time_limit_seconds" INTEGER NOT NULL DEFAULT 900,
    "time_per_question_seconds" INTEGER NOT NULL DEFAULT 180,
    "disciplines" VARCHAR(500) NOT NULL,
    "years" VARCHAR(500) NOT NULL,
    "languages" VARCHAR(200),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "allow_rejoin" BOOLEAN NOT NULL DEFAULT false,
    "allow_spectators" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "pvp_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pvp_room_players" (
    "id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "is_ready" BOOLEAN NOT NULL DEFAULT false,
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMPTZ(6),

    CONSTRAINT "pvp_room_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pvp_room_questions" (
    "id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "enem_question_id" VARCHAR(64) NOT NULL,
    "question_order" INTEGER NOT NULL,

    CONSTRAINT "pvp_room_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pvp_matches" (
    "id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "status" "PvPMatchStatus" NOT NULL DEFAULT 'WAITING',
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "duration_seconds" INTEGER,
    "total_questions" INTEGER NOT NULL,

    CONSTRAINT "pvp_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pvp_player_results" (
    "id" UUID NOT NULL,
    "match_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "incorrect_count" INTEGER NOT NULL DEFAULT 0,
    "total_answered" INTEGER NOT NULL DEFAULT 0,
    "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "total_time_seconds" DOUBLE PRECISION NOT NULL,
    "average_time_per_question" DOUBLE PRECISION NOT NULL,
    "max_streak_correct" INTEGER NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL,
    "is_winner" BOOLEAN NOT NULL DEFAULT false,
    "is_abandoned" BOOLEAN NOT NULL DEFAULT false,
    "xp_earned" INTEGER NOT NULL DEFAULT 0,
    "coins_earned" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pvp_player_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pvp_player_answers" (
    "id" UUID NOT NULL,
    "result_id" UUID NOT NULL,
    "enem_question_id" VARCHAR(64) NOT NULL,
    "selected_alternative" VARCHAR(1) NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "time_to_answer" INTEGER NOT NULL,
    "answered_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pvp_player_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pvp_player_stats" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "total_matches" INTEGER NOT NULL DEFAULT 0,
    "total_wins" INTEGER NOT NULL DEFAULT 0,
    "total_losses" INTEGER NOT NULL DEFAULT 0,
    "total_abandons" INTEGER NOT NULL DEFAULT 0,
    "current_win_streak" INTEGER NOT NULL DEFAULT 0,
    "best_win_streak" INTEGER NOT NULL DEFAULT 0,
    "average_accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "average_time_per_question" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "pvp_rating" INTEGER NOT NULL DEFAULT 1000,
    "best_discipline" VARCHAR(60),
    "best_discipline_win_rate" DOUBLE PRECISION,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pvp_player_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pvp_achievements" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "PvPAchievementType" NOT NULL,
    "unlocked_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pvp_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pvp_leaderboards" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "scope" "PvPLeaderboardScope" NOT NULL,
    "position" INTEGER NOT NULL,
    "pvp_rating" INTEGER NOT NULL,
    "total_wins" INTEGER NOT NULL,
    "week_start_date" TIMESTAMPTZ(6),
    "day_date" DATE,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "pvp_leaderboards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "simulado_attempts_user_id_idx" ON "simulado_attempts"("user_id");

-- CreateIndex
CREATE INDEX "simulado_attempts_year_idx" ON "simulado_attempts"("year");

-- CreateIndex
CREATE INDEX "simulado_attempt_questions_enem_question_id_idx" ON "simulado_attempt_questions"("enem_question_id");

-- CreateIndex
CREATE UNIQUE INDEX "simulado_attempt_questions_attempt_id_order_key" ON "simulado_attempt_questions"("attempt_id", "order");

-- CreateIndex
CREATE UNIQUE INDEX "simulado_attempt_questions_attempt_id_enem_question_id_key" ON "simulado_attempt_questions"("attempt_id", "enem_question_id");

-- CreateIndex
CREATE INDEX "simulado_answers_enem_question_id_idx" ON "simulado_answers"("enem_question_id");

-- CreateIndex
CREATE UNIQUE INDEX "simulado_answers_attempt_id_enem_question_id_key" ON "simulado_answers"("attempt_id", "enem_question_id");

-- CreateIndex
CREATE INDEX "journeys_user_id_idx" ON "journeys"("user_id");

-- CreateIndex
CREATE INDEX "journey_nodes_journey_id_idx" ON "journey_nodes"("journey_id");

-- CreateIndex
CREATE UNIQUE INDEX "journey_nodes_journey_id_order_key" ON "journey_nodes"("journey_id", "order");

-- CreateIndex
CREATE INDEX "journey_node_questions_enem_question_id_idx" ON "journey_node_questions"("enem_question_id");

-- CreateIndex
CREATE UNIQUE INDEX "journey_node_questions_node_id_order_key" ON "journey_node_questions"("node_id", "order");

-- CreateIndex
CREATE INDEX "journey_node_attempts_user_id_idx" ON "journey_node_attempts"("user_id");

-- CreateIndex
CREATE INDEX "journey_node_attempts_node_id_idx" ON "journey_node_attempts"("node_id");

-- CreateIndex
CREATE INDEX "journey_question_answers_enem_question_id_idx" ON "journey_question_answers"("enem_question_id");

-- CreateIndex
CREATE UNIQUE INDEX "journey_question_answers_attempt_id_enem_question_id_key" ON "journey_question_answers"("attempt_id", "enem_question_id");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE INDEX "flyway_schema_history_s_idx" ON "flyway_schema_history"("success");

-- CreateIndex
CREATE INDEX "enem_questions_year_index_idx" ON "enem_questions"("year", "index");

-- CreateIndex
CREATE INDEX "enem_questions_year_language_idx" ON "enem_questions"("year", "language");

-- CreateIndex
CREATE UNIQUE INDEX "pvp_rooms_invite_code_key" ON "pvp_rooms"("invite_code");

-- CreateIndex
CREATE INDEX "pvp_rooms_host_id_idx" ON "pvp_rooms"("host_id");

-- CreateIndex
CREATE INDEX "pvp_rooms_is_active_idx" ON "pvp_rooms"("is_active");

-- CreateIndex
CREATE INDEX "pvp_rooms_created_at_idx" ON "pvp_rooms"("created_at");

-- CreateIndex
CREATE INDEX "pvp_room_players_room_id_idx" ON "pvp_room_players"("room_id");

-- CreateIndex
CREATE INDEX "pvp_room_players_user_id_idx" ON "pvp_room_players"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "pvp_room_players_room_id_user_id_key" ON "pvp_room_players"("room_id", "user_id");

-- CreateIndex
CREATE INDEX "pvp_room_questions_room_id_idx" ON "pvp_room_questions"("room_id");

-- CreateIndex
CREATE INDEX "pvp_room_questions_enem_question_id_idx" ON "pvp_room_questions"("enem_question_id");

-- CreateIndex
CREATE UNIQUE INDEX "pvp_room_questions_room_id_question_order_key" ON "pvp_room_questions"("room_id", "question_order");

-- CreateIndex
CREATE INDEX "pvp_matches_room_id_idx" ON "pvp_matches"("room_id");

-- CreateIndex
CREATE INDEX "pvp_matches_status_idx" ON "pvp_matches"("status");

-- CreateIndex
CREATE INDEX "pvp_matches_completed_at_idx" ON "pvp_matches"("completed_at");

-- CreateIndex
CREATE INDEX "pvp_player_results_match_id_idx" ON "pvp_player_results"("match_id");

-- CreateIndex
CREATE INDEX "pvp_player_results_user_id_idx" ON "pvp_player_results"("user_id");

-- CreateIndex
CREATE INDEX "pvp_player_results_is_winner_idx" ON "pvp_player_results"("is_winner");

-- CreateIndex
CREATE UNIQUE INDEX "pvp_player_results_match_id_user_id_key" ON "pvp_player_results"("match_id", "user_id");

-- CreateIndex
CREATE INDEX "pvp_player_answers_result_id_idx" ON "pvp_player_answers"("result_id");

-- CreateIndex
CREATE INDEX "pvp_player_answers_enem_question_id_idx" ON "pvp_player_answers"("enem_question_id");

-- CreateIndex
CREATE UNIQUE INDEX "pvp_player_answers_result_id_enem_question_id_key" ON "pvp_player_answers"("result_id", "enem_question_id");

-- CreateIndex
CREATE UNIQUE INDEX "pvp_player_stats_user_id_key" ON "pvp_player_stats"("user_id");

-- CreateIndex
CREATE INDEX "pvp_player_stats_pvp_rating_idx" ON "pvp_player_stats"("pvp_rating");

-- CreateIndex
CREATE INDEX "pvp_player_stats_total_wins_idx" ON "pvp_player_stats"("total_wins");

-- CreateIndex
CREATE INDEX "pvp_achievements_user_id_idx" ON "pvp_achievements"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "pvp_achievements_user_id_type_key" ON "pvp_achievements"("user_id", "type");

-- CreateIndex
CREATE INDEX "pvp_leaderboards_scope_position_idx" ON "pvp_leaderboards"("scope", "position");

-- CreateIndex
CREATE UNIQUE INDEX "pvp_leaderboards_user_id_scope_week_start_date_day_date_key" ON "pvp_leaderboards"("user_id", "scope", "week_start_date", "day_date");

-- AddForeignKey
ALTER TABLE "simulado_attempts" ADD CONSTRAINT "simulado_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulado_attempt_questions" ADD CONSTRAINT "simulado_attempt_questions_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "simulado_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulado_attempt_questions" ADD CONSTRAINT "simulado_attempt_questions_enem_question_id_fkey" FOREIGN KEY ("enem_question_id") REFERENCES "enem_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulado_answers" ADD CONSTRAINT "simulado_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "simulado_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulado_answers" ADD CONSTRAINT "simulado_answers_enem_question_id_fkey" FOREIGN KEY ("enem_question_id") REFERENCES "enem_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journeys" ADD CONSTRAINT "journeys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_nodes" ADD CONSTRAINT "journey_nodes_journey_id_fkey" FOREIGN KEY ("journey_id") REFERENCES "journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_node_questions" ADD CONSTRAINT "journey_node_questions_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "journey_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_node_questions" ADD CONSTRAINT "journey_node_questions_enem_question_id_fkey" FOREIGN KEY ("enem_question_id") REFERENCES "enem_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_node_attempts" ADD CONSTRAINT "journey_node_attempts_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "journey_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_node_attempts" ADD CONSTRAINT "journey_node_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_question_answers" ADD CONSTRAINT "journey_question_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "journey_node_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_question_answers" ADD CONSTRAINT "journey_question_answers_enem_question_id_fkey" FOREIGN KEY ("enem_question_id") REFERENCES "enem_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pvp_rooms" ADD CONSTRAINT "pvp_rooms_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pvp_room_players" ADD CONSTRAINT "pvp_room_players_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "pvp_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pvp_room_players" ADD CONSTRAINT "pvp_room_players_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pvp_room_questions" ADD CONSTRAINT "pvp_room_questions_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "pvp_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pvp_room_questions" ADD CONSTRAINT "pvp_room_questions_enem_question_id_fkey" FOREIGN KEY ("enem_question_id") REFERENCES "enem_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pvp_matches" ADD CONSTRAINT "pvp_matches_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "pvp_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pvp_player_results" ADD CONSTRAINT "pvp_player_results_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "pvp_matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pvp_player_results" ADD CONSTRAINT "pvp_player_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pvp_player_answers" ADD CONSTRAINT "pvp_player_answers_result_id_fkey" FOREIGN KEY ("result_id") REFERENCES "pvp_player_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pvp_player_answers" ADD CONSTRAINT "pvp_player_answers_enem_question_id_fkey" FOREIGN KEY ("enem_question_id") REFERENCES "enem_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pvp_player_stats" ADD CONSTRAINT "pvp_player_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pvp_achievements" ADD CONSTRAINT "pvp_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
