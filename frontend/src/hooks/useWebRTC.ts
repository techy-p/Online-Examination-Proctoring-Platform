import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '../api/client';

interface UseWebRTCOptions {
  sessionId: string;
  isInitiator: boolean;
  enabled: boolean;
}

export function useWebRTC({ sessionId, isInitiator, enabled }: UseWebRTCOptions) {
  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const createPeerConnection = useCallback((targetId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('webrtc-ice-candidate', {
          sessionId,
          targetId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pcRef.current = pc;
    return pc;
  }, [sessionId]);

  const startLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error('Failed to access webcam:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    if (!enabled || !sessionId) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL;
    if (!socketUrl) {
      if (isInitiator) {
        startLocalStream().catch(() => {});
      }
      return () => {
        localStreamRef.current?.getTracks().forEach((track) => track.stop());
      };
    }

    const token = getAccessToken();
    const socket = io(socketUrl, {
      auth: { token },
    });
    socketRef.current = socket;

    const init = async () => {
      if (isInitiator) {
        await startLocalStream();
      }
      socket.emit('join-exam-room', { sessionId });
    };

    init().catch(() => {});

    socket.on('existing-peers', async (peers: string[]) => {
      if (isInitiator && peers.length > 0) {
        const pc = createPeerConnection(peers[0]);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc-offer', { sessionId, targetId: peers[0], offer });
      }
    });

    socket.on('peer-joined', async ({ peerId }: { peerId: string }) => {
      if (!isInitiator) {
        createPeerConnection(peerId);
      }
    });

    socket.on('webrtc-offer', async ({ fromId, offer }) => {
      const pc = createPeerConnection(fromId);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc-answer', { sessionId, targetId: fromId, answer });
    });

    socket.on('webrtc-answer', async ({ answer }) => {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on('webrtc-ice-candidate', async ({ candidate }) => {
      if (pcRef.current) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      pcRef.current?.close();
      socket.disconnect();
    };
  }, [sessionId, isInitiator, enabled, createPeerConnection, startLocalStream]);

  return { localVideoRef, remoteVideoRef };
}
