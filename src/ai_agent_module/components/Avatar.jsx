import { useState } from 'react';
import { Spark } from './icons';

// ছবির লোকেশন: client/public/rafi.jpg
export const AVATAR_URL = `${import.meta.env.BASE_URL}rafi.jpg`;

export default function Avatar({ iconSize = 16 }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <Spark size={iconSize} />;
  return (
    <img
      className="ax-pic"
      src={AVATAR_URL}
      alt=""
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}