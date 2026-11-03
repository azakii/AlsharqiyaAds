-- MySQL 8 / MariaDB 10.4+ schema for AlsharqiyaAds (ported from the Supabase Postgres schema).
-- Access control that RLS used to enforce now lives in the server code (lib/data.ts, lib/actions.ts).
-- Timestamps are stored in UTC; lib/db.ts sets the session time zone to +00:00.

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  reset_token_hash CHAR(64) NULL,
  reset_expires DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX users_reset_token_idx (reset_token_hash)
) CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS influencers (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  city VARCHAR(100),
  category VARCHAR(100),
  bio TEXT,
  followers INT DEFAULT 0,
  views INT DEFAULT 0,
  clicks INT DEFAULT 0,
  ad_requests INT DEFAULT 0,
  avatar_url TEXT,
  verified TINYINT(1) DEFAULT 0,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  socials JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  auth_user_id CHAR(36) NULL,
  license_number VARCHAR(100) NULL,
  slug VARCHAR(191) NULL UNIQUE,
  plan ENUM('free','pro','vip') NOT NULL DEFAULT 'free',
  plan_expires_at DATETIME NULL,
  INDEX influencers_auth_user_id_idx (auth_user_id),
  INDEX influencers_status_idx (status, created_at),
  CONSTRAINT influencers_auth_user_fk FOREIGN KEY (auth_user_id) REFERENCES users(id) ON DELETE SET NULL
) CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS ad_requests (
  id CHAR(36) NOT NULL PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  category VARCHAR(100),
  city VARCHAR(100),
  details TEXT,
  budget DECIMAL(14,2) DEFAULT 0,
  target_influencer VARCHAR(255),
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS seo_pages (
  id CHAR(36) NOT NULL PRIMARY KEY,
  path VARCHAR(255) NOT NULL UNIQUE,
  label VARCHAR(255),
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  canonical_url TEXT,
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  og_type VARCHAR(50) DEFAULT 'website',
  twitter_card VARCHAR(50) DEFAULT 'summary_large_image',
  twitter_title TEXT,
  twitter_description TEXT,
  twitter_image TEXT,
  robots_index TINYINT(1) DEFAULT 1,
  robots_follow TINYINT(1) DEFAULT 1,
  structured_data JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS site_settings (
  id INT NOT NULL DEFAULT 1 PRIMARY KEY,
  brand_name TEXT, brand_name_en TEXT, logo_url TEXT,
  hero_badge TEXT, hero_title TEXT, hero_subtitle TEXT, hero_image TEXT,
  cta_title TEXT, cta_text TEXT, footer_about TEXT,
  contact_phone TEXT, contact_email TEXT, contact_location TEXT, support_whatsapp TEXT,
  color_bg TEXT, color_gold TEXT, color_gold_light TEXT, color_gold_dark TEXT,
  favicon_url TEXT, default_og_image TEXT, default_meta_title TEXT, default_meta_description TEXT,
  default_meta_keywords TEXT, twitter_handle TEXT, google_site_verification TEXT,
  default_robots_index TINYINT(1) DEFAULT 1,
  default_robots_follow TINYINT(1) DEFAULT 1,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT single_row CHECK (id = 1)
) CHARACTER SET utf8mb4;
