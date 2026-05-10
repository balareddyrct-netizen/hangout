import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

const INTEREST_CATEGORIES = {
  "Food & Dining": ["restaurant", "cafe", "pizza", "fine_dining", "fast_food", "coffee"],
  "Gaming": ["video_games", "arcade", "pc", "board_games"],
  "Sports & Fitness": ["gym", "soccer", "basketball", "tennis"],
  "Movies & Entertainment": ["cinema", "theatre", "netflix"],
  "Music": ["live_music", "rock", "pop", "classical"],
  "Travel & Adventure": ["park", "attraction", "hiking", "beach"]
};

const Profile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('preferences');
  const [selectedPrefs, setSelectedPrefs] = useState([]);
  
  useEffect(() => {
    if (user?.preferences) {
      setSelectedPrefs(user.preferences);
    }
  }, [user]);

  const handleAddPreference = async (category, subcategories) => {
    try {
      await apiClient.post('/users/me/preferences', {
        category,
        subcategories,
        weight: 1.0
      });
      alert('Preference saved!');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <header className="mb-8 flex items-center gap-6">
        <img 
          src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.username}`} 
          alt="Avatar" 
          className="w-24 h-24 rounded-full border-4 border-accent-primary object-cover"
        />
        <div>
          <h1 className="text-3xl font-bold">{user?.username}</h1>
          <p className="text-secondary">{user?.email}</p>
          <p className="mt-2 text-sm max-w-md">{user?.bio || "No bio added yet."}</p>
        </div>
      </header>

      <div className="flex gap-4 border-b border-white/10 mb-6">
        <button 
          className={`pb-2 px-1 ${activeTab === 'preferences' ? 'border-b-2 border-accent-primary text-white font-medium' : 'text-gray-400'}`}
          onClick={() => setActiveTab('preferences')}
        >
          My Interests
        </button>
        <button 
          className={`pb-2 px-1 ${activeTab === 'edit' ? 'border-b-2 border-accent-primary text-white font-medium' : 'text-gray-400'}`}
          onClick={() => setActiveTab('edit')}
        >
          Edit Profile
        </button>
      </div>

      {activeTab === 'preferences' && (
        <div>
          <h2 className="text-xl mb-4 font-semibold">Select your interests</h2>
          <p className="text-secondary mb-6 text-sm">We use these to match you with like-minded friends and recommend cool hangout spots.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(INTEREST_CATEGORIES).map(([cat, subs]) => (
              <div key={cat} className="glass p-4 rounded-xl">
                <h3 className="font-semibold mb-3 border-b border-white/5 pb-2 text-accent-secondary">{cat}</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {subs.map(sub => {
                    const isSelected = selectedPrefs.some(p => p.category === cat && p.subcategories.includes(sub));
                    return (
                      <span 
                        key={sub}
                        className={`px-3 py-1 rounded-full text-xs cursor-pointer border ${isSelected ? 'bg-accent-primary/20 border-accent-primary text-white' : 'border-white/20 text-gray-400 hover:border-white/50'}`}
                      >
                        {sub.replace('_', ' ')}
                      </span>
                    );
                  })}
                </div>
                <button 
                  onClick={() => handleAddPreference(cat, subs.slice(0, 2))} // Simplified for demo
                  className="btn btn-secondary text-xs w-full"
                >
                  Save {cat} preferences
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'edit' && (
        <div className="glass p-6 rounded-xl max-w-lg">
           <form className="flex-col gap-4 flex">
              <div>
                <label className="text-sm text-secondary mb-1 block">Bio</label>
                <textarea rows={3} placeholder="Tell others about yourself..." defaultValue={user?.bio}></textarea>
              </div>
              <button type="button" className="btn btn-primary mt-2">Update Profile</button>
           </form>
        </div>
      )}
    </div>
  );
};

export default Profile;
