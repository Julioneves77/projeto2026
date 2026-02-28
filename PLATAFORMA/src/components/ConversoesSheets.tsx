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
  Copy,
  Beaker,
} from 'lucide-react';
import { toast } from 'sonner';
import { safeStorage } from '@/lib/safeStorage';

const SYNC_SERVER_URL = import.meta.env.VITE_SYNC_SERVER_URL || 'http://localhost:3001';
const SYNC_SERVER_API_KEY = import.meta.env.VITE_SYNC_SERVER_API_KEY || null;

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  if (SYNC_SERVER_API_KEY) headers.set('X-API-Key', SYNC_SERVER_API_KEY);
  return fetch(url, { ...options, headers });
}

async function safeJson<T = unknown>(res: Response): Promise<T> {
  const text = await res.text();
  if (text.trim().startsWith('<')) {
    throw new Error(res.ok ? 'Resposta inválida' : `Erro ${res.status}: API indisponível`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('Resposta inválida do servidor');
  }
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
    paramsOk?: boolean;
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
  configOk?: boolean;
  hasSpreadsheetId?: boolean;
  canDecryptCredentials?: boolean;
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

/** Extrai o Spreadsheet ID de uma URL do Google Sheets */
function extractSpreadsheetIdFromUrl(urlOrId: string): string {
  const trimmed = (urlOrId || '').trim();
  const match = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : trimmed;
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
  const [filters, setFilters] = useState({ status: 'PENDING', hasGclid: '' });
  const [clearing, setClearing] = useState(false);
  const [creatingTest, setCreatingTest] = useState(false);
  const [apiOffline, setApiOffline] = useState(false);

  const [serviceAccountEmail, setServiceAccountEmail] = useState<string | null>(null);
  const [serviceAccountJsonValid, setServiceAccountJsonValid] = useState<boolean | null>(null);
  const [testStatus, setTestStatus] = useState<TestResult | null>(null);
  const [testingWrite, setTestingWrite] = useState(false);
  const [lastActionResult, setLastActionResult] = useState<{
    action: 'test' | 'test-write' | 'export' | 'save';
    ok: boolean;
    message: string;
    at: string;
    sheetUrl?: string;
    allTabNames?: string[];
    updatedRange?: string;
    spreadsheetId?: string;
    writtenRow?: { gclid: string; conversion_name: string; conversion_time: string; conversion_value: string; conversion_currency: string };
  } | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${SYNC_SERVER_URL}/admin/sheets/config`);
      setApiOffline(res.status === 502 || res.status === 503);
      if (res.ok) setApiOffline(false);
      if (res.ok) {
        const data = await safeJson<IntegrationConfig | null>(res);
        setConfig(data);
        if (data) {
          const scheduleTimes = Array.isArray(data.schedule_times)
            ? data.schedule_times
            : (data.schedule_times ? [data.schedule_times] : ['06:00', '12:00', '18:00']);
          setForm((prev) => ({
            ...prev,
            spreadsheet_id: data.spreadsheet_id ?? prev.spreadsheet_id ?? '',
            worksheet_name: data.worksheet_name ?? prev.worksheet_name ?? 'Página1',
            conversion_name: data.conversion_name ?? prev.conversion_name ?? 'COMPRA',
            default_conversion_value: data.default_conversion_value ?? prev.default_conversion_value ?? null,
            currency: data.currency ?? prev.currency ?? 'BRL',
            is_enabled: Boolean(data.is_enabled),
            schedule_times: scheduleTimes,
          }));
          const email = data.client_email || (data.has_credentials ? DEFAULT_SERVICE_ACCOUNT_EMAIL : null);
          if (email) {
            setServiceAccountEmail(email);
            setServiceAccountJsonValid(true);
            safeStorage.setItem(STORAGE_KEY_CLIENT_EMAIL, email);
          }
        }
      } else setConfig(null);
    } catch (e) {
      toast.error('Erro ao carregar configuração');
      setConfig(null);
    }
  }, []);

  const loadConversions = useCallback(async (overrideFilters?: { status?: string; hasGclid?: string }, cacheBust?: boolean) => {
    try {
      const params = new URLSearchParams();
      const status = overrideFilters?.status ?? filters.status;
      const hasGclid = overrideFilters?.hasGclid ?? filters.hasGclid;
      if (status) params.set('status', status);
      if (hasGclid) params.set('hasGclid', hasGclid);
      params.set('limit', '200');
      if (cacheBust) params.set('_t', String(Date.now()));
      const res = await fetchWithAuth(`${SYNC_SERVER_URL}/admin/sheets/conversions?${params}`);
      if (res.status === 502 || res.status === 503) setApiOffline(true);
      else if (res.ok) setApiOffline(false);
      if (res.ok) {
        const data = await safeJson<Conversion[]>(res);
        setConversions(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      toast.error('Erro ao carregar conversões');
    }
  }, [filters.status, filters.hasGclid]);

  const loadDiagnostic = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${SYNC_SERVER_URL}/admin/sheets/diagnostic`);
      if (res.status === 502 || res.status === 503) setApiOffline(true);
      else if (res.ok) setApiOffline(false);
      if (res.ok) {
        const data = await safeJson<Diagnostic | null>(res);
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
      const data = await safeJson<TestResult>(res);
      setTestStatus(data);
      setLastActionResult({
        action: 'test',
        ok: !!data.ok,
        message: data.ok ? 'Conexão OK' : (data.message || 'Falha no teste'),
        at: new Date().toISOString(),
      });
      if (data.ok) {
        toast.success('Google Sheets: CONECTADO');
        await loadConfig();
      } else {
        toast.error(data.message || 'Falha no teste');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao testar';
      setLastActionResult({ action: 'test', ok: false, message: msg, at: new Date().toISOString() });
      toast.error('Erro ao testar');
    } finally {
      setTesting(false);
    }
  }, [form.spreadsheet_id, form.worksheet_name, form.service_account_json, config?.spreadsheet_id, config?.worksheet_name, loadConfig]);

  const runTestWrite = useCallback(async () => {
    setTestingWrite(true);
    try {
      const res = await fetchWithAuth(`${SYNC_SERVER_URL}/admin/sheets/test-conversion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true, variant: 'write-test' }),
      });
      const data = await safeJson<{ success?: boolean; message?: string; error?: string }>(res);
      const ok = !!data?.success;
      setLastActionResult({
        action: 'test-write',
        ok,
        message: ok ? (data.message || 'Linha de teste adicionada') : (data.error || data.message || 'Falha'),
        at: new Date().toISOString(),
      });
      if (ok) {
        toast.success(data.message, { duration: 5000 });
        setFilters((f) => ({ ...f, status: 'PENDING' }));
        await loadConversions({ status: 'PENDING', hasGclid: '' }, true);
        await loadDiagnostic();
        document.getElementById('tabela-conversoes')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        toast.error(data.error || data.message || 'Falha');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro';
      setLastActionResult({ action: 'test-write', ok: false, message: msg, at: new Date().toISOString() });
      toast.error('Erro ao adicionar linha de teste');
    } finally {
      setTestingWrite(false);
    }
  }, [loadConversions, loadDiagnostic]);

  useEffect(() => {
    const cached = safeStorage.getItem(STORAGE_KEY_CLIENT_EMAIL);
    if (cached && typeof cached === 'string' && cached.length > 0) {
      setServiceAccountEmail(cached);
      setServiceAccountJsonValid(true);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        await Promise.all([loadConfig(), loadConversions(), loadDiagnostic()]);
      } catch (e) {
        toast.error('Erro ao carregar. Verifique se a API está online.');
      } finally {
        setLoading(false);
      }
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
        .then((r) => safeJson<TestResult>(r))
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
      const fromStorage = safeStorage.getItem(STORAGE_KEY_CLIENT_EMAIL);
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
      safeStorage.setItem(STORAGE_KEY_CLIENT_EMAIL, email);
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
          worksheet_name: form.worksheet_name || 'Página1',
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
        const err = await safeJson<{ error?: string }>(res);
        toast.error(err?.error || 'Erro ao salvar');
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
      const res = await fetchWithAuth(`${SYNC_SERVER_URL}/admin/sheets/export-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheet_id: form.spreadsheet_id || config?.spreadsheet_id,
          worksheet_name: form.worksheet_name || config?.worksheet_name,
          service_account_json: form.service_account_json?.trim() || undefined,
        }),
      });
      const data = await safeJson<{ success?: boolean; exported?: number; reason?: string; error?: string }>(res);
      const ok = !!data.success;
      const msg = ok
        ? (data.exported > 0 ? `Exportadas ${data.exported} conversões` : 'Nenhuma conversão pendente')
        : (data.reason || data.error || 'Erro na exportação');
      setLastActionResult({ action: 'export', ok, message: msg, at: new Date().toISOString() });
      if (ok) {
        toast.success(msg);
        setFilters((f) => ({ ...f, status: 'PENDING' }));
        await loadConversions({ status: 'PENDING', hasGclid: filters.hasGclid }, true);
      } else {
        toast.error(msg);
      }
      await loadDiagnostic();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao exportar';
      setLastActionResult({ action: 'export', ok: false, message: msg, at: new Date().toISOString() });
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
        await loadConversions(undefined, true);
      }
    } catch (e) {
      toast.error('Erro');
    }
  };

  const handleCreateTest = async () => {
    if (creatingTest) return;
    setCreatingTest(true);
    try {
      const res = await fetchWithAuth(`${SYNC_SERVER_URL}/admin/sheets/test-conversion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      });
      const data = await safeJson<{ success?: boolean; error?: string }>(res);
      if (data?.success) {
        toast.success('Conversão de teste criada. Verifique a tabela abaixo.', { duration: 5000 });
        setFilters({ status: 'PENDING', hasGclid: '' });
        await loadConversions({ status: 'PENDING', hasGclid: '' }, true);
        await loadDiagnostic();
        await new Promise((r) => setTimeout(r, 500));
        await loadConversions({ status: 'PENDING', hasGclid: '' }, true);
        document.getElementById('tabela-conversoes')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        toast.error(data.error || 'Erro');
      }
    } catch (e) {
      toast.error('Erro ao criar conversão de teste');
    } finally {
      setCreatingTest(false);
    }
  };

  const handleClearWorksheet = async () => {
    if (!window.confirm('Tem certeza? Isso apagará todos os dados da aba configurada (exceto o header).')) return;
    setClearing(true);
    try {
      const res = await fetchWithAuth(`${SYNC_SERVER_URL}/admin/sheets/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      });
      const data = await safeJson<{ success?: boolean; message?: string; error?: string }>(res);
      if (data?.success) {
        toast.success(data.message || 'Planilha limpa');
        await loadDiagnostic();
      } else {
        toast.error(data?.message || data?.error || 'Erro ao limpar');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao limpar');
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
      {apiOffline && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-destructive shrink-0" />
              <div>
                <p className="font-semibold text-destructive">API indisponível (502 Bad Gateway)</p>
                <p className="text-sm text-muted-foreground mt-1">
                  O sync-server não está respondendo. A tabela e os dados não carregam. Verifique no servidor: <code className="bg-muted px-1 rounded">pm2 status</code> e <code className="bg-muted px-1 rounded">pm2 logs sync-server</code>. Reinicie com <code className="bg-muted px-1 rounded">pm2 restart sync-server</code>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
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
              <span className={testStatus.checks?.paramsOk !== false ? 'text-green-600' : 'text-muted-foreground'}>
                {testStatus.checks?.paramsOk !== false ? '✓' : '○'} A1
              </span>
              <span className={testStatus.checks?.headerOk ? 'text-green-600' : 'text-muted-foreground'}>
                {testStatus.checks?.headerOk ? '✓' : '○'} Header
              </span>
              <span className={testStatus.checks?.canWrite ? 'text-green-600' : 'text-muted-foreground'}>
                {testStatus.checks?.canWrite ? '✓' : '○'} Escrita
              </span>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Cria conversão de teste no banco (nunca será exportada). Use para validar a tabela na plataforma.
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {config?.last_test_at && <span>Último teste: {new Date(config.last_test_at).toLocaleString('pt-BR')}</span>}
            {config?.last_write_at && <span>• Última escrita OK: {new Date(config.last_write_at).toLocaleString('pt-BR')}</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={runTest} disabled={testing}>
              {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Re-testar conexão
            </Button>
            <Button variant="outline" size="sm" onClick={runTestWrite} disabled={testingWrite}>
              {testingWrite ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
              Criar conversão teste (nunca exportada)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Último resultado - tabela de preview da linha escrita */}
      {lastActionResult && (
        <Card className={lastActionResult.ok ? 'border-green-500/60' : 'border-destructive'}>
          <CardHeader className="py-3">
            <CardTitle className="text-base flex items-center gap-2">
              {lastActionResult.ok ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-destructive" />}
              Último resultado
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <p className={`text-sm font-medium ${lastActionResult.ok ? 'text-green-700 dark:text-green-400' : 'text-destructive'}`}>
              {lastActionResult.message}
            </p>
            {lastActionResult.action === 'test-write' && lastActionResult.ok && (
              <div className="rounded-md border overflow-hidden">
                <p className="text-xs font-medium p-2 bg-muted/50">
                  Conversão de teste criada no banco. Nunca será exportada para a planilha.
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Google Click ID</TableHead>
                      <TableHead>Conversion Name</TableHead>
                      <TableHead>Conversion Time</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Currency</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-mono">TEST-CONN</TableCell>
                      <TableCell>TEST</TableCell>
                      <TableCell>{new Date().toLocaleString('pt-BR')}</TableCell>
                      <TableCell>0.01</TableCell>
                      <TableCell>BRL</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
            {lastActionResult.action === 'test-write' && lastActionResult.sheetUrl && (
              <div className="space-y-2">
                <a
                  href={lastActionResult.sheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Abrir planilha no Google Sheets
                </a>
                <p className="text-xs text-muted-foreground">
                  {lastActionResult.spreadsheetId && (
                    <>Planilha ID: <code className="bg-muted px-1 rounded">{lastActionResult.spreadsheetId}</code></>
                  )}
                  {lastActionResult.allTabNames && lastActionResult.allTabNames.length > 0 && (
                    <> • Abas: {lastActionResult.allTabNames.join(', ')}</>
                  )}
                  {lastActionResult.updatedRange && ` • Célula: ${lastActionResult.updatedRange}`}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Se não vê os dados: (1) Confira se a URL é da sua planilha final. (2) Verifique se está na aba correta.
                </p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Ação: {lastActionResult.action === 'test' ? 'Teste de conexão' : lastActionResult.action === 'test-write' ? 'Escrever linha teste' : lastActionResult.action === 'export' ? 'Exportar agora' : 'Salvar'} • {new Date(lastActionResult.at).toLocaleString('pt-BR')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Diagnóstico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Diagnóstico</CardTitle>
          <CardDescription>Status rápido do sistema</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          {diagnostic && diagnostic.configOk === false && (
            <div className="w-full p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-sm">
              <strong>Configuração incompleta:</strong>
              {!diagnostic.hasSpreadsheetId && ' Spreadsheet ID não salvo. '}
              {!diagnostic.hasCredentials && ' JSON da Service Account não salvo. '}
              {diagnostic.hasCredentials && !diagnostic.canDecryptCredentials && ' Credenciais não decriptam (verifique SHEETS_CREDENTIALS_ENCRYPTION_KEY no servidor). '}
              Salve a configuração com todos os campos e tente novamente.
            </div>
          )}
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
          <Button variant="outline" size="sm" onClick={handleCreateTest} disabled={creatingTest}>
            {creatingTest ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Beaker className="w-4 h-4 mr-2" />}
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

      {/* Planilha de destino - link direto */}
      {(form.spreadsheet_id || config?.spreadsheet_id) && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base">Planilha de destino</CardTitle>
            <CardDescription>Os dados são escritos nesta planilha. Confira se é a planilha correta.</CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href={`https://docs.google.com/spreadsheets/d/${form.spreadsheet_id || config?.spreadsheet_id}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Abrir planilha no Google Sheets
            </a>
            <p className="text-xs text-muted-foreground mt-2">
              Aba configurada: <strong>{form.worksheet_name || config?.worksheet_name || 'Página1'}</strong>. Os dados entram nesta aba (a primeira aba ao abrir = Página1).
            </p>
          </CardContent>
        </Card>
      )}

      {/* Configuração */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuração do Google Sheets</CardTitle>
          <CardDescription>Service Account e planilha para exportação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Spreadsheet ID ou URL</Label>
              <Input
                value={form.spreadsheet_id || ''}
                onChange={(e) => {
                  const v = e.target.value;
                  const id = v.includes('docs.google.com') || v.includes('/d/') ? extractSpreadsheetIdFromUrl(v) : v;
                  setForm((f) => ({ ...f, spreadsheet_id: id || v }));
                }}
                placeholder="ID ou cole a URL: docs.google.com/spreadsheets/d/..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Cole a URL completa ou só o ID. Ex: 1rQmKtrNNME73DhR279in9oSrK-nkSR3oT0RffvmB-p4
              </p>
            </div>
            <div>
              <Label>Worksheet/Tab</Label>
              <Input
                value={form.worksheet_name || 'Página1'}
                onChange={(e) => setForm((f) => ({ ...f, worksheet_name: e.target.value }))}
                placeholder="Conversões ou Página1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Nome exato da aba na planilha. Ex: &quot;Conversões&quot;, &quot;Conversoes Ads&quot;, &quot;Página1&quot;. Deve bater com o nome real da aba.
              </p>
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
      <Card id="tabela-conversoes">
        <CardHeader>
          <CardTitle className="text-lg">Conversões</CardTitle>
          <CardDescription>Por padrão: pendentes. Use o filtro para ver exportados ou todos.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <select
              className="border rounded px-2 py-1 text-sm"
              value={filters.status}
              onChange={(e) => {
                const v = e.target.value;
                setFilters((f) => ({ ...f, status: v }));
                loadConversions({ ...filters, status: v }, true);
              }}
            >
              <option value="PENDING">Pendentes</option>
              <option value="EXPORTED">Exportados</option>
              <option value="">Todos</option>
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
