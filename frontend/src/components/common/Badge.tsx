import type { PropsWithChildren } from 'react'; export function Badge({children,tone='blue'}:PropsWithChildren<{tone?:string}>){return <span className={`badge ${tone}`}>{children}</span>}
