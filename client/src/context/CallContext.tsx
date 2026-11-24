import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { CallSession, CallHistoryRecord, CallType } from '../types';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { callEngine } from '../webrtc/callEngine';
import { useAuth } from './AuthContext';

interface IncomingCallData {
  callId: string;
  initiatorId: string;
  initiatorName: string;
  initiatorAvatar?: string;
  type: CallType;
  isGroup: boolean;
  conversationId?: string;
}

interface CallContextType {
  activeCall: CallSession | null;
  callState: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';
  incomingCall: IncomingCallData | null;
  peerInfo: { name: string; avatar?: string } | null;
  callDuration: number;
  isMuted: boolean;
  isVideoOff: boolean;
  connectionQuality: 'HD' | 'Good' | 'Connecting';
  callHistory: CallHistoryRecord[];
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
  startCall: (params: {
    type: CallType;
    recipientId?: string;
    recipientName?: string;
    recipientAvatar?: string;
    isGroup?: boolean;
    conversationId?: string;
    participantIds?: string[];
  }) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => Promise<void>;
  cancelCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  toggleVideo: () => void;
  loadCallHistory: () => Promise<void>;
  clearCallHistory: () => Promise<void>;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [callState, setCallState] = useState<'idle' | 'calling' | 'ringing' | 'connected' | 'ended'>('idle');
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const [peerInfo, setPeerInfo] = useState<{ name: string; avatar?: string } | null>(null);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(false);
  const [connectionQuality, setConnectionQuality] = useState<'HD' | 'Good' | 'Connecting'>('Connecting');
  const [callHistory, setCallHistory] = useState<CallHistoryRecord[]>([]);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const durationTimerRef = useRef<any>(null);

  const loadCallHistory = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.getCallHistory();
      setCallHistory(res.history);
    } catch (err) {
      console.error('Failed to load call history:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadCallHistory();
    }
  }, [user, loadCallHistory]);

  // Connect local and remote video streams to HTML elements
  const attachStreams = useCallback(async (type: CallType) => {
    try {
      const localStream = await callEngine.getLocalStream(type);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
    } catch (err) {
      console.warn('Error attaching local stream:', err);
    }
  }, []);

  // WebRTC engine callbacks
  useEffect(() => {
    callEngine.setCallbacks(
      (remoteStream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
        setConnectionQuality('HD');
      },
      (state) => {
        if (state === 'connected') {
          setConnectionQuality('HD');
        } else if (state === 'connecting') {
          setConnectionQuality('Connecting');
        } else if (state === 'disconnected' || state === 'failed') {
          setConnectionQuality('Good');
        }
      }
    );
  }, []);

  // Timer for active call duration
  useEffect(() => {
    if (callState === 'connected') {
      durationTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(durationTimerRef.current);
    }
    return () => clearInterval(durationTimerRef.current);
  }, [callState]);

  // WebSocket call listeners
  useEffect(() => {
    const unsubIncoming = socket.on('call.incoming', (data: IncomingCallData) => {
      // Don't show incoming call if already in a call
      if (callState !== 'idle') {
        socket.send('call.reject', { callId: data.callId, initiatorId: data.initiatorId });
        return;
      }
      setIncomingCall(data);
      callEngine.playIncomingRingtone();
    });

    const unsubRinging = socket.on('call.ringing', (_data: any) => {
      if (callState === 'calling') {
        setCallState('ringing');
      }
    });

    const unsubAccepted = socket.on('call.accepted', async (data: { callId: string; recipientId: string }) => {
      callEngine.stopRingtone();
      setCallState('connected');
      if (activeCall) {
        setActiveCall((prev) => (prev ? { ...prev, status: 'accepted' } : null));
        // Initialize WebRTC as initiator
        await callEngine.initPeerConnection(data.callId, data.recipientId, true, activeCall.type);
        await attachStreams(activeCall.type);
      }
    });

    const unsubRejected = socket.on('call.rejected', (_data: any) => {
      callEngine.stopRingtone();
      callEngine.closePeerConnection();
      setCallState('ended');
      setTimeout(() => {
        setCallState('idle');
        setActiveCall(null);
        setIncomingCall(null);
        setPeerInfo(null);
        setCallDuration(0);
        loadCallHistory();
      }, 1500);
    });

    const unsubCancelled = socket.on('call.cancelled', (_data: any) => {
      callEngine.stopRingtone();
      callEngine.closePeerConnection();
      setIncomingCall(null);
      setCallState('idle');
      setActiveCall(null);
      loadCallHistory();
    });

    const unsubEnded = socket.on('call.ended', (_data: any) => {
      callEngine.stopRingtone();
      callEngine.closePeerConnection();
      setCallState('ended');
      setTimeout(() => {
        setCallState('idle');
        setActiveCall(null);
        setIncomingCall(null);
        setPeerInfo(null);
        setCallDuration(0);
        loadCallHistory();
      }, 1500);
    });

    return () => {
      unsubIncoming();
      unsubRinging();
      unsubAccepted();
      unsubRejected();
      unsubCancelled();
      unsubEnded();
    };
  }, [callState, activeCall, attachStreams, loadCallHistory]);

  const startCall = async (params: {
    type: CallType;
    recipientId?: string;
    recipientName?: string;
    recipientAvatar?: string;
    isGroup?: boolean;
    conversationId?: string;
    participantIds?: string[];
  }) => {
    try {
      setPeerInfo({
        name: params.recipientName || 'Contact',
        avatar: params.recipientAvatar,
      });
      setCallState('calling');
      setCallDuration(0);
      setIsMuted(false);
      setIsVideoOff(false);
      callEngine.playOutgoingRingtone();

      const res = await api.startCall(params);
      setActiveCall(res.call);

      // Signal over WebSocket
      socket.send('call.invite', {
        callId: res.call.id,
        recipientId: params.recipientId,
        type: params.type,
        isGroup: params.isGroup,
        conversationId: params.conversationId,
      });

      await attachStreams(params.type);
    } catch (err) {
      console.error('Failed to start call:', err);
      callEngine.stopRingtone();
      setCallState('idle');
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    callEngine.stopRingtone();

    try {
      const res = await api.acceptCall(incomingCall.callId);
      setActiveCall(res.call);
      setPeerInfo({
        name: incomingCall.initiatorName,
        avatar: incomingCall.initiatorAvatar,
      });
      setCallState('connected');
      setIncomingCall(null);

      socket.send('call.accept', {
        callId: incomingCall.callId,
        initiatorId: incomingCall.initiatorId,
      });

      // Initialize WebRTC as receiver
      await callEngine.initPeerConnection(incomingCall.callId, incomingCall.initiatorId, false, incomingCall.type);
      await attachStreams(incomingCall.type);
    } catch (err) {
      console.error('Error accepting call:', err);
      callEngine.closePeerConnection();
      setCallState('idle');
    }
  };

  const rejectCall = async () => {
    if (!incomingCall) return;
    callEngine.stopRingtone();
    await api.rejectCall(incomingCall.callId);
    socket.send('call.reject', {
      callId: incomingCall.callId,
      initiatorId: incomingCall.initiatorId,
    });
    setIncomingCall(null);
    loadCallHistory();
  };

  const cancelCall = async () => {
    if (!activeCall) return;
    callEngine.stopRingtone();
    callEngine.closePeerConnection();
    await api.cancelCall(activeCall.id);
    socket.send('call.cancel', {
      callId: activeCall.id,
      recipientId: activeCall.recipientId,
      conversationId: activeCall.conversationId,
    });
    setCallState('idle');
    setActiveCall(null);
    setPeerInfo(null);
    loadCallHistory();
  };

  const endCall = async () => {
    if (!activeCall) return;
    callEngine.stopRingtone();
    callEngine.closePeerConnection();
    await api.endCall(activeCall.id, callDuration);
    socket.send('call.end', {
      callId: activeCall.id,
      targetUserId: activeCall.recipientId,
      conversationId: activeCall.conversationId,
    });
    setCallState('ended');
    setTimeout(() => {
      setCallState('idle');
      setActiveCall(null);
      setPeerInfo(null);
      setCallDuration(0);
      loadCallHistory();
    }, 1200);
  };

  const toggleMute = () => {
    const muted = callEngine.toggleMute();
    setIsMuted(muted);
  };

  const toggleVideo = () => {
    const off = callEngine.toggleVideo();
    setIsVideoOff(off);
  };

  const clearCallHistory = async () => {
    await api.clearCallHistory();
    setCallHistory([]);
  };

  return (
    <CallContext.Provider
      value={{
        activeCall,
        callState,
        incomingCall,
        peerInfo,
        callDuration,
        isMuted,
        isVideoOff,
        connectionQuality,
        callHistory,
        localVideoRef,
        remoteVideoRef,
        startCall,
        acceptCall,
        rejectCall,
        cancelCall,
        endCall,
        toggleMute,
        toggleVideo,
        loadCallHistory,
        clearCallHistory,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error('useCall must be used within a CallProvider');
  return context;
};
