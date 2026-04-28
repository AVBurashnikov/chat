import { useEffect, useRef } from 'react';
import { DropdownMenu, DropdownMenuItem } from './DropdownMenu';

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
  align = 'start',
  anchorRef,
}) => {
  const documentInputRef = useRef(null);
  const imageInputRef = useRef(null);

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
    <DropdownMenu
      isOpen={open}
      onClose={() => setOpen(false)}
      align={align === 'end' ? 'right' : 'left'}
      anchorRef={anchorRef}
    >
      <DropdownMenuItem onClick={() => documentInputRef.current?.click()}>
        Document
      </DropdownMenuItem>

      <DropdownMenuItem onClick={() => imageInputRef.current?.click()}>
        Image
      </DropdownMenuItem>

      <DropdownMenuItem disabled>
        Contact
      </DropdownMenuItem>

      <DropdownMenuItem disabled>
        Location
      </DropdownMenuItem>

      <input
        ref={documentInputRef}
        type="file"
        style={{ display: 'none' }}
        accept={ACCEPT.document}
        multiple
        onChange={handleDocumentChange}
      />

      <input
        ref={imageInputRef}
        type="file"
        style={{ display: 'none' }}
        accept={ACCEPT.image}
        multiple
        onChange={handleImageChange}
      />
    </DropdownMenu>
  );
};
