import { roomRoute } from '../routes/room';
import VoiceChat from './VoiceChat';

export function VoiceChatPage() {
  const { roomName } = roomRoute.useParams();
  
  return <VoiceChat roomName={roomName} />;
}
