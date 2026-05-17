import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { Send, Video } from 'lucide-react';
import { Link } from 'react-router-dom';

const Chat = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [activeFriend, setActiveFriend] = useState(null);
  const [messages, setMessages] = useState({});
  const [inputMsg, setInputMsg] = useState('');
  const [ws, setWs] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    apiClient.get('/friends').then(res => setFriends(res.data));
    // Fetch initial online status
    apiClient.get('/chat/online').then(res => {
      setOnlineUsers(new Set(res.data.online_users));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const socket = new WebSocket(`${protocol}://${window.location.host}/ws/chat/${user.id}`);
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'status') {
        setOnlineUsers(prev => {
          const updated = new Set(prev);
          if (data.is_online) updated.add(data.user_id);
          else updated.delete(data.user_id);
          return updated;
        });
        return;
      }

      if (data.type === 'typing_start') {
        setTypingUsers(prev => new Set(prev).add(data.sender_id));
        return;
      }
      if (data.type === 'typing_stop') {
        setTypingUsers(prev => {
          const updated = new Set(prev);
          updated.delete(data.sender_id);
          return updated;
        });
        return;
      }
      
      if (data.type === 'chat') {
        const friendId = data.sender_id === user.id ? data.receiver_id : data.sender_id;
        setMessages(prev => ({
          ...prev,
          [friendId]: [...(prev[friendId] || []), data]
        }));
        // Clear typing indicator when message arrives
        setTypingUsers(prev => {
          const updated = new Set(prev);
          updated.delete(data.sender_id);
          return updated;
        });
      }
    };

    setWs(socket);
    return () => socket.close();
  }, [user]);

  useEffect(() => {
    if (activeFriend) {
      apiClient.get(`/chat/history/${activeFriend.id}`)
        .then(res => setMessages(prev => ({ ...prev, [activeFriend.id]: res.data })));
    }
  }, [activeFriend]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeFriend]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || !ws || !activeFriend) return;
    ws.send(JSON.stringify({ receiver_id: activeFriend.id, content: inputMsg, type: 'chat' }));
    // Send typing stop
    ws.send(JSON.stringify({ receiver_id: activeFriend.id, type: 'typing_stop' }));
    setInputMsg('');
  };

  const handleInputChange = (e) => {
    setInputMsg(e.target.value);
    if (ws && activeFriend) {
      ws.send(JSON.stringify({ receiver_id: activeFriend.id, type: 'typing_start' }));
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        ws.send(JSON.stringify({ receiver_id: activeFriend.id, type: 'typing_stop' }));
      }, 2000);
    }
  };

  const currentMsgs = activeFriend ? (messages[activeFriend.id] || []) : [];

  return (
    <div className="flex h-full animate-fade-in" style={{ padding: '0' }}>
      {/* Conversation List */}
      <div className="w-80 border-r border-gray-200 flex flex-col bg-white h-full z-10">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold font-serif">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {friends.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">Add some friends to start chatting!</div>
          ) : (
            friends.map(friend => {
              const lastMsg = (messages[friend.id] || []).slice(-1)[0];
              const isOnline = onlineUsers.has(friend.id);
              return (
                <div 
                  key={friend.id}
                  onClick={() => setActiveFriend(friend)}
                  className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${activeFriend?.id === friend.id ? 'bg-purple-50 border-r-2 border-purple-600' : 'hover:bg-gray-50'}`}
                >
                  <div className="relative">
                    <img src={friend.avatar_url || `https://ui-avatars.com/api/?name=${friend.username}&background=f3f4f6&color=4b5563`} className="w-12 h-12 rounded-full border border-gray-200 shadow-sm" alt="avatar" />
                    <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${isOnline ? 'bg-green-400' : 'bg-gray-300'}`}></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold truncate ${activeFriend?.id === friend.id ? 'text-purple-900' : 'text-gray-900'}`}>{friend.username}</h4>
                    <p className="text-xs text-gray-400 truncate">
                      {typingUsers.has(friend.id) ? (
                        <span className="text-purple-500 italic">typing...</span>
                      ) : lastMsg ? (
                        lastMsg.content.slice(0, 30) + (lastMsg.content.length > 30 ? '...' : '')
                      ) : (
                        isOnline ? 'Online' : 'Offline'
                      )}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col relative bg-[#FAFAFA]">
        {activeFriend ? (
          <>
            {/* Header */}
            <div className="bg-white p-4 flex items-center justify-between border-b border-gray-100 z-10 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={activeFriend.avatar_url || `https://ui-avatars.com/api/?name=${activeFriend.username}&background=f3f4f6&color=4b5563`} className="w-10 h-10 rounded-full shadow-sm border border-gray-200" alt="avatar" />
                  <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${onlineUsers.has(activeFriend.id) ? 'bg-green-400' : 'bg-gray-300'}`}></span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{activeFriend.username}</h3>
                  <p className="text-xs text-gray-400">
                    {typingUsers.has(activeFriend.id) ? (
                      <span className="text-purple-500">typing...</span>
                    ) : onlineUsers.has(activeFriend.id) ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              <Link to="/video" className="p-2 bg-purple-50 text-purple-600 rounded-full hover:bg-purple-100 transition-colors">
                <Video size={20} />
              </Link>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {currentMsgs.map((msg, idx) => {
                const isMe = msg.sender_id === user.id;
                return (
                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${isMe ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-white border border-gray-100 rounded-tl-none text-gray-800'}`}>
                      <p className="text-sm">{msg.content}</p>
                      <span className={`text-[10px] mt-1 block text-right ${isMe ? 'text-purple-200' : 'text-gray-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              {typingUsers.has(activeFriend?.id) && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-100 shadow-sm">
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-50 border-gray-200 rounded-full px-6 focus:border-purple-500 focus:bg-white transition-colors"
                  value={inputMsg}
                  onChange={handleInputChange}
                />
                <button type="submit" className="btn btn-primary rounded-full px-5 aspect-square p-0 flex items-center justify-center">
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
