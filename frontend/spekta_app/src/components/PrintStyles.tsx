// src/components/Cetak/PrintStyles.tsx
import React from 'react';

const landscapeCss = `
  @media print {
    @page {
      size: A4 landscape;
      margin: 1.5cm;
    }
  }
`;

const portraitCss = `
  @media print {
    @page {
      size: A4 portrait;
      margin: 2cm;
    }
  }
`;

interface PrintStylesProps {
  orientation: 'landscape' | 'portrait';
}

export function PrintStyles({ orientation }: PrintStylesProps) {
  return (
    <style>
      {orientation === 'landscape' ? landscapeCss : portraitCss}
    </style>
  );
}