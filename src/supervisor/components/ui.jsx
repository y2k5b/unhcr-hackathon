import { Search } from 'lucide-react';
export function Badge({ tone = 'gray', children }) { return <span className={`badge ${tone}`}>{children}</span>; }
export function Panel({ title, subtitle, action, children, className = '' }) { return <section className={`panel ${className}`}><div className="panel-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>{children}</section>; }
export function Empty({ title = 'No results', text = 'Try changing the filters.' }) { return <div className="empty"><Search size={26}/><h3>{title}</h3><p>{text}</p></div>; }
