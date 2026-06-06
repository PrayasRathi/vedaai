'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Filter, Search, MoreVertical, Eye, Trash2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { useAssignmentStore } from '@/store/assignmentStore';
import { getAssignments, deleteAssignment } from '@/lib/api';

export default function AssignmentsPage() {
  const { assignments, setAssignments, removeAssignment } = useAssignmentStore();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    getAssignments()
      .then(data => { setAssignments(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this assignment?')) return;
    try { await deleteAssignment(id); removeAssignment(id); } catch { alert('Failed to delete.'); }
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  }).replace(/\//g, '-');

  const filtered = assignments.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    (a.subject || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content" style={{ background: '#F0F0F0', minHeight: '100vh' }}>
        <Topbar title="Assignment" />
        <div style={{ padding: '24px 28px', paddingBottom: 100 }}>

          {/* Page Header */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <div style={{ width: 9, height: 9, background: '#22C55E', borderRadius: '50%' }} />
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111' }}>Assignments</h1>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#888', paddingLeft: 17 }}>
              Manage and create assignments for your classes.
            </p>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
              <div className="spinner" style={{ width: 32, height: 32 }} />
            </div>
          ) : assignments.length === 0 ? (
            /* ── Empty State ── */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '65vh', gap: 20, textAlign: 'center' }}>
              {/* Illustration */}
              <div style={{ position: 'relative', width: 160, height: 160 }}>
                <div style={{ width: 120, height: 120, background: '#E8E8E8', borderRadius: '50%', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
                <div style={{ width: 70, height: 85, background: 'white', border: '1.5px solid #DDD', borderRadius: 8, position: 'absolute', top: 16, left: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', gap: 7, padding: '12px 10px' }}>
                  {[42, 30, 36, 22].map((w, i) => <div key={i} style={{ height: 3, background: '#E0E0E0', borderRadius: 2, width: w }} />)}
                </div>
                <div style={{ width: 44, height: 44, background: 'white', border: '2px solid #DDD', borderRadius: '50%', position: 'absolute', bottom: 20, right: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <div style={{ width: 24, height: 24, background: '#FF4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 700 }}>✕</div>
                </div>
                <div style={{ position: 'absolute', top: 8, right: 22, fontSize: 16, color: '#7B68EE' }}>✦</div>
                <div style={{ position: 'absolute', bottom: 6, left: 8, fontSize: 10, color: '#AAA' }}>✦</div>
              </div>
              <div>
                <h2 style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 700, color: '#111' }}>No assignments yet</h2>
                <p style={{ margin: 0, fontSize: 14, color: '#777', maxWidth: 340, lineHeight: 1.6 }}>
                  Create your first assignment to start collecting and grading student submissions. You can set up rubrics, define marking criteria, and let AI assist with grading.
                </p>
              </div>
              <Link href="/assignments/create" style={{ textDecoration: 'none' }}>
                <button style={{ background: '#111', color: 'white', border: 'none', borderRadius: 9999, padding: '13px 28px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Plus size={16} /> Create Your First Assignment
                </button>
              </Link>
            </div>
          ) : (
            <>
              {/* Filter + Search */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
                <button style={{ background: 'white', border: '1px solid #E5E5E5', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                  <Filter size={13} /> Filter By
                </button>
                <div style={{ flex: 1, maxWidth: 320, position: 'relative' }}>
                  <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#AAA' }} />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Assignment" style={{ width: '100%', padding: '8px 12px 8px 32px', border: '1px solid #E5E5E5', borderRadius: 8, fontSize: 13, outline: 'none', background: 'white' }} />
                </div>
              </div>

              {/* Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 12 }}>
                {filtered.map(a => (
                  <div key={a._id} style={{ background: 'white', border: '1px solid #EBEBEB', borderRadius: 10, padding: '16px 18px', position: 'relative', transition: 'box-shadow 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                  >
                    {/* Title row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <Link href={`/assignments/${a._id}`} style={{ textDecoration: 'none', flex: 1 }}>
                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111', lineHeight: 1.4 }}>{a.title}</h3>
                      </Link>
                      {/* 3-dot menu */}
                      <div style={{ position: 'relative' }}>
                        <button onClick={() => setMenuOpen(menuOpen === a._id ? null : a._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 6 }}>
                          <MoreVertical size={15} color="#AAA" />
                        </button>
                        {menuOpen === a._id && (
                          <>
                            <div onClick={() => setMenuOpen(null)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
                            <div style={{ position: 'absolute', right: 0, top: 28, background: 'white', border: '1px solid #E5E5E5', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 20, minWidth: 160, overflow: 'hidden' }}>
                              <Link href={`/assignments/${a._id}`} style={{ textDecoration: 'none' }} onClick={() => setMenuOpen(null)}>
                                <div style={{ padding: '10px 16px', fontSize: 13, color: '#111', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                                  onMouseEnter={e => (e.currentTarget.style.background = '#F8F8F8')}
                                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                                ><Eye size={13} /> View Assignment</div>
                              </Link>
                              <div onClick={() => { handleDelete(a._id); setMenuOpen(null); }} style={{ padding: '10px 16px', fontSize: 13, color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid #F5F5F5' }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#FEF2F2')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                              ><Trash2 size={13} /> Delete</div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Dates */}
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#888', borderTop: '1px solid #F5F5F5', paddingTop: 10 }}>
                      <span><strong style={{ color: '#555' }}>Assigned on : </strong>{fmt(a.createdAt)}</span>
                      <span><strong style={{ color: '#555' }}>Due </strong>{fmt(a.dueDate)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Floating Create Button */}
        {assignments.length > 0 && (
          <Link href="/assignments/create" style={{ textDecoration: 'none' }}>
            <button style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: '#111', color: 'white', border: 'none', borderRadius: 9999, padding: '13px 28px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.25)', zIndex: 30 }}>
              <Plus size={16} /> Create Assignment
            </button>
          </Link>
        )}
      </main>
    </div>
  );
}