/**
 * Conversões (Sheets/Google Ads) - GCLID + exportação para Google Sheets
 */
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  ExternalLink,
  Copy,
  Beaker,
} from 'lucide-react';
import { toast } from 'sonner';

const SYNC_SERVER_URL = import.meta.env.VITE_SYNC_SERVER_URL || 'http://localhost:3001';
const SYNC_SERVER_API_KEY = import.meta.env.VITE_SYNC_SERVER_API_KEY || null;

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  if (SYNC_SERVER_API_KEY) headers.set('X-API-Key', SYNC_SERVER_API_KEY);
  return fetch(url, { ...options, headers });
}

interface IntegrationConfig {
  id?: number;
  spreadsheet_id: string;
  worksheet_name: string;
  conversion_name: string;
  default_conversion_value: number | null;
  currency: string;
  is_enabled: boolean;
  schedule_times: string[] | null;
  last_test_status?: string;
  last_test_message?: string;
  last_test_at?: string | null;
  last_write_at?: string | null;
  last_export_at?: string | null;
  has_credentials: boolean;
  client_email?: string | null;
}

interface TestResult {
  ok: boolean;
  checks: {
    canRead: boolean;
    canWrite: boolean;
    hasPermission: boolean;
    sheetExists: boolean;
    headerOk: boolean;
  };
  lastTestAt: string;
  message: string;
}

interface Conversion {
  id: number;
  ticket_id: string | null;
  gclid: string | null;
  conversion_name: string;
  conversion_time: string;
  conversion_value: number;
  conversion_currency: string;
  status: string;
  exported_at: string | null;
  error_message: string | null;
}

interface Diagnostic {
  pending: number;
  exportedToday: number;
  lastError: string | null;
  recentTicketsWithGclid: number;
  lastExportAt: string | null;
  hasCredentials: boolean;
}

const SCHEDULE_OPTIONS = ['00:00', '06:00', '12:00', '18:00'];

const STORAGE_KEY_CLIENT_EMAIL = 'sheets_service_client_email';

/** Fallback quando credenciais existem mas extração falha (ex: decrypt no servidor) */
const DEFAULT_SERVICE_ACCOUNT_EMAIL = 'sheets-writer@guia-central-488321.iam.gserviceaccount.com';

function extractClientEmailFromJson(jsonStr: string | undefined): string | null {
  if (!jsonStr?.trim()) return null;
  try {
    const parsed = JSON.parse(jsonStr.trim()) as { client_email?: string };
    const email = parsed?.client_email;
    return typeof email === 'string' && email.length > 0 ? email : null;
  } catch {
    return null;
  }
}

export function ConversoesSheets() {
  const [config, setConfig] = useState<IntegrationConfig | null>(null);
  const [form, setForm] = useState<Partial<IntegrationConfig> & { service_account_json?: string }>({});
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [diagnostic, setDiagnostic] = useState<Diagnostic | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({ status: '', hasGclid: '' });
  const [clearing, setClearing] = useState(false);

  const [serviceAccountEmail, setServiceAccountEmail] = useState<string | null>(null);
  const [serviceAccountJsonValid, setServiceAccountJsonValid] = useState<boolean | null>(null);
  const [testStatus, setTestStatus] = useState<TestResult | null>(null);
  const [testingWrite, setTestingWrite] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${SYNC_SERVER_URL}/admin/sheets/config`);
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        if (data) {
          setForm((prev) => ({
            ...prev,
            spreadsheet_id: data.spreadsheet_id ?? prev.spreadsheet_id ?? '',
            worksheet_name: data.worksheet_name ?? prev.worksheet_name ?? 'Conversões',
            conversion_name: data.conversion_name ?? prev.conversion_name ?? 'COMPRA',
            default_conversion_value: data.default_conversion_value ?? prev.default_conversion_value ?? null,
            currency: data.currency ?? prev.currency ?? 'BRL',
            is_enabled: data.is_enabled ?? prev.is_enabled ?? false,
            schedule_times: data.schedule_times ?? prev.schedule_times ?? ['06:00', '12:00', '18:00'],
          }));
          const email = data.client_email || (data.has_credentials ? DEFAULT_SERVICE_ACCOUNT_EMAIL : null);
          if (email) {
            setServiceAccountEmail(email);
            setServiceAccountJsonValid(true);
            try {
              localStorage.setItem(STORAGE_KEY_CLIENT_EMAIL, email);
            } catch {
              /* ignore */
            }
          }
        }
      } else setConfig(null);
    } catch (e) {
      toast.error('Erro ao carregar configuração');
      setConfig(null);
    }
  }, []);

  const loadConversions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.hasGclid) params.set('hasGclid', filters.hasGclid);
      params.set('limit', '200');
      const res = await fetchWithAuth(`${SYNC_SERVER_URL}/admin/sheets/conversions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setConversions(data);
      }
    } catch (e) {
      toast.error('Erro ao carregar conversões');
    }
  }, [filters.status, filters.hasGclid]);

  const loadDiagnostic = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${SYNC_SERVER_URL}/admin/sheets/diagnostic`);
      if (res.ok) {
        const data = await res.json();
        setDiagnostic(data);
      }
    } catch (e) {
      setDiagnostic(null);
    }
  }, []);

  const runTest = useCallback(async () => {
    setTesting(true);
    try {
      const res = await fetchWithAuth(`${SYNC_SERVER_URL}/admin/sheets/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheet_id: form.spreadsheet_id || config?.spreadsheet_id,
          worksheet_name: form.worksheet_name || config?.worksheet_name,
          service_account_json: form.service_account_json?.trim() || undefined,
        }),
      });
      const data = await res.json();
      setTestStatus(data);
      if (data.ok) {
        toast.success('Google Sheets: CONECTADO');
        await loadConfig();
      } else {
        toast.error(data.message || 'Falha no teste');
      }
    } catch (e) {
      toast.error('Erro ao testar');
    } finally {
      setTesting(false);
    }
  }, [form.spreadsheet_id, form.worksheet_name, form.service_account_json, config?.spreadsheet_id, config?.worksheet_name, loadConfig]);

  const runTestWrite = useCallback(async () => {
    setTestingWrite(true);
    try {
      const res = await fetchWithAuth(`${SYNC_SERVER_URL}/admin/sheets/test-write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheet_id: form.spreadsheet_id || config?.spreadsheet_id,
          worksheet_name: form.worksheet_name || config?.worksheet_name,
          service_account_json: form.service_account_json?.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success('Linha de teste escrita');
        await loadConfig();
        if (testStatus) setTestStatus((s) => (s ? { ...s, checks: { ...s.checks, canWrite: true }, ok: s.checks.canRead && s.checks.hasPermission && s.checks.headerOk } : s));
      } else {
        toast.error(data.message || 'Falha ao escrever');
      }
    } catch (e) {
      toast.error('Erro ao escrever');
    } finally {
      setTestingWrite(false);
    }
  }, [form.spreadsheet_id, form.worksheet_name, form.service_account_json, config, testStatus, loadConfig]);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_CLIENT_EMAIL);
      if (cached && typeof cached === 'string' && cached.length > 0) {
        setServiceAccountEmail(cached);
        setServiceAccountJsonValid(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadConfig(), loadConversions(), loadDiagnostic()]);
      setLoading(false);
    };
    load();
  }, [loadConfig, loadDiagnostic]);

  useEffect(() => {
    if (loading) return;
    const spreadsheetId = form.spreadsheet_id || config?.spreadsheet_id;
    const hasCreds = form.service_account_json?.trim() || config?.has_credentials;
    if (spreadsheetId && hasCreds) {
      fetchWithAuth(`${SYNC_SERVER_URL}/admin/sheets/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheet_id: spreadsheetId,
          worksheet_name: form.worksheet_name || config?.worksheet_name,
          service_account_json: form.service_account_json?.trim() || undefined,
        }),
      })
        .then((r) => r.json())
        .then((data) => setTestStatus(data))
        .catch(() => setTestStatus(null));
    } else {
      setTestStatus(null);
    }
  }, [loading, form.spreadsheet_id, form.worksheet_name, form.service_account_json, config?.spreadsheet_id, config?.worksheet_name, config?.has_credentials]);

  useEffect(() => {
    loadConversions();
  }, [loadConversions]);

  useEffect(() => {
    const json = form.service_account_json;
    if (!json?.trim()) {
      const fromConfig = config?.client_email;
      const fromStorage = (() => {
        try {
          return localStorage.getItem(STORAGE_KEY_CLIENT_EMAIL);
        } catch {
          return null;
        }
      })();
      const fromDefault = config?.has_credentials ? DEFAULT_SERVICE_ACCOUNT_EMAIL : null;
      const fallback = fromConfig || fromStorage || fromDefault;
      if (fallback) {
        setServiceAccountEmail(fallback);
        setServiceAccountJsonValid(true);
      } else {
        setServiceAccountEmail(null);
        setServiceAccountJsonValid(null);
      }
      return;
    }
    const email = extractClientEmailFromJson(json);
    if (email) {
      setServiceAccountEmail(email);
      setServiceAccountJsonValid(true);
      try {
        localStorage.setItem(STORAGE_KEY_CLIENT_EMAIL, email);
      } catch {
        /* ignore */
      }
    } else {
      setServiceAccountEmail(null);
      setServiceAccountJsonValid(false);
    }
  }, [form.service_account_json, config?.client_email]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetchWithAuth(`${SYNC_SERVER_URL}/admin/sheets/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          spreadsheet_id: form.spreadsheet_id || '',
          worksheet_name: form.worksheet_name || 'Conversões',
          conversion_name: form.conversion_name || 'COMPRA',
          default_conversion_value: form.default_conversion_value ?? null,
          currency: form.currency || 'BRL',
          is_enabled: form.is_enabled ?? false,
          schedule_times: form.schedule_times || [],
          service_account_json: form.service_account_json?.trim() || undefined,
        }),
      });
      if (res.ok) {
        toast.success('Configuração salva');
        await loadConfig();
        await loadDiagnostic();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Erro ao salvar');
      }
    } catch (e) {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };


  const handleExportNow = async () => {
    setExporting(true);
    try {
      const res = await fetchWithAuth(`${SYNC_SERVER_URL}/admin/sheets/export-now`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success(`Exportadas ${data.exported || 0} conversões`);
      } else {
        toast.error(data.reason || data.error || 'Erro na exportação');
      }
      await loadConversions();
      await loadDiagnostic();
    } catch (e) {
      toast.error('Erro ao exportar');
    } finally {
      setExporting(false);
    }
  };

  const handleReexport = async (id: number) => {
    try {
      const res = await fetchWithAuth(`${SYNC_SERVER_URL}/admin/sheets/conversions/${id}/reexport`, { method: 'POST' });
      if (res.ok) {
        toast.success('Marcado para reexportar');
        await loadConversions();
      }
    } catch (e) {
      toast.error('Erro');
    }
  };

  const handleSkip = async (id: number) => {
    try {
      const res = await fetchWithAuth(`${SYNC_SERVER_URL}/admin/sheets/conversions/${id}/skip`, { method: 'POST' });
      if (res.ok) {
        toast.success('Marcado como ignorado');
        await loadConversions();
      }
    } catch (e) {
      toast.error('Erro');
    }
  };

  const handleCreateTest = async () => {
    try {
      const res = await fetchWithAuth(`${SYNC_SERVER_URL}/admin/sheets/test-conversion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Conversão de teste criada');
        await loadConversions();
        await loadDiagnostic();
      } else {
        toast.error(data.error || 'Erro');
      }
    } catch (e) {
      toast.error('Erro');
    }
  };

  const handleClearWorksheet = async () => {
    if (!window.confirm('Tem certeza? Isso apagará todos os dados da planilha (exceto o header).')) return;
    setClearing(true);
    try {
      const res = await fetchWithAuth(`${SYNC_SERVER_URL}/admin/sheets/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Planilha limpa');
      } else {
        toast.error(data.message || 'Erro ao limpar');
      }
    } catch (e) {
      toast.error('Erro ao limpar');
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Sheet className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Conversões (GCLID + Sheets)</h1>
          <p className="text-muted-foreground">Click ID, conversões offline e exportação para Google Sheets</p>
        </div>
      </div>

      {/* Status Card - Google Sheets CONECTADO / NÃO CONECTADO */}
      <Card className={testStatus?.ok ? 'border-green-500/60' : 'border-muted'}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Google Sheets
            {testStatus?.ok ? (
              <span className="text-green-600 font-semibold">CONECTADO ✅</span>
            ) : testStatus !== null ? (
              <span className="text-destructive font-semibold">NÃO CONECTADO ❌</span>
            ) : (
              <span className="text-muted-foreground text-sm">Aguardando teste...</span>
            )}
          </CardTitle>
          <CardDescription>
            {testStatus?.ok
              ? 'Leitura e escrita OK. Dados exportados para a planilha (upload no Google Ads é manual).'
              : testStatus?.message || 'Salve a configuração e teste a conexão.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {testStatus && (
            <div className="flex flex-wrap gap-3 text-sm">
              <span className={testStatus.checks?.canRead ? 'text-green-600' : 'text-muted-foreground'}>
                {testStatus.checks?.canRead ? '✓' : '○'} Leitura
              </span>
              <span className={testStatus.checks?.hasPermission ? 'text-green-600' : 'text-muted-foreground'}>
                {testStatus.checks?.hasPermission ? '✓' : '○'} Permissão
              </span>
              <span className={testStatus.checks?.sheetExists ? 'text-green-600' : 'text-muted-foreground'}>
                {testStatus.checks?.sheetExists ? '✓' : '○'} Aba
              </span>
              <span className={testStatus.checks?.headerOk ? 'text-green-600' : 'text-muted-foreground'}>
                {testStatus.checks?.headerOk ? '✓' : '○'} Header
              </span>
              <span className={testStatus.checks?.canWrite ? 'text-green-600' : 'text-muted-foreground'}>
                {testStatus.checks?.canWrite ? '✓' : '○'} Escrita
              </span>
            </div>
          )}
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {config?.last_test_at && <span>Último teste: {new Date(config.last_test_at).toLocaleString('pt-BR')}</span>}
            {config?.last_write_at && <span>• Última escrita OK: {new Date(config.last_write_at).toLocaleString('pt-BR')}</span>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={runTest} disabled={testing}>
              {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Re-testar conexão
            </Button>
            <Button variant="outline" size="sm" onClick={runTestWrite} disabled={testingWrite}>
              {testingWrite ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
              Escrever linha teste
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Diagnóstico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Diagnóstico</CardTitle>
          <CardDescription>Status rápido do sistema</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">GCLID recente (últimos 50 pedidos):</span>
            <span className="font-medium">{diagnostic?.recentTicketsWithGclid ?? 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Pendentes (capturadas, não exportadas):</span>
            <span className="font-medium">{diagnostic?.pending ?? 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Escritas na planilha hoje:</span>
            <span className="font-medium">{diagnostic?.exportedToday ?? 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Última exportação:</span>
            <span className="font-medium">{diagnostic?.lastExportAt || '—'}</span>
          </div>
          {diagnostic?.lastError && (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{diagnostic.lastError}</span>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={handleCreateTest}>
            <Beaker className="w-4 h-4 mr-2" />
            Criar conversão teste
          </Button>
        </CardContent>
      </Card>

      {/* Service Account (fixo, copiável) */}
      <Card
        className={
          serviceAccountJsonValid === true
            ? 'border-green-500/60'
            : serviceAccountJsonValid === false
            ? 'border-destructive/60'
            : ''
        }
      >
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Service Account (Google Sheets)
            {serviceAccountJsonValid === true && <CheckCircle2 className="w-5 h-5 text-green-500" />}
            {serviceAccountJsonValid === false && <XCircle className="w-5 h-5 text-destructive" />}
          </CardTitle>
          <CardDescription>
            E-mail para compartilhar a planilha no Google Sheets com permissão de Editor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                type="text"
                value={serviceAccountEmail || DEFAULT_SERVICE_ACCOUNT_EMAIL}
                readOnly
                className={
                  serviceAccountJsonValid === true
                    ? 'border-green-500/60 bg-green-50/50 dark:bg-green-950/20'
                    : serviceAccountJsonValid === false
                    ? 'border-destructive/60'
                    : 'border-green-500/60 bg-green-50/50 dark:bg-green-950/20'
                }
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const email = serviceAccountEmail || DEFAULT_SERVICE_ACCOUNT_EMAIL;
                  navigator.clipboard.writeText(email);
                  toast.success('E-mail copiado');
                }}
                title="Copiar e-mail"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            {serviceAccountJsonValid === false && (
              <p className="text-sm text-muted-foreground">JSON inválido — use o e-mail acima para compartilhar a planilha</p>
            )}
            <p className="text-xs text-muted-foreground">
              Use este e-mail para compartilhar a planilha no Google Sheets com permissão de Editor
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Configuração */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuração do Google Sheets</CardTitle>
          <CardDescription>Service Account e planilha para exportação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Spreadsheet ID</Label>
              <Input
                value={form.spreadsheet_id || ''}
                onChange={(e) => setForm((f) => ({ ...f, spreadsheet_id: e.target.value }))}
                placeholder="ID da planilha (da URL)"
              />
            </div>
            <div>
              <Label>Worksheet/Tab</Label>
              <Input
                value={form.worksheet_name || 'Conversões'}
                onChange={(e) => setForm((f) => ({ ...f, worksheet_name: e.target.value }))}
                placeholder="Conversões"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Conversion Name (Google Ads)</Label>
              <Input
                value={form.conversion_name || 'COMPRA'}
                onChange={(e) => setForm((f) => ({ ...f, conversion_name: e.target.value }))}
                placeholder="COMPRA"
              />
            </div>
            <div>
              <Label>Valor padrão (opcional)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.default_conversion_value ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, default_conversion_value: e.target.value ? parseFloat(e.target.value) : null }))}
                placeholder="39.90"
              />
            </div>
          </div>
          <div>
            <Label>Currency (read-only)</Label>
            <Input value="BRL" disabled className="bg-muted" />
          </div>
          <div>
            <Label>Service Account JSON</Label>
            <Textarea
              value={form.service_account_json ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, service_account_json: e.target.value }))}
              placeholder='{"type":"service_account","client_email":"...","private_key":"..."}'
              rows={4}
              className="font-mono text-xs"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_enabled ?? false}
                onCheckedChange={(c) => setForm((f) => ({ ...f, is_enabled: c }))}
              />
              <Label>Exportar automaticamente</Label>
            </div>
          </div>
          <div>
            <Label>Horários (1–6 por dia)</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {SCHEDULE_OPTIONS.map((t) => {
                const selected = (form.schedule_times || []).includes(t);
                return (
                  <Button
                    key={t}
                    variant={selected ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const current = form.schedule_times || [];
                      const next = selected ? current.filter((x) => x !== t) : [...current, t].slice(0, 6).sort();
                      setForm((f) => ({ ...f, schedule_times: next }));
                    }}
                  >
                    {t}
                  </Button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
              Salvar configuração
            </Button>
            <Button variant="outline" onClick={handleExportNow} disabled={exporting}>
              {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Exportar agora
            </Button>
            <Button variant="outline" onClick={handleClearWorksheet} disabled={clearing} className="text-destructive hover:text-destructive">
              {clearing ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
              Limpar planilha
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modelo (header) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Modelo (Header)</CardTitle>
          <CardDescription>Header da planilha. O upload para Google Ads é feito manualmente.</CardDescription>
        </CardHeader>
        <CardContent>
          <code className="block p-3 bg-muted rounded text-sm font-mono break-all">
            Google Click ID,Conversion Name,Conversion Time,Conversion Value,Conversion Currency
          </code>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => {
              const header = 'Google Click ID,Conversion Name,Conversion Time,Conversion Value,Conversion Currency';
              navigator.clipboard.writeText(header);
              toast.success('Header copiado');
            }}
          >
            <Copy className="w-4 h-4 mr-2" />
            Copiar header
          </Button>
        </CardContent>
      </Card>

      {/* Tabela de conversões */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Conversões</CardTitle>
          <CardDescription>Listagem interna com filtros</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <select
              className="border rounded px-2 py-1 text-sm"
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="">Todos os status</option>
              <option value="PENDING">PENDING</option>
              <option value="PENDING_NO_CLICKID">PENDING_NO_CLICKID</option>
              <option value="EXPORTED">EXPORTED</option>
              <option value="ERROR">ERROR</option>
              <option value="SKIPPED">SKIPPED</option>
            </select>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={filters.hasGclid}
              onChange={(e) => setFilters((f) => ({ ...f, hasGclid: e.target.value }))}
            >
              <option value="">Todos</option>
              <option value="true">Com GCLID</option>
              <option value="false">Sem GCLID</option>
            </select>
            <Button variant="outline" size="sm" onClick={() => loadConversions()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Pedido</TableHead>
                  <TableHead>GCLID</TableHead>
                  <TableHead>Conversion Name</TableHead>
                  <TableHead>Conversion Time</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Exportado?</TableHead>
                  <TableHead>Exportado em</TableHead>
                  <TableHead>Erro</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversions.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.id}</TableCell>
                    <TableCell>
                      {c.ticket_id?.startsWith('ticket-') || c.ticket_id?.startsWith('TK-') ? (
                        <a
                          href="#"
                          className="text-primary hover:underline"
                          onClick={(e) => {
                            e.preventDefault();
                            // Navegar para ticket se houver
                          }}
                        >
                          {c.ticket_id}
                        </a>
                      ) : (
                        c.ticket_id || '—'
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{c.gclid || '—'}</TableCell>
                    <TableCell>{c.conversion_name}</TableCell>
                    <TableCell className="text-sm">{c.conversion_time?.slice(0, 19)}</TableCell>
                    <TableCell>{c.conversion_value}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          c.status === 'EXPORTED'
                            ? 'bg-green-100 text-green-800'
                            : c.status === 'PENDING' || c.status === 'PENDING_NO_CLICKID'
                            ? 'bg-yellow-100 text-yellow-800'
                            : c.status === 'ERROR'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {c.status === 'EXPORTED' ? 'Escrito' : c.status === 'PENDING' || c.status === 'PENDING_NO_CLICKID' ? 'Pendente' : c.status}
                      </span>
                    </TableCell>
                    <TableCell>{c.status === 'EXPORTED' ? 'Sim' : 'Não'}</TableCell>
                    <TableCell className="text-sm">{c.exported_at?.slice(0, 19) || '—'}</TableCell>
                    <TableCell className="text-xs text-destructive max-w-[150px] truncate" title={c.error_message || ''}>
                      {c.error_message || '—'}
                    </TableCell>
                    <TableCell>
                      {c.status === 'EXPORTED' && (
                        <Button variant="ghost" size="sm" onClick={() => handleReexport(c.id)}>
                          Reexportar
                        </Button>
                      )}
                      {(c.status === 'PENDING' || c.status === 'ERROR') && (
                        <Button variant="ghost" size="sm" onClick={() => handleSkip(c.id)}>
                          Ignorar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {conversions.length === 0 && (
            <p className="text-sm text-muted-foreground py-4">Nenhuma conversão encontrada.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
