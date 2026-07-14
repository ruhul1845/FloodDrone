import { Info } from 'lucide-react'
export default function Notice({ children }) { return <div className="flex gap-3 rounded-xl border border-sky-100 bg-sky-50 p-4 text-sm leading-6 text-sky-900"><Info className="mt-0.5 shrink-0" size={18}/><div>{children}</div></div> }
