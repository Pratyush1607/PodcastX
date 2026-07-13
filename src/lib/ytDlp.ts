import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * Downloads a video's best audio track to a temp file via the locally-installed yt-dlp binary.
 * Caller is responsible for calling the returned `cleanup()` once done with the file.
 */
export async function downloadAudio(
  youtubeVideoId: string
): Promise<{ filePath: string; cleanup: () => Promise<void> }> {
  const dir = await mkdtemp(path.join(tmpdir(), "podcastx-audio-"));
  const outputTemplate = path.join(dir, "audio.%(ext)s");
  const url = `https://www.youtube.com/watch?v=${youtubeVideoId}`;

  const DOWNLOAD_TIMEOUT_MS = 3 * 60_000;

  await new Promise<void>((resolve, reject) => {
    const proc = spawn("yt-dlp", [
      "-f",
      "bestaudio",
      "-x",
      "--audio-format",
      "mp3",
      // This machine's local trust store isn't resolving YouTube's cert chain for yt-dlp's bundled
      // Python SSL; skipping verification is acceptable for this personal, local-only tool.
      "--no-check-certificate",
      "-o",
      outputTemplate,
      url,
    ]);

    // A stalled network connection can otherwise leave yt-dlp (and this promise) hanging forever.
    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error(`yt-dlp timed out after ${DOWNLOAD_TIMEOUT_MS}ms`));
    }, DOWNLOAD_TIMEOUT_MS);

    let stderr = "";
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    proc.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`yt-dlp exited with code ${code}: ${stderr.slice(-500)}`));
    });
  });

  return {
    filePath: path.join(dir, "audio.mp3"),
    cleanup: () => rm(dir, { recursive: true, force: true }),
  };
}
