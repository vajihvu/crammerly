import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { UIProvider } from './context/UIContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Crammer from './pages/Crammer';

function App() {
    return (
        <AuthProvider>
            <UIProvider>
                <Router>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        {/* Protected Routes */}
                        <Route
                            path="/workspace"
                            element={
                                <ProtectedRoute>
                                    <Home />
                                </ProtectedRoute>
                            }
                        />

                        {/* Crammerly Main Interface */}
                        <Route path="/" element={<Crammer />} />
                        <Route path="/crammer" element={<Crammer />} />

                        {/* Catch all - Redirect to Home */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Router>
            </UIProvider>
        </AuthProvider>
    );
}

export default App;
