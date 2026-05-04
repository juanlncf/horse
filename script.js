class HorseRace {
    constructor() {
        this.horses = [];
        this.raceInProgress = false;
        this.raceFinished = false;
        this.finishOrder = [];
        this.trackFinishLineX = 0;
        this.startTime = 0;
        this.winner = null;
        this.countdownEnabled = true;
        this.countdownIntervalId = null;
        this.sparkleGenerationLoopId = null;
        
        // Game mode properties
        this.gameMode = false;
        this.playerMoney = 50;
        this.initialMoneySet = false; // Tracks if initial money has been confirmed
        this.playerBoosts = [];
        this.playerBet = 0;
        this.currentPrizePool = 0;
        this.totalPrizePool = 0;
        this.separatePrizePool = 0; // Initial house pool starts at 0
        this.aiPlayers = [];
        this.isSpectating = false; // Player is spectating this CURRENT race
        this.leaderboard = []; // For take-home earnings
        this.lastRaceWinnerName = null; // To highlight winner in player list

        // jm
        this.standings = []
        
        this.colorPalette = [
            { name: 'Black', hex: '#000000' },
            { name: 'Charcoal', hex: '#36454F' },
            { name: 'Grey', hex: '#808080' },
            { name: 'Light Grey', hex: '#D3D3D3' },
            { name: 'White', hex: '#FFFFFF' },
            { name: 'Brown', hex: '#8B4513' },
            { name: 'Tan', hex: '#D2B48C' },
            { name: 'Beige', hex: '#F5F5DC' }
        ];

        // AI Names pool
        this.aiNames = [
            'Cannibal Coruthers', 
            'Huband of the Year',
            'Grandma\'s Special Sexy Little Baby Boy',
            'A Gazebo',
            '"I Do Declare"', 
            'Goin\' to get a pack of cigarettes',
            'HORSE.PNG',
            '2 Guys in a Horse Costume',
            'The Largest Fish You\'ve Ever Seen!',
            '10,000 Horse Flies',
            'Me, I\'m in the race!',
            'A Very Dead Horse',
            'Mama\'s Youngest Boy, Trevor (25,M)',
            'It\'s... Natassia Running Full Speed (18MPH)',
            'Hot King Prawn',
            'Horsedog',
        ];
        
        this.initElements();
        this.bindEvents();
        this.generateAIPlayers(true); // Initial AI players setup
        this.updateLeaderboardDisplay(); // Initialize leaderboard display
    }
    
    initElements() {
        this.horseNamesInput = document.getElementById('horseNames');
        this.generateBtn = document.getElementById('generateRace');
        this.startBtn = document.getElementById('startRace');
        this.resetBtn = document.getElementById('resetRace'); // This refers to the button in the default tab.
        this.raceTrack = document.getElementById('raceTrack');
        this.resultsDiv = document.getElementById('results');
        this.countdownDisplay = document.getElementById('countdownDisplay');
        this.countdownToggle = document.getElementById('countdownToggle');

        // jm
        this.liveUpdate = document.querySelector('.live-update')

        // Tab elements
        this.tabButtons = document.querySelectorAll('.tab-button');
        this.tabContents = document.querySelectorAll('.tab-content');
        
        // Game elements
        this.playerHorseNameInput = document.getElementById('playerHorseName');
        this.playerBodyColorSelect = document.getElementById('playerBodyColor');
        this.playerHairColorSelect = document.getElementById('playerHairColor');
        this.playerMoneyInput = document.getElementById('playerMoney');
        this.playerMoneyDisplay = document.getElementById('playerMoneyDisplay');
        this.randomMoneyBtn = document.getElementById('randomMoney');
        this.confirmMoneyBtn = document.getElementById('confirmMoney'); // NEW
        this.betAmountInput = document.getElementById('betAmount');
        this.placeBetBtn = document.getElementById('placeBet');
        this.playGameBtn = document.getElementById('playGame');
        this.spectateGameBtn = document.getElementById('spectateGame');
        this.resetGameBtn = document.getElementById('resetGame');
        this.currentPrizePoolDisplay = document.getElementById('currentPrizePool');
        this.totalPrizePoolDisplay = document.getElementById('totalPrizePool');
        this.playersListDiv = document.getElementById('playersList');
        this.activeBoostsDisplay = document.getElementById('activeBoostsDisplay');
        this.leaderboardListDiv = document.getElementById('leaderboardList'); // NEW

        // Boost buttons
        this.goldBoostBtn = document.getElementById('goldBoost');
        this.diamondBoostBtn = document.getElementById('diamondBoost');
        this.rubyBoostBtn = document.getElementById('rubyBoost');

        this.countdownToggle.checked = this.countdownEnabled;
        this.updateMoneyDisplay();
        this.updatePlayerMoneyControlsState(); // NEW: Set initial state of money controls
    }
    
    bindEvents() {
        this.generateBtn.addEventListener('click', () => this.generateRace());
        this.startBtn.addEventListener('click', () => this.startRace());
        this.resetBtn.addEventListener('click', () => {
            // In game mode, the resetBtn has been removed from HTML.
            // This logic now primarily applies to the default tab's reset button.
            if (!this.gameMode) { // Only execute for default mode
                this.resetRaceInternal();
            }
            // For game mode, reset is implicit when starting a new race or clicking resetGameBtn.
            // handleGameRaceEnd will enable playGameBtn/spectateGameBtn/resetGameBtn
            // And generateGameRace will handle the visual 'reset' of horses.
        });
        this.countdownToggle.addEventListener('change', (e) => {
            this.countdownEnabled = e.target.checked;
        });
        
        // Game events
        this.randomMoneyBtn.addEventListener('click', () => {
            if (!this.initialMoneySet) { // Only allow if initial money not set
                this.randomizeMoney();
                this.updateMoneyDisplay(); // Update display and boost button states
            }
        });
        this.playerMoneyInput.addEventListener('input', () => {
            if (!this.initialMoneySet) { // Only allow if initial money not set
                this.updateMoneyDisplay(); // Update display and boost button states
            }
        });
        this.confirmMoneyBtn.addEventListener('click', () => this.confirmInitialMoney()); // NEW
        this.placeBetBtn.addEventListener('click', () => this.placeBet());
        this.playGameBtn.addEventListener('click', () => this.startGame(false));
        this.spectateGameBtn.addEventListener('click', () => this.startGame(true));
        this.resetGameBtn.addEventListener('click', () => this.resetGame()); // This is for full game reset
        
        // Boost events
        this.goldBoostBtn.addEventListener('click', () => this.buyBoost('gold', 1));
        this.diamondBoostBtn.addEventListener('click', () => this.buyBoost('diamond', 2));
        this.rubyBoostBtn.addEventListener('click', () => this.buyBoost('ruby', 5));
    }

    randomizeMoney() {
        if (this.initialMoneySet) return; // NEW: Prevent changing if initial money already set

        const rand = Math.random();
        let money;
        
        if (rand < 0.6) { // 60% chance for $50-$100
            money = Math.floor(Math.random() * 51) + 50;
        } else if (rand < 0.9) { // 30% chance for $5-$49
            money = Math.floor(Math.random() * 45) + 5;
        } else { // 10% chance for $101-$200
            money = Math.floor(Math.random() * 100) + 101;
        }
        
        this.playerMoney = money;
        this.playerMoneyInput.value = money;
        // updateMoneyDisplay() is called by the event listener now
    }

    updateMoneyDisplay() {
        this.playerMoney = parseInt(this.playerMoneyInput.value) || 0;
        this.playerMoneyDisplay.textContent = this.playerMoney;
        this.updateBoostButtons(); // Always update boost buttons based on current money
    }

    // NEW: Function to control player money input and random button
    updatePlayerMoneyControlsState() {
        this.playerMoneyInput.disabled = this.initialMoneySet;
        this.randomMoneyBtn.disabled = this.initialMoneySet;
        this.confirmMoneyBtn.disabled = this.initialMoneySet; // NEW: Disable confirm button too

        // Initially, and after a full game reset, placeBetBtn and boosts are disabled
        // until the initial money is confirmed (by starting a game).
        if (!this.initialMoneySet) {
            this.placeBetBtn.disabled = true;
            this.goldBoostBtn.disabled = true;
            this.diamondBoostBtn.disabled = true;
            this.rubyBoostBtn.disabled = true;
        } else {
            // Once initial money is set, these are enabled/disabled by other logic
            // (e.g., placeBet() disables placeBetBtn, updateBoostButtons() enables/disables boosts based on money).
            // No direct modification here, as their state will be managed by updateBoostButtons and placeBet logic.
        }
    }

    // NEW: Method to confirm initial money amount
    confirmInitialMoney() {
        if (this.initialMoneySet) return; // Already confirmed

        // Ensure money is within bounds if manually set
        let currentMoney = parseInt(this.playerMoneyInput.value);
        if (isNaN(currentMoney) || currentMoney < parseInt(this.playerMoneyInput.min)) {
            currentMoney = parseInt(this.playerMoneyInput.min); // Default to min if invalid
        } else if (currentMoney > parseInt(this.playerMoneyInput.max)) {
            currentMoney = parseInt(this.playerMoneyInput.max); // Cap to max if invalid
        }
        this.playerMoney = currentMoney;
        this.playerMoneyInput.value = currentMoney; // Update input with potentially clamped value

        this.initialMoneySet = true;
        this.updatePlayerMoneyControlsState(); // Disable input, random, and confirm buttons
        this.updateMoneyDisplay(); // Update display, which in turn calls updateBoostButtons

        // Enable placeBetBtn if player has sufficient money after confirmation
        this.placeBetBtn.disabled = (this.playerMoney < parseInt(this.betAmountInput.min)); 
        alert(`Your initial money of $${this.playerMoney} has been set! You can now place bets or buy boosts.`);
    }

    updateBoostButtons() {
        // Disable boosts if: not in game mode, initial money not set, already placed a bet, or race is in progress
        const disableAllBoosts = !this.gameMode || !this.initialMoneySet || this.playerBet > 0 || this.raceInProgress;
        
        this.goldBoostBtn.disabled = disableAllBoosts || this.playerMoney < 1;
        this.diamondBoostBtn.disabled = disableAllBoosts || this.playerMoney < 2;
        this.rubyBoostBtn.disabled = disableAllBoosts || this.playerMoney < 5;
    }

    buyBoost(type, cost) {
        if (this.playerMoney >= cost) {
            // Remove existing boost of same type
            this.playerBoosts = this.playerBoosts.filter(boost => boost !== type);
            
            // Add new boost
            this.playerBoosts.push(type);
            this.playerMoney -= cost; // Deduct money for boost
            this.playerMoneyInput.value = this.playerMoney;
            this.updateMoneyDisplay();
            this.updateBoostDisplay();
        }
    }

    updateBoostDisplay() {
        if (this.playerBoosts.length === 0) {
            this.activeBoostsDisplay.textContent = 'None';
        } else {
            this.activeBoostsDisplay.textContent = this.playerBoosts.map(boost => 
                boost.charAt(0).toUpperCase() + boost.slice(1)
            ).join(', ');
        }
        
        // Update button states
        this.goldBoostBtn.classList.toggle('active', this.playerBoosts.includes('gold'));
        this.diamondBoostBtn.classList.toggle('active', this.playerBoosts.includes('diamond'));
        this.rubyBoostBtn.classList.toggle('active', this.playerBoosts.includes('ruby'));
    }

    placeBet() {
        if (!this.initialMoneySet) { // NEW: Prevent betting if money hasn't been confirmed yet
            alert('Please confirm your initial money amount first.'); // Changed alert message
            return;
        }
        if (this.playerBet > 0) return; // Already placed a bet for this race
        if (this.raceInProgress) return; // Race already started

        const betAmount = parseInt(this.betAmountInput.value) || 0;
        if (betAmount >= 2 && betAmount <= 10 && betAmount <= this.playerMoney) {
            this.playerBet = betAmount;
            this.playerMoney -= betAmount; // Deduct money for bet
            this.playerMoneyInput.value = this.playerMoney; // Update input field
            this.updateMoneyDisplay(); // Update display and button states (calls updateBoostButtons)
            
            this.placeBetBtn.textContent = `Bet Placed: $${betAmount}`;
            this.placeBetBtn.disabled = true; // Disable after placing bet for current race
            this.updateBoostButtons(); // NEW: Disable all boost buttons after bet is placed
        } else if (betAmount > this.playerMoney) {
            alert('Not enough money for that bet!');
        } else {
            alert('Bet amount must be between $2 and $10.');
        }
    }

    // NEW: Method to collect all players who intend to bet in the current race
    getBettingParticipants() {
        const participants = [];
        // Add player horse if they are NOT spectating and placed a bet
        if (!this.isSpectating && this.playerBet > 0) {
            const playerName = this.playerHorseNameInput.value || 'Player';
            const boostSuffix = this.playerBoosts.length > 0 ? ` (${this.playerBoosts[0]})` : '';
            participants.push({
                name: playerName + boostSuffix,
                isPlayer: true,
                boosts: this.playerBoosts
            });
        }
        // Add AI horses - filter by isActive and NOT spectating for THIS race and have a bet
        this.aiPlayers.forEach(ai => {
            if (!ai.hasLeft && !ai.isSpectatingCurrentRace && ai.bet > 0) {
                const boostSuffix = ai.boosts.length > 0 ? ` (${ai.boosts[0]})` : '';
                participants.push({
                    name: ai.name + boostSuffix,
                    isPlayer: false,
                    aiData: ai,
                    boosts: ai.boosts
                });
            }
        });
        return participants;
    }

    // NEW: Function to add a single AI player that is forced to bet their first race
    addForcedBettingAI() {
        const usedNames = new Set(this.aiPlayers.map(ai => ai.name));
        const availableNames = this.aiNames.filter(name => !usedNames.has(name));

        if (availableNames.length > 0) {
            const name = availableNames[Math.floor(Math.random() * availableNames.length)];
            const money = Math.floor(Math.random() * 100) + 50; // New AIs get more money for better betting chances

            const newAI = {
                name: name,
                money: money,
                originalMoney: money,
                bet: 0, 
                wins: 0,
                losses: 0,
                isActive: true,
                isSpectatingCurrentRace: false, // Force them to play their first race
                hasLeft: false,
                riskLevel: Math.random(),
                horseSpeed: 1.8 + Math.random() * 0.2,
                boosts: [],
                isNew: true // Ensure they bet their first race via AI strategy
            };
            this.aiPlayers.push(newAI);
            return true; // Successfully added
        }
        return false; // No more names available
    }

    generateAIPlayers(isInitial = false) {
        // Filter out AIs that have permanently left
        this.aiPlayers = this.aiPlayers.filter(ai => !ai.hasLeft);
        
        const targetAIPlayerCount = Math.floor(Math.random() * 5) + 4; // Target 4-8 AI players initially, or to fill gaps later.

        // Only add new AIs if current pool is too small, or if it's initial setup.
        // Don't add if we're already at or above target, or close to overall max (e.g., 12)
        while (this.aiPlayers.length < targetAIPlayerCount && this.aiPlayers.length < 12) { // Max 12 AIs in total pool
            if (!this.addForcedBettingAI()) { // Use the new helper for consistent AI creation
                console.warn("Could not add more unique AI players during general generation.");
                break;
            }
        }
    }

    updateAIStrategies() {
        const currentActiveAIPlayers = this.aiPlayers.filter(ai => !ai.hasLeft); 
        this.aiPlayers = []; // Rebuild the aiPlayers list based on new decisions

        // Filter out existing players who might leave or spectate
        currentActiveAIPlayers.forEach(ai => {
            // Reset spectating status for the new race cycle
            ai.isSpectatingCurrentRace = false;
            ai.bet = 0; // Reset bet
            ai.boosts = []; // Reset boosts

            // AI decision to LEAVE permanently (forced or voluntary)
            if (ai.money < 2) { // Forced out if insufficient funds
                ai.hasLeft = true;
                ai.isActive = false;
                this.addToLeaderboard(ai);
                return; // Skip further decisions for this AI as they are leaving
            }

            const takeHome = ai.money - ai.originalMoney;
            const profitRatio = ai.originalMoney > 0 ? takeHome / ai.originalMoney : (takeHome > 0 ? 1 : 0);
            
            let shouldLeaveVoluntarily = false;
            // Conditions for voluntary leaving:
            if (takeHome > 20 && Math.random() < 0.04) { // 4% chance if good absolute profit
                shouldLeaveVoluntarily = true;
            } else if (profitRatio > 0.3 && Math.random() < 0.08 && takeHome > 5) { // 8% chance if decent profit percentage and some profit
                shouldLeaveVoluntarily = true;
            }

            if (shouldLeaveVoluntarily) {
                ai.hasLeft = true;
                ai.isActive = false;
                this.addToLeaderboard(ai);
                return; // Skip further decisions for this AI as they are leaving
            }

            // New AIs must bet their first race, cannot spectate initially
            if (ai.isNew) {
                ai.isSpectatingCurrentRace = false; // Ensure new AIs are not spectating
                ai.isNew = false; // Mark them as no longer "new" after this decision cycle
            } else {
                // AI decision to SPECTATE for this race (only if not a new AI)
                const justLost = ai.losses > 0 && ai.losses >= ai.wins; 
                
                const shouldSpectate = (ai.money < 15 && Math.random() < 0.3) || // Low money, moderate chance to spectate
                                       (justLost && Math.random() < 0.2) || // Doing badly, smaller chance to spectate
                                       (Math.random() < 0.05); // Small random chance to spectate to avoid being too predictable

                if (shouldSpectate) {
                    ai.isSpectatingCurrentRace = true;
                }
            }

            // Decide if AI should buy boosts (only if not spectating)
            if (!ai.isSpectatingCurrentRace) {
                const shouldBuyBoost = Math.random() < (ai.riskLevel * 0.4); 

                if (shouldBuyBoost) {
                    // Prioritize higher boosts if money allows and risk level is high
                    if (ai.money >= 7 && ai.riskLevel > 0.7 && Math.random() < 0.2) {
                        ai.boosts.push('ruby');
                        ai.money -= 5;
                    } else if (ai.money >= 4 && ai.riskLevel > 0.5 && Math.random() < 0.4) {
                        ai.boosts.push('diamond');
                        ai.money -= 2;
                    } else if (ai.money >= 3 && Math.random() < 0.6) {
                        ai.boosts.push('gold');
                        ai.money -= 1;
                    }
                }
            }
            
            // Decide bet amount (only if not spectating)
            if (!ai.isSpectatingCurrentRace) {
                const minBet = 2;
                const maxBet = Math.min(10, ai.money);
                if (maxBet >= minBet) {
                    // AI bets based on risk level and current money
                    if (ai.riskLevel > 0.7 && ai.money > 20) { // High risk, good money -> bet higher
                        ai.bet = Math.floor(Math.random() * (maxBet - minBet + 1)) + minBet;
                    } else if (ai.riskLevel < 0.3 && ai.money > 10) { // Low risk, decent money -> bet lower
                        ai.bet = minBet;
                    } else { // Moderate risk
                        ai.bet = Math.floor(Math.random() * ((maxBet - minBet) / 2 + 1)) + minBet; // Tend to bet middle range
                    }
                    ai.money -= ai.bet; // Deduct money for bet
                } else {
                    ai.bet = 0; // Can't afford to bet
                    ai.isSpectatingCurrentRace = true; // Force spectate if cannot bet/play
                }
            }

            this.aiPlayers.push(ai); // Add this AI back to the list
        });

        // Ensure at most 8 players are betting
        let bettingPlayersCount = 0;
        if (!this.isSpectating && this.playerBet > 0) {
            bettingPlayersCount++;
        }
        bettingPlayersCount += this.aiPlayers.filter(ai => !ai.hasLeft && !ai.isSpectatingCurrentRace && ai.bet > 0).length;

        while (bettingPlayersCount > 8) {
            // Find an AI that is currently betting and is NOT a newly added AI
            const candidatesToSpectate = this.aiPlayers.filter(ai => !ai.hasLeft && !ai.isSpectatingCurrentRace && !ai.isNew);
            if (candidatesToSpectate.length > 0) {
                // Pick a random AI to force into spectating
                const aiToForceSpectate = candidatesToSpectate[Math.floor(Math.random() * candidatesToSpectate.length)];
                aiToForceSpectate.isSpectatingCurrentRace = true;
                aiToForceSpectate.money += aiToForceSpectate.bet; // Return bet money
                aiToForceSpectate.bet = 0;
                bettingPlayersCount--;
            } else {
                // This shouldn't happen if logic is sound, but as a safeguard
                console.warn("Could not find enough AIs to force spectate to meet max 8 players.");
                break; 
            }
        }
    }

    startGame(spectate) {
        if (!this.initialMoneySet) {
            alert('Please confirm your initial money amount before starting the game.');
            return;
        }

        this.lastRaceWinnerName = null; // Clear winner highlight from previous race
        this.isSpectating = spectate;

        // Player decision: If 'Play Game' is clicked but no bet, force spectate
        // This logic handles initial player choice vs. actual participation
        if (!spectate && this.playerBet === 0) {
            if (this.playerMoney >= parseInt(this.betAmountInput.min)) { // if they have money but didn't bet
                alert('You have not placed a bet, so you will be spectating this race.');
            } else { // they don't have enough money
                alert('You ran out of money and cannot place a bet, so you will be spectating this race.');
            }
            this.isSpectating = true;
        }
        
        // Disable game control buttons until race concludes
        this.playGameBtn.disabled = true;
        this.spectateGameBtn.disabled = true;
        this.resetGameBtn.disabled = true;
        this.resetBtn.disabled = true; // Reset button in default tab should be disabled
        this.placeBetBtn.disabled = true; // NEW: Disable place bet button once race starts
        this.updateBoostButtons(); // NEW: Disable boost buttons for the duration of the race

        // Update AI strategies for the current race *before* generating participants
        this.updateAIStrategies();
        // Ensure minimum player count *after* AIs have made their individual decisions
        this.maintainAIPlayerCount(); // This makes sure overall AI pool is healthy

        let currentBettingParticipants = this.getBettingParticipants();

        // Loop to ensure minimum 4 betting players
        let attempts = 0;
        const MAX_ADD_AI_ATTEMPTS = 5; // Prevent infinite loops if names run out or something
        while (currentBettingParticipants.length < 4 && attempts < MAX_ADD_AI_ATTEMPTS) {
            attempts++;
            alert(`Only ${currentBettingParticipants.length} player(s) placed a bet. Adding new AI players to meet the minimum of 4 active racers for this race.`);
            if (this.addForcedBettingAI()) { // Add an AI, which will be marked `isNew` and forced to bet
                this.updateAIStrategies(); // Re-evaluate strategies for newly added AIs
                currentBettingParticipants = this.getBettingParticipants(); // Recalculate participants
            } else {
                console.warn("Could not add more unique AI players to meet minimum betting requirement.");
                break; 
            }
        }

        if (currentBettingParticipants.length < 4) {
            alert('Could not gather enough betting players to start the race. Please try resetting the game or adjusting settings.');
            this.resetGame(); // Fallback to full reset if we truly can't meet the minimum
            return;
        }

        this.calculatePrizePool();
        this.generateGameRace(currentBettingParticipants); // Pass participants to generator
    }

    calculatePrizePool() {
        this.currentPrizePool = 0;
        
        // Add player bet (already deducted from player's money)
        if (!this.isSpectating && this.playerBet > 0) { // Only add if player is actively betting
            this.currentPrizePool += this.playerBet; 
        }
        
        // Add AI bets (already deducted from AI's money)
        this.aiPlayers.forEach(ai => {
            // Only add bets from AI that are active and not spectating this race
            if (!ai.hasLeft && !ai.isSpectatingCurrentRace && ai.bet > 0) {
                this.currentPrizePool += ai.bet;
            }
        });
        
        // Add from separate prize pool to make racing attractive
        this.currentPrizePool += Math.min(this.separatePrizePool, this.currentPrizePool * 0.5);
        
        this.updatePrizePoolDisplay();
    }

    updatePrizePoolDisplay() {
        this.currentPrizePoolDisplay.textContent = this.currentPrizePool.toFixed(2);
        this.totalPrizePoolDisplay.textContent = this.separatePrizePool.toFixed(2);
    }

    updatePlayersDisplay() {
        let playersForDisplay = [];

        // Add player to display list
        const playerName = this.playerHorseNameInput.value || 'Player';
        const playerBoostText = this.playerBoosts.length > 0 ? ` (${this.playerBoosts.map(b => b.charAt(0).toUpperCase() + b.slice(1)).join(', ')})` : '';
        playersForDisplay.push({
            name: playerName,
            displayName: `${playerName}${playerBoostText}`,
            money: this.playerMoney,
            bet: this.playerBet,
            isPlayer: true,
            isSpectating: this.isSpectating || this.playerBet === 0, // Player is spectating if global flag or no bet
            isWinner: this.lastRaceWinnerName === playerName // Check for winner highlight
        });
        
        // Add AI players to display list
        this.aiPlayers.forEach(ai => {
            if (ai.hasLeft) return; // Don't display AI players who have left
            
            const aiBoostText = ai.boosts.length > 0 ? ` (${ai.boosts.map(b => b.charAt(0).toUpperCase() + b.slice(1)).join(', ')})` : '';
            playersForDisplay.push({
                name: ai.name,
                displayName: `${ai.name}${aiBoostText}`,
                money: ai.money,
                bet: ai.bet,
                isPlayer: false,
                isSpectating: ai.isSpectatingCurrentRace || ai.bet === 0, // AI is spectating if current race flag or no bet
                isWinner: this.lastRaceWinnerName === ai.name // Check for winner highlight
            });
        });

        // Sort players: Betting players first, then spectating players. Winners on top within their group.
        playersForDisplay.sort((a, b) => {
            // Winners first within their group
            if (a.isWinner && !b.isWinner) return -1;
            if (!a.isWinner && b.isWinner) return 1;

            // Betting players before spectating players
            if (!a.isSpectating && b.isSpectating) return -1;
            if (a.isSpectating && !b.isSpectating) return 1;

            // Otherwise, maintain original order or sort alphabetically
            return a.name.localeCompare(b.name);
        });

        let html = '';
        playersForDisplay.forEach(player => {
            const statusText = player.isSpectating ? ' (Spectating)' : (player.bet > 0 ? '' : ' (No Bet)');
            const winnerClass = player.isWinner ? ' winner-highlight' : '';
            const spectatingClass = player.isSpectating ? ' spectating-player' : '';
            
            // Add (You) for human player
            const identityText = player.isPlayer ? ' (You)' : '';
            
            html += `
                <div class="player-item${winnerClass}${spectatingClass}">
                    <span class="player-name">${player.displayName}${identityText}${statusText}</span>
                    <span class="player-money">$${player.money.toFixed(2)}</span>
                    <span class="player-bet">Bet: $${player.bet.toFixed(2)}</span>
                </div>
            `;
        });
        
        this.playersListDiv.innerHTML = html;
    }

    // Modify generateGameRace to accept participants as an argument
    generateGameRace(participantsToRace) { // Accepts participants array
        this.clearTrack();
        // NEW: Remove winner display from previous race if it exists
        const winnerDisplay = document.getElementById('winnerDisplay');
        if (winnerDisplay) {
            winnerDisplay.remove();
        }

        this.horses = [];
        this.finishOrder = [];
        this.raceFinished = false;
        this.winner = null;
        
        // Calculate track height
        const horseHeight = 50;
        const minTrackHeight = 400;
        const requiredHeight = Math.max(minTrackHeight, participantsToRace.length * horseHeight + 80); // Use participantsToRace
        this.raceTrack.style.minHeight = `${requiredHeight}px`;
        
        this.trackFinishLineX = this.raceTrack.offsetWidth - 70;
        
        participantsToRace.forEach((participant, index) => { // Use participantsToRace
            const horse = this.createGameHorse(participant, index);
            this.horses.push(horse);
            this.raceTrack.appendChild(horse.element);
        });
        
        // Start sparkle generation
        if (this.horses.some(horse => horse.isGolden) && !this.sparkleGenerationLoopId) {
            this.sparkleGenerationLoopId = setInterval(() => {
                this.horses.filter(h => h.isGolden).forEach(horse => {
                    this.emitSparkle(horse);
                });
            }, 200); // Increased interval from 100ms to 200ms for performance
        }
        
        this.updatePlayersDisplay(); // Update players list with current bets and money
        this.raceInProgress = false;
        this.startRace();
    }

    createGameHorse(participant, index) {
        const horseElement = document.createElement('div');
        horseElement.className = 'horse';
        horseElement.style.top = `${40 + index * 50}px`;

        let horseType = 'normal';
        if (participant.boosts.includes('ruby')) {
            horseType = 'ruby';
            horseElement.classList.add('ruby');
        } else if (participant.boosts.includes('diamond')) {
            horseType = 'diamond';
            horseElement.classList.add('diamond');
        } else if (participant.boosts.includes('gold')) {
            horseType = 'gold';
            horseElement.classList.add('gold');
        }

        let bodyColorStyle = '';
        let hairColorStyle = '';

        if (horseType === 'normal') {
            let bodyColor, hairColor;
            
            if (participant.isPlayer) {
                bodyColor = this.playerBodyColorSelect.value || this.getRandomColor().hex;
                hairColor = this.playerHairColorSelect.value || this.getRandomColor().hex;
            } else {
                bodyColor = this.getRandomColor().hex;
                hairColor = this.getRandomColor().hex;
            }
            
            if (hairColor === '#000000') {
                hairColor = this.darkenColor(hairColor, 0.15);
            } else {
                hairColor = this.darkenColor(hairColor, -0.1);
            }
            
            if (bodyColor === hairColor) {
                hairColor = this.darkenColor(hairColor, -0.1);
            }

            bodyColorStyle = `style="background-color: ${bodyColor}"`;
            hairColorStyle = `style="background-color: ${hairColor}"`;
        }

        horseElement.innerHTML = `
            <div class="horse-name">${participant.name}</div>
            <div class="horse-body">
                <div class="horse-head" ${bodyColorStyle}></div>
                <div class="horse-neck" ${bodyColorStyle}></div>
                <div class="horse-torso" ${bodyColorStyle}></div>
                <div class="horse-leg horse-front-leg-1" ${bodyColorStyle}></div>
                <div class="horse-leg horse-front-leg-2" ${bodyColorStyle}></div>
                <div class="horse-leg horse-back-leg-1" ${bodyColorStyle}></div>
                <div class="horse-leg horse-back-leg-2" ${bodyColorStyle}></div>
                <div class="horse-head-hair" ${hairColorStyle}></div>
                <div class="horse-neck-hair" ${hairColorStyle}></div>
                <div class="horse-torso-hair" ${hairColorStyle}></div>
                <div class="horse-tail" ${hairColorStyle}></div>
            </div>
        `;

        let baseSpeed = 1.85 + Math.random() * 0.1;
        if (participant.aiData) {
            baseSpeed = participant.aiData.horseSpeed;
        }
        
        let speedBoostMultiplier = 1;
        if (horseType === 'ruby') {
            speedBoostMultiplier = 1.33;
        } else if (horseType === 'diamond') {
            speedBoostMultiplier = 1.25;
        } else if (horseType === 'gold') {
            speedBoostMultiplier = 1.15;
        }
        
        const finalSpeed = baseSpeed * speedBoostMultiplier;

        return {
            element: horseElement,
            name: participant.name,
            participant: participant,
            position: 20,
            speed: 0,
            baseSpeed: finalSpeed,
            stamina: 0.9999 + Math.random() * 0.0002,
            finished: false,
            finishTime: 0,
            frontLegs: [
                horseElement.querySelector('.horse-front-leg-1'),
                horseElement.querySelector('.horse-front-leg-2')
            ],
            backLegs: [
                horseElement.querySelector('.horse-back-leg-1'),
                horseElement.querySelector('.horse-back-leg-2')
            ],
            legAnimationPhase: Math.random() * Math.PI * 2,
            bodyElement: horseElement.querySelector('.horse-body'),
            bodyAnimationPhase: Math.random() * Math.PI * 2,
            tailElement: horseElement.querySelector('.horse-tail'),
            tailAnimationPhase: Math.random() * Math.PI * 2,
            isGolden: (horseType === 'gold' || horseType === 'diamond' || horseType === 'ruby'),
        };
    }

    handleGameRaceEnd() {
        if (this.gameMode && this.finishOrder.length > 0) {
            const winner = this.finishOrder[0];
            this.lastRaceWinnerName = winner.name; // Store winner's name for display
            
            let winnerBet = 0;
            let isPlayerWinner = false;
            
            // Determine winner's bet and type
            if (winner.participant.isPlayer) {
                winnerBet = this.playerBet;
                isPlayerWinner = true;
            } else {
                winnerBet = winner.participant.aiData.bet;
                winner.participant.aiData.wins++;
            }
            
            // Calculate prize with target 3x and minimum 1.5x, capped by current prize pool
            let prize = winnerBet * 3.0; // Target 3x prize

            // Ensure prize is at least 1.5x the bet
            prize = Math.max(prize, winnerBet * 1.5);

            // Cap the prize at the total current prize pool, so it doesn't go negative on payout
            prize = Math.min(prize, this.currentPrizePool);
            
            // Award prize from current prize pool
            if (isPlayerWinner) {
                this.playerMoney += prize;
                this.playerMoneyInput.value = this.playerMoney;
                this.updateMoneyDisplay();
            } else {
                winner.participant.aiData.money += prize;
            }
            
            // Deduct prize from the current prize pool
            this.currentPrizePool -= prize;
            
            // Add remaining prize pool (or deficit) to separate pool
            this.separatePrizePool += this.currentPrizePool;
            // Ensure separate prize pool doesn't go below zero due to rounding or slight deficits
            if (this.separatePrizePool < 0) this.separatePrizePool = 0; 
            
            // If separate prize pool is less than $1, and there's room, add another AI for next race
            const activeGamePlayersCount = (this.playerMoney >= 2 ? 1 : 0) + this.aiPlayers.filter(ai => !ai.hasLeft).length;
            if (this.separatePrizePool < 1 && activeGamePlayersCount < 8) {
                 if (this.addForcedBettingAI()) {
                     console.log("Added new AI due to low prize pool.");
                 }
            }

            // Update losses for non-winners who participated
            this.aiPlayers.forEach(ai => {
                const winnerAI = this.winner && this.winner.participant && this.winner.participant.aiData;
                // AI loses if they participated (not left, not spectating, had a bet) AND are not the winner
                if (!ai.hasLeft && !ai.isSpectatingCurrentRace && ai.bet > 0 && ai !== winnerAI) {
                    ai.losses++;
                }
            });
            
            // Reset player's bet and boosts for next race
            this.playerBet = 0;
            this.playerBoosts = [];
            this.placeBetBtn.textContent = 'Place Bet';
            this.placeBetBtn.disabled = false; // Re-enable place bet button for next race
            this.updateBoostDisplay(); // Clears active boosts display
            this.updateBoostButtons(); // Re-enable boost buttons based on money for next race

            // Reset AI's bets, boosts, and spectating status for the next race cycle
            this.aiPlayers.forEach(ai => {
                if (!ai.hasLeft) {
                    ai.bet = 0; // Clear bet for the next round
                    ai.boosts = []; // Clear boosts for the next round
                    ai.isSpectatingCurrentRace = false; // Assume not spectating until new decisions are made
                    // ai.isNew flag is handled in updateAIStrategies when new AI joins
                }
            });
            
            // Update displays
            this.updatePrizePoolDisplay();
            this.updateLeaderboardDisplay(); 

            // Re-enable game control buttons for the next race cycle
            this.playGameBtn.disabled = false;
            this.spectateGameBtn.disabled = false;
            this.resetGameBtn.disabled = false;
            this.resetBtn.disabled = true; // The default tab's reset button should remain disabled after a game race
            
            this.updatePlayersDisplay(); // Needs to be after AI properties are reset for next race

            // Add winner announcement to results
            this.resultsDiv.innerHTML = `
                <h2>Race Results</h2>
                <div style="text-align: center; margin-bottom: 20px; font-size: 18px; color: #27ae60;">
                    🏆 ${isPlayerWinner ? 'You won!' : `${winner.participant.name} won!`}
                </div>
                <ol>
                    ${this.finishOrder.map(horse => {
                        let prizeText = '';
                        // Show prize amount for winner
                        if (horse === winner) {
                            prizeText = `<span style="color: #27ae60; font-weight: bold; margin-left: 10px;">+$${prize.toFixed(2)}</span>`;
                        }
                        return `<li>${horse.name} - <strong>${horse.finishTime.toFixed(3)}s</strong>${prizeText}</li>`;
                    }).join('')}
                </ol>
            `;
        }
    }

    maintainAIPlayerCount() {
        // Filter out AIs that have permanently left
        this.aiPlayers = this.aiPlayers.filter(ai => !ai.hasLeft);
        
        const targetTotalAIPlayers = Math.floor(Math.random() * 5) + 4; // Aim for 4-8 total active AIs
        while (this.aiPlayers.length < targetTotalAIPlayers && this.aiPlayers.length < 12) { // Cap total AI pool size at 12
            if (!this.addForcedBettingAI()) { // Use the helper to add new AIs
                console.warn("Could not add more unique AI players during maintainAIPlayerCount.");
                break; 
            }
        }
    }

    addToLeaderboard(ai) {
        if (ai.hasLeft) {
            const takeHomeMoney = ai.money - ai.originalMoney;
            this.leaderboard.push({
                name: ai.name,
                takeHomeMoney: takeHomeMoney
            });
            // Sort by takeHomeMoney in descending order
            this.leaderboard.sort((a, b) => b.takeHomeMoney - a.takeHomeMoney);
            this.updateLeaderboardDisplay();
        }
    }

    updateLeaderboardDisplay() {
        let html = '';
        if (this.leaderboard.length === 0) {
            html = '<p>No players have left yet.</p>';
        } else {
            this.leaderboard.forEach((entry, index) => {
                html += `
                    <div class="leaderboard-item">
                        <span class="leaderboard-name">${index + 1}. ${entry.name}</span>
                        <span class="leaderboard-money">$${entry.takeHomeMoney.toFixed(2)}</span>
                    </div>
                `;
            });
        }
        this.leaderboardListDiv.innerHTML = html;
    }

    resetGame() {
        this.gameMode = true; // Stay in game mode after reset
        this.playerMoney = 50;
        this.initialMoneySet = false; // NEW: Reset initial money confirmation
        this.playerBoosts = [];
        this.playerBet = 0;
        this.currentPrizePool = 0;
        this.separatePrizePool = 0; // MODIFIED: Reset separate prize pool to 0
        this.isSpectating = false; // Player is not spectating on full reset
        this.lastRaceWinnerName = null; // Clear winner highlight

        this.playerMoneyInput.value = 50;
        this.playerHorseNameInput.value = '';
        this.playerBodyColorSelect.value = '';
        this.playerHairColorSelect.value = '';
        this.betAmountInput.value = 2;
        this.placeBetBtn.textContent = 'Place Bet';
        
        this.updateMoneyDisplay(); // updates playerMoneyDisplay & boost buttons
        this.updateBoostDisplay(); // ensures active boosts display is 'None'
        this.updatePrizePoolDisplay();
        
        // Re-enable player money controls for initial setup
        this.confirmMoneyBtn.disabled = false; // NEW: Re-enable confirm button
        this.updatePlayerMoneyControlsState(); // NEW: Re-enable money input & random button
        
        // Reset AI players completely
        this.aiPlayers = [];
        this.generateAIPlayers(true); // Re-generate a fresh set of AI players, mark as new
        this.leaderboard = []; // Clear leaderboard on full game reset
        
        this.updatePlayersDisplay();
        this.updateLeaderboardDisplay(); // Clear display
        this.resetRaceInternal(); // Use internal reset for track, etc.
        
        // Ensure game start buttons are enabled after a full game reset
        this.playGameBtn.disabled = false;
        this.spectateGameBtn.disabled = false;
        this.resetGameBtn.disabled = false;
        this.resetBtn.disabled = true; // The default tab's reset button should remain disabled
    }

    darkenColor(hex, percent) {
        let f = parseInt(hex.slice(1), 16),
            t = percent < 0 ? 0 : 255,
            p = Math.abs(percent),
            R = f >> 16,
            G = (f >> 8) & 0x00ff,
            B = f & 0x0000ff;
        return (
            "#" +
            (
                0x1000000 +
                (Math.round((t - R) * p) + R) * 0x10000 +
                (Math.round((t - G) * p) + G) * 0x100 +
                (Math.round((t - B) * p) + B)
            )
            .toString(16)
            .slice(1)
        );
    }

    getRandomColor() {
        if (this.colorPalette.length === 0) {
            console.warn("No colors available! Using default black.");
            return { name: 'Black', hex: '#000000' };
        }
        const randomIndex = Math.floor(Math.random() * this.colorPalette.length);
        return this.colorPalette[randomIndex];
    }

    generateRace() {
        const names = this.horseNamesInput.value.trim().split('\n').filter(name => name.trim());
        
        if (names.length < 2) {
            alert('Please enter at least 2 horse names');
            return;
        }

        this.clearTrack();
        // Clear winner display when a new race is generated in the default tab
        const winnerDisplay = document.getElementById('winnerDisplay');
        if (winnerDisplay) {
            winnerDisplay.remove();
        }
        
        this.horses = [];
        this.finishOrder = [];
        this.raceFinished = false;
        this.winner = null;
        
        const horseHeight = 50;
        const minTrackHeight = 400;
        const requiredHeight = Math.max(minTrackHeight, names.length * horseHeight + 80);
        this.raceTrack.style.minHeight = `${requiredHeight}px`;
        
        this.trackFinishLineX = this.raceTrack.offsetWidth - 70;
        
        names.forEach((name, index) => {
            const horse = this.createHorse(name.trim(), index);
            this.horses.push(horse);
            this.raceTrack.appendChild(horse.element);
        });
        
        if (this.horses.some(horse => horse.is10kflies) && !this.sparkleGenerationLoopId) {
            this.sparkleGenerationLoopId = setInterval(() => {
                this.horses.filter(h => h.is10kflies).forEach(horse => {
                    this.emitSparkle(horse);
                    this.emitSparkle(horse);this.emitSparkle(horse);this.emitSparkle(horse);this.emitSparkle(horse);this.emitSparkle(horse);
                    this.emitSparkle(horse);this.emitSparkle(horse);this.emitSparkle(horse);this.emitSparkle(horse);this.emitSparkle(horse);
                });
            }, 200); // Increased interval from 100ms to 200ms for performance
        }

        this.generateBtn.disabled = true;
        this.startBtn.disabled = false;
        this.resetBtn.disabled = false;
        this.resultsDiv.style.display = 'none';
    }
    
    createHorse(name, index) {
        const horseElement = document.createElement('div');
        horseElement.className = 'horse';
        horseElement.style.top = `${40 + index * 50}px`;

        const hasGoldTag = name.toLowerCase().includes('(gold)');
        const hasDiamondTag = name.toLowerCase().includes('(diamond)');
        const hasRubyTag = name.toLowerCase().includes('(ruby)');

        let horseType = 'normal';
        if (hasRubyTag) {
            horseType = 'ruby';
            horseElement.classList.add('ruby');
        } else if (hasDiamondTag) {
            horseType = 'diamond';
            horseElement.classList.add('diamond');
        } else if (hasGoldTag) {
            horseType = 'gold';
            horseElement.classList.add('gold');
        }

        let bodyColorStyle = '';
        let hairColorStyle = '';

        if (horseType === 'normal') {
            const bodyColor = this.getRandomColor().hex;
            let hairBaseColor = this.getRandomColor().hex;
            let finalHairColor;

            if (hairBaseColor === '#000000') {
                finalHairColor = this.darkenColor(hairBaseColor, 0.15);
            } else {
                finalHairColor = this.darkenColor(hairBaseColor, -0.1);
            }
            
            if (bodyColor === hairBaseColor) {
                finalHairColor = this.darkenColor(finalHairColor, -0.1);
            }

            bodyColorStyle = `style="background-color: ${bodyColor}"`;
            hairColorStyle = `style="background-color: ${finalHairColor}"`;
        }

        horseElement.innerHTML = `
            <div class="horse-name">${name}</div>
            <div class="horse-body">
                <div class="horse-head" ${bodyColorStyle}></div>
                <div class="horse-neck" ${bodyColorStyle}></div>
                <div class="horse-torso" ${bodyColorStyle}></div>
                <div class="horse-leg horse-front-leg-1" ${bodyColorStyle}></div>
                <div class="horse-leg horse-front-leg-2" ${bodyColorStyle}></div>
                <div class="horse-leg horse-back-leg-1" ${bodyColorStyle}></div>
                <div class="horse-leg horse-back-leg-2" ${bodyColorStyle}></div>
                <div class="horse-head-hair" ${hairColorStyle}></div>
                <div class="horse-neck-hair" ${hairColorStyle}></div>
                <div class="horse-torso-hair" ${hairColorStyle}></div>
                <div class="horse-tail" ${hairColorStyle}></div>
            </div>
        `;

        const baseSpeed = 1.85 + Math.random() * 0.1;
        let speedBoostMultiplier = 1;
        if (horseType === 'ruby') {
            speedBoostMultiplier = 1.33;
        } else if (horseType === 'diamond') {
            speedBoostMultiplier = 1.25;
        } else if (horseType === 'gold') {
            speedBoostMultiplier = 1.15;
        }
        const finalSpeed = baseSpeed * speedBoostMultiplier;

        return {
            element: horseElement,
            name: name,
            position: 20,
            speed: 0,
            baseSpeed: finalSpeed,
            stamina: 0.9999 + Math.random() * 0.0002,
            finished: false,
            finishTime: 0,
            frontLegs: [
                horseElement.querySelector('.horse-front-leg-1'),
                horseElement.querySelector('.horse-front-leg-2')
            ],
            backLegs: [
                horseElement.querySelector('.horse-back-leg-1'),
                horseElement.querySelector('.horse-back-leg-2')
            ],
            legAnimationPhase: Math.random() * Math.PI * 2,
            bodyElement: horseElement.querySelector('.horse-body'),
            bodyAnimationPhase: Math.random() * Math.PI * 2,
            tailElement: horseElement.querySelector('.horse-tail'),
            tailAnimationPhase: Math.random() * Math.PI * 2,
            // isGolden: (horseType === 'gold' || horseType === 'diamond' || horseType === 'ruby'),
            is10kflies: name.toLowerCase().includes('flies'),
        };
    }
    
    emitSparkle(horse) {
        const MAX_SPARKLES = 200; // Define a limit for active sparkles
        const currentSparkles = this.raceTrack.querySelectorAll('.sparkle');
        if (currentSparkles.length >= MAX_SPARKLES) {
            // Remove the oldest sparkle if limit is reached
            currentSparkles[0].remove();
        }

        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.textContent = '🪰';

        const horseRect = horse.element.getBoundingClientRect();
        const trackRect = this.raceTrack.getBoundingClientRect();

        // Calculate sparkle position relative to race track and horse
        // Aim for the top-left-ish area of the horse
        const horseLeftInTrack = horseRect.left - trackRect.left;
        const horseTopInTrack = horseRect.top - trackRect.top;
        const horseWidth = horse.element.offsetWidth;
        const horseHeight = horse.element.offsetHeight;

        // Base position relative to the horse's local coordinates, then convert to track coordinates
        // Shift left and up more for wider sparkle area, adjust origin
        const baseSparkleX = horseLeftInTrack + horseWidth * 0.15; // More to the left
        const baseSparkleY = horseTopInTrack + horseHeight * 0.0;  // More to the top

        // Random offsets for dispersion
        const randomOffsetX = (Math.random() - 0.5) * 60; // Bigger horizontal spread
        const randomOffsetY = (Math.random() - 0.5) * 40; // Bigger vertical spread, also adjust for "fall" effect

        const sparkleX = baseSparkleX + randomOffsetX;
        const sparkleY = baseSparkleY + randomOffsetY;

        sparkle.style.left = `${sparkleX}px`;
        sparkle.style.top = `${sparkleY}px`;
        sparkle.style.opacity = '1'; // 50% transparency

        const dx = (Math.random() - 0.5) * 20; // Less horizontal movement
        const dy = (Math.random() - 0.5) * 15; // Less vertical movement / "fall"
        sparkle.style.setProperty('--dx', `${dx}px`);
        sparkle.style.setProperty('--dy', `${dy}px`);

        this.raceTrack.appendChild(sparkle);

        setTimeout(() => {
            sparkle.remove();
        }, 2000); // Animation duration
    }
    
    startRace() {
        if (this.raceInProgress) return;
        
        // Buttons should be handled by startGame in game mode
        if (!this.gameMode) {
            this.generateBtn.disabled = true;
            this.startBtn.disabled = true;
            this.resetBtn.disabled = false;
        }

        if (this.countdownEnabled) {
            this.startCountdown(3);
        } else {
            this.initiateRaceStart();
        }
    }

    startCountdown(count) {
        this.countdownDisplay.style.display = 'flex';
        this.countdownDisplay.textContent = count;
        
        this.countdownIntervalId = setInterval(() => {
            count--;
            if (count > 0) {
                this.countdownDisplay.textContent = count;
            } else {
                clearInterval(this.countdownIntervalId);
                this.countdownIntervalId = null;
                this.countdownDisplay.style.display = 'none';
                this.initiateRaceStart();
            }
        }, 1000);
    }

    initiateRaceStart() {
        this.raceInProgress = true;
        this.startTime = performance.now();
        
        this.horses.forEach(horse => {
            horse.speed = horse.baseSpeed;
        });
        
        this.raceLoop();
    }
    
    raceLoop() {
        if (!this.raceInProgress) return;

        this.standings = this.horses.sort((a, b) => b.position - a.position).slice(0, 3)
        this.liveUpdate.innerHTML = `
            1st ${this.standings[0].name}<br>
            2nd ${this.standings[1].name}<br>
            3rd ${this.standings[2].name}
        ` 
        
        let allFinished = true;
        
        this.horses.forEach(horse => {
            if (!horse.finished) {
                allFinished = false;
                
                if (Math.random() < 0.8) {
                    horse.stamina += (Math.random() - 0.5) * 0.015;
                    horse.baseSpeed += (Math.random() - 0.5) * 0.15;
                    
                    horse.stamina = Math.max(0.95, Math.min(1.05, horse.stamina));
                    horse.baseSpeed = Math.max(1.5, Math.min(2.5, horse.baseSpeed));
                }
                
                horse.speed = horse.baseSpeed * horse.stamina;
                horse.speed += (Math.random() - 0.5) * 0.25;
                
                horse.speed = Math.max(0.5, horse.speed);
                
                horse.position += horse.speed;
                console.log('horse', horse.name, ': ', horse.position)

                // Make horse leg swing animation slightly slower: changed 0.12 to 0.08
                horse.legAnimationPhase += horse.speed * 0.08;
                const rotationAngle = 180; // Increased by 5 degrees
                const phaseOffset = Math.PI / 4;

                const currentAngleLeg1 = rotationAngle * Math.sin(horse.legAnimationPhase);
                const currentAngleLeg2 = rotationAngle * Math.sin(horse.legAnimationPhase + phaseOffset);

                if (horse.frontLegs[0]) horse.frontLegs[0].style.transform = `rotate(${currentAngleLeg1}deg)`;
                if (horse.frontLegs[1]) horse.frontLegs[1].style.transform = `rotate(${currentAngleLeg2}deg)`;

                if (horse.backLegs[0]) horse.backLegs[0].style.transform = `rotate(${-currentAngleLeg1}deg)`;
                if (horse.backLegs[1]) horse.backLegs[1].style.transform = `rotate(${-currentAngleLeg2}deg)`;

                // Allow body and tail animation for all horses, regardless of golden status.
                // The CSS animation for golden horses (goldShine) applies to specific inner divs,
                // not the overall horse-body or horse-tail elements, so transforms are compatible.
                horse.bodyAnimationPhase += horse.speed * 0.08;
                const bodyTiltAngle = 5 * Math.sin(horse.bodyAnimationPhase);
                if (horse.bodyElement) horse.bodyElement.style.transform = `rotate(${bodyTiltAngle}deg)`;

                horse.tailAnimationPhase += horse.speed * 0.05;
                const tailSwingAngle = 10 * Math.sin(horse.tailAnimationPhase);
                if (horse.tailElement) horse.tailElement.style.transform = `rotate(${15 + tailSwingAngle}deg)`;
                
                if (horse.position >= this.trackFinishLineX) {
                    horse.finished = true;
                    horse.position = this.trackFinishLineX;
                    horse.finishTime = (performance.now() - this.startTime) / 1000;
                    this.finishOrder.push(horse);
                    
                    horse.frontLegs.forEach(leg => { if (leg) leg.style.transform = 'rotate(0deg)'; });
                    horse.backLegs.forEach(leg => { if (leg) leg.style.transform = 'rotate(0deg)'; });
                    // Ensure body and tail also reset to their neutral position (for non-golden horses too if applicable)
                    if (horse.bodyElement) horse.bodyElement.style.transform = 'rotate(0deg)';
                    if (horse.tailElement) horse.tailElement.style.transform = 'rotate(15deg)';
                    
                    if (this.finishOrder.length === 1) {
                        this.winner = horse;
                        this.showWinner();
                    }
                }
                
                horse.element.style.left = `${horse.position}px`;
            } else {
                // Ensure body and tail also reset to their neutral position (for non-golden horses too if applicable)
                horse.frontLegs.forEach(leg => { if (leg) leg.style.transform = 'rotate(0deg)'; });
                horse.backLegs.forEach(leg => { if (leg) leg.style.transform = 'rotate(0deg)'; });
                if (horse.bodyElement) horse.bodyElement.style.transform = 'rotate(0deg)';
                if (horse.tailElement) horse.tailElement.style.transform = 'rotate(15deg)';
            }
        });
        
        if (allFinished) {
            this.raceInProgress = false;
            this.raceFinished = true;
            this.handleGameRaceEnd(); // Calls this for game-specific logic
            this.showResults();
        } else {
            requestAnimationFrame(() => this.raceLoop());
        }
    }
    
    showWinner() {
        let winnerDisplay = document.getElementById('winnerDisplay');
        if (!winnerDisplay) {
            winnerDisplay = document.createElement('div');
            winnerDisplay.id = 'winnerDisplay';
            winnerDisplay.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255, 255, 255, 0.95);
                padding: 20px 30px;
                border-radius: 12px;
                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
                text-align: center;
                z-index: 100;
                font-size: 24px;
                font-weight: bold;
                color: #2c3e50;
                border: 3px solid #f1c40f;
            `;
            this.raceTrack.appendChild(winnerDisplay);
        }
        
        winnerDisplay.innerHTML = `
            <div style="color: #f1c40f; font-size: 18px; margin-bottom: 5px;">🏆 WINNER! 🏆</div>
            <div>${this.winner.name}</div>
            <div style="font-size: 16px; color: #666; margin-top: 5px;">Time: ${this.winner.finishTime.toFixed(3)}s</div>
        `;

    }
    
    showResults() {
        this.resultsDiv.style.display = 'block';
        if (!this.gameMode) { // Only update results div if not in game mode (game mode handles it in handleGameRaceEnd)
            this.resultsDiv.innerHTML = `
                <h2>Race Results</h2>
                <ol>
                    ${this.finishOrder.map(horse => `<li>${horse.name} - <strong>${horse.finishTime.toFixed(3)}s</strong></li>`).join('')}
                </ol>
            `;
        }
    }
    
    // Renamed from resetRace to internal function
    resetRaceInternal() {
        if (this.countdownIntervalId) {
            clearInterval(this.countdownIntervalId);
            this.countdownIntervalId = null;
        }
        this.countdownDisplay.style.display = 'none';

        if (this.sparkleGenerationLoopId) {
            clearInterval(this.sparkleGenerationLoopId);
            this.sparkleGenerationLoopId = null;
        }

        // Remove winner display if it exists (for both game and default modes)
        const winnerDisplay = document.getElementById('winnerDisplay');
        if (winnerDisplay) {
            winnerDisplay.remove();
        }

        this.raceInProgress = false;
        this.raceFinished = false;
        this.clearTrack();
        this.horses = [];
        this.finishOrder = [];
        this.startTime = 0;
        this.winner = null;
        
        this.raceTrack.style.minHeight = '400px';
        
        this.raceTrack.querySelectorAll('.sparkle').forEach(s => s.remove());
        
        if (!this.gameMode) { // Only re-enable/disable default tab buttons
            this.generateBtn.disabled = false;
            this.startBtn.disabled = true;
            this.resetBtn.disabled = true;
        } else { // NEW: For game mode, reset race internal should reset UI for new race
            this.playerBet = 0; // Clear player's bet
            this.placeBetBtn.textContent = 'Place Bet';
            this.updateBoostDisplay(); // Clear boosts display
            this.updateBoostButtons(); // Re-enable boost buttons based on money
            this.placeBetBtn.disabled = false; // Re-enable place bet button
        }
        this.resultsDiv.style.display = 'none';
    }
    
    clearTrack() {
        const horses = this.raceTrack.querySelectorAll('.horse');
        horses.forEach(horse => horse.remove());
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new HorseRace();
});