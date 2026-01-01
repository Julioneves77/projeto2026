import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { User, UserRole } from '@/types';
import { 
  UserPlus, 
  Users as UsersIcon,
  Mail,
  Shield,
  DollarSign,
  Target,
  CheckCircle,
  XCircle,
  Pencil,
  X
} from 'lucide-react';

export function Users() {
  const { users, addUser, updateUser, userRole } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Form state
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [role, setRole] = useState<UserRole>('atendente');
  const [status, setStatus] = useState<'ativo' | 'inativo'>('ativo');
  const [valorPadrao, setValorPadrao] = useState(0);
  const [valorPrioridade, setValorPrioridade] = useState(0);
  const [valorPremium, setValorPremium] = useState(0);
  const [metaDiariaCertidoes, setMetaDiariaCertidoes] = useState(0);

  if (userRole !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Acesso não autorizado.</p>
      </div>
    );
  }

  const resetForm = () => {
    setNome('');
    setEmail('');
    setSenha('');
    setRole('atendente');
    setStatus('ativo');
    setValorPadrao(0);
    setValorPrioridade(0);
    setValorPremium(0);
    setMetaDiariaCertidoes(0);
    setShowForm(false);
    setEditingUser(null);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setNome(user.nome);
    setEmail(user.email);
    setSenha('');
    setRole(user.role);
    setStatus(user.status);
    setValorPadrao(user.valorPadrao);
    setValorPrioridade(user.valorPrioridade);
    setValorPremium(user.valorPremium);
    setMetaDiariaCertidoes(user.metaDiariaCertidoes);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome.trim() || !email.trim()) {
      alert('Por favor, preencha os campos obrigatórios.');
      return;
    }

    if (!editingUser && !senha.trim()) {
      alert('Por favor, preencha a senha.');
      return;
    }

    if (editingUser) {
      const updates: Partial<User> = {
        nome: nome.trim(),
        email: email.trim(),
        role,
        status,
        valorPadrao,
        valorPrioridade,
        valorPremium,
        metaDiariaCertidoes
      };
      if (senha.trim()) {
        updates.senha = senha.trim();
      }
      updateUser(editingUser.id, updates);
    } else {
      addUser({
        nome: nome.trim(),
        email: email.trim(),
        senha: senha.trim(),
        role,
        status,
        valorPadrao,
        valorPrioridade,
        valorPremium,
        metaDiariaCertidoes
      });
    }

    resetForm();
  };

  const getRoleBadge = (role: UserRole) => {
    const badges: Record<UserRole, { label: string; className: string }> = {
      admin: { label: 'Admin', className: 'bg-status-priority-bg text-status-priority' },
      financeiro: { label: 'Financeiro', className: 'bg-status-financial-bg text-status-financial' },
      atendente: { label: 'Atendente', className: 'bg-status-progress-bg text-status-progress' },
    };
    return badges[role];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
          <p className="text-muted-foreground">Gerencie os usuários do sistema</p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary-hover transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          Novo Usuário
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-card rounded-xl border border-border p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              {editingUser ? 'Editar Usuário' : 'Cadastrar Novo Usuário'}
            </h3>
            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Nome *</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome completo"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">E-mail *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Senha {editingUser ? '(deixe vazio para manter)' : '*'}
              </label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                required={!editingUser}
                className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Perfil</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="admin">Admin</option>
                <option value="financeiro">Financeiro</option>
                <option value="atendente">Atendente</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'ativo' | 'inativo')}
                className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Meta Diária de Certidões</label>
              <input
                type="number"
                value={metaDiariaCertidoes}
                onChange={(e) => setMetaDiariaCertidoes(Number(e.target.value))}
                min="0"
                className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            {/* Valores por tipo de serviço */}
            <div className="md:col-span-2 lg:col-span-3">
              <div className="border-t border-border pt-4 mt-2">
                <h4 className="text-sm font-semibold text-foreground mb-3">Valores por Tipo de Serviço</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Padrão (R$)</label>
                    <input
                      type="number"
                      value={valorPadrao}
                      onChange={(e) => setValorPadrao(Number(e.target.value))}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Prioridade (R$)</label>
                    <input
                      type="number"
                      value={valorPrioridade}
                      onChange={(e) => setValorPrioridade(Number(e.target.value))}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Premium (R$)</label>
                    <input
                      type="number"
                      value={valorPremium}
                      onChange={(e) => setValorPremium(Number(e.target.value))}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 lg:col-span-3 flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 text-foreground border border-border rounded-xl hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary-hover transition-colors"
              >
                {editingUser ? 'Salvar Alterações' : 'Cadastrar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[hsl(var(--table-header))]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">E-mail</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Perfil</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valores (P/Pr/Pm)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Meta Diária</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => {
                const badge = getRoleBadge(user.role);
                return (
                  <tr key={user.id} className="hover:bg-[hsl(var(--table-row-hover))] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-muted rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-foreground">
                            {user.nome.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-foreground">{user.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`status-badge ${badge.className}`}>
                        <Shield className="w-3 h-3 mr-1" />
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.status === 'ativo' ? (
                        <span className="inline-flex items-center gap-1 text-sm text-status-complete">
                          <CheckCircle className="w-4 h-4" />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-sm text-status-waiting">
                          <XCircle className="w-4 h-4" />
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-foreground">
                        <DollarSign className="w-4 h-4 text-status-complete" />
                        <span className="font-mono text-xs">
                          {(user.valorPadrao ?? 0).toFixed(2)} / {(user.valorPrioridade ?? 0).toFixed(2)} / {(user.valorPremium ?? 0).toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-foreground">
                        <Target className="w-4 h-4 text-status-priority" />
                        {user.metaDiariaCertidoes ?? 0}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleEdit(user)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}