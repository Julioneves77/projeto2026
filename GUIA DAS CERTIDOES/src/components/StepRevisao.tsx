import { QrCode, CreditCard, Lock, CheckCircle } from "lucide-react";
import { useState } from "react";

interface Props {
  service: string;
}

const StepRevisao = ({ service }: Props) => {
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "cartao">("pix");
  const [agreed, setAgreed] = useState(false);

  return (
    <div>
      <h3 className="text-lg font-bold text-foreground mb-6">Revisão e Pagamento</h3>

      {/* Document summary */}
      <div className="bg-primary rounded-xl p-5 mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-primary-foreground/70 mb-0.5">Documento Selecionado</p>
          <p className="text-primary-foreground font-bold">{service}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-primary-foreground/70">VALOR TOTAL</p>
          <p className="text-3xl font-extrabold text-accent-foreground bg-accent rounded-lg px-3 py-1">R$ 59,37</p>
        </div>
      </div>

      {/* Payment method */}
      <h4 className="text-center font-semibold text-foreground mb-4">Escolha a forma de pagamento</h4>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => setPaymentMethod("pix")}
          className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
            paymentMethod === "pix" ? "border-primary bg-primary/5" : "border-border"
          }`}
        >
          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === "pix" ? "border-primary" : "border-muted-foreground"}`}>
            {paymentMethod === "pix" && <div className="w-2 h-2 rounded-full bg-primary" />}
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <QrCode className="w-4 h-4" /> PIX
            </p>
            <p className="text-xs text-muted-foreground">Aprovação instantânea</p>
          </div>
        </button>
        <button
          onClick={() => setPaymentMethod("cartao")}
          className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
            paymentMethod === "cartao" ? "border-primary bg-primary/5" : "border-border"
          }`}
        >
          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === "cartao" ? "border-primary" : "border-muted-foreground"}`}>
            {paymentMethod === "cartao" && <div className="w-2 h-2 rounded-full bg-primary" />}
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <CreditCard className="w-4 h-4" /> Cartão de Crédito
            </p>
            <p className="text-xs text-muted-foreground">Parcele em até 3x sem juros</p>
          </div>
        </button>
      </div>

      {/* PIX info */}
      {paymentMethod === "pix" && (
        <div className="bg-card border rounded-xl p-6 mb-6">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mb-3">
              <QrCode className="w-8 h-8 text-accent" />
            </div>
            <h4 className="font-bold text-foreground">Pagamento via PIX</h4>
            <p className="text-sm text-muted-foreground">Aprovação instantânea</p>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
              <p className="text-sm text-foreground">Ao finalizar, você verá um <strong className="text-primary">QR Code do PIX</strong></p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
              <p className="text-sm text-foreground"><strong className="text-primary">Escaneie com seu banco</strong> ou copie o código PIX</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
              <p className="text-sm text-foreground">Aprovação <strong className="text-primary">instantânea</strong> - seu documento chega em minutos!</p>
            </div>
          </div>
        </div>
      )}

      {/* PIX alert */}
      <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 mb-6 flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">PIX é instantâneo!</p>
          <p className="text-xs text-muted-foreground">Após o pagamento, seu documento é processado automaticamente e você recebe por e-mail.</p>
        </div>
      </div>

      {/* Terms */}
      <div className="border rounded-lg p-4 mb-2">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-border accent-primary" />
          <div>
            <p className="text-sm text-foreground">
              Li e concordo com os <span className="text-primary underline cursor-pointer">termos e condições</span> e a{" "}
              <span className="text-primary underline cursor-pointer">política de privacidade</span>.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Estou ciente de que este é um serviço opcional, prestado por uma empresa privada, sem vínculo com órgãos governamentais.
            </p>
          </div>
        </label>
      </div>
    </div>
  );
};

export default StepRevisao;
