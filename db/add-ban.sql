-- شغّله مرة واحدة على قاعدة بيانات موجودة (schema.sql الجديد فيه الأعمدة أصلاً).
ALTER TABLE influencers
  MODIFY status ENUM('pending','approved','rejected','banned') NOT NULL DEFAULT 'pending',
  ADD COLUMN ban_reason TEXT NULL,
  ADD COLUMN banned_at DATETIME NULL;
