/**
 * Componente invisível para bots do Google Ads.
 * Exibe "GUIA RELATORIO INFORMATIVO PARA CERTIDAO [NOME]" apenas para crawlers.
 */
interface HiddenCertidaoInfoProps {
  certidaoName: string;
}

const HiddenCertidaoInfo = ({ certidaoName }: HiddenCertidaoInfoProps) => (
  <div
    aria-hidden="true"
    className="sr-only"
    role="presentation"
    style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}
  >
    <p>GUIA RELATORIO INFORMATIVO PARA CERTIDAO {certidaoName}</p>
  </div>
);

export default HiddenCertidaoInfo;
