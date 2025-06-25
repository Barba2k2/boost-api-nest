-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "nickname" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "last_login" TIMESTAMP(3),
    "refresh_token" TEXT,
    "web_token" TEXT,
    "windows_token" TEXT,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "streamers" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "platforms" TEXT[],
    "usual_start_time" TEXT,
    "usual_end_time" TEXT,
    "stream_days" TEXT[],
    "is_online" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "streamers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_media" (
    "id" SERIAL NOT NULL,
    "streamer_id" INTEGER NOT NULL,
    "twitch_channel" TEXT,
    "youtube_channel" TEXT,
    "instagram_handle" TEXT,
    "tiktok_handle" TEXT,
    "facebook_page" TEXT,

    CONSTRAINT "social_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" SERIAL NOT NULL,
    "streamer_url" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scores" (
    "id" SERIAL NOT NULL,
    "streamer_id" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "hour" INTEGER NOT NULL,
    "minute" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,

    CONSTRAINT "scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_nickname_key" ON "users"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "streamers_user_id_key" ON "streamers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "social_media_streamer_id_key" ON "social_media"("streamer_id");

-- CreateIndex
CREATE UNIQUE INDEX "scores_streamer_id_date_hour_minute_key" ON "scores"("streamer_id", "date", "hour", "minute");

-- AddForeignKey
ALTER TABLE "streamers" ADD CONSTRAINT "streamers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_media" ADD CONSTRAINT "social_media_streamer_id_fkey" FOREIGN KEY ("streamer_id") REFERENCES "streamers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scores" ADD CONSTRAINT "scores_streamer_id_fkey" FOREIGN KEY ("streamer_id") REFERENCES "streamers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
