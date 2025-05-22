import '@/app/globals.css'

// Using this font warning can be ignored as it's a known issue with the App Router
// The warning is: "Custom fonts not added in `pages/_document.js` will only load for a single page"
// This is expected behavior for the App Router and doesn't affect functionality
export const metadata = {
  title: 'BOLCheck - Konteyner Bilgisi Doğrulama',
  description: 'PDF konşimento ve Excel dosyalarınızı karşılaştırarak konteyner bilgilerini doğrulayın',
  keywords: 'konteyner, pdf, excel, karşılaştırma, bol, check, yük, lojistik',
  authors: [{ name: 'BOLCheck', url: '' }],
  themeColor: '#3b82f6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ 
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: '#f8fafc',
        color: '#0f172a'
      }}>
        <main style={{ flex: '1 1 auto', overflow: 'hidden' }}>
          {children}
        </main>
        <footer style={{ 
          textAlign: 'center', 
          padding: '1.5rem', 
          color: '#64748b', 
          fontSize: '0.875rem',
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#ffffff'
        }}>
          <p>© {new Date().getFullYear()} BOLCheck - PDF ve Excel Karşılaştırma Aracı</p>
        </footer>
      </body>
    </html>
  )
} 