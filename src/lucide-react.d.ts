declare module 'lucide-react' {
  import { FC, SVGProps } from 'react';
  
  export type IconProps = SVGProps<SVGSVGElement> & {
    size?: number | string;
    strokeWidth?: number | string;
    absoluteStrokeWidth?: boolean;
  };
  
  export type Icon = FC<IconProps>;

  export const ArrowLeft: Icon;
  export const Eye: Icon;
  export const EyeOff: Icon;
  export const MapPin: Icon;
  export const Plus: Icon;
  export const Calendar: Icon;
  export const Upload: Icon;
  export const Clock: Icon;
  export const Tag: Icon;
  export const AlertCircle: Icon;
  export const CheckCircle: Icon;
  export const Edit3: Icon;
  export const Trash2: Icon;
  export const Ban: Icon;
  export const Layers: Icon;
  export const Send: Icon;
  export const Sliders: Icon;
  export const Bell: Icon;
  export const Users: Icon;
  export const ShieldAlert: Icon;
  export const Info: Icon;
  export const Filter: Icon;
  export const X: Icon;
  export const RefreshCw: Icon;
  export const Sparkles: Icon;
  export const Search: Icon;
  export const ArrowRight: Icon;
  export const Lock: Icon;

  export const icons: Record<string, Icon>;
}

