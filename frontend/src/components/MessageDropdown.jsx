import { useEffect, useRef } from "react";

export const MessageDropdown = ({message, onReply, isMine, isOpen, setOpen}) => {

    const ICONS = {
        reply: '↩',
        delete: '✕',
    };
    
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (isOpen && menuRef.current && !menuRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    });

    const handleReply = () => {
        onReply(message);
        setOpen(false);
    }

    const handleEdit = () => {
        setOpen(false);
    }

    const handleDelete = () => {
        setOpen(false);
    }

    const dropdownMenuStyle = {
        position: 'absolute',
        right: isMine ? 8 : 'auto',
        left: isMine ? 'auto' : 8,
        top: 'calc(100% + 2px)',
        minWidth: 180,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-card)',
        zIndex: 100,
        overflow: 'hidden',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
    }

    const buttonStyle = {
        width: '100%',
        padding: '12px 14px',
        border: 'none',
        background: 'transparent',
        color: 'var(--text-primary)',
        textAlign: 'left',
        fontSize: 13,
        fontWeight: 600,
    };

    return (
        <div ref={menuRef} style={{...dropdownMenuStyle, right: isMine ? 8 : 'auto', left: isMine ? 'auto' : 8}}>
            <button type="button" onClick={handleReply} style={buttonStyle}>
                {ICONS.reply} Reply
            </button>
            <button type="button" onClick={handleEdit} style={buttonStyle}>
                Edit
            </button>
            <button
                type="button"
                onClick={handleDelete}
                style={{
                    ...buttonStyle,
                    color: 'var(--danger)',
                }}
            >
                {ICONS.delete} Delete
            </button>
        </div>
    );
}