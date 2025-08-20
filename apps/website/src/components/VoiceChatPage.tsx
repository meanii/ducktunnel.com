import { useEffect } from 'react';
import { roomRoute } from '../routes/room';
import { saveRoomToRecent } from '../utils/recentRooms';
import VoiceChat from './VoiceChat';

export function VoiceChatPage() {
  const { roomName } = roomRoute.useParams();
  
  // Save room to recent visits when component mounts
  useEffect(() => {
    if (roomName) {
      saveRoomToRecent(roomName);
    }
  }, [roomName]);
  
  return <VoiceChat roomName={roomName} />;
}
