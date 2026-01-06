import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const BASE_URL = 'https://www.portalcertidao.org';

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
    // Remover scripts anteriores de structured data
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
    existingScripts.forEach(script => script.remove());

    // Schema Organization
    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Portal Certidão",
      "url": BASE_URL,
      "description": "Todas as suas certidões direto no seu E-mail e WhatsApp. Processo rápido, seguro e 100% online."
    };

    // Schema Website
    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Portal Certidão",
      "url": BASE_URL,
      "description": "Todas as suas certidões direto no seu E-mail e WhatsApp. Processo rápido, seguro e 100% online."
    };

    // Schema Service (apenas na página inicial)
    let serviceSchema = null;
    if (location.pathname === '/') {
      serviceSchema = {
        "@context": "https://schema.org",
        "@type": "Service",
        "serviceType": "Emissão de Certidões",
        "provider": {
          "@type": "Organization",
          "name": "Portal Certidão"
        },
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
    
    if (serviceSchema) {
      injectSchema(serviceSchema, 'schema-service');
    }
  }, [location.pathname]);

  return null;
};

export default StructuredData;

