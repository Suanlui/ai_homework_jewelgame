class CandyCrushGame {
    constructor() {
        this.board = [];
        this.boardSize = 8;
        this.score = 0;
        this.level = 1;
        this.maxLevel = 28;
        this.timeLeft = 60;
        this.targetScore = 600;
        this.selectedCandy = null;
        this.comboCount = 0;
        this.gameRunning = false;
        this.isProcessing = false;
        this.rainbowCandiesCollected = 0;
        this.rainbowBonusTarget = 0;
        
        // Candy types
        this.candyTypes = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
        
        // Timer
        this.timerInterval = null;
        
        // Audio context for sounds
        this.audioContext = null;
        this.initAudio();
        
        // Initialize game
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.showRulesPage();
    }
    
    initAudio() {
        try {
            const AudioContextClass = window.AudioContext || window['webkitAudioContext'];
            if (AudioContextClass) {
                this.audioContext = new AudioContextClass();
            }
        } catch (error) {
            console.log('Audio not supported:', error);
        }
    }
    
    playSound(type) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        switch(type) {
            case 'match':
                oscillator.frequency.value = 523; // C5
                gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                break;
            case 'swap':
                oscillator.frequency.value = 330; // E4
                gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                break;
            case 'combo':
                oscillator.frequency.value = 659; // E5
                gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
                break;
            case 'levelup':
                oscillator.frequency.value = 784; // G5
                gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.6);
                break;
            case 'gameover':
                oscillator.frequency.value = 196; // G3
                gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1.0);
                break;
        }
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 1.0);
    }
    
    bindEvents() {
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('restartButton').addEventListener('click', () => this.restartGame());
        document.getElementById('nextLevelButton').addEventListener('click', () => this.nextLevel());
        document.getElementById('playAgainButton').addEventListener('click', () => this.restartGame());
    }
    
    showRulesPage() {
        document.getElementById('rulesPage').style.display = 'flex';
        document.getElementById('gamePage').style.display = 'none';
    }
    
    hideRulesPage() {
        document.getElementById('rulesPage').style.display = 'none';
        document.getElementById('gamePage').style.display = 'block';
    }
    
    startGame() {
        this.hideRulesPage();
        this.resetGame();
        this.setRainbowBonusTarget();
        this.createBoard();
        this.renderBoard();
        this.updateUI();
        this.startTimer();
        this.gameRunning = true;
    }
    
    setRainbowBonusTarget() {
        this.rainbowBonusTarget = this.level; // Level 1: 1 rainbow, Level 2: 2 rainbows, etc.
    }
    
    resetGame() {
        this.score = 0;
        this.level = 1;
        this.timeLeft = 60;
        this.targetScore = 600;
        this.comboCount = 0;
        this.selectedCandy = null;
        this.isProcessing = false;
        this.gameRunning = false;
        this.rainbowCandiesCollected = 0;
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }
    
    createBoard() {
        this.board = [];
        for (let row = 0; row < this.boardSize; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.boardSize; col++) {
                this.board[row][col] = this.getRandomCandy();
            }
        }
        
        // Remove initial matches
        this.removeInitialMatches();
    }
    
    getRandomCandy() {
        return {
            type: this.candyTypes[Math.floor(Math.random() * this.candyTypes.length)],
            special: null
        };
    }
    
    removeInitialMatches() {
        let hasMatches = true;
        let attempts = 0;
        
        while (hasMatches && attempts < 100) {
            hasMatches = false;
            for (let row = 0; row < this.boardSize; row++) {
                for (let col = 0; col < this.boardSize; col++) {
                    if (this.hasMatchAt(row, col)) {
                        this.board[row][col] = this.getRandomCandy();
                        hasMatches = true;
                    }
                }
            }
            attempts++;
        }
    }
    
    hasMatchAt(row, col) {
        const candy = this.board[row][col];
        if (!candy) return false;
        
        // Check horizontal
        let horizontalCount = 1;
        // Left
        for (let c = col - 1; c >= 0; c--) {
            if (this.board[row][c] && (this.board[row][c].type === candy.type || 
                candy.type === 'rainbow' || this.board[row][c].type === 'rainbow')) {
                horizontalCount++;
            } else break;
        }
        // Right
        for (let c = col + 1; c < this.boardSize; c++) {
            if (this.board[row][c] && (this.board[row][c].type === candy.type || 
                candy.type === 'rainbow' || this.board[row][c].type === 'rainbow')) {
                horizontalCount++;
            } else break;
        }
        
        // Check vertical
        let verticalCount = 1;
        // Up
        for (let r = row - 1; r >= 0; r--) {
            if (this.board[r][col] && (this.board[r][col].type === candy.type || 
                candy.type === 'rainbow' || this.board[r][col].type === 'rainbow')) {
                verticalCount++;
            } else break;
        }
        // Down
        for (let r = row + 1; r < this.boardSize; r++) {
            if (this.board[r][col] && (this.board[r][col].type === candy.type || 
                candy.type === 'rainbow' || this.board[r][col].type === 'rainbow')) {
                verticalCount++;
            } else break;
        }
        
        return horizontalCount >= 3 || verticalCount >= 3;
    }
    
    renderBoard() {
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.innerHTML = '';
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const candy = this.board[row][col];
                if (!candy) continue;
                
                const candyElement = document.createElement('div');
                candyElement.className = `candy ${candy.type}${candy.special ? ' ' + candy.special : ''}`;
                candyElement.dataset.row = row;
                candyElement.dataset.col = col;
                candyElement.innerHTML = '<span></span>';
                
                // Add event listeners
                candyElement.addEventListener('click', (e) => this.handleCandyClick(e, row, col));
                candyElement.addEventListener('mousedown', (e) => this.handleMouseDown(e, row, col));
                candyElement.addEventListener('mouseup', (e) => this.handleMouseUp(e, row, col));
                candyElement.addEventListener('mouseover', (e) => this.handleMouseOver(e, row, col));
                
                gameBoard.appendChild(candyElement);
            }
        }
    }
    
    handleCandyClick(_e, row, col) {
        if (!this.gameRunning || this.isProcessing) return;
        
        if (!this.selectedCandy) {
            this.selectCandy(row, col);
        } else {
            if (this.selectedCandy.row === row && this.selectedCandy.col === col) {
                this.deselectCandy();
            } else if (this.isAdjacent(this.selectedCandy.row, this.selectedCandy.col, row, col)) {
                this.swapCandies(this.selectedCandy.row, this.selectedCandy.col, row, col);
            } else {
                this.deselectCandy();
                this.selectCandy(row, col);
            }
        }
    }
    
    handleMouseDown(e, row, col) {
        if (!this.gameRunning || this.isProcessing) return;
        this.dragStart = { row, col };
        e.target.classList.add('dragging');
    }
    
    handleMouseUp(_e, row, col) {
        if (!this.dragStart) return;
        
        const draggedElement = document.querySelector('.dragging');
        if (draggedElement) draggedElement.classList.remove('dragging');
        
        if (this.dragStart.row !== row || this.dragStart.col !== col) {
            if (this.isAdjacent(this.dragStart.row, this.dragStart.col, row, col)) {
                this.swapCandies(this.dragStart.row, this.dragStart.col, row, col);
            }
        }
        
        this.dragStart = null;
    }
    
    handleMouseOver(_e, row, col) {
        if (this.dragStart && (this.dragStart.row !== row || this.dragStart.col !== col)) {
            // Visual feedback for drag and drop
        }
    }
    
    selectCandy(row, col) {
        this.deselectCandy();
        this.selectedCandy = { row, col };
        const element = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (element) element.classList.add('selected');
    }
    
    deselectCandy() {
        if (this.selectedCandy) {
            const element = document.querySelector(`[data-row="${this.selectedCandy.row}"][data-col="${this.selectedCandy.col}"]`);
            if (element) element.classList.remove('selected');
            this.selectedCandy = null;
        }
    }
    
    isAdjacent(row1, col1, row2, col2) {
        const rowDiff = Math.abs(row1 - row2);
        const colDiff = Math.abs(col1 - col2);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }
    
    swapCandies(row1, col1, row2, col2) {
        // Swap candies
        const temp = this.board[row1][col1];
        this.board[row1][col1] = this.board[row2][col2];
        this.board[row2][col2] = temp;
        
        this.playSound('swap');
        this.deselectCandy();
        this.renderBoard();
        
        // Check for matches
        setTimeout(() => {
            this.processMatches();
        }, 200);
    }
    
    processMatches() {
        if (this.isProcessing) return;
        this.isProcessing = true;
        
        const matches = this.findMatches();
        
        if (matches.length > 0) {
            this.comboCount++;
            this.removeMatches(matches);
            this.updateScore(matches.length);
            this.playSound(this.comboCount > 1 ? 'combo' : 'match');
            
            // Create special candies for 4+ matches
            this.createSpecialCandies(matches);
            
            setTimeout(() => {
                this.dropCandies();
                this.fillEmptySpaces();
                this.renderBoard();
                
                setTimeout(() => {
                    this.isProcessing = false;
                    this.processMatches(); // Check for chain reactions
                }, 300);
            }, 400);
        } else {
            this.comboCount = 0;
            this.isProcessing = false;
            this.updateComboDisplay();
            this.checkLevelComplete();
        }
    }
    
    findMatches() {
        const matches = [];
        const visited = new Set();
        
        // Check horizontal matches
        for (let row = 0; row < this.boardSize; row++) {
            let count = 1;
            let currentType = this.board[row][0] ? this.board[row][0].type : null;
            
            for (let col = 1; col < this.boardSize; col++) {
                const candy = this.board[row][col];
                
                if (candy && (candy.type === currentType || currentType === 'rainbow' || candy.type === 'rainbow')) {
                    count++;
                } else {
                    if (count >= 3 && currentType) {
                        for (let k = col - count; k < col; k++) {
                            const key = `${row}-${k}`;
                            if (!visited.has(key)) {
                                matches.push({ row, col: k });
                                visited.add(key);
                            }
                        }
                    }
                    count = 1;
                    currentType = candy ? candy.type : null;
                }
            }
            
            if (count >= 3 && currentType) {
                for (let k = this.boardSize - count; k < this.boardSize; k++) {
                    const key = `${row}-${k}`;
                    if (!visited.has(key)) {
                        matches.push({ row, col: k });
                        visited.add(key);
                    }
                }
            }
        }
        
        // Check vertical matches
        for (let col = 0; col < this.boardSize; col++) {
            let count = 1;
            let currentType = this.board[0][col] ? this.board[0][col].type : null;
            
            for (let row = 1; row < this.boardSize; row++) {
                const candy = this.board[row][col];
                
                if (candy && (candy.type === currentType || currentType === 'rainbow' || candy.type === 'rainbow')) {
                    count++;
                } else {
                    if (count >= 3 && currentType) {
                        for (let k = row - count; k < row; k++) {
                            const key = `${k}-${col}`;
                            if (!visited.has(key)) {
                                matches.push({ row: k, col });
                                visited.add(key);
                            }
                        }
                    }
                    count = 1;
                    currentType = candy ? candy.type : null;
                }
            }
            
            if (count >= 3 && currentType) {
                for (let k = this.boardSize - count; k < this.boardSize; k++) {
                    const key = `${k}-${col}`;
                    if (!visited.has(key)) {
                        matches.push({ row: k, col });
                        visited.add(key);
                    }
                }
            }
        }
        
        return matches;
    }
    
    removeMatches(matches) {
        let hasRainbow = false;
        
        matches.forEach(match => {
            const element = document.querySelector(`[data-row="${match.row}"][data-col="${match.col}"]`);
            const candy = this.board[match.row][match.col];
            
            // Check if this match includes a rainbow candy
            if (candy && candy.special === 'rainbow') {
                this.rainbowCandiesCollected++;
                this.score += 50; // Bonus points for rainbow candy
                this.playSound('combo'); // Special sound for rainbow
                hasRainbow = true;
            }
            
            if (element) {
                element.classList.add('matched');
            }
            this.board[match.row][match.col] = null;
        });
        
        // Store rainbow multiplier for score calculation
        this.currentMatchHasRainbow = hasRainbow;
    }
    
    createSpecialCandies(matches) {
        if (matches.length >= 4) {
            // Create rainbow candy
            const firstMatch = matches[0];
            this.board[firstMatch.row][firstMatch.col] = {
                type: 'rainbow',
                special: 'rainbow'
            };
        }
    }
    
    updateScore(matchCount) {
        const baseScore = matchCount * 10;
        const comboBonus = Math.max(0, (this.comboCount - 1) * 15);
        const levelMultiplier = 1 + (this.level - 1) * 0.2;
        const rainbowMultiplier = this.currentMatchHasRainbow ? 1.5 : 1;
        
        const points = Math.floor((baseScore + comboBonus) * levelMultiplier * rainbowMultiplier);
        this.score += points;
        
        // Reset rainbow flag
        this.currentMatchHasRainbow = false;
        
        this.updateComboDisplay();
    }
    
    updateComboDisplay() {
        const comboDisplay = document.getElementById('comboDisplay');
        const comboCount = document.getElementById('comboCount');
        
        if (this.comboCount > 1) {
            comboCount.textContent = this.comboCount;
            comboDisplay.style.display = 'block';
        } else {
            comboDisplay.style.display = 'none';
        }
    }
    
    dropCandies() {
        for (let col = 0; col < this.boardSize; col++) {
            let writePos = this.boardSize - 1;
            for (let row = this.boardSize - 1; row >= 0; row--) {
                if (this.board[row][col] !== null) {
                    if (writePos !== row) {
                        this.board[writePos][col] = this.board[row][col];
                        this.board[row][col] = null;
                    }
                    writePos--;
                }
            }
        }
    }
    
    fillEmptySpaces() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === null) {
                    this.board[row][col] = this.getRandomCandy();
                }
            }
        }
    }
    
    updateUI() {
        document.getElementById('levelDisplay').textContent = `${this.level}/28`;
        document.getElementById('scoreDisplay').textContent = this.score.toLocaleString();
        document.getElementById('targetDisplay').textContent = this.targetScore.toLocaleString();
        document.getElementById('timerDisplay').textContent = `${this.timeLeft}s`;
        document.getElementById('rainbowDisplay').textContent = `${this.rainbowCandiesCollected}/${this.rainbowBonusTarget}`;
        
        // Update progress bar
        const progress = Math.min((this.score / this.targetScore) * 100, 100);
        document.getElementById('progressFill').style.width = progress + '%';
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateUI();
            
            if (this.timeLeft <= 0) {
                this.gameOver();
            }
        }, 1000);
    }
    
    checkLevelComplete() {
        if (this.score >= this.targetScore && this.rainbowCandiesCollected >= this.rainbowBonusTarget) {
            this.levelComplete();
        }
    }
    
    levelComplete() {
        this.gameRunning = false;
        clearInterval(this.timerInterval);
        
        const timeBonus = this.timeLeft * 10;
        this.score += timeBonus;
        
        this.playSound('levelup');
        
        document.getElementById('levelScore').textContent = this.score.toLocaleString();
        document.getElementById('timeBonus').textContent = timeBonus.toLocaleString();
        document.getElementById('levelCompleteModal').style.display = 'flex';
    }
    
    nextLevel() {
        document.getElementById('levelCompleteModal').style.display = 'none';
        
        if (this.level >= this.maxLevel) {
            this.gameWon();
            return;
        }
        
        this.level++;
        this.timeLeft = 60;
        this.targetScore = 600 + (this.level * 2); // Level 1: 602, Level 2: 604, Level 3: 606, etc.
        this.comboCount = 0;
        this.rainbowCandiesCollected = 0;
        this.setRainbowBonusTarget();
        
        this.createBoard();
        this.renderBoard();
        this.updateUI();
        this.startTimer();
        this.gameRunning = true;
    }
    
    gameOver() {
        this.gameRunning = false;
        clearInterval(this.timerInterval);
        
        this.playSound('gameover');
        
        document.getElementById('finalLevel').textContent = this.level;
        document.getElementById('finalScore').textContent = this.score.toLocaleString();
        document.getElementById('gameOverModal').style.display = 'flex';
    }
    
    gameWon() {
        this.gameRunning = false;
        clearInterval(this.timerInterval);
        
        this.playSound('levelup');
        
        document.getElementById('victoryScore').textContent = this.score.toLocaleString();
        document.getElementById('victoryModal').style.display = 'flex';
    }
    
    restartGame() {
        // Hide all modals
        document.getElementById('gameOverModal').style.display = 'none';
        document.getElementById('levelCompleteModal').style.display = 'none';
        document.getElementById('victoryModal').style.display = 'none';
        
        // Reset and show rules
        this.resetGame();
        this.showRulesPage();
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new CandyCrushGame();
});