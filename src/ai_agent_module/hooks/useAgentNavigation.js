import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// শুধু নিজের সাইটের পাথ (/...) গ্রহণ করে — বাইরের লিংকে যাবে না।
const isSafe = (url) => typeof url === 'string' && url.startsWith('/') && !url.startsWith('//');

export default function useAgentNavigation() {
  const navigate = useNavigate();
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  // AI পেজ খুলতে বললে অল্প দেরিতে (যাতে উত্তরটা দেখা/শোনা যায়) নিয়ে যায়
  const go = useCallback((action, delay = 1800) => {
    if (!action || action.type !== 'navigate' || !isSafe(action.url)) return false;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => navigate(action.url), delay);
    return true;
  }, [navigate]);

  const goNow = useCallback((url) => {
    if (!isSafe(url)) return;
    clearTimeout(timer.current);
    navigate(url);
  }, [navigate]);

  return { go, goNow };
}
