import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
}

const BASE_URL = 'https://solicite.link';

const SEOHead = ({
  title,
  description,
  canonical,
  noindex = false,
  ogTitle,
  ogDescription,
  ogType = 'website',
  twitterCard = 'summary',
  twitterTitle,
}: SEOHeadProps) => {
  const location = useLocation();

  useEffect(() => {
    // Atualizar title
    if (title) {
      document.title = title;
    }

    // Função helper para atualizar ou criar meta tag
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Atualizar description
    if (description) {
      updateMetaTag('description', description);
    }

    // Atualizar robots
    if (noindex) {
      updateMetaTag('robots', 'noindex, nofollow');
    } else {
      updateMetaTag('robots', 'index, follow');
    }

    // Atualizar canonical
    const canonicalUrl = canonical || `${BASE_URL}${location.pathname}`;
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // Open Graph tags
    if (ogTitle || title) {
      updateMetaTag('og:title', ogTitle || title || '', true);
    }
    if (ogDescription || description) {
      updateMetaTag('og:description', ogDescription || description || '', true);
    }
    updateMetaTag('og:type', ogType, true);
    updateMetaTag('og:url', `${BASE_URL}${location.pathname}`, true);

    // Twitter Card tags
    updateMetaTag('twitter:card', twitterCard);
    if (twitterTitle || title) {
      updateMetaTag('twitter:title', twitterTitle || title || '');
    }
    if (description) {
      updateMetaTag('twitter:description', description);
    }
  }, [title, description, canonical, noindex, ogTitle, ogDescription, ogType, twitterCard, twitterTitle, location.pathname]);

  return null;
};

export default SEOHead;


