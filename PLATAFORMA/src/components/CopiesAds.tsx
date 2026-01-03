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
  RefreshCw,
  FileText,
  Key,
  Link2,
  MessageSquare,
  Clipboard,
  Wand2,
  Eye,
  ChevronDown,
  Check,
  X as XIcon
} from 'lucide-react';

// URL do servidor de sincronização
const SYNC_SERVER_URL = import.meta.env.VITE_SYNC_SERVER_URL || 'http://localhost:3001';
const SYNC_SERVER_API_KEY = import.meta.env.VITE_SYNC_SERVER_API_KEY || null;

// Tipos
interface CopyItem {
  id: string;
  texto: string;
  caracteres: number;
  tipoCertidao?: string;
  tipoRecurso?: string;
  status: 'disponivel' | 'ativo' | 'campeao' | 'baixa_perf' | 'bloqueado' | 'pausado';
  metricas: {
    impressoes: number;
    cliques: number;
    ctr: number;
    conversoes: number;
    custo?: number;
  };
  historico?: any[];
  criadoEm: string;
  atualizadoEm: string;
}

interface TipoCertidao {
  id: string;
  nome: string;
  keywords: string[];
}

interface ParsedLine {
  sucesso: boolean;
  texto?: string;
  tipoRecurso?: string;
  tipoCertidao?: string;
  metricas?: {
    impressoes: number;
    cliques: number;
    ctr: number;
    custo: number;
    conversoes: number;
  };
  erro?: string;
}

interface AnuncioGerado {
  tipo: string;
  nomeTipo: string;
  geradoEm: string;
  completo: boolean;
  stats: {
    titulos: number;
    descricoes: number;
    keywords: number;
    sitelinks: number;
    frases: number;
    campeoes: { titulos: number; descricoes: number };
  };
  componentes: {
    titulos: { texto: string; status: string; ctr?: number }[];
    descricoes: { texto: string; status: string; ctr?: number }[];
    keywords: { texto: string; status: string }[];
    sitelinks: { texto: string; status: string }[];
    frases: { texto: string; status: string }[];
  };
  textoCopiavel: {
    titulos: string;
    descricoes: string;
    keywords: string;
    sitelinks: string;
    frases: string;
  };
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
  
  // Tipos de certidão
  const [tiposCertidao, setTiposCertidao] = useState<TipoCertidao[]>([]);
  const [tipoCertidaoSelecionado, setTipoCertidaoSelecionado] = useState<string>('geral');
  
  // Tabs de recursos
  const [activeTab, setActiveTab] = useState<TipoTab>('titulos');
  
  // Copies
  const [copies, setCopies] = useState<CopyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  
  // Stats
  const [stats, setStats] = useState<any>(null);
  
  // Colar linha
  const [linhaColada, setLinhaColada] = useState('');
  const [parsedPreview, setParsedPreview] = useState<ParsedLine | null>(null);
  const [salvando, setSalvando] = useState(false);
  
  // Gerador de anúncio
  const [showGerador, setShowGerador] = useState(false);
  const [anuncioGerado, setAnuncioGerado] = useState<AnuncioGerado | null>(null);
  const [gerandoAnuncio, setGerandoAnuncio] = useState(false);
  
  // Modals
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState('');
  const [importCampanha, setImportCampanha] = useState('');
  const [importing, setImporting] = useState(false);

  // Carregar tipos de certidão
  useEffect(() => {
    fetchWithAuth(`${SYNC_SERVER_URL}/copies/tipos`)
      .then(res => res.json())
      .then(data => setTiposCertidao(data))
      .catch(() => setTiposCertidao([{ id: 'geral', nome: 'Geral', keywords: [] }]));
  }, []);

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
      const copiesRes = await fetchWithAuth(
        `${SYNC_SERVER_URL}/copies?tipoCertidao=${tipoCertidaoSelecionado}&tipoRecurso=${activeTab}&ordenar=ctr`
      );
      if (copiesRes.ok) {
        const data = await copiesRes.json();
        setCopies(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, [tipoCertidaoSelecionado, activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtrar copies
  const filteredCopies = copies.filter(copy => {
    const matchSearch = copy.texto.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'todos' || copy.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Processar linha colada (preview)
  const handleLinhaChange = (valor: string) => {
    setLinhaColada(valor);
    
    if (!valor.trim()) {
      setParsedPreview(null);
      return;
    }
    
    // Preview local (será confirmado pelo servidor)
    const cols = valor.split(/[\t|,;]/).map(c => c.trim());
    const preview: ParsedLine = {
      sucesso: true,
      texto: cols.find(c => c.length > 5 && !/^[\d.,R$%]+$/.test(c)) || valor,
      tipoRecurso: 'titulos',
      tipoCertidao: tipoCertidaoSelecionado,
      metricas: { impressoes: 0, cliques: 0, ctr: 0, custo: 0, conversoes: 0 }
    };
    
    cols.forEach(col => {
      if (/^\d+$/.test(col)) {
        const num = parseInt(col);
        if (num > 100) preview.metricas!.impressoes = num;
        else preview.metricas!.cliques = num;
      } else if (/^\d+[\.,]\d+%?$/.test(col.replace('%', ''))) {
        const num = parseFloat(col.replace(',', '.').replace('%', ''));
        if (num < 20) preview.metricas!.ctr = num;
        else preview.metricas!.custo = num;
      }
    });
    
    if (preview.metricas!.impressoes > 0 && preview.metricas!.cliques > 0 && preview.metricas!.ctr === 0) {
      preview.metricas!.ctr = parseFloat(((preview.metricas!.cliques / preview.metricas!.impressoes) * 100).toFixed(2));
    }
    
    setParsedPreview(preview);
  };

  // Salvar linha colada
  const handleSalvarLinha = async () => {
    if (!linhaColada.trim()) return;
    
    setSalvando(true);
    try {
      const res = await fetchWithAuth(`${SYNC_SERVER_URL}/copies/colar-linha`, {
        method: 'POST',
        body: JSON.stringify({
          linha: linhaColada,
          tipoCertidaoOverride: tipoCertidaoSelecionado
        })
      });
      
      const result = await res.json();
      
      if (res.ok) {
        toast({
          title: result.acao === 'criado' ? '✅ Adicionado!' : '🔄 Atualizado!',
          description: `${result.copy.texto.substring(0, 30)}... → ${tipoCertidaoSelecionado}`
        });
        setLinhaColada('');
        setParsedPreview(null);
        loadData();
      } else {
        toast({
          title: 'Erro',
          description: result.error,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao processar linha', variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  // Gerar anúncio completo
  const handleGerarAnuncio = async () => {
    setGerandoAnuncio(true);
    try {
      const res = await fetchWithAuth(`${SYNC_SERVER_URL}/copies/gerar-anuncio/${tipoCertidaoSelecionado}`);
      const data = await res.json();
      
      if (res.ok) {
        setAnuncioGerado(data);
        setShowGerador(true);
      } else {
        toast({ title: 'Erro', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao gerar anúncio', variant: 'destructive' });
    } finally {
      setGerandoAnuncio(false);
    }
  };

  // Copiar para clipboard
  const copiarTexto = (texto: string, label: string) => {
    navigator.clipboard.writeText(texto);
    toast({ title: 'Copiado!', description: label });
  };

  // Importar em lote
  const handleImport = async () => {
    if (!importData.trim()) return;
    
    setImporting(true);
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
        toast({
          title: 'Importação concluída!',
          description: `${result.importados} novos, ${result.atualizados} atualizados`
        });
        setShowImportModal(false);
        setImportData('');
        loadData();
      } else {
        toast({ title: 'Erro', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao importar', variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  // Deletar copy
  const handleDelete = async (copy: CopyItem) => {
    if (!window.confirm(`Deletar "${copy.texto.substring(0, 30)}..."?`)) return;
    
    try {
      const res = await fetchWithAuth(`${SYNC_SERVER_URL}/copies/${activeTab}/${copy.id}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        toast({ title: 'Deletado!' });
        loadData();
      }
    } catch (error) {
      toast({ title: 'Erro', variant: 'destructive' });
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

  // Stats do tipo selecionado
  const tipStats = stats?.porTipo?.[tipoCertidaoSelecionado];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-7 h-7 text-primary" />
            Sistema Inteligente de Anúncios
          </h1>
          <p className="text-muted-foreground mt-1">
            Cole linhas do Google Ads • Organize por tipo • Gere anúncios completos
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleGerarAnuncio}
            disabled={gerandoAnuncio}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            {gerandoAnuncio ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            Gerar Anúncio Completo
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            <Upload className="w-4 h-4" />
            Importar Lote
          </button>
          <button
            onClick={loadData}
            className="p-2 rounded-lg border border-border hover:bg-secondary/50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Seletor de Tipo de Certidão */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
        <div className="flex items-center gap-4">
          <span className="font-medium text-sm">Tipo de Certidão:</span>
          <div className="flex flex-wrap gap-2">
            {tiposCertidao.map(tipo => (
              <button
                key={tipo.id}
                onClick={() => setTipoCertidaoSelecionado(tipo.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  tipoCertidaoSelecionado === tipo.id
                    ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                    : 'bg-background border border-border hover:border-primary/50'
                }`}
              >
                {tipo.nome}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Campo de Colar Linha - DESTAQUE */}
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-6 border-2 border-green-500/30">
        <div className="flex items-start gap-2 mb-4">
          <Clipboard className="w-6 h-6 text-green-500 mt-0.5" />
          <div>
            <h2 className="text-lg font-bold">Colar Linha do Google Ads</h2>
            <p className="text-sm text-muted-foreground">
              Selecione uma linha no Google Ads, copie (Ctrl+C) e cole aqui. O sistema interpreta automaticamente!
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={linhaColada}
              onChange={(e) => handleLinhaChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && linhaColada.trim()) {
                  e.preventDefault();
                  handleSalvarLinha();
                }
              }}
              placeholder="Cole a linha aqui... Ex: Veja Seus Links Eleitorais | Anúncio | Qualificada | Título | 41 | 4 | R$11,24"
              className="w-full px-4 py-3 text-lg rounded-lg border-2 border-green-500/30 bg-background focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            />
          </div>
          <button
            onClick={handleSalvarLinha}
            disabled={salvando || !linhaColada.trim()}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 font-medium flex items-center gap-2"
          >
            {salvando ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Adicionar
          </button>
        </div>

        {/* Preview da interpretação */}
        {parsedPreview && parsedPreview.sucesso && (
          <div className="mt-4 p-4 bg-background/80 rounded-lg border border-green-500/20">
            <div className="text-sm font-medium text-green-500 mb-2 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview - O sistema detectou:
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Texto:</span>
                <div className="font-medium truncate">{parsedPreview.texto}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Tipo:</span>
                <div className="font-medium">{tipoCertidaoSelecionado}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Impressões:</span>
                <div className="font-medium">{parsedPreview.metricas?.impressoes || '-'}</div>
              </div>
              <div>
                <span className="text-muted-foreground">CTR:</span>
                <div className="font-medium">{parsedPreview.metricas?.ctr ? `${parsedPreview.metricas.ctr}%` : '-'}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards por Recurso */}
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
            <div className="text-2xl font-bold">{tipStats?.[tipo]?.total || 0}</div>
            <div className="flex gap-2 mt-1 text-xs">
              <span className="text-yellow-400">{tipStats?.[tipo]?.campeao || 0} 🏆</span>
              <span className="text-green-400">{tipStats?.[tipo]?.ativo || 0} ✓</span>
              <span className="text-red-400">{tipStats?.[tipo]?.bloqueado || 0} ✗</span>
            </div>
          </div>
        ))}
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
              <th className="text-center px-4 py-3 font-medium">Impr</th>
              <th className="text-center px-4 py-3 font-medium">CTR</th>
              <th className="text-center px-4 py-3 font-medium">Conv</th>
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
                    <span>Nenhum copy encontrado para {tipoCertidaoSelecionado}</span>
                    <span className="text-sm">Cole uma linha do Google Ads acima para começar!</span>
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
                      {copy.caracteres} chars
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-mono">
                    {copy.metricas.impressoes > 0 ? copy.metricas.impressoes : '-'}
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
                  <td className="px-4 py-3 text-center font-mono">
                    {copy.metricas.conversoes > 0 ? copy.metricas.conversoes : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => copiarTexto(copy.texto, 'Texto copiado!')}
                        className="p-1.5 rounded hover:bg-secondary"
                        title="Copiar texto"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
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

      {/* Modal - Visualizador de Anúncio Gerado */}
      {showGerador && anuncioGerado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl border border-border max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border sticky top-0 bg-background z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-yellow-500" />
                    Anúncio Gerado - {anuncioGerado.nomeTipo}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {anuncioGerado.completo ? '✅ Anúncio completo pronto!' : '⚠️ Adicione mais copies para completar'}
                  </p>
                </div>
                <button
                  onClick={() => setShowGerador(false)}
                  className="p-2 rounded-lg hover:bg-secondary"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Stats do anúncio */}
              <div className="grid grid-cols-5 gap-3">
                <div className="p-3 bg-secondary/50 rounded-lg text-center">
                  <div className="text-2xl font-bold">{anuncioGerado.stats.titulos}</div>
                  <div className="text-xs text-muted-foreground">Títulos</div>
                </div>
                <div className="p-3 bg-secondary/50 rounded-lg text-center">
                  <div className="text-2xl font-bold">{anuncioGerado.stats.descricoes}</div>
                  <div className="text-xs text-muted-foreground">Descrições</div>
                </div>
                <div className="p-3 bg-secondary/50 rounded-lg text-center">
                  <div className="text-2xl font-bold">{anuncioGerado.stats.keywords}</div>
                  <div className="text-xs text-muted-foreground">Keywords</div>
                </div>
                <div className="p-3 bg-secondary/50 rounded-lg text-center">
                  <div className="text-2xl font-bold">{anuncioGerado.stats.sitelinks}</div>
                  <div className="text-xs text-muted-foreground">Sitelinks</div>
                </div>
                <div className="p-3 bg-secondary/50 rounded-lg text-center">
                  <div className="text-2xl font-bold">{anuncioGerado.stats.frases}</div>
                  <div className="text-xs text-muted-foreground">Frases</div>
                </div>
              </div>

              {/* Componentes */}
              {(['titulos', 'descricoes', 'keywords', 'sitelinks', 'frases'] as const).map(tipo => (
                anuncioGerado.componentes[tipo].length > 0 && (
                  <div key={tipo} className="border border-border rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-secondary/30">
                      <h3 className="font-medium capitalize">{tipo}</h3>
                      <button
                        onClick={() => copiarTexto(anuncioGerado.textoCopiavel[tipo], `${tipo} copiados!`)}
                        className="flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <Copy className="w-3 h-3" />
                        Copiar todos
                      </button>
                    </div>
                    <div className="p-4 space-y-2">
                      {anuncioGerado.componentes[tipo].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-background rounded border border-border/50">
                          <span className="flex-1">{item.texto}</span>
                          <div className="flex items-center gap-2">
                            {item.ctr && <span className="text-xs text-yellow-400">{item.ctr}%</span>}
                            <StatusBadge status={item.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
            
            <div className="p-6 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => setShowGerador(false)}
                className="px-4 py-2 rounded-lg border border-border hover:bg-secondary"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importação em Lote */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl border border-border max-w-2xl w-full">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Importar em Lote
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Campanha (opcional)</label>
                <input
                  type="text"
                  value={importCampanha}
                  onChange={(e) => setImportCampanha(e.target.value)}
                  placeholder="Nome da campanha"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Textos (um por linha)</label>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Cole os textos, um por linha..."
                  className="w-full h-48 px-3 py-2 rounded-lg border border-border bg-background font-mono text-sm"
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-lg border border-border hover:bg-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleImport}
                disabled={importing || !importData.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
              >
                {importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Importar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
