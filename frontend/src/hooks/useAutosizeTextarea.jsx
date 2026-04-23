import { useEffect } from 'react';

export const useAutosizeTextarea = (ref, value, maxHeight = 200) => {
  useEffect(() => {
    const textarea = ref?.current;
    if (!textarea) return;

    textarea.style.height = '50px';
    const scrollHeight = textarea.scrollHeight;

    textarea.style.height = Math.min(scrollHeight, maxHeight) + 'px';
    textarea.style.overflowY =
      scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [ref, value, maxHeight]);
};