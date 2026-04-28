/**
 * Message input component with validation
 */
import { useEffect, useRef, useState } from 'react';

import { useMessageInput } from '../hooks/useMessageInput';
import { useAutosizeTextarea } from '../hooks/useAutosizeTextarea';

import styles from './MessageInput.module.css';

import EmojiPicker from './EmojiPicker';
import FilePreview from './FilePreview';
import ReplyPreview from './ReplyPreview';
import IconButton from './ui/IconButton';
import { AttachDropdown } from './ui/AttachDropdown';

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
  editingMessage,
  onCancelEdit,
}) => {
  const {
    message,
    setMessage,
    error,
    selectedFiles,
    showEmojiPicker,
    setShowEmojiPicker,
    handleSubmit,
    addSelectedFiles,
    removeFile,
  } = useMessageInput({
    onSend,
    onSendFile,
    replyTo,
    onCancelReply,
    editingMessage,
    onCancelEdit,
  });

  const [showAttachDropdown, setShowAttachDropdown] = useState(false);
  const [isUltraCompact, setIsUltraCompact] = useState(
    () => window.innerWidth < 500
  );
  const inputRef = useAutosizeTextarea(message, isMobile ? 120 : 200);
  const longPressTimerRef = useRef(null);
  const suppressSubmitRef = useRef(false);

  useEffect(() => {
    const onResize = () => {
      setIsUltraCompact(window.innerWidth < 500);
    };

    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleSendPointerDown = (e) => {
    e.preventDefault();
    if (!isUltraCompact || disabled || editingMessage) {
      return;
    }

    clearLongPress();
    longPressTimerRef.current = setTimeout(() => {
      suppressSubmitRef.current = true;
      setShowAttachDropdown(true);
      setShowEmojiPicker(false);
    }, 450);
  };

  const handleSendPointerUp = () => {
    clearLongPress();
  };

  const handleFormSubmit = (e) => {
    if (suppressSubmitRef.current) {
      suppressSubmitRef.current = false;
      e.preventDefault();
      return;
    }

    if (isUltraCompact && !message.trim() && selectedFiles.length === 0 && !editingMessage?.file_url) {
      e.preventDefault();
      return;
    }

    handleSubmit(e);
  };

  const handleEmojiClick = (emoji) => {
    const cursorPos = inputRef.current?.selectionStart ?? message.length;
    const newMsg = message.slice(0, cursorPos) + emoji + message.slice(cursorPos);
    setMessage(newMsg);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.selectionStart = inputRef.current.selectionEnd = cursorPos + emoji.length;
        inputRef.current.focus();
      }
    }, 0);
  };

  return (
    <form onSubmit={handleFormSubmit} className={styles.form}>
      {editingMessage && (
        <div className={styles.editBanner}>
          <div className={styles.editCopy}>
            <strong>Editing message</strong>
            <span className={styles.editHint}>Press Enter to save, Esc to cancel</span>
          </div>
          <button type="button" className={styles.editCancel} onClick={onCancelEdit}>
            Cancel
          </button>
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className={styles.previewList}>
          {selectedFiles.map((file, index) => (
            <FilePreview
              key={`${file.name}-${file.size}-${file.lastModified}`}
              file={file}
              onRemove={() => removeFile(index)}
            />
          ))}
        </div>
      )}

      <ReplyPreview replyTo={replyTo} onCancel={onCancelReply} />

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.inputRow}>
        {!isUltraCompact && (
          <IconButton
            onClick={() => {
              setShowEmojiPicker((prev) => !prev);
              setShowAttachDropdown(false);
            }}
            aria-label="Open emoji picker"
            className={styles.emojiButton}
            disabled={Boolean(editingMessage)}
          >
            {ICONS.emoji}
          </IconButton>
        )}

        <IconButton
          onClick={onMenuOpen}
          aria-label="Open chats"
          size="md"
          variant="mobileOnly"
          className={styles.menuButton}
        >
          {ICONS.menu}
        </IconButton>

        <EmojiPicker
          open={showEmojiPicker}
          onSelect={(emoji) => {
            handleEmojiClick(emoji);
            setShowEmojiPicker(false);
          }}
        />

        {!isUltraCompact && (
          <div className={styles.attachWrapper}>
            <IconButton
              onClick={() => {
                setShowAttachDropdown((prev) => !prev);
                setShowEmojiPicker(false);
              }}
              aria-label="Attach files"
              className={styles.attachButton}
              disabled={Boolean(editingMessage)}
            >
              {ICONS.attach}
            </IconButton>

            <AttachDropdown
              open={showAttachDropdown}
              setOpen={setShowAttachDropdown}
              onDocumentPick={addSelectedFiles}
              onImagePick={addSelectedFiles}
              align="start"
            />
          </div>
        )}

        <textarea
          className={styles.textarea}
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={selectedFiles.length ? 'Add a caption...' : 'Write a message...'}
          disabled={disabled}
          maxLength={5000}
          autoComplete="off"
          onKeyDown={(e) => {
            if (e.key === 'Escape' && editingMessage) {
              e.preventDefault();
              onCancelEdit?.();
              return;
            }

            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              e.stopPropagation();
              handleSubmit(e);
            }
          }}
        />

        <div className={styles.sendWrapper}>
          <IconButton
            type="submit"
            variant="accent"
            size="lg"
            className={styles.sendButton}
            disabled={disabled}
            aria-label={
              isUltraCompact
                ? editingMessage
                  ? 'Save changes'
                  : 'Send message. Long press to attach files'
                : editingMessage
                  ? 'Save changes'
                  : 'Send message'
            }
            title={
              editingMessage
                ? 'Save changes'
                : isUltraCompact
                  ? 'Long press to attach files'
                  : 'Send message'
            }
            onPointerDown={handleSendPointerDown}
            onPointerUp={handleSendPointerUp}
            onPointerLeave={handleSendPointerUp}
            onPointerCancel={handleSendPointerUp}
          >
            {ICONS.send}
          </IconButton>

          {isUltraCompact && (
            <AttachDropdown
              open={showAttachDropdown}
              setOpen={setShowAttachDropdown}
              onDocumentPick={addSelectedFiles}
              onImagePick={addSelectedFiles}
              align="end"
            />
          )}
        </div>
      </div>
    </form>
  );
};
