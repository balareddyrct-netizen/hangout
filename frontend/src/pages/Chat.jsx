import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import apiClient from '../api/client';
import { Send, Video } from 'lucide-react';
import { Link } from 'react-router-dom';

const Chat = () => {
  const { user } = useAuth();
  const { messages, sendChatMessage } = useSocket();
  const [friends, setFriends] = useState([]);
  const [activeFriend, setActiveFriend] = useState(null);
  const [history, setHistory] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await apiClient.get('/friends');
        setFriends(res.data);
        if (res.data.length > 0) setActiveFriend(res.data[0]);
      } catch (e) {
        console.error(e);
      }
    };
    fetchFriends();
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!activeFriend) return;
      try {
        const res = await apiClient.get(`/chat/history/${activeFriend.id}`);
        setHistory(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchHistory();
  }, [activeFriend]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || !activeFriend) return;
    
    sendChatMessage(activeFriend.id, inputMsg);
    setInputMsg('');
  };

  const getFilteredMessages = () => {
    if (!activeFriend) return [];
    
    // Combine DB history and real-time socket messages
    const socketMsgs = messages.filter(m => 
      (m.sender_id === user.id && m.receiver_id === activeFriend.id) ||
      (m.sender_id === activeFriend.id && m.receiver_id === user.id)
    );
    
    // Simple deduplication based on ID (if real app) or just concat for demo
    // We assume backend saves first, returns ID, then broadcasts
    const existingIds = new Set(history.map(m => m.id));
    const newMsgs = socketMsgs.filter(m => !existingIds.has(m.id));
    
    return [...history, ...newMsgs];
  };

  const currentMsgs = getFilteredMessages();

  return (
    <div className="flex h-full animate-fade-in" style={{ padding: '0' }}>
      {/* Conversation List */}
      <div className="w-80 border-r border-white/10 flex flex-col glass h-full">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-xl font-bold">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {friends.length === 0 ? (
            <div className="p-4 text-center text-secondary text-sm">Add some friends to start chatting!</div>
          ) : (
            friends.map(friend => (
              <div 
                key={friend.id}
                onClick={() => setActiveFriend(friend)}
                className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${activeFriend?.id === friend.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
              >
                <img src={friend.avatar_url || `https://ui-avatars.com/api/?name=${friend.username}`} className="w-12 h-12 rounded-full" alt="avatar" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white truncate">{friend.username}</h4>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col relative bg-bg-darker">
        {activeFriend ? (
          <>
            {/* Header */}
            <div className="glass p-4 flex items-center justify-between border-b border-white/10 z-10">
              <div className="flex items-center gap-3">
                <img src={activeFriend.avatar_url || `https://ui-avatars.com/api/?name=${activeFriend.username}`} className="w-10 h-10 rounded-full" alt="avatar" />
                <div>
                  <h3 className="font-bold">{activeFriend.username}</h3>
                </div>
              </div>
              <Link to="/video" className="p-2 bg-accent-primary/20 text-accent-primary rounded-full hover:bg-accent-primary/40 transition-colors">
                <Video size={20} />
              </Link>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {currentMsgs.map((msg, idx) => {
                const isMe = msg.sender_id === user.id;
                return (
                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMe ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white rounded-tr-none' : 'glass rounded-tl-none text-gray-200'}`}>
                      <p className="text-sm">{msg.content}</p>
                      <span className="text-[10px] opacity-60 mt-1 block text-right">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 glass border-t border-white/10">
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 bg-black/30 border-white/10 rounded-full px-6 focus:border-accent-primary"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                />
                <button type="submit" className="btn btn-primary rounded-full px-5 aspect-square p-0 flex items-center justify-center">
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-secondary">
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
