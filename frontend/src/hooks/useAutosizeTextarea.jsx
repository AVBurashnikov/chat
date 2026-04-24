import { useEffect, useRef } from 'react';

export const useAutosizeTextarea = (value, maxHeight = 200) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = '50px';
    const scrollHeight = textarea.scrollHeight;

    textarea.style.height = Math.min(scrollHeight, maxHeight) + 'px';
    textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [value, maxHeight]);

  return textareaRef;
};
