// Katil Kim - Game Logic

const config = {
    minPlayers: 5,
    maxPlayers: 15,
    nightTime: 30,
    discussionTime: 120,
    votingTime: 60,
    lobbyRefreshInterval: 3000,
    passwordAttempts: 3,
    passwordLockoutTime: 60000
};

let gameState = {
    username: '',
    lobbyCode: '',
    character: {
        gender: 'male',
        hat: 'none',
        top: 'tshirt',
        bottom: 'jeans'
    }
};

let selectedLobbyCode = '';
let passwordAttemptCount = 0;
let passwordLockoutUntil = 0;
let lobbyRefreshTimer = null;
let gameTimer = null;

// Character Drawing
function drawCharacter() {
    const canvas = document.getElementById('character-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const char = gameState.character;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw body based on gender
    ctx.fillStyle = char.gender === 'male' ? '#fbbf77' : '#ffcba4';
    
    // Head
    ctx.beginPath();
    ctx.arc(100, 80, 40, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(85, 75, 5, 0, Math.PI * 2);
    ctx.arc(115, 75, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Mouth
    ctx.beginPath();
    ctx.arc(100, 90, 15, 0, Math.PI);
    ctx.stroke();
    
    // Hat
    if (char.hat !== 'none') {
        ctx.fillStyle = getHatColor(char.hat);
        ctx.beginPath();
        
        if (char.hat === 'cap') {
            ctx.fillRect(70, 35, 60, 10);
            ctx.fillRect(100, 25, 40, 15);
        } else if (char.hat === 'beanie') {
            ctx.arc(100, 40, 45, Math.PI, 0, true);
            ctx.fill();
        } else if (char.hat === 'fedora') {
            ctx.fillRect(60, 35, 80, 5);
            ctx.fillRect(75, 25, 50, 15);
        }
    }
    
    // Body
    ctx.fillStyle = getClothingColor(char.top);
    ctx.fillRect(60, 120, 80, 100);
    
    // Legs
    ctx.fillStyle = getClothingColor(char.bottom);
    ctx.fillRect(65, 220, 30, 70);
    ctx.fillRect(105, 220, 30, 70);
}

function getHatColor(hat) {
    const colors = { cap: '#e74c3c', beanie: '#3498db', fedora: '#2c3e50' };
    return colors[hat] || '#000';
}

function getClothingColor(clothing) {
    const colors = {
        tshirt: '#3498db',
        hoodie: '#e74c3c',
        jacket: '#2c3e50',
        suit: '#34495e',
        jeans: '#2980b9',
        shorts: '#95a5a6',
        skirt: '#e91e63'
    };
    return colors[clothing] || '#000';
}

function updateCharacter(type, value) {
    gameState.character[type] = value;
    
    // Update active button
    const buttons = document.querySelectorAll(`[data-type="${type}"]`);
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.value === value) {
            btn.classList.add('active');
        }
    });
    
    drawCharacter();
}

function saveCharacter() {
    saveToLocalStorage('character', gameState.character);
    showToast('Karakter kaydedildi!', 'success');
    backToMenu();
}

function showCharacterCustomization() {
    const username = document.getElementById('username-input').value.trim();
    if (!username) {
        showToast('Kullanıcı adı giriniz', 'error');
        return;
    }
    
    gameState.username = username;
    
    // Load saved character
    const savedChar = getFromLocalStorage('character');
    if (savedChar) {
        gameState.character = savedChar;
    }
    
    showScreen('character-customization');
    drawCharacter();
    
    // Set active buttons
    Object.keys(gameState.character).forEach(type => {
        const value = gameState.character[type];
        const buttons = document.querySelectorAll(`[data-type="${type}"]`);
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.value === value) {
                btn.classList.add('active');
            }
        });
    });
}

// Demo Mode
function startDemoMode() {
    const username = document.getElementById('username-input').value.trim();
    if (!username) {
        showToast('Kullanıcı adı giriniz', 'error');
        return;
    }
    
    gameState.username = username;
    
    // Create demo lobby
    const code = 'DEMO00';
    const botNames = ['Ali', 'Ayşe', 'Mehmet', 'Zeynep', 'Can', 'Elif', 'Burak', 'Deniz'];
    const players = [
        { name: username, ready: true, character: gameState.character }
    ];
    
    // Add 4-7 random bots
    const botCount = Math.floor(Math.random() * 4) + 4;
    for (let i = 0; i < botCount && i < botNames.length; i++) {
        players.push({
            name: botNames[i],
            ready: true,
            isBot: true,
            character: generateRandomCharacter()
        });
    }
    
    const lobbyData = {
        code: code,
        host: username,
        name: 'Demo Oyunu',
        players: players,
        createdAt: Date.now(),
        isDemo: true
    };
    
    gameState.lobbyCode = code;
    saveToLocalStorage(`lobby_${code}`, lobbyData);
    
    showLobbyScreen(code);
    
    // Auto start after 2 seconds
    setTimeout(() => {
        startGame();
    }, 2000);
}

function generateRandomCharacter() {
    const genders = ['male', 'female'];
    const hats = ['none', 'cap', 'beanie', 'fedora'];
    const tops = ['tshirt', 'hoodie', 'jacket', 'suit'];
    const bottoms = ['jeans', 'shorts', 'skirt', 'suit'];
    
    return {
        gender: genders[Math.floor(Math.random() * genders.length)],
        hat: hats[Math.floor(Math.random() * hats.length)],
        top: tops[Math.floor(Math.random() * tops.length)],
        bottom: bottoms[Math.floor(Math.random() * bottoms.length)]
    };
}

// UI Functions
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
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
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        console.error('LocalStorage error:', e);
        return null;
    }
}

function generateLobbyCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Check if code exists
    if (getFromLocalStorage(`lobby_${code}`)) {
        return generateLobbyCode();
    }
    
    return code;
}

function getAllLobbies() {
    cleanupOldLobbies();
    const lobbies = [];
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('lobby_')) {
            const lobby = getFromLocalStorage(key);
            if (lobby && !lobby.isDemo) {
                lobbies.push(lobby);
            }
        }
    }
    
    return lobbies.sort((a, b) => b.createdAt - a.createdAt);
}

function cleanupOldLobbies() {
    const maxAge = 30 * 60 * 1000; // 30 minutes
    const now = Date.now();
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('lobby_')) {
            const lobby = getFromLocalStorage(key);
            if (lobby && now - lobby.createdAt > maxAge) {
                localStorage.removeItem(key);
            }
        }
    }
}

// Menu Functions
function showMainMenu() {
    showScreen('main-menu');
    if (lobbyRefreshTimer) {
        clearInterval(lobbyRefreshTimer);
        lobbyRefreshTimer = null;
    }
}

function showCreateLobby() {
    const username = document.getElementById('username-input').value.trim();
    if (!username) {
        showToast('Kullanıcı adı giriniz', 'error');
        return;
    }
    
    gameState.username = username;
    showScreen('create-lobby-screen');
}

function togglePasswordField() {
    const checkbox = document.getElementById('private-lobby-checkbox');
    const field = document.getElementById('password-field');
    field.style.display = checkbox.checked ? 'block' : 'none';
}

function createLobby() {
    const lobbyName = document.getElementById('lobby-name-input').value.trim() || `${gameState.username}'ın Odası`;
    const isPrivate = document.getElementById('private-lobby-checkbox').checked;
    const password = isPrivate ? document.getElementById('lobby-password-input').value.trim() : '';
    
    if (isPrivate && !password) {
        showToast('Şifre giriniz', 'error');
        return;
    }
    
    const code = generateLobbyCode();
    const lobbyData = {
        code: code,
        host: gameState.username,
        name: lobbyName,
        password: password || null,
        players: [{
            name: gameState.username,
            ready: false,
            character: gameState.character
        }],
        createdAt: Date.now()
    };
    
    gameState.lobbyCode = code;
    saveToLocalStorage(`lobby_${code}`, lobbyData);
    
    showLobbyScreen(code);
}

function showLobbyBrowser() {
    const username = document.getElementById('username-input').value.trim();
    if (!username) {
        showToast('Kullanıcı adı giriniz', 'error');
        return;
    }
    
    gameState.username = username;
    showScreen('lobby-browser-screen');
    refreshLobbyList();
    
    // Auto refresh
    if (lobbyRefreshTimer) clearInterval(lobbyRefreshTimer);
    lobbyRefreshTimer = setInterval(refreshLobbyList, config.lobbyRefreshInterval);
}

function refreshLobbyList() {
    const lobbies = getAllLobbies();
    const listContainer = document.getElementById('lobby-list');
    const emptyState = document.getElementById('empty-lobbies');
    
    if (lobbies.length === 0) {
        listContainer.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    listContainer.innerHTML = '';
    
    lobbies.forEach(lobby => {
        const card = document.createElement('div');
        card.className = 'lobby-card';
        card.onclick = () => selectLobby(lobby.code, !!lobby.password);
        
        const lockIcon = lobby.password ? ' 🔒' : '';
        
        card.innerHTML = `
            <div class="lobby-header">
                <span class="lobby-code">${lobby.code}</span>
                ${lockIcon ? `<span class="lobby-lock">${lockIcon}</span>` : ''}
            </div>
            <div class="lobby-info">
                <span class="lobby-host">${lobby.name || lobby.host}</span>
                <span class="lobby-players">${lobby.players.length}/${config.maxPlayers}</span>
            </div>
        `;
        
        listContainer.appendChild(card);
    });
}

function searchLobbies() {
    const search = document.getElementById('lobby-search-input').value.toLowerCase();
    const cards = document.querySelectorAll('.lobby-card');
    
    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(search) ? 'block' : 'none';
    });
}

function selectLobby(code, requiresPassword) {
    if (requiresPassword) {
        selectedLobbyCode = code;
        openPasswordModal();
    } else {
        joinLobby(code);
    }
}

function openPasswordModal() {
    const modal = document.getElementById('password-modal');
    modal.classList.add('active');
    document.getElementById('password-input').value = '';
    document.getElementById('password-error').style.display = 'none';
}

function closePasswordModal() {
    const modal = document.getElementById('password-modal');
    modal.classList.remove('active');
    selectedLobbyCode = '';
    passwordAttemptCount = 0;
}

function submitPassword() {
    const now = Date.now();
    if (now < passwordLockoutUntil) {
        const remainingSeconds = Math.ceil((passwordLockoutUntil - now) / 1000);
        showToast(`Çok fazla yanlış deneme! ${remainingSeconds}s bekleyin.`, 'error');
        return;
    }
    
    const password = document.getElementById('password-input').value;
    const lobbyData = getFromLocalStorage(`lobby_${selectedLobbyCode}`);
    
    if (!lobbyData) {
        showToast('Oda bulunamadı', 'error');
        closePasswordModal();
        return;
    }
    
    if (lobbyData.password !== password) {
        passwordAttemptCount++;
        
        if (passwordAttemptCount >= config.passwordAttempts) {
            passwordLockoutUntil = Date.now() + config.passwordLockoutTime;
            passwordAttemptCount = 0;
            showToast('Çok fazla yanlış deneme! 1 dakika beklemelisiniz.', 'error');
            closePasswordModal();
        } else {
            const errorMsg = document.getElementById('password-error');
            errorMsg.textContent = `Yanlış şifre! (${passwordAttemptCount}/${config.passwordAttempts})`;
            errorMsg.style.display = 'block';
        }
        return;
    }
    
    passwordAttemptCount = 0;
    closePasswordModal();
    joinLobby(selectedLobbyCode);
}

function showJoinLobby() {
    const username = document.getElementById('username-input').value.trim();
    if (!username) {
        showToast('Kullanıcı adı giriniz', 'error');
        return;
    }
    
    gameState.username = username;
    showScreen('join-lobby-screen');
}

function joinLobbyByCode() {
    const code = document.getElementById('join-code-input').value.trim().toUpperCase();
    
    if (code.length !== 6) {
        showToast('Geçersiz kod', 'error');
        return;
    }
    
    const lobbyData = getFromLocalStorage(`lobby_${code}`);
    
    if (!lobbyData) {
        showToast('Oda bulunamadı', 'error');
        return;
    }
    
    if (lobbyData.password) {
        selectedLobbyCode = code;
        openPasswordModal();
    } else {
        joinLobby(code);
    }
}

function joinLobby(code) {
    const lobbyData = getFromLocalStorage(`lobby_${code}`);
    
    if (!lobbyData) {
        showToast('Oda bulunamadı', 'error');
        return;
    }
    
    if (lobbyData.players.length >= config.maxPlayers) {
        showToast('Oda dolu', 'error');
        return;
    }
    
    const existingPlayer = lobbyData.players.find(p => p.name === gameState.username);
    
    if (!existingPlayer) {
        lobbyData.players.push({
            name: gameState.username,
            ready: false,
            character: gameState.character
        });
        saveToLocalStorage(`lobby_${code}`, lobbyData);
    }
    
    gameState.lobbyCode = code;
    showLobbyScreen(code);
}

function leaveLobby() {
    const lobbyData = getFromLocalStorage(`lobby_${gameState.lobbyCode}`);
    
    if (lobbyData) {
        lobbyData.players = lobbyData.players.filter(p => p.name !== gameState.username);
        
        if (lobbyData.players.length === 0) {
            localStorage.removeItem(`lobby_${gameState.lobbyCode}`);
        } else {
            if (lobbyData.host === gameState.username) {
                lobbyData.host = lobbyData.players[0].name;
            }
            saveToLocalStorage(`lobby_${gameState.lobbyCode}`, lobbyData);
        }
    }
    
    gameState.lobbyCode = '';
    backToMenu();
}

function backToMenu() {
    gameState.lobbyCode = '';
    if (lobbyRefreshTimer) {
        clearInterval(lobbyRefreshTimer);
        lobbyRefreshTimer = null;
    }
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
    showMainMenu();
}

// Lobby Screen
function showLobbyScreen(code) {
    showScreen('lobby-screen');
    updateLobbyDisplay();
    
    if (lobbyRefreshTimer) clearInterval(lobbyRefreshTimer);
    lobbyRefreshTimer = setInterval(updateLobbyDisplay, 1000);
}

function updateLobbyDisplay() {
    const lobbyData = getFromLocalStorage(`lobby_${gameState.lobbyCode}`);
    
    if (!lobbyData) {
        showToast('Oda bulunamadı', 'error');
        backToMenu();
        return;
    }
    
    document.getElementById('lobby-title').textContent = lobbyData.name || lobbyData.code;
    document.getElementById('lobby-subtitle').textContent = `Host: ${lobbyData.host}`;
    document.getElementById('lobby-code-text').textContent = lobbyData.code;
    document.getElementById('lobby-player-count').textContent = `${lobbyData.players.length}/${config.maxPlayers} Oyuncu`;
    
    const playerList = document.getElementById('lobby-player-list');
    playerList.innerHTML = '';
    
    lobbyData.players.forEach(player => {
        const item = document.createElement('div');
        item.className = 'player-item';
        
        let statusBadge = '';
        if (player.name === lobbyData.host) {
            statusBadge = '<span class="player-status host">Host</span>';
        } else if (player.ready) {
            statusBadge = '<span class="player-status ready">Hazır</span>';
        } else {
            statusBadge = '<span class="player-status waiting">Bekliyor</span>';
        }
        
        item.innerHTML = `
            <span class="player-name">${player.name}</span>
            ${statusBadge}
        `;
        
        playerList.appendChild(item);
    });
    
    const currentPlayer = lobbyData.players.find(p => p.name === gameState.username);
    const readyBtn = document.getElementById('ready-btn');
    const startBtn = document.getElementById('start-game-btn');
    
    if (currentPlayer) {
        readyBtn.textContent = currentPlayer.ready ? 'Hazır ✓' : 'Hazırım';
        readyBtn.className = currentPlayer.ready ? 'btn btn-success' : 'btn btn-secondary';
    }
    
    if (lobbyData.host === gameState.username) {
        const allReady = lobbyData.players.every(p => p.ready || p.name === lobbyData.host);
        const enoughPlayers = lobbyData.players.length >= config.minPlayers;
        
        startBtn.style.display = allReady && enoughPlayers ? 'block' : 'none';
        readyBtn.style.display = 'none';
    } else {
        startBtn.style.display = 'none';
        readyBtn.style.display = 'block';
    }
}

function toggleReady() {
    const lobbyData = getFromLocalStorage(`lobby_${gameState.lobbyCode}`);
    
    if (!lobbyData) return;
    
    const player = lobbyData.players.find(p => p.name === gameState.username);
    if (player) {
        player.ready = !player.ready;
        saveToLocalStorage(`lobby_${gameState.lobbyCode}`, lobbyData);
        updateLobbyDisplay();
    }
}

function startGame() {
    const lobbyData = getFromLocalStorage(`lobby_${gameState.lobbyCode}`);
    
    if (!lobbyData) return;
    
    if (lobbyData.host !== gameState.username && !lobbyData.isDemo) {
        showToast('Sadece host oyunu başlatabilir', 'error');
        return;
    }
    
    if (lobbyData.players.length < config.minPlayers) {
        showToast(`En az ${config.minPlayers} oyuncu gerekli`, 'error');
        return;
    }
    
    const players = lobbyData.players.map(p => ({
        name: p.name,
        alive: true,
        role: '',
        character: p.character,
        isBot: p.isBot || false
    }));
    
    const roles = assignRoles(players);
    players.forEach((p, i) => p.role = roles[i]);
    
    lobbyData.game = {
        players: players,
        phase: 'night',
        round: 1,
        phaseEndTime: Date.now() + config.nightTime * 1000,
        nightActions: {},
        votes: {}
    };
    
    saveToLocalStorage(`lobby_${gameState.lobbyCode}`, lobbyData);
    
    if (lobbyRefreshTimer) {
        clearInterval(lobbyRefreshTimer);
        lobbyRefreshTimer = null;
    }
    
    initializeGame();
}

function assignRoles(players) {
    const count = players.length;
    const roles = [];
    
    // Calculate roles
    const killerCount = Math.floor(count / 5);
    const hasDetective = count >= 7;
    const hasDoctor = count >= 9;
    
    // Add killers
    for (let i = 0; i < killerCount; i++) {
        roles.push('killer');
    }
    
    // Add special roles
    if (hasDetective) roles.push('detective');
    if (hasDoctor) roles.push('doctor');
    
    // Fill rest with villagers
    while (roles.length < count) {
        roles.push('villager');
    }
    
    // Shuffle roles
    for (let i = roles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [roles[i], roles[j]] = [roles[j], roles[i]];
    }
    
    return roles;
}

function initializeGame() {
    showScreen('game-screen');
    updateGameDisplay();
    
    if (gameTimer) clearInterval(gameTimer);
    gameTimer = setInterval(() => {
        updateTimer();
        gameLoop();
    }, 1000);
}

function updateGameDisplay() {
    const lobbyData = getFromLocalStorage(`lobby_${gameState.lobbyCode}`);
    if (!lobbyData || !lobbyData.game) return;
    
    const game = lobbyData.game;
    const player = game.players.find(p => p.name === gameState.username);
    
    if (!player) return;
    
    // Update role card
    const roleInfo = getRoleInfo(player.role);
    document.getElementById('role-name').textContent = roleInfo.name;
    document.getElementById('role-description').textContent = roleInfo.description;
    
    // Update phase
    document.getElementById('phase-name').textContent = game.phase === 'night' ? 'Gece' : game.phase === 'discussion' ? 'Tartışma' : 'Oylama';
    
    // Update stats
    const aliveVillagers = game.players.filter(p => p.alive && p.role !== 'killer').length;
    const aliveKillers = game.players.filter(p => p.alive && p.role === 'killer').length;
    
    document.getElementById('villagers-alive').textContent = aliveVillagers;
    document.getElementById('killers-alive').textContent = aliveKillers;
    document.getElementById('round-number').textContent = game.round;
    
    // Update phase display
    updatePhaseDisplay();
}

function getRoleInfo(role) {
    const roles = {
        killer: {
            name: '🔪 Katil',
            description: 'Gece vakti bir köylü öldür. Amacın köylü sayısını kendi sayına eşitlemek.'
        },
        detective: {
            name: '🔍 Dedektif',
            description: 'Gece vakti bir oyuncunun rolünü öğren. Katilleri bulup köylüleri kurtar.'
        },
        doctor: {
            name: '💊 Doktor',
            description: 'Gece vakti bir oyuncuyu koru. Katillerin saldırısından kurtarabilirsin.'
        },
        villager: {
            name: '👤 Köylü',
            description: 'Tartışmalarda katili bul ve oylamaya katıl. Katilleri ortadan kaldır.'
        }
    };
    
    return roles[role] || roles.villager;
}

function updatePhaseDisplay() {
    document.getElementById('night-content').style.display = 'none';
    document.getElementById('discussion-content').style.display = 'none';
    document.getElementById('voting-content').style.display = 'none';
    
    const lobbyData = getFromLocalStorage(`lobby_${gameState.lobbyCode}`);
    if (!lobbyData || !lobbyData.game) return;
    
    const game = lobbyData.game;
    
    if (game.phase === 'night') {
        document.getElementById('night-content').style.display = 'block';
        updateNightTargets();
    } else if (game.phase === 'discussion') {
        document.getElementById('discussion-content').style.display = 'block';
    } else if (game.phase === 'voting') {
        document.getElementById('voting-content').style.display = 'block';
        updateVotingDisplay();
    }
}

function updateNightTargets() {
    const lobbyData = getFromLocalStorage(`lobby_${gameState.lobbyCode}`);
    if (!lobbyData || !lobbyData.game) return;
    
    const game = lobbyData.game;
    const player = game.players.find(p => p.name === gameState.username);
    
    if (!player || !player.alive) {
        document.getElementById('night-title').textContent = 'Ölüsün';
        document.getElementById('night-description').textContent = 'Oyunu izliyorsun...';
        document.getElementById('night-targets').innerHTML = '';
        return;
    }
    
    const targets = game.players.filter(p => p.alive && p.name !== gameState.username);
    const container = document.getElementById('night-targets');
    container.innerHTML = '';
    
    if (player.role === 'killer') {
        document.getElementById('night-title').textContent = 'Kurbanını Seç';
        document.getElementById('night-description').textContent = 'Bir köylü seç ve öldür.';
        
        targets.forEach(target => {
            const btn = document.createElement('button');
            btn.className = 'target-item';
            btn.textContent = target.name;
            btn.onclick = () => submitNightAction(target.name);
            container.appendChild(btn);
        });
    } else if (player.role === 'detective') {
        document.getElementById('night-title').textContent = 'Araştır';
        document.getElementById('night-description').textContent = 'Bir oyuncunun rolünü öğren.';
        
        targets.forEach(target => {
            const btn = document.createElement('button');
            btn.className = 'target-item';
            btn.textContent = target.name;
            btn.onclick = () => submitNightAction(target.name);
            container.appendChild(btn);
        });
    } else if (player.role === 'doctor') {
        document.getElementById('night-title').textContent = 'Koru';
        document.getElementById('night-description').textContent = 'Bir oyuncuyu katillerden koru.';
        
        targets.forEach(target => {
            const btn = document.createElement('button');
            btn.className = 'target-item';
            btn.textContent = target.name;
            btn.onclick = () => submitNightAction(target.name);
            container.appendChild(btn);
        });
    } else {
        document.getElementById('night-title').textContent = 'Uyu';
        document.getElementById('night-description').textContent = 'Sabahı bekle...';
    }
}

function submitNightAction(targetName) {
    const lobbyData = getFromLocalStorage(`lobby_${gameState.lobbyCode}`);
    if (!lobbyData || !lobbyData.game) return;
    
    lobbyData.game.nightActions[gameState.username] = {
        target: targetName,
        timestamp: Date.now()
    };
    
    saveToLocalStorage(`lobby_${gameState.lobbyCode}`, lobbyData);
    showToast('Aksiyonun kaydedildi', 'success');
    
    document.querySelectorAll('.target-item').forEach(btn => {
        btn.disabled = true;
        if (btn.textContent === targetName) {
            btn.classList.add('selected');
        }
    });
}

function updateVotingDisplay() {
    const lobbyData = getFromLocalStorage(`lobby_${gameState.lobbyCode}`);
    if (!lobbyData || !lobbyData.game) return;
    
    const game = lobbyData.game;
    const player = game.players.find(p => p.name === gameState.username);
    
    const targets = game.players.filter(p => p.alive);
    const container = document.getElementById('voting-targets');
    container.innerHTML = '';
    
    if (!player || !player.alive) {
        container.innerHTML = '<p>Ölüsün, oylayamazsın</p>';
        return;
    }
    
    targets.forEach(target => {
        const btn = document.createElement('button');
        btn.className = 'target-item';
        btn.textContent = target.name;
        btn.onclick = () => submitVote(target.name);
        
        if (game.votes[gameState.username]) {
            btn.disabled = true;
            if (game.votes[gameState.username] === target.name) {
                btn.classList.add('selected');
            }
        }
        
        container.appendChild(btn);
    });
}

function submitVote(targetName) {
    const lobbyData = getFromLocalStorage(`lobby_${gameState.lobbyCode}`);
    if (!lobbyData || !lobbyData.game) return;
    
    lobbyData.game.votes[gameState.username] = targetName;
    saveToLocalStorage(`lobby_${gameState.lobbyCode}`, lobbyData);
    
    showToast('Oyun kaydedildi', 'success');
    updateVotingDisplay();
}

function updateTimer() {
    const lobbyData = getFromLocalStorage(`lobby_${gameState.lobbyCode}`);
    if (!lobbyData || !lobbyData.game) return;
    
    const remaining = Math.max(0, Math.ceil((lobbyData.game.phaseEndTime - Date.now()) / 1000));
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    
    document.getElementById('phase-timer').textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function gameLoop() {
    const lobbyData = getFromLocalStorage(`lobby_${gameState.lobbyCode}`);
    if (!lobbyData || !lobbyData.game) return;
    
    // Only host processes game logic
    if (lobbyData.host !== gameState.username && !lobbyData.isDemo) {
        updateGameDisplay();
        return;
    }
    
    const game = lobbyData.game;
    
    // Check if phase ended
    if (Date.now() >= game.phaseEndTime) {
        processPhaseEnd();
    }
    
    // Bot actions in demo mode
    if (lobbyData.isDemo) {
        processBotActions();
    }
}

function processBotActions() {
    const lobbyData = getFromLocalStorage(`lobby_${gameState.lobbyCode}`);
    if (!lobbyData || !lobbyData.game) return;
    
    const game = lobbyData.game;
    
    game.players.forEach(player => {
        if (!player.isBot || !player.alive) return;
        
        if (game.phase === 'night' && !game.nightActions[player.name]) {
            const targets = game.players.filter(p => p.alive && p.name !== player.name);
            if (targets.length > 0 && (player.role === 'killer' || player.role === 'detective' || player.role === 'doctor')) {
                const randomTarget = targets[Math.floor(Math.random() * targets.length)];
                game.nightActions[player.name] = {
                    target: randomTarget.name,
                    timestamp: Date.now()
                };
            }
        }
        
        if (game.phase === 'voting' && !game.votes[player.name]) {
            const targets = game.players.filter(p => p.alive);
            if (targets.length > 0) {
                const randomTarget = targets[Math.floor(Math.random() * targets.length)];
                game.votes[player.name] = randomTarget.name;
            }
        }
    });
    
    saveToLocalStorage(`lobby_${gameState.lobbyCode}`, lobbyData);
}

function processPhaseEnd() {
    const lobbyData = getFromLocalStorage(`lobby_${gameState.lobbyCode}`);
    if (!lobbyData || !lobbyData.game) return;
    
    const game = lobbyData.game;
    
    if (game.phase === 'night') {
        processNightActions(game);
        game.phase = 'discussion';
        game.phaseEndTime = Date.now() + config.discussionTime * 1000;
        game.nightActions = {};
    } else if (game.phase === 'discussion') {
        game.phase = 'voting';
        game.phaseEndTime = Date.now() + config.votingTime * 1000;
        game.votes = {};
    } else if (game.phase === 'voting') {
        processVoting(game);
        
        const winner = checkWinCondition(game);
        if (winner) {
            endGame(winner);
            return;
        }
        
        game.phase = 'night';
        game.round++;
        game.phaseEndTime = Date.now() + config.nightTime * 1000;
        game.votes = {};
        game.nightActions = {};
    }
    
    saveToLocalStorage(`lobby_${gameState.lobbyCode}`, lobbyData);
    updateGameDisplay();
}

function processNightActions(game) {
    let victim = null;
    let protected = null;
    const investigations = {};
    
    // Get killer targets
    const killers = game.players.filter(p => p.role === 'killer' && p.alive);
    killers.forEach(killer => {
        const action = game.nightActions[killer.name];
        if (action) {
            victim = action.target;
        }
    });
    
    // Get doctor protection
    const doctors = game.players.filter(p => p.role === 'doctor' && p.alive);
    doctors.forEach(doctor => {
        const action = game.nightActions[doctor.name];
        if (action) {
            protected = action.target;
        }
    });
    
    // Get detective investigations
    const detectives = game.players.filter(p => p.role === 'detective' && p.alive);
    detectives.forEach(detective => {
        const action = game.nightActions[detective.name];
        if (action) {
            const target = game.players.find(p => p.name === action.target);
            if (target) {
                investigations[detective.name] = {
                    target: action.target,
                    role: target.role
                };
            }
        }
    });
    
    // Process kill
    if (victim && victim !== protected) {
        const player = game.players.find(p => p.name === victim);
        if (player) {
            player.alive = false;
            showToast(`${victim} öldü!`, 'error');
        }
    } else if (victim === protected) {
        showToast('Doktor birini korudu!', 'info');
    }
}

function processVoting(game) {
    const voteCounts = {};
    
    Object.values(game.votes).forEach(target => {
        voteCounts[target] = (voteCounts[target] || 0) + 1;
    });
    
    let maxVotes = 0;
    let executed = null;
    
    Object.entries(voteCounts).forEach(([name, count]) => {
        if (count > maxVotes) {
            maxVotes = count;
            executed = name;
        }
    });
    
    if (executed && maxVotes > 0) {
        const player = game.players.find(p => p.name === executed);
        if (player) {
            player.alive = false;
            showToast(`${executed} idam edildi! (${player.role})`, 'warning');
        }
    } else {
        showToast('Kimse idam edilmedi', 'info');
    }
}

function checkWinCondition(game) {
    const aliveKillers = game.players.filter(p => p.alive && p.role === 'killer').length;
    const aliveVillagers = game.players.filter(p => p.alive && p.role !== 'killer').length;
    
    if (aliveKillers === 0) {
        return 'villagers';
    }
    
    if (aliveKillers >= aliveVillagers) {
        return 'killers';
    }
    
    return null;
}

function endGame(winner) {
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
    
    const lobbyData = getFromLocalStorage(`lobby_${gameState.lobbyCode}`);
    if (!lobbyData || !lobbyData.game) return;
    
    showGameEndScreen(winner, lobbyData.game.players);
}

function showGameEndScreen(winner, players) {
    showScreen('game-end-screen');
    
    const winnerText = winner === 'villagers' ? '👥 Köylüler Kazandı!' : '🔪 Katiller Kazandı!';
    const subtitle = winner === 'villagers' ? 'Tüm katiller bulundu!' : 'Katiller köyü ele geçirdi!';
    
    document.getElementById('winner-text').textContent = winnerText;
    document.getElementById('winner-subtitle').textContent = subtitle;
    
    const rolesList = document.getElementById('roles-list');
    rolesList.innerHTML = '';
    
    players.forEach(player => {
        const item = document.createElement('div');
        item.className = 'role-reveal-item';
        
        const roleInfo = getRoleInfo(player.role);
        
        item.innerHTML = `
            <span class="role-reveal-name">${player.name}</span>
            <span class="role-reveal-role">${roleInfo.name}</span>
        `;
        
        rolesList.appendChild(item);
    });
}

function showHowToPlay() {
    showScreen('how-to-play-screen');
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    const savedChar = getFromLocalStorage('character');
    if (savedChar) {
        gameState.character = savedChar;
    }
    
    showMainMenu();
});
