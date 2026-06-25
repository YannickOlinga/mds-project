-- =====================================================================
-- Périnéa — Données initiales (templates de contenu)
-- À exécuter APRÈS schema.sql, dans le SQL Editor.
-- Idempotent grâce aux ON CONFLICT / NOT EXISTS.
-- =====================================================================

-- --- Exercices ----------------------------------------------------------
insert into public.exercise_templates (level_key, name, description, icon, duration_minutes, timer_duration_seconds, sort_order)
select * from (values
  ('debutant'::level_key,      'Respiration guidée',   'Synchronise ta respiration pour relâcher le périnée.', '🌬️', 5,  10, 1),
  ('debutant'::level_key,      'Contractions douces',  'Contractions courtes pour réveiller les muscles.',     '💧', 5,  10, 2),
  ('intermediaire'::level_key, 'Maintien',             'Contractions maintenues plus longues.',                '🔥', 8,  15, 1),
  ('avance'::level_key,        'Endurance',            'Séries longues pour renforcer la tonicité.',           '⚡', 12, 20, 1)
) as v(level_key, name, description, icon, duration_minutes, timer_duration_seconds, sort_order)
where not exists (select 1 from public.exercise_templates);

-- --- Séances types ------------------------------------------------------
insert into public.session_templates (level_key, title, duration_minutes, color_hex, sort_order)
select * from (values
  ('debutant'::level_key,      'Découverte',   5,  '#B9657C', 1),
  ('intermediaire'::level_key, 'Renforcement', 10, '#7C9EB9', 2),
  ('avance'::level_key,        'Intensif',     15, '#65B98C', 3)
) as v(level_key, title, duration_minutes, color_hex, sort_order)
where not exists (select 1 from public.session_templates);

-- --- Conseils -----------------------------------------------------------
insert into public.tip_templates (text, icon, sort_order)
select * from (values
  ('Pense à bien relâcher entre chaque contraction.', '💡', 1),
  ('La régularité prime sur l''intensité.',           '📅', 2),
  ('Respire profondément, ne bloque jamais ton souffle.', '🌬️', 3)
) as v(text, icon, sort_order)
where not exists (select 1 from public.tip_templates);

-- --- Succès -------------------------------------------------------------
insert into public.achievement_templates (code, title, description, icon) values
  ('first_session', 'Première séance', 'Tu as terminé ta toute première séance.', '🎉'),
  ('week_streak',   'Une semaine',     '7 jours consécutifs de pratique.',         '🔥'),
  ('month_goal',    'Objectif mensuel','Objectif de séances du mois atteint.',     '🏆')
on conflict (code) do nothing;
