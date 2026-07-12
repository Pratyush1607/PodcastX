create extension if not exists "pgcrypto";

create type run_status as enum ('pending', 'running', 'completed', 'failed', 'partial');
create type agent_name as enum ('podcast_researcher', 'interview_researcher', 'transcriber', 'summarizer');
create type agent_status as enum ('pending', 'running', 'succeeded', 'failed', 'skipped');
create type content_type as enum ('podcast', 'interview');
create type category_slug as enum (
  'overall', 'tech_ai', 'science_education', 'sports',
  'health_fitness', 'comedy', 'pop_internet_culture'
);
create type transcript_source as enum ('captions', 'audio_gemini');

create table runs (
  id uuid primary key default gen_random_uuid(),
  trigger_type text not null check (trigger_type in ('manual', 'scheduled')),
  status run_status not null default 'pending',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  error_summary text,
  created_at timestamptz not null default now()
);

-- One row per unique video discovered in a run (deduplicated across scopes)
create table videos (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references runs(id) on delete cascade,
  youtube_video_id text not null,
  type content_type not null,
  title text not null,
  channel_name text not null,
  url text not null,
  view_count bigint,
  published_at timestamptz,
  thumbnail_url text,
  discovered_at timestamptz not null default now(),
  unique (run_id, youtube_video_id, type)
);

-- Which scope(s) a video ranked top-5 in, and at what rank (drives homepage tiles + category pages)
create table video_placements (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references videos(id) on delete cascade,
  scope category_slug not null,
  rank int not null check (rank between 1 and 5),
  unique (video_id, scope)
);

create table run_agent_tasks (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references runs(id) on delete cascade,
  agent agent_name not null,
  video_id uuid references videos(id) on delete cascade, -- null for research agents (run once per scope, not per-video)
  scope category_slug,                                    -- set for research-agent tasks to track per-scope search status
  status agent_status not null default 'pending',
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  retry_count int not null default 0,
  created_at timestamptz not null default now()
);

create table transcripts (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references videos(id) on delete cascade,
  source transcript_source not null,
  language text,
  content text not null,
  word_count int,
  created_at timestamptz not null default now(),
  unique (video_id)
);

create table summaries (
  id uuid primary key default gen_random_uuid(),
  transcript_id uuid not null references transcripts(id) on delete cascade,
  key_points jsonb not null,
  notable_quotes jsonb,
  topics jsonb,
  summary_text text not null,
  created_at timestamptz not null default now(),
  unique (transcript_id)
);

create index idx_videos_run_id on videos(run_id);
create index idx_placements_video_id on video_placements(video_id);
create index idx_placements_scope on video_placements(scope);
create index idx_run_agent_tasks_run_id on run_agent_tasks(run_id);
create index idx_transcripts_video_id on transcripts(video_id);
create index idx_summaries_transcript_id on summaries(transcript_id);

-- User accounts (via Supabase Auth) and their saved-for-later videos.
create table watch_later (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id uuid not null references videos(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, video_id)
);

create index idx_watch_later_user_id on watch_later(user_id);

alter table watch_later enable row level security;

create policy "Users can view their own watch later list"
  on watch_later for select
  using (auth.uid() = user_id);

create policy "Users can add to their own watch later list"
  on watch_later for insert
  with check (auth.uid() = user_id);

create policy "Users can remove from their own watch later list"
  on watch_later for delete
  using (auth.uid() = user_id);

-- User-created named collections of videos.
create table playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table playlist_videos (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references playlists(id) on delete cascade,
  video_id uuid not null references videos(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (playlist_id, video_id)
);

create index idx_playlists_user_id on playlists(user_id);
create index idx_playlist_videos_playlist_id on playlist_videos(playlist_id);

alter table playlists enable row level security;
alter table playlist_videos enable row level security;

create policy "Users can view their own playlists"
  on playlists for select
  using (auth.uid() = user_id);

create policy "Users can create their own playlists"
  on playlists for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own playlists"
  on playlists for delete
  using (auth.uid() = user_id);

create policy "Users can view videos in their own playlists"
  on playlist_videos for select
  using (exists (select 1 from playlists p where p.id = playlist_videos.playlist_id and p.user_id = auth.uid()));

create policy "Users can add videos to their own playlists"
  on playlist_videos for insert
  with check (exists (select 1 from playlists p where p.id = playlist_videos.playlist_id and p.user_id = auth.uid()));

create policy "Users can remove videos from their own playlists"
  on playlist_videos for delete
  using (exists (select 1 from playlists p where p.id = playlist_videos.playlist_id and p.user_id = auth.uid()));
