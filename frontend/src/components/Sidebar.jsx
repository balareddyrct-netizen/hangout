import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, Users, MessageCircle, Video, 
  Map, MapPin, User, LogOut 
} from 'lucide-react';

const Sidebar = () => {
  const { logout, user } = useAuth();

  const navItems = [
    { path: '/', name: 'Home', icon: Home },
    { path: '/friends', name: 'Friends', icon: Users },
    { path: '/chat', name: 'Chat', icon: MessageCircle },
    { path: '/video', name: 'Video Call', icon: Video },
    { path: '/map', name: 'Snap Map', icon: Map },
    { path: '/spots', name: 'Hangout Spots', icon: MapPin },
    { path: '/profile', name: 'Profile', icon: User },
  ];

  return (
    <aside className="glass flex-col justify-between" style={{ width: 'var(--sidebar-width)', padding: '2rem 1rem' }}>
      <div>
        <div className="flex items-center gap-3 mb-10 px-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
            H
          </div>
          <h2 className="text-2xl font-bold text-gradient tracking-tight">Hangout</h2>
        </div>

        <nav className="flex-col gap-2 flex">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-white/10 text-white font-medium shadow-sm' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`
              }
            >
              <item.icon size={20} className="shrink-0" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto pt-6 border-t border-white/10 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <img 
              src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.username}&background=random`} 
              alt="Avatar" 
              className="w-10 h-10 rounded-full object-cover border border-white/20 shrink-0"
            />
            <div className="truncate">
              <p className="text-sm font-medium text-white truncate">{user?.username}</p>
              <p className="text-xs text-gray-400 truncate w-24">Online</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="text-gray-400 hover:text-red-400 transition-colors p-2"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
