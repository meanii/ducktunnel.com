'use client'

import { useState, useRef, useEffect } from 'react';
import '../App.css';
import { Input } from './ui/input';
import { Button } from './ui/button';

// Use a public STUN server for NAT traversal.
const stunServer = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302'
    }
  ],
};

const duckTunnelServer = `${import.meta.env.VITE_DUCK_TUNNEL_SERVER}/ws`;

function Demo() {
  const [roomId, setRoomId] = useState('public-room');
  const [isConnected, setIsConnected] = useState(false);

  const ws = useRef<WebSocket | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const remoteAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!ws.current) return;

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'offer') handleOffer(message.offer);
      if (message.type === 'answer') handleAnswer(message.answer);
      if (message.type === 'candidate') handleCandidate(message.candidate);
    };
  }, [ws.current]);

  const sendMessage = (message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  const startCall = async () => {
    try {
      localStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      alert("Cannot access microphone. Please allow access and try again.");
      return;
    }

    ws.current = new WebSocket(`${duckTunnelServer}?room=${roomId}`);
    ws.current.onopen = () => {
      setIsConnected(true);
      initializePeerConnection();
    };
    ws.current.onclose = () => setIsConnected(false);
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
      if (remoteAudio.current) remoteAudio.current.srcObject = event.streams[0];
    };
  };

  const createOffer = async () => {
    const offer = await peerConnection.current?.createOffer();
    await peerConnection.current?.setLocalDescription(offer!);
    sendMessage({ type: 'offer', offer });
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    await peerConnection.current?.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.current?.createAnswer();
    await peerConnection.current?.setLocalDescription(answer!);
    sendMessage({ type: 'answer', answer });
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    await peerConnection.current?.setRemoteDescription(new RTCSessionDescription(answer));
  };

  const handleCandidate = async (candidate: RTCIceCandidateInit) => {
    await peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
  };

  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="text-2xl font-bold mb-2">Duck Tunnel 🦆</h1>
      <p className="text-sm text-gray-600 mb-2">Simplified VoIP (Voice over Internet Protocol) Call Demonstration.</p>

      <div className="flex gap-2 mb-4">
        <Input
          type="text"
          placeholder="Create or Join a Room ID"
          value={roomId}
          disabled={isConnected}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <Button onClick={startCall} disabled={isConnected}>
          Enter Room
        </Button>
      </div>

      {isConnected && (
        <div className="flex flex-col items-center text-center">
          <p className="mb-2">You are connected to room: <span className="font-semibold">{roomId}</span></p>
          <Button onClick={createOffer}>Start Call</Button>
        </div>
      )}

      {isConnected && (
        <div className="mt-4 w-full max-w-xs">
          <h2 className="text-lg font-semibold text-center">Incoming Audio</h2>
          <audio ref={remoteAudio} autoPlay controls className="mt-2 w-full"></audio>
        </div>
      )}

    </div>

  );
}

export default Demo;