import type { ApiVideo } from "@/types/api";
import type { NowPlayingTrack } from "@/context/PlayerContext";

export function toNowPlayingTrack(video: ApiVideo): NowPlayingTrack {
  return {
    id: video.id,
    youtubeVideoId: video.youtube_video_id,
    title: video.title,
    channelName: video.channel_name,
    thumbnailUrl: video.thumbnail_url,
  };
}
