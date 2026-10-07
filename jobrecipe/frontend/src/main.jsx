import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { AppProvider } from './context/AppContext.jsx'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React ErrorBoundary caught error:", error, errorInfo);
  }

  handleReset = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center mb-4 text-2xl font-bold">
            🚀
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">ReadySetJob Portal Reset</h1>
          <p className="text-xs text-slate-400 max-w-md mt-2 mb-4">
            An unexpected error occurred during rendering:
          </p>
          <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl text-left font-mono text-[11px] text-rose-400 max-w-xl overflow-x-auto mb-6">
            {this.state.error ? this.state.error.toString() : 'Unknown Error'}
          </div>
          <button
            onClick={this.handleReset}
            className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-lg transition-all"
          >
            Reset Session & Reload Portal
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </ErrorBoundary>
);

