import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  ogUrl?: string;
  ogImage?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
}

const BASE_URL = 'https://www.portalcertidao.org';

const SEOHead = ({
  title,
  description,
  canonical,
  ogTitle,
  ogDescription,
  ogType = 'website',
  ogUrl,
  ogImage,
  twitterCard = 'summary',
  twitterTitle,
  twitterDescription,
  twitterImage,
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

    // Meta robots: index, follow para permitir indexação pelo Google
    updateMetaTag('robots', 'index, follow');

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
    const currentUrl = ogUrl || `${BASE_URL}${location.pathname}`;
    if (ogTitle || title) {
      updateMetaTag('og:title', ogTitle || title || '', true);
    }
    if (ogDescription || description) {
      updateMetaTag('og:description', ogDescription || description || '', true);
    }
    updateMetaTag('og:type', ogType, true);
    updateMetaTag('og:url', currentUrl, true);
    updateMetaTag('og:locale', 'pt_BR', true);
    if (ogImage) {
      updateMetaTag('og:image', ogImage, true);
    }

    // Twitter Card tags
    updateMetaTag('twitter:card', twitterCard);
    if (twitterTitle || title) {
      updateMetaTag('twitter:title', twitterTitle || title || '');
    }
    if (twitterDescription || description) {
      updateMetaTag('twitter:description', twitterDescription || description || '');
    }
    if (twitterImage) {
      updateMetaTag('twitter:image', twitterImage);
    }
  }, [title, description, canonical, ogTitle, ogDescription, ogType, ogUrl, ogImage, twitterCard, twitterTitle, twitterDescription, twitterImage, location.pathname]);

  return null;
};

export default SEOHead;


