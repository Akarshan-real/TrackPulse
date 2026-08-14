'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/store';
import { 
  setPlaylistResult, 
  setCurrentResult, 
  cleanExpiredCache 
} from '@/lib/store/playlistSlice';
import { extractPlaylistId } from '@/lib/parser';
import { ExtractResponse } from '@/type';
import { 
  Download, 
  Copy, 
  Check, 
  Search, 
  ExternalLink, 
  ArrowRight, 
  Clock, 
  ListVideo, 
  Sparkles, 
  Link as LinkIcon, 
  X, 
  ShieldCheck, 
  FileText, 
  AlertCircle, 
  FileJson, 
  Zap, 
  Loader2 
} from 'lucide-react';

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Redux state & dispatch
  const dispatch = useDispatch<AppDispatch>();
  const cache = useSelector((state: RootState) => state.playlist?.cache || {});
  const result = useSelector((state: RootState) => state.playlist?.currentResult || null);

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedType, setCopiedType] = useState<'json' | 'txt' | null>(null);
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | null>(null);

  // Clean expired caches on mount
  useEffect(() => {
    dispatch(cleanExpiredCache());
  }, [dispatch]);

  const handleExtract = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    setError(null);

    // Normalize URL key (use playlist ID if available, otherwise trimmed URL)
    const normalizedKey = extractPlaylistId(url) || url.trim();

    // Check Redux Persisted Cache with 12 hour TTL
    const cachedEntry = cache[normalizedKey];
    if (cachedEntry && Date.now() - cachedEntry.timestamp < TWELVE_HOURS_MS) {
      dispatch(setCurrentResult(cachedEntry.data));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data: ExtractResponse = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract playlist data.');
      }

      // Save to Redux store & persist cache
      dispatch(setPlaylistResult({ key: normalizedKey, result: data }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during extraction.');
    } finally {
      setLoading(false);
    }
  };

  const downloadJSON = () => {
    if (!result) return;
    const jsonToExport = result.items.map(({ id, title, duration }) => ({ id, title, duration }));
    const blob = new Blob([JSON.stringify(jsonToExport, null, 2)], { type: 'application/json' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `playlist_data.json`;
    a.click();
    URL.revokeObjectURL(blobUrl);
  };

  const downloadTXT = () => {
    if (!result) return;
    const content = `Total Duration: ${result.totalDurationFormatted}\nTotal Videos: ${result.totalVideos}\n\n` +
      result.items.map(item => `${item.id}. ${item.title} (${item.duration})`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `playlist_duration.txt`;
    a.click();
    URL.revokeObjectURL(blobUrl);
  };

  const copyToClipboard = (type: 'json' | 'txt') => {
    if (!result) return;
    let text = '';
    if (type === 'json') {
      const jsonToExport = result.items.map(({ id, title, duration }) => ({ id, title, duration }));
      text = JSON.stringify(jsonToExport, null, 2);
    } else {
      text = `Total Duration: ${result.totalDurationFormatted}\nTotal Videos: ${result.totalVideos}\n`;
    }

    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const filteredItems = result?.items.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.duration.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* ─── HEADER ─── */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ 
          borderBottom: '1px solid var(--border-indigo)', 
          background: 'rgba(22, 25, 34, 0.88)', 
          backdropFilter: 'blur(16px)',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}
      >
        <div className="site-container" style={{ 
          height: '70px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between' 
        }}>
          {/* Brand Logo & Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, var(--c-primary), #ea580c)', 
              color: '#ffffff', 
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.15rem',
              boxShadow: '0 4px 14px rgba(246, 141, 31, 0.35)'
            }}>
              <Zap size={20} fill="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                TrackPulse
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 500 }}>
                YouTube Playlist Engine
              </div>
            </div>
          </div>

          {/* Header Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block', boxShadow: '0 0 8px #22c55e' }}></span>
              <span style={{ fontWeight: 500 }}>Engine Ready</span>
            </div>

            <div style={{ height: '20px', width: '1px', background: 'var(--border-indigo)' }}></div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span className="badge badge-orange" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <FileJson size={12} /> JSON & TXT
              </span>
            </div>
          </div>
        </div>
      </motion.header>

      {/* ─── MAIN CONTENT ─── */}
      <main className="site-container" style={{ flex: 1, padding: '3.5rem 1.5rem' }}>
        
        {/* Hero Section */}
        <motion.section 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ textAlign: 'center', marginBottom: '3rem' }}
        >
          <div style={{ display: 'inline-flex', marginBottom: '1rem' }}>
            <span className="badge badge-periwinkle">
              <Sparkles size={13} /> High-Speed YouTube Metadata Extraction
            </span>
          </div>
          <h1 style={{ 
            fontSize: '2.85rem', 
            fontWeight: 800, 
            letterSpacing: '-0.03em', 
            marginBottom: '1rem',
            lineHeight: 1.2 
          }}>
            Extract Video Titles & Durations in <span style={{ color: 'var(--c-signal)' }}>Seconds</span>
          </h1>
          <p style={{ 
            color: 'var(--text-muted)', 
            fontSize: '1.1rem', 
            maxWidth: '640px', 
            margin: '0 auto', 
            lineHeight: 1.6 
          }}>
            Paste any YouTube playlist link or video watch link to parse video titles, exact timestamps, and calculate total runtime.
          </p>
        </motion.section>

        {/* Input Form Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="card-elevated" 
          style={{ padding: '1.75rem', marginBottom: '2.5rem' }}
        >
          <form onSubmit={handleExtract}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LinkIcon size={16} color="var(--c-canvas-soft)" /> YouTube Playlist / Watch Link:
              </label>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  className="input-text"
                  placeholder="https://www.youtube.com/watch?v=...&list=... or https://www.youtube.com/playlist?list=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  style={{ flex: 1, minWidth: '280px' }}
                />
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  className="btn btn-signal"
                  disabled={loading || !url.trim()}
                  style={{ minWidth: '160px' }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Extracting...</span>
                    </>
                  ) : (
                    <>
                      <span>Extract Metadata</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </form>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ 
                  marginTop: '1.25rem', 
                  padding: '0.85rem 1.25rem', 
                  background: 'rgba(230, 0, 18, 0.12)', 
                  border: '1px solid rgba(230, 0, 18, 0.35)', 
                  borderRadius: 'var(--radius-md)', 
                  color: '#fca5a5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '0.9rem'
                }}
              >
                <AlertCircle size={18} />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ─── SKELETON LOADING SCREEN ─── */}
        {loading && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            style={{ marginBottom: '2rem' }}
          >
            {/* Top Metric Cards Skeleton */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
              gap: '1rem', 
              marginBottom: '1.5rem' 
            }}>
              <div className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="skeleton" style={{ width: '70px', height: '14px' }} />
                  <div className="skeleton" style={{ width: '45px', height: '24px' }} />
                </div>
              </div>

              <div className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="skeleton" style={{ width: '85px', height: '14px' }} />
                  <div className="skeleton" style={{ width: '110px', height: '24px' }} />
                </div>
              </div>

              <div className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <div className="skeleton" style={{ width: '100px', height: '36px', borderRadius: 'var(--radius-md)' }} />
                <div className="skeleton" style={{ width: '100px', height: '36px', borderRadius: 'var(--radius-md)' }} />
              </div>
            </div>

            {/* Video List Table Skeleton */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div className="skeleton" style={{ width: '220px', height: '24px' }} />
                <div className="skeleton" style={{ width: '200px', height: '36px', borderRadius: 'var(--radius-md)' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <div 
                    key={n} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      padding: '12px 14px', 
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      gap: '1rem'
                    }}
                  >
                    <div className="skeleton" style={{ width: '24px', height: '16px' }} />
                    <div className="skeleton" style={{ flex: 1, height: '16px', maxWidth: `${75 - (n % 4) * 10}%` }} />
                    <div className="skeleton" style={{ width: '60px', height: '22px', borderRadius: 'var(--radius-full)' }} />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Results Area */}
        <AnimatePresence>
          {!loading && result && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              
              {/* Metric Overview Cards */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
                gap: '1rem', 
                marginBottom: '1.5rem' 
              }}>
                <motion.div 
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                  className="card" 
                  style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}
                >
                  <div style={{ 
                    background: 'rgba(122, 138, 186, 0.15)', 
                    color: 'var(--c-canvas-soft)', 
                    padding: '0.75rem', 
                    borderRadius: 'var(--radius-md)' 
                  }}>
                    <ListVideo size={24} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total Videos</p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{result.totalVideos}</h3>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                  className="card" 
                  style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}
                >
                  <div style={{ 
                    background: 'rgba(246, 141, 31, 0.15)', 
                    color: 'var(--c-signal)', 
                    padding: '0.75rem', 
                    borderRadius: 'var(--radius-md)' 
                  }}>
                    <Clock size={24} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total Runtime</p>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--c-signal)' }}>{result.totalDurationFormatted}</h3>
                  </div>
                </motion.div>

                <div className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={downloadJSON} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                    <Download size={15} /> Export JSON
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={downloadTXT} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                    <Download size={15} /> Export TXT
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => copyToClipboard('json')} className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
                    {copiedType === 'json' ? <Check size={15} /> : <Copy size={15} />}
                    {copiedType === 'json' ? 'Copied JSON' : 'Copy JSON'}
                  </motion.button>
                </div>
              </div>

              {/* Video List Table */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  flexWrap: 'wrap', 
                  gap: '1rem', 
                  marginBottom: '1.25rem' 
                }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                    Playlist: <span style={{ color: 'var(--c-canvas-soft)' }}>{result.title}</span>
                  </h3>

                  <div style={{ position: 'relative', width: '260px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                    <input
                      type="text"
                      className="input-text"
                      placeholder="Filter videos..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ paddingLeft: '2.25rem', paddingRight: '0.75rem', paddingTop: '0.45rem', paddingBottom: '0.45rem', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>

                <div 
                  data-lenis-prevent
                  style={{ 
                    overflowY: 'auto', 
                    maxHeight: '520px', 
                    overscrollBehavior: 'contain',
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.925rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.75rem 1rem', width: '60px' }}>#</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Video Title</th>
                        <th style={{ padding: '0.75rem 1rem', width: '120px', textAlign: 'right' }}>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item, idx) => (
                        <motion.tr 
                          key={item.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: Math.min(idx * 0.015, 0.3) }}
                          style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', transition: 'background 0.15s ease' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ padding: '0.85rem 1rem', color: 'var(--text-dim)', fontWeight: 600 }}>{item.id}</td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 500 }}>
                            {item.videoId ? (
                              <a 
                                href={`https://www.youtube.com/watch?v=${item.videoId}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--c-canvas-soft)')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = 'inherit')}
                              >
                                <span>{item.title}</span>
                                <ExternalLink size={13} opacity={0.5} />
                              </a>
                            ) : (
                              item.title
                            )}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                            <span className="badge badge-periwinkle" style={{ fontFamily: 'monospace' }}>
                              {item.duration || '--:--'}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                      {filteredItems.length === 0 && (
                        <tr>
                          <td colSpan={3} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                            No videos match your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </motion.section>
          )}
        </AnimatePresence>

      </main>

      {/* ─── CLEAN FOOTER ─── */}
      <footer style={{ 
        borderTop: '1px solid var(--border-indigo)', 
        background: 'var(--c-carbon-nav)', 
        padding: '2.25rem 0',
        marginTop: 'auto'
      }}>
        <div className="site-container" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '1.25rem' 
        }}>
          {/* Creator Mention as a Clean Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Created by</span>
            <motion.a 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="https://www.akarshan.me" 
              target="_blank" 
              rel="noreferrer"
              className="btn btn-outline"
              style={{ 
                padding: '0.35rem 0.85rem', 
                fontSize: '0.825rem',
                color: 'var(--c-signal)',
                borderColor: 'rgba(246, 141, 31, 0.4)',
                background: 'rgba(246, 141, 31, 0.08)'
              }}
            >
              <span>Akarshan</span>
              <ExternalLink size={12} />
            </motion.a>
          </div>

          {/* Legal Navigation & Copyright */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.875rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              © {new Date().getFullYear()} TrackPulse.
            </span>
            <button 
              onClick={() => setActiveModal('privacy')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 500 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              Privacy Policy
            </button>
            <button 
              onClick={() => setActiveModal('terms')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 500 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              Terms & Conditions
            </button>
          </div>
        </div>
      </footer>

      {/* ─── MODALS WITH ANIMATION ─── */}
      <AnimatePresence>
        {activeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay" 
            onClick={() => setActiveModal(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="card" 
              style={{ width: '100%', maxWidth: '540px', padding: '1.75rem' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {activeModal === 'privacy' ? <ShieldCheck size={20} color="var(--c-canvas-soft)" /> : <FileText size={20} color="var(--c-canvas-soft)" />}
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                    {activeModal === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions'}
                  </h3>
                </div>
                <button 
                  onClick={() => setActiveModal(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div 
                data-lenis-prevent
                style={{ 
                  fontSize: '0.9rem', 
                  color: 'var(--text-muted)', 
                  lineHeight: 1.6, 
                  maxHeight: '340px', 
                  overflowY: 'auto',
                  paddingRight: '0.5rem',
                  overscrollBehavior: 'contain'
                }}
              >
                {activeModal === 'privacy' ? (
                  <div>
                    <p style={{ marginBottom: '1rem' }}>
                      TrackPulse values your privacy. We process playlist URLs on-the-fly and do not retain, store, or track any personal information or query logs.
                    </p>
                    <p>
                      All requests to public video playlist endpoints are handled statelessly in-memory to provide instant JSON and duration metrics.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p style={{ marginBottom: '1rem' }}>
                      1. <strong>Usage</strong>: TrackPulse is an open metadata extraction tool intended for educational, analytical, and productivity workflows.
                    </p>
                    <p style={{ marginBottom: '1rem' }}>
                      2. <strong>Public Data</strong>: All video titles and duration information are gathered directly from publicly available YouTube playlist endpoints.
                    </p>
                    <p>
                      3. <strong>Disclaimer</strong>: This application is provided on an &quot;as-is&quot; basis without warranties of any kind.
                    </p>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                <button onClick={() => setActiveModal(null)} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
