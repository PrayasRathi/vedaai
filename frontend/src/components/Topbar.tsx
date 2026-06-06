'use client';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LayoutGrid, Bell, ChevronDown } from 'lucide-react';

interface TopbarProps {
  title?: string;
  showBack?: boolean;
  backHref?: string;
}

export default function Topbar({ title, showBack, backHref }: TopbarProps) {
  const router = useRouter();

  return (
    <div className="topbar no-print">
      {showBack && (
        <button
          onClick={() => backHref ? router.push(backHref) : router.back()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#666', padding: 0, fontSize: 14 }}
        >
          <ArrowLeft size={16} />
        </button>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#666' }}>
        <LayoutGrid size={16} />
        <span style={{ fontSize: 14, color: '#999' }}>{title || 'Assignment'}</span>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}>
          <Bell size={18} color="#666" />
          <span style={{
            position: 'absolute', top: -2, right: -2, width: 7, height: 7,
            background: '#FF4444', borderRadius: '50%', border: '1.5px solid white'
          }} />
        </button>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 8, background: 'none',
          border: 'none', cursor: 'pointer', padding: 0
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%', background: '#E5E5E5',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600
          }}>J</div>
          <span style={{ fontSize: 14, fontWeight: 500 }}>John Doe</span>
          <ChevronDown size={14} color="#666" />
        </button>
      </div>
    </div>
  );
}
