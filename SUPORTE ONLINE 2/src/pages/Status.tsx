import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Clock, CheckCircle2, AlertCircle, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMeta, getUserData } from '@/lib/storage';

export default function Status() {
  const [searchParams] = useSearchParams();
  const protocoloParam = searchParams.get('protocolo');
  
  const meta = getMeta();
  const userData = getUserData();

  const isValidProtocol = protocoloParam && meta?.protocolo === protocoloParam;
  const isPaid = meta?.paid;
  const isSent = meta?.sentToPlatform;

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

      <div className="container mx-auto px-4 py-8 max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl shadow-elevated border border-border/50 p-6 md:p-8"
        >
          <h1 className="text-xl font-bold text-foreground text-center mb-6">
            Status da Solicitação
          </h1>

          {/* Protocol */}
          <div className="bg-secondary/50 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Protocolo</span>
              <span className="font-mono font-bold text-primary">
                {protocoloParam || 'Não informado'}
              </span>
            </div>
          </div>

          {!isValidProtocol ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Protocolo não encontrado
              </h2>
              <p className="text-sm text-muted-foreground">
                Verifique se o protocolo está correto e tente novamente.
              </p>
            </div>
          ) : (
            <>
              {/* Status */}
              <div className="mb-6">
                <div className={`flex items-center gap-3 p-4 rounded-xl ${
                  isSent ? 'bg-success/10' : 'bg-warning/10'
                }`}>
                  {isSent ? (
                    <CheckCircle2 className="w-6 h-6 text-success" />
                  ) : (
                    <Clock className="w-6 h-6 text-warning" />
                  )}
                  <div>
                    <p className={`font-semibold ${isSent ? 'text-success' : 'text-warning'}`}>
                      {!isPaid ? 'Aguardando liberação' : isSent ? 'Encaminhado para envio por e-mail' : 'Processando encaminhamento'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {!isPaid 
                        ? 'Pagamento pendente'
                        : isSent 
                          ? `Documento será enviado para ${userData?.email}`
                          : 'Aguarde alguns instantes'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Estimated Time */}
              {isPaid && (
                <div className="bg-secondary/50 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Prazo estimado</p>
                      <p className="font-medium text-foreground">Até 2 horas úteis</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Support */}
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Falar com suporte
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
