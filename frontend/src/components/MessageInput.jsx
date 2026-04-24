/**
 * Message input component with validation
 */
import React, { useState, useRef, lazy, Suspense, useEffect } from 'react';

import { useMessageInput } from '../hooks/useMessageInput';
import { useAutosizeTextarea } from '../hooks/useAutosizeTextarea';

import styles from './MessageInput.module.css';

import EmojiPicker from './EmojiPicker';
import FilePreview from './FilePreview';
import ReplyPreview from './ReplyPreview';
import IconButton from './ui/IconButton';

const ICONS = {
  emoji: '\u{1F600}',
  attach: '\u{1F4CE}',
  menu: '\u{2630}',
  send: '\u{27A4}',
};

export const MessageInput = ({
  onSend,
  onSendFile,
  disabled,
  isMobile,
  onMenuOpen,
  replyTo,
  onCancelReply,
}) => {

  const {
    message,
    setMessage,
    error,
    selectedFile,
    showEmojiPicker,
    setShowEmojiPicker,
    handleSubmit,
    handleFileSelect,
    removeFile,
  } = useMessageInput({
    onSend,
    onSendFile,
    replyTo,
    onCancelReply,
  });

  const inputRef = useRef(null);

  useAutosizeTextarea(inputRef, message, isMobile ? 120 : 200);

  const handleEmojiClick = (emoji) => {
    const cursorPos = inputRef.current?.selectionStart ?? message.length;
    const newMsg = message.slice(0, cursorPos) + emoji + message.slice(cursorPos);
    setMessage(newMsg);
    // restore cursor after insertion
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.selectionStart = inputRef.current.selectionEnd = cursorPos + emoji.length;
        inputRef.current.focus();
      }
    }, 0);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <FilePreview file={selectedFile} onRemove={removeFile}/>
      <ReplyPreview replyTo={replyTo} onCancel={onCancelReply}/>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      <div className={styles.inputRow}>

        <IconButton onClick={() => setShowEmojiPicker(v => !v)} aria-label="Open emoji picker">
          {ICONS.emoji}
        </IconButton>

        <IconButton onClick={onMenuOpen} aria-label="Open chats" size="md" >
          {ICONS.menu}
        </IconButton>
        
        <EmojiPicker open={showEmojiPicker} onSelect={(emoji) => {
            handleEmojiClick(emoji);
            setShowEmojiPicker(false);
          }}
        />

        <label className={styles.attachButton}>
          {ICONS.attach}
          <input
            type="file"
            onChange={handleFileSelect}
            className={styles.hiddenFileInput}
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
        </label>

        <textarea
          className={styles.textarea}
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={selectedFile ? 'Add a caption...' : 'Write a message...'}
          disabled={disabled}
          maxLength={5000}
          autoComplete="off"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              e.stopPropagation();
              handleSubmit(e);
            }
          }}
        />

        <IconButton 
          type="submit" 
          variant="accent" 
          size="lg" 
          disabled={disabled || (!message.trim() && !selectedFile)} 
          aria-label="Send message"
        >
          {ICONS.send}
        </IconButton>
      </div>
    </form>
  );
};

