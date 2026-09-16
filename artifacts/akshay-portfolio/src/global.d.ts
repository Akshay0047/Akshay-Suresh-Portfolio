/// <reference types="react" />

type ModelViewerElement = React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
  src?: string;
  alt?: string;
  'camera-controls'?: boolean | string;
  'auto-rotate'?: boolean | string;
  'camera-orbit'?: string;
  'camera-target'?: string;
  'field-of-view'?: string;
  'environment-image'?: string;
  exposure?: string | number;
  'shadow-intensity'?: string | number;
  'interaction-prompt'?: string;
  class?: string;
};

declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': ModelViewerElement;
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerElement;
    }
  }
}

declare module 'react/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerElement;
    }
  }
}

declare module 'react/jsx-dev-runtime' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerElement;
    }
  }
}

export {};
