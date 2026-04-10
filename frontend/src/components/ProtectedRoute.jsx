import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            </div>
        );
    }

    if (!user) {
        // Redirect to root — Crammerly shows AuthModal for unauthenticated users
        // Preserve return path for invite links etc.
        return <Navigate to="/" state={{ from: location.pathname }} replace />;
    }

    if (adminOnly) {
        const checkRole = user?.user?.role || user?.role;
        if (checkRole !== 'admin') {
            return <Navigate to="/workspace" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
