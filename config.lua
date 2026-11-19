Config = {}

-- Oyun Ayarları
Config.MinPlayers = 5 -- Minimum oyuncu sayısı
Config.MaxPlayers = 15 -- Maximum oyuncu sayısı
Config.GameDuration = 600 -- Oyun süresi (saniye) - 10 dakika

-- Tur Süreleri (saniye)
Config.DiscussionTime = 120 -- Tartışma süresi - 2 dakika
Config.VotingTime = 60 -- Oylama süresi - 1 dakika
Config.NightTime = 30 -- Gece süresi - 30 saniye

-- Roller ve Dağılımları
Config.Roles = {
    {name = "Katil", count = 2, team = "mafia"}, -- Her 5 oyuncuya 1 katil
    {name = "Dedektif", count = 1, team = "village"},
    {name = "Doktor", count = 1, team = "village"},
    {name = "Köylü", count = 0, team = "village"} -- Geri kalan herkes
}

-- Telefon Uygulaması Ayarları
Config.AppName = "Katil Kim?"
Config.AppIcon = "🔪"

-- Bildirim Ayarları
Config.EnableSounds = true
Config.EnableVibration = true

-- Lobby Ayarları
Config.LobbyTimeout = 300 -- Lobby timeout süresi (5 dakika)
Config.AllowSpectators = true -- Seyirci moduna izin ver
