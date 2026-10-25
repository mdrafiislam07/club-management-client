import { useRef, useState } from 'react';
import { Send } from './icons';

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState('');
  const ref = useRef(null);

  const grow = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  };

  const submit = () => {
    const t = value.trim();
    if (!t || disabled) return;
    onSend(t);
    setValue('');
    requestAnimationFrame(() => {
      if (ref.current) ref.current.style.height = 'auto';
      ref.current?.focus();
    });
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="ax-in">
      <div className="ax-in-box">
        <textarea
          ref={ref}
          className="ax-in-ta"
          rows={1}
          maxLength={800}
          value={value}
          placeholder="Type your message..."
          onChange={(e) => { setValue(e.target.value); grow(); }}
          onKeyDown={onKeyDown}
        />
        <button
          type="button"
          className="ax-in-send"
          onClick={submit}
          disabled={disabled || !value.trim()}
          aria-label="Send"
        >
          <Send size={18} />
        </button>
      </div>
      <div className="ax-in-foot">AI may make mistakes, please verify important information.</div>
    </div>
  );
}