import { getQuizQuestion, speakText } from "../../api";

export async function loadQuizQuestion(language, excludeKeys = []) {
  return getQuizQuestion(language, excludeKeys);
}

export async function speakAnswer(language, text) {
  return speakText(language, text);
}
