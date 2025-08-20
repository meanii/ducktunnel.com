import { useNavigate } from '@tanstack/react-router';
import { generateRoomName } from '../utils/roomName';

export function Home() {
  const navigate = useNavigate();
  const roomName = generateRoomName();

  const handleStartChat = () => {
    navigate({ to: `/${roomName}` });
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center text-gray-200 font-sans overflow-hidden">
      <div className="text-center flex-1 flex flex-col justify-center px-4">
        <h1 className="text-4xl font-normal tracking-tight mb-2">
          <span className="text-gray-400">ducktunnel.com</span>
          <span className="text-green-500">/{roomName}</span>
        </h1>
        <p className="text-base text-gray-400 mb-8 font-light">
          Simple, private, and secure P2P voice chat for friends & family{' '}
          <span className="inline-block">🦆</span>
        </p>
        <button
          className="bg-green-500 text-white rounded-xl px-11 py-4 text-lg font-medium shadow-md transition-colors duration-200 hover:bg-green-600"
          onClick={handleStartChat}
        >
          Start Chat
        </button>
      </div>
      <footer className="text-center text-gray-400 text-sm tracking-tight pb-8 px-4">
        Duck Tunnel &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
