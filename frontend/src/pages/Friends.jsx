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
        <h1 className="text-3xl font-bold mb-2 font-serif text-gray-900">Network</h1>
        <div className="flex gap-4 border-b border-gray-200 mt-6">
          <button onClick={() => setTab('discover')} className={`pb-2 px-1 ${tab === 'discover' ? 'border-b-2 border-purple-600 text-purple-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>Discover Matches</button>
          <button onClick={() => setTab('friends')} className={`pb-2 px-1 ${tab === 'friends' ? 'border-b-2 border-purple-600 text-purple-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>My Friends</button>
          <button onClick={() => setTab('requests')} className={`pb-2 px-1 ${tab === 'requests' ? 'border-b-2 border-purple-600 text-purple-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>Requests</button>
        </div>
      </header>

      {tab === 'discover' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {discover.map((match) => (
            <div key={match.user.id} className="bg-white border border-gray-100 shadow-sm p-6 rounded-2xl flex flex-col items-center text-center relative overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-md">
              <div className="absolute top-0 right-0 bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-bl-xl border-b border-l border-purple-200">
                {match.match_percentage}% Match
              </div>
              <img src={match.user.avatar_url || `https://ui-avatars.com/api/?name=${match.user.username}&background=f3f4f6&color=4b5563`} className="w-24 h-24 rounded-full mb-4 mt-4 border-4 border-white shadow-sm" alt="avatar" />
              <h3 className="font-bold text-xl text-gray-900">{match.user.username}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-4 mt-1">{match.user.bio || "No bio yet."}</p>
              
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {match.shared_interests.slice(0,3).map(interest => (
                  <span key={interest} className="text-[10px] bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full text-gray-600 font-medium tracking-wide uppercase">
                    {interest.replace('_', ' ')}
                  </span>
                ))}
                {match.shared_interests.length > 3 && <span className="text-[10px] text-gray-400 font-medium">+{match.shared_interests.length-3}</span>}
              </div>
              
              <button onClick={() => sendRequest(match.user.id)} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 mt-auto shadow-sm">
                <UserPlus size={16} /> Add Friend
              </button>
            </div>
          ))}
          {discover.length === 0 && <p className="col-span-full text-center text-gray-500 py-10 bg-white rounded-2xl border border-gray-100 border-dashed">No matches found right now. Update your preferences!</p>}
        </div>
      )}

      {tab === 'friends' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {friends.map((friend) => (
            <div key={friend.id} className="bg-white border border-gray-100 shadow-sm p-4 rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow">
              <img src={friend.avatar_url || `https://ui-avatars.com/api/?name=${friend.username}&background=f3f4f6&color=4b5563`} className="w-14 h-14 rounded-full border border-gray-200" alt="avatar" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 truncate">{friend.username}</h3>
                <p className="text-xs text-gray-500 truncate">{friend.bio || "Available"}</p>
              </div>
              <Link to="/chat" className="p-3 bg-purple-50 hover:bg-purple-100 rounded-full text-purple-600 transition-colors">
                <MessageCircle size={20} />
              </Link>
            </div>
          ))}
          {friends.length === 0 && <p className="col-span-full text-center text-gray-500 py-10 bg-white rounded-2xl border border-gray-100 border-dashed">You haven't added any friends yet.</p>}
        </div>
      )}

      {tab === 'requests' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((req) => (
            <div key={req.request_id} className="bg-white border border-gray-100 shadow-sm p-4 rounded-2xl flex items-center gap-4">
              <img src={req.user.avatar_url || `https://ui-avatars.com/api/?name=${req.user.username}&background=f3f4f6&color=4b5563`} className="w-12 h-12 rounded-full border border-gray-200" alt="avatar" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 truncate">{req.user.username}</h3>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleRequest(req.request_id, 'accept')} className="p-2 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition-colors shadow-sm">
                  <Check size={18} />
                </button>
                <button onClick={() => handleRequest(req.request_id, 'reject')} className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors shadow-sm">
                  <X size={18} />
                </button>
              </div>
            </div>
          ))}
          {requests.length === 0 && <p className="col-span-full text-center text-gray-500 py-10 bg-white rounded-2xl border border-gray-100 border-dashed">No pending requests.</p>}
        </div>
      )}
    </div>
  );
};

export default Friends;
