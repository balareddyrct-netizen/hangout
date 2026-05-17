import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Login from './pages/Login';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Friends from './pages/Friends';
import MapPage from './pages/Map';
import Spots from './pages/Spots';
import Chat from './pages/Chat';
import VideoCall from './pages/VideoCall';
import Onboarding from './pages/Onboarding';
import VerifyOTP from './pages/VerifyOTP';
import Sidebar from './components/Sidebar';

const Layout = ({ children }) => (
  <div className="app-container">
    <Sidebar />
    <main className="main-content">{children}</main>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="app-container justify-center items-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  // If user is not verified, redirect to verify page
  if (user && !user.is_verified && window.location.pathname !== '/verify') {
    return <Navigate to="/verify" state={{ email: user.email }} replace />;
  }
  
  // If user has no preferences, redirect to onboarding
  if (user && user.is_verified && (!user.preferences || user.preferences.length === 0) && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  
  return <Layout>{children}</Layout>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/verify" element={<VerifyOTP />} />
      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
      <Route path="/spots" element={<ProtectedRoute><Spots /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/video" element={<ProtectedRoute><VideoCall /></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
