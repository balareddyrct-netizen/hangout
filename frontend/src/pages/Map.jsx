import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

// Fix Leaflet's default icon path issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom component to handle map center updates
const ChangeView = ({ center }) => {
  const map = useMap();
  map.setView(center);
  return null;
};

const createAvatarIcon = (url, name) => {
  return L.divIcon({
    className: 'custom-avatar-marker',
    html: `
      <div style="
        width: 44px; height: 44px; 
        border-radius: 50%; 
        border: 3px solid #06b6d4;
        box-shadow: 0 4px 10px rgba(0,0,0,0.5);
        background-image: url('${url || `https://ui-avatars.com/api/?name=${name}`}');
        background-size: cover;
        background-position: center;
        position: relative;
      ">
        <div style="
          position: absolute; bottom: -12px; left: 50%; transform: translateX(-50%);
          width: 0; height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 10px solid #06b6d4;
        "></div>
      </div>
    `,
    iconSize: [44, 56],
    iconAnchor: [22, 56],
    popupAnchor: [0, -56]
  });
};

const MapPage = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [position, setPosition] = useState([40.7128, -74.0060]); // Default to NY
  const [hasLocation, setHasLocation] = useState(false);

  useEffect(() => {
    // Get user's location and update backend
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setPosition([lat, lon]);
          setHasLocation(true);
          try {
            await apiClient.put('/location/update', { latitude: lat, longitude: lon });
          } catch (e) {
            console.error("Failed to update location", e);
          }
        },
        (err) => console.warn(err)
      );
    }

    // Fetch friends locations
    const fetchFriends = async () => {
      try {
        const res = await apiClient.get('/location/friends');
        setFriends(res.data);
      } catch (e) {
        console.error(e);
      }
    };

    fetchFriends();
    // In a real app, we would use WebSocket or long polling for real-time map updates
    const interval = setInterval(fetchFriends, 15000); 
    return () => clearInterval(interval);
  }, []);

  // Use CartoDB Positron tiles for the light theme look
  const lightMapUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  return (
    <div className="h-full w-full relative animate-fade-in flex flex-col">
      <div className="absolute top-6 left-6 z-[1000] bg-white/90 backdrop-blur-md px-6 py-4 rounded-2xl shadow-md border border-gray-100 pointer-events-none">
        <h1 className="text-2xl font-bold font-serif text-gray-900">Snap Map</h1>
        <p className="text-sm text-gray-500 font-medium">See where your friends are hanging out.</p>
      </div>

      <div className="flex-1 w-full h-full bg-[#FAFAFA]">
        <MapContainer 
          center={position} 
          zoom={13} 
          style={{ height: '100%', width: '100%', zIndex: 1 }}
          zoomControl={false}
        >
          <ChangeView center={position} />
          <TileLayer
            url={lightMapUrl}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          {/* Current User Marker */}
          {hasLocation && (
            <Marker position={position} icon={createAvatarIcon(user?.avatar_url, user?.username)}>
              <Popup className="dark-popup">
                <div className="text-center p-1">
                  <h3 className="font-bold text-gray-800">You</h3>
                  <p className="text-xs text-gray-500">Just now</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Friends Markers */}
          {friends.map(friend => (
            <Marker 
              key={friend.id} 
              position={[friend.latitude, friend.longitude]} 
              icon={createAvatarIcon(friend.avatar_url, friend.username)}
            >
              <Popup className="light-popup">
                <div className="p-1 min-w-[150px]">
                  <div className="flex items-center gap-3 mb-3">
                    <img src={friend.avatar_url || `https://ui-avatars.com/api/?name=${friend.username}&background=f3f4f6&color=4b5563`} className="w-10 h-10 rounded-full border border-gray-200" alt="avatar" />
                    <div>
                      <h3 className="font-bold text-gray-900 leading-none">{friend.username}</h3>
                      <p className="text-xs text-gray-500 mt-1 font-medium">
                        Active {new Date(friend.last_seen).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                  <Link to={`/chat`} className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5 mt-2 shadow-sm">
                    <MessageCircle size={14} /> Message
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .leaflet-container {
          background-color: #FAFAFA;
          font-family: 'Inter', sans-serif;
        }
        .leaflet-popup-content-wrapper {
          background: #FFFFFF;
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          border: 1px solid #E5E7EB;
        }
        .leaflet-popup-tip {
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-top: none;
          border-left: none;
        }
      `}} />
    </div>
  );
};

export default MapPage;
