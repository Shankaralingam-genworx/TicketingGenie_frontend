import React from 'react';
interface Props { title: string; subtitle?: string; }
export default function PageHeader({ title, subtitle }: Props) {
  return (
    <div className="dash-page-hdr">
      <h1 className="dash-page-title">{title}</h1>
      {subtitle && <p className="dash-page-sub">{subtitle}</p>}
    </div>
  );
}
