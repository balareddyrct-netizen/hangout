import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import apiClient from '../api/client';
import { PhoneOff, Mic, MicOff, Video as VideoIcon, VideoOff } from 'lucide-react';

const VideoCall = () => {
  const { user } = useAuth();
  const { sendVideoSignal, incomingCall, setIncomingCall, videoSignals } = useSocket();
  const [friends, setFriends] = useState([]);
  const [activeCall, setActiveCall] = useState(null); // The friend we're calling
  const [isCalling, setIsCalling] = useState(false);
  
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnection = useRef(null);
  const localStream = useRef(null);

  // Audio/Video toggle state
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    apiClient.get('/friends').then(res => setFriends(res.data)).catch(console.error);
    return () => endCall(); // Cleanup
  }, []);

  // Handle incoming signaling
  useEffect(() => {
    if (videoSignals.length > 0) {
      const signal = videoSignals[videoSignals.length - 1];
      handleSignalingData(signal);
    }
  }, [videoSignals]);

  const initWebRTC = async (targetId, isInitiator) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStream.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
      const pc = new RTCPeerConnection(configuration);
      peerConnection.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendVideoSignal(targetId, {
            type: 'ice-candidate',
            candidate: event.candidate
          });
        }
      };

      if (isInitiator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendVideoSignal(targetId, {
          type: 'offer',
          offer: offer
        });
      }

      return pc;
    } catch (e) {
      console.error("Error accessing media devices.", e);
      alert("Could not access camera/microphone.");
    }
  };

  const handleSignalingData = async (data) => {
    if (!peerConnection.current && data.type !== 'offer') return;

    if (data.type === 'offer') {
      // Incoming call handled separately via UI state (incomingCall)
      // See handleAcceptCall
    } else if (data.type === 'answer') {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer));
    } else if (data.type === 'ice-candidate') {
      try {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (e) {
        console.error('Error adding received ice candidate', e);
      }
    } else if (data.type === 'hangup') {
      endCall(false);
    }
  };

  const startCall = async (friend) => {
    setActiveCall(friend);
    setIsCalling(true);
    await initWebRTC(friend.id, true);
  };

  const handleAcceptCall = async () => {
    if (!incomingCall) return;
    
    const callerId = incomingCall.sender_id;
    const friend = friends.find(f => f.id === callerId) || { id: callerId, username: "Unknown" };
    setActiveCall(friend);
    setIsCalling(true);
    
    const pc = await initWebRTC(callerId, false);
    await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    sendVideoSignal(callerId, {
      type: 'answer',
      answer: answer
    });
    
    setIncomingCall(null);
  };

  const handleRejectCall = () => {
    if (incomingCall) {
      sendVideoSignal(incomingCall.sender_id, { type: 'hangup' });
      setIncomingCall(null);
    }
  };

  const endCall = (notify = true) => {
    if (activeCall && notify) {
      sendVideoSignal(activeCall.id, { type: 'hangup' });
    }
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    localStream.current = null;
    peerConnection.current = null;
    setActiveCall(null);
    setIsCalling(false);
    setIncomingCall(null);
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

  const toggleVideo = () => {
    if (localStream.current) {
      const videoTrack = localStream.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  return (
    <div className="page-container h-full flex flex-col animate-fade-in" style={{ padding: 0 }}>
      {incomingCall && !isCalling && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="glass p-8 rounded-2xl text-center max-w-sm w-full animate-pulse">
            <h2 className="text-2xl font-bold mb-2">Incoming Call</h2>
            <p className="text-secondary mb-8">from User {incomingCall.sender_id}</p>
            <div className="flex gap-4 justify-center">
              <button onClick={handleRejectCall} className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors">
                <PhoneOff size={24} />
              </button>
              <button onClick={handleAcceptCall} className="w-14 h-14 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors">
                <VideoIcon size={24} />
              </button>
            </div>
          </div>
        </div>
      )}

      {isCalling ? (
        <div className="flex-1 relative bg-black flex flex-col">
          {/* Main Remote Video */}
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
          
          {/* Picture in Picture Local Video */}
          <div className="absolute top-6 right-6 w-48 aspect-video bg-gray-900 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl">
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
          </div>

          {/* Controls Bar */}
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 glass px-8 py-4 rounded-full flex gap-6 items-center">
            <button onClick={toggleMute} className={`p-4 rounded-full ${isMuted ? 'bg-red-500/20 text-red-500' : 'bg-white/10 hover:bg-white/20'} transition-colors`}>
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
            <button onClick={endCall} className="p-5 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all">
              <PhoneOff size={28} />
            </button>
            <button onClick={toggleVideo} className={`p-4 rounded-full ${isVideoOff ? 'bg-red-500/20 text-red-500' : 'bg-white/10 hover:bg-white/20'} transition-colors`}>
              {isVideoOff ? <VideoOff size={24} /> : <VideoIcon size={24} />}
            </button>
          </div>
          
          <div className="absolute top-6 left-6 glass px-4 py-2 rounded-lg text-sm font-semibold">
            {activeCall?.username}
          </div>
        </div>
      ) : (
        <div className="p-8 max-w-4xl mx-auto w-full">
          <h1 className="text-3xl font-bold mb-2">Video Call</h1>
          <p className="text-secondary mb-8">Start a WebRTC peer-to-peer call with a friend.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {friends.map(friend => (
              <div key={friend.id} className="glass p-6 rounded-xl text-center">
                <img src={friend.avatar_url || `https://ui-avatars.com/api/?name=${friend.username}`} className="w-20 h-20 rounded-full mx-auto mb-4" alt="avatar" />
                <h3 className="font-bold mb-4">{friend.username}</h3>
                <button onClick={() => startCall(friend)} className="btn btn-primary w-full justify-center">
                  <VideoIcon size={18} /> Call
                </button>
              </div>
            ))}
            {friends.length === 0 && <p className="text-secondary">No friends to call.</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCall;
