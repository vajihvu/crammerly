import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import { UIProvider } from './context/UIContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import Crammerly from './pages/Crammerly';
import VerifyEmail from './pages/VerifyEmail';
import { GoogleOAuthProvider } from '@react-oauth/google';
import config from './config/env';
import SocketListener from './components/common/SocketListener';
import { VideoCallProvider } from './context/VideoCallContext';
import CallModal from './components/modals/video/CallModal';

// Lazy-loaded pages (rarely visited — keep out of initial bundle)
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const JoinByInvite = lazy(() => import('./pages/JoinByInvite'));
const Onboarding = lazy(() => import('./pages/Onboarding'));

function App() {
    return (
        <ErrorBoundary>
            <GoogleOAuthProvider clientId={config.googleClientId}>
                <AuthProvider>
                    <UIProvider>
                        <VideoCallProvider>
                            <SocketListener />
                            <CallModal />
                            <Router>
                            <Suspense fallback={<div className="min-h-screen bg-brand-bg" />}>
                            <Routes>
                                {/* Auth routes → redirect to root where AuthModal handles auth */}
                                <Route path="/login" element={<Navigate to="/" replace />} />
                                <Route path="/register" element={<Navigate to="/" replace />} />
                                <Route path="/verify-email/:token" element={<VerifyEmail />} />
                                <Route path="/forgot-password" element={<ForgotPassword />} />
                                <Route path="/reset-password/:token" element={<ResetPassword />} />

                                {/* Legal Pages */}
                                <Route path="/privacy" element={<PrivacyPolicy />} />
                                <Route path="/terms" element={<TermsOfService />} />

                                {/* Protected Routes */}
                                {/* Redirect legacy workspace route */}
                                <Route path="/workspace" element={<Navigate to="/" replace />} />
                                
                                {/* Admin Protected Routes */}
                                <Route
                                    path="/admin"
                                    element={
                                        <ProtectedRoute adminOnly={true}>
                                            <AdminDashboard />
                                        </ProtectedRoute>
                                    }
                                />

                                <Route path="/" element={<Crammerly />} />
                                <Route path="/crammerly" element={<Crammerly />} />
                                <Route path="/onboarding" element={
                                    <ProtectedRoute>
                                        <Onboarding />
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
                            </Suspense>
                        </Router>
                        </VideoCallProvider>
                    </UIProvider>
                </AuthProvider>
            </GoogleOAuthProvider>
        </ErrorBoundary>
    );
}

export default App;
