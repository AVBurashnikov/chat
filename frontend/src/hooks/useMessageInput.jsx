import { useEffect, useRef, useState } from 'react';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const TYPING_TIMEOUT = 2000;
const TYPING_CLEAR_DELAY = 1000;

export const useMessageInput = ({
  onSend,
  onSendFile,
  replyTo,
  onCancelReply,
  editingMessage,
  onTypingChange,
}) => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef(null);
  const clearTypingTimeoutRef = useRef(null);

  useEffect(() => {
    setMessage(editingMessage?.rawContent ?? editingMessage?.content ?? '');
    setError('');
    setSelectedFiles([]);
  }, [editingMessage]);

  const sendTypingIndicator = (typing) => {
    if (onTypingChange && !editingMessage) {
      onTypingChange(typing);
    }
  };

  const handleTypingStart = () => {
    if (!isTypingRef.current && !editingMessage) {
      isTypingRef.current = true;
      sendTypingIndicator(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        sendTypingIndicator(false);
      }
    }, TYPING_TIMEOUT);
  };

  const handleTypingStop = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (clearTypingTimeoutRef.current) {
      clearTimeout(clearTypingTimeoutRef.current);
    }

    clearTypingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        sendTypingIndicator(false);
      }
    }, TYPING_CLEAR_DELAY);
  };

  const handleMessageChange = (newMessage) => {
    setMessage(newMessage);
    if (newMessage.trim()) {
      handleTypingStart();
    } else {
      handleTypingStop();
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');

    const trimmed = message.trim();

    if (selectedFiles.length > 0) {
      if (editingMessage) {
        setError('Editing attachments is not supported');
        return;
      }

      if (trimmed.length > 5000) {
        setError('Message is too long');
        return;
      }

      try {
        for (let index = 0; index < selectedFiles.length; index += 1) {
          const file = selectedFiles[index];
          await onSendFile(file, index === 0 ? trimmed : '', replyTo?.id ?? null);
        }
      } catch {
        setError('Failed to send files. Please try again.');
        return;
      }

      setMessage('');
      setSelectedFiles([]);
      onCancelReply?.();
      return;
    }

    if (!trimmed && !editingMessage?.file_url) {
      setError('Message cannot be empty');
      return;
    }

    if (trimmed.length > 5000) {
      setError('Message is too long');
      return;
    }

    onSend(trimmed, replyTo?.id);
    if (!editingMessage) {
      onCancelReply?.();
    }
    if (!editingMessage) {
      setMessage('');
    }
  };

  const addSelectedFiles = (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const tooLarge = files.some((file) => file.size > MAX_FILE_SIZE_BYTES);
    const validFiles = files.filter((file) => file.size <= MAX_FILE_SIZE_BYTES);

    if (!validFiles.length && tooLarge) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }

    setSelectedFiles((prev) => {
      const next = [...prev];
      validFiles.forEach((file) => {
        const exists = next.some(
          (item) =>
            item.name === file.name &&
            item.size === file.size &&
            item.lastModified === file.lastModified
        );
        if (!exists) {
          next.push(file);
        }
      });
      return next;
    });

    setError(tooLarge ? 'Some files were skipped (max 10MB each).' : '');
  };

  const removeFile = (indexToRemove) => {
    setSelectedFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (clearTypingTimeoutRef.current) clearTimeout(clearTypingTimeoutRef.current);
    };
  }, []);

  return {
    message,
    setMessage: handleMessageChange,
    error,
    selectedFiles,
    showEmojiPicker,
    setShowEmojiPicker,
    handleSubmit,
    addSelectedFiles,
    removeFile,
  };
};
