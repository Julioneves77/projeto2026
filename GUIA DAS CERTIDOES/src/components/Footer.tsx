import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t bg-foreground py-10">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          <div>
            <h4 className="font-semibold text-primary-foreground mb-3">Consultas e Processamentos Disponíveis</h4>
            <ul className="space-y-1.5 text-muted">
              <li>Certidão de Quitação Eleitoral</li>
              <li>Antecedentes Criminais</li>
              <li>Certidão Criminal Federal</li>
              <li>Certidão Criminal Estadual</li>
              <li>Certidão Cível Federal</li>
              <li>Certidão Cível Estadual</li>
              <li>Certidão Negativa de Débitos (CND)</li>
              <li>Certidão de CPF Regular</li>
              <li>Certidão de Débito Trabalhista</li>
              <li>CCIR - Cadastro de Imóvel Rural</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-primary-foreground mb-3">Links Úteis</h4>
            <ul className="space-y-1.5">
              <li><Link to="/termos-de-uso" className="text-muted underline hover:text-primary-foreground transition-colors">Termos de Uso</Link></li>
              <li><Link to="/politica-de-privacidade" className="text-muted underline hover:text-primary-foreground transition-colors">Política de Privacidade</Link></li>
              <li><Link to="/fale-conosco" className="text-muted underline hover:text-primary-foreground transition-colors">Fale Conosco</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-primary-foreground mb-3">Horário de Atendimento</h4>
            <p className="text-muted font-semibold mb-1">Seg – Sex: 08h às 17h30</p>
            <div className="space-y-1 text-muted mt-3">
              <p>Fale Conosco:</p>
              <a href="mailto:contato@centraldascertidoes.com" className="underline hover:text-primary-foreground transition-colors">
                contato@centraldascertidoes.com
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-muted-foreground/20 text-center text-xs text-primary-foreground space-y-1">
          <p>© 2025 – Guia das Certidões Brasil. Todos os Direitos Reservados.</p>
          <p>Plataforma privada de automação documental com IA.</p>
          <div className="mt-2 inline-block bg-blue-500/20 border border-blue-400/30 rounded px-3 py-1.5">
            <p className="text-primary-foreground">Certidigital Brasil Tech LTDA - 62.083.937/0001-25</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
