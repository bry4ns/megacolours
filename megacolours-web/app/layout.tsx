import './globals.css'
import type { Metadata } from 'next'
export const metadata:Metadata={title:'MegaColours · impresión que se nota',description:'Impresión digital, tela PVC, adhesivos y publicidad para negocios.'}
export default function Layout({children}:{children:React.ReactNode}){return <html lang="es-CL"><body>{children}</body></html>}
