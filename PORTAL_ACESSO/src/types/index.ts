export interface Service {
  id: string;
  title: string;
  description: string;
  portalPath: string;
  icon?: string;
}

export interface ServiceCardProps {
  service: Service;
  onAccess: (service: Service) => void;
}


