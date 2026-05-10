import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { MessageCircle, UserPlus, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const Friends = () => {
  const [tab, setTab] = useState('discover'); // discover, friends, requests
  const [discover, setDiscover] = useState([]);
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchData();
  }, [tab]);

  const fetchData = async () => {
    try {
      if (tab === 'discover') {
        const res = await apiClient.get('/friends/discover');
        setDiscover(res.data);
      } else if (tab === 'friends') {
        const res = await apiClient.get('/friends');
        setFriends(res.data);
      } else if (tab === 'requests') {
        const res = await apiClient.get('/friends/requests');
        setRequests(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const sendRequest = async (userId) => {
    try {
      await apiClient.post(`/friends/request/${userId}`);
      alert("Friend request sent!");
      fetchData();
    } catch (e) {
      alert("Error: " + e.response?.data?.detail);
    }
  };

  const handleRequest = async (reqId, action) => {
    try {
      await apiClient.put(`/friends/request/${reqId}?action=${action}`);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <header className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Network</h1>
        <div className="flex gap-4 border-b border-white/10 mt-6">
          <button onClick={() => setTab('discover')} className={`pb-2 px-1 ${tab === 'discover' ? 'border-b-2 border-accent-primary text-white' : 'text-gray-400'}`}>Discover Matches</button>
          <button onClick={() => setTab('friends')} className={`pb-2 px-1 ${tab === 'friends' ? 'border-b-2 border-accent-primary text-white' : 'text-gray-400'}`}>My Friends</button>
          <button onClick={() => setTab('requests')} className={`pb-2 px-1 ${tab === 'requests' ? 'border-b-2 border-accent-primary text-white' : 'text-gray-400'}`}>Requests</button>
        </div>
      </header>

      {tab === 'discover' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {discover.map((match) => (
            <div key={match.user.id} className="glass p-5 rounded-xl flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-accent-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                {match.match_percentage}% Match
              </div>
              <img src={match.user.avatar_url || `https://ui-avatars.com/api/?name=${match.user.username}`} className="w-20 h-20 rounded-full mb-3 mt-4 border-2 border-white/10" alt="avatar" />
              <h3 className="font-bold text-lg">{match.user.username}</h3>
              <p className="text-sm text-secondary line-clamp-2 mb-3">{match.user.bio}</p>
              
              <div className="flex flex-wrap justify-center gap-1 mb-4">
                {match.shared_interests.slice(0,3).map(interest => (
                  <span key={interest} className="text-[10px] bg-white/10 px-2 py-1 rounded-full text-cyan-300">
                    {interest.replace('_', ' ')}
                  </span>
                ))}
                {match.shared_interests.length > 3 && <span className="text-[10px] text-gray-500">+{match.shared_interests.length-3}</span>}
              </div>
              
              <button onClick={() => sendRequest(match.user.id)} className="btn btn-primary w-full mt-auto py-2 text-sm">
                <UserPlus size={16} /> Add Friend
              </button>
            </div>
          ))}
          {discover.length === 0 && <p className="col-span-full text-center text-secondary py-10">No matches found right now. Update your preferences!</p>}
        </div>
      )}

      {tab === 'friends' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {friends.map((friend) => (
            <div key={friend.id} className="glass p-5 rounded-xl flex items-center gap-4">
              <img src={friend.avatar_url || `https://ui-avatars.com/api/?name=${friend.username}`} className="w-16 h-16 rounded-full border border-white/10" alt="avatar" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold truncate">{friend.username}</h3>
                <p className="text-xs text-secondary truncate">{friend.bio}</p>
              </div>
              <Link to="/chat" className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-accent-secondary transition-colors">
                <MessageCircle size={20} />
              </Link>
            </div>
          ))}
          {friends.length === 0 && <p className="col-span-full text-center text-secondary py-10">You haven't added any friends yet.</p>}
        </div>
      )}

      {tab === 'requests' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((req) => (
            <div key={req.request_id} className="glass p-5 rounded-xl flex items-center gap-4">
              <img src={req.user.avatar_url || `https://ui-avatars.com/api/?name=${req.user.username}`} className="w-12 h-12 rounded-full" alt="avatar" />
              <div className="flex-1">
                <h3 className="font-bold">{req.user.username}</h3>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleRequest(req.request_id, 'accept')} className="p-2 bg-success/20 text-success rounded-full hover:bg-success/30">
                  <Check size={18} />
                </button>
                <button onClick={() => handleRequest(req.request_id, 'reject')} className="p-2 bg-danger/20 text-danger rounded-full hover:bg-danger/30">
                  <X size={18} />
                </button>
              </div>
            </div>
          ))}
          {requests.length === 0 && <p className="col-span-full text-center text-secondary py-10">No pending requests.</p>}
        </div>
      )}
    </div>
  );
};

export default Friends;
