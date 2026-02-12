const storage = {
    get: async (key) => {
        try {
            const item = localStorage.getItem(key);
            return item ? { value: item } : null;
        } catch (e) {
            console.error('Storage get error:', e);
            return null;
        }
    },
    set: async (key, value) => {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.error('Storage set error:', e);
        }
    },
    list: async (prefix = '') => {
        try {
            const keys = Object.keys(localStorage).filter(key => key.startsWith(prefix));
            return { keys };
        } catch (e) {
            console.error('Storage list error:', e);
            return { keys: [] };
        }
    },
    delete: async (key) => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('Storage delete error:', e);
        }
    }
};

export default storage;
