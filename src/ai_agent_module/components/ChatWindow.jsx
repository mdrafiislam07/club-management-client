import { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import VoiceMode from './VoiceMode';
import Avatar from './Avatar';
import { Mic, Refresh, Close } from './icons';

const QUICK = [
  'আজকের ম্যাচের স্কোর কত?',
  'কমিটির সদস্যরা কারা?',
  'ইভেন্টস পেজে নিয়ে যাও',
  'ক্লাবে কীভাবে যোগ দেব?',
];

export default function ChatWindow({ messages, loading, onSend, onClose, onClear, onOpenPage, voice }) {
  const endRef = useRef(null);
  const [voiceMode, setVoiceMode] = useState(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  const onlyGreeting = messages.length === 1 && messages[0].greeting;

  return (
    <div className="aiag-window" role="dialog" aria-label="AI Assistant">
      <div className="ax-head">
        <div className="ax-brand">
          <div className="ax-avatar">
            <Avatar iconSize={20} />
            <i className="ax-live" />
          </div>
          <div className="ax-titles">
            <div className="ax-name">AI Assistant</div>
            <div className="ax-sub">{voiceMode ? 'ভয়েস মোড চালু' : 'BRIU Sports Club'}</div>
          </div>
        </div>
        <div className="ax-tools">
          {!voiceMode && (
            <button
              type="button"
              className="ax-pill"
              onClick={() => setVoiceMode(true)}
              title="Voice Mode"
              aria-label="Voice Mode"
            >
              <Mic size={15} /> <span className="ax-pill-t">Voice Mode</span>
            </button>
          )}
          <button type="button" className="ax-ib" onClick={onClear} title="New Chat" aria-label="New Chat">
            <Refresh size={17} />
          </button>
          <button type="button" className="ax-ib" onClick={onClose} title="Close" aria-label="Close">
            <Close size={18} />
          </button>
        </div>
      </div>

      {voiceMode ? (
        <VoiceMode
          messages={messages}
          loading={loading}
          onSend={onSend}
          onOpenPage={onOpenPage}
          voice={voice}
          onExit={() => { voice.stop(); setVoiceMode(false); }}
        />
      ) : (
        <>
          <div className="ax-body">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} onOpenPage={onOpenPage} />
            ))}
            {onlyGreeting && !loading && (
              <div className="ax-chips">
                {QUICK.map((q) => (
                  <button key={q} type="button" className="ax-chip" onClick={() => onSend(q)}>
                    {q}
                  </button>
                ))}
              </div>
            )}
            {loading && (
              <div className="ax-row">
                <div className="ax-av"><Avatar iconSize={13} /></div>
                <div className="ax-bub ax-bub-bot ax-typing"><i /><i /><i /></div>
              </div>
            )}
            <div ref={endRef} />
          </div>
          <ChatInput onSend={onSend} disabled={loading} />
        </>
      )}
    </div>
  );
}