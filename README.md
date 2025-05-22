# BOLCheck: PDF ve Excel Konteyner Karşılaştırma Aracı

BOLCheck, PDF dosyalarındaki konteyner bilgilerini Excel dosyasındaki verilerle karşılaştıran bir uygulamadır. Konteyner numaralarını, ağırlıkları ve mühür numaralarını karşılaştırarak, uyuşmazlıkları tespit eder.

## Özellikler

- 📄 PDF dosyasından konteyner, ağırlık ve mühür bilgilerini otomatik çıkarma
- 📊 Excel verileriyle otomatik karşılaştırma
- ⚖️ Ağırlık farkı tolerans kontrolü
- 🔍 VGM (Verified Gross Mass) ve brüt ağırlık karşılaştırması
- 🔒 Farklı mühür formatı desteği (EU, ML, SL, CBMU)
- 📱 Duyarlı ve modern kullanıcı arayüzü

## Kurulum

```bash
# Depoyu kopyalama
git clone https://github.com/kullaniciadi/bolcheck.git
cd bolcheck

# Bağımlılıkları yükleme
npm install

# Geliştirme sunucusunu başlatma
npm run dev
```

## Kullanım

1. Uygulamayı açın (varsayılan olarak http://localhost:3000)
2. Karşılaştırmak istediğiniz PDF ve Excel dosyalarını seçin
3. "Dosyaları Karşılaştır" butonuna tıklayın
4. Sonuçları inceleyin - uyuşmazlıklar tabloda görüntülenecektir

### Excel Dosya Formatı

Excel dosyanızda aşağıdaki sütunlar olmalıdır:
- "KONTEYNIR NO" veya "KONTEYNER NO" - Konteyner numaralarını içeren sütun
- "TONAJ", "VGM", "BRÜT" veya "GROSS WEIGHT" - Ağırlık bilgilerini içeren sütun
- "MÜHÜR NO" veya "SEAL NO" (isteğe bağlı) - Mühür numaralarını içeren sütun

### PDF Dosya Formatı

PDF dosyası aşağıdaki bilgileri metin formatında içermelidir:
- Konteyner numaraları (4 harf + 7 rakam formatında, örn: TRHU1563728)
- Ağırlık bilgileri (27,920.000 kgs, 27.920 MT gibi formatlar)
- Mühür numaraları (EU29324275, ML123456, SL123456, CBMU1234567 gibi formatlar)

## Desteklenen Formatlar

### Ağırlık Formatları

- `27,920.000 kgs`
- `27.920 MT`
- `27920 kg`
- `VGM: 27.920 kg`
- `Gross Weight: 27920 kgs`

### Mühür Formatları

- `EU` formatı: EU12345678
- `ML` formatı: ML123456
- `SL` formatı: SL123456
- `CBMU` formatı: CBMU1234567

## Teknik Detaylar

- Next.js 14 ile geliştirilmiştir (App Router)
- React ve TypeScript kullanılmıştır
- Sunucu tarafında PDF dosya işleme için pdf-parse
- Excel dosya işleme için xlsx
- Modern UI bileşenleri için shadcn/ui ve Tailwind CSS

## Lisans

MIT
