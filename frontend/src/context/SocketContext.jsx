import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';

const SocketContext = createContext();
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [chatSocket, setChatSocket] = useState(null);
  const [videoSocket, setVideoSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [incomingCall, setIncomingCall] = useState(null);
  const [videoSignals, setVideoSignals] = useState([]);

  useEffect(() => {
    if (!user) {
      if (chatSocket) chatSocket.close();
      if (videoSocket) videoSocket.close();
      return;
    }

    // Connect Chat WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // When using Vite dev server, window.location.host is localhost:5173, and proxy handles /ws.
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const cs = new WebSocket(`${wsUrl}/chat/${user.id}`);
    
    cs.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages(prev => [...prev, data]);
    };

    setChatSocket(cs);

    // Connect Video WebSocket
    const vs = new WebSocket(`${wsUrl}/video/${user.id}`);
    
    vs.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'offer') {
        setIncomingCall(data);
      }
      setVideoSignals(prev => [...prev, data]);
    };

    setVideoSocket(vs);

    return () => {
      cs.close();
      vs.close();
    };
  }, [user]);

  const sendChatMessage = (receiverId, content) => {
    if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
      chatSocket.send(JSON.stringify({
        receiver_id: receiverId,
        content: content
      }));
    }
  };

  const sendVideoSignal = (targetId, signalData) => {
    if (videoSocket && videoSocket.readyState === WebSocket.OPEN) {
      videoSocket.send(JSON.stringify({
        target_id: targetId,
        ...signalData
      }));
    }
  };

  return (
    <SocketContext.Provider value={{ 
      chatSocket, 
      videoSocket, 
      messages, 
      sendChatMessage,
      sendVideoSignal,
      incomingCall,
      setIncomingCall,
      videoSignals
    }}>
      {children}
    </SocketContext.Provider>
  );
};
