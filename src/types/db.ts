export type RunStatus = "pending" | "running" | "completed" | "failed" | "partial";
export type TriggerType = "manual" | "scheduled";
export type AgentName =
  | "podcast_researcher"
  | "interview_researcher"
  | "transcriber"
  | "summarizer";
export type AgentStatus = "pending" | "running" | "succeeded" | "failed" | "skipped";
export type ContentType = "podcast" | "interview";
export type CategorySlug =
  | "overall"
  | "tech_ai"
  | "science_education"
  | "sports"
  | "health_fitness"
  | "comedy"
  | "pop_internet_culture";
export type TranscriptSource = "captions" | "audio_gemini";

export interface RunRow {
  id: string;
  trigger_type: TriggerType;
  status: RunStatus;
  started_at: string;
  completed_at: string | null;
  error_summary: string | null;
  created_at: string;
}

export interface VideoRow {
  id: string;
  run_id: string;
  youtube_video_id: string;
  type: ContentType;
  title: string;
  channel_name: string;
  url: string;
  view_count: number | null;
  published_at: string | null;
  thumbnail_url: string | null;
  discovered_at: string;
}

export interface VideoPlacementRow {
  id: string;
  video_id: string;
  scope: CategorySlug;
  rank: number;
}

export interface RunAgentTaskRow {
  id: string;
  run_id: string;
  agent: AgentName;
  video_id: string | null;
  scope: CategorySlug | null;
  status: AgentStatus;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  retry_count: number;
  created_at: string;
}

export interface TranscriptRow {
  id: string;
  video_id: string;
  source: TranscriptSource;
  language: string | null;
  content: string;
  word_count: number | null;
  created_at: string;
}

export interface SummaryRow {
  id: string;
  transcript_id: string;
  key_points: string[];
  notable_quotes: { quote: string; speaker?: string }[];
  topics: string[];
  summary_text: string;
  created_at: string;
}

export const CATEGORY_SLUGS: Exclude<CategorySlug, "overall">[] = [
  "tech_ai",
  "science_education",
  "sports",
  "health_fitness",
  "comedy",
  "pop_internet_culture",
];

export const CATEGORY_LABELS: Record<CategorySlug, string> = {
  overall: "All",
  tech_ai: "Tech & AI",
  science_education: "Science & Education",
  sports: "Sports",
  health_fitness: "Health & Fitness",
  comedy: "Comedy",
  pop_internet_culture: "Pop Culture & Internet Culture",
};
