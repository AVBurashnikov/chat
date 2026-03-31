import api from "./client";

export async function getChats() {
  const { data } = await api.get("/chats/");
  return data;
}

export async function getMessages(chatId) {
  const { data } = await api.get(`/chats/${chatId}/messages`);
  return data;
}

export async function createChat(participantUsername, title) {
  const payload = {
    participant_username: participantUsername,
    title: null,
  };
  const { data } = await api.post("/chats/", payload);
  return data;
}

export async function deleteChat(chatId) {
  await api.delete(`/chats/${chatId}`);
}

export async function markChatRead(chatId) {
  await api.post(`/chats/${chatId}/read`);
}