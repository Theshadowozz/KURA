import {
  submitArchiveRequest,
  archiveListRequest,
  archiveStatsRequest,
  archiveVoiceCountsRequest,
  archiveFeaturedRequest,
  archiveDictionaryRequest,
  archiveQuizQuestionsRequest,
} from "../../api";

export async function submitArchive(formData) {
  return submitArchiveRequest(formData);
}

export async function getArchiveList(language = null) {
  // Pass optional language filter as query param
  if (language) {
    const { data } = await import("../../api").then(m => m.default || m);
    // Fallback: use plain request with param
    const url = `/archive/list?language=${encodeURIComponent(language)}`;
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE || "http://localhost:8000"}${url}`
    );
    return response.json();
  }
  return archiveListRequest();
}

export async function getArchiveStats() {
  return archiveStatsRequest();
}

export async function getVoiceCounts() {
  return archiveVoiceCountsRequest();
}

export async function getFeaturedEntry(language) {
  return archiveFeaturedRequest(language);
}

export async function getArchiveDictionaryEntries(language) {
  return archiveDictionaryRequest(language);
}

export async function getArchiveQuizQuestions(language) {
  return archiveQuizQuestionsRequest(language);
}
