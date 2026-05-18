-- AddForeignKey
ALTER TABLE "pvp_leaderboards" ADD CONSTRAINT "pvp_leaderboards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
