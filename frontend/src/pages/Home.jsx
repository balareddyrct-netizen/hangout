import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { MapPin, Users, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ friends: 0, pending: 0, matches: 0 });

  useEffect(() => {
    // Quick fetches for dashboard
    const fetchStats = async () => {
      try {
        const [friendsRes, requestsRes, matchesRes] = await Promise.all([
          apiClient.get('/friends'),
          apiClient.get('/friends/requests'),
          apiClient.get('/friends/discover')
        ]);
        setStats({
          friends: friendsRes.data.length,
          pending: requestsRes.data.length,
          matches: matchesRes.data.length
        });
      } catch (e) {
        console.error("Error fetching stats", e);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="page-container animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.username}! 👋</h1>
        <p className="text-secondary">Here's what's happening in your network.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Link to="/friends" className="glass p-6 rounded-xl hover:scale-[1.02] transition-transform">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 text-purple-400 rounded-lg">
              <Users size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.friends}</p>
              <p className="text-sm text-secondary">Active Friends</p>
            </div>
          </div>
        </Link>
        
        <Link to="/friends" className="glass p-6 rounded-xl hover:scale-[1.02] transition-transform">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-pink-500/20 text-pink-400 rounded-lg">
              <Heart size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.matches}</p>
              <p className="text-sm text-secondary">New Matches</p>
            </div>
          </div>
        </Link>

        <Link to="/spots" className="glass p-6 rounded-xl hover:scale-[1.02] transition-transform">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-lg">
              <MapPin size={24} />
            </div>
            <div>
              <p className="text-xl font-bold">Discover Spots</p>
              <p className="text-sm text-secondary">Based on your taste</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Preferences Warning */}
      {(!user?.preferences || user.preferences.length === 0) && (
        <div className="bg-yellow-500/10 border border-yellow-500/50 p-6 rounded-xl mb-8 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-yellow-500 mb-1">Update Your Preferences</h3>
            <p className="text-sm text-secondary">We noticed you haven't set any interests. Add them to get better matches and spot recommendations.</p>
          </div>
          <Link to="/profile" className="btn bg-yellow-500 text-black hover:bg-yellow-400">
            Go to Profile
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link to="/map" className="btn btn-primary">
            <MapPin size={18} /> View Snap Map
          </Link>
          <Link to="/chat" className="btn btn-secondary">
            Open Messages
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
