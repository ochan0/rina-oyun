# 🔪 Katil Kim? - Sosyal Dedüksiyon Oyunu

FiveM için geliştirilmiş, **Among Us** ve **Mafia/Werewolf** tarzında sosyal dedüksiyon telefon uygulaması. Oyuncular gizli rollerle birbirlerini kandırmaya, şüphelileri bulmaya ve kazanmaya çalışır!

## 🎮 Özellikler

### ✨ Temel Özellikler
- **Lobby Sistemi**: Kolay lobby oluşturma ve katılma (6 haneli kodlarla)
- **Kullanıcı Adı Sistemi**: SQL gerektirmeyen LocalStorage tabanlı
- **4 Farklı Rol**: Katil, Dedektif, Doktor, Köylü
- **Faz Sistemi**: Gece, Tartışma, Oylama
- **Gerçek Zamanlı Oyun**: Zamanlayıcılı turlar
- **Modern UI**: Gradient'lı, animasyonlu, mobil-uyumlu arayüz

### 🎭 Roller

#### 🔪 Katil (Mafia)
- **Amaç**: Köylülerin sayısını azalt, çoğunluğu ele geçir
- **Yetenek**: Her gece bir köylüyü öldürür
- **Kazanma**: Katil sayısı ≥ Köylü sayısı

#### 🕵️ Dedektif (Köylü)
- **Amaç**: Katilleri bul ve idam et
- **Yetenek**: Her gece bir oyuncuyu araştırır ve rolünü öğrenir
- **Kazanma**: Tüm katiller ölürse

#### 💉 Doktor (Köylü)
- **Amaç**: Köylüleri koru
- **Yetenek**: Her gece bir oyuncuyu korur (katil hedef alırsa ölmez)
- **Kazanma**: Tüm katiller ölürse

#### 👨‍🌾 Köylü (Köylü)
- **Amaç**: Katilleri bul
- **Yetenek**: Yok (tartışmalarda akıl kullan!)
- **Kazanma**: Tüm katiller ölürse

## 📦 Kurulum

### FiveM Versiyonu

1. Bu repository'yi indirin
2. `katilkim` klasörünü `resources` dizinine kopyalayın
3. `server.cfg` dosyanıza şunu ekleyin:
   ```cfg
   ensure katilkim
   ```
4. Sunucuyu restart edin

### Komut

Oyunu açmak için:
```
/katilkim
```

Veya telefon scriptinize entegre edebilirsiniz:
```lua
exports['katilkim']:OpenApp()
```

## 🌐 GitHub Pages Standalone Versiyonu

Bu uygulama **SQL gerektirmeden** çalışır ve GitHub Pages'te host edilebilir!

### Standalone Kurulum

1. `html/` klasöründeki dosyaları GitHub Pages'e yükleyin
2. Tarayıcıdan açın
3. Kullanıcı adı girin ve oyna!

**LocalStorage** kullandığı için veritabanına ihtiyaç yok. Tüm veriler tarayıcıda saklanır.

## ⚙️ Konfigürasyon

[`config.lua`](config.lua) dosyasından oyun ayarlarını düzenleyebilirsiniz:

```lua
Config.MinPlayers = 5 -- Minimum oyuncu sayısı
Config.MaxPlayers = 15 -- Maximum oyuncu sayısı

Config.DiscussionTime = 120 -- Tartışma süresi (saniye)
Config.VotingTime = 60 -- Oylama süresi (saniye)
Config.NightTime = 30 -- Gece süresi (saniye)
```

## 🎯 Nasıl Oynanır?

### 1️⃣ Lobby Oluştur/Katıl
- Kullanıcı adını gir
- "Lobby Oluştur" veya "Lobby'ye Katıl" seç
- Lobby kodunu paylaş (örn: `ABC123`)
- Minimum 5 oyuncu bekle

### 2️⃣ Oyun Başlasın
- Herkes "Hazır" olsun
- Host "Oyunu Başlat" butonuna bassın
- Roller gizlice dağıtılır

### 3️⃣ Gece Fazı (30sn)
- **Katil**: Bir köylü seç ve öldür
- **Dedektif**: Bir oyuncuyu araştır
- **Doktor**: Bir oyuncuyu koru
- **Köylü**: Bekle

### 4️⃣ Gündüz - Tartışma (2dk)
- Kim öldü görünür
- Herkes konuşur ve şüpheli arar
- Dedektif bilgilerini paylaşabilir (veya gizleyebilir)

### 5️⃣ Oylama (1dk)
- Bir kişiye oy ver
- En çok oyu alan idam edilir
- Rolü açıklanır

### 6️⃣ Tekrar
- Yeni round başlar (Gece → Gündüz → Oylama)
- Bir takım kazanana kadar devam eder

## 🏆 Kazanma Koşulları

- **Köylüler Kazanır**: Tüm katiller idam edilirse
- **Katiller Kazanır**: Katil sayısı ≥ Köylü sayısı

## 🛠️ Teknik Detaylar

### Dosya Yapısı
```
katilkim/
├── fxmanifest.lua          # FiveM manifest
├── config.lua              # Oyun ayarları
├── client/
│   └── main.lua           # Client-side logic
├── server/
│   └── main.lua           # Server-side logic (lobby, oyun mekanikleri)
└── html/
    ├── index.html         # UI yapısı
    ├── style.css          # Modern styling
    └── app.js             # Frontend logic (LocalStorage tabanlı)
```

### Teknolojiler
- **FiveM**: Lua server/client
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Storage**: LocalStorage (SQL yok!)
- **Font**: Google Fonts (Poppins)

## 🎨 Özelleştirme

### Renkleri Değiştir
[`html/style.css`](html/style.css) dosyasında CSS değişkenlerini düzenleyin:

```css
/* Mafia rengi */
background: linear-gradient(135deg, #f5576c 0%, #8b0000 100%);

/* Village rengi */
background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
```

### Rol Sayıları
[`config.lua`](config.lua) veya [`html/app.js`](html/app.js:656) içindeki `assignRoles()` fonksiyonunu düzenleyin.

## 📱 Telefon Scriptleri ile Entegrasyon

Popüler telefon scriptlerine entegre edebilirsiniz:

### qb-phone
```lua
-- qb-phone/config.lua içine ekleyin
['katilkim'] = {
    app = 'katilkim',
    color = '#f5576c',
    icon = '🔪',
    tooltipText = 'Katil Kim?',
    job = false,
    blockedjobs = {},
    slot = 15,
}
```

### gcphone
```lua
-- gcphone/html/static/config/config.js içine ekleyin
{
    id: 'katilkim',
    title: 'Katil Kim?',
    icon: '/html/static/img/icons_app/katilkim.png',
    color: '#f5576c'
}
```

## 🐛 Bilinen Sorunlar

- [ ] Oyuncu lobby'den ayrılınca otomatik temizlenme
- [ ] Mobil tarayıcılarda landscape mode desteği
- [ ] Çoklu dil desteği

## 🤝 Katkıda Bulunma

Pull request'ler kabul edilir! Büyük değişiklikler için önce issue açın.

## 📄 Lisans

Bu proje MIT lisansı ile lisanslanmıştır.

## 💰 Ticari Kullanım

Bu script **ticari olarak satılabilir**. İyi şanslar! 🚀

## 📞 Destek

- Discord: [Sunucunuz]
- Tebrik.gg: [Linkiniz]
- GitHub Issues: Bug raporları için

## 🎉 Özellikler (Roadmap)

- [ ] Ses efektleri
- [ ] Özel roller (Joker, Şerif, vb.)
- [ ] İstatistik sistemi
- [ ] Achievement sistemi
- [ ] Spectator modu
- [ ] Replay sistemi
- [ ] Turnuva modu

---

**Made with ❤️ by Rina Oyun**

Eğlenceli oyunlar! 🎮🔪
