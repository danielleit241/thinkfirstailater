-- CreateTable
CREATE TABLE "activity_completion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_completion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_completion_activityId_idx" ON "activity_completion"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "activity_completion_userId_activityId_key" ON "activity_completion"("userId", "activityId");

-- AddForeignKey
ALTER TABLE "activity_completion" ADD CONSTRAINT "activity_completion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_completion" ADD CONSTRAINT "activity_completion_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
