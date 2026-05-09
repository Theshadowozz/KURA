import { streamChat } from "../../api";

export async function sendChatMessage(messages) {
  // simple non-stream wrapper if needed elsewhere
  const responseChunks = [];
  await streamChat(
    messages,
    (chunk) => responseChunks.push(chunk),
    (err) => responseChunks.push(`Error: ${err}`),
  );
  return responseChunks.join("");
}

export function streamChatHandler(messages, onChunk, onError) {
  return streamChat(messages, onChunk, onError);
}
