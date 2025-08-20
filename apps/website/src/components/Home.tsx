import { useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import { generateRoomName } from '../utils/roomName';
import { saveRoomToRecent, getRecentRooms, type RecentRoom } from '../utils/recentRooms';

export function Home() {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState(generateRoomName());
  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>([]);

  // Load recent rooms from localStorage on component mount
  useEffect(() => {
    const rooms = getRecentRooms();
    setRecentRooms(rooms);
  }, []);

  const handleStartChat = () => {
    const updatedRooms = saveRoomToRecent(roomName);
    setRecentRooms(updatedRooms);
    navigate({ to: `/${roomName}` });
  };

  const handleJoinRecentRoom = (room: RecentRoom) => {
    const updatedRooms = saveRoomToRecent(room.name);
    setRecentRooms(updatedRooms);
    navigate({ to: `/${room.name}` });
  };

  const regenerateRoomName = () => {
    setRoomName(generateRoomName());
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diffMinutes = Math.floor((now - timestamp) / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center text-gray-200 font-sans">
      <div className="text-center flex-1 flex flex-col justify-center px-4 w-full">
        {/* Main Content - takes natural width */}
        <div className="space-y-6 max-w-2xl mx-auto">
          {/* Main Header */}
          <div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <h1 className="text-4xl font-normal tracking-tight">
                <span className="text-gray-400">ducktunnel.com</span>
                <span className="text-green-500">/{roomName}</span>
              </h1>
              <button
                onClick={regenerateRoomName}
                className="text-gray-400 hover:text-gray-300 p-1 rounded transition-colors duration-200"
                title="Generate new room name"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            <p className="text-base text-gray-400 font-light">
              Simple, private, and secure P2P voice chat for friends & family{' '}
              <span className="inline-block animate-bounce">🐥</span>
            </p>
          </div>

          {/* Start Chat Button */}
          <button
            className="bg-green-500 text-white rounded-lg px-8 py-3 text-base font-medium shadow-md transition-colors duration-200 hover:bg-green-600 w-full max-w-xs mx-auto"
            onClick={handleStartChat}
          >
            Start Chat
          </button>
        </div>

        {/* Recent Rooms - constrained width */}
        {recentRooms.length > 0 && (
          <div className="space-y-3 mt-8 w-full max-w-md mx-auto">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <Clock className="h-4 w-4" />
              <span>Recent rooms</span>
            </div>
            <div className="space-y-2 min-w-80">
              {recentRooms.map((room) => (
                <button
                  key={`${room.name}-${room.lastVisited}`}
                  onClick={() => handleJoinRecentRoom(room)}
                  className="w-full text-left bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 hover:border-gray-600/50 rounded-lg px-4 py-3 transition-all duration-200 group min-w-80"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-200 group-hover:text-white">
                        /{room.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTimeAgo(room.lastVisited)}
                      </div>
                    </div>
                    <div className="text-gray-500 group-hover:text-gray-400">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center text-gray-400 text-sm tracking-tight pb-8 px-4">
        <div className="space-y-2">
          <div className="text-xs text-gray-500">
            No registration required • End-to-end encrypted
          </div>
          <div className="flex items-center justify-center gap-2">
            <span>Duck Tunnel © {new Date().getFullYear()}</span>
            <span>•</span>
            <a 
              href="https://meanii.dev/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-gray-300 transition-colors duration-200"
            >
              meanii.dev
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
