'use client'

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import '../App.css';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { ShieldCheck, Users, Volume2, Mic, LogOut, Share2, Check } from 'lucide-react';

// Use a public STUN server for NAT traversal.
const stunServer = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302'
    }
  ],
};

const duckTunnelServer = `${import.meta.env.VITE_DUCK_TUNNEL_SERVER}/ws`;

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'in-call';

function VoiceChat({ roomName }: { roomName: string }) {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState(roomName || '');
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isUrlCopied, setIsUrlCopied] = useState(false);

  const ws = useRef<WebSocket | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const remoteAudio = useRef<HTMLAudioElement | null>(null);

  // Update room ID when roomName prop changes
  useEffect(() => {
    if (roomName) {
      setRoomId(roomName);
    }
  }, [roomName]);

  useEffect(() => {
    if (!ws.current) return;

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'offer') handleOffer(message.offer);
      if (message.type === 'answer') handleAnswer(message.answer);
      if (message.type === 'candidate') handleCandidate(message.candidate);
    };
  }, [ws.current]);

  const sendMessage = (message: Record<string, unknown>) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  const joinRoom = async () => {
    if (!roomId.trim()) {
      setError('Please enter a room ID');
      return;
    }

    setError(null);
    setConnectionState('connecting');

    try {
      // Get microphone access
      localStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Cannot access microphone. Please allow access and try again.");
      setConnectionState('disconnected');
      return;
    }

    // Connect to WebSocket
    ws.current = new WebSocket(`${duckTunnelServer}?room=${roomId}`);
    
    ws.current.onopen = () => {
      setConnectionState('connected');
      initializePeerConnection();
    };
    
    ws.current.onclose = () => {
      setConnectionState('disconnected');
      setError('Connection lost');
    };

    ws.current.onerror = () => {
      setError('Failed to connect to server');
      setConnectionState('disconnected');
    };
  };

  const initializePeerConnection = () => {
    peerConnection.current = new RTCPeerConnection(stunServer);

    localStream.current?.getTracks().forEach(track => {
      peerConnection.current?.addTrack(track, localStream.current!);
    });

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) sendMessage({ type: 'candidate', candidate: event.candidate });
    };

    peerConnection.current.ontrack = (event) => {
      if (remoteAudio.current) {
        remoteAudio.current.srcObject = event.streams[0];
        setConnectionState('in-call');
      }
    };
  };

  const startCall = async () => {
    // if (connectionState !== 'connected') return;
    
    try {
      const offer = await peerConnection.current?.createOffer();
      await peerConnection.current?.setLocalDescription(offer!);
      sendMessage({ type: 'offer', offer });
      setConnectionState('in-call');
    } catch {
      setError('Failed to start call');
    }
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    try {
      await peerConnection.current?.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.current?.createAnswer();
      await peerConnection.current?.setLocalDescription(answer!);
      sendMessage({ type: 'answer', answer });
      setConnectionState('in-call');
    } catch {
      setError('Failed to handle offer');
    }
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    try {
      await peerConnection.current?.setRemoteDescription(new RTCSessionDescription(answer));
    } catch {
      setError('Failed to handle answer');
    }
  };

  const handleCandidate = async (candidate: RTCIceCandidateInit) => {
    try {
      await peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
    } catch {
      setError('Failed to handle ICE candidate');
    }
  };

  const toggleMute = () => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const shareRoom = async () => {
    try {
      const roomUrl = `${window.location.origin}/${roomId}`;
      await navigator.clipboard.writeText(roomUrl);
      setIsUrlCopied(true);
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setIsUrlCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
      setError('Failed to copy URL to clipboard');
    }
  };

  const leaveRoom = () => {
    // Close WebSocket connection
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }

    // Close peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    // Stop local media stream
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
        track.stop();
      });
      localStream.current = null;
    }

    // Clear remote audio
    if (remoteAudio.current) {
      remoteAudio.current.srcObject = null;
    }

    // Reset state
    setConnectionState('disconnected');
    setError(null);
    setIsMuted(false);
    setIsUrlCopied(false);

    // Navigate back to home
    navigate({ to: '/' });
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (ws.current) {
        ws.current.close();
      }
      if (peerConnection.current) {
        peerConnection.current.close();
      }
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const isConnected = connectionState !== 'disconnected';
  const isInCall = connectionState === 'in-call';

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center text-gray-200 font-sans overflow-hidden">
      <div className="w-full max-w-md flex flex-col items-center justify-center rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-2">
          <Mic className="w-6 h-6 text-green-500" />
          <h1 className="text-2xl font-semibold tracking-tight text-gray-100">Voice Chat Room</h1>
          <ShieldCheck className="w-5 h-5 text-gray-400 ml-2" />
        </div>
        <p className="text-sm text-gray-400 mb-6 flex items-center gap-1">
          <Users className="w-4 h-4 inline text-gray-500" />
          Private & secure P2P voice chat for friends & family
        </p>

          {/* Error Display */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/50 text-red-300 px-4 py-2 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Room Connection Section */}
          {connectionState === 'disconnected' && (
            <div className="flex gap-2 mb-6">
              <Input
                type="text"
                placeholder="Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="bg-neutral-800 text-gray-100 border-none focus:ring-2 focus:ring-green-500"
                onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
              />
              <Button 
                onClick={joinRoom} 
                disabled={!roomId.trim()}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                <Mic className="w-4 h-4 mr-1" /> Join
              </Button>
            </div>
          )}

          {/* Connecting State */}
          {connectionState === 'connecting' && (
            <div className="text-center mb-6">
              <p className="text-gray-300">Connecting to room...</p>
            </div>
          )}

          {/* Connected State */}
          {isConnected && (
            <div className="flex flex-col items-center text-center mb-6">
              <div className="flex items-center gap-2 mb-4">
                <p className="text-gray-300">
                  Connected to <span className="font-semibold text-green-400">{roomId}</span>
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={shareRoom}
                  className="text-gray-400 hover:text-blue-400 p-1 h-8"
                  title="Share room URL"
                >
                  {isUrlCopied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              {/* Call Controls */}
              <div className="flex gap-2 mb-4">
                {!isInCall && (
                  <Button onClick={startCall} className="bg-green-500 hover:bg-green-600 text-white">
                    <Volume2 className="w-4 h-4 mr-1" /> Start Call
                  </Button>
                )}
                
                {isInCall && (
                  <Button 
                    onClick={toggleMute} 
                    variant={isMuted ? "destructive" : "default"}
                    className={isMuted ? "bg-red-500 hover:bg-red-600" : "bg-gray-600 hover:bg-gray-700"}
                  >
                    <Mic className={`w-4 h-4 mr-1 ${isMuted ? 'line-through' : ''}`} /> 
                    {isMuted ? 'Unmute' : 'Mute'}
                  </Button>
                )}
              </div>

              {/* Status */}
              <p className="text-sm text-gray-400">
                {connectionState === 'connected' && 'Ready to call'}
                {connectionState === 'in-call' && 'In call'}
              </p>
            </div>
          )}

          {/* Remote Audio */}
          {isInCall && (
            <div className="mt-4 bg-neutral-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-center text-gray-200 mb-2 flex items-center justify-center gap-2">
                <Volume2 className="w-5 h-5 text-green-400" /> Remote Audio
              </h2>
              <audio ref={remoteAudio} autoPlay className="mt-2 w-full rounded" />
            </div>
          )}

          {/* Leave Room Button */}
          <div className="mt-8 text-center">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-400 hover:text-red-500 flex items-center gap-1"
              onClick={leaveRoom}
            >
              <LogOut className="w-4 h-4" /> Leave Room
            </Button>
          </div>
        </div>
    </div>
  );
}

export default VoiceChat;