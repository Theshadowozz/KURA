import { mapAudioRequest } from "../../api";

export async function fetchMapAudio(language, signal) {
  return mapAudioRequest(language, signal);
}
