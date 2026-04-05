import {
  Globe,
  Server,
  Database,
  Zap,
  Scale,
  Monitor,
  Smartphone,
  Cog,
  Mail,
  Table2,
  Leaf,
  Earth,
  Radio,
  type LucideIcon,
} from 'lucide-react';
import type { SimNodeType } from '@/types/simulation';

/** Centralized icon mapping: SimNodeType → Lucide icon component */
export const nodeIconMap: Record<SimNodeType, LucideIcon> = {
  apiGateway:    Globe,
  appServer:     Server,
  database:      Database,
  cache:         Zap,
  loadBalancer:  Scale,
  webClient:     Monitor,
  mobileClient:  Smartphone,
  worker:        Cog,
  queue:         Mail,
  sqlDatabase:   Table2,
  noSqlDatabase: Leaf,
  cdn:           Earth,
  messageBroker: Radio,
};

/** Category icons for the component library sidebar */
export const categoryIcons = {
  'Most Used': Zap,
  'Client':    Monitor,
  'Backend':   Server,
  'Data Layer': Database,
  'Infra':     Earth,
} as const;
