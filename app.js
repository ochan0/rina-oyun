// Katil Kim - Cyberpunk Edition
// LocalStorage tabanlı multiplayer sosyal dedüksiyon oyunu

// ============ Configuration ============
const config = {
    minPlayers: 5,
    maxPlayers: 15,
    nightTime: 30,
    discussionTime: 120,
    votingTime: 60,
    lobbyRefreshInterval: 3000, // 3 seconds
    passwordAttempts: 3, // Max password attempts
    passwordLockoutTime: 60000 // 1 minute lockout
};

// ============ Global State ============
let currentScreen = 'main-menu';
let username = '';
let lobbyCode = '';
let currentRole = null;
let currentPhase = null;
let gameData = null;
let timerInterval = null;
let selectedTarget = null;
let hasVoted = false;
let isHost = false;
let lobbyRefreshTimer = null;
let pendingLobbyJoin = null;
let passwordAttemptCount = 0;
let passwordLockoutUntil = 0;

// ============ Utility Functions ============
function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        currentScreen = screenId;
    }
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function saveToLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error('LocalStorage error:', e);
    }
}

function getFromLocalStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('LocalStorage error:', e);
        return null;
    }
}

function getUsernameFromStorage() {
    return getFromLocalStorage('katilkim_username') || '';
}

function saveUsernameToStorage(name) {
    saveToLocalStorage('katilkim_username', name);
}

function generateLobbyCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Check if code already exists
    if (getFromLocalStorage('lobby_' + code)) {
        return generateLobbyCode(); // Recursive until unique
    }
    
    return code;
}

function getAllLobbies() {
    const lobbies = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('lobby_')) {
            const lobby = getFromLocalStorage(key);
            if (lobby && lobby.status === 'waiting') {
                const code = key.replace('lobby_', '');
                lobbies.push({ code, ...lobby });
            }
        }
    }
    return lobbies;
}

function cleanupOldLobbies() {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('lobby_')) {
            const lobby = getFromLocalStorage(key);
            if (lobby && lobby.createdAt && (now - lobby.createdAt > maxAge)) {
                localStorage.removeItem(key);
            }
        }
    }
}

// ============ Navigation Functions ============
function showMainMenu() {
    showScreen('main-menu');
    const savedUsername = getUsernameFromStorage();
    if (savedUsername) {
        document.getElementById('username-input').value = savedUsername;
    }
    
    // Stop lobby refresh timer
    if (lobbyRefreshTimer) {
        clearInterval(lobbyRefreshTimer);
        lobbyRefreshTimer = null;
    }
}

function showCreateLobby() {
    const usernameInput = document.getElementById('username-input');
    const name = usernameInput.value.trim();
    
    if (!name) {
        showToast('Lütfen kullanıcı adı girin!', 'error');
        return;
    }
    
    if (name.length < 3) {
        showToast('Kullanıcı adı en az 3 karakter olmalı!', 'error');
        return;
    }
    
    username = name;
    saveUsernameToStorage(username);
    showScreen('create-lobby-screen');
}

function togglePasswordField() {
    const checkbox = document.getElementById('private-lobby-checkbox');
    const passwordField = document.getElementById('password-field');
    passwordField.style.display = checkbox.checked ? 'block' : 'none';
}

function createLobby() {
    const lobbyNameInput = document.getElementById('lobby-name-input');
    const lobbyName = lobbyNameInput.value.trim() || `${username}'in Lobbisi`;
    
    const isPrivate = document.getElementById('private-lobby-checkbox').checked;
    let password = null;
    
    if (isPrivate) {
        const passwordInput = document.getElementById('lobby-password-input');
        password = passwordInput.value.trim();
        
        if (!password) {
            showToast('Şifreli lobby için şifre giriniz!', 'error');
            return;
        }
        
        if (password.length < 4) {
            showToast('Şifre en az 4 karakter olmalı!', 'error');
            return;
        }
    }
    
    const code = generateLobbyCode();
    lobbyCode = code;
    isHost = true;
    
    const lobbyData = {
        name: lobbyName,
        host: username,
        password: password,
        players: [{ name: username, ready: false, isHost: true }],
        status: 'waiting',
        createdAt: Date.now()
    };
    
    saveToLocalStorage('lobby_' + code, lobbyData);
    showLobbyScreen(code);
    showToast('Lobby oluşturuldu! 🎮', 'success');
}

function showLobbyBrowser() {
    const usernameInput = document.getElementById('username-input');
    const name = usernameInput.value.trim();
    
    if (!name) {
        showToast('Lütfen kullanıcı adı girin!', 'error');
        return;
    }
    
    if (name.length < 3) {
        showToast('Kullanıcı adı en az 3 karakter olmalı!', 'error');
        return;
    }
    
    username = name;
    saveUsernameToStorage(username);
    
    showScreen('lobby-browser-screen');
    cleanupOldLobbies();
    refreshLobbyList();
    
    // Auto-refresh lobbies
    lobbyRefreshTimer = setInterval(refreshLobbyList, config.lobbyRefreshInterval);
}

function refreshLobbyList() {
    const lobbies = getAllLobbies();
    const lobbyList = document.getElementById('lobby-list');
    const emptyState = document.getElementById('empty-lobbies');
    
    if (lobbies.length === 0) {
        lobbyList.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    lobbyList.innerHTML = '';
    
    lobbies.forEach(lobby => {
        const card = document.createElement('div');
        card.className = 'lobby-card';
        card.onclick = () => selectLobby(lobby.code, !!lobby.password);
        
        const lockIcon = lobby.password ? '<span class="lobby-lock">🔒</span>' : '';
        
        card.innerHTML = `
            <div class="lobby-header">
                <span class="lobby-code">${lobby.code}</span>
                ${lockIcon}
            </div>
            <div class="lobby-info">
                <span class="lobby-host">👑 ${lobby.name || lobby.host}</span>
                <span class="lobby-players">👥 ${lobby.players.length}/${config.maxPlayers}</span>
            </div>
        `;
        
        lobbyList.appendChild(card);
    });
}

function searchLobbies() {
    const searchInput = document.getElementById('lobby-search-input');
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    const lobbies = getAllLobbies();
    const lobbyList = document.getElementById('lobby-list');
    const emptyState = document.getElementById('empty-lobbies');
    
    const filtered = lobbies.filter(lobby => {
        return lobby.code.toLowerCase().includes(searchTerm) ||
               lobby.name.toLowerCase().includes(searchTerm) ||
               lobby.host.toLowerCase().includes(searchTerm);
    });
    
    if (filtered.length === 0) {
        lobbyList.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    lobbyList.innerHTML = '';
    
    filtered.forEach(lobby => {
        const card = document.createElement('div');
        card.className = 'lobby-card';
        card.onclick = () => selectLobby(lobby.code, !!lobby.password);
        
        const lockIcon = lobby.password ? '<span class="lobby-lock">🔒</span>' : '';
        
        card.innerHTML = `
            <div class="lobby-header">
                <span class="lobby-code">${lobby.code}</span>
                ${lockIcon}
            </div>
            <div class="lobby-info">
                <span class="lobby-host">👑 ${lobby.name || lobby.host}</span>
                <span class="lobby-players">👥 ${lobby.players.length}/${config.maxPlayers}</span>
            </div>
        `;
        
        lobbyList.appendChild(card);
    });
}

function selectLobby(code, requiresPassword) {
    if (requiresPassword) {
        pendingLobbyJoin = code;
        openPasswordModal();
    } else {
        joinLobby(code);
    }
}

function openPasswordModal() {
    // Check lockout
    const now = Date.now();
    if (now < passwordLockoutUntil) {
        const remainingSeconds = Math.ceil((passwordLockoutUntil - now) / 1000);
        showToast(`Çok fazla yanlış deneme! ${remainingSeconds}s bekleyin.`, 'error');
        return;
    }
    
    const modal = document.getElementById('password-modal');
    const input = document.getElementById('password-input');
    const errorMsg = document.getElementById('password-error');
    
    input.value = '';
    errorMsg.style.display = 'none';
    modal.classList.add('active');
}

function closePasswordModal() {
    const modal = document.getElementById('password-modal');
    modal.classList.remove('active');
    pendingLobbyJoin = null;
}

function submitPassword() {
    const input = document.getElementById('password-input');
    const password = input.value.trim();
    const errorMsg = document.getElementById('password-error');
    
    if (!password) {
        errorMsg.textContent = 'Şifre giriniz!';
        errorMsg.style.display = 'block';
        return;
    }
    
    const lobbyData = getFromLocalStorage('lobby_' + pendingLobbyJoin);
    
    if (!lobbyData) {
        closePasswordModal();
        showToast('Lobby bulunamadı!', 'error');
        return;
    }
    
    if (lobbyData.password !== password) {
        passwordAttemptCount++;
        errorMsg.textContent = `Yanlış şifre! (${passwordAttemptCount}/${config.passwordAttempts})`;
        errorMsg.style.display = 'block';
        
        if (passwordAttemptCount >= config.passwordAttempts) {
            passwordLockoutUntil = Date.now() + config.passwordLockoutTime;
            passwordAttemptCount = 0;
            closePasswordModal();
            showToast('Çok fazla yanlış deneme! 1 dakika beklemelisiniz.', 'error');
        }
        return;
    }
    
    // Password correct
    passwordAttemptCount = 0;
    closePasswordModal();
    joinLobby(pendingLobbyJoin);
}

function joinLobbyByCode() {
    const codeInput = document.getElementById('lobby-code-input');
    const code = codeInput.value.trim().toUpperCase();
    
    if (!code || code.length !== 6) {
        showToast('Geçerli bir lobby kodu girin!', 'error');
        return;
    }
    
    const lobbyData = getFromLocalStorage('lobby_' + code);
    
    if (!lobbyData) {
        showToast('Lobby bulunamadı!', 'error');
        return;
    }
    
    if (lobbyData.password) {
        pendingLobbyJoin = code;
        openPasswordModal();
    } else {
        joinLobby(code);
    }
}

function joinLobby(code) {
    const lobbyData = getFromLocalStorage('lobby_' + code);
    
    if (!lobbyData) {
        showToast('Lobby bulunamadı!', 'error');
        return;
    }
    
    if (lobbyData.status !== 'waiting') {
        showToast('Bu oyun zaten başlamış!', 'error');
        return;
    }
    
    if (lobbyData.players.length >= config.maxPlayers) {
        showToast('Lobby dolu!', 'error');
        return;
    }
    
    // Check if already in lobby
    const existingPlayer = lobbyData.players.find(p => p.name === username);
    if (!existingPlayer) {
        lobbyData.players.push({ name: username, ready: false, isHost: false });
        saveToLocalStorage('lobby_' + code, lobbyData);
    }
    
    lobbyCode = code;
    isHost = false;
    showLobbyScreen(code);
    showToast('Lobby\'ye katıldın! 🎮', 'success');
}

function showHowToPlay() {
    showScreen('how-to-play-screen');
}

function leaveLobby() {
    if (lobbyCode) {
        const lobbyData = getFromLocalStorage('lobby_' + lobbyCode);
        if (lobbyData) {
            // Remove player
            lobbyData.players = lobbyData.players.filter(p => p.name !== username);
            
            // If host left, delete lobby or assign new host
            if (isHost) {
                if (lobbyData.players.length > 0) {
                    lobbyData.players[0].isHost = true;
                    lobbyData.host = lobbyData.players[0].name;
                    saveToLocalStorage('lobby_' + lobbyCode, lobbyData);
                } else {
                    localStorage.removeItem('lobby_' + lobbyCode);
                }
            } else {
                saveToLocalStorage('lobby_' + lobbyCode, lobbyData);
            }
        }
    }
    
    lobbyCode = '';
    isHost = false;
    showMainMenu();
}

function backToMenu() {
    gameData = null;
    currentRole = null;
    currentPhase = null;
    hasVoted = false;
    selectedTarget = null;
    
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    showMainMenu();
}

// ============ Lobby Functions ============
function showLobbyScreen(code) {
    lobbyCode = code;
    const lobbyData = getFromLocalStorage('lobby_' + code);
    
    if (lobbyData) {
        document.getElementById('lobby-title').textContent = lobbyData.name || 'Lobby';
        document.getElementById('lobby-code-text').textContent = code;
    }
    
    showScreen('lobby-screen');
    updateLobbyDisplay();
    
    // Auto-refresh lobby
    if (lobbyRefreshTimer) clearInterval(lobbyRefreshTimer);
    lobbyRefreshTimer = setInterval(updateLobbyDisplay, 1000);
}

function updateLobbyDisplay() {
    if (!lobbyCode) return;
    
    const lobbyData = getFromLocalStorage('lobby_' + lobbyCode);
    if (!lobbyData) {
        showToast('Lobby kapandı!', 'error');
        leaveLobby();
        return;
    }
    
    // Check if user is still in lobby
    const currentPlayer = lobbyData.players.find(p => p.name === username);
    if (!currentPlayer) {
        showToast('Lobbyden çıkarıldınız!', 'error');
        leaveLobby();
        return;
    }
    
    // Update player count
    document.getElementById('player-count').textContent = `${lobbyData.players.length}/${config.maxPlayers}`;
    
    // Update player list
    const playersList = document.getElementById('players-list');
    playersList.innerHTML = '';
    
    lobbyData.players.forEach(player => {
        const playerItem = document.createElement('div');
        playerItem.className = 'player-item';
        
        let badge = '';
        if (player.isHost) {
            badge = '<span class="player-badge badge-host">HOST</span>';
        } else if (player.ready) {
            badge = '<span class="player-badge badge-ready">HAZIR</span>';
        } else {
            badge = '<span class="player-badge badge-waiting">BEKLİYOR</span>';
        }
        
        playerItem.innerHTML = `
            <span class="player-name">${player.name}</span>
            ${badge}
        `;
        
        playersList.appendChild(playerItem);
    });
    
    // Update ready button
    const readyBtn = document.getElementById('ready-btn');
    if (currentPlayer.ready) {
        readyBtn.innerHTML = '<span>✅</span> Hazır';
        readyBtn.classList.remove('btn-secondary');
        readyBtn.classList.add('btn-primary');
    } else {
        readyBtn.innerHTML = '<span>✋</span> Hazırım';
        readyBtn.classList.remove('btn-primary');
        readyBtn.classList.add('btn-secondary');
    }
    
    // Show start button only for host
    const startBtn = document.getElementById('start-btn');
    if (currentPlayer.isHost && lobbyData.players.length >= config.minPlayers) {
        const allReady = lobbyData.players.every(p => p.ready || p.isHost);
        startBtn.style.display = allReady ? 'block' : 'none';
    } else {
        startBtn.style.display = 'none';
    }
    
    // Check if game started
    if (lobbyData.status === 'playing') {
        initializeGame();
    }
}

function toggleReady() {
    if (!lobbyCode) return;
    
    const lobbyData = getFromLocalStorage('lobby_' + lobbyCode);
    if (!lobbyData) return;
    
    const currentPlayer = lobbyData.players.find(p => p.name === username);
    if (!currentPlayer || currentPlayer.isHost) return;
    
    currentPlayer.ready = !currentPlayer.ready;
    saveToLocalStorage('lobby_' + lobbyCode, lobbyData);
    updateLobbyDisplay();
}

function startGame() {
    if (!lobbyCode || !isHost) return;
    
    const lobbyData = getFromLocalStorage('lobby_' + lobbyCode);
    if (!lobbyData) return;
    
    if (lobbyData.players.length < config.minPlayers) {
        showToast(`En az ${config.minPlayers} oyuncu gerekli!`, 'error');
        return;
    }
    
    // Assign roles
    const players = lobbyData.players.map(p => ({
        name: p.name,
        role: null,
        alive: true,
        protected: false
    }));
    
    assignRoles(players);
    
    lobbyData.status = 'playing';
    lobbyData.game = {
        players: players,
        round: 1,
        phase: 'night',
        phaseEndTime: Date.now() + (config.nightTime * 1000),
        nightActions: {},
        votes: {},
        events: []
    };
    
    saveToLocalStorage('lobby_' + lobbyCode, lobbyData);
    initializeGame();
}

function assignRoles(players) {
    const totalPlayers = players.length;
    const killerCount = Math.max(1, Math.floor(totalPlayers / 5));
    const hasDetective = totalPlayers >= 7;
    const hasDoctor = totalPlayers >= 9;
    
    const roles = [];
    
    // Add killers
    for (let i = 0; i < killerCount; i++) {
        roles.push('killer');
    }
    
    // Add special roles
    if (hasDetective) roles.push('detective');
    if (hasDoctor) roles.push('doctor');
    
    // Fill rest with villagers
    while (roles.length < totalPlayers) {
        roles.push('villager');
    }
    
    // Shuffle roles
    for (let i = roles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [roles[i], roles[j]] = [roles[j], roles[i]];
    }
    
    // Assign to players
    players.forEach((player, index) => {
        player.role = roles[index];
    });
}

// ============ Game Functions ============
function initializeGame() {
    if (lobbyRefreshTimer) {
        clearInterval(lobbyRefreshTimer);
        lobbyRefreshTimer = null;
    }
    
    const lobbyData = getFromLocalStorage('lobby_' + lobbyCode);
    if (!lobbyData || !lobbyData.game) return;
    
    gameData = lobbyData.game;
    const player = gameData.players.find(p => p.name === username);
    if (!player) return;
    
    currentRole = player.role;
    showScreen('game-screen');
    updateGameDisplay();
    
    // Start game loop
    if (lobbyRefreshTimer) clearInterval(lobbyRefreshTimer);
    lobbyRefreshTimer = setInterval(gameLoop, 1000);
}

function updateGameDisplay() {
    if (!gameData) return;
    
    const player = gameData.players.find(p => p.name === username);
    if (!player) return;
    
    // Update role card
    const roleInfo = getRoleInfo(currentRole);
    document.getElementById('role-icon').textContent = roleInfo.icon;
    document.getElementById('role-name').textContent = roleInfo.name;
    document.getElementById('role-description').textContent = roleInfo.description;
    
    // Update round
    document.getElementById('round-number').textContent = gameData.round;
    
    // Update phase
    updatePhaseDisplay();
    
    // Update stats
    const aliveCount = gameData.players.filter(p => p.alive).length;
    const deadCount = gameData.players.length - aliveCount;
    document.getElementById('alive-count').textContent = aliveCount;
    document.getElementById('dead-count').textContent = deadCount;
    
    // Update timer
    updateTimer();
}

function getRoleInfo(role) {
    const roles = {
        killer: {
            icon: '🔪',
            name: 'Katil',
            description: 'Her gece bir kişiyi öldür. Tüm köylüleri öldür ve kazan!'
        },
        detective: {
            icon: '🕵️',
            name: 'Dedektif',
            description: 'Her gece bir kişinin rolünü öğren. Katilleri bul!'
        },
        doctor: {
            icon: '💉',
            name: 'Doktor',
            description: 'Her gece bir kişiyi koru. O gece öldürülemez.'
        },
        villager: {
            icon: '👨‍🌾',
            name: 'Köylü',
            description: 'Tartışmalarda katilleri bulmaya çalış ve oyla!'
        }
    };
    
    return roles[role] || roles.villager;
}

function updatePhaseDisplay() {
    if (!gameData) return;
    
    const phaseIcon = document.getElementById('phase-icon');
    const phaseText = document.getElementById('phase-text');
    
    // Hide all phase contents
    document.getElementById('night-content').style.display = 'none';
    document.getElementById('discussion-content').style.display = 'none';
    document.getElementById('voting-content').style.display = 'none';
    
    const player = gameData.players.find(p => p.name === username);
    if (!player || !player.alive) return;
    
    switch (gameData.phase) {
        case 'night':
            phaseIcon.textContent = '🌙';
            phaseText.textContent = 'GECE';
            if (['killer', 'detective', 'doctor'].includes(currentRole)) {
                document.getElementById('night-content').style.display = 'block';
                updateNightTargets();
            }
            break;
            
        case 'discussion':
            phaseIcon.textContent = '💬';
            phaseText.textContent = 'TARTIŞMA';
            document.getElementById('discussion-content').style.display = 'block';
            updateDiscussionDisplay();
            break;
            
        case 'voting':
            phaseIcon.textContent = '🗳️';
            phaseText.textContent = 'OYLAMA';
            document.getElementById('voting-content').style.display = 'block';
            updateVotingDisplay();
            break;
    }
}

function updateNightTargets() {
    const targetList = document.getElementById('night-target-list');
    targetList.innerHTML = '';
    
    const alivePlayers = gameData.players.filter(p => p.alive && p.name !== username);
    
    alivePlayers.forEach(player => {
        const btn = document.createElement('button');
        btn.className = 'target-btn';
        btn.onclick = () => selectNightTarget(player.name);
        
        const isSelected = selectedTarget === player.name;
        if (isSelected) btn.classList.add('selected');
        
        let actionText = '';
        switch (currentRole) {
            case 'killer':
                actionText = '🔪 Öldür';
                break;
            case 'detective':
                actionText = '🔍 Araştır';
                break;
            case 'doctor':
                actionText = '💉 Koru';
                break;
        }
        
        btn.innerHTML = `
            <span>${player.name}</span>
            <span>${actionText}</span>
        `;
        
        targetList.appendChild(btn);
    });
}

function selectNightTarget(targetName) {
    selectedTarget = targetName;
    updateNightTargets();
    
    // Submit action
    submitNightAction(targetName);
}

function submitNightAction(targetName) {
    if (!lobbyCode || !gameData) return;
    
    const lobbyData = getFromLocalStorage('lobby_' + lobbyCode);
    if (!lobbyData || !lobbyData.game) return;
    
    lobbyData.game.nightActions[username] = {
        role: currentRole,
        target: targetName
    };
    
    saveToLocalStorage('lobby_' + lobbyCode, lobbyData);
    showToast('Seçim kaydedildi! ✅', 'success');
}

function updateDiscussionDisplay() {
    const discussionDiv = document.getElementById('alive-players-discussion');
    discussionDiv.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.7); padding: 20px;">Oyuncularla konuş ve şüphelilerini belirle. Sonraki faz oylamadır.</p>';
    
    const alivePlayers = gameData.players.filter(p => p.alive);
    alivePlayers.forEach(player => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-item';
        playerDiv.innerHTML = `<span class="player-name">${player.name}</span>`;
        discussionDiv.appendChild(playerDiv);
    });
}

function updateVotingDisplay() {
    const votingList = document.getElementById('voting-list');
    votingList.innerHTML = '';
    
    const alivePlayers = gameData.players.filter(p => p.alive && p.name !== username);
    
    alivePlayers.forEach(player => {
        const btn = document.createElement('button');
        btn.className = 'vote-btn';
        btn.onclick = () => submitVote(player.name);
        
        const hasVotedForPlayer = gameData.votes[username] === player.name;
        if (hasVotedForPlayer) btn.classList.add('selected');
        
        const voteCount = Object.values(gameData.votes).filter(v => v === player.name).length;
        
        btn.innerHTML = `
            <span>${player.name}</span>
            <span>Oylar: ${voteCount}</span>
        `;
        
        votingList.appendChild(btn);
    });
    
    // Update vote count
    const totalVotes = Object.keys(gameData.votes).length;
    document.getElementById('vote-count').textContent = totalVotes;
}

function submitVote(targetName) {
    if (!lobbyCode || !gameData) return;
    
    const lobbyData = getFromLocalStorage('lobby_' + lobbyCode);
    if (!lobbyData || !lobbyData.game) return;
    
    lobbyData.game.votes[username] = targetName;
    saveToLocalStorage('lobby_' + lobbyCode, lobbyData);
    
    gameData = lobbyData.game;
    updateVotingDisplay();
    showToast('Oyun kaydedildi! ✅', 'success');
}

function updateTimer() {
    if (!gameData) return;
    
    const now = Date.now();
    const remaining = Math.max(0, Math.ceil((gameData.phaseEndTime - now) / 1000));
    
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    document.getElementById('timer-text').textContent = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function gameLoop() {
    if (!lobbyCode) return;
    
    const lobbyData = getFromLocalStorage('lobby_' + lobbyCode);
    if (!lobbyData || !lobbyData.game) return;
    
    gameData = lobbyData.game;
    const now = Date.now();
    
    // Check if phase ended
    if (now >= gameData.phaseEndTime) {
        processPhaseEnd();
    } else {
        updateGameDisplay();
    }
}

function processPhaseEnd() {
    if (!isHost) return; // Only host processes phase transitions
    
    const lobbyData = getFromLocalStorage('lobby_' + lobbyCode);
    if (!lobbyData || !lobbyData.game) return;
    
    const game = lobbyData.game;
    
    switch (game.phase) {
        case 'night':
            processNightActions(game);
            game.phase = 'discussion';
            game.phaseEndTime = Date.now() + (config.discussionTime * 1000);
            game.nightActions = {};
            selectedTarget = null;
            break;
            
        case 'discussion':
            game.phase = 'voting';
            game.phaseEndTime = Date.now() + (config.votingTime * 1000);
            game.votes = {};
            hasVoted = false;
            break;
            
        case 'voting':
            processVoting(game);
            
            // Check win condition
            const result = checkWinCondition(game);
            if (result) {
                endGame(result);
                return;
            }
            
            game.round++;
            game.phase = 'night';
            game.phaseEndTime = Date.now() + (config.nightTime * 1000);
            game.votes = {};
            selectedTarget = null;
            hasVoted = false;
            break;
    }
    
    saveToLocalStorage('lobby_' + lobbyCode, lobbyData);
    gameData = game;
    updateGameDisplay();
}

function processNightActions(game) {
    const killerTargets = [];
    let savedTarget = null;
    const investigations = {};
    
    // Collect actions
    Object.entries(game.nightActions).forEach(([playerName, action]) => {
        switch (action.role) {
            case 'killer':
                killerTargets.push(action.target);
                break;
            case 'doctor':
                savedTarget = action.target;
                break;
            case 'detective':
                investigations[playerName] = action.target;
                break;
        }
    });
    
    // Process kills
    if (killerTargets.length > 0) {
        // Pick most common target (or random if tie)
        const targetCounts = {};
        killerTargets.forEach(t => {
            targetCounts[t] = (targetCounts[t] || 0) + 1;
        });
        
        const maxCount = Math.max(...Object.values(targetCounts));
        const topTargets = Object.keys(targetCounts).filter(t => targetCounts[t] === maxCount);
        const killedTarget = topTargets[Math.floor(Math.random() * topTargets.length)];
        
        // Check if saved
        if (killedTarget !== savedTarget) {
            const victim = game.players.find(p => p.name === killedTarget);
            if (victim) {
                victim.alive = false;
                game.events.push(`💀 ${killedTarget} öldürüldü!`);
            }
        } else {
            game.events.push(`💉 Birisi korundu!`);
        }
    }
}

function processVoting(game) {
    if (Object.keys(game.votes).length === 0) {
        game.events.push('🗳️ Kimse oy kullanmadı.');
        return;
    }
    
    // Count votes
    const voteCounts = {};
    Object.values(game.votes).forEach(target => {
        voteCounts[target] = (voteCounts[target] || 0) + 1;
    });
    
    // Find max votes
    const maxVotes = Math.max(...Object.values(voteCounts));
    const topVoted = Object.keys(voteCounts).filter(t => voteCounts[t] === maxVotes);
    
    if (topVoted.length === 1) {
        const executed = topVoted[0];
        const victim = game.players.find(p => p.name === executed);
        if (victim) {
            victim.alive = false;
            game.events.push(`⚖️ ${executed} idam edildi! (Rol: ${getRoleInfo(victim.role).name})`);
        }
    } else {
        game.events.push('🗳️ Oylar eşit, kimse idam edilmedi.');
    }
}

function checkWinCondition(game) {
    const alive = game.players.filter(p => p.alive);
    const killers = alive.filter(p => p.role === 'killer');
    const villagers = alive.filter(p => p.role !== 'killer');
    
    if (killers.length === 0) {
        return 'villagers';
    }
    
    if (killers.length >= villagers.length) {
        return 'killers';
    }
    
    return null;
}

function endGame(winner) {
    const lobbyData = getFromLocalStorage('lobby_' + lobbyCode);
    if (!lobbyData || !lobbyData.game) return;
    
    lobbyData.status = 'ended';
    saveToLocalStorage('lobby_' + lobbyCode, lobbyData);
    
    if (lobbyRefreshTimer) {
        clearInterval(lobbyRefreshTimer);
        lobbyRefreshTimer = null;
    }
    
    showGameEndScreen(winner, lobbyData.game.players);
}

function showGameEndScreen(winner, players) {
    showScreen('game-end-screen');
    
    const winnerIcon = document.getElementById('winner-icon');
    const winnerText = document.getElementById('winner-text');
    
    if (winner === 'villagers') {
        winnerIcon.textContent = '🏆';
        winnerText.textContent = 'Köylüler Kazandı!';
    } else {
        winnerIcon.textContent = '🔪';
        winnerText.textContent = 'Katiller Kazandı!';
    }
    
    // Show roles
    const rolesList = document.getElementById('roles-list');
    rolesList.innerHTML = '';
    
    players.forEach(player => {
        const roleInfo = getRoleInfo(player.role);
        const item = document.createElement('div');
        item.className = 'role-reveal-item';
        item.innerHTML = `
            <span class="role-reveal-name">${player.alive ? '✅' : '💀'} ${player.name}</span>
            <span class="role-reveal-role">${roleInfo.icon} ${roleInfo.name}</span>
        `;
        rolesList.appendChild(item);
    });
}

// ============ Init ============
window.addEventListener('DOMContentLoaded', () => {
    showMainMenu();
    cleanupOldLobbies();
});
