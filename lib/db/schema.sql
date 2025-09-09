-- Database schema for Circle Board application
-- Creates tables for games, applications, and matches

-- Users table (already exists but included for reference)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  team_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Games table for practice match listings
CREATE TABLE IF NOT EXISTS games (
  id VARCHAR(255) PRIMARY KEY DEFAULT (UUID()),
  team_name VARCHAR(255) NOT NULL,
  sport VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location VARCHAR(500) NOT NULL,
  contact VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('open', 'matched') DEFAULT 'open',
  owner_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_games_status (status),
  INDEX idx_games_sport (sport),
  INDEX idx_games_date (date),
  INDEX idx_games_owner (owner_id)
);

-- Applications table for teams applying to games
CREATE TABLE IF NOT EXISTS applications (
  id VARCHAR(255) PRIMARY KEY DEFAULT (UUID()),
  game_id VARCHAR(255) NOT NULL,
  applicant_team_name VARCHAR(255) NOT NULL,
  applicant_contact VARCHAR(255) NOT NULL,
  applicant_id VARCHAR(255) NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  message TEXT,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  FOREIGN KEY (applicant_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_application (game_id, applicant_id),
  INDEX idx_applications_game (game_id),
  INDEX idx_applications_applicant (applicant_id),
  INDEX idx_applications_status (status)
);

-- Matches table for confirmed practice matches
CREATE TABLE IF NOT EXISTS matches (
  id VARCHAR(255) PRIMARY KEY DEFAULT (UUID()),
  game_id VARCHAR(255) NOT NULL,
  application_id VARCHAR(255) NOT NULL,
  host_team_name VARCHAR(255) NOT NULL,
  guest_team_name VARCHAR(255) NOT NULL,
  host_contact VARCHAR(255) NOT NULL,
  guest_contact VARCHAR(255) NOT NULL,
  host_id VARCHAR(255) NOT NULL,
  guest_id VARCHAR(255) NOT NULL,
  sport VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location VARCHAR(500) NOT NULL,
  description TEXT,
  matched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (guest_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_match (game_id),
  INDEX idx_matches_host (host_id),
  INDEX idx_matches_guest (guest_id),
  INDEX idx_matches_date (date)
);