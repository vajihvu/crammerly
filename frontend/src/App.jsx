import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { UIProvider } from './context/UIContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Crammerly from './pages/Crammerly';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import AdminDashboard from './pages/AdminDashboard';
import JoinByInvite from './pages/JoinByInvite';
import { GoogleOAuthProvider } from '@react-oauth/google';
import config from './config/env';

function App() {
    return (
        <ErrorBoundary>
            <GoogleOAuthProvider clientId={config.googleClientId}>
                <AuthProvider>
                    <UIProvider>
                        <Router>
                            <Routes>
                                {/* Public Routes */}
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                <Route path="/verify-email/:token" element={<VerifyEmail />} />
                                <Route path="/forgot-password" element={<ForgotPassword />} />
                                <Route path="/reset-password/:token" element={<ResetPassword />} />

                                {/* Legal Pages (#14, #15) */}
                                <Route path="/privacy" element={<PrivacyPolicy />} />
                                <Route path="/terms" element={<TermsOfService />} />

                                {/* Protected Routes */}
                                <Route
                                    path="/workspace"
                                    element={
                                        <ProtectedRoute>
                                            <Home />
                                        </ProtectedRoute>
                                    }
                                />
                                
                                {/* Admin Protected Routes */}
                                <Route
                                    path="/admin"
                                    element={
                                        <ProtectedRoute adminOnly={true}>
                                            <AdminDashboard />
                                        </ProtectedRoute>
                                    }
                                />

                                {/* Crammerly Main Interface */}
                                <Route path="/" element={
                                    <ProtectedRoute>
                                        <Crammerly />
                                    </ProtectedRoute>
                                } />
                                <Route path="/crammerly" element={
                                    <ProtectedRoute>
                                        <Crammerly />
                                    </ProtectedRoute>
                                } />

                                {/* Invite Link Route */}
                                <Route path="/invite/:roomId" element={
                                    <ProtectedRoute>
                                        <JoinByInvite />
                                    </ProtectedRoute>
                                } />

                                {/* Catch all */}
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </Router>
                    </UIProvider>
                </AuthProvider>
            </GoogleOAuthProvider>
        </ErrorBoundary>
    );
}

export default App;
