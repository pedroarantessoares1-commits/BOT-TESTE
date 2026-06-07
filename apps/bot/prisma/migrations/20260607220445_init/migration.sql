-- CreateTable
CREATE TABLE "users" (
    "id" BIGINT NOT NULL,
    "guildId" BIGINT NOT NULL,
    "username" VARCHAR(100),
    "displayName" VARCHAR(100),
    "avatarUrl" TEXT,
    "level" INTEGER NOT NULL DEFAULT 0,
    "totalXp" BIGINT NOT NULL DEFAULT 0,
    "seasonXp" BIGINT NOT NULL DEFAULT 0,
    "coins" BIGINT NOT NULL DEFAULT 0,
    "dailyStreak" INTEGER NOT NULL DEFAULT 0,
    "lastDaily" TIMESTAMP(3),
    "lastMessageXp" TIMESTAMP(3),
    "lastReactionXp" TIMESTAMP(3),
    "voiceJoinTime" TIMESTAMP(3),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "server_config" (
    "guildId" BIGINT NOT NULL,
    "currencyName" VARCHAR(50) NOT NULL DEFAULT 'Coins',
    "minAccountAgeDays" INTEGER NOT NULL DEFAULT 30,
    "antiraidJoins" INTEGER NOT NULL DEFAULT 10,
    "antiraidSeconds" INTEGER NOT NULL DEFAULT 30,
    "antispamImgCount" INTEGER NOT NULL DEFAULT 3,
    "antispamImgSeconds" INTEGER NOT NULL DEFAULT 10,
    "antispamTxtCount" INTEGER NOT NULL DEFAULT 5,
    "antispamTxtSeconds" INTEGER NOT NULL DEFAULT 10,
    "logChannelId" BIGINT,
    "levelupChannelId" BIGINT,
    "verificationChannelId" BIGINT,
    "verifiedRoleId" BIGINT,
    "unverifiedRoleId" BIGINT,
    "defaultRoleId" BIGINT,
    "xpMessageMin" INTEGER NOT NULL DEFAULT 15,
    "xpMessageMax" INTEGER NOT NULL DEFAULT 25,
    "xpReactionMin" INTEGER NOT NULL DEFAULT 5,
    "xpReactionMax" INTEGER NOT NULL DEFAULT 10,
    "xpVoiceMin" INTEGER NOT NULL DEFAULT 3,
    "xpVoiceMax" INTEGER NOT NULL DEFAULT 5,
    "messageCooldownSec" INTEGER NOT NULL DEFAULT 60,
    "reactionCooldownSec" INTEGER NOT NULL DEFAULT 30,
    "lockdownActive" BOOLEAN NOT NULL DEFAULT false,
    "lockdownAutoDisableMin" INTEGER NOT NULL DEFAULT 5,
    "pointsPerReal" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "server_config_pkey" PRIMARY KEY ("guildId")
);

-- CreateTable
CREATE TABLE "shop_items" (
    "id" SERIAL NOT NULL,
    "guildId" BIGINT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "itemType" VARCHAR(50) NOT NULL,
    "itemValue" TEXT,
    "durationHours" INTEGER,
    "stock" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    "guildId" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    "itemId" INTEGER,
    "amount" INTEGER NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banned_ips" (
    "id" SERIAL NOT NULL,
    "guildId" BIGINT NOT NULL,
    "ipHash" VARCHAR(256) NOT NULL,
    "originalUserId" BIGINT,
    "reason" TEXT,
    "bannedBy" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "banned_ips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_ips" (
    "id" SERIAL NOT NULL,
    "guildId" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    "ipHash" VARCHAR(256) NOT NULL,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_ips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_logs" (
    "id" SERIAL NOT NULL,
    "guildId" BIGINT NOT NULL,
    "eventType" VARCHAR(50) NOT NULL,
    "targetUserId" BIGINT,
    "moderatorId" BIGINT,
    "reason" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seasons" (
    "id" SERIAL NOT NULL,
    "guildId" BIGINT NOT NULL,
    "seasonNum" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "season_snapshots" (
    "id" SERIAL NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "userId" BIGINT NOT NULL,
    "finalLevel" INTEGER NOT NULL,
    "finalXp" BIGINT NOT NULL,
    "finalCoins" BIGINT NOT NULL,
    "rankPos" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "season_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" SERIAL NOT NULL,
    "guildId" BIGINT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "conditionType" VARCHAR(50) NOT NULL,
    "conditionValue" INTEGER NOT NULL,
    "rewardCoins" INTEGER NOT NULL DEFAULT 0,
    "rewardBadge" VARCHAR(100),
    "icon" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" SERIAL NOT NULL,
    "guildId" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    "achievementId" INTEGER NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "missions" (
    "id" SERIAL NOT NULL,
    "guildId" BIGINT NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "description" TEXT NOT NULL,
    "objectiveType" VARCHAR(50) NOT NULL,
    "objectiveValue" INTEGER NOT NULL,
    "rewardXp" INTEGER NOT NULL DEFAULT 0,
    "rewardCoins" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_missions" (
    "id" SERIAL NOT NULL,
    "guildId" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    "missionId" INTEGER NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "user_missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_whitelist" (
    "id" SERIAL NOT NULL,
    "guildId" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    "addedBy" BIGINT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_whitelist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warnings" (
    "id" SERIAL NOT NULL,
    "guildId" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    "moderatorId" BIGINT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_claims" (
    "id" SERIAL NOT NULL,
    "guildId" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "xpReward" INTEGER,
    "coinsReward" INTEGER,

    CONSTRAINT "daily_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_xp_multipliers" (
    "id" SERIAL NOT NULL,
    "guildId" BIGINT NOT NULL,
    "channelId" BIGINT NOT NULL,
    "multiplier" DECIMAL(3,2) NOT NULL DEFAULT 1.00,

    CONSTRAINT "channel_xp_multipliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spam_whitelist" (
    "id" SERIAL NOT NULL,
    "guildId" BIGINT NOT NULL,
    "entityType" VARCHAR(10) NOT NULL,
    "entityId" BIGINT NOT NULL,
    "addedBy" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spam_whitelist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_id_guildId_key" ON "users"("id", "guildId");

-- CreateIndex
CREATE UNIQUE INDEX "banned_ips_guildId_ipHash_key" ON "banned_ips"("guildId", "ipHash");

-- CreateIndex
CREATE UNIQUE INDEX "user_ips_guildId_userId_ipHash_key" ON "user_ips"("guildId", "userId", "ipHash");

-- CreateIndex
CREATE INDEX "idx_modlogs_guild_type" ON "moderation_logs"("guildId", "eventType");

-- CreateIndex
CREATE INDEX "idx_modlogs_guild_date" ON "moderation_logs"("guildId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "seasons_guildId_seasonNum_key" ON "seasons"("guildId", "seasonNum");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_guildId_userId_achievementId_key" ON "user_achievements"("guildId", "userId", "achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "user_missions_guildId_userId_missionId_assignedAt_key" ON "user_missions"("guildId", "userId", "missionId", "assignedAt");

-- CreateIndex
CREATE UNIQUE INDEX "account_whitelist_guildId_userId_key" ON "account_whitelist"("guildId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "channel_xp_multipliers_guildId_channelId_key" ON "channel_xp_multipliers"("guildId", "channelId");

-- CreateIndex
CREATE UNIQUE INDEX "spam_whitelist_guildId_entityType_entityId_key" ON "spam_whitelist"("guildId", "entityType", "entityId");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "shop_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_snapshots" ADD CONSTRAINT "season_snapshots_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "achievements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_missions" ADD CONSTRAINT "user_missions_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
