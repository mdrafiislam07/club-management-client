import { useEffect, useRef, useState, useCallback } from 'react';
import useSpeechInput from '../hooks/useSpeechInput';
import { Mic, Stop, Compass } from './icons';

const textOf = (m) => (m && (m.text ?? m.content)) || '';
const LABELS = {
  idle: 'Press mic to speak',
  listening: 'Listening…',
  thinking: 'Thinking…',
  speaking: 'Speaking… Press to stop',
};
const HINTS = ["What's today's match score?", 'Show committee members', 'Take me to events page'];
const isHere = (url) =>
  url === `${window.location.pathname}${window.location.search}` || url === window.location.pathname;

export default function VoiceMode({ messages, loading, onSend, onOpenPage, voice, onExit }) {
  const [phase, setPhase] = useState('idle'); // idle | thinking | speaking
  const [heard, setHeard] = useState('');
  const [reply, setReply] = useState(null);
  const awaiting = useRef(false);
  const interrupted = useRef(false);
  const alive = useRef(true);
  const prevLoading = useRef(loading);
  const msgsRef = useRef(messages);
  const voiceRef = useRef(voice);
  const openRef = useRef(onOpenPage);
  msgsRef.current = messages;
  voiceRef.current = voice;
  openRef.current = onOpenPage;

  const submit = useCallback((text) => {
    awaiting.current = true;
    interrupted.current = false;
    setHeard(text);
    setReply(null);
    setPhase('thinking');
    onSend(text);
  }, [onSend]);

  const stt = useSpeechInput({ lang: 'bn-BD', onResult: submit });
  const sttRef = useRef(stt);
  sttRef.current = stt;

  // চালু হলেই শোনা শুরু, বন্ধ হলে সব থামানো
  useEffect(() => {
    alive.current = true;
    sttRef.current.start();
    return () => { alive.current = false; voiceRef.current.stop(); };
  }, []);

  // AI-র উত্তর এলে বলা → বলা শেষ হলে পেজে যাওয়া / আবার শোনা
  useEffect(() => {
    if (prevLoading.current && !loading && awaiting.current) {
      awaiting.current = false;
      const list = msgsRef.current;
      const last = list[list.length - 1];
      const text = textOf(last);
      const action = last && last.action && last.action.type === 'navigate' ? last.action : null;
      setReply({ text, action, error: !!(last && last.error) });

      const finishTurn = (completed) => {
        if (!alive.current) return;
        setPhase('idle');
        if (action && !interrupted.current && !isHere(action.url)) openRef.current?.(action.url);
        if (completed) sttRef.current.start();
      };

      if (text) {
        setPhase('speaking');
        voiceRef.current.speak(text, { force: true }).then(finishTurn);
      } else {
        finishTurn(false);
      }
    }
    prevLoading.current = loading;
  }, [loading]);

  const onOrb = () => {
    if (stt.listening) { stt.stop(); return; }
    if (phase === 'speaking') {
      interrupted.current = true;
      voice.stop();
      stt.start();
      return;
    }
    if (phase === 'idle') stt.start();
  };

  const sendHint = (h) => {
    stt.stop();
    submit(h);
  };

  const state = stt.listening ? 'listening' : phase;
  const caption =
    stt.interim || (state === 'thinking' && heard) || (state === 'idle' && stt.error) || '';
  const showHints = !reply && state === 'idle' && !heard;

  return (
    <div className={`ax-v ax-s-${state}`}>
      <div className="ax-v-glow" />

      <div className="ax-stage">
        <div className="ax-orb-wrap">
          <span className="ax-ring" />
          <span className="ax-ring" />
          <span className="ax-ring" />
          <button
            type="button"
            className="ax-orb"
            onClick={onOrb}
            disabled={!stt.supported || state === 'thinking'}
            aria-label="Voice"
          >
            {state === 'speaking' ? <Stop size={34} /> : <Mic size={34} />}
          </button>
        </div>

        <div className="ax-wave" aria-hidden="true">
          <i /><i /><i /><i /><i /><i /><i />
        </div>

        <div className="ax-status">
          {stt.supported ? LABELS[state] : 'Voice input is not supported in this browser. Please use Chrome or Edge.'}
        </div>
        <div className="ax-caption">{caption}</div>
      </div>

      <div className="ax-vlow">
        {reply && reply.text && (
          <div className={`ax-card${reply.error ? ' ax-card-err' : ''}`}>
            {heard && <div className="ax-card-you">You: {heard}</div>}
            <div className="ax-card-text">{reply.text}</div>
            {reply.action && (
              <>
                <button type="button" className="ax-go" onClick={() => onOpenPage(reply.action.url)}>
                  <Compass size={14} />
                  Open {reply.action.label || 'page'} <span>→</span>
                </button>
                {state === 'speaking' && (
                  <div className="ax-navnote">Will navigate to the page after speaking finishes</div>
                )}
              </>
            )}
          </div>
        )}

        {showHints && (
          <div className="ax-chips ax-chips-c">
            {HINTS.map((h) => (
              <button key={h} type="button" className="ax-chip" onClick={() => sendHint(h)}>
                {h}
              </button>
            ))}
          </div>
        )}

        <button type="button" className="ax-end" onClick={onExit}>
          Close Voice Mode
        </button>
      </div>
    </div>
  );
}