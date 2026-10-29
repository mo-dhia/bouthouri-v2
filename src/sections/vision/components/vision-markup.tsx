import 'server-only';

import type { ReactNode } from 'react';

export function Lines({ lines }: { lines: string[] }) {
  return lines.map((line, index) => <span className='editorial-line' key={index}><span>{line}</span></span>);
}

export function Masked({ id, lines, children, renderedLines = false }: { id?: string; lines?: string[]; children?: ReactNode; renderedLines?: boolean }) {
  return <span className='masked-text' data-masked-reveal={id ?? ''} data-rendered-lines={renderedLines || undefined}>
    {renderedLines ? <span data-reveal-source>{children}</span> : lines ? lines.map((line, index) => <span className='editorial-line masked-text-line' key={index}><span data-reveal-piece>{line}</span></span>) : <span className='editorial-line masked-text-line'><span data-reveal-piece>{children}</span></span>}
  </span>;
}

export function Action({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} className='editorial-action' data-material-sound><span className='editorial-action-window'><span>{children}</span><span aria-hidden>{children}</span></span><i aria-hidden /></a>;
}
