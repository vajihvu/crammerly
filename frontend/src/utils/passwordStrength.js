let zxcvbnModule = null;

export const getPasswordStrength = async (password, userInputs = []) => {
    if (!password) return { score: 0, label: 'Empty', color: 'bg-brand-border', width: '0%', feedback: { warning: '', suggestions: [] } };

    // Lazy-load zxcvbn (~800KB) only when actually needed
    if (!zxcvbnModule) {
        const mod = await import('zxcvbn');
        zxcvbnModule = mod.default || mod;
    }

    const result = zxcvbnModule(password, userInputs);

    const strengths = [
        { label: 'Very Weak', color: 'bg-brand-danger', width: '20%' },
        { label: 'Weak', color: 'bg-brand-danger', width: '40%' },
        { label: 'Fair', color: 'bg-brand-secondary', width: '60%' },
        { label: 'Strong', color: 'bg-brand-success', width: '80%' },
        { label: 'Bulletproof', color: 'bg-brand-primary', width: '100%' }
    ];

    return {
        ...result,
        ...strengths[result.score]
    };
};
