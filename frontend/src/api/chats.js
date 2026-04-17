/**
 * Chat API endpoints with validation
 */

import apiClient from './client';

export async function getChats() {
  try {
    const { data } = await apiClient.get('/chats/');
    return data;
  } catch (error) {
    console.error('Get chats error:', error);
    throw error;
  }
}

export async function getMessages(chatId) {
  try {
    const { data } = await apiClient.get(`/chats/${chatId}/messages`);
    return data;
  } catch (error) {
    console.error('Get messages error:', error);
    throw error;
  }
}

export async function createChat(participantUsername) {
  try {
    if (!participantUsername || participantUsername.length < 3) {
      throw new Error('Username must be at least 3 characters');
    }

    const { data } = await apiClient.post('/chats/', {
      participant_username: participantUsername,
    });
    return data;
  } catch (error) {
    console.error('Create chat error:', error);
    throw error;
  }
}

export async function deleteChat(chatId) {
  try {
    await apiClient.delete(`/chats/${chatId}`);
  } catch (error) {
    console.error('Delete chat error:', error);
    throw error;
  }
}

export async function markChatRead(chatId) {
  try {
    await apiClient.post(`/chats/${chatId}/read`);
  } catch (error) {
    console.error('Mark read error:', error);
    throw error;
  }
}

export async function toggleChatMute(chatId) {
  try {
    const { data } = await apiClient.post(`/chats/${chatId}/mute`);
    return data;
  } catch (error) {
    console.error('Toggle mute error:', error);
    throw error;
  }
}

export async function archiveChat(chatId) {
  try {
    await apiClient.post(`/chats/${chatId}/archive`);
  } catch (error) {
    console.error('Archive chat error:', error);
    throw error;
  }
}

export async function sendMessage(chatId, content) {
  try {
    const { data } = await apiClient.post(`/chats/${chatId}/messages`, {
      content,
    });
    return data;
  } catch (error) {
    console.error('Send message error:', error);
    throw error;
  }
}

export async function sendFileMessage(
  chatId,
  file,
  content = '',
  replyTo = null
) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    if (content) {
      formData.append('content', content);
    }

    if (replyTo) {
      formData.append('reply_to', replyTo);
    }

    const { data } = await apiClient.post(
      `/chats/${chatId}/messages/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return data;
  } catch (error) {
    console.error('Send file message error:', error);
    throw error;
  }
}
