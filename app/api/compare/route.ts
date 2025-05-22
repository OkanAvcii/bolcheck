import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import pdf from 'pdf-parse';

// Node.js runtime kullanacağımızı belirt
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Konteyner veri tipi
interface ContainerData {
  weight: number;         // Brüt ağırlık
  seal?: string;          // Mühür no
  vgm?: number;           // Doğrulanmış brüt ağırlık (VGM)
  context?: string;       // Konteyner bağlamı (çevresi metni)
}

// Excel veri tipi
interface ExcelDataRow {
  [key: string]: string | number;
}

export async function POST(req: NextRequest) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { headers, status: 200 });
  }

  try {
    // Form verilerini al
    const formData = await req.formData();
    const pdfFile = formData.get('pdf') as File;
    const excelFile = formData.get('excel') as File;

    if (!pdfFile || !excelFile) {
      return NextResponse.json({ error: 'Dosyalar eksik' }, { status: 400, headers });
    }

    console.log(`PDF: ${pdfFile.name}, Excel: ${excelFile.name}`);

    // EXCEL İŞLEME BÖLÜMÜ
    let excelData: ExcelDataRow[] = [];
    try {
      const excelBuffer = await excelFile.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(excelBuffer), { type: 'array' });
      
      if (workbook.SheetNames.length === 0) {
        return NextResponse.json({ 
          error: 'Excel dosyasında hiç sayfa bulunamadı' 
        }, { status: 400, headers });
      }
      
      // İlk sayfayı al
      const firstSheet = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheet];
      
      // JSON'a çevir
      excelData = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as ExcelDataRow[];
      
      if (!excelData || excelData.length === 0) {
        return NextResponse.json({ 
          error: 'Excel dosyası veri içermiyor' 
        }, { status: 400, headers });
      }

      console.log(`Excel veri sayısı: ${excelData.length}`);
    } catch (error) {
      return NextResponse.json({ 
        error: 'Excel dosyası ayrıştırılamadı', 
        details: String(error)
      }, { status: 400, headers });
    }

    // Excel sütunlarını belirle
    const firstRow = excelData[0];
    
    // Sütun isimlerini normalleştir ve bul
    const normalizeColumnName = (key: string) => key.toUpperCase().replace(/\s+/g, '');
    const columnMatches = (key: string, pattern: string) => normalizeColumnName(key) === normalizeColumnName(pattern);
    const columnIncludes = (key: string, pattern: string) => normalizeColumnName(key).includes(normalizeColumnName(pattern));
    
    // Konteyner sütunu
    const containerColumnName = Object.keys(firstRow).find(key => 
      columnMatches(key, 'KONTEYNIR NO') || 
      columnMatches(key, 'KONTEYNER NO') || 
      columnIncludes(key, 'KONTNO') || 
      columnIncludes(key, 'CONTAINER'));
    
    // Ağırlık sütunu: Öncelikle TONAJ, sonra diğerleri
    const weightColumnName = Object.keys(firstRow).find(key => 
      columnMatches(key, 'TONAJ')) || 
      Object.keys(firstRow).find(key => 
      columnMatches(key, 'VGM') ||
      columnIncludes(key, 'BRÜT') || 
      columnIncludes(key, 'GROSS') ||
      columnIncludes(key, 'WEIGHT'));
    
    // Mühür sütunu
    const sealColumnName = Object.keys(firstRow).find(key => 
      columnMatches(key, 'MÜHÜR NO') || 
      columnMatches(key, 'MUHUR NO') ||
      columnIncludes(key, 'SEAL'));
    
    // Gerekli sütunları kontrol et
    if (!containerColumnName || !weightColumnName) {
      return NextResponse.json({ 
        error: 'Excel dosyası gerekli sütunları içermiyor (KONTEYNIR NO, TONAJ/VGM)',
        availableColumns: Object.keys(firstRow) 
      }, { status: 400, headers });
    }
    
    console.log(`Excel sütunları: Konteyner: ${containerColumnName}, Ağırlık: ${weightColumnName}, Mühür: ${sealColumnName || 'YOK'}`);

    // Mühür numarasını normalleştir
    const normalizeSeal = (seal: string): string => {
      if (!seal) return '';
      
      // Önce boşlukları ve özel karakterleri temizle
      const cleaned = seal.replace(/[\s\-_./\\]/g, '').toUpperCase();
      
      // EU veya ML gibi bilinen prefixleri yönet
      const prefixMatch = cleaned.match(/^(EU|ML|SL|CBMU|MLW|MC)(\d+)$/);
      if (prefixMatch) {
        // Prefix ve rakam kısmını ayır, tutarlı hale getir
        const [, prefix, number] = prefixMatch;
        return `${prefix}${number}`;
      }
      
      return cleaned;
    };

    // Excel verilerinden konteyner bilgilerini al
    const excelContainers: Record<string, {weight: number, seal?: string}> = {};
    
    // Excel verilerindeki konteyner bilgilerini hazırla
    for (const row of excelData) {
      const container = String(row[containerColumnName] || '').trim().toUpperCase();
      if (container) {
        const weightRaw = String(row[weightColumnName] || '0').replace(/,/g, '.');
        let weight = parseFloat(weightRaw) || 0;
        
        // Otomatik ton/kg dönüşümü yap
        if (weight > 0 && weight < 50) {
          // Muhtemelen ton cinsinden, kg'a çevir
          weight = weight * 1000;
        }
        
        let seal = undefined;
        if (sealColumnName && row[sealColumnName]) {
          seal = normalizeSeal(String(row[sealColumnName]));
        }
        
        excelContainers[container] = { weight, seal };
      }
    }
    
    const excelContainerCount = Object.keys(excelContainers).length;
    console.log(`Excel'de ${excelContainerCount} konteyner bulundu`);
    
    if (excelContainerCount === 0) {
      return NextResponse.json({ 
        error: 'Excel dosyasında konteyner bilgileri bulunamadı'
      }, { status: 400, headers });
    }

    // PDF İŞLEME BÖLÜMÜ
    let pdfText = "";
    try {
      const pdfBuffer = await pdfFile.arrayBuffer();
      const dataBuffer = await pdf(Buffer.from(pdfBuffer));
      pdfText = dataBuffer.text || "";
      
      if (!pdfText || pdfText.trim().length === 0) {
        return NextResponse.json({ 
          error: 'PDF dosyası metin içermiyor veya ayrıştırılamadı' 
        }, { status: 400, headers });
      }
      
      console.log(`PDF metin uzunluğu: ${pdfText.length}, sayfa sayısı: ${dataBuffer.numpages}`);
    } catch (error) {
      return NextResponse.json({ 
        error: 'PDF dosyası ayrıştırılamadı', 
        details: String(error)
      }, { status: 400, headers });
    }

    // PDF'deki tüm konteyner numaralarını bul
    const containerPattern = /([A-Z]{4}\d{7})/g;
    const pdfContainerMatches: {container: string, index: number}[] = [];
    
    let containerMatch;
    while ((containerMatch = containerPattern.exec(pdfText)) !== null) {
      pdfContainerMatches.push({
        container: containerMatch[1].trim().toUpperCase(),
        index: containerMatch.index
      });
    }
    
    if (pdfContainerMatches.length === 0) {
      return NextResponse.json({ 
        error: 'PDF dosyasında konteyner numaraları bulunamadı',
        pdfSample: pdfText.substring(0, 1000) 
      }, { status: 400, headers });
    }
    
    console.log(`PDF'de ${pdfContainerMatches.length} konteyner numarası bulundu`);
    
    // Ağırlık değerini normalleştir
    const normalizeWeight = (weightStr: string): number => {
      // Virgül ve nokta kullanımını düzeltme
      const normalized = weightStr.replace(/,(\d{3})/g, '$1').replace(/,/g, '.');
      const weight = Math.round(parseFloat(normalized));
      
      // Eğer 50'den küçükse, muhtemelen ton birimindedir, kg'a çevir
      return weight < 50 ? weight * 1000 : weight;
    };
    
    // Mühür karşılaştırması için gelişmiş fonksiyon
    const compareSealNumbers = (seal1?: string, seal2?: string): boolean => {
      if (!seal1 || !seal2) return false;
      
      const norm1 = normalizeSeal(seal1);
      const norm2 = normalizeSeal(seal2);
      
      // Tam eşleşme
      if (norm1 === norm2) return true;
      
      // Son 6-8 karakter eşleşiyor mu?
      const checkLastDigits = (s1: string, s2: string, digitCount: number) => {
        if (s1.length >= digitCount && s2.length >= digitCount) {
          return s1.slice(-digitCount) === s2.slice(-digitCount);
        }
        return false;
      };
      
      // Son 8, 7 veya 6 karakter kontrolü
      if (checkLastDigits(norm1, norm2, 8)) return true;
      if (checkLastDigits(norm1, norm2, 7)) return true;
      if (checkLastDigits(norm1, norm2, 6)) return true;
      
      // Birisi diğerini içeriyor mu?
      if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
      
      // Öneklerini ayır (EU, ML, SL, CBMU gibi) ve sadece rakam kısmını karşılaştır
      const stripPrefix = (seal: string): string => {
        const prefixMatch = seal.match(/^([A-Z]{2,4})(\d+)$/);
        return prefixMatch ? prefixMatch[2] : seal;
      };
      
      const stripSeal1 = stripPrefix(norm1);
      const stripSeal2 = stripPrefix(norm2);
      
      // Önek kaldırılmış şekilde eşleşme kontrolü
      if (stripSeal1 === stripSeal2) return true;
      
      // Tek harf/rakam farkı olabilir mi?
      if (Math.abs(norm1.length - norm2.length) <= 1) {
        // Uzunlukları yakın ama aynı değilse
        const [shorter, longer] = norm1.length <= norm2.length ? [norm1, norm2] : [norm2, norm1];
        
        // Karakter ekleme/çıkarma toleransı
        if (longer.includes(shorter)) return true;
        
        // Karakter değişimi toleransı - uzunlukları eşitse
        if (norm1.length === norm2.length) {
          let differences = 0;
          for (let i = 0; i < norm1.length; i++) {
            if (norm1[i] !== norm2[i]) differences++;
          }
          if (differences <= 1) return true;
        }
      }
      
      return false;
    };
    
    // PDF'deki her konteyner için metinsel bağlam ve veri hazırla
    const pdfContainerContexts: Record<string, string> = {};
    
    // Her konteyner için PDF'de geniş bir bağlam çıkar
    for (const {container, index} of pdfContainerMatches) {
      // Konteyner etrafındaki metni al - daha geniş bir bağlam için aralığı artır
      const startIndex = Math.max(0, index - 400);
      const endIndex = Math.min(pdfText.length, index + 800);
      const containerContext = pdfText.substring(startIndex, endIndex);
      
      // Eğer konteyner daha önce işlenmemişse veya mevcut bağlam daha kısaysa güncelle
      if (!pdfContainerContexts[container] || pdfContainerContexts[container].length < containerContext.length) {
        pdfContainerContexts[container] = containerContext;
      }
    }
    
    // PDF'deki konteyner verileri
    const pdfContainers: Record<string, ContainerData> = {};
    
    // ÖNEMLİ: Her konteyner için, önce Excel'deki eşleşen kaydı bul, sonra PDF'den verileri çıkar
    for (const container of Object.keys(pdfContainerContexts)) {
      const containerContext = pdfContainerContexts[container];
      
      // Excel'de bu konteyner var mı diye kontrol et
      if (!(container in excelContainers)) {
        console.log(`Konteyner ${container} Excel'de bulunamadı, bu nedenle işlenmeyecek`);
        continue; // Excel'de olmayan konteyneri işleme
      }
      
      // Excel'deki mühür numarasını al - karşılaştırma için
      const excelSeal = excelContainers[container].seal;
      
      // Brüt ağırlık bilgisini bul - öncelik sırası belirle
      let weight = 0;
      
      // 1. "Gross Cargo Weight" formatı
      const grossCargoWeightPatterns = [
        /Gross\s+Cargo\s+Weight:?\s*([0-9,.]+)\s*kgs?/i,
        /Cargo\s+Gross\s+Weight:?\s*([0-9,.]+)\s*kgs?/i,
        /Gross\s+Weight\s+Cargo:?\s*([0-9,.]+)\s*kgs?/i
      ];
      
      for (const pattern of grossCargoWeightPatterns) {
        const match = pattern.exec(containerContext);
        if (match) {
          weight = normalizeWeight(match[1]);
          break;
        }
      }
      
      // 2. "Gross Weight" formatı
      if (!weight) {
        const grossWeightPatterns = [
          /Gross\s+Weight:?\s*([0-9,.]+)\s*kgs?/i,
          /Weight\s+Gross:?\s*([0-9,.]+)\s*kgs?/i,
          /G\.?W\.?:?\s*([0-9,.]+)\s*kgs?/i,
          /Total\s+Weight:?\s*([0-9,.]+)\s*kgs?/i
        ];
        
        for (const pattern of grossWeightPatterns) {
          const match = pattern.exec(containerContext);
          if (match) {
            weight = normalizeWeight(match[1]);
            break;
          }
        }
      }
      
      // 3. "VGM" formatı
      let vgm = 0;
      const vgmPatterns = [
        /VGM:?\s*([0-9,.]+)\s*kgs?/i,
        /Verified\s+Gross\s+Mass:?\s*([0-9,.]+)\s*kgs?/i,
        /V\.?G\.?M\.?:?\s*([0-9,.]+)\s*kgs?/i
      ];
      
      for (const pattern of vgmPatterns) {
        const match = pattern.exec(containerContext);
        if (match) {
          vgm = normalizeWeight(match[1]);
          break;
        }
      }
      
      // 4. Genel ağırlık değeri arama - daha akıllı şekilde yaklaşık konum kullan
      if (!weight) {
        // Tüm ağırlık ifadelerini bul
        const weightMatches = [...containerContext.matchAll(/(\d{1,3}(?:[.,]\d{3})*(?:\.\d+)?)\s*(?:kgs?|MT|ton)/gi)];
        
        if (weightMatches && weightMatches.length > 0) {
          // Konteyner numarasına en yakın ağırlık değerini bul
          const containerIndexInContext = containerContext.indexOf(container);
          
          // Uzaklık hesaplama
          const weightDistances = weightMatches.map(match => {
            const matchIndex = match.index || 0;
            const distance = Math.abs(matchIndex - containerIndexInContext);
            const weight = normalizeWeight(match[1]);
            return { distance, weight };
          });
          
          // Mantıklı ağırlık aralığında olanları filtrele
          const validWeights = weightDistances
            .filter(w => w.weight >= 5000 && w.weight <= 40000) // 5-40 ton arası (daha geniş aralık)
            .sort((a, b) => a.distance - b.distance); // Uzaklığa göre sırala
          
          if (validWeights.length > 0) {
            weight = validWeights[0].weight; // Konteyner numarasına en yakın mantıklı ağırlık
          } else if (weightDistances.length > 0) {
            // Hiçbir mantıklı ağırlık bulunamadıysa, en yakın ağırlığı al
            weightDistances.sort((a, b) => a.distance - b.distance);
            const closestWeight = weightDistances[0].weight;
            
            // 50 tondan küçükse ton olabilir, kg'a çevir
            weight = closestWeight < 50 ? closestWeight * 1000 : closestWeight;
          }
        }
      }
      
      // 5. Mühür numaralarını bul - mühür numarası için hem genel desenleri hem Excel değerine benzer desenleri ara
      let seal: string | undefined = undefined;
      
      // Bilinen tüm mühür formatlarını ara
      const sealPatterns = [
        /(?:SEAL|MÜHÜR|MUHUR)\s*(?:NO:?|NUMBER:?|#)\s*([A-Z0-9]+[-\s]*[A-Z0-9]+)/i,
        /(?:SEAL|MÜHÜR|MUHUR)(?:\s+|:)([A-Z0-9]{6,10})/i,
        /(?:EU|ML|SL|CBMU|MLW|MC)[-\s]*\d{6,8}/i,
        /[A-Z]{2,4}\d{6,8}/i // Genel mühür deseni
      ];
      
      // Excel'deki mühüre benzer bir desen varsa en üste koy (önceliklendir)
      if (excelSeal) {
        // Excel'deki mühür için özel desen oluştur
        // Önce öneki ayır (EU, ML, vb.)
        const prefixMatch = excelSeal.match(/^([A-Z]{2,4})(\d+)$/);
        if (prefixMatch) {
          const [, prefix, number] = prefixMatch;
          // Prefix'in önce geçtiği özel desen
          sealPatterns.unshift(new RegExp(`${prefix}[\\s\\-_]*${number}`, 'i'));
          
          // Sadece numarayı ara (prefix'siz)
          sealPatterns.unshift(new RegExp(`\\b${number}\\b`, 'i'));
        } else {
          // Tam mühür numarasını ara
          sealPatterns.unshift(new RegExp(`\\b${excelSeal}\\b`, 'i'));
        }
      }
      
      // Tüm mühür desenlerini dene
      for (const pattern of sealPatterns) {
        const match = pattern.exec(containerContext);
        if (match) {
          // Eğer grup varsa kullan, yoksa tüm eşleşmeyi al
          const foundSeal = normalizeSeal(match[1] || match[0]);
          
          // "SAND" veya "NUMBERS" değerini özel durum olarak ele al
          if (foundSeal === "SAND" || foundSeal === "NUMBERS") {
            // Özel değer - mühür değil - boş bırak
            continue;
          }
          
          // Konteyner numarası formatındaki değerleri işaretleyelim ama kaydet
          if (foundSeal.match(/[A-Z]{4}\d{7}/)) {
            console.log(`${container} için bulunan mühür (${foundSeal}) bir konteyner numarası formatına benziyor.`);
          }
          
          seal = foundSeal;
          break;
        }
      }
      
      // Eğer hala mühür bulunamadıysa ve Excel'de mühür varsa, özel bir arama yap
      if (!seal && excelSeal) {
        // Excel'deki mühür numarasının son 6-8 karakterini PDF'de ara
        const lastDigits = excelSeal.slice(-Math.min(8, excelSeal.length));
        if (lastDigits.length >= 6) {
          const lastDigitsPattern = new RegExp(`\\b\\w*${lastDigits}\\b`, 'i');
          const lastDigitsMatch = lastDigitsPattern.exec(containerContext);
          if (lastDigitsMatch) {
            seal = normalizeSeal(lastDigitsMatch[0]);
          }
        }
      }
      
      // Verili ağırlık değeri varsa, konteyner verilerini kaydet
      if (weight > 0 || vgm > 0) {
        pdfContainers[container] = {
          weight: weight || vgm, // Eğer weight yoksa VGM kullan
          vgm: vgm || undefined,
          seal,
          context: containerContext
        };
        console.log(`PDF'de konteyner: ${container}, Ağırlık: ${weight || vgm}, VGM: ${vgm || 'YOK'}, Mühür: ${seal || 'YOK'}`);
      } else {
        console.log(`PDF'de konteyner: ${container} için ağırlık değeri bulunamadı`);
      }
    }
    
    const pdfContainerCount = Object.keys(pdfContainers).length;
    console.log(`PDF'de verisi bulunan toplam ${pdfContainerCount} konteyner var`);
    
    // UYUŞMAZLIKLARI KONTROL ET
    const mismatches = [];
    const matchedContainers = [];
    const weightTolerance = 10; // kg
    
    // Excel'deki konteynerleri karşılaştır
    for (const container of Object.keys(excelContainers)) {
      const excelData = excelContainers[container];
      const pdfData = pdfContainers[container];
      
      if (!pdfData) {
        // PDF'de bulunamayan konteyner
        mismatches.push({
          container,
          excelWeight: excelData.weight,
          pdfWeight: null,
          pdfVgm: null,
          excelSeal: excelData.seal,
          pdfSeal: null,
          weightDifference: null,
          vgmDifference: null,
          sealMismatch: false, // PDF'de mühür yok durumunda uyuşmazlık bildirme
          containerNotFound: true
        });
        console.log(`Konteyner ${container} PDF'de bulunamadı`);
        continue;
      }
      
      const pdfWeight = pdfData.weight;
      const pdfVgm = pdfData.vgm;
      const pdfSeal = pdfData.seal;
      
      // Ağırlık farkını hesapla
      const weightDifference = Math.abs(excelData.weight - pdfWeight);
      const weightMismatch = weightDifference > weightTolerance;
      
      // VGM kontrolü - excelData'da vgm olmayabilir
      let vgmDifference = null;
      let vgmMismatch = false;
      if (pdfVgm) {
        vgmDifference = pdfVgm ? Math.abs(excelData.weight - pdfVgm) : null;
        vgmMismatch = vgmDifference !== null && vgmDifference > weightTolerance;
      }
      
      // Mühür kontrolü - PDF'deki mühür değerinde özel durumları kontrol et
      let sealMismatch = false;
      
      // 1. PDF'de mühür numarası olup olmadığını kontrol et
      if (!pdfSeal || pdfSeal === "SAND" || pdfSeal === "NUMBERS") {
        // Mühür yoksa veya "SAND"/"NUMBERS" değeri varsa, uyuşmazlık yok kabul et
        sealMismatch = false;
      } 
      // 2. PDF'deki mühür değeri aslında bir konteyner numarası mı?
      else if (pdfSeal.match(/[A-Z]{4}\d{7}/)) {
        // Konteyner formatında bir değer - bu muhtemelen bir mühür değil
        console.log(`PDF'de ${container} konteyneri için mühür olarak konteyner numarası (${pdfSeal}) görünüyor. Mühür kontrolü yapılmayacak.`);
        // Konteyner numarası formatındaki mühür değerlerini boş değer olarak işaretle
        // böylece mismatches listesine eklenirken PDF mühür değeri null olacak
        pdfData.seal = undefined;
        sealMismatch = false;
      }
      // 3. Normal mühür karşılaştırması yap
      else if (excelData.seal) {
        sealMismatch = !compareSealNumbers(excelData.seal, pdfSeal);
      }
      
      // Mühür durumunu logla
      const mühürDurumu = !excelData.seal ? "Excel'de mühür yok" :
                          !pdfSeal ? "PDF'de mühür yok" :
                          pdfSeal === "SAND" || pdfSeal === "NUMBERS" ? "PDF'de özel değer var" :
                          pdfSeal.match(/[A-Z]{4}\d{7}/) ? "PDF'de konteyner numarası formatında mühür var" :
                          sealMismatch ? "Mühür uyuşmazlığı" : "Mühür eşleşiyor";
      
      console.log(`${container} mühür durumu: ${mühürDurumu} (Excel: ${excelData.seal || 'YOK'}, PDF: ${pdfSeal || 'YOK'})`);
      
      // Uyumsuzluk varsa listeye ekle
      if (weightMismatch || vgmMismatch || sealMismatch) {
        mismatches.push({
          container,
          excelWeight: excelData.weight,
          pdfWeight: pdfWeight,
          pdfVgm: pdfVgm,
          excelSeal: excelData.seal,
          pdfSeal: pdfSeal,
          weightDifference: weightDifference,
          vgmDifference: vgmDifference,
          sealMismatch: sealMismatch,
          weightMismatch: weightMismatch,
          containerNotFound: false
        });
      } else {
        matchedContainers.push(container);
      }
    }
    
    const matchedContainerCount = matchedContainers.length;
    const mismatchContainerCount = mismatches.length;
    
    console.log(`Eşleşen konteyner sayısı: ${matchedContainerCount}`);
    console.log(`Uyuşmaz konteyner sayısı: ${mismatchContainerCount}`);
    
    return NextResponse.json({
      success: true,
      matchedContainers: matchedContainers,
      mismatches: mismatches,
      stats: {
        excelEntries: excelData.length,
        excelContainers: excelContainerCount,
        pdfContainers: pdfContainerCount,
        matchedContainers: matchedContainerCount,
        mismatchCount: mismatchContainerCount,
        totalChecked: excelContainerCount, // Excel'deki konteyner sayısını toplam olarak kullan
        containerColumnName,
        weightColumnName,
        sealColumnName
      }
    }, { status: 200, headers });
  } catch (error) {
    return NextResponse.json({ 
      error: 'İşlem sırasında bir hata oluştu', 
      details: String(error)
    }, { status: 500, headers });
  }
}