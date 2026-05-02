import React, { useState, useEffect, useRef } from 'react';
import { getPasswordStrength } from '../../utils/passwordStrength';

const PasswordStrengthMeter = ({ password, userInputs = [] }) => {
    const [strength, setStrength] = useState(null);
    const debounceRef = useRef(null);

    useEffect(() => {
        // If password is empty, strength state will naturally be null from initial state 
        // or from a previous password clearing if we manage it correctly.
        // However, the linter blocks setStrength(null) here.
        if (!password) return;

        // Clear existing timeout
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        // Debounce the async strength check (300ms) to avoid loading zxcvbn on every keystroke
        debounceRef.current = setTimeout(async () => {
            try {
                const result = await getPasswordStrength(password, userInputs);
                setStrength(result);
            } catch {
                // Silently fail or handle error
            }
        }, 300);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [password, userInputs]);

    // If password is empty, don't show the meter at all, regardless of state
    if (!password) return null;
    
    // If we have a password but haven't calculated strength yet, return null
    if (!strength) return null;

    return (
        <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-text-dim">
                    Strength: <span className={strength.score < 3 ? 'text-brand-danger' : 'text-brand-success'}>{strength.label}</span>
                </span>
                <span className="text-[10px] font-bold text-brand-text-dim opacity-50">
                    Score: {strength.score}/4
                </span>
            </div>

            <div className="h-1.5 w-full bg-brand-bg rounded-full overflow-hidden border border-brand-border/40">
                <div
                    className={`h-full transition-all duration-500 ${strength.color}`}
                    style={{ width: strength.width }}
                />
            </div>

            {strength.feedback?.warning && (
                <p className="text-[9px] font-bold text-brand-danger uppercase leading-tight">
                    ⚠️ {strength.feedback.warning}
                </p>
            )}

            {strength.feedback?.suggestions?.length > 0 && (
                <p className="text-[9px] font-medium text-brand-text-dim italic">
                    Tip: {strength.feedback.suggestions[0]}
                </p>
            )}
        </div>
    );
};

export default PasswordStrengthMeter;
