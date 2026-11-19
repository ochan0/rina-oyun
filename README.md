# 🔪 Katil Kim? - Sosyal Dedüksiyon Oyunu

Arkadaşlarınla oynayabileceğin heyecan dolu sosyal dedüksiyon oyunu! Among Us, Mafia ve Werewolf tarzı bir web tabanlı multiplayer oyun.

## 🎮 Oyun Hakkında

**Katil Kim?** 5-15 kişi ile oynanabilen browser tabanlı sosyal dedüksiyon oyunudur. Oyuncular katiller ve köylüler olmak üzere iki gruba ayrılır. Köylüler katilleri bulmaya çalışırken, katiller tüm köylüleri öldürmeye çalışır.

## 🌟 Özellikler

- ✅ Tamamen **ücretsiz** ve **açık kaynak**
- 📱 Mobil uyumlu responsive tasarım
- 🎲 5-15 oyuncu desteği
- 🌙 Gece/Gündüz faz sistemi
- 🎭 4 farklı rol (Katil, Dedektif, Doktor, Köylü)
- 🔒 Lobby sistemi ile özel odalar
- 💾 LocalStorage ile veri saklama (SQL yok)
- 🎨 Modern ve şık arayüz

## 👥 Roller

### 🔪 Katil
- Her gece bir kişiyi öldürür
- Tüm köylüleri öldürmek için çalışır
- Oyuncu sayısına göre 1-3 katil olabilir

### 🕵️ Dedektif
- Her gece bir kişinin rolünü öğrenebilir
- Katilleri bulmaya çalışır
- Bilgilerini akıllıca kullanmalıdır

### 💉 Doktor
- Her gece bir kişiyi korur
- Koruduğu kişi o gece öldürülemez
- Kendini de koruyabilir

### 👨‍🌾 Köylü
- Özel yetenekleri yoktur
- Gündüz oylamalarında katilleri bulmaya çalışır
- Takım çalışması çok önemlidir

## 🎯 Nasıl Oynanır?

### 1. Oyuna Başlama
- Kullanıcı adınızı girin
- **Lobby Oluştur** veya **Lobby'ye Katıl** seçeneğini seçin
- Arkadaşlarınızla 6 haneli lobby kodunu paylaşın

### 2. Oyun Fazları

#### 🌙 Gece Fazı (30 saniye)
- Katiller hedef seçer
- Dedektif bir kişiyi araştırır
- Doktor bir kişiyi korur
- Köylüler bekler

#### 💬 Tartışma Fazı (120 saniye)
- Gece yaşananlar hakkında konuşulur
- Şüpheliler belirlenir
- Taktikler oluşturulur

#### 🗳️ Oylama Fazı (60 saniye)
- Her oyuncu bir kişiye oy verir
- En çok oy alan kişi oyundan çıkar (idam edilir)
- Eşitlik durumunda kimse çıkmaz

### 3. Kazanma Koşulları

**Köylüler Kazanır:**
- Tüm katilleri buldukları zaman

**Katiller Kazanır:**
- Katil sayısı ≥ köylü sayısı olduğunda

## 🚀 GitHub Pages'de Yayınlama

1. Bu repository'yi fork'layın veya kopyalayın
2. GitHub repository ayarlarından **Pages** bölümüne gidin
3. Source olarak **main branch** seçin
4. Deploy olmasını bekleyin
5. Verilen linki arkadaşlarınızla paylaşın!

**Örnek Link:** `https://kullaniciadi.github.io/rina-oyun/`

## 💻 Lokal Geliştirme

Projeyi bilgisayarınızda çalıştırmak için:

```bash
# Basit HTTP server başlatın (Python 3)
python -m http.server 8000

# Veya Node.js ile
npx http-server -p 8000

# Tarayıcıda açın
http://localhost:8000
```

## 📁 Proje Yapısı

```
rina-oyun/
├── index.html      # Ana oyun dosyası
├── style.css       # Stil dosyası
├── app.js          # Oyun mantığı
└── README.md       # Bu dosya
```

## 💡 İpuçları

- 🤫 Rolünüzü çok erken açıklamayın
- 👀 Oyuncuların davranışlarını gözlemleyin
- 🗣️ Tartışma fazında aktif olun
- 🤝 Takım arkadaşlarınızla işbirliği yapın
- 🎭 Blöf yapmaktan korkmayın

## 🔧 Teknik Detaylar

- **Frontend:** Vanilla JavaScript (Framework yok)
- **Stil:** CSS3 (Gradient + Animasyonlar)
- **Veri:** LocalStorage API
- **Multiplayer:** Peer-to-peer lobby sistemi
- **Responsive:** Mobile-first tasarım

## 🎨 Özelleştirme

[`config`](app.js:3) değişkenlerini düzenleyerek oyun ayarlarını değiştirebilirsiniz:

```javascript
const config = {
    minPlayers: 5,        // Minimum oyuncu sayısı
    maxPlayers: 15,       // Maximum oyuncu sayısı
    nightTime: 30,        // Gece fazı süresi (saniye)
    discussionTime: 120,  // Tartışma süresi (saniye)
    votingTime: 60        // Oylama süresi (saniye)
};
```

## 📱 FiveM Entegrasyonu

Bu oyun aynı zamanda FiveM telefon uygulaması olarak da kullanılabilir. FiveM versiyonu için ayrı branch'e bakın.

## 🤝 Katkıda Bulunma

Pull request'ler memnuniyetle karşılanır! Büyük değişiklikler için önce bir issue açın.

## 📄 Lisans

MIT License - İstediğiniz gibi kullanabilirsiniz!

## 🎮 Keyifli Oyunlar!

Oyunu beğendiyseniz ⭐ vermeyi unutmayın!

---

**Yapımcı:** Rina Oyun  
**Versiyon:** 1.0.0  
**İletişim:** GitHub Issues
