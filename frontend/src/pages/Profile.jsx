import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { Camera, ShieldCheck, Lock, Globe, Plus, X } from 'lucide-react';

const INTEREST_CATEGORIES = {
  "Food & Dining": ["restaurant", "cafe", "pizza", "fine_dining", "fast_food", "coffee"],
  "Gaming": ["video_games", "arcade", "pc", "board_games"],
  "Sports & Fitness": ["gym", "soccer", "basketball", "tennis"],
  "Movies & Entertainment": ["cinema", "theatre", "netflix"],
  "Music": ["live_music", "rock", "pop", "classical"],
  "Travel & Adventure": ["park", "attraction", "hiking", "beach"]
};

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('photos');
  const [selectedPrefs, setSelectedPrefs] = useState([]);
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  
  useEffect(() => {
    if (user) {
      setSelectedPrefs(user.preferences || []);
      setBio(user.bio || '');
      setPhone(user.phone || '');
      setCity(user.location_city || '');
      setIsPrivate(user.is_private || false);
    }
  }, [user]);

  const handleAddPreference = async (category, subcategories) => {
    try {
      await apiClient.post('/users/me/preferences', { category, subcategories, weight: 1.0 });
      await refreshUser();
      alert('Preference saved!');
    } catch (e) { console.error(e); }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await apiClient.put('/users/me/profile', { bio, phone, location_city: city, is_private: isPrivate });
      await refreshUser();
      alert('Profile updated!');
    } catch (e) { console.error(e); alert('Failed to update.'); }
    finally { setSaving(false); }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      await apiClient.post('/users/me/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await refreshUser();
    } catch (err) {
      alert(err.response?.data?.detail || 'Upload failed.');
    }
  };

  const tabs = ['photos', 'interests', 'settings'];

  return (
    <div className="page-container animate-fade-in">
      {/* Profile Header */}
      <header className="mb-8 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-50 rounded-full blur-3xl opacity-60 -mt-10 -mr-10"></div>
        <div className="relative z-10 flex items-center gap-6">
          <div className="relative group">
            <img 
              src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.username}&background=f3f4f6&color=4b5563`} 
              alt="Avatar" 
              className="w-28 h-28 rounded-full border-4 border-purple-100 object-cover shadow-sm"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-9 h-9 bg-purple-600 hover:bg-purple-700 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
            >
              <Camera size={16} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold font-serif text-gray-900">{user?.username}</h1>
              {user?.is_verified && (
                <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center" title="Verified">
                  <ShieldCheck size={14} className="text-white" />
                </div>
              )}
              {user?.is_private ? (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full flex items-center gap-1 ml-2"><Lock size={10} /> Private</span>
              ) : (
                <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full flex items-center gap-1 ml-2"><Globe size={10} /> Public</span>
              )}
            </div>
            <p className="text-gray-500 font-medium">{user?.email}</p>
            {user?.location_city && <p className="text-sm text-gray-400 mt-1">📍 {user.location_city}</p>}
            <p className="mt-2 text-sm max-w-md text-gray-600 leading-relaxed">{user?.bio || "No bio added yet."}</p>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="flex gap-6 border-b border-gray-200 mb-8 px-2">
        {tabs.map(tab => (
          <button 
            key={tab}
            className={`pb-3 px-2 transition-colors capitalize ${activeTab === tab ? 'border-b-2 border-purple-600 text-purple-600 font-bold' : 'text-gray-500 hover:text-gray-800 font-medium'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Photos Tab */}
      {activeTab === 'photos' && (
        <div>
          <h2 className="text-2xl mb-2 font-bold font-serif text-gray-900">My Photos</h2>
          <p className="text-gray-500 mb-8 text-sm">Add photos to your profile. The first photo becomes your avatar.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(user?.photos || []).map((photo, idx) => (
              <div key={idx} className="aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm group relative">
                <img src={photo} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
            ))}
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 hover:border-purple-300 hover:bg-purple-50 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-purple-500 transition-all cursor-pointer"
            >
              <Plus size={32} />
              <span className="text-sm font-medium">Add Photo</span>
            </button>
          </div>
        </div>
      )}

      {/* Interests Tab */}
      {activeTab === 'interests' && (
        <div>
          <h2 className="text-2xl mb-2 font-bold font-serif text-gray-900">Select your interests</h2>
          <p className="text-gray-500 mb-8 text-sm">We use these to match you with like-minded friends and recommend cool hangout spots.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(INTEREST_CATEGORIES).map(([cat, subs]) => (
              <div key={cat} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold mb-4 border-b border-gray-100 pb-3 text-gray-900">{cat}</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  {subs.map(sub => {
                    const isSelected = selectedPrefs.some(p => p.category === cat && p.subcategories.includes(sub));
                    return (
                      <span 
                        key={sub}
                        className={`px-4 py-2 rounded-full text-xs font-medium cursor-pointer border transition-all ${isSelected ? 'bg-purple-600 border-purple-600 text-white shadow-md transform scale-105' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-purple-300 hover:bg-purple-50'}`}
                      >
                        {sub.replace('_', ' ')}
                      </span>
                    );
                  })}
                </div>
                <button 
                  onClick={() => handleAddPreference(cat, subs.slice(0, 2))} 
                  className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-xl border border-gray-200 transition-colors text-sm"
                >
                  Save {cat} preferences
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="max-w-lg">
          <h2 className="text-2xl mb-2 font-bold font-serif text-gray-900">Profile Settings</h2>
          <p className="text-gray-500 mb-8 text-sm">Update your personal details and privacy preferences.</p>
          
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Bio</label>
              <textarea 
                rows={3} 
                placeholder="Tell others about yourself..." 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-sm"
              ></textarea>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Phone Number</label>
              <input 
                type="tel" 
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">City</label>
              <input 
                type="text" 
                placeholder="San Francisco, CA"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-sm"
              />
            </div>

            {/* Privacy Toggle */}
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    {isPrivate ? <Lock size={16} /> : <Globe size={16} />}
                    Profile Privacy
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {isPrivate ? "Only friends can see your profile and location." : "Anyone can discover you and see your location on the map."}
                  </p>
                </div>
                <button
                  onClick={() => setIsPrivate(!isPrivate)}
                  className={`relative w-14 h-7 rounded-full transition-colors ${isPrivate ? 'bg-purple-600' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${isPrivate ? 'translate-x-7' : 'translate-x-0.5'}`}></span>
                </button>
              </div>
            </div>

            <button 
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
