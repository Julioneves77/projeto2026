import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Settings, X } from "lucide-react";

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [functional, setFunctional] = useState(true);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) setVisible(true);
  }, []);

  const accept = (type: string) => {
    localStorage.setItem("cookie-consent", type);
    setVisible(false);
    setShowCustomize(false);
  };

  const saveCustom = () => {
    const prefs = { essential: true, analytics, functional };
    localStorage.setItem("cookie-consent", JSON.stringify(prefs));
    setVisible(false);
    setShowCustomize(false);
  };

  if (!visible) return null;

  return (
    <>
      {/* Main banner */}
      {!showCustomize && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-slide-up">
          <div className="container mx-auto max-w-3xl bg-card border border-border rounded-2xl shadow-card-hover p-6">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl">🍪</span>
              <div>
                <h3 className="font-heading font-bold text-foreground text-base mb-1">Utilizamos cookies em nosso site</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Este site utiliza cookies para melhorar sua experiência de navegação, personalizar conteúdo e analisar nosso tráfego. De acordo com a LGPD, você pode escolher quais cookies aceitar. Cookies essenciais são necessários para o funcionamento básico do site.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <button onClick={() => accept("all")} className="px-5 py-2 rounded-lg gradient-hero text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
                Aceitar Todos
              </button>
              <button onClick={() => accept("essential")} className="px-5 py-2 rounded-lg border border-border bg-card text-foreground text-sm font-medium hover:bg-secondary transition-colors">
                Apenas Essenciais
              </button>
              <button onClick={() => setShowCustomize(true)} className="px-4 py-2 rounded-lg text-muted-foreground text-sm font-medium hover:text-foreground transition-colors flex items-center gap-1.5">
                <Settings size={14} /> Personalizar
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Para mais informações, consulte nossa{" "}
              <Link to="/politica-privacidade" className="text-primary underline hover:no-underline">Política de Privacidade</Link>.
            </p>
          </div>
        </div>
      )}

      {/* Customize modal */}
      {showCustomize && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-foreground/40">
          <div className="bg-card border border-border rounded-2xl shadow-card-hover p-6 max-w-md w-full animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-foreground text-lg">Personalizar Cookies</h3>
              <button onClick={() => setShowCustomize(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <CookieToggle label="Cookies Essenciais" desc="Necessários para o funcionamento básico do site." checked disabled />
              <CookieToggle label="Cookies Analíticos" desc="Nos ajudam a entender como você usa o site (Google Analytics)." checked={analytics} onChange={setAnalytics} />
              <CookieToggle label="Cookies Funcionais" desc="Lembram suas preferências e personalizam sua experiência." checked={functional} onChange={setFunctional} />
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={saveCustom} className="flex-1 px-5 py-2.5 rounded-lg gradient-hero text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
                Salvar Preferências
              </button>
              <button onClick={() => accept("all")} className="flex-1 px-5 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm font-medium hover:bg-secondary transition-colors">
                Aceitar Todos
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const CookieToggle = ({ label, desc, checked, disabled, onChange }: { label: string; desc: string; checked: boolean; disabled?: boolean; onChange?: (v: boolean) => void }) => (
  <div className="flex items-start gap-3">
    <div className="pt-0.5">
      <button
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`w-10 h-5 rounded-full transition-colors relative ${checked ? 'bg-primary' : 'bg-border'} ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-card shadow transition-transform ${checked ? 'left-5' : 'left-0.5'}`} />
      </button>
    </div>
    <div>
      <p className="text-sm font-medium text-foreground">{label} {disabled && <span className="text-xs text-muted-foreground">(obrigatório)</span>}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  </div>
);

export default CookieBanner;
