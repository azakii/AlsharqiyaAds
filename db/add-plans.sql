-- شغّله مرة واحدة على قاعدة بيانات موجودة (الـ schema.sql الجديد فيه الأعمدة أصلاً).
ALTER TABLE influencers
  ADD COLUMN plan ENUM('free','pro','vip') NOT NULL DEFAULT 'free',
  ADD COLUMN plan_expires_at DATETIME NULL;
