import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Lock, FileText, Mail, User, MapPin, Phone, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ProgressBar';
import { PrivateDocumentPreview } from '@/components/PrivateDocumentPreview';
import { getUserData, getMeta, getCheckout } from '@/lib/storage';

export default function Processo() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(62);
  const userData = getUserData();
  const meta = getMeta();
  const checkout = getCheckout();

  useEffect(() => {
    if (!userData || !meta) {
      navigate('/iniciar');
      return;
    }

    // Animate progress
    const timer = setTimeout(() => {
      setProgress(78);
    }, 500);

    return () => clearTimeout(timer);
  }, [userData, meta, navigate]);

  if (!userData || !meta) return null;

  const statusItems = [
    { label: 'Dados informados', done: true },
    { label: 'Análise concluída', done: true },
    { label: 'Liberação final pendente', done: false, locked: true },
  ];

  const dataFields = [
    { icon: User, label: 'Nome', value: userData.nome },
    { icon: FileText, label: 'CPF', value: userData.cpf },
    { icon: MapPin, label: 'UF', value: userData.uf },
    { icon: Mail, label: 'E-mail', value: userData.email },
    { icon: Phone, label: 'WhatsApp', value: userData.whatsapp },
  ];

  const createdAt = new Date(meta.createdAt).toLocaleString('pt-BR');

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">Suporte Online</span>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-warning/10 text-warning px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Clock className="w-4 h-4" />
            Etapa final pendente
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Processamento concluído parcialmente
          </h1>
          <p className="text-muted-foreground">
            Etapa final pendente de liberação
          </p>
        </motion.div>

        {/* Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl shadow-card border border-border/50 p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-foreground">Progresso do processamento</span>
            <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
              {progress}% concluído
            </span>
          </div>
          <ProgressBar progress={progress} showPercentage={false} size="lg" />
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-2xl shadow-card border border-border/50 p-6"
            >
              <h3 className="font-semibold text-foreground mb-4">Status do Processamento</h3>
              <div className="space-y-3">
                {statusItems.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className={`flex items-center gap-3 p-3 rounded-xl ${
                      item.done ? 'bg-success/5' : item.locked ? 'bg-warning/5' : 'bg-secondary'
                    }`}
                  >
                    {item.done ? (
                      <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center">
                        <Check className="w-4 h-4 text-success-foreground" />
                      </div>
                    ) : item.locked ? (
                      <div className="w-8 h-8 rounded-full bg-warning flex items-center justify-center">
                        <Lock className="w-4 h-4 text-warning-foreground" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full border-2 border-muted-foreground/30" />
                    )}
                    <span className={`font-medium ${item.done ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {item.label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Data Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card rounded-2xl shadow-card border border-border/50 p-6"
            >
              <h3 className="font-semibold text-foreground mb-4">Dados Informados</h3>
              <div className="space-y-3">
                {dataFields.map((field) => (
                  <div key={field.label} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <field.icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{field.label}</p>
                      <p className="text-sm font-medium text-foreground truncate">{field.value}</p>
                    </div>
                  </div>
                ))}
                <div className="pt-2 mt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Registrado em: {createdAt}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Document */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="font-semibold text-foreground mb-4">Documento Privado Gerado</h3>
            <PrivateDocumentPreview
              userData={userData}
              meta={meta}
              isLocked={true}
            />
          </motion.div>
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 bg-card rounded-2xl shadow-elevated border border-border/50 p-6 md:p-8"
        >
          <div className="text-center max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Mail className="w-4 h-4" />
              Envio por e-mail após confirmação
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">
              TAXA DE LIBERAÇÃO E ENCAMINHAMENTO
            </h2>
            <div className="flex items-baseline justify-center gap-1 mb-2">
              <span className="text-4xl md:text-5xl font-bold text-gradient">
                R$ {checkout.valor.toFixed(2).replace('.', ',')}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Pagamento único • Acompanhamento até o envio
            </p>
            <Button
              size="lg"
              onClick={() => navigate('/pix')}
              className="gradient-primary text-primary-foreground px-10 py-6 text-lg font-semibold shadow-soft hover:shadow-elevated transition-all duration-300 hover:scale-105"
            >
              <Lock className="w-5 h-5 mr-2" />
              Liberar solicitação
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
