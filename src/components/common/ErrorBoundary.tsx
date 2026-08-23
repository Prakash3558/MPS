import React, { ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReset = () => {
    localStorage.removeItem('mps_site_settings_v3');
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 selection:bg-amber-500 selection:text-slate-950">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black font-heading text-white">
                {this.props.fallbackTitle || 'Application Loading'}
              </h2>
              <p className="text-sm text-slate-400">
                A temporary client render issue was caught safely. Click below to reload the school portal.
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs font-mono text-red-400 max-h-32 overflow-y-auto">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black py-3 px-4 rounded-xl shadow-lg transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={this.handleGoHome}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-3 rounded-xl border border-slate-700 text-xs transition-colors"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Homepage</span>
                </button>

                <button
                  type="button"
                  onClick={this.handleReset}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800/60 hover:bg-red-950/50 text-slate-400 hover:text-red-300 font-medium py-2.5 px-3 rounded-xl border border-slate-700/60 text-xs transition-colors"
                >
                  <span>Reset Cache</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
