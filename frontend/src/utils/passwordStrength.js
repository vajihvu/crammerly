import zxcvbn from 'zxcvbn';

export const getPasswordStrength = (password, userInputs = []) => {
    if (!password) return { score: 0, label: 'Empty', color: 'bg-brand-border' };

    const result = zxcvbn(password, userInputs);

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
