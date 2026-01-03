import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  Target, 
  Upload, 
  Plus, 
  Search,
  Filter,
  Trophy,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause,
  TrendingUp,
  Copy,
  Trash2,
  Edit,
  RefreshCw,
  FileText,
  Key,
  Link2,
  MessageSquare
} from 'lucide-react';

// URL do servidor de sincronização
const SYNC_SERVER_URL = import.meta.env.VITE_SYNC_SERVER_URL || 'http://localhost:3001';
const SYNC_SERVER_API_KEY = import.meta.env.VITE_SYNC_SERVER_API_KEY || null;

// Tipos
interface Copy {
  id: string;
  texto: string;
  caracteres: number;
  categoria: string;
  status: 'disponivel' | 'ativo' | 'campeao' | 'baixa_perf' | 'bloqueado' | 'pausado';
  metricas: {
    impressoes: number;
    cliques: number;
    ctr: number;
    conversoes: number;
    convRate: number;
  };
  uso: {
    campanhas: string[];
    grupos: string[];
    ativo_em: string[];
  };
  criadoEm: string;
  atualizadoEm: string;
  jaEmUso?: boolean;
}

interface Stats {
  titulos: { total: number; disponivel: number; ativo: number; campeao: number; baixa_perf: number; bloqueado: number };
  descricoes: { total: number; disponivel: number; ativo: number; campeao: number; baixa_perf: number; bloqueado: number };
  keywords: { total: number; disponivel: number; ativo: number; campeao: number; baixa_perf: number; bloqueado: number };
  sitelinks: { total: number; disponivel: number; ativo: number; campeao: number; baixa_perf: number; bloqueado: number };
  frases: { total: number; disponivel: number; ativo: number; campeao: number; baixa_perf: number; bloqueado: number };
  campanhas: number;
  ultimaAtualizacao: string;
  totalImportacoes: number;
}

type TipoTab = 'titulos' | 'descricoes' | 'keywords' | 'sitelinks' | 'frases';

// Função para fazer requisições autenticadas
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  if (SYNC_SERVER_API_KEY) {
    headers.set('X-API-Key', SYNC_SERVER_API_KEY);
  }
  headers.set('Content-Type', 'application/json');
  return fetch(url, { ...options, headers });
}

// Componente de badge de status
function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { icon: React.ReactNode; class: string; label: string }> = {
    campeao: { icon: <Trophy className="w-3 h-3" />, class: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Campeão' },
    ativo: { icon: <CheckCircle className="w-3 h-3" />, class: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Ativo' },
    disponivel: { icon: <Target className="w-3 h-3" />, class: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Disponível' },
    baixa_perf: { icon: <TrendingUp className="w-3 h-3 rotate-180" />, class: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: 'Baixa Perf' },
    bloqueado: { icon: <XCircle className="w-3 h-3" />, class: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Bloqueado' },
    pausado: { icon: <Pause className="w-3 h-3" />, class: 'bg-gray-500/20 text-gray-400 border-gray-500/30', label: 'Pausado' }
  };
  
  const config = configs[status] || configs.disponivel;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.class}`}>
      {config.icon}
      {config.label}
    </span>
  );
}

export function CopiesAds() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TipoTab>('titulos');
  const [copies, setCopies] = useState<Copy[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showNewCopyModal, setShowNewCopyModal] = useState(false);
  const [importData, setImportData] = useState('');
  const [importCampanha, setImportCampanha] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  
  // Novo copy
  const [newCopyText, setNewCopyText] = useState('');
  const [newCopyCategoria, setNewCopyCategoria] = useState('geral');
  
  // Entrada rápida
  const [quickInput, setQuickInput] = useState('');
  const [quickAdding, setQuickAdding] = useState(false);
  const [showQuickMetrics, setShowQuickMetrics] = useState(false);
  const [quickCtr, setQuickCtr] = useState('');
  const [quickConv, setQuickConv] = useState('');

  // Carregar dados
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Carregar stats
      const statsRes = await fetchWithAuth(`${SYNC_SERVER_URL}/copies/stats`);
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      
      // Carregar copies do tipo selecionado
      const copiesRes = await fetchWithAuth(`${SYNC_SERVER_URL}/copies?tipo=${activeTab}&ordenar=ctr`);
      if (copiesRes.ok) {
        const data = await copiesRes.json();
        setCopies(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar os dados de copies',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [activeTab, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtrar copies
  const filteredCopies = copies.filter(copy => {
    const matchSearch = copy.texto.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'todos' || copy.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Importar dados
  const handleImport = async () => {
    if (!importData.trim()) {
      toast({ title: 'Erro', description: 'Cole os dados do Google Ads', variant: 'destructive' });
      return;
    }
    
    setImporting(true);
    setImportResult(null);
    
    try {
      const res = await fetchWithAuth(`${SYNC_SERVER_URL}/copies/importar`, {
        method: 'POST',
        body: JSON.stringify({
          dados: importData,
          tipo: activeTab,
          campanha: importCampanha || undefined
        })
      });
      
      const result = await res.json();
      
      if (res.ok) {
        setImportResult(result);
        toast({
          title: 'Importação concluída!',
          description: `${result.importados} novos, ${result.atualizados} atualizados`
        });
        loadData();
      } else {
        toast({ title: 'Erro na importação', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao importar dados', variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  // Criar novo copy
  const handleCreateCopy = async () => {
    if (!newCopyText.trim()) {
      toast({ title: 'Erro', description: 'Digite o texto do copy', variant: 'destructive' });
      return;
    }
    
    try {
      const res = await fetchWithAuth(`${SYNC_SERVER_URL}/copies`, {
        method: 'POST',
        body: JSON.stringify({
          tipo: activeTab,
          texto: newCopyText,
          categoria: newCopyCategoria
        })
      });
      
      const result = await res.json();
      
      if (res.ok) {
        toast({ title: 'Copy criado!', description: `ID: ${result.id}` });
        setShowNewCopyModal(false);
        setNewCopyText('');
        loadData();
      } else {
        toast({ title: 'Erro', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao criar copy', variant: 'destructive' });
    }
  };

  // Deletar copy
  const handleDelete = async (copy: Copy) => {
    if (!window.confirm(`Deletar "${copy.texto.substring(0, 30)}..."?`)) return;
    
    try {
      const res = await fetchWithAuth(`${SYNC_SERVER_URL}/copies/${activeTab}/${copy.id}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        toast({ title: 'Deletado!', description: 'Copy removido com sucesso' });
        loadData();
      } else {
        toast({ title: 'Erro', description: 'Falha ao deletar', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao deletar', variant: 'destructive' });
    }
  };

  // Adicionar rapidamente
  const handleQuickAdd = async () => {
    if (!quickInput.trim()) return;
    
    setQuickAdding(true);
    try {
      const metricas: any = {};
      if (quickCtr) metricas.ctr = parseFloat(quickCtr.replace(',', '.'));
      if (quickConv) metricas.conversoes = parseInt(quickConv);
      
      const res = await fetchWithAuth(`${SYNC_SERVER_URL}/copies`, {
        method: 'POST',
        body: JSON.stringify({
          tipo: activeTab,
          texto: quickInput.trim(),
          categoria: 'geral',
          metricas: Object.keys(metricas).length > 0 ? metricas : undefined
        })
      });
      
      const result = await res.json();
      
      if (res.ok) {
        toast({ title: '✓ Adicionado!', description: quickInput.substring(0, 30) + '...' });
        setQuickInput('');
        setQuickCtr('');
        setQuickConv('');
        loadData();
      } else {
        toast({ title: 'Erro', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao adicionar', variant: 'destructive' });
    } finally {
      setQuickAdding(false);
    }
  };

  // Marcar como bloqueado
  const handleBloquear = async (copy: Copy) => {
    const motivo = window.prompt('Motivo do bloqueio (opcional):');
    
    try {
      const res = await fetchWithAuth(`${SYNC_SERVER_URL}/copies/${activeTab}/${copy.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          reprovado: true,
          motivo_reprovacao: motivo || 'Reprovado pelo Google Ads'
        })
      });
      
      if (res.ok) {
        toast({ title: 'Bloqueado!', description: 'Copy marcado como bloqueado' });
        loadData();
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao bloquear', variant: 'destructive' });
    }
  };

  // Tab icons
  const tabIcons: Record<TipoTab, React.ReactNode> = {
    titulos: <FileText className="w-4 h-4" />,
    descricoes: <MessageSquare className="w-4 h-4" />,
    keywords: <Key className="w-4 h-4" />,
    sitelinks: <Link2 className="w-4 h-4" />,
    frases: <MessageSquare className="w-4 h-4" />
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-7 h-7 text-primary" />
            Gestão de Copies - Google Ads
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie títulos, descrições e palavras-chave das suas campanhas
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Importar do Google Ads
          </button>
          <button
            onClick={() => setShowNewCopyModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Copy
          </button>
          <button
            onClick={loadData}
            className="p-2 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
            title="Atualizar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {(['titulos', 'descricoes', 'keywords', 'sitelinks', 'frases'] as TipoTab[]).map(tipo => (
            <div 
              key={tipo}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                activeTab === tipo 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setActiveTab(tipo)}
            >
              <div className="flex items-center gap-2 mb-2">
                {tabIcons[tipo]}
                <span className="font-medium capitalize">{tipo}</span>
              </div>
              <div className="text-2xl font-bold">{stats[tipo]?.total || 0}</div>
              <div className="flex gap-2 mt-1 text-xs">
                <span className="text-yellow-400">{stats[tipo]?.campeao || 0} 🏆</span>
                <span className="text-green-400">{stats[tipo]?.ativo || 0} ✓</span>
                <span className="text-red-400">{stats[tipo]?.bloqueado || 0} ✗</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Entrada Rápida */}
      <div className="bg-secondary/30 rounded-xl p-4 border border-border">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleQuickAdd();
                }
              }}
              placeholder={`Digite ou cole um ${activeTab.slice(0, -1)} e pressione Enter...`}
              className="w-full pl-11 pr-4 py-3 text-lg rounded-lg border-2 border-primary/30 bg-background focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              maxLength={activeTab === 'titulos' ? 30 : activeTab === 'descricoes' ? 90 : 500}
            />
          </div>
          
          <button
            onClick={() => setShowQuickMetrics(!showQuickMetrics)}
            className={`px-3 py-3 rounded-lg border transition-colors ${
              showQuickMetrics ? 'bg-primary/20 border-primary' : 'border-border hover:border-primary/50'
            }`}
            title="Adicionar métricas (opcional)"
          >
            <TrendingUp className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleQuickAdd}
            disabled={!quickInput.trim() || quickAdding}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
          >
            {quickAdding ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Adicionar
          </button>
        </div>
        
        {/* Métricas opcionais */}
        {showQuickMetrics && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
            <span className="text-sm text-muted-foreground">Métricas (opcional):</span>
            <div className="flex items-center gap-2">
              <label className="text-sm">CTR %</label>
              <input
                type="text"
                value={quickCtr}
                onChange={(e) => setQuickCtr(e.target.value)}
                placeholder="4.5"
                className="w-20 px-2 py-1 rounded border border-border bg-background text-center text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm">Conversões</label>
              <input
                type="text"
                value={quickConv}
                onChange={(e) => setQuickConv(e.target.value)}
                placeholder="10"
                className="w-20 px-2 py-1 rounded border border-border bg-background text-center text-sm"
              />
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>
            {quickInput.length} / {activeTab === 'titulos' ? 30 : activeTab === 'descricoes' ? 90 : 500} caracteres
          </span>
          <span>
            Pressione <kbd className="px-1 py-0.5 bg-secondary rounded">Enter</kbd> para adicionar rapidamente
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar copies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="todos">Todos Status</option>
            <option value="campeao">🏆 Campeões</option>
            <option value="ativo">✓ Ativos</option>
            <option value="disponivel">○ Disponíveis</option>
            <option value="baixa_perf">↓ Baixa Performance</option>
            <option value="bloqueado">✗ Bloqueados</option>
          </select>
        </div>
        
        <div className="text-sm text-muted-foreground">
          {filteredCopies.length} de {copies.length} {activeTab}
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-secondary/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Texto</th>
              <th className="text-center px-4 py-3 font-medium">CTR</th>
              <th className="text-center px-4 py-3 font-medium">Conv</th>
              <th className="text-center px-4 py-3 font-medium">Uso</th>
              <th className="text-right px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            ) : filteredCopies.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Target className="w-8 h-8 opacity-50" />
                    <span>Nenhum copy encontrado</span>
                    <button
                      onClick={() => setShowImportModal(true)}
                      className="text-primary hover:underline"
                    >
                      Importar do Google Ads
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredCopies.map(copy => (
                <tr key={copy.id} className="border-t border-border hover:bg-secondary/30">
                  <td className="px-4 py-3">
                    <StatusBadge status={copy.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{copy.texto}</div>
                    <div className="text-xs text-muted-foreground">
                      {copy.caracteres} chars • {copy.categoria}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-mono ${
                      copy.metricas.ctr >= 4 ? 'text-yellow-400' :
                      copy.metricas.ctr >= 2 ? 'text-green-400' :
                      copy.metricas.ctr > 0 ? 'text-muted-foreground' : ''
                    }`}>
                      {copy.metricas.ctr > 0 ? `${copy.metricas.ctr}%` : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-mono">
                      {copy.metricas.conversoes > 0 ? copy.metricas.conversoes : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm">
                      {copy.uso?.campanhas?.length || 0} camp
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => navigator.clipboard.writeText(copy.texto)}
                        className="p-1.5 rounded hover:bg-secondary"
                        title="Copiar texto"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      {copy.status !== 'bloqueado' && (
                        <button
                          onClick={() => handleBloquear(copy)}
                          className="p-1.5 rounded hover:bg-red-500/20 text-red-400"
                          title="Bloquear"
                        >
                          <AlertCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(copy)}
                        className="p-1.5 rounded hover:bg-red-500/20 text-red-400"
                        title="Deletar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Importação em Lote */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Importar em Lote
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Cole vários {activeTab} de uma vez - um por linha
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Campanha (opcional)
                </label>
                <input
                  type="text"
                  value={importCampanha}
                  onChange={(e) => setImportCampanha(e.target.value)}
                  placeholder="Nome da campanha de origem"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Textos (um por linha)
                </label>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder={`Cole os textos aqui, um por linha...

Exemplo:
Certidão Online em 24h
100% Digital e Seguro
Receba Rápido por Email
Atendimento Especializado`}
                  className="w-full h-48 px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                />
              </div>
              
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-sm">
                <div className="font-medium text-primary mb-2">✨ Modo Simples</div>
                <p className="text-muted-foreground">
                  Basta colar os textos, um por linha. Cada linha será adicionada como um {activeTab.slice(0, -1)} separado.
                </p>
              </div>
              
              {importResult && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <div className="font-medium text-green-400 mb-2">
                    ✅ Importação concluída!
                  </div>
                  <div className="text-sm space-y-1">
                    <div>📥 {importResult.importados} novos copies</div>
                    <div>🔄 {importResult.atualizados} atualizados</div>
                    {importResult.bloqueados > 0 && (
                      <div className="text-red-400">🚫 {importResult.bloqueados} bloqueados (GovDocs)</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportData('');
                  setImportResult(null);
                }}
                className="px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={handleImport}
                disabled={importing || !importData.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {importing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Importar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Copy */}
      {showNewCopyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl border border-border max-w-lg w-full">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Novo {activeTab.slice(0, -1)}
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Texto</label>
                <textarea
                  value={newCopyText}
                  onChange={(e) => setNewCopyText(e.target.value)}
                  placeholder={`Digite o ${activeTab.slice(0, -1)}...`}
                  className="w-full h-24 px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  maxLength={activeTab === 'titulos' ? 30 : activeTab === 'descricoes' ? 90 : 500}
                />
                <div className="text-xs text-muted-foreground mt-1 text-right">
                  {newCopyText.length} / {activeTab === 'titulos' ? 30 : activeTab === 'descricoes' ? 90 : 500}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Categoria</label>
                <select
                  value={newCopyCategoria}
                  onChange={(e) => setNewCopyCategoria(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="geral">Geral</option>
                  <option value="criminal">Criminal</option>
                  <option value="civil">Civil</option>
                  <option value="trabalhista">Trabalhista</option>
                  <option value="federal">Federal</option>
                </select>
              </div>
            </div>
            
            <div className="p-6 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowNewCopyModal(false);
                  setNewCopyText('');
                }}
                className="px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCopy}
                disabled={!newCopyText.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                Criar Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

