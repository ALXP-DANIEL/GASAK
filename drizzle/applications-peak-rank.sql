-- Recruitment applications capture the applicant's peak rank, not their
-- current rank (playerProfiles keeps both; this table only has the one).
ALTER TABLE gasak_applications
  RENAME COLUMN current_rank TO peak_rank;
