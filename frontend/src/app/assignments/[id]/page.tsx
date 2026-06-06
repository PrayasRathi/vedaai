'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Download, RefreshCw, Printer } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { useAssignmentStore, Assignment, QuestionPaper } from '@/store/assignmentStore';
import { getAssignment, regenerateAssignment } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';

function DifficultyTag({ difficulty }: { difficulty: string }) {
  const map: Record<string, string> = {
    easy: 'tag-easy',
    medium: 'tag-medium',
    hard: 'tag-hard',
  };
  const labels: Record<string, string> = {
    easy: 'Easy',
    medium: 'Moderate',
    hard: 'Hard',
  };
  return (
    <span className={`difficulty-tag ${map[difficulty] || 'tag-medium'}`}>
      {labels[difficulty] || difficulty}
    </span>
  );
}

function GeneratingState({ progress, message }: { progress: number; message?: string }) {
  const steps = [
    'Analyzing requirements',
    'Structuring sections',
    'Generating questions',
    'Reviewing difficulty',
  ];
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', gap: 28, padding: 40,
    }}>
      {/* Circular progress */}
      <div style={{ position: 'relative', width: 90, height: 90 }}>
        <svg width="90" height="90" viewBox="0 0 90 90" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="45" cy="45" r="38" fill="none" stroke="#E5E5E5" strokeWidth="7" />
          <circle
            cx="45" cy="45" r="38" fill="none"
            stroke="#1A1A1A" strokeWidth="7"
            strokeDasharray={`${2 * Math.PI * 38}`}
            strokeDashoffset={`${2 * Math.PI * 38 * (1 - progress / 100)}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 700, color: '#111',
        }}>
          {progress}%
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>
          Generating Question Paper
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: '#888' }}>
          {message || 'AI is crafting your questions…'}
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ width: 340, background: '#F0F0F0', borderRadius: 99, height: 6, overflow: 'hidden' }}>
        <div style={{
          height: '100%', background: '#1A1A1A',
          borderRadius: 99, width: `${progress}%`,
          transition: 'width 0.5s ease',
        }} />
      </div>

      {/* Step chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {steps.map((step, i) => {
          const done = progress > i * 25;
          return (
            <span key={i} style={{
              fontSize: 12, padding: '5px 14px', borderRadius: 9999,
              background: done ? '#1A1A1A' : '#F0F0F0',
              color: done ? 'white' : '#888',
              fontWeight: done ? 600 : 400,
              transition: 'all 0.3s',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              {done ? '✓' : '○'} {step}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function QuestionPaperView({ paper, assignment }: { paper: QuestionPaper; assignment: Assignment }) {
  const paperRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      if (!paperRef.current) return;

      const canvas = await html2canvas(paperRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pageW) / canvas.width;
      let y = 0;

      while (y < imgH) {
        if (y > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, -y, pageW, imgH);
        y += pageH;
      }
      pdf.save(`${assignment.title.replace(/\s+/g, '_')}_question_paper.pdf`);
    } catch (err) {
      console.error('PDF error:', err);
      alert('PDF generation failed. Please try printing instead.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fade-in">
      {/* Action Bar */}
      <div className="no-print" style={{
        display: 'flex', gap: 10, marginBottom: 20,
        alignItems: 'center', flexWrap: 'wrap',
      }}>
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="btn-primary"
          style={{ fontSize: 13 }}
        >
          {downloading
            ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Generating PDF…</>
            : <><Download size={14} /> Download as PDF</>
          }
        </button>
        <button
          onClick={() => window.print()}
          className="btn-outline"
          style={{ fontSize: 13 }}
        >
          <Printer size={14} /> Print
        </button>
      </div>

      {/* Question Paper */}
      <div ref={paperRef} className="question-paper" style={{
        background: 'white',
        padding: '48px 56px',
        borderRadius: 12,
        border: '1px solid #E5E5E5',
        maxWidth: 800,
        margin: '0 auto',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}>
        {/* School Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: 32,
          paddingBottom: 24,
          borderBottom: '2.5px solid #111',
        }}>
          <h1 style={{
            margin: '0 0 6px',
            fontSize: 22,
            fontWeight: 700,
            fontFamily: 'Georgia, serif',
            letterSpacing: '-0.3px',
          }}>
            Delhi Public School, Sector-4, Bokaro
          </h1>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3, fontFamily: 'Georgia, serif' }}>
            Subject: {paper.subject}
          </div>
          <div style={{ fontSize: 14, fontFamily: 'Georgia, serif' }}>
            Class: ___________
          </div>
        </div>

        {/* Meta */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: 13, marginBottom: 16,
          fontFamily: 'Arial, sans-serif',
          color: '#333',
        }}>
          <span>Time Allowed: <strong>{paper.duration}</strong></span>
          <span>Maximum Marks: <strong>{paper.totalMarks}</strong></span>
        </div>

        {/* General instruction */}
        <div style={{
          fontSize: 13, fontStyle: 'italic',
          marginBottom: 24, fontFamily: 'Arial, sans-serif',
          color: '#444', borderBottom: '1px solid #EEE', paddingBottom: 16,
        }}>
          All questions are compulsory unless stated otherwise.
        </div>

        {/* Student Info */}
        <div style={{ marginBottom: 32, fontFamily: 'Arial, sans-serif' }}>
          {[
            { label: 'Name', width: 200 },
            { label: 'Roll Number', width: 140 },
            { label: 'Class', width: 80 },
            { label: 'Section', width: 80 },
          ].map(({ label, width }) => (
            <div key={label} style={{ marginBottom: 10, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 500, minWidth: 90 }}>{label}:</span>
              <span style={{
                borderBottom: '1px solid #333',
                display: 'inline-block',
                minWidth: width,
                height: 20,
              }} />
            </div>
          ))}
        </div>

        {/* Sections */}
        {paper.sections.map((section, sIdx) => (
          <div key={section.id} style={{ marginBottom: 36 }}>
            {/* Section Title */}
            <div style={{
              textAlign: 'center',
              marginBottom: 12,
              paddingBottom: 8,
              borderBottom: '1px solid #EEE',
            }}>
              <h2 style={{
                fontSize: 17,
                fontWeight: 700,
                margin: 0,
                fontFamily: 'Georgia, serif',
                textDecoration: 'underline',
                textUnderlineOffset: 4,
              }}>
                {section.title}
              </h2>
              <p style={{
                fontSize: 13, fontStyle: 'italic',
                margin: '6px 0 0', color: '#555',
                fontFamily: 'Arial, sans-serif',
              }}>
                {section.instruction}
                {section.questions[0] && ` · Each question carries ${section.questions[0].marks} mark${section.questions[0].marks !== 1 ? 's' : ''}`}
              </p>
            </div>

            {/* Questions */}
            {section.questions.map((q, qi) => (
              <div key={q.id} style={{
                marginBottom: 20,
                pageBreakInside: 'avoid',
                padding: '4px 0',
              }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  {/* Number */}
                  <span style={{
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 14,
                    minWidth: 28,
                    fontWeight: 600,
                    color: '#111',
                    paddingTop: 2,
                  }}>
                    {qi + 1}.
                  </span>

                  <div style={{ flex: 1 }}>
                    {/* Question row */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 12,
                      marginBottom: q.options ? 10 : 0,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flex: 1, flexWrap: 'wrap' }}>
                        <DifficultyTag difficulty={q.difficulty} />
                        <span style={{
                          fontSize: 14,
                          fontFamily: 'Arial, sans-serif',
                          lineHeight: 1.65,
                          color: '#111',
                        }}>
                          {q.text}
                        </span>
                      </div>
                      <span style={{
                        fontSize: 13,
                        color: '#444',
                        fontFamily: 'Arial, sans-serif',
                        whiteSpace: 'nowrap',
                        fontWeight: 500,
                        flexShrink: 0,
                      }}>
                        [{q.marks} Mark{q.marks !== 1 ? 's' : ''}]
                      </span>
                    </div>

                    {/* MCQ Options */}
                    {q.options && q.options.length > 0 && (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '6px 24px',
                        marginTop: 8,
                        paddingLeft: 4,
                      }}>
                        {q.options.map((opt, oi) => (
                          <div key={oi} style={{
                            fontSize: 13,
                            fontFamily: 'Arial, sans-serif',
                            color: '#333',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}>
                            <span style={{
                              width: 20, height: 20,
                              border: '1px solid #CCC',
                              borderRadius: '50%',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 11,
                              flexShrink: 0,
                              color: '#888',
                            }}>
                              {String.fromCharCode(65 + oi)}
                            </span>
                            {opt.replace(/^[A-D]\.\s*/, '')}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Section total */}
            <div style={{
              textAlign: 'right',
              fontSize: 12,
              color: '#888',
              fontFamily: 'Arial, sans-serif',
              marginTop: 8,
              paddingTop: 8,
              borderTop: '1px dashed #EEE',
            }}>
              Section Total: {section.totalMarks} marks
            </div>
          </div>
        ))}

        {/* Footer */}
        <div style={{
          borderTop: '2px solid #111',
          paddingTop: 14,
          textAlign: 'center',
          fontSize: 12,
          color: '#888',
          fontFamily: 'Arial, sans-serif',
          letterSpacing: '0.5px',
        }}>
          *** End of Question Paper ***
        </div>
      </div>
    </div>
  );
}

export default function AssignmentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { currentAssignment, setCurrentAssignment, generationStatus, setGenerationStatus } = useAssignmentStore();
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [regenError, setRegenError] = useState('');
  useWebSocket(id);

  useEffect(() => {
    if (!id) return;
    getAssignment(id)
      .then(data => {
        if (data) setCurrentAssignment(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  // Poll while processing as fallback
  useEffect(() => {
    if (!currentAssignment) return;
    if (currentAssignment.status === 'completed' || currentAssignment.status === 'failed') return;
    const timer = setInterval(() => {
      getAssignment(id).then(data => {
        if (data) setCurrentAssignment(data);
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(timer);
        }
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [currentAssignment?.status, id]);

  // Clear generation status when leaving
  useEffect(() => {
    return () => setGenerationStatus(null);
  }, []);

  const handleRegenerate = async () => {
    if (!currentAssignment || regenerating) return;
    setRegenError('');
    setRegenerating(true);
    try {
      await regenerateAssignment(currentAssignment._id);
      const updated = await getAssignment(currentAssignment._id);
      setCurrentAssignment(updated);
      setGenerationStatus({ status: 'pending', progress: 0 });
    } catch (err: any) {
      setRegenError(err.message || 'Regeneration failed');
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <main className="main-content">
          <Topbar title="Assignment" showBack backHref="/assignments" />
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <div className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        </main>
      </div>
    );
  }

  if (!currentAssignment) {
    return (
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <main className="main-content">
          <Topbar showBack backHref="/assignments" />
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Assignment not found</h2>
            <button className="btn-primary" onClick={() => router.push('/assignments')}>
              Back to Assignments
            </button>
          </div>
        </main>
      </div>
    );
  }

  const isProcessing = currentAssignment.status === 'pending' || currentAssignment.status === 'processing';
  const progress = generationStatus?.progress ||
    (currentAssignment.status === 'processing' ? 50 : 0);

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content">
        <Topbar title="Create New" showBack backHref="/assignments" />
        <div style={{ padding: '24px 28px', maxWidth: 880, margin: '0 auto', paddingBottom: 60 }}>

          {/* AI Banner — only when completed */}
          {currentAssignment.status === 'completed' && currentAssignment.questionPaper && (
            <div className="ai-banner no-print fade-in">
              <span style={{ lineHeight: 1.5 }}>
                ✨ Certainly! Here are customized Question Papers for your{' '}
                <strong>{currentAssignment.subject}</strong> class.
              </span>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.25)',
                    borderRadius: 9999,
                    padding: '7px 16px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                >
                  {regenerating
                    ? <div className="spinner" style={{ width: 12, height: 12, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                    : <RefreshCw size={12} />
                  }
                  Regenerate
                </button>
              </div>
            </div>
          )}

          {regenError && (
            <div style={{
              padding: '10px 16px', background: '#FEF2F2',
              border: '1px solid #FECACA', borderRadius: 8,
              fontSize: 13, color: '#DC2626', marginBottom: 16,
            }}>
              {regenError}
            </div>
          )}

          {/* Generating State */}
          {isProcessing && (
            <GeneratingState
              progress={progress}
              message={generationStatus?.message}
            />
          )}

          {/* Failed State */}
          {currentAssignment.status === 'failed' && (
            <div style={{ textAlign: 'center', padding: 60 }} className="fade-in">
              <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Generation Failed</h2>
              <p style={{ color: '#888', marginBottom: 24, fontSize: 14 }}>
                {currentAssignment.error || 'Something went wrong. Please try again.'}
              </p>
              <button className="btn-primary" onClick={handleRegenerate} disabled={regenerating}>
                {regenerating
                  ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Retrying…</>
                  : '↻ Try Again'
                }
              </button>
            </div>
          )}

          {/* Question Paper */}
          {currentAssignment.status === 'completed' && currentAssignment.questionPaper && (
            <QuestionPaperView
              paper={currentAssignment.questionPaper}
              assignment={currentAssignment}
            />
          )}
        </div>
      </main>
    </div>
  );
}