-- CreateTable
CREATE TABLE "enem_essays" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "theme" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "word_count" INTEGER NOT NULL,
    "line_count" INTEGER NOT NULL,
    "final_score" INTEGER NOT NULL DEFAULT 0,
    "competency_1" INTEGER NOT NULL,
    "competency_2" INTEGER NOT NULL,
    "competency_3" INTEGER NOT NULL,
    "competency_4" INTEGER NOT NULL,
    "competency_5" INTEGER NOT NULL,
    "correction_status" TEXT NOT NULL DEFAULT 'pending',
    "zero_cause" TEXT,
    "ai_correction" JSONB,
    "submitted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "corrected_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "enem_essays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enem_essay_analyses" (
    "id" UUID NOT NULL,
    "essay_id" UUID NOT NULL,
    "theme_identified" TEXT,
    "thesis_detected" TEXT,
    "grammar_errors" INTEGER NOT NULL DEFAULT 0,
    "spelling_errors" INTEGER NOT NULL DEFAULT 0,
    "punctuation_errors" INTEGER NOT NULL DEFAULT 0,
    "concordance_errors" INTEGER NOT NULL DEFAULT 0,
    "c1_level" TEXT NOT NULL,
    "theme_adherence" DOUBLE PRECISION NOT NULL,
    "repertoire_count" INTEGER NOT NULL DEFAULT 0,
    "valid_repertoires" INTEGER NOT NULL DEFAULT 0,
    "productive_repertoires" INTEGER NOT NULL DEFAULT 0,
    "c2_level" TEXT NOT NULL,
    "argument_count" INTEGER NOT NULL DEFAULT 0,
    "argument_depth" TEXT NOT NULL,
    "logical_progression" DOUBLE PRECISION NOT NULL,
    "criticality" DOUBLE PRECISION NOT NULL,
    "c3_level" TEXT NOT NULL,
    "connector_count" INTEGER NOT NULL DEFAULT 0,
    "connector_variety" DOUBLE PRECISION NOT NULL,
    "textual_flow" DOUBLE PRECISION NOT NULL,
    "paragraph_structure" TEXT NOT NULL,
    "c4_level" TEXT NOT NULL,
    "has_agent" BOOLEAN NOT NULL DEFAULT false,
    "has_action" BOOLEAN NOT NULL DEFAULT false,
    "has_means" BOOLEAN NOT NULL DEFAULT false,
    "has_effect" BOOLEAN NOT NULL DEFAULT false,
    "has_details" BOOLEAN NOT NULL DEFAULT false,
    "intervention_viability" TEXT NOT NULL,
    "c5_level" TEXT NOT NULL,
    "writing_style" TEXT NOT NULL,
    "stylistic_profile" TEXT NOT NULL,
    "lexical_richness" DOUBLE PRECISION NOT NULL,
    "textual_complexity" DOUBLE PRECISION NOT NULL,
    "coherence_score" DOUBLE PRECISION NOT NULL,
    "strengths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "weaknesses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "improvements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "national_avg_distance" DOUBLE PRECISION NOT NULL,
    "percentile_rank" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "enem_essay_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enem_essay_stats" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "total_essays" INTEGER NOT NULL DEFAULT 0,
    "zero_rated_essays" INTEGER NOT NULL DEFAULT 0,
    "average_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "best_score" INTEGER NOT NULL DEFAULT 0,
    "worst_score" INTEGER NOT NULL DEFAULT 0,
    "median_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avg_competency_1" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avg_competency_2" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avg_competency_3" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avg_competency_4" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avg_competency_5" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "evolution_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tendency_direction" TEXT NOT NULL DEFAULT 'stable',
    "essays_per_week" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_essay_date" TIMESTAMPTZ(6),
    "consistency_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weakest_competency" INTEGER NOT NULL,
    "strongest_competency" INTEGER NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "enem_essay_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enem_essay_competency_histories" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "period" VARCHAR(20) NOT NULL,
    "start_date" TIMESTAMPTZ(6) NOT NULL,
    "end_date" TIMESTAMPTZ(6) NOT NULL,
    "avgScore" DOUBLE PRECISION NOT NULL,
    "c1_avg" DOUBLE PRECISION NOT NULL,
    "c2_avg" DOUBLE PRECISION NOT NULL,
    "c3_avg" DOUBLE PRECISION NOT NULL,
    "c4_avg" DOUBLE PRECISION NOT NULL,
    "c5_avg" DOUBLE PRECISION NOT NULL,
    "trend" VARCHAR(20) NOT NULL,
    "essay_count" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enem_essay_competency_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "enem_essays_user_id_idx" ON "enem_essays"("user_id");

-- CreateIndex
CREATE INDEX "enem_essays_submitted_at_idx" ON "enem_essays"("submitted_at");

-- CreateIndex
CREATE UNIQUE INDEX "enem_essay_analyses_essay_id_key" ON "enem_essay_analyses"("essay_id");

-- CreateIndex
CREATE INDEX "enem_essay_analyses_essay_id_idx" ON "enem_essay_analyses"("essay_id");

-- CreateIndex
CREATE UNIQUE INDEX "enem_essay_stats_user_id_key" ON "enem_essay_stats"("user_id");

-- CreateIndex
CREATE INDEX "enem_essay_stats_user_id_idx" ON "enem_essay_stats"("user_id");

-- CreateIndex
CREATE INDEX "enem_essay_competency_histories_user_id_idx" ON "enem_essay_competency_histories"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "enem_essay_competency_histories_user_id_period_start_date_key" ON "enem_essay_competency_histories"("user_id", "period", "start_date");

-- AddForeignKey
ALTER TABLE "enem_essays" ADD CONSTRAINT "enem_essays_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enem_essay_analyses" ADD CONSTRAINT "enem_essay_analyses_essay_id_fkey" FOREIGN KEY ("essay_id") REFERENCES "enem_essays"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enem_essay_stats" ADD CONSTRAINT "enem_essay_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enem_essay_competency_histories" ADD CONSTRAINT "enem_essay_competency_histories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
