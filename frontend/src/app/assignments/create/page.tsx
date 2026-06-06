'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Minus, X } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

const QUESTION_TYPES = ['Multiple Choice Questions', 'Short Answer Questions', 'Long Answer Questions', 'True/False Questions'];

export default function CreateAssignmentPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', subject: '', dueDate: '',
    questionTypes: [{ type: 'Multiple Choice Questions', count: 4, marks: 1 }],
    additionalInstructions: '',
  });

  const totalQ = form.questionTypes.reduce((s, q) => s + q.count, 0);
  const totalM = form.questionTypes.reduce((s, q) => s + q.count * q.marks, 0);

  const updateQT = (i: number, field: string, val: any) => {
    const qt = [...form.questionTypes];
    qt[i] = { ...qt[i], [field]: val };
    setForm(f => ({ ...f, questionTypes: qt }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.subject || !form.dueDate) {
      setError('Please fill all required fields'); return;
    }
    setSubmitting(true); setError('');
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('subject', form.subject);
      fd.append('dueDate', form.dueDate);
      fd.append('questionTypes', JSON.stringify(form.questionTypes));
      fd.append('totalQuestions', String(totalQ));
      fd.append('totalMarks', String(totalM));
      if (form.additionalInstructions) fd.append('additionalInstructions', form.additionalInstructions);

      const res = await fetch('http://localhost:4000/api/assignments', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      router.push('/assignments');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content">
        <Topbar title="Create Assignment" showBack backHref="/assignments" />
        <div style={{ padding: 28, maxWidth: 680, margin: '0 auto' }}>
          <div className="card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Assignment Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Chapter 5 Test" className="input-field" />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Subject *</label>
                <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Mathematics" className="input-field" />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Due Date *</label>
              <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} className="input-field" style={{ maxWidth: 220 }} />
            </div>

            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 130px 32px', gap: 8, fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', marginBottom: 8 }}>
                <span>Question Type</span><span style={{ textAlign: 'center' }}>No. of Questions</span><span style={{ textAlign: 'center' }}>Marks</span><span />
              </div>
              {form.questionTypes.map((qt, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 130px 130px 32px', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                  <select value={qt.type} onChange={e => updateQT(i, 'type', e.target.value)} className="input-field" style={{ padding: '9px 12px' }}>
                    {QUESTION_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                    <button className="counter-btn" onClick={() => updateQT(i, 'count', Math.max(1, qt.count - 1))}><Minus size={12} /></button>
                    <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 600 }}>{qt.count}</span>
                    <button className="counter-btn" onClick={() => updateQT(i, 'count', qt.count + 1)}><Plus size={12} /></button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                    <button className="counter-btn" onClick={() => updateQT(i, 'marks', Math.max(1, qt.marks - 1))}><Minus size={12} /></button>
                    <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 600 }}>{qt.marks}</span>
                    <button className="counter-btn" onClick={() => updateQT(i, 'marks', qt.marks + 1)}><Plus size={12} /></button>
                  </div>
                  <button onClick={() => setForm(f => ({ ...f, questionTypes: f.questionTypes.filter((_, j) => j !== i) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CCC' }} disabled={form.questionTypes.length === 1}><X size={14} /></button>
                </div>
              ))}
              <button onClick={() => setForm(f => ({ ...f, questionTypes: [...f.questionTypes, { type: 'Short Answer Questions', count: 4, marks: 2 }] }))} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1.5px dashed #D0D0D0', borderRadius: 8, padding: '8px 16px', fontSize: 13, color: '#666', cursor: 'pointer' }}>
                <Plus size={14} /> Add Question Type
              </button>
              <div style={{ textAlign: 'right', fontSize: 13, color: '#555', marginTop: 12 }}>
                <strong>Total Questions:</strong> {totalQ} &nbsp; <strong>Total Marks:</strong> {totalM}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Additional Information <span style={{ color: '#999', fontWeight: 400 }}>(optional)</span></label>
              <textarea value={form.additionalInstructions} onChange={e => setForm(f => ({ ...f, additionalInstructions: e.target.value }))} placeholder="e.g. Generate a question paper for 3 hour exam duration..." rows={3} className="input-field" style={{ resize: 'vertical' }} />
            </div>

            {error && <div style={{ padding: '10px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: 13, color: '#DC2626' }}>{error}</div>}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" onClick={handleSubmit} disabled={submitting} style={{ padding: '12px 32px', fontSize: 14 }}>
                {submitting ? 'Generating…' : 'Generate Question Paper →'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}