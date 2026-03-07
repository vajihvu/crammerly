// src/components/ui/ConnectionBanner.jsx
import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, X } from 'lucide-react';
import { onConnectionChange, ConnectionState, reconnectSocket } from '../../utils/socket';

function ConnectionBanner() {
    const [state, setState] = useState(ConnectionState.DISCONNECTED);
    const [detail, setDetail] = useState(null);
    const [dismissed, setDismissed] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const unsub = onConnectionChange((newState, newDetail) => {
            setState(newState);
            setDetail(newDetail);
            setDismissed(false);

            // Only show banner for non-connected states
            setVisible(newState !== ConnectionState.CONNECTED && newState !== ConnectionState.CONNECTING);
        });
        return unsub;
    }, []);

    if (!visible || dismissed) return null;

    const isReconnecting = state === ConnectionState.RECONNECTING;
    const isError = state === ConnectionState.ERROR;
    const attemptNum = detail?.attempt;

    return (
        <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-4 duration-300 max-w-md w-[calc(100%-2rem)]`}>
            <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl font-sans ${isError
                    ? 'bg-brand-danger/10 border-brand-danger/30 text-brand-danger'
                    : isReconnecting
                        ? 'bg-brand-warning/10 border-brand-warning/30 text-brand-warning'
                        : 'bg-brand-muted/10 border-brand-border text-brand-text-dim'
                }`}>
                {isReconnecting ? (
                    <RefreshCw size={16} className="animate-spin shrink-0" />
                ) : (
                    <WifiOff size={16} className="shrink-0" />
                )}

                <span className="text-xs font-bold uppercase tracking-wider flex-1 truncate">
                    {isReconnecting
                        ? `Reconnecting${attemptNum ? ` (attempt ${attemptNum})` : ''}…`
                        : isError
                            ? 'Connection lost'
                            : 'Disconnected'}
                </span>

                {isError && (
                    <button
                        onClick={() => reconnectSocket()}
                        className="px-3 py-1.5 bg-brand-text/10 hover:bg-brand-text/20 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shrink-0"
                    >
                        Retry
                    </button>
                )}

                <button
                    onClick={() => setDismissed(true)}
                    className="p-1 hover:bg-brand-text/10 rounded-lg transition-all shrink-0"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
}

export default ConnectionBanner;
