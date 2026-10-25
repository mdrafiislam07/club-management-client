import Avatar from './Avatar';
import { Compass } from './icons';

export default function MessageBubble({ message, onOpenPage }) {
  const mine = message.role === 'user';
  const nav = message.action?.type === 'navigate' ? message.action : null;

  return (
    <div className={`ax-row ${mine ? 'ax-row-me' : ''}`}>
      {!mine && (
        <div className="ax-av"><Avatar iconSize={13} /></div>
      )}
      <div className={`ax-bub ${mine ? 'ax-bub-me' : 'ax-bub-bot'}${message.error ? ' ax-bub-err' : ''}`}>
        {message.text}
        {nav && (
          <button type="button" className="ax-go" onClick={() => onOpenPage(nav.url)}>
            <Compass size={14} />
            {nav.label || 'পেজটি'} খুলুন
            <span>→</span>
          </button>
        )}
      </div>
    </div>
  );
}