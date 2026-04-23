import { useState } from 'react';

export const useMessageInput = ({
  onSend,
  onSendFile,
  replyTo,
  onCancelReply,
}) => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleSubmit = (e) => {
    e?.preventDefault();
    setError('');

    const trimmed = message.trim();

    if (selectedFile) {
      if (trimmed.length > 5000) {
        setError('Message is too long');
        return;
      }

      onSendFile(selectedFile, trimmed, replyTo?.id ?? null);
      setMessage('');
      setSelectedFile(null);
      onCancelReply?.();
      return;
    }

    if (!trimmed) {
      setError('Message cannot be empty');
      return;
    }

    if (trimmed.length > 5000) {
      setError('Message is too long');
      return;
    }

    onSend(trimmed, replyTo?.id);
    onCancelReply?.();
    setMessage('');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }

    setSelectedFile(file);
    setError('');
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  return {
    message,
    setMessage,
    error,
    selectedFile,
    showEmojiPicker,
    setShowEmojiPicker,
    handleSubmit,
    handleFileSelect,
    removeFile,
  };
};