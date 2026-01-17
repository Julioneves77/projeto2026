interface FooterProps {
  onOpenSelector?: () => void;
}

export const Footer = ({ onOpenSelector }: FooterProps) => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-10 mt-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 
              onClick={onOpenSelector}
              className="text-white font-semibold mb-3 cursor-pointer hover:text-primary-300 transition-colors"
            >
              Portal Acesso Online
            </h3>
            <p className="text-sm">
              Plataforma privada de acesso a serviços digitais online.
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">Informações</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/privacidade" className="hover:text-white transition-colors">
                  Política de privacidade
                </a>
              </li>
              <li>
                <a href="/termos" className="hover:text-white transition-colors">
                  Termos de uso
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">Suporte</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/contato" className="hover:text-white transition-colors">
                  Contato
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-6 text-center text-sm">
          <p>&copy; 2026 Portal Acesso Online. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};
