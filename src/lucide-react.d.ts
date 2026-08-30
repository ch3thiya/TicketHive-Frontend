declare module 'lucide-react' {
  import { FC, SVGProps } from 'react';
  
  type IconProps = SVGProps<SVGSVGElement> & {
    size?: number | string;
    strokeWidth?: number | string;
    absoluteStrokeWidth?: boolean;
  };
  
  export const ArrowLeft: FC<IconProps>;
  export const Eye: FC<IconProps>;
  export const EyeOff: FC<IconProps>;
  export const MapPin: FC<IconProps>;
  export const Plus: FC<IconProps>;
  export const Calendar: FC<IconProps>;
  export const Upload: FC<IconProps>;
}

