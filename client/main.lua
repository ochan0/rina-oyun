-- Katil Kim - Client-side Main Logic

local isAppOpen = false
local currentUsername = nil
local inGame = false

-- NUI Callbacks
RegisterNUICallback('close', function(data, cb)
    isAppOpen = false
    SetNuiFocus(false, false)
    cb('ok')
end)

RegisterNUICallback('createLobby', function(data, cb)
    if data.username and data.username ~= "" then
        currentUsername = data.username
        TriggerServerEvent('katilkim:createLobby', data.username)
    end
    cb('ok')
end)

RegisterNUICallback('joinLobby', function(data, cb)
    if data.username and data.username ~= "" and data.lobbyCode and data.lobbyCode ~= "" then
        currentUsername = data.username
        TriggerServerEvent('katilkim:joinLobby', data.lobbyCode, data.username)
    end
    cb('ok')
end)

RegisterNUICallback('setReady', function(data, cb)
    TriggerServerEvent('katilkim:setReady', data.ready)
    cb('ok')
end)

RegisterNUICallback('startGame', function(data, cb)
    TriggerServerEvent('katilkim:startGame')
    cb('ok')
end)

RegisterNUICallback('nightAction', function(data, cb)
    TriggerServerEvent('katilkim:nightAction', data.action, data.target)
    cb('ok')
end)

RegisterNUICallback('vote', function(data, cb)
    TriggerServerEvent('katilkim:vote', data.targetId)
    cb('ok')
end)

-- Server Events
RegisterNetEvent('katilkim:lobbyCreated')
AddEventHandler('katilkim:lobbyCreated', function(lobbyCode, playerName)
    SendNUIMessage({
        type = 'lobbyCreated',
        lobbyCode = lobbyCode,
        playerName = playerName
    })
end)

RegisterNetEvent('katilkim:updateLobby')
AddEventHandler('katilkim:updateLobby', function(lobbyData)
    SendNUIMessage({
        type = 'updateLobby',
        lobby = lobbyData
    })
end)

RegisterNetEvent('katilkim:gameStarted')
AddEventHandler('katilkim:gameStarted', function(gameData)
    inGame = true
    SendNUIMessage({
        type = 'gameStarted',
        data = gameData
    })
end)

RegisterNetEvent('katilkim:phaseChange')
AddEventHandler('katilkim:phaseChange', function(phaseData)
    SendNUIMessage({
        type = 'phaseChange',
        data = phaseData
    })
end)

RegisterNetEvent('katilkim:playerExecuted')
AddEventHandler('katilkim:playerExecuted', function(data)
    SendNUIMessage({
        type = 'playerExecuted',
        data = data
    })
end)

RegisterNetEvent('katilkim:gameEnded')
AddEventHandler('katilkim:gameEnded', function(data)
    inGame = false
    SendNUIMessage({
        type = 'gameEnded',
        data = data
    })
end)

RegisterNetEvent('katilkim:voteUpdate')
AddEventHandler('katilkim:voteUpdate', function(voteCount)
    SendNUIMessage({
        type = 'voteUpdate',
        count = voteCount
    })
end)

RegisterNetEvent('katilkim:error')
AddEventHandler('katilkim:error', function(message)
    SendNUIMessage({
        type = 'error',
        message = message
    })
end)

-- Telefon uygulamasını aç
RegisterCommand('katilkim', function()
    isAppOpen = true
    SetNuiFocus(true, true)
    SendNUIMessage({
        type = 'open'
    })
end)

-- Export fonksiyonları (diğer telefon scriptleri için)
exports('OpenApp', function()
    isAppOpen = true
    SetNuiFocus(true, true)
    SendNUIMessage({
        type = 'open'
    })
end)

exports('CloseApp', function()
    isAppOpen = false
    SetNuiFocus(false, false)
    SendNUIMessage({
        type = 'close'
    })
end)

print("[Katil Kim] Client-side yüklendi!")
