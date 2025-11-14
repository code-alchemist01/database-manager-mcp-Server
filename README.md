# MCP Project Manager

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

**Akıllı Dosya ve Proje Yönetim MCP Server** - AI asistanlarının proje analizi, kod metrikleri, dokümantasyon ve Git işlemlerini yönetebileceği kapsamlı bir Model Context Protocol (MCP) server.

## 🚀 Özellikler

### 📊 Proje Analizi
- **Dosya yapısı analizi**: Proje dizin ağacını çıkarır, dosya türlerini kategorize eder
- **Bağımlılık haritası**: Import/require ilişkilerini görselleştirir, circular dependency tespiti
- **Teknoloji stack tespiti**: Kullanılan framework'leri, kütüphaneleri otomatik tespit eder
- **Proje metrikleri**: Kod satır sayısı, dosya sayısı, dil dağılımı

### 📈 Kod Metrikleri
- **Cyclomatic complexity** hesaplama
- **Code smell** tespiti (uzun fonksiyonlar, tekrarlanan kod, magic numbers, vb.)
- **Test coverage** analizi

### 📝 Otomatik Dokümantasyon
- **API dokümantasyonu** oluşturma (JSDoc, Python docstrings)
- **README.md** otomatik güncelleme
- **Changelog** oluşturma ve güncelleme

### 🔍 Git Analizi
- **Commit mesajı analizi** ve öneriler
- **Branch stratejisi** önerileri
- **Diff analizi** ve değişiklik özeti

### 🗂️ Proje Organizasyonu
- **Dosya taşıma/yerleştirme** önerileri
- **Dependency güncelleme** kontrolü

## 🌍 Desteklenen Diller

- JavaScript / TypeScript
- Python
- Java
- Go
- Rust

## 📦 Kurulum

### Gereksinimler

- Node.js 18+
- npm veya yarn

### Adımlar

1. **Projeyi klonlayın:**
```bash
git clone https://github.com/code-alchemist01/project-managment-mcp-Server.git
cd project-managment-mcp-Server
```

2. **Bağımlılıkları yükleyin:**
```bash
npm install
```

3. **Projeyi derleyin:**
```bash
npm run build
```

## 🔧 Kullanım

### MCP Server Olarak Çalıştırma

MCP server'ı çalıştırmak için:

```bash
npm start
```

veya development modunda:

```bash
npm run dev
```

### Cursor için Konfigürasyon

1. Cursor ayarlarını açın (Settings)
2. MCP bölümüne gidin
3. Aşağıdaki konfigürasyonu ekleyin:

```json
{
  "mcpServers": {
    "project-manager": {
      "command": "node",
      "args": ["/absolute/path/to/project-managment-mcp-Server/dist/index.js"]
    }
  }
}
```

**Not:** `args` içindeki yol, projenizin `dist/index.js` dosyasının tam yolunu içermelidir.

### Claude Desktop için Konfigürasyon

`%APPDATA%\Claude\claude_desktop_config.json` dosyasını düzenleyin:

```json
{
  "mcpServers": {
    "project-manager": {
      "command": "node",
      "args": ["/absolute/path/to/project-managment-mcp-Server/dist/index.js"]
    }
  }
}
```

## 🛠️ MCP Tools

### Proje Analizi Tools

#### `analyze_project_structure`
Proje dizin yapısını analiz eder ve hiyerarşik yapıyı döner.

**Parametreler:**
- `path` (string, required): Analiz edilecek proje yolu
- `depth` (number, optional): Maksimum derinlik (default: 10)

#### `detect_tech_stack`
Projede kullanılan teknolojileri tespit eder.

#### `analyze_dependencies`
Import/require ilişkilerini analiz eder ve bağımlılık grafiği oluşturur.

#### `get_project_metrics`
Proje genel metriklerini hesaplar.

### Kod Metrikleri Tools

#### `calculate_complexity`
Cyclomatic complexity hesaplar.

#### `detect_code_smells`
Code smell'leri tespit eder.

#### `analyze_test_coverage`
Test coverage analizi yapar.

### Dokümantasyon Tools

#### `generate_readme`
README.md dosyası oluşturur/günceller.

#### `generate_api_docs`
API dokümantasyonu oluşturur.

#### `update_changelog`
CHANGELOG.md dosyasını günceller.

### Git Analiz Tools

#### `analyze_commits`
Commit mesajlarını analiz eder.

#### `suggest_branch_strategy`
Branch stratejisi önerileri sunar.

#### `analyze_diff`
Git diff'i analiz eder.

### Proje Organizasyon Tools

#### `suggest_file_structure`
Dosya yapısı önerileri sunar.

#### `check_dependencies`
Dependency güncellemelerini kontrol eder.

## 💡 Kullanım Örnekleri

### Cursor veya Claude Desktop'ta

AI asistanınıza şunları sorabilirsiniz:

```
Bu projeyi analiz et: /path/to/project
```

```
Bu projede hangi teknolojiler kullanılıyor?
```

```
Code smell'leri bul ve öneriler sun
```

```
README oluştur
```

```
Git commit'lerini analiz et
```

## 🧪 Test

Testleri çalıştırmak için:

```bash
npm test
```

Gerçek proje üzerinde test:

```bash
node test-gercek-proje.mjs
```

## 📁 Proje Yapısı

```
mcp-project-manager/
├── src/
│   ├── index.ts                 # MCP server ana giriş noktası
│   ├── server.ts                # MCP server implementasyonu
│   ├── tools/                   # MCP tools (komutlar)
│   │   ├── project-analysis.ts
│   │   ├── code-metrics.ts
│   │   ├── documentation.ts
│   │   ├── git-analysis.ts
│   │   └── project-org.ts
│   ├── analyzers/               # Analiz motorları
│   │   ├── file-analyzer.ts
│   │   ├── dependency-analyzer.ts
│   │   ├── code-analyzer.ts
│   │   └── git-analyzer.ts
│   ├── utils/                   # Yardımcı fonksiyonlar
│   │   ├── file-utils.ts
│   │   ├── parser-utils.ts
│   │   └── formatters.ts
│   └── types/                   # TypeScript tip tanımları
│       └── index.ts
├── dist/                        # Derlenmiş JavaScript dosyaları
├── package.json
├── tsconfig.json
└── README.md
```

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! Lütfen bir issue açın veya pull request gönderin.

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add some amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🙏 Teşekkürler

- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP protokolü için
- [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) - Kod parsing için

## 🔗 İlgili Linkler

- [MCP Dokümantasyonu](https://modelcontextprotocol.io/)
- [Cursor IDE](https://cursor.sh/)
- [Claude Desktop](https://claude.ai/desktop)

---

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!

