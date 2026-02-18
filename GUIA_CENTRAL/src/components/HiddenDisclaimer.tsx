/**
 * Disclaimer invisível para o usuário, mas presente no DOM para crawlers/bots do Google Ads.
 * Usa aria-hidden + sr-only para não afetar acessibilidade nem layout visual.
 */
const HiddenDisclaimer = () => (
  <div
    aria-hidden="true"
    className="sr-only"
    role="presentation"
    style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}
  >
    <p>AVISO IMPORTANTE: Este site (guia-central.online) é uma plataforma privada e independente. NÃO somos órgão público nem possuímos vínculo com o Governo Federal, Estadual ou Municipal. Somos uma empresa privada de tecnologia que facilita o acesso a documentos e certidões através de processamento digital automatizado. O valor cobrado refere-se exclusivamente ao serviço de processamento digital, automação e suporte tecnológico, não ao documento em si. Os documentos são emitidos pelas fontes oficiais competentes. Você pode solicitar diretamente nos órgãos públicos gratuitamente. Nossa plataforma oferece tecnologia, praticidade, automação e economia de tempo como diferencial. Esta é uma plataforma privada de intermediação digital.</p>
  </div>
);

export default HiddenDisclaimer;
