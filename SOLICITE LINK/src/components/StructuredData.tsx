import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const BASE_URL = 'https://solicite.link';

// Serviços disponíveis (extraídos do LinkSelector)
const services = [
  { name: "Certidão Criminal Federal" },
  { name: "Certidão Quitação Eleitoral" },
  { name: "Certidão Antecedência Criminal – PF" },
  { name: "Certidão Criminal Estadual" },
  { name: "Certidão Cível Federal" },
  { name: "Certidão Cível Estadual" },
  { name: "Certidão CND" },
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
      "name": "Solicite Link",
      "description": "Plataforma simples e direta de direcionamento",
      "url": BASE_URL,
      "sameAs": []
    };

    // Schema Website
    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Solicite Link",
      "url": BASE_URL,
      "description": "Plataforma simples e direta de direcionamento",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${BASE_URL}/?q={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    };

    // Schema Service (apenas na página inicial)
    let serviceSchema = null;
    if (location.pathname === '/') {
      serviceSchema = {
        "@context": "https://schema.org",
        "@type": "Service",
        "serviceType": "Plataforma de Direcionamento",
        "provider": {
          "@type": "Organization",
          "name": "Solicite Link"
        },
        "areaServed": {
          "@type": "Country",
          "name": "Brasil"
        },
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "Serviços de Direcionamento",
          "itemListElement": services.map((service, index) => ({
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": service.name
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

