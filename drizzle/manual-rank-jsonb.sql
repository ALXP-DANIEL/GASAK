-- Migrate gasak_player_profiles.current_rank / peak_rank and
-- gasak_applications.current_rank from free-text (anything users typed)
-- to a structured jsonb { tier, division, stars }.
--
-- The legacy field accepted arbitrary input, so values are normalized:
--   * pure number        -> Mythic tier by star threshold
--                           (<25 Mythic, 25-49 Mythical Honor,
--                            50-99 Mythical Glory, >=100 Mythical Immortal)
--   * text (+opt number) -> canonical tier via alias map (case/space
--                           insensitive; "Immortal"->Mythical Immortal,
--                           "Glory"->Mythical Glory, "Honor"->Mythical Honor,
--                           "mythic immortal"->Mythical Immortal, ...); a
--                           trailing integer is captured as `stars`.
--   * null / empty       -> null
--   * anything unmappable-> null
-- normalizeRank (client) re-clamps division/stars on read/submit.
--
-- Idempotent: the ALTER only runs while the column is still `text`.

CREATE OR REPLACE FUNCTION gasak_normalize_rank(raw text)
RETURNS jsonb AS $$
DECLARE
  v text := nullif(btrim(coalesce(raw, '')), '');
  lower_v text;
  base text;
  trailing_num text;
  num int;
  canonical text;
  stars int := 0;
BEGIN
  IF v IS NULL THEN
    RETURN NULL;
  END IF;
  lower_v := lower(v);

  -- Pure integer: map by Mythic star threshold.
  IF v ~ '^[0-9]+$' THEN
    num := v::int;
    IF num < 0 THEN
      RETURN NULL;
    ELSIF num >= 100 THEN
      canonical := 'Mythical Immortal';
    ELSIF num >= 50 THEN
      canonical := 'Mythical Glory';
    ELSIF num >= 25 THEN
      canonical := 'Mythical Honor';
    ELSE
      canonical := 'Mythic';
    END IF;
    RETURN jsonb_build_object('tier', canonical, 'division', NULL, 'stars', num);
  END IF;

  -- Split off a trailing integer (e.g. "Immortal 100", "Epic 1").
  trailing_num := (regexp_match(v, '([0-9]+)\s*$'))[1];
  IF trailing_num IS NOT NULL THEN
    num := trailing_num::int;
    base := btrim(regexp_replace(v, '\s*[0-9]+\s*$', '', 'i'));
  ELSE
    base := v;
  END IF;
  lower_v := lower(base);

  canonical := CASE lower_v
    WHEN 'warrior'            THEN 'Warrior'
    WHEN 'elite'             THEN 'Elite'
    WHEN 'master'            THEN 'Master'
    WHEN 'grandmaster'       THEN 'Grandmaster'
    WHEN 'epic'              THEN 'Epic'
    WHEN 'legend'            THEN 'Legend'
    WHEN 'mythic'            THEN 'Mythic'
    WHEN 'honor'             THEN 'Mythical Honor'
    WHEN 'glory'             THEN 'Mythical Glory'
    WHEN 'immortal'          THEN 'Mythical Immortal'
    WHEN 'mythical honor'    THEN 'Mythical Honor'
    WHEN 'mythical glory'    THEN 'Mythical Glory'
    WHEN 'mythical immortal' THEN 'Mythical Immortal'
    WHEN 'mythic honor'      THEN 'Mythical Honor'
    WHEN 'mythic glory'      THEN 'Mythical Glory'
    WHEN 'mythic immortal'   THEN 'Mythical Immortal'
    ELSE NULL
  END;

  IF canonical IS NULL THEN
    RETURN NULL;
  END IF;

  stars := coalesce(num, 0);
  RETURN jsonb_build_object('tier', canonical, 'division', NULL, 'stars', stars);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DO $$
BEGIN
  IF (SELECT data_type FROM information_schema.columns
        WHERE table_name = 'gasak_player_profiles' AND column_name = 'current_rank') = 'text' THEN
    ALTER TABLE gasak_player_profiles
      ALTER COLUMN current_rank TYPE jsonb
      USING gasak_normalize_rank(current_rank);
  END IF;

  IF (SELECT data_type FROM information_schema.columns
        WHERE table_name = 'gasak_player_profiles' AND column_name = 'peak_rank') = 'text' THEN
    ALTER TABLE gasak_player_profiles
      ALTER COLUMN peak_rank TYPE jsonb
      USING gasak_normalize_rank(peak_rank);
  END IF;

  IF (SELECT data_type FROM information_schema.columns
        WHERE table_name = 'gasak_applications' AND column_name = 'current_rank') = 'text' THEN
    ALTER TABLE gasak_applications
      ALTER COLUMN current_rank TYPE jsonb
      USING gasak_normalize_rank(current_rank);
  END IF;
END $$;

DROP FUNCTION IF EXISTS gasak_normalize_rank(text);
