import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const BASE_URL = 'https://www.guia-central.online';

// Tipos de certidão disponíveis (extraídos do Index.tsx)
const certificateTypes = [
  { name: "Certidão Negativa Criminal Federal" },
  { name: "Certidão Negativa Criminal Estadual" },
  { name: "Antecedentes Criminais de Polícia Federal" },
  { name: "Certidão de Quitação Eleitoral" },
  { name: "Certidão Negativa Cível Federal" },
  { name: "Certidão Negativa Cível Estadual" },
  { name: "Certidão Negativa de Débitos (CND)" },
  { name: "Certidão CPF Regular" },
];

const StructuredData = () => {
  const location = useLocation();

  useEffect(() => {
    // Remover apenas scripts injetados por este componente (não os do index.html)
    const existingScripts = document.querySelectorAll('script[id^="schema-"]');
    existingScripts.forEach(script => script.remove());

    // Schema Organization - Template TOP com disclaimer plataforma privada
    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Guia Central",
      "alternateName": "Guia Central - Plataforma Privada de Tecnologia",
      "url": BASE_URL,
      "description": "Plataforma PRIVADA e INDEPENDENTE de tecnologia para processamento digital automatizado de certidões e documentos. NÃO somos órgão público nem possuímos vínculo com o Governo. Os documentos são emitidos pelas fontes oficiais competentes. O valor cobrado refere-se ao serviço de processamento digital e automação, não ao documento em si.",
      "email": "contato@guia-central.online",
      "areaServed": "BR",
      "knowsAbout": ["processamento digital de documentos", "automação de certidões", "tecnologia", "inteligência artificial"],
      "disclaimer": "Esta é uma plataforma privada e independente. NÃO somos órgão público nem possuímos vínculo com o Governo Federal, Estadual ou Municipal. Os documentos são emitidos pelas fontes oficiais. Você pode solicitar diretamente nos órgãos públicos gratuitamente."
    };

    // Schema Website - Template TOP com disclaimer
    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Guia Central - Plataforma Privada",
      "url": BASE_URL,
      "description": "Plataforma privada e independente de processamento digital de documentos e certidões. Não é órgão público. Empresa privada de tecnologia.",
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${BASE_URL}/?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    };

    // Schema FAQPage (apenas na página inicial) - Template TOP
    const faqSchema = location.pathname === '/' ? {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Vocês são um órgão público?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "NÃO. Somos uma plataforma PRIVADA e INDEPENDENTE de tecnologia. Não possuímos vínculo com o Governo Federal, Estadual ou Municipal. Os documentos são emitidos pelos órgãos oficiais competentes. Nosso serviço consiste na automação e intermediação digital do processo de solicitação."
          }
        },
        {
          "@type": "Question",
          "name": "Qual a natureza do serviço oferecido?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Somos uma empresa privada de tecnologia que automatiza o processamento digital de documentos e certidões. O valor cobrado refere-se ao serviço de processamento digital, automação e suporte tecnológico, não ao documento em si. Você pode solicitar diretamente nos órgãos públicos gratuitamente."
          }
        },
        {
          "@type": "Question",
          "name": "Posso buscar os documentos diretamente nos órgãos públicos?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Sim, você pode solicitar diretamente nos órgãos públicos. Nosso serviço oferece automação, tecnologia, praticidade e economia de tempo como diferencial. Somos uma plataforma privada que facilita o acesso, mas não substitui os órgãos oficiais."
          }
        }
      ]
    } : null;

    // Schema Service (apenas na página inicial)
    let serviceSchema = null;
    if (location.pathname === '/') {
      serviceSchema = {
        "@context": "https://schema.org",
        "@type": "Service",
        "serviceType": "Emissão de Certidões",
        "provider": {
          "@type": "Organization",
          "name": "Guia Central"
        },
        "disclaimer": "Plataforma privada. NÃO somos órgão público. Documentos emitidos pelas fontes oficiais.",
        "areaServed": {
          "@type": "Country",
          "name": "Brasil"
        },
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "Certidões Disponíveis",
          "itemListElement": certificateTypes.map((cert, index) => ({
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": cert.name,
              "description": "Envio Digital Email / WhatsApp"
            },
            "position": index + 1
          }))
        }
      };
    }

    // Criar e injetar scripts
    const injectSchema = (schema: object, id: string) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = id;
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    };

    injectSchema(organizationSchema, 'schema-organization');
    injectSchema(websiteSchema, 'schema-website');
    if (faqSchema) injectSchema(faqSchema, 'schema-faqpage');
    if (serviceSchema) injectSchema(serviceSchema, 'schema-service');
  }, [location.pathname]);

  return null;
};

export default StructuredData;


