import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { MapPin, Users, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ friends: 0, pending: 0, matches: 0 });

  useEffect(() => {
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
    <div className="page-container animate-fade-in flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center">
      <div className="bg-white p-12 rounded-[2rem] shadow-sm border border-gray-100 w-full max-w-4xl relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-purple-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-pink-100 rounded-full blur-3xl opacity-50"></div>
        
        <div className="relative z-10">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl mx-auto flex items-center justify-center shadow-lg transform -rotate-6 mb-8">
            <span className="text-4xl text-white">✌️</span>
          </div>
          
          <h1 className="text-5xl font-bold mb-4 font-serif text-gray-900 tracking-tight">
            Welcome back, <span className="text-gradient">{user?.username}</span>
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-xl mx-auto font-light leading-relaxed">
            Your network is waiting. Discover new people, find the perfect hangout spot, and start connecting.
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 max-w-3xl mx-auto">
            <Link to="/friends" className="bg-gray-50 p-6 rounded-2xl hover:bg-purple-50 border border-transparent hover:border-purple-100 transition-all group">
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-white text-purple-600 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.friends}</p>
                  <p className="text-sm text-gray-500 font-medium">Active Friends</p>
                </div>
              </div>
            </Link>
            
            <Link to="/friends" className="bg-gray-50 p-6 rounded-2xl hover:bg-pink-50 border border-transparent hover:border-pink-100 transition-all group">
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-white text-pink-500 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                  <Heart size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.matches}</p>
                  <p className="text-sm text-gray-500 font-medium">New Matches</p>
                </div>
              </div>
            </Link>

            <Link to="/spots" className="bg-gray-50 p-6 rounded-2xl hover:bg-cyan-50 border border-transparent hover:border-cyan-100 transition-all group">
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-white text-cyan-500 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                  <MapPin size={24} />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">Spots</p>
                  <p className="text-sm text-gray-500 font-medium">For your taste</p>
                </div>
              </div>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/friends" className="btn btn-primary px-8 py-3 text-lg shadow-md">
              Find Matches
            </Link>
            <Link to="/map" className="btn btn-secondary px-8 py-3 text-lg">
              View Snap Map
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
