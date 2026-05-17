import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { ChevronRight, Utensils, Gamepad2, Dumbbell, Film, Music, Map as MapIcon } from 'lucide-react';

const QUIZ_QUESTIONS = [
  {
    id: 1,
    title: "What's your ideal Friday night?",
    category: "Food & Dining",
    options: [
      { id: "fine_dining", label: "Fancy Restaurant", icon: <Utensils size={24} /> },
      { id: "fast_food", label: "Late Night Bites", icon: <Utensils size={24} /> },
      { id: "cafe", label: "Cozy Cafe Vibes", icon: <Utensils size={24} /> }
    ]
  },
  {
    id: 2,
    title: "How do you stay active?",
    category: "Sports & Fitness",
    options: [
      { id: "gym", label: "Hitting the Gym", icon: <Dumbbell size={24} /> },
      { id: "soccer", label: "Team Sports", icon: <Dumbbell size={24} /> },
      { id: "hiking", label: "Outdoor Trails", icon: <MapIcon size={24} /> }
    ]
  },
  {
    id: 3,
    title: "Choose your entertainment:",
    category: "Gaming",
    options: [
      { id: "video_games", label: "Console / PC Gaming", icon: <Gamepad2 size={24} /> },
      { id: "arcade", label: "Retro Arcades", icon: <Gamepad2 size={24} /> },
      { id: "board_games", label: "Tabletop & Board Games", icon: <Gamepad2 size={24} /> }
    ]
  },
  {
    id: 4,
    title: "What's your cultural vibe?",
    category: "Movies & Entertainment",
    options: [
      { id: "cinema", label: "Movie Theaters", icon: <Film size={24} /> },
      { id: "live_music", label: "Live Concerts", icon: <Music size={24} /> },
      { id: "attraction", label: "Local Attractions", icon: <MapIcon size={24} /> }
    ]
  }
];

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState({});

  const handleSelect = (categoryId, optionId) => {
    setPreferences(prev => ({
      ...prev,
      [categoryId]: optionId
    }));
  };

  const handleNext = async () => {
    if (currentStep < QUIZ_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit all preferences
      try {
        // We'll post each selected preference category to the backend
        for (const [category, subId] of Object.entries(preferences)) {
          await apiClient.post('/users/me/preferences', {
            category: category,
            subcategories: [subId],
            weight: 1.0
          });
        }
        // Force refresh user data to get preferences, then redirect
        window.location.href = '/'; 
      } catch (error) {
        console.error("Failed to save preferences:", error);
        alert("Something went wrong saving your preferences.");
      }
    }
  };

  const question = QUIZ_QUESTIONS[currentStep];
  const isSelected = (categoryId, optionId) => preferences[categoryId] === optionId;
  const canProceed = preferences[question.category] !== undefined;

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="flex gap-2">
            {QUIZ_QUESTIONS.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-2 w-8 rounded-full transition-colors ${idx <= currentStep ? 'bg-purple-600' : 'bg-gray-200'}`} 
              />
            ))}
          </div>
        </div>

        <h2 className="text-center text-3xl font-extrabold text-gray-900 font-serif tracking-tight mb-2 animate-fade-in" key={`title-${currentStep}`}>
          {question.title}
        </h2>
        <p className="text-center text-sm text-gray-500 mb-8">Tap what fits you best</p>

        <div className="space-y-4 animate-fade-in" key={`opts-${currentStep}`}>
          {question.options.map(opt => (
            <div 
              key={opt.id}
              onClick={() => handleSelect(question.category, opt.id)}
              className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex items-center gap-4 ${
                isSelected(question.category, opt.id) 
                  ? 'border-purple-600 bg-purple-50 shadow-md transform scale-[1.02]' 
                  : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm'
              }`}
            >
              <div className={`p-3 rounded-full ${isSelected(question.category, opt.id) ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {opt.icon}
              </div>
              <span className={`text-lg font-medium ${isSelected(question.category, opt.id) ? 'text-purple-900' : 'text-gray-700'}`}>
                {opt.label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <button 
            onClick={handleNext}
            disabled={!canProceed}
            className={`w-full flex justify-center items-center gap-2 py-4 px-4 rounded-xl text-lg font-medium transition-all ${
              canProceed 
                ? 'bg-purple-600 text-white shadow-lg hover:bg-purple-700 transform hover:-translate-y-1' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {currentStep === QUIZ_QUESTIONS.length - 1 ? 'Finish & Discover' : 'Continue'} <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
