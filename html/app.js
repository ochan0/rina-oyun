// Katil Kim - Client-side App Logic
// LocalStorage tabanlı, SQL kullanmayan versiyon

// Global Variables
let currentScreen = 'main-menu';
let username = '';
let lobbyCode = '';
let currentRole = null;
let currentPhase = null;
let gameData = null;
let timerInterval = null;
let selectedTarget = null;
let hasVoted = false;

// Utility Functions
function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
    });
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        currentScreen = screenId;
    }
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show ' + type;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function saveToLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getFromLocalStorage(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

function getUsernameFromStorage() {
    return getFromLocalStorage('katilkim_username') || '';
}

function saveUsernameToStorage(name) {
    saveToLocalStorage('katilkim_username', name);
}

// Navigation Functions
function showMainMenu() {
    showScreen('main-menu');
    const savedUsername = getUsernameFromStorage();
    if (savedUsername) {
        document.getElementById('username-input').value = savedUsername;
    }
}

function showCreateLobby() {
    const usernameInput = document.getElementById('username-input');
    const name = usernameInput.value.trim();
    
    if (!name) {
        showToast('Lütfen kullanıcı adı girin!', 'error');
        return;
    }
    
    username = name;
    saveUsernameToStorage(username);
    
    // Send to server (FiveM)
    if (window.fetch) {
        fetch(`https://${GetParentResourceName()}/createLobby`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username
            })
        });
    } else {
        // Standalone mode (GitHub Pages)
        const code = generateLobbyCode();
        lobbyCode = code;
        
        const lobbyData = {
            host: username,
            players: [{name: username, ready: false, isHost: true}],
            status: 'waiting'
        };
        
        saveToLocalStorage('lobby_' + code, lobbyData);
        showLobbyScreen(code);
    }
}

function showJoinLobby() {
    const usernameInput = document.getElementById('username-input');
    const name = usernameInput.value.trim();
    
    if (!name) {
        showToast('Lütfen kullanıcı adı girin!', 'error');
        return;
    }
    
    username = name;
    saveUsernameToStorage(username);
    showScreen('join-lobby-screen');
}

function joinLobby() {
    const codeInput = document.getElementById('lobby-code-input');
    const code = codeInput.value.trim().toUpperCase();
    
    if (!code || code.length !== 6) {
        showToast('Geçerli bir lobby kodu girin!', 'error');
        return;
    }
    
    // Send to server (FiveM)
    if (window.fetch) {
        fetch(`https://${GetParentResourceName()}/joinLobby`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                lobbyCode: code
            })
        });
    } else {
        // Standalone mode
        const lobbyData = getFromLocalStorage('lobby_' + code);
        
        if (!lobbyData) {
            showToast('Lobby bulunamadı!', 'error');
            return;
        }
        
        if (lobbyData.status !== 'waiting') {
            showToast('Bu oyun zaten başlamış!', 'error');
            return;
        }
        
        if (lobbyData.players.length >= 15) {
            showToast('Lobby dolu!', 'error');
            return;
        }
        
        lobbyData.players.push({name: username, ready: false, isHost: false});
        saveToLocalStorage('lobby_' + code, lobbyData);
        
        lobbyCode = code;
        showLobbyScreen(code);
    }
}

function showHowToPlay() {
    showScreen('how-to-play-screen');
}

function leaveLobby() {
    showMainMenu();
    lobbyCode = '';
}

function backToMenu() {
    showMainMenu();
    gameData = null;
    currentRole = null;
    currentPhase = null;
    hasVoted = false;
    selectedTarget = null;
    
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// Lobby Functions
function showLobbyScreen(code) {
    lobbyCode = code;
    document.getElementById('lobby-code-text').textContent = code;
    showScreen('lobby-screen');
    updateLobbyDisplay();
}

function updateLobbyDisplay() {
    if (!lobbyCode) return;
    
    const lobbyData = getFromLocalStorage('lobby_' + lobbyCode);
    if (!lobbyData) return;
    
    const playersList = document.getElementById('players-list');
    const playerCount = document.getElementById('player-count');
    const startBtn = document.getElementById('start-btn');
    
    playerCount.textContent = lobbyData.players.length;
    
    // Clear and rebuild players list
    playersList.innerHTML = '';
    
    lobbyData.players.forEach(player => {
        const playerItem = document.createElement('div');
        playerItem.className = 'player-item';
        
        if (player.ready) {
            playerItem.classList.add('ready');
        }
        
        if (player.isHost) {
            playerItem.classList.add('host');
        }
        
        playerItem.innerHTML = `
            <div class="player-info">
                <div class="player-avatar">${player.name.charAt(0).toUpperCase()}</div>
                <span class="player-name">${player.name}</span>
            </div>
            <div class="player-status">
                ${player.isHost ? '<span class="badge host">HOST</span>' : ''}
                ${player.ready ? '<span class="badge ready">HAZIR</span>' : ''}
            </div>
        `;
        
        playersList.appendChild(playerItem);
    });
    
    // Show start button only for host
    const isHost = lobbyData.players.find(p => p.name === username)?.isHost;
    if (isHost) {
        startBtn.style.display = 'block';
        startBtn.disabled = lobbyData.players.length < 5;
    } else {
        startBtn.style.display = 'none';
    }
}

function toggleReady() {
    const readyBtn = document.getElementById('ready-btn');
    const isReady = readyBtn.classList.toggle('ready');
    
    // Update local storage
    const lobbyData = getFromLocalStorage('lobby_' + lobbyCode);
    if (lobbyData) {
        const player = lobbyData.players.find(p => p.name === username);
        if (player) {
            player.ready = isReady;
            saveToLocalStorage('lobby_' + lobbyCode, lobbyData);
            updateLobbyDisplay();
        }
    }
    
    // Send to server (FiveM)
    if (window.fetch) {
        fetch(`https://${GetParentResourceName()}/setReady`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ready: isReady
            })
        });
    }
    
    readyBtn.innerHTML = isReady 
        ? '<span class="icon">✓</span> Hazır' 
        : '<span class="icon">✓</span> Hazır';
}

function startGame() {
    const lobbyData = getFromLocalStorage('lobby_' + lobbyCode);
    
    if (!lobbyData) {
        showToast('Lobby bulunamadı!', 'error');
        return;
    }
    
    if (lobbyData.players.length < 5) {
        showToast('Minimum 5 oyuncu gerekli!', 'error');
        return;
    }
    
    // Send to server (FiveM)
    if (window.fetch) {
        fetch(`https://${GetParentResourceName()}/startGame`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });
    } else {
        // Standalone mode - assign roles locally
        const roles = assignRoles(lobbyData.players);
        const myRole = roles.find(r => r.name === username);
        
        gameData = {
            players: lobbyData.players,
            roles: roles,
            alive: lobbyData.players.map(p => p.name),
            dead: [],
            phase: 'night',
            round: 1
        };
        
        saveToLocalStorage('game_' + lobbyCode, gameData);
        startGameScreen(myRole);
    }
}

// Game Functions
function startGameScreen(role) {
    currentRole = role;
    showScreen('game-screen');
    
    // Set role card
    const roleCard = document.getElementById('role-card');
    const roleIcon = document.getElementById('role-icon');
    const roleName = document.getElementById('role-name');
    const roleDesc = document.getElementById('role-description');
    
    roleCard.className = 'role-card ' + role.team;
    
    const roleInfo = getRoleInfo(role.role);
    roleIcon.textContent = roleInfo.icon;
    roleName.textContent = role.role;
    roleDesc.textContent = roleInfo.description;
    
    // Start first night phase
    setTimeout(() => {
        changePhase('night', 1, 30);
    }, 3000);
}

function getRoleInfo(roleName) {
    const roles = {
        'Katil': {
            icon: '🔪',
            description: 'Her gece bir köylüyü öldür. Amacın köylülerin sayısını azaltmak ve çoğunluğu ele geçirmek.'
        },
        'Dedektif': {
            icon: '🕵️',
            description: 'Her gece bir oyuncuyu araştırabilirsin ve rolünü öğrenebilirsin.'
        },
        'Doktor': {
            icon: '💉',
            description: 'Her gece bir oyuncuyu koruyabilirsin. Eğer o kişi katil tarafından hedef alınırsa ölmez.'
        },
        'Köylü': {
            icon: '👨‍🌾',
            description: 'Özel bir gücün yok. Gündüz tartışmalarda katilleri bulmaya çalış!'
        }
    };
    
    return roles[roleName] || roles['Köylü'];
}

function changePhase(phase, round, duration) {
    currentPhase = phase;
    selectedTarget = null;
    hasVoted = false;
    
    // Update header
    const phaseIcon = document.getElementById('phase-icon');
    const phaseText = document.getElementById('phase-text');
    const roundNumber = document.getElementById('round-number');
    
    roundNumber.textContent = round;
    
    // Hide all phase contents
    document.querySelectorAll('.phase-content').forEach(content => {
        content.classList.remove('active');
    });
    
    if (phase === 'night') {
        phaseIcon.textContent = '🌙';
        phaseText.textContent = 'Gece';
        
        if (currentRole && (currentRole.role === 'Katil' || currentRole.role === 'Dedektif' || currentRole.role === 'Doktor')) {
            document.getElementById('night-content').classList.add('active');
            updateTargetList();
        }
    } else if (phase === 'discussion') {
        phaseIcon.textContent = '💬';
        phaseText.textContent = 'Tartışma';
        document.getElementById('discussion-content').classList.add('active');
        updateDiscussionPlayers();
    } else if (phase === 'voting') {
        phaseIcon.textContent = '🗳️';
        phaseText.textContent = 'Oylama';
        document.getElementById('voting-content').classList.add('active');
        updateVotingList();
    }
    
    startTimer(duration);
    updateAliveDeadCounter();
}

function updateTargetList() {
    const targetList = document.getElementById('target-list');
    targetList.innerHTML = '';
    
    if (!gameData) return;
    
    gameData.alive.forEach(playerName => {
        if (playerName === username) return; // Can't target yourself
        
        const targetItem = document.createElement('div');
        targetItem.className = 'target-item';
        targetItem.onclick = () => selectTarget(playerName, targetItem);
        
        targetItem.innerHTML = `
            <span class="target-name">${playerName}</span>
            <span class="target-select">Seç</span>
        `;
        
        targetList.appendChild(targetItem);
    });
}

function selectTarget(target, element) {
    // Remove previous selection
    document.querySelectorAll('.target-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    element.classList.add('selected');
    selectedTarget = target;
    
    // Send night action
    const action = currentRole.role === 'Katil' ? 'kill' : 
                   currentRole.role === 'Dedektif' ? 'investigate' : 'save';
    
    if (window.fetch) {
        fetch(`https://${GetParentResourceName()}/nightAction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: action,
                target: target
            })
        });
    }
    
    showToast(`${target} seçildi!`, 'success');
}

function updateDiscussionPlayers() {
    const playersGrid = document.getElementById('alive-players-discussion');
    playersGrid.innerHTML = '';
    
    if (!gameData) return;
    
    gameData.alive.forEach(playerName => {
        const playerCard = createPlayerCard(playerName, false);
        playersGrid.appendChild(playerCard);
    });
}

function updateVotingList() {
    const votingList = document.getElementById('voting-list');
    votingList.innerHTML = '';
    
    if (!gameData) return;
    
    gameData.alive.forEach(playerName => {
        const voteItem = document.createElement('div');
        voteItem.className = 'vote-item';
        voteItem.onclick = () => vote(playerName, voteItem);
        
        voteItem.innerHTML = `
            <span class="vote-name">${playerName}</span>
            <span class="vote-btn">Oy Ver</span>
        `;
        
        votingList.appendChild(voteItem);
    });
}

function vote(target, element) {
    if (hasVoted) {
        showToast('Zaten oy kullandın!', 'error');
        return;
    }
    
    // Remove previous selection
    document.querySelectorAll('.vote-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    element.classList.add('selected');
    hasVoted = true;
    
    if (window.fetch) {
        fetch(`https://${GetParentResourceName()}/vote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                targetId: target
            })
        });
    }
    
    showToast(`${target}'e oy verildi!`, 'success');
}

function createPlayerCard(playerName, isDead) {
    const card = document.createElement('div');
    card.className = 'player-card' + (isDead ? ' dead' : '');
    
    card.innerHTML = `
        <div class="player-card-avatar">${playerName.charAt(0).toUpperCase()}</div>
        <div class="player-card-name">${playerName}</div>
        ${isDead ? '<div style="color: #f5576c; font-size: 12px;">💀 Öldü</div>' : ''}
    `;
    
    return card;
}

function updateAliveDeadCounter() {
    if (!gameData) return;
    
    document.getElementById('alive-count').textContent = gameData.alive.length;
    document.getElementById('dead-count').textContent = gameData.dead.length;
}

function startTimer(duration) {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    let timeLeft = duration;
    const timerText = document.getElementById('timer-text');
    
    timerInterval = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerText.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        timeLeft--;
        
        if (timeLeft < 0) {
            clearInterval(timerInterval);
            // Phase will change from server
        }
    }, 1000);
}

function showGameEnd(winner, roles) {
    showScreen('game-end-screen');
    
    const winnerIcon = document.getElementById('winner-icon');
    const winnerText = document.getElementById('winner-text');
    const rolesList = document.getElementById('roles-list');
    
    if (winner === 'village') {
        winnerIcon.textContent = '👨‍🌾';
        winnerText.textContent = 'Köylüler Kazandı!';
    } else {
        winnerIcon.textContent = '🔪';
        winnerText.textContent = 'Katiller Kazandı!';
    }
    
    rolesList.innerHTML = '';
    
    roles.forEach(roleData => {
        const roleItem = document.createElement('div');
        roleItem.className = 'role-reveal-item';
        
        roleItem.innerHTML = `
            <span class="role-reveal-name">${roleData.name}</span>
            <span class="role-reveal-role ${roleData.team}">${roleData.role}</span>
        `;
        
        rolesList.appendChild(roleItem);
    });
}

// Utility: Generate Lobby Code
function generateLobbyCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Utility: Assign Roles
function assignRoles(players) {
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const totalPlayers = shuffled.length;
    const killerCount = Math.max(1, Math.floor(totalPlayers / 5));
    
    const roles = [];
    let index = 0;
    
    // Assign Killers
    for (let i = 0; i < killerCount; i++) {
        roles.push({
            name: shuffled[index].name,
            role: 'Katil',
            team: 'mafia'
        });
        index++;
    }
    
    // Assign Detective
    if (totalPlayers >= 6) {
        roles.push({
            name: shuffled[index].name,
            role: 'Dedektif',
            team: 'village'
        });
        index++;
    }
    
    // Assign Doctor
    if (totalPlayers >= 8) {
        roles.push({
            name: shuffled[index].name,
            role: 'Doktor',
            team: 'village'
        });
        index++;
    }
    
    // Rest are Villagers
    for (let i = index; i < shuffled.length; i++) {
        roles.push({
            name: shuffled[i].name,
            role: 'Köylü',
            team: 'village'
        });
    }
    
    return roles;
}

// FiveM NUI Message Handler
window.addEventListener('message', (event) => {
    const data = event.data;
    
    if (data.type === 'open') {
        document.getElementById('app').classList.remove('hidden');
        showMainMenu();
    } else if (data.type === 'close') {
        document.getElementById('app').classList.add('hidden');
    } else if (data.type === 'lobbyCreated') {
        showLobbyScreen(data.lobbyCode);
        showToast('Lobby oluşturuldu!', 'success');
    } else if (data.type === 'updateLobby') {
        // Update lobby from server
        if (data.lobby) {
            saveToLocalStorage('lobby_' + lobbyCode, data.lobby);
            updateLobbyDisplay();
        }
    } else if (data.type === 'gameStarted') {
        startGameScreen(data.data);
    } else if (data.type === 'phaseChange') {
        changePhase(data.data.phase, data.data.round, data.data.duration);
    } else if (data.type === 'playerExecuted') {
        showToast(`${data.data.playerName} idam edildi! (${data.data.role})`, 'error');
        
        // Update game data
        if (gameData) {
            gameData.alive = gameData.alive.filter(p => p !== data.data.playerName);
            gameData.dead.push(data.data.playerName);
            updateAliveDeadCounter();
        }
    } else if (data.type === 'gameEnded') {
        showGameEnd(data.data.winner, data.data.roles);
    } else if (data.type === 'voteUpdate') {
        document.getElementById('vote-count').textContent = data.count;
    } else if (data.type === 'error') {
        showToast(data.message, 'error');
    }
});

// Close on ESC key
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        if (window.fetch) {
            fetch(`https://${GetParentResourceName()}/close`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });
        }
        document.getElementById('app').classList.add('hidden');
    }
});

// Initialize on page load (for GitHub Pages standalone)
window.addEventListener('DOMContentLoaded', () => {
    // If not in FiveM, show app immediately
    if (!window.GetParentResourceName) {
        document.getElementById('app').classList.remove('hidden');
        showMainMenu();
    }
});

// Helper function for FiveM
function GetParentResourceName() {
    if (window.GetParentResourceName) {
        return window.GetParentResourceName();
    }
    return 'katilkim';
}
