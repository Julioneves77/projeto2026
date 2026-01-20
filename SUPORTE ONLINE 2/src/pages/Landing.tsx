import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileText, Settings, Send, CheckCircle2, ClipboardList, Headphones, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
export default function Landing() {
  const navigate = useNavigate();
  const features = [{
    icon: FileText,
    title: 'Informe seus dados',
    desc: 'Preenchimento rápido e seguro'
  }, {
    icon: Settings,
    title: 'Processamento',
    desc: 'Organização automática'
  }, {
    icon: Send,
    title: 'Encaminhamento',
    desc: 'Liberação e envio por e-mail'
  }];
  const includes = [{
    icon: ClipboardList,
    text: 'Organização da Solicitação'
  }, {
    icon: CheckCircle2,
    text: 'Conferência das Informações'
  }, {
    icon: Headphones,
    text: 'Suporte Durante o Processo'
  }, {
    icon: Mail,
    text: 'Retorno por E-mail'
  }];
  return <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Suporte Online</span>
          </div>
          <span className="text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-full">
            Serviço privado de assistência
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.6
      }} className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            Faça Solicitação Criminal com{' '}
            <span className="text-gradient">Acompanhamento</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Organização, conferência e encaminhamento com retorno por e-mail.
          </p>
          <motion.div initial={{
          opacity: 0,
          scale: 0.95
        }} animate={{
          opacity: 1,
          scale: 1
        }} transition={{
          delay: 0.3,
          duration: 0.4
        }}>
            <Button size="lg" onClick={() => navigate('/iniciar')} className="gradient-primary text-primary-foreground px-8 py-6 text-lg font-semibold shadow-soft hover:shadow-elevated transition-all duration-300 hover:scale-105">
              Solicitar Agora
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-16">
        <motion.h2 initial={{
        opacity: 0
      }} whileInView={{
        opacity: 1
      }} viewport={{
        once: true
      }} className="text-2xl md:text-3xl font-bold text-center text-foreground mb-12">
          Como funciona
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {features.map((feature, index) => <motion.div key={feature.title} initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          delay: index * 0.1
        }} className="bg-card rounded-2xl p-6 shadow-card border border-border/50 text-center hover:shadow-elevated transition-shadow duration-300">
              <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-xs font-bold text-muted-foreground mb-3">
                {index + 1}
              </div>
              <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </motion.div>)}
        </div>
      </section>

      {/* What's included */}
      <section className="container mx-auto px-4 py-16">
        <motion.div initial={{
        opacity: 0
      }} whileInView={{
        opacity: 1
      }} viewport={{
        once: true
      }} className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-8">
            O que este Serviço Inclui
          </h2>
          <div className="bg-card rounded-2xl p-6 md:p-8 shadow-card border border-border/50">
            <div className="grid sm:grid-cols-2 gap-4">
              {includes.map((item, index) => <motion.div key={item.text} initial={{
              opacity: 0,
              x: -10
            }} whileInView={{
              opacity: 1,
              x: 0
            }} viewport={{
              once: true
            }} transition={{
              delay: index * 0.1
            }} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{item.text}</span>
                </motion.div>)}
            </div>
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16">
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true
      }} className="max-w-xl mx-auto text-center">
          <Button size="lg" onClick={() => navigate('/iniciar')} className="gradient-primary text-primary-foreground px-8 py-6 text-lg font-semibold shadow-soft hover:shadow-elevated transition-all duration-300 hover:scale-105">
            Solicitar Agora
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a href="/termos-de-uso" className="hover:text-foreground transition-colors">Termos de Uso</a>
              <span>•</span>
              <a href="/politica-de-privacidade" className="hover:text-foreground transition-colors">Política de Privacidade</a>
              <span>•</span>
              <a href="/contato" className="hover:text-foreground transition-colors">Contato</a>
            </div>
            <p className="text-sm text-muted-foreground">
              Serviço privado de assistência
            </p>
          </div>
        </div>
      </footer>
    </div>;
}