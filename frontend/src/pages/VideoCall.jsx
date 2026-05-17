import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Sparkles, X } from 'lucide-react';

const FILTERS = [
  { id: 'none', name: 'None', css: 'none' },
  { id: 'blur', name: 'Soft Focus', css: 'blur(2px)' },
  { id: 'grayscale', name: 'B&W', css: 'grayscale(100%)' },
  { id: 'sepia', name: 'Vintage', css: 'sepia(80%) contrast(1.1)' },
  { id: 'bright', name: 'Bright', css: 'brightness(1.3) contrast(1.1)' },
  { id: 'cool', name: 'Cool Blue', css: 'saturate(1.5) hue-rotate(30deg)' },
  { id: 'warm', name: 'Warm Glow', css: 'saturate(1.4) hue-rotate(-20deg) brightness(1.1)' },
  { id: 'contrast', name: 'High Contrast', css: 'contrast(1.6) brightness(0.95)' },
  { id: 'retro', name: 'Retro', css: 'sepia(40%) saturate(1.5) contrast(1.2)' },
];

const VideoCall = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [isCalling, setIsCalling] = useState(false);
  const [activeCall, setActiveCall] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState('none');
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const wsRef = useRef(null);
  const localStreamRef = useRef(null);

  useEffect(() => {
    apiClient.get('/friends').then(res => setFriends(res.data));
  }, []);

  useEffect(() => {
    if (!user) return;
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const socket = new WebSocket(`${protocol}://${window.location.host}/ws/video/${user.id}`);
    wsRef.current = socket;

    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'offer') {
        setIncomingCall(data);
      } else if (data.type === 'answer' && peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      } else if (data.type === 'ice-candidate' && peerConnection.current) {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      } else if (data.type === 'call-rejected' || data.type === 'call-ended') {
        endCall();
      }
    };

    return () => socket.close();
  }, [user]);

  const setupPeerConnection = () => {
    const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    const pc = new RTCPeerConnection(config);

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          candidate: event.candidate,
          target_id: activeCall?.id || incomingCall?.sender_id
        }));
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    peerConnection.current = pc;
    return pc;
  };

  const startCall = async (friend) => {
    setActiveCall(friend);
    setIsCalling(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = setupPeerConnection();
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      wsRef.current.send(JSON.stringify({
        type: 'offer', offer, target_id: friend.id, sender_id: user.id
      }));
    } catch (err) { console.error('Failed to start call:', err); endCall(); }
  };

  const handleAcceptCall = async () => {
    setIsCalling(true);
    setActiveCall({ id: incomingCall.sender_id, username: `User ${incomingCall.sender_id}` });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = setupPeerConnection();
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      wsRef.current.send(JSON.stringify({
        type: 'answer', answer, target_id: incomingCall.sender_id
      }));
      setIncomingCall(null);
    } catch (err) { console.error('Failed to accept:', err); endCall(); }
  };

  const handleRejectCall = () => {
    wsRef.current?.send(JSON.stringify({ type: 'call-rejected', target_id: incomingCall.sender_id }));
    setIncomingCall(null);
  };

  const endCall = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    peerConnection.current?.close();
    peerConnection.current = null;
    if (activeCall && wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'call-ended', target_id: activeCall.id }));
    }
    setIsCalling(false);
    setActiveCall(null);
    setActiveFilter('none');
    setShowFilters(false);
  };

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsVideoOff(!isVideoOff);
  };

  const currentFilterCSS = FILTERS.find(f => f.id === activeFilter)?.css || 'none';

  return (
    <div className="page-container h-full flex flex-col animate-fade-in" style={{ padding: 0 }}>
      {/* Incoming Call Modal */}
      {incomingCall && !isCalling && (
        <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-md flex items-center justify-center">
          <div className="bg-white p-10 rounded-[2rem] text-center max-w-sm w-full animate-pulse shadow-xl border border-gray-100">
            <h2 className="text-2xl font-bold font-serif text-gray-900 mb-2">Incoming Call</h2>
            <p className="text-gray-500 mb-10 font-medium">from User {incomingCall.sender_id}</p>
            <div className="flex gap-6 justify-center">
              <button onClick={handleRejectCall} className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors shadow-sm">
                <PhoneOff size={28} />
              </button>
              <button onClick={handleAcceptCall} className="w-16 h-16 rounded-full bg-green-50 text-green-500 flex items-center justify-center hover:bg-green-500 hover:text-white transition-colors shadow-sm">
                <VideoIcon size={28} />
              </button>
            </div>
          </div>
        </div>
      )}

      {isCalling ? (
        <div className="flex-1 relative bg-gray-900 flex flex-col">
          {/* Remote Video with filter */}
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
            style={{ filter: currentFilterCSS }}
          />
          
          {/* Local PiP */}
          <div className="absolute top-6 right-6 w-48 aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20">
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover transform scale-x-[-1]"
              style={{ filter: currentFilterCSS }}
            />
          </div>

          {/* Active Filter Badge */}
          {activeFilter !== 'none' && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-sm font-medium border border-white/20 flex items-center gap-2">
              <Sparkles size={14} /> {FILTERS.find(f => f.id === activeFilter)?.name}
            </div>
          )}

          {/* Controls Bar */}
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
            {/* Main Controls */}
            <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-full flex gap-5 items-center border border-white/20 shadow-lg">
              <button onClick={toggleMute} className={`p-3 rounded-full ${isMuted ? 'bg-white text-gray-900' : 'bg-white/20 text-white hover:bg-white/30'} transition-colors`}>
                {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
              </button>
              <button onClick={endCall} className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all">
                <PhoneOff size={26} />
              </button>
              <button onClick={toggleVideo} className={`p-3 rounded-full ${isVideoOff ? 'bg-white text-gray-900' : 'bg-white/20 text-white hover:bg-white/30'} transition-colors`}>
                {isVideoOff ? <VideoOff size={22} /> : <VideoIcon size={22} />}
              </button>
            </div>

            {/* Effects Button */}
            <button 
              onClick={() => setShowFilters(!showFilters)} 
              className={`p-3 rounded-full backdrop-blur-md border transition-colors shadow-lg ${showFilters ? 'bg-purple-600 text-white border-purple-500' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
            >
              <Sparkles size={22} />
            </button>
          </div>

          {/* Filter Picker Panel */}
          {showFilters && (
            <div className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl animate-fade-in">
              <div className="flex gap-3">
                {FILTERS.map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all min-w-[72px] ${
                      activeFilter === filter.id 
                        ? 'bg-purple-600 text-white shadow-md scale-105' 
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div 
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-white/30"
                      style={{ filter: filter.css }}
                    ></div>
                    <span className="text-[10px] font-medium">{filter.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Caller Name */}
          <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-xl text-sm font-bold text-gray-900 shadow-sm">
            {activeCall?.username}
          </div>
        </div>
      ) : (
        <div className="p-10 max-w-5xl mx-auto w-full">
          <h1 className="text-4xl font-bold mb-3 font-serif text-gray-900">Video Call</h1>
          <p className="text-gray-500 mb-10 text-lg">Start a call with a friend. Use fun effects & filters! ✨</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {friends.map(friend => (
              <div key={friend.id} className="bg-white p-8 rounded-[2rem] text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <img src={friend.avatar_url || `https://ui-avatars.com/api/?name=${friend.username}&background=f3f4f6&color=4b5563`} className="w-24 h-24 rounded-full mx-auto mb-6 border-4 border-gray-50 shadow-sm" alt="avatar" />
                <h3 className="font-bold text-xl mb-6 text-gray-900">{friend.username}</h3>
                <button onClick={() => startCall(friend)} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-sm">
                  <VideoIcon size={18} /> Call
                </button>
              </div>
            ))}
            {friends.length === 0 && <p className="col-span-full text-center text-gray-500 py-12 bg-white rounded-2xl border border-gray-100 border-dashed">Add some friends first to start video calling.</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCall;
