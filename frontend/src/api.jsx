import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE,
});

export const getQuizQuestion = async (language, excludeKeys = []) => {
  const params = { language };
  if (excludeKeys.length) {
    params.exclude = excludeKeys.join(",");
  }
  const { data } = await api.get("/quiz/question", { params });
  return data;
};

export const speakText = async (language, text) => {
  const { data } = await api.post("/speak", { language, text });
  return data;
};

export const mapAudioRequest = async (language, signal) => {
  const { data } = await api.post(
    "/map-audio",
    { language },
    { signal },
  );
  return data;
};

export const translateSpeakRequest = async (inputLanguage, outputLanguage, text) => {
  const { data } = await api.post("/translate-speak", {
    input_language: inputLanguage,
    output_language: outputLanguage,
    text,
  });
  return data;
};

export const processVoiceRequest = async (formData) => {
  const { data } = await api.post("/process-voice", formData);
  return data;
};

export const submitArchiveRequest = async (formData) => {
  const { data } = await api.post("/archive/submit", formData);
  return data;
};

export const archiveListRequest = async () => {
  const { data } = await api.get("/archive/list");
  return data;
};

export const archiveStatsRequest = async () => {
  const { data } = await api.get("/archive/stats");
  return data;
};

export const archiveVoiceCountsRequest = async () => {
  const { data } = await api.get("/archive/voice-counts");
  return data;
};

export const archiveFeaturedRequest = async (language) => {
  const { data } = await api.get(`/archive/featured/${encodeURIComponent(language)}`);
  return data;
};

export const archiveDictionaryRequest = async (language) => {
  const { data } = await api.get(`/archive/dictionary/${encodeURIComponent(language)}`);
  return data;
};

export const archiveQuizQuestionsRequest = async (language) => {
  const { data } = await api.get(`/archive/quiz-questions/${encodeURIComponent(language)}`);
  return data;
};

export const streamChat = async (messages, onChunk, onError) => {
  const response = await fetch(`${API_BASE}/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    let detail = "An error occurred.";
    try {
      const data = await response.json();
      detail = data.detail || detail;
    } catch {
      // ignore response parse errors
    }
    throw new Error(detail);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value, { stream: true });
    const lines = text.split("\n");

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") continue;
      try {
        const parsed = JSON.parse(payload);
        if (parsed.content) onChunk(parsed.content);
        if (parsed.error) onError?.(parsed.error);
      } catch {
        // ignore malformed SSE lines
      }
    }
  }
};
