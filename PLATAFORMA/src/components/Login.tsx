import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    // Simulate small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300));

    const success = login(email, senha);
    if (!success) {
      setErro('E-mail ou senha inválidos');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/30 p-4 relative">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-medium">
            <span className="text-3xl font-bold text-primary-foreground">AV</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Atendimento Virtual</h1>
          <p className="text-muted-foreground mt-2">Entre com suas credenciais</p>
        </div>

        {/* Login Card */}
        <div className="bg-card rounded-2xl shadow-strong border border-border p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="senha" className="block text-sm font-medium text-foreground">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="senha"
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Error Message */}
            {erro && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm animate-fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{erro}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-70"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  Entrar
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials - Quick Login Buttons */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-3">Entrar rapidamente como:</p>
            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@empresasvirtuais.com');
                  setSenha('admin123');
                  login('admin@empresasvirtuais.com', 'admin123');
                }}
                className="flex items-center justify-between px-3 py-2.5 bg-muted/50 hover:bg-muted rounded-lg transition-colors text-left group"
              >
                <span className="text-sm font-medium text-foreground">Administrador</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('financeiro@empresasvirtuais.com');
                  setSenha('financeiro123');
                  login('financeiro@empresasvirtuais.com', 'financeiro123');
                }}
                className="flex items-center justify-between px-3 py-2.5 bg-muted/50 hover:bg-muted rounded-lg transition-colors text-left group"
              >
                <span className="text-sm font-medium text-foreground">Financeiro</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('atendente@empresasvirtuais.com');
                  setSenha('atendente123');
                  login('atendente@empresasvirtuais.com', 'atendente123');
                }}
                className="flex items-center justify-between px-3 py-2.5 bg-muted/50 hover:bg-muted rounded-lg transition-colors text-left group"
              >
                <span className="text-sm font-medium text-foreground">Atendente</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
