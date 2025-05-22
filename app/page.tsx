'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Check, AlertCircle, FileWarning, FileX, FileDiff, Upload, FileCheck } from 'lucide-react';

interface ComparisonResult {
  success: boolean;
  mismatches: MismatchRecord[];
  excelContainerCount: number;
  pdfContainerCount: number;
  matches: MatchRecord[];
  stats: {
    weightDifferenceAvg: number;
    weightDifferenceMax: number;
    sealMatchCount: number;
    sealMismatchCount: number;
    missingPdfSealCount: number;
    missingExcelSealCount: number;
    totalChecked: number;
    pdfContainers: number;
  };
}

interface MismatchRecord {
  container: string;
  excelWeight: number;
  pdfWeight: number;
  difference: number;
  percentDifference: number;
  excelSeal?: string;
  pdfSeal?: string;
  sealMatch?: boolean;
  pdfVgm?: number;
  weightDifference?: number;
  vgmDifference?: number;
  containerNotFound?: boolean;
  weightMismatch?: boolean;
  sealMismatch?: boolean;
}

interface MatchRecord {
  container: string;
  weight: number;
  excelSeal?: string;
  pdfSeal?: string;
  sealMatch?: boolean;
}

interface DetailedError {
  error: string;
  details?: string;
  pdfSample?: string;
  availableColumns?: string[];
}

export default function Home() {
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [detailedError, setDetailedError] = useState<DetailedError | null>(null);
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [selectedExcel, setSelectedExcel] = useState<string | null>(null);

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedPdf(e.target.files[0].name);
    }
  };

  const handleExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedExcel(e.target.files[0].name);
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDetailedError(null);
    setResult(null);
    setProgress(10);
    
    // İlerleme çubuğu animasyonu
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 90) {
          clearInterval(timer);
          return oldProgress;
        }
        return oldProgress + 10;
      });
    }, 800);
    
    try {
      const formData = new FormData(e.currentTarget);

      // Dosyaların seçilip seçilmediğini kontrol et
      const pdfFile = formData.get('pdf') as File;
      const excelFile = formData.get('excel') as File;

      if (!pdfFile || !excelFile) {
        throw new Error('Lütfen hem PDF hem de Excel dosyası seçin.');
      }

      // Dosya tiplerini kontrol et
      if (!pdfFile.name.toLowerCase().endsWith('.pdf')) {
        throw new Error('Lütfen geçerli bir PDF dosyası (.pdf) seçin.');
      }
      
      if (!excelFile.name.toLowerCase().match(/\.(xlsx|xls)$/)) {
        throw new Error('Lütfen geçerli bir Excel dosyası (.xlsx veya .xls) seçin.');
      }

      const res = await fetch('/api/compare', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      
      if (!res.ok) {
        setDetailedError(data);
        throw new Error(data.error || 'Karşılaştırma sırasında bir hata oluştu');
      }

      setProgress(100);
      setResult(data);
    } catch (err) {
      console.error('Hata:', err);
      setError(err instanceof Error ? err.message : 'Beklenmeyen bir hata oluştu');
    } finally {
      clearInterval(timer);
      setLoading(false);
    }
  }

  return (
    <div style={{ 
      width: '100%',
      margin: '0 auto', 
      padding: '40px 20px',
      background: '#f8fafc',
      backgroundImage: 'url("/images/pattern-bg.svg")',
      backgroundSize: '200px 200px',
      backgroundAttachment: 'fixed'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '1000px', 
        margin: '0 auto 30px auto',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', 
          padding: '35px 30px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '200px',
            height: '100%',
            background: 'url("/images/container-ship.svg") no-repeat',
            backgroundSize: 'contain',
            backgroundPosition: 'right center',
            opacity: 0.2,
            zIndex: 1
          }}></div>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h1 style={{ 
              fontSize: '36px', 
              fontWeight: 'bold', 
              margin: '0 0 15px 0',
              letterSpacing: '-0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M22 12H2"></path>
                <path d="M5 12V5c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v7"></path>
                <path d="M9 3v18"></path>
                <path d="M15 3v18"></path>
              </svg>
              BOLCheck
            </h1>
            <p style={{ 
              color: '#e0e7ff', 
              margin: '0',
              fontSize: '16px',
              opacity: 0.9
            }}>
              PDF dosyasındaki konteyner bilgilerini Excel verilerinizle karşılaştırın
            </p>
          </div>
        </div>
        
        <div style={{ padding: '30px' }}>
          <form onSubmit={handleSubmit} style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '30px'
          }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: '25px' 
            }}>
              <div style={{ 
                overflow: 'hidden', 
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', 
                border: '2px dashed #d1d5db',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                backgroundColor: '#fafafa',
                transform: selectedPdf ? 'scale(1.01)' : 'scale(1)',
                position: 'relative'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(59, 130, 246, 0.1), 0 4px 6px -2px rgba(59, 130, 246, 0.05)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
              }}>
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: '80px',
                  height: '80px',
                  background: 'url("/images/document.svg") no-repeat',
                  backgroundSize: 'contain',
                  backgroundPosition: 'right bottom',
                  opacity: 0.1,
                  zIndex: 1
                }}></div>
                <div style={{ padding: '20px' }}>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '15px', 
                    padding: '25px 15px' 
                  }}>
                    <div style={{ 
                      height: '70px', 
                      width: '70px', 
                      borderRadius: '50%', 
                      backgroundColor: selectedPdf ? '#f0fdf4' : '#eff6ff', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      transition: 'all 0.3s ease'
                    }}>
                      {selectedPdf ? (
                        <FileCheck color="#16a34a" size={32} />
                      ) : (
                        <Upload color="#3b82f6" size={32} />
                      )}
                    </div>
                    <Label htmlFor="pdf" style={{ 
                      fontSize: '20px', 
                      fontWeight: '600', 
                      cursor: 'pointer',
                      color: '#1f2937' 
                    }}>
                      {selectedPdf || "PDF Dosyası Seçin"}
                    </Label>
                    <p style={{ 
                      fontSize: '14px', 
                      color: '#6b7280', 
                      textAlign: 'center', 
                      margin: '0 0 10px 0' 
                    }}>
                      PDF dosyası konteyner, mühür ve ağırlık bilgilerini içermelidir
                    </p>
                    <Input 
                      id="pdf" 
                      name="pdf" 
                      type="file" 
                      accept="application/pdf" 
                      required 
                      style={{ display: 'none' }}
                      onChange={handlePdfChange}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => document.getElementById('pdf')?.click()}
                      style={{ 
                        marginTop: '5px',
                        border: '1px solid #d1d5db',
                        backgroundColor: '#f9fafb',
                        color: '#374151',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        fontSize: '15px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                      }}
                    >
                      Dosya Seç
                    </Button>
                  </div>
                </div>
              </div>
              
              <div style={{ 
                overflow: 'hidden', 
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', 
                border: '2px dashed #d1d5db',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                backgroundColor: '#fafafa',
                transform: selectedExcel ? 'scale(1.01)' : 'scale(1)',
                position: 'relative'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(59, 130, 246, 0.1), 0 4px 6px -2px rgba(59, 130, 246, 0.05)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
              }}>
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: '80px',
                  height: '80px',
                  background: 'url("/images/excel.svg") no-repeat',
                  backgroundSize: 'contain',
                  backgroundPosition: 'right bottom',
                  opacity: 0.1,
                  zIndex: 1
                }}></div>
                <div style={{ padding: '20px' }}>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '15px', 
                    padding: '25px 15px' 
                  }}>
                    <div style={{ 
                      height: '70px', 
                      width: '70px', 
                      borderRadius: '50%', 
                      backgroundColor: selectedExcel ? '#f0fdf4' : '#eff6ff', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      transition: 'all 0.3s ease'
                    }}>
                      {selectedExcel ? (
                        <FileCheck color="#16a34a" size={32} />
                      ) : (
                        <Upload color="#3b82f6" size={32} />
                      )}
                    </div>
                    <Label htmlFor="excel" style={{ 
                      fontSize: '20px', 
                      fontWeight: '600', 
                      cursor: 'pointer',
                      color: '#1f2937'
                    }}>
                      {selectedExcel || "Excel Dosyası Seçin"}
                    </Label>
                    <p style={{ 
                      fontSize: '14px', 
                      color: '#6b7280', 
                      textAlign: 'center', 
                      margin: '0 0 10px 0' 
                    }}>
                      Excel dosyasında &quot;KONTEYNIR NO&quot;, &quot;TONAJ&quot; ve &quot;MÜHÜR NO&quot; sütunları olmalıdır
                    </p>
                    <Input 
                      id="excel" 
                      name="excel" 
                      type="file" 
                      accept=".xlsx,.xls" 
                      required 
                      style={{ display: 'none' }}
                      onChange={handleExcelChange}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => document.getElementById('excel')?.click()}
                      style={{ 
                        marginTop: '5px',
                        border: '1px solid #d1d5db',
                        backgroundColor: '#f9fafb',
                        color: '#374151',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        fontSize: '15px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                      }}
                    >
                      Dosya Seç
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <Button 
                type="submit" 
                disabled={loading} 
                style={{ 
                  width: '100%', 
                  height: '54px', 
                  fontSize: '18px', 
                  fontWeight: 'bold',
                  backgroundColor: loading ? '#93c5fd' : '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3), 0 2px 4px -1px rgba(37, 99, 235, 0.1)'
                }}
              >
                {loading ? 'Karşılaştırılıyor...' : 'Dosyaları Karşılaştır'}
              </Button>
            </div>
          </form>
        </div>
      </div>
      
      {loading && (
        <div style={{ 
          width: '100%', 
          maxWidth: '1000px', 
          margin: '0 auto 30px auto',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '30px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{
                  height: '56px',
                  width: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2), 0 2px 4px -1px rgba(59, 130, 246, 0.1)'
                }}>
                  <FileDiff color="#3b82f6" size={28} style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '6px', color: '#1f2937' }}>Dosyalar Karşılaştırılıyor</h3>
                  <p style={{ color: '#6b7280', fontSize: '15px', margin: '0' }}>Verileriniz analiz ediliyor, lütfen bekleyin...</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ 
                  width: '100%',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '9999px',
                  height: '10px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                    borderRadius: '9999px',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
                <p style={{ fontSize: '13px', textAlign: 'right', color: '#6b7280', margin: '0', fontWeight: '500' }}>{progress}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{ 
          width: '100%', 
          maxWidth: '1000px', 
          margin: '0 auto 24px auto',
          backgroundColor: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '8px',
          padding: '16px',
          display: 'flex',
          alignItems: 'flex-start'
        }}>
          <AlertCircle size={16} color="#b91c1c" style={{ marginRight: '12px', flexShrink: 0 }} />
          <div>
            <h4 style={{ fontWeight: '600', color: '#b91c1c', marginTop: '0', marginBottom: '4px' }}>Hata</h4>
            <p style={{ color: '#b91c1c', margin: '0' }}>{error}</p>
            
            {detailedError && (
              <div style={{ marginTop: '16px', fontSize: '14px' }}>
                {detailedError.details && (
                  <p style={{ marginBottom: '8px' }}>Hata Detayı: {detailedError.details}</p>
                )}
                
                {detailedError.pdfSample && (
                  <div style={{ marginTop: '8px' }}>
                    <p style={{ fontWeight: '500', marginBottom: '4px' }}>PDF İçeriği Örneği:</p>
                    <pre style={{ 
                      marginTop: '4px', 
                      padding: '8px', 
                      backgroundColor: '#1f2937', 
                      color: '#e5e7eb', 
                      overflowX: 'auto', 
                      borderRadius: '4px', 
                      fontSize: '12px' 
                    }}>
                      {detailedError.pdfSample}
                    </pre>
                  </div>
                )}
                
                {detailedError.availableColumns && (
                  <div style={{ marginTop: '8px' }}>
                    <p style={{ fontWeight: '500', marginBottom: '4px' }}>Excel Dosyasındaki Mevcut Sütunlar:</p>
                    <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginTop: '4px' }}>
                      {detailedError.availableColumns?.map((col, i) => (
                        <li key={i}>{col}</li>
                      ))}
                    </ul>
                    <p style={{ marginTop: '4px' }}>Not: Excel dosyanızın ilk satırında &quot;KONTEYNIR NO&quot; ve &quot;TONAJ&quot; veya &quot;VGM&quot; sütunları olmalıdır.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {result && result.success && (
        <>
          {result.mismatches.length === 0 ? (
            <div style={{ 
              backgroundColor: '#f0fdf4', 
              border: '1px solid #86efac', 
              borderRadius: '16px', 
              padding: '25px', 
              maxWidth: '1000px',
              margin: '0 auto 30px auto',
              display: 'flex',
              alignItems: 'flex-start',
              boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.1), 0 2px 4px -1px rgba(22, 163, 74, 0.06)'
            }}>
              <div style={{
                height: '40px',
                width: '40px',
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginRight: '20px',
                boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.2), 0 2px 4px -1px rgba(22, 163, 74, 0.1)'
              }}>
                <Check size={20} color="#16a34a" />
              </div>
              <div>
                <h4 style={{ fontWeight: '600', color: '#15803d', marginTop: '0', marginBottom: '8px', fontSize: '18px' }}>Tüm Veriler Uyumlu</h4>
                <p style={{ color: '#16a34a', margin: '0', fontSize: '15px', lineHeight: '1.5' }}>
                  Toplam {result.stats.totalChecked} kayıt kontrol edildi,
                  PDF&apos;de {result.stats.pdfContainers} konteyner bulundu. Tüm veriler birbirleriyle uyumlu.
                </p>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: '40px' }}>
              <div style={{ 
                backgroundColor: 'white',
                borderRadius: '16px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  width: '120px',
                  height: '120px',
                  background: 'url("/images/container-warning.svg") no-repeat',
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  opacity: 0.07,
                  zIndex: 1
                }}></div>
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ 
                      color: '#b91c1c', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px',
                      margin: '0',
                      fontSize: '20px',
                      fontWeight: '600'
                    }}>
                      <FileWarning size={22} strokeWidth={2} /> Uyuşmazlıklar Tespit Edildi
                    </h3>
                    <div style={{ 
                      backgroundColor: '#fee2e2', 
                      color: '#991b1b', 
                      borderRadius: '9999px', 
                      padding: '6px 14px',
                      fontSize: '15px',
                      fontWeight: '600',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                    }}>
                      {result.mismatches.length} Uyuşmazlık
                    </div>
                  </div>
                  <p style={{ color: '#dc2626', fontSize: '15px', marginTop: '10px', marginBottom: '0' }}>
                    Toplam {result.stats.totalChecked} kayıt kontrol edildi,
                    PDF&apos;de {result.stats.pdfContainers} konteyner bulundu.
                  </p>
                </div>
                
                <div style={{ padding: '0' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                          <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: '600', fontSize: '15px', color: '#374151' }}>Konteyner</th>
                          <th style={{ padding: '14px 18px', textAlign: 'right', fontWeight: '600', fontSize: '15px', color: '#374151' }}>Excel Ağırlık</th>
                          <th style={{ padding: '14px 18px', textAlign: 'right', fontWeight: '600', fontSize: '15px', color: '#374151' }}>PDF Ağırlık</th>
                          <th style={{ padding: '14px 18px', textAlign: 'right', fontWeight: '600', fontSize: '15px', color: '#374151', display: 'table-cell' }} className="hide-on-mobile">PDF VGM</th>
                          <th style={{ padding: '14px 18px', textAlign: 'right', fontWeight: '600', fontSize: '15px', color: '#374151' }}>Fark</th>
                          <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: '600', fontSize: '15px', color: '#374151', display: 'table-cell' }} className="hide-on-mobile">Excel Mühür</th>
                          <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: '600', fontSize: '15px', color: '#374151', display: 'table-cell' }} className="hide-on-mobile">PDF Mühür</th>
                          <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: '600', fontSize: '15px', color: '#374151' }}>Durum</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.mismatches.map((item, index) => (
                          <tr key={index} style={{ 
                            borderBottom: '1px solid #e5e7eb',
                            backgroundColor: index % 2 === 0 ? '#f9fafb' : 'white',
                            transition: 'background-color 0.2s'
                          }}>
                            <td style={{ padding: '16px 18px', fontWeight: '500', color: '#1f2937' }}>{item.container}</td>
                            <td style={{ padding: '16px 18px', textAlign: 'right', fontFamily: 'monospace', fontSize: '15px', color: '#374151' }}>
                              {item.excelWeight ? item.excelWeight.toLocaleString('tr-TR') : '-'}
                            </td>
                            <td style={{ padding: '16px 18px', textAlign: 'right', fontFamily: 'monospace', fontSize: '15px', color: '#374151' }}>
                              {item.pdfWeight ? item.pdfWeight.toLocaleString('tr-TR') : '-'}
                            </td>
                            <td style={{ padding: '16px 18px', textAlign: 'right', fontFamily: 'monospace', fontSize: '15px', color: '#374151', display: 'table-cell' }} className="hide-on-mobile">
                              {item.pdfVgm ? item.pdfVgm.toLocaleString('tr-TR') : '-'}
                            </td>
                            <td style={{ padding: '16px 18px', textAlign: 'right', fontWeight: '600', color: '#dc2626', fontFamily: 'monospace', fontSize: '15px' }}>
                              {item.weightDifference ? item.weightDifference.toLocaleString('tr-TR') : 
                               item.vgmDifference ? item.vgmDifference.toLocaleString('tr-TR') : '-'}
                            </td>
                            <td style={{ padding: '16px 18px', color: '#374151', fontSize: '15px', display: 'table-cell' }} className="hide-on-mobile">{item.excelSeal || '-'}</td>
                            <td style={{ padding: '16px 18px', color: '#374151', fontSize: '15px', display: 'table-cell' }} className="hide-on-mobile">{item.pdfSeal || '-'}</td>
                            <td style={{ padding: '16px 18px' }}>
                              {item.containerNotFound ? (
                                <span style={{ 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  borderRadius: '9999px', 
                                  backgroundColor: '#fee2e2', 
                                  padding: '4px 12px',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  color: '#991b1b'
                                }}>
                                  <FileX size={14} style={{ marginRight: '6px' }} /> Bulunamadı
                                </span>
                              ) : item.weightMismatch && item.sealMismatch ? (
                                <span style={{ 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  borderRadius: '9999px', 
                                  backgroundColor: '#fee2e2', 
                                  padding: '4px 12px',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  color: '#991b1b'
                                }}>
                                  Ağırlık ve Mühür
                                </span>
                              ) : item.weightMismatch ? (
                                <span style={{ 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  borderRadius: '9999px', 
                                  backgroundColor: '#ffedd5', 
                                  padding: '4px 12px',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  color: '#9a3412'
                                }}>
                                  Ağırlık
                                </span>
                              ) : item.sealMismatch ? (
                                <span style={{ 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  borderRadius: '9999px', 
                                  backgroundColor: '#fef9c3', 
                                  padding: '4px 12px',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  color: '#854d0e'
                                }}>
                                  Mühür
                                </span>
                              ) : (
                                <span style={{ 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  borderRadius: '9999px', 
                                  backgroundColor: '#dcfce7', 
                                  padding: '4px 12px',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  color: '#166534'
                                }}>
                                  <Check size={14} style={{ marginRight: '6px' }} /> Uyumlu
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      <div style={{ 
        width: '100%', 
        maxWidth: '1000px', 
        margin: '0 auto',
        backgroundColor: '#f1f5f9',
        border: '1px solid #cbd5e1',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}>
        <div style={{ padding: '25px', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ 
            color: '#0f172a', 
            fontSize: '22px', 
            margin: '0', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px' 
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 16v-4"></path>
              <path d="M12 8h.01"></path>
            </svg>
            Kullanım Kılavuzu
          </h3>
        </div>
        <div style={{ padding: '0 25px 25px 25px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: '#334155', fontSize: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
              <div style={{ 
                backgroundColor: '#bfdbfe', 
                borderRadius: '50%', 
                height: '28px', 
                width: '28px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                flexShrink: 0,
                marginTop: '2px',
                color: '#1e40af',
                fontWeight: 'bold',
                fontSize: '14px'
              }}>1</div>
              <div>
                <p style={{ fontWeight: '600', marginTop: '0', marginBottom: '6px', color: '#1e3a8a', fontSize: '16px' }}>Excel Formatı:</p>
                <p style={{ margin: '0', lineHeight: '1.6' }}>Excel dosyanızda &quot;KONTEYNIR NO&quot;, &quot;TONAJ&quot; veya &quot;VGM&quot;, ve &quot;MÜHÜR NO&quot; sütunları olmalıdır.</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
              <div style={{ 
                backgroundColor: '#bfdbfe', 
                borderRadius: '50%', 
                height: '28px', 
                width: '28px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                flexShrink: 0,
                marginTop: '2px',
                color: '#1e40af',
                fontWeight: 'bold',
                fontSize: '14px'
              }}>2</div>
              <div>
                <p style={{ fontWeight: '600', marginTop: '0', marginBottom: '6px', color: '#1e3a8a', fontSize: '16px' }}>PDF Formatı:</p>
                <p style={{ margin: '0', lineHeight: '1.6' }}>PDF dosyası konteyner numaralarını ve ağırlık bilgilerini metin olarak içermelidir.</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
              <div style={{ 
                backgroundColor: '#bfdbfe', 
                borderRadius: '50%', 
                height: '28px', 
                width: '28px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                flexShrink: 0,
                marginTop: '2px',
                color: '#1e40af',
                fontWeight: 'bold',
                fontSize: '14px'
              }}>3</div>
              <div>
                <p style={{ fontWeight: '600', marginTop: '0', marginBottom: '6px', color: '#1e3a8a', fontSize: '16px' }}>Konteyner Numarası Format:</p>
                <p style={{ margin: '0', lineHeight: '1.6' }}>Konteyner numaraları 4 harf + 7 rakam (örn: TRHU1563728) formatında olmalıdır.</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
              <div style={{ 
                backgroundColor: '#bfdbfe', 
                borderRadius: '50%', 
                height: '28px', 
                width: '28px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                flexShrink: 0,
                marginTop: '2px',
                color: '#1e40af',
                fontWeight: 'bold',
                fontSize: '14px'
              }}>4</div>
              <div>
                <p style={{ fontWeight: '600', marginTop: '0', marginBottom: '6px', color: '#1e3a8a', fontSize: '16px' }}>Ağırlık Formatı:</p>
                <p style={{ margin: '0', lineHeight: '1.6' }}>Ağırlıklar genellikle &quot;27,920.000 kgs&quot;, &quot;27.920 MT&quot;, &quot;VGM: 27920 kg&quot; gibi formatları destekler.</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
              <div style={{ 
                backgroundColor: '#bfdbfe', 
                borderRadius: '50%', 
                height: '28px', 
                width: '28px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                flexShrink: 0,
                marginTop: '2px',
                color: '#1e40af',
                fontWeight: 'bold',
                fontSize: '14px'
              }}>5</div>
              <div>
                <p style={{ fontWeight: '600', marginTop: '0', marginBottom: '6px', color: '#1e3a8a', fontSize: '16px' }}>VGM (Verified Gross Mass):</p>
                <p style={{ margin: '0', lineHeight: '1.6' }}>PDF&apos;de hem brüt ağırlık hem VGM değeri varsa, sistem uyuşmazlık durumunda her ikisini de kontrol eder.</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
              <div style={{ 
                backgroundColor: '#bfdbfe', 
                borderRadius: '50%', 
                height: '28px', 
                width: '28px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                flexShrink: 0,
                marginTop: '2px',
                color: '#1e40af',
                fontWeight: 'bold',
                fontSize: '14px'
              }}>6</div>
              <div>
                <p style={{ fontWeight: '600', marginTop: '0', marginBottom: '6px', color: '#1e3a8a', fontSize: '16px' }}>Mühür Formatı:</p>
                <p style={{ margin: '0', lineHeight: '1.6' }}>Mühür numaraları &quot;EU29324275&quot;, &quot;ML123456&quot;, &quot;SL123456&quot;, &quot;CBMU1234567&quot; gibi formatları destekler.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 