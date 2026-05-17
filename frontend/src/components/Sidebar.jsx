import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Users, Map, MapPin, MessageCircle, Video, LogOut, User as UserIcon } from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm relative z-20">
      <div className="p-6 pb-2">
        <h1 className="text-3xl font-bold text-gradient font-serif tracking-tight">Hangout</h1>
      </div>

      <nav className="flex-1 px-4 py-6 flex flex-col gap-2">
        <NavLink to="/" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Home size={20} /> Home
        </NavLink>
        <NavLink to="/friends" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Users size={20} /> Network
        </NavLink>
        <NavLink to="/chat" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <MessageCircle size={20} /> Messages
        </NavLink>
        <NavLink to="/video" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Video size={20} /> Video Call
        </NavLink>
        <NavLink to="/map" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Map size={20} /> Snap Map
        </NavLink>
        <NavLink to="/spots" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <MapPin size={20} /> Spots
        </NavLink>
      </nav>

      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <NavLink to="/profile" className="flex items-center gap-3 p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all cursor-pointer mb-3">
          <img 
            src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.username}&background=f3f4f6&color=4b5563`} 
            alt="avatar" 
            className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-200"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate text-gray-900">{user?.username}</h4>
            <p className="text-xs text-gray-500 truncate">View Profile</p>
          </div>
        </NavLink>
        
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors text-sm font-medium">
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
