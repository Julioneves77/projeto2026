import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Cookie, Settings2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

const STORAGE_KEY = "cookie_consent";

export type CookiePreferences = {
  essential: boolean;
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
};

const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  analytics: false,
  functional: false,
  marketing: false,
};

function loadPreferences(): CookiePreferences | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as CookiePreferences;
    return {
      essential: true,
      analytics: parsed.analytics ?? false,
      functional: parsed.functional ?? false,
      marketing: parsed.marketing ?? false,
    };
  } catch {
    return null;
  }
}

function savePreferences(prefs: CookiePreferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).dataLayer.push({
    event: "cookie_consent_update",
    cookie_consent: prefs,
  });
}

function acceptAll(): CookiePreferences {
  const prefs: CookiePreferences = {
    essential: true,
    analytics: true,
    functional: true,
    marketing: true,
  };
  savePreferences(prefs);
  return prefs;
}

function acceptEssentialOnly(): CookiePreferences {
  const prefs: CookiePreferences = {
    ...DEFAULT_PREFERENCES,
  };
  savePreferences(prefs);
  return prefs;
}

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({ ...DEFAULT_PREFERENCES });

  useEffect(() => {
    const stored = loadPreferences();
    if (stored === null) {
      setVisible(true);
    } else {
      setPreferences(stored);
    }
  }, []);

  const handleAcceptAll = () => {
    acceptAll();
    setVisible(false);
  };

  const handleEssentialOnly = () => {
    acceptEssentialOnly();
    setVisible(false);
  };

  const handlePersonalize = () => {
    const stored = loadPreferences();
    if (stored) setPreferences(stored);
    setShowPreferences(true);
  };

  const handleSavePreferences = () => {
    savePreferences(preferences);
    setVisible(false);
    setShowPreferences(false);
  };

  const handleCancelPreferences = () => {
    setShowPreferences(false);
  };

  const handleCloseBanner = () => {
    setVisible(false);
  };

  useEffect(() => {
    const handler = () => {
      const stored = loadPreferences();
      if (stored) setPreferences(stored);
      setShowPreferences(true);
    };
    window.addEventListener("open-cookie-preferences", handler);
    return () => window.removeEventListener("open-cookie-preferences", handler);
  }, []);

  return (
    <>
      {/* Banner - só mostra quando não tem consentimento */}
      {visible && (
      <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 flex justify-center animate-in slide-in-from-bottom duration-300">
        <div className="relative w-full max-w-2xl bg-card border border-border rounded-xl shadow-elevated p-6">
          <button
            onClick={handleCloseBanner}
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
              <Cookie className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0 pr-8">
              <h3 className="font-semibold text-foreground mb-1">
                Utilizamos cookies em nosso site
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Este site utiliza cookies para melhorar sua experiência de navegação, personalizar
                conteúdo e analisar nosso tráfego. De acordo com a LGPD, você pode escolher quais
                cookies aceitar. Cookies essenciais são necessários para o funcionamento básico do
                site.
              </p>

              <div className="flex flex-wrap gap-2 items-center">
                <Button onClick={handleAcceptAll} size="sm" className="bg-primary hover:bg-primary/90">
                  Aceitar Todos
                </Button>
                <Button
                  onClick={handleEssentialOnly}
                  variant="outline"
                  size="sm"
                  className="border-primary text-primary hover:bg-primary/5"
                >
                  Apenas Essenciais
                </Button>
                <button
                  onClick={handlePersonalize}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  <Settings2 className="h-4 w-4" />
                  Personalizar
                </button>
              </div>

              <p className="text-xs text-muted-foreground mt-3">
                Para mais informações, consulte nossa{" "}
                <Link to="/politica-privacidade" className="text-primary hover:underline">
                  Política de Privacidade
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Modal de Preferências */}
      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={handleCancelPreferences}>
          <DialogHeader>
            <DialogTitle>Preferências de Cookies</DialogTitle>
            <DialogDescription>
              Escolha quais tipos de cookies você deseja aceitar. Cookies essenciais não podem ser
              desabilitados.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            {/* Essenciais */}
            <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 p-4">
              <div>
                <p className="font-medium text-foreground">Cookies Essenciais</p>
                <p className="text-sm text-muted-foreground">
                  Necessários para o funcionamento básico do site, como autenticação e segurança.
                </p>
              </div>
              <Switch checked disabled className="data-[state=checked]:bg-primary" />
            </div>

            {/* Análise */}
            <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <div>
                <p className="font-medium text-foreground">Cookies de Análise</p>
                <p className="text-sm text-muted-foreground">
                  Ajudam-nos a entender como você usa o site para melhorar nossos serviços.
                </p>
              </div>
              <Switch
                checked={preferences.analytics}
                onCheckedChange={(v) => setPreferences((p) => ({ ...p, analytics: v }))}
              />
            </div>

            {/* Funcionais */}
            <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <div>
                <p className="font-medium text-foreground">Cookies Funcionais</p>
                <p className="text-sm text-muted-foreground">
                  Permitem funcionalidades avançadas como chat e personalização da interface.
                </p>
              </div>
              <Switch
                checked={preferences.functional}
                onCheckedChange={(v) => setPreferences((p) => ({ ...p, functional: v }))}
              />
            </div>

            {/* Marketing */}
            <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <div>
                <p className="font-medium text-foreground">Cookies de Marketing</p>
                <p className="text-sm text-muted-foreground">
                  Utilizados para exibir anúncios relevantes e acompanhar eficácia de campanhas.
                </p>
              </div>
              <Switch
                checked={preferences.marketing}
                onCheckedChange={(v) => setPreferences((p) => ({ ...p, marketing: v }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCancelPreferences}>
              Cancelar
            </Button>
            <Button onClick={handleSavePreferences}>Salvar Preferências</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CookieConsent;
