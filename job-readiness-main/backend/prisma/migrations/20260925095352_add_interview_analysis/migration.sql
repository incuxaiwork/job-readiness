-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(64) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(32) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "status" VARCHAR(32) DEFAULT 'active',
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_profiles" (
    "id" VARCHAR(64) NOT NULL,
    "user_id" VARCHAR(64) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "mobile" VARCHAR(20),
    "college" VARCHAR(255),
    "degree" VARCHAR(128),
    "branch" VARCHAR(128),
    "specialization" VARCHAR(128),
    "country" VARCHAR(128) DEFAULT 'India',
    "state" VARCHAR(128),
    "city" VARCHAR(128),
    "graduation_year" INTEGER,
    "experience_level" VARCHAR(64),
    "tenth_marks" DECIMAL(5,2),
    "twelfth_diploma_marks" DECIMAL(5,2),
    "graduation_percentage" DECIMAL(5,2),
    "backlogs" INTEGER DEFAULT 0,
    "resume_url" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidate_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidates" (
    "id" VARCHAR(64) NOT NULL,
    "experience_level" VARCHAR(64) DEFAULT 'Fresher',
    "job_readiness_score" INTEGER DEFAULT 0,
    "readiness_status" VARCHAR(64) DEFAULT 'In Progress',
    "aptitude_score" INTEGER DEFAULT 0,
    "reasoning_score" INTEGER DEFAULT 0,
    "technical_score" INTEGER DEFAULT 0,
    "verbal_score" INTEGER DEFAULT 0,
    "coding_score" INTEGER DEFAULT 0,
    "assessments_completed" INTEGER DEFAULT 0,
    "tenth_marks" DECIMAL(5,2),
    "twelfth_diploma_marks" DECIMAL(5,2),
    "graduation_percentage" DECIMAL(5,2),
    "backlogs" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" VARCHAR(64) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(64) NOT NULL,
    "difficulty" VARCHAR(32) DEFAULT 'Medium',
    "duration_minutes" INTEGER NOT NULL,
    "total_questions" INTEGER NOT NULL,
    "total_marks" INTEGER NOT NULL,
    "passing_score" INTEGER NOT NULL,
    "status" VARCHAR(32) DEFAULT 'Draft',
    "created_by" VARCHAR(64),
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_sections" (
    "id" VARCHAR(64) NOT NULL,
    "assessment_id" VARCHAR(64) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "question_count" INTEGER NOT NULL,
    "marks_per_question" INTEGER DEFAULT 1,
    "display_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_questions" (
    "id" VARCHAR(64) NOT NULL,
    "assessment_id" VARCHAR(64) NOT NULL,
    "question_id" VARCHAR(64) NOT NULL,
    "section_id" VARCHAR(64),
    "category" VARCHAR(64),
    "topic" VARCHAR(255),
    "question" TEXT,
    "difficulty" VARCHAR(32),
    "options" JSONB,
    "correct_answer" VARCHAR(16),
    "marks" INTEGER DEFAULT 1,
    "constraints" JSONB,
    "starter_templates" JSONB,
    "test_cases" JSONB,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" VARCHAR(64) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "category" VARCHAR(64) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(32) DEFAULT 'active',
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" VARCHAR(64) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "category" VARCHAR(64),
    "description" TEXT,
    "status" VARCHAR(32) DEFAULT 'active',
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" VARCHAR(64) NOT NULL,
    "topic_id" VARCHAR(64),
    "topic" VARCHAR(255),
    "category" VARCHAR(64) NOT NULL,
    "difficulty" VARCHAR(32) NOT NULL,
    "type" VARCHAR(64) NOT NULL,
    "question" TEXT NOT NULL,
    "code_snippet" TEXT,
    "language" VARCHAR(32),
    "explanation" TEXT,
    "marks" INTEGER DEFAULT 1,
    "time_limit_sec" INTEGER DEFAULT 60,
    "status" VARCHAR(32) DEFAULT 'Active',
    "source" VARCHAR(32) DEFAULT 'Manual',
    "created_by" VARCHAR(64),
    "options" JSONB,
    "correct_answer" VARCHAR(16),
    "tags" TEXT[],
    "constraints" JSONB,
    "starter_templates" JSONB,
    "test_cases" JSONB,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_options" (
    "id" VARCHAR(64) NOT NULL,
    "question_id" VARCHAR(64) NOT NULL,
    "option_key" VARCHAR(8) NOT NULL,
    "option_text" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL,
    "is_correct" BOOLEAN DEFAULT false,

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_skills" (
    "id" VARCHAR(64) NOT NULL,
    "question_id" VARCHAR(64) NOT NULL,
    "skill_id" VARCHAR(64) NOT NULL,
    "weight" DECIMAL DEFAULT 1.0,

    CONSTRAINT "question_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_attempts" (
    "id" VARCHAR(64) NOT NULL,
    "candidate_id" VARCHAR(64) NOT NULL,
    "assessment_id" VARCHAR(64) NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "status" VARCHAR(32) DEFAULT 'InProgress',
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMPTZ,
    "time_taken_seconds" INTEGER,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_answers" (
    "id" VARCHAR(64) NOT NULL,
    "attempt_id" VARCHAR(64) NOT NULL,
    "question_id" VARCHAR(64) NOT NULL,
    "selected_option" VARCHAR(8),
    "is_correct" BOOLEAN,
    "marks_obtained" DECIMAL DEFAULT 0,
    "time_taken_seconds" INTEGER,
    "answered_at" TIMESTAMPTZ,

    CONSTRAINT "candidate_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_analysis" (
    "id" VARCHAR(64) NOT NULL,
    "attempt_id" VARCHAR(64) NOT NULL,
    "overall_score" DECIMAL NOT NULL,
    "accuracy" DECIMAL NOT NULL,
    "speed_score" DECIMAL NOT NULL,
    "aptitude_score" DECIMAL,
    "reasoning_score" DECIMAL,
    "technical_score" DECIMAL,
    "strengths" JSONB,
    "weaknesses" JSONB,
    "ai_summary" TEXT,
    "recommendations" JSONB,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "performance_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_performance" (
    "id" VARCHAR(64) NOT NULL,
    "attempt_id" VARCHAR(64) NOT NULL,
    "candidate_id" VARCHAR(64) NOT NULL,
    "skill_id" VARCHAR(64) NOT NULL,
    "score" DECIMAL NOT NULL,
    "proficiency" VARCHAR(32),
    "questions_attempted" INTEGER DEFAULT 0,
    "correct_answers" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" VARCHAR(64) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "industry" VARCHAR(128),
    "description" TEXT,
    "website" TEXT,
    "status" VARCHAR(32) DEFAULT 'Active',
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_roles" (
    "id" VARCHAR(64) NOT NULL,
    "company_id" VARCHAR(64) NOT NULL,
    "role_name" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "experience_level" VARCHAR(64),
    "status" VARCHAR(32) DEFAULT 'Active',
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_skill_requirements" (
    "id" VARCHAR(64) NOT NULL,
    "role_id" VARCHAR(64) NOT NULL,
    "skill_id" VARCHAR(64) NOT NULL,
    "required_score" DECIMAL,
    "weight" DECIMAL DEFAULT 1.0,
    "importance" VARCHAR(32) DEFAULT 'Required',

    CONSTRAINT "role_skill_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_readiness" (
    "id" VARCHAR(64) NOT NULL,
    "candidate_id" VARCHAR(64) NOT NULL,
    "attempt_id" VARCHAR(64),
    "company_id" VARCHAR(64) NOT NULL,
    "role_id" VARCHAR(64) NOT NULL,
    "readiness_score" DECIMAL NOT NULL,
    "readiness_level" VARCHAR(32),
    "matched_skills" JSONB,
    "skill_gaps" JSONB,
    "ai_analysis" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_readiness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" VARCHAR(64) NOT NULL,
    "candidate_id" VARCHAR(64) NOT NULL,
    "attempt_id" VARCHAR(64),
    "report_type" VARCHAR(64),
    "overall_score" DECIMAL,
    "summary" TEXT,
    "strengths" JSONB,
    "weaknesses" JSONB,
    "recommendations" JSONB,
    "report_url" TEXT,
    "generated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" VARCHAR(64) NOT NULL,
    "candidate_id" VARCHAR(64),
    "assessment_id" VARCHAR(64),
    "score" INTEGER NOT NULL,
    "accuracy" INTEGER NOT NULL,
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "incorrect_count" INTEGER NOT NULL DEFAULT 0,
    "unanswered_count" INTEGER NOT NULL DEFAULT 0,
    "time_taken" VARCHAR(64),
    "category_scores" JSONB,
    "topic_breakdown" JSONB,
    "answers" JSONB,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_submissions" (
    "id" VARCHAR(64) NOT NULL,
    "candidate_id" VARCHAR(64),
    "candidate_name" VARCHAR(255),
    "candidate_email" VARCHAR(255),
    "assessment_id" VARCHAR(64),
    "assessment_title" VARCHAR(255),
    "score" INTEGER NOT NULL,
    "accuracy" INTEGER NOT NULL,
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "incorrect_count" INTEGER NOT NULL DEFAULT 0,
    "unanswered_count" INTEGER NOT NULL DEFAULT 0,
    "time_taken" VARCHAR(64),
    "category_scores" JSONB,
    "topic_breakdown" JSONB,
    "answers" JSONB,
    "status" VARCHAR(32) DEFAULT 'Completed',
    "proctoring_violations" INTEGER DEFAULT 0,
    "auto_submitted" BOOLEAN DEFAULT false,
    "auto_submit_reason" VARCHAR(128),
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proctoring_events" (
    "id" VARCHAR(64) NOT NULL,
    "attempt_id" VARCHAR(128) NOT NULL,
    "candidate_id" VARCHAR(64),
    "assessment_id" VARCHAR(64),
    "type" VARCHAR(64) NOT NULL,
    "timestamp" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "details" JSONB,

    CONSTRAINT "proctoring_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_eligibility_criteria" (
    "id" VARCHAR(64) NOT NULL,
    "company" VARCHAR(128) NOT NULL,
    "role" VARCHAR(128) NOT NULL,
    "tenth_percentage" DECIMAL(5,2) DEFAULT 60.00,
    "twelfth_diploma_percentage" DECIMAL(5,2) DEFAULT 60.00,
    "graduation_percentage" DECIMAL(5,2) DEFAULT 60.00,
    "max_backlogs" INTEGER DEFAULT 0,
    "aptitude_cutoff" INTEGER DEFAULT 60,
    "reasoning_cutoff" INTEGER DEFAULT 60,
    "verbal_cutoff" INTEGER DEFAULT 60,
    "technical_cutoff" INTEGER DEFAULT 60,
    "coding_cutoff" INTEGER DEFAULT 50,
    "overall_readiness_cutoff" INTEGER DEFAULT 60,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_eligibility_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_sessions" (
    "id" VARCHAR(64) NOT NULL,
    "user_id" VARCHAR(64),
    "status" VARCHAR(32) NOT NULL DEFAULT 'IN_PROGRESS',
    "target_role" VARCHAR(128) DEFAULT 'Software Engineer',
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,
    "duration" INTEGER DEFAULT 0,
    "overall_score" DECIMAL(5,2),
    "interview_score" DECIMAL(5,2),
    "communication_score" DECIMAL(5,2),
    "confidence_score" DECIMAL(5,2),
    "eye_contact_score" DECIMAL(5,2),
    "attention_score" DECIMAL(5,2),
    "technical_score" DECIMAL(5,2),
    "expression_score" DECIMAL(5,2),
    "speech_score" DECIMAL(5,2),
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interview_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_questions" (
    "id" VARCHAR(64) NOT NULL,
    "session_id" VARCHAR(64) NOT NULL,
    "question_number" INTEGER NOT NULL,
    "question_text" TEXT NOT NULL,
    "category" VARCHAR(64) NOT NULL DEFAULT 'TECHNICAL',
    "asked_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,

    CONSTRAINT "interview_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_answers" (
    "id" VARCHAR(64) NOT NULL,
    "question_id" VARCHAR(64) NOT NULL,
    "transcript" TEXT NOT NULL,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,
    "duration" INTEGER DEFAULT 0,
    "overall_score" DECIMAL(5,2),
    "communication_score" DECIMAL(5,2),
    "technical_score" DECIMAL(5,2),
    "confidence_score" DECIMAL(5,2),
    "eye_contact_score" DECIMAL(5,2),
    "attention_score" DECIMAL(5,2),
    "relevance_score" DECIMAL(5,2),
    "dominant_emotion" VARCHAR(64),
    "speech_rate" DECIMAL(5,2),
    "answer_quality" VARCHAR(64),
    "ai_feedback" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interview_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_telemetry" (
    "id" VARCHAR(64) NOT NULL,
    "session_id" VARCHAR(64) NOT NULL,
    "question_id" VARCHAR(64),
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "face_detected" BOOLEAN NOT NULL DEFAULT true,
    "eye_contact" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "gaze_direction" VARCHAR(64),
    "blink_rate" DECIMAL(5,2),
    "emotion" VARCHAR(64) NOT NULL DEFAULT 'Neutral',
    "emotion_confidence" DECIMAL(5,2),
    "attention" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "confidence" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "pitch" DECIMAL(5,2),
    "yaw" DECIMAL(5,2),
    "roll" DECIMAL(5,2),
    "speech_rate" DECIMAL(5,2),
    "lip_sync" DECIMAL(5,2),
    "expression_stability" DECIMAL(5,2),

    CONSTRAINT "interview_telemetry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_analysis" (
    "id" VARCHAR(64) NOT NULL,
    "session_id" VARCHAR(64) NOT NULL,
    "overall_score" DECIMAL(5,2) NOT NULL,
    "communication_score" DECIMAL(5,2) NOT NULL,
    "confidence_score" DECIMAL(5,2) NOT NULL,
    "eye_contact_score" DECIMAL(5,2) NOT NULL,
    "attention_score" DECIMAL(5,2) NOT NULL,
    "expression_score" DECIMAL(5,2) NOT NULL,
    "technical_score" DECIMAL(5,2) NOT NULL,
    "speech_score" DECIMAL(5,2) NOT NULL,
    "blink_rate" DECIMAL(5,2),
    "dominant_emotion" VARCHAR(64),
    "emotion_stability" DECIMAL(5,2),
    "lip_sync_score" DECIMAL(5,2),
    "strengths" JSONB,
    "weaknesses" JSONB,
    "recommendations" JSONB,
    "ai_feedback" TEXT,
    "question_breakdown" JSONB,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interview_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_profiles_email_key" ON "candidate_profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_questions_assessment_id_question_id_key" ON "assessment_questions"("assessment_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");

-- CreateIndex
CREATE UNIQUE INDEX "question_skills_question_id_skill_id_key" ON "question_skills"("question_id", "skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "performance_analysis_attempt_id_key" ON "performance_analysis"("attempt_id");

-- CreateIndex
CREATE UNIQUE INDEX "companies_name_key" ON "companies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "role_skill_requirements_role_id_skill_id_key" ON "role_skill_requirements"("role_id", "skill_id");

-- CreateIndex
CREATE INDEX "assessment_submissions_candidate_id_idx" ON "assessment_submissions"("candidate_id");

-- CreateIndex
CREATE INDEX "assessment_submissions_candidate_id_assessment_id_idx" ON "assessment_submissions"("candidate_id", "assessment_id");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_submissions_candidate_id_assessment_id_key" ON "assessment_submissions"("candidate_id", "assessment_id");

-- CreateIndex
CREATE INDEX "proctoring_events_attempt_id_idx" ON "proctoring_events"("attempt_id");

-- CreateIndex
CREATE INDEX "proctoring_events_candidate_id_idx" ON "proctoring_events"("candidate_id");

-- CreateIndex
CREATE INDEX "proctoring_events_assessment_id_idx" ON "proctoring_events"("assessment_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_company_role" ON "company_eligibility_criteria"("company", "role");

-- CreateIndex
CREATE INDEX "interview_sessions_user_id_idx" ON "interview_sessions"("user_id");

-- CreateIndex
CREATE INDEX "interview_sessions_status_idx" ON "interview_sessions"("status");

-- CreateIndex
CREATE INDEX "interview_questions_session_id_idx" ON "interview_questions"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "interview_questions_session_id_question_number_key" ON "interview_questions"("session_id", "question_number");

-- CreateIndex
CREATE INDEX "interview_answers_question_id_idx" ON "interview_answers"("question_id");

-- CreateIndex
CREATE INDEX "interview_telemetry_session_id_idx" ON "interview_telemetry"("session_id");

-- CreateIndex
CREATE INDEX "interview_telemetry_question_id_idx" ON "interview_telemetry"("question_id");

-- CreateIndex
CREATE INDEX "interview_telemetry_timestamp_idx" ON "interview_telemetry"("timestamp");

-- CreateIndex
CREATE INDEX "interview_telemetry_session_id_timestamp_idx" ON "interview_telemetry"("session_id", "timestamp");

-- CreateIndex
CREATE INDEX "interview_telemetry_question_id_timestamp_idx" ON "interview_telemetry"("question_id", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "interview_analysis_session_id_key" ON "interview_analysis"("session_id");

-- AddForeignKey
ALTER TABLE "candidate_profiles" ADD CONSTRAINT "candidate_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_sections" ADD CONSTRAINT "assessment_sections_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "assessment_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_skills" ADD CONSTRAINT "question_skills_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_skills" ADD CONSTRAINT "question_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_answers" ADD CONSTRAINT "candidate_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "test_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_answers" ADD CONSTRAINT "candidate_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_analysis" ADD CONSTRAINT "performance_analysis_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "test_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_performance" ADD CONSTRAINT "skill_performance_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "test_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_performance" ADD CONSTRAINT "skill_performance_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_performance" ADD CONSTRAINT "skill_performance_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_roles" ADD CONSTRAINT "company_roles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_skill_requirements" ADD CONSTRAINT "role_skill_requirements_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "company_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_skill_requirements" ADD CONSTRAINT "role_skill_requirements_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_readiness" ADD CONSTRAINT "company_readiness_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_readiness" ADD CONSTRAINT "company_readiness_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "test_attempts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_readiness" ADD CONSTRAINT "company_readiness_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_readiness" ADD CONSTRAINT "company_readiness_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "company_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "test_attempts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_questions" ADD CONSTRAINT "interview_questions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "interview_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_answers" ADD CONSTRAINT "interview_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "interview_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_telemetry" ADD CONSTRAINT "interview_telemetry_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "interview_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_telemetry" ADD CONSTRAINT "interview_telemetry_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "interview_questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_analysis" ADD CONSTRAINT "interview_analysis_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "interview_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
