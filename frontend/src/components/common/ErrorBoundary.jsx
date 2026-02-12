import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4 font-inter">
                    <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-8 text-center border border-gray-100 dark:border-zinc-800">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="text-red-600 dark:text-red-400 w-8 h-8" />
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Oops! Something went wrong
                        </h1>

                        <p className="text-gray-500 dark:text-zinc-400 mb-8 leading-relaxed">
                            We've encountered an unexpected error. Don't worry, your data is safe. You can try refreshing the page or returning home.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all active:scale-95"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refresh Page
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-zinc-700 transition-all active:scale-95"
                            >
                                <Home className="w-4 h-4" />
                                Go Home
                            </button>
                        </div>

                        {import.meta.env.DEV && (
                            <div className="mt-8 p-4 bg-gray-50 dark:bg-zinc-950 rounded-lg text-left overflow-auto max-h-40 border border-gray-100 dark:border-zinc-800">
                                <p className="text-xs font-mono text-gray-400 mb-2 uppercase tracking-widest">Stack Trace</p>
                                <pre className="text-xs text-red-500 font-mono">
                                    {this.state.error?.toString()}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
