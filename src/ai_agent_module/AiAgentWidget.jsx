import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './ai-agent.css';
import LauncherButton from './components/LauncherButton';
import ChatWindow from './components/ChatWindow';
import useChat from './hooks/useChat';
import useVoice from './hooks/useVoice';
import useAgentNavigation from './hooks/useAgentNavigation';

// এই পাথগুলোতে উইজেট দেখাবে না (অ্যাডমিন প্যানেল ইত্যাদি)

const HIDE_ON = ['/admin', '/sports/table-tennis/projector'];

export default function AiAgentWidget() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(() => {
    try { return sessionStorage.getItem('aiag_open') === '1'; } catch (e) { return false; }
  });
  const chat = useChat();
  const voice = useVoice();
  const nav = useAgentNavigation();

  useEffect(() => {
    try { sessionStorage.setItem('aiag_open', open ? '1' : '0'); } catch (e) { /* ignore */ }
  }, [open]);

  if (HIDE_ON.some((p) => pathname.startsWith(p))) return null;

  const handleSend = async (text) => {
    voice.stop();
    const data = await chat.send(text);
    if (!data) return;
    voice.speak(data.reply);
    nav.go(data.action);
  };

  return (
    <div className="aiag-root">
      {open ? (
        <ChatWindow
          messages={chat.messages}
          loading={chat.loading}
          onSend={handleSend}
          onClose={() => setOpen(false)}
          onClear={() => { voice.stop(); chat.clear(); }}
          onOpenPage={nav.goNow}
          voice={voice}
        />
      ) : (
        <LauncherButton onClick={() => setOpen(true)} />
      )}
    </div>
  );
}
