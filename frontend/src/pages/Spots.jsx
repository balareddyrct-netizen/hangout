import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { MapPin, Navigation, Star } from 'lucide-react';

const Spots = () => {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setLocation({ lat, lon });
          fetchSpots(lat, lon);
        },
        (err) => {
          console.warn("Geolocation denied, using default coordinates (NY)", err);
          fetchSpots(40.7128, -74.0060);
        }
      );
    } else {
      fetchSpots(40.7128, -74.0060);
    }
  }, []);

  const fetchSpots = async (lat, lon) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/spots/recommend?lat=${lat}&lon=${lon}&radius=5000`);
      setSpots(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <header className="mb-8 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold mb-2 font-serif text-gray-900">Hangout Spots</h1>
        <p className="text-gray-500 font-medium">Curated places based on your interests.</p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {spots.map((spot, idx) => (
            <div key={idx} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group hover:scale-[1.02] transition-transform hover:shadow-md">
              <div className="h-48 bg-gray-100 relative">
                {/* Placeholder Image */}
                <img 
                  src={`https://source.unsplash.com/600x400/?${spot.category},place`} 
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80'; }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  alt={spot.name} 
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-purple-700 shadow-sm border border-white/20">
                  {spot.category.replace('_', ' ')}
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-xl leading-tight w-4/5 text-gray-900">{spot.name}</h3>
                  <div className="flex items-center text-yellow-500 text-sm font-bold bg-yellow-50 px-2 py-1 rounded-lg">
                    <Star size={14} className="mr-1 fill-current" />
                    {spot.rating}
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 mb-6 flex items-start gap-2 h-10">
                  <MapPin size={16} className="shrink-0 mt-0.5 text-purple-400" />
                  <span className="line-clamp-2 leading-relaxed">{spot.address || 'Address unavailable'}</span>
                </p>

                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-gray-50 hover:bg-purple-50 text-purple-600 border border-gray-200 hover:border-purple-200 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Navigation size={16} /> Get Directions
                </a>
              </div>
            </div>
          ))}
          {spots.length === 0 && <p className="col-span-full text-center text-gray-500 py-12 bg-white rounded-2xl border border-gray-100 border-dashed">No spots found nearby matching your preferences.</p>}
        </div>
      )}
    </div>
  );
};

export default Spots;
