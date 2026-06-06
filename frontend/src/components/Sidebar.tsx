'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Users, FileText, Wrench, BookOpen, Settings, Sparkles } from 'lucide-react';
import { useAssignmentStore } from '@/store/assignmentStore';

const navItems = [
  { href: '/', label: 'Home', icon: LayoutGrid },
  { href: '/groups', label: 'My Groups', icon: Users },
  { href: '/assignments', label: 'Assignments', icon: FileText, badge: true },
  { href: '/toolkit', label: "AI Teacher's Toolkit", icon: Wrench },
  { href: '/library', label: 'My Library', icon: BookOpen },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { assignments } = useAssignmentStore();
  const count = assignments.length;

  return (
    <aside className="sidebar">

      {/* ── Logo ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '0 4px' }}>
        <div style={{
          width: 34, height: 34,
          background: '#111',
          borderRadius: 9,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 2L15.5 14H2.5L9 2Z" fill="white" stroke="white" strokeWidth="0.5" />
          </svg>
        </div>
        <span style={{ fontSize: 17, fontWeight: 700, color: '#111', letterSpacing: '-0.3px' }}>VedaAI</span>
      </div>

      {/* ── CTA Button ── */}
      <Link href="/assignments/create" style={{ textDecoration: 'none', marginBottom: 20, display: 'block' }}>
        <button style={{
          width: '100%',
          background: '#1A1A1A',
          color: 'white',
          border: 'none',
          borderRadius: 9999,
          padding: '11px 16px',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          justifyContent: 'center',
          transition: 'background 0.2s',
          letterSpacing: '0.1px',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = '#333')}
          onMouseLeave={e => (e.currentTarget.style.background = '#1A1A1A')}
        >
          <Sparkles size={14} />
          AI Teacher's Toolkit
        </button>
      </Link>

      {/* ── Nav Items ── */}
      <nav style={{ flex: 1 }}>
        {navItems.map(({ href, label, icon: Icon, badge }) => {
          const isActive = pathname === href ||
            (href !== '/' && pathname.startsWith(href));
          return (
            <Link key={href} href={href} className={`nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
              <span>{label}</span>
              {badge && count > 0 && (
                <span className="badge-count">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom ── */}
      <div style={{ borderTop: '1px solid #F0F0F0', paddingTop: 12 }}>
        <Link href="/settings" className="nav-item">
          <Settings size={16} />
          <span>Settings</span>
        </Link>

        {/* School Card */}
        <div className="school-card">
          <div style={{
            width: 34, height: 34,
            borderRadius: 8,
            background: '#E8E8E8',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16, flexShrink: 0,
          }}>
            🏫
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{
              fontSize: 12, fontWeight: 600,
              color: '#111', whiteSpace: 'nowrap',
              overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              Delhi Public School
            </div>
            <div style={{ fontSize: 11, color: '#999' }}>Bokaro Steel City</div>
          </div>
        </div>
      </div>
    </aside>
  );
}