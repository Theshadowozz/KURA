import { translateSpeakRequest, processVoiceRequest } from "../../api";

export async function translateAndSpeak(inputLanguage, outputLanguage, text) {
  return translateSpeakRequest(inputLanguage, outputLanguage, text);
}

export async function processVoice(formData) {
  return processVoiceRequest(formData);
}
