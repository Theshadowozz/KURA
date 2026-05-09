import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE,
});

export async function getDictionary(language) {
  const { data } = await api.get(`/dictionary/${language}`);
  return data;
}

export async function listDictionaries() {
  const { data } = await api.get("/dictionary");
  return data;
}
