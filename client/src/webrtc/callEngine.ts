import { socket } from '../services/socket';

export class CallEngine {
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private audioCtx: AudioContext | null = null;
  private ringtoneInterval: any = null;

  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
  private onConnectionStateChangeCallback: ((state: RTCPeerConnectionState) => void) | null = null;

  constructor() {
    this.setupSocketListeners();
  }

  public setCallbacks(
    onRemoteStream: (stream: MediaStream) => void,
    onConnectionStateChange: (state: RTCPeerConnectionState) => void
  ) {
    this.onRemoteStreamCallback = onRemoteStream;
    this.onConnectionStateChangeCallback = onConnectionStateChange;
  }

  // Ringtone synthesizer (Web Audio API)
  public playIncomingRingtone() {
    this.stopRingtone();
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      this.audioCtx = new AudioContextClass();

      const playBeep = () => {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, this.audioCtx.currentTime); // A4
        osc.frequency.exponentialRampToValueAtTime(880, this.audioCtx.currentTime + 0.3); // A5

        gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.4);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.4);
      };

      playBeep();
      this.ringtoneInterval = setInterval(playBeep, 2000);
    } catch (err) {
      console.warn('AudioContext not allowed or not supported yet:', err);
    }
  }

  public playOutgoingRingtone() {
    this.stopRingtone();
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      this.audioCtx = new AudioContextClass();

      const playRingback = () => {
        if (!this.audioCtx) return;
        const osc1 = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc1.frequency.setValueAtTime(400, this.audioCtx.currentTime);
        osc2.frequency.setValueAtTime(450, this.audioCtx.currentTime);

        gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.audioCtx.currentTime + 1.2);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(this.audioCtx.currentTime + 1.2);
        osc2.stop(this.audioCtx.currentTime + 1.2);
      };

      playRingback();
      this.ringtoneInterval = setInterval(playRingback, 3500);
    } catch (err) {
      console.warn('Outgoing audio error:', err);
    }
  }

  public stopRingtone() {
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch (err) {}
      this.audioCtx = null;
    }
  }

  // Acquire media stream (real or canvas fallback)
  public async getLocalStream(type: 'audio' | 'video'): Promise<MediaStream> {
    if (this.localStream) return this.localStream;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
      });
      this.localStream = stream;
      return stream;
    } catch (err) {
      console.warn('Real camera/mic unavailable or denied, generating simulated stream:', err);
      // Fallback simulated canvas stream for video calls
      const stream = this.createSimulatedMediaStream(type);
      this.localStream = stream;
      return stream;
    }
  }

  private createSimulatedMediaStream(_type: 'audio' | 'video'): MediaStream {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d')!;

    let angle = 0;
    const draw = () => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Indian Tricolor / Saffron accent glow
      const grad = ctx.createRadialGradient(320, 240, 10, 320, 240, 200);
      grad.addColorStop(0, '#f97316');
      grad.addColorStop(0.5, '#ea580c');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(320, 240, 150 + Math.sin(angle) * 10, 0, Math.PI * 2);
      ctx.fill();

      // AUM symbol and text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🕉️ AUM E2EE', 320, 230);
      ctx.font = '20px sans-serif';
      ctx.fillStyle = '#fde047';
      ctx.fillText('Encrypted WebRTC Stream', 320, 270);

      angle += 0.05;
      requestAnimationFrame(draw);
    };
    draw();

    const canvasStream = canvas.captureStream(25);

    // Simulated audio track
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const audioCtx = new AudioContextClass();
        const dest = audioCtx.createMediaStreamDestination();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        gain.gain.value = 0.0001; // Silent
        osc.connect(gain);
        gain.connect(dest);
        osc.start();
        dest.stream.getAudioTracks().forEach((t) => canvasStream.addTrack(t));
      }
    } catch (err) {}

    return canvasStream;
  }

  // PeerConnection setup
  public async initPeerConnection(callId: string, peerId: string, isInitiator: boolean, type: 'audio' | 'video') {
    this.closePeerConnection();

    const stream = await this.getLocalStream(type);

    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    // Add local tracks
    stream.getTracks().forEach((track) => {
      this.peerConnection!.addTrack(track, stream);
    });

    // Handle remote tracks
    this.peerConnection.ontrack = (event) => {
      console.log('Received remote track', event.streams[0]);
      this.remoteStream = event.streams[0];
      if (this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(this.remoteStream);
      }
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.send('call.ice', {
          callId,
          targetUserId: peerId,
          candidate: event.candidate,
        });
      }
    };

    // Connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection && this.onConnectionStateChangeCallback) {
        this.onConnectionStateChangeCallback(this.peerConnection.connectionState);
      }
    };

    if (isInitiator) {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      socket.send('call.sdp', {
        callId,
        targetUserId: peerId,
        sdp: offer,
      });
    }
  }

  private setupSocketListeners() {
    socket.on('call.sdp', async (data: { senderId: string; callId: string; sdp: RTCSessionDescriptionInit }) => {
      if (!this.peerConnection) return;
      try {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
        if (data.sdp.type === 'offer') {
          const answer = await this.peerConnection.createAnswer();
          await this.peerConnection.setLocalDescription(answer);
          socket.send('call.sdp', {
            callId: data.callId,
            targetUserId: data.senderId,
            sdp: answer,
          });
        }
      } catch (err) {
        console.error('Error handling remote SDP:', err);
      }
    });

    socket.on('call.ice', async (data: { candidate: RTCIceCandidateInit }) => {
      if (!this.peerConnection || !data.candidate) return;
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    });
  }

  public toggleMute(): boolean {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      return !audioTrack.enabled; // return isMuted
    }
    return false;
  }

  public toggleVideo(): boolean {
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      return !videoTrack.enabled; // return isVideoOff
    }
    return false;
  }

  public closePeerConnection() {
    this.stopRingtone();
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    this.remoteStream = null;
  }
}

export const callEngine = new CallEngine();
