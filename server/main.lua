-- Katil Kim - Server-side Main Logic
-- LocalStorage tabanlı, SQL kullanmayan versiyon

-- Global değişkenler
local activeGames = {} -- Aktif oyunlar
local playersInGame = {} -- Oyuncuların hangi oyunda olduğu
local lobbies = {} -- Bekleyen lobbiler

-- Utility Functions
local function GenerateGameId()
    return "game_" .. math.random(10000, 99999)
end

local function GenerateLobbyCode()
    local chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    local code = ""
    for i = 1, 6 do
        local rand = math.random(1, #chars)
        code = code .. string.sub(chars, rand, rand)
    end
    return code
end

local function GetPlayerCount(gameId)
    local count = 0
    if activeGames[gameId] then
        for k, v in pairs(activeGames[gameId].players) do
            count = count + 1
        end
    end
    return count
end

local function AssignRoles(players)
    local playerList = {}
    for playerId, playerData in pairs(players) do
        table.insert(playerList, {id = playerId, name = playerData.name})
    end
    
    -- Shuffle players
    for i = #playerList, 2, -1 do
        local j = math.random(i)
        playerList[i], playerList[j] = playerList[j], playerList[i]
    end
    
    local totalPlayers = #playerList
    local killerCount = math.max(1, math.floor(totalPlayers / 5))
    
    local roles = {}
    local index = 1
    
    -- Assign Katiller
    for i = 1, killerCount do
        roles[playerList[index].id] = {role = "Katil", team = "mafia"}
        index = index + 1
    end
    
    -- Assign Dedektif
    if totalPlayers >= 6 then
        roles[playerList[index].id] = {role = "Dedektif", team = "village"}
        index = index + 1
    end
    
    -- Assign Doktor
    if totalPlayers >= 8 then
        roles[playerList[index].id] = {role = "Doktor", team = "village"}
        index = index + 1
    end
    
    -- Geri kalan herkes Köylü
    for i = index, #playerList do
        roles[playerList[i].id] = {role = "Köylü", team = "village"}
    end
    
    return roles
end

-- Lobby oluşturma
RegisterNetEvent('katilkim:createLobby')
AddEventHandler('katilkim:createLobby', function(playerName)
    local src = source
    local lobbyCode = GenerateLobbyCode()
    
    lobbies[lobbyCode] = {
        host = src,
        hostName = playerName,
        players = {
            [src] = {name = playerName, ready = false}
        },
        createdAt = os.time(),
        status = "waiting"
    }
    
    playersInGame[src] = lobbyCode
    
    TriggerClientEvent('katilkim:lobbyCreated', src, lobbyCode, playerName)
    print("[Katil Kim] Lobby oluşturuldu: " .. lobbyCode .. " (Host: " .. playerName .. ")")
end)

-- Lobby'ye katılma
RegisterNetEvent('katilkim:joinLobby')
AddEventHandler('katilkim:joinLobby', function(lobbyCode, playerName)
    local src = source
    
    if not lobbies[lobbyCode] then
        TriggerClientEvent('katilkim:error', src, "Lobby bulunamadı!")
        return
    end
    
    if lobbies[lobbyCode].status ~= "waiting" then
        TriggerClientEvent('katilkim:error', src, "Bu oyun zaten başlamış!")
        return
    end
    
    local currentPlayers = 0
    for k, v in pairs(lobbies[lobbyCode].players) do
        currentPlayers = currentPlayers + 1
    end
    
    if currentPlayers >= Config.MaxPlayers then
        TriggerClientEvent('katilkim:error', src, "Lobby dolu!")
        return
    end
    
    lobbies[lobbyCode].players[src] = {name = playerName, ready = false}
    playersInGame[src] = lobbyCode
    
    -- Tüm lobby oyuncularına bildir
    for playerId, playerData in pairs(lobbies[lobbyCode].players) do
        TriggerClientEvent('katilkim:updateLobby', playerId, lobbies[lobbyCode])
    end
    
    print("[Katil Kim] " .. playerName .. " lobby'ye katıldı: " .. lobbyCode)
end)

-- Hazır durumu
RegisterNetEvent('katilkim:setReady')
AddEventHandler('katilkim:setReady', function(ready)
    local src = source
    local lobbyCode = playersInGame[src]
    
    if not lobbyCode or not lobbies[lobbyCode] then
        return
    end
    
    if lobbies[lobbyCode].players[src] then
        lobbies[lobbyCode].players[src].ready = ready
        
        -- Tüm oyunculara güncelleme gönder
        for playerId, playerData in pairs(lobbies[lobbyCode].players) do
            TriggerClientEvent('katilkim:updateLobby', playerId, lobbies[lobbyCode])
        end
    end
end)

-- Oyunu başlatma
RegisterNetEvent('katilkim:startGame')
AddEventHandler('katilkim:startGame', function()
    local src = source
    local lobbyCode = playersInGame[src]
    
    if not lobbyCode or not lobbies[lobbyCode] then
        return
    end
    
    -- Host kontrolü
    if lobbies[lobbyCode].host ~= src then
        TriggerClientEvent('katilkim:error', src, "Sadece host oyunu başlatabilir!")
        return
    end
    
    -- Minimum oyuncu kontrolü
    local playerCount = 0
    for k, v in pairs(lobbies[lobbyCode].players) do
        playerCount = playerCount + 1
    end
    
    if playerCount < Config.MinPlayers then
        TriggerClientEvent('katilkim:error', src, "Minimum " .. Config.MinPlayers .. " oyuncu gerekli!")
        return
    end
    
    -- Oyunu başlat
    local gameId = GenerateGameId()
    local roles = AssignRoles(lobbies[lobbyCode].players)
    
    activeGames[gameId] = {
        lobbyCode = lobbyCode,
        players = lobbies[lobbyCode].players,
        roles = roles,
        alive = {},
        dead = {},
        phase = "night",
        round = 1,
        votes = {},
        nightActions = {},
        startedAt = os.time()
    }
    
    -- Tüm oyuncuları alive'a ekle
    for playerId, playerData in pairs(lobbies[lobbyCode].players) do
        activeGames[gameId].alive[playerId] = true
        playersInGame[playerId] = gameId
    end
    
    lobbies[lobbyCode].status = "started"
    
    -- Oyunculara rollerini gönder ve oyunu başlat
    for playerId, playerData in pairs(activeGames[gameId].players) do
        local roleInfo = roles[playerId]
        TriggerClientEvent('katilkim:gameStarted', playerId, {
            gameId = gameId,
            role = roleInfo.role,
            team = roleInfo.team,
            phase = "night",
            round = 1
        })
    end
    
    print("[Katil Kim] Oyun başladı: " .. gameId .. " (" .. playerCount .. " oyuncu)")
    
    -- İlk gece fazını başlat
    Citizen.SetTimeout(5000, function()
        StartNightPhase(gameId)
    end)
end)

-- Gece fazı
function StartNightPhase(gameId)
    if not activeGames[gameId] then return end
    
    activeGames[gameId].phase = "night"
    activeGames[gameId].nightActions = {}
    
    for playerId, _ in pairs(activeGames[gameId].alive) do
        local role = activeGames[gameId].roles[playerId].role
        TriggerClientEvent('katilkim:phaseChange', playerId, {
            phase = "night",
            round = activeGames[gameId].round,
            duration = Config.NightTime
        })
    end
    
    -- Gece süresi bitince gündüze geç
    Citizen.SetTimeout(Config.NightTime * 1000, function()
        ProcessNightActions(gameId)
        StartDayPhase(gameId)
    end)
end

-- Gece aksiyonlarını işle
function ProcessNightActions(gameId)
    if not activeGames[gameId] then return end
    
    local killed = nil
    local saved = nil
    local investigated = nil
    
    -- Katil seçimini al
    for playerId, action in pairs(activeGames[gameId].nightActions) do
        if action.action == "kill" then
            killed = action.target
        elseif action.action == "save" then
            saved = action.target
        elseif action.action == "investigate" then
            investigated = action.target
        end
    end
    
    -- Eğer doktor aynı kişiyi kurtardıysa
    if killed and saved and killed == saved then
        killed = nil
    end
    
    -- Ölüm varsa işle
    if killed and activeGames[gameId].alive[killed] then
        activeGames[gameId].alive[killed] = nil
        activeGames[gameId].dead[killed] = true
    end
    
    return {killed = killed, saved = saved, investigated = investigated}
end

-- Gündüz fazı
function StartDayPhase(gameId)
    if not activeGames[gameId] then return end
    
    activeGames[gameId].phase = "discussion"
    
    for playerId, _ in pairs(activeGames[gameId].alive) do
        TriggerClientEvent('katilkim:phaseChange', playerId, {
            phase = "discussion",
            round = activeGames[gameId].round,
            duration = Config.DiscussionTime
        })
    end
    
    -- Tartışma süresi bitince oylama başlat
    Citizen.SetTimeout(Config.DiscussionTime * 1000, function()
        StartVotingPhase(gameId)
    end)
end

-- Oylama fazı
function StartVotingPhase(gameId)
    if not activeGames[gameId] then return end
    
    activeGames[gameId].phase = "voting"
    activeGames[gameId].votes = {}
    
    for playerId, _ in pairs(activeGames[gameId].alive) do
        TriggerClientEvent('katilkim:phaseChange', playerId, {
            phase = "voting",
            round = activeGames[gameId].round,
            duration = Config.VotingTime
        })
    end
    
    -- Oylama süresi bitince sonuçları işle
    Citizen.SetTimeout(Config.VotingTime * 1000, function()
        ProcessVotes(gameId)
    end)
end

-- Oyları işle
function ProcessVotes(gameId)
    if not activeGames[gameId] then return end
    
    local voteCounts = {}
    for voter, target in pairs(activeGames[gameId].votes) do
        voteCounts[target] = (voteCounts[target] or 0) + 1
    end
    
    -- En çok oyu bulan kişiyi bul
    local maxVotes = 0
    local executed = nil
    for target, votes in pairs(voteCounts) do
        if votes > maxVotes then
            maxVotes = votes
            executed = target
        end
    end
    
    -- İdam et
    if executed and activeGames[gameId].alive[executed] then
        activeGames[gameId].alive[executed] = nil
        activeGames[gameId].dead[executed] = true
        
        for playerId, _ in pairs(activeGames[gameId].players) do
            TriggerClientEvent('katilkim:playerExecuted', playerId, {
                playerId = executed,
                playerName = activeGames[gameId].players[executed].name,
                role = activeGames[gameId].roles[executed].role
            })
        end
    end
    
    -- Oyun bitti mi kontrol et
    if CheckGameEnd(gameId) then
        return
    end
    
    -- Yeni round başlat
    activeGames[gameId].round = activeGames[gameId].round + 1
    Citizen.SetTimeout(5000, function()
        StartNightPhase(gameId)
    end)
end

-- Oyun bitişini kontrol et
function CheckGameEnd(gameId)
    if not activeGames[gameId] then return true end
    
    local mafiaCount = 0
    local villageCount = 0
    
    for playerId, _ in pairs(activeGames[gameId].alive) do
        if activeGames[gameId].roles[playerId].team == "mafia" then
            mafiaCount = mafiaCount + 1
        else
            villageCount = villageCount + 1
        end
    end
    
    local winner = nil
    if mafiaCount == 0 then
        winner = "village"
    elseif mafiaCount >= villageCount then
        winner = "mafia"
    end
    
    if winner then
        for playerId, _ in pairs(activeGames[gameId].players) do
            TriggerClientEvent('katilkim:gameEnded', playerId, {
                winner = winner,
                roles = activeGames[gameId].roles
            })
        end
        
        -- Oyunu temizle
        local lobbyCode = activeGames[gameId].lobbyCode
        activeGames[gameId] = nil
        if lobbies[lobbyCode] then
            lobbies[lobbyCode] = nil
        end
        
        return true
    end
    
    return false
end

-- Gece aksiyonu
RegisterNetEvent('katilkim:nightAction')
AddEventHandler('katilkim:nightAction', function(action, target)
    local src = source
    local gameId = playersInGame[src]
    
    if not gameId or not activeGames[gameId] then
        return
    end
    
    if activeGames[gameId].phase ~= "night" then
        return
    end
    
    activeGames[gameId].nightActions[src] = {
        action = action,
        target = target
    }
end)

-- Oy verme
RegisterNetEvent('katilkim:vote')
AddEventHandler('katilkim:vote', function(targetId)
    local src = source
    local gameId = playersInGame[src]
    
    if not gameId or not activeGames[gameId] then
        return
    end
    
    if activeGames[gameId].phase ~= "voting" then
        return
    end
    
    if not activeGames[gameId].alive[src] then
        return
    end
    
    activeGames[gameId].votes[src] = targetId
    
    -- Oy sayısını tüm oyunculara bildir
    local voteCount = 0
    for k, v in pairs(activeGames[gameId].votes) do
        voteCount = voteCount + 1
    end
    
    for playerId, _ in pairs(activeGames[gameId].alive) do
        TriggerClientEvent('katilkim:voteUpdate', playerId, voteCount)
    end
end)

-- Oyuncu ayrıldığında
AddEventHandler('playerDropped', function(reason)
    local src = source
    local gameOrLobby = playersInGame[src]
    
    if not gameOrLobby then return end
    
    -- Lobby'den çıkma
    if lobbies[gameOrLobby] then
        lobbies[gameOrLobby].players[src] = nil
        
        -- Lobby boşsa sil
        local hasPlayers = false
        for k, v in pairs(lobbies[gameOrLobby].players) do
            hasPlayers = true
            break
        end
        
        if not hasPlayers then
            lobbies[gameOrLobby] = nil
        else
            -- Diğer oyunculara bildir
            for playerId, playerData in pairs(lobbies[gameOrLobby].players) do
                TriggerClientEvent('katilkim:updateLobby', playerId, lobbies[gameOrLobby])
            end
        end
    end
    
    -- Oyundan çıkma
    if activeGames[gameOrLobby] then
        if activeGames[gameOrLobby].alive[src] then
            activeGames[gameOrLobby].alive[src] = nil
            activeGames[gameOrLobby].dead[src] = true
            
            -- Oyun bitişini kontrol et
            CheckGameEnd(gameOrLobby)
        end
    end
    
    playersInGame[src] = nil
end)

print("[Katil Kim] Server-side yüklendi!")
