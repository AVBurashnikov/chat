import { useEffect, useRef } from 'react';
import styles from './AttachDropdown.module.css';

const ACCEPT = {
  document:
    '.pdf,.txt,.doc,.docx,.rtf,.odt,.xls,.xlsx,.ppt,.pptx,.csv,.zip,.rar',
  image: 'image/*',
};

export const AttachDropdown = ({
  open,
  setOpen,
  onDocumentPick,
  onImagePick,
}) => {
  const wrapperRef = useRef(null);
  const documentInputRef = useRef(null);
  const imageInputRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handleOutsideClick = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [open, setOpen]);

  if (!open) {
    return null;
  }

  const handleDocumentChange = (event) => {
    onDocumentPick(event.target.files);
    event.target.value = '';
    setOpen(false);
  };

  const handleImageChange = (event) => {
    onImagePick(event.target.files);
    event.target.value = '';
    setOpen(false);
  };

  return (
    <div className={styles.dropdown} ref={wrapperRef}>
      <button
        type="button"
        className={styles.item}
        onClick={() => documentInputRef.current?.click()}
      >
        Document
      </button>

      <button
        type="button"
        className={styles.item}
        onClick={() => imageInputRef.current?.click()}
      >
        Image
      </button>

      <button type="button" className={`${styles.item} ${styles.disabled}`} disabled>
        Contact
      </button>

      <button type="button" className={`${styles.item} ${styles.disabled}`} disabled>
        Location
      </button>

      <input
        ref={documentInputRef}
        type="file"
        className={styles.hiddenInput}
        accept={ACCEPT.document}
        multiple
        onChange={handleDocumentChange}
      />

      <input
        ref={imageInputRef}
        type="file"
        className={styles.hiddenInput}
        accept={ACCEPT.image}
        multiple
        onChange={handleImageChange}
      />
    </div>
  );
};
