import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary - evita tela em branco quando há erro no iPhone/Safari.
 * Exibe mensagem amigável em vez de crash silencioso.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      const err = this.state.error;
      const errMsg = err?.message || String(err);
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-xl font-bold text-foreground">Algo deu errado</h1>
            <p className="text-muted-foreground text-sm">
              Tente recarregar a página. Se o problema continuar, use outro navegador ou desative o modo privado.
            </p>
            {errMsg && (
              <p className="text-xs text-muted-foreground font-mono break-all" title="Copie para reportar">
                {errMsg.slice(0, 80)}{errMsg.length > 80 ? '…' : ''}
              </p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium touch-manipulation"
            >
              Recarregar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
