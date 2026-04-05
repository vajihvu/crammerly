import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { roomsApi } from '../api';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const JoinByInvite = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('joining'); // joining, success, error
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const joinRoom = async () => {
            try {
                await roomsApi.join(roomId);
                setStatus('success');
                setTimeout(() => navigate('/', { replace: true }), 1500);
            } catch (err) {
                setStatus('error');
                const msg = err.response?.data?.message || 'Failed to join room';
                setErrorMsg(msg);
            }
        };
        if (roomId) joinRoom();
    }, [roomId, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a] px-4 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full"></div>

            <div className="w-full max-w-md z-10">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl text-center">
                    {status === 'joining' && (
                        <>
                            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
                            <h1 className="text-2xl font-bold text-white mb-2">Joining Room...</h1>
                            <p className="text-slate-400">Please wait while we add you to the study room</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-green-500 to-emerald-500 mb-4 shadow-lg shadow-green-500/20 mx-auto">
                                <CheckCircle className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-2">Joined Successfully!</h1>
                            <p className="text-slate-400">Redirecting you to the room...</p>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-500 to-pink-500 mb-4 shadow-lg shadow-red-500/20 mx-auto">
                                <XCircle className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-2">Unable to Join</h1>
                            <p className="text-slate-400 mb-6">{errorMsg}</p>
                            <button
                                onClick={() => navigate('/', { replace: true })}
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3 rounded-xl shadow-lg transition-all"
                            >
                                Go to Dashboard
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JoinByInvite;
