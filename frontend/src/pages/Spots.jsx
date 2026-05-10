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
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Hangout Spots</h1>
        <p className="text-secondary">Curated places based on your interests.</p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {spots.map((spot, idx) => (
            <div key={idx} className="glass rounded-xl overflow-hidden group hover:scale-[1.02] transition-transform">
              <div className="h-40 bg-gray-800 relative">
                {/* Placeholder Image */}
                <img 
                  src={`https://source.unsplash.com/600x400/?${spot.category},place`} 
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80'; }}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  alt={spot.name} 
                />
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white">
                  {spot.category.replace('_', ' ')}
                </div>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg leading-tight w-4/5">{spot.name}</h3>
                  <div className="flex items-center text-yellow-400 text-sm font-bold bg-yellow-400/10 px-2 py-1 rounded">
                    <Star size={14} className="mr-1 fill-current" />
                    {spot.rating}
                  </div>
                </div>
                
                <p className="text-sm text-secondary mb-4 flex items-start gap-1 h-10">
                  <MapPin size={16} className="shrink-0 mt-0.5 text-gray-500" />
                  <span className="line-clamp-2">{spot.address || 'Address unavailable'}</span>
                </p>

                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn bg-white/5 hover:bg-white/10 text-white w-full text-sm"
                >
                  <Navigation size={16} className="text-accent-secondary" /> Get Directions
                </a>
              </div>
            </div>
          ))}
          {spots.length === 0 && <p className="col-span-full text-center text-secondary py-10">No spots found nearby matching your preferences.</p>}
        </div>
      )}
    </div>
  );
};

export default Spots;
