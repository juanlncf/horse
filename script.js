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

        this.initElements();
        this.bindEvents();
    }
    
    initElements() {
        this.horseNamesInput = document.getElementById('horseNames');
        this.generateBtn = document.getElementById('generateRace');
        this.startBtn = document.getElementById('startRace');
        this.resetBtn = document.getElementById('resetRace'); // This refers to the button in the default tab.
        this.raceTrack = document.getElementById('raceTrack');
        this.resultsDiv = document.getElementById('results');
        this.countdownDisplay = document.getElementById('countdownDisplay');

        this.overture = document.querySelector('.overture')
        this.liveUpdate = document.querySelector('.live-update')
    }
    
    bindEvents() {
        this.generateBtn.addEventListener('click', () => this.generateRace());
        this.startBtn.addEventListener('click', () => this.startRace());
        this.resetBtn.addEventListener('click', () => {
            this.resetRaceInternal();
        });
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
        const names = [
            'Cannibal Coruthers ',
            'Huband of the Year',
            'Grandma\'s Special Sexy Little Baby Boy',
            'A Gazebo',
            '"I Do Declare" ',
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
        ]
        
        if (names.length < 2) {
            alert('Please enter at least 2 horse names');
            return;
        }

        this.clearTrack();
        
        this.horses = [];
        this.finishOrder = [];
        this.raceFinished = false;
        this.winner = null;
        
        const horseHeight = 50;
        const minTrackHeight = 400;
        const requiredHeight = Math.max(minTrackHeight, names.length * horseHeight + 80);
        this.raceTrack.style.minHeight = `${requiredHeight}px`;
        this.raceTrack.style.padding = '32px'
        this.raceTrack.style.border = '4px solid #27ae60'
        
        this.trackFinishLineX = this.raceTrack.offsetWidth - 70;
        
        names.forEach((name, index) => {
            const horse = this.createHorse(name.trim(), index);
            this.horses.push(horse);
            this.raceTrack.appendChild(horse.element);
        });
        
        if (this.horses.some(horse => horse.is10kFlies) && !this.sparkleGenerationLoopId) {
            this.sparkleGenerationLoopId = setInterval(() => {
                this.horses.filter(h => h.is10kFlies).forEach(horse => {
                    this.emitSparkle(horse);
                    this.emitSparkle(horse);this.emitSparkle(horse);this.emitSparkle(horse);this.emitSparkle(horse);this.emitSparkle(horse);
                    this.emitSparkle(horse);this.emitSparkle(horse);this.emitSparkle(horse);this.emitSparkle(horse);this.emitSparkle(horse);
                });
            }, 100); // Increased interval from 100ms to 200ms for performance
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

        const isDead = name.toLowerCase().includes('dead')
        const is10kFlies = name.toLowerCase().includes('flies')
        const isHorsePng = name.toLowerCase().includes('png')

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
            const bodyColor = is10kFlies ? '#624c29' : this.getRandomColor().hex;
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

        if(isHorsePng) {
            horseElement.innerHTML = `
                <div class="horse-name">${name}</div>
                <div class="horse-body">
                   <img width="150%" style="transform:translate(-25%, -25%);" src="./horse.png" />
                </div>
            `;
        } else {
            horseElement.innerHTML = `
                <div class="horse-name ${isDead ? 'dead-body' : ''}">${name}</div>
                <div class="horse-body ${isDead ? 'dead-body' : ''} ${is10kFlies ? 'is-flies' : ''}">
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
        }

        const baseSpeed = 1.85 + Math.random() * 0.1;
        const finalSpeed = baseSpeed;

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
            is10kFlies: name.toLowerCase().includes('flies'),
            isDead: isDead,
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

        this.overture.currentTime = 0
        this.overture.play()
        
        this.generateBtn.disabled = true;
        this.startBtn.disabled = true;
        this.resetBtn.disabled = false;

        if (this.countdownEnabled) {
            this.startCountdown(12);
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
            if(horse.isDead) return
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
                // console.log('horse', horse.name, ': ', horse.position)

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

        if (allFinished || (this.finishOrder.length === this.horses.length - 1)) {
            const deadHorse = this.horses.find(h => h.isDead)
            deadHorse.finishTime = -172800.420
            this.finishOrder.push(deadHorse);
            this.raceInProgress = false;
            this.raceFinished = true;
            this.showResults();
        } else {
            requestAnimationFrame(() => this.raceLoop());
        }
    }
    
    showResults() {
        this.overture.pause()
        this.resultsDiv.style.display = 'block';
        this.resultsDiv.innerHTML = `
            <h2>Race Results</h2>
            <ol>
                ${this.finishOrder.map(horse => `<li><strong>${horse.finishTime.toFixed(3)}s</strong> ${horse.name}</li>`).join('')}
            </ol>
        `;
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

        this.raceInProgress = false;
        this.raceFinished = false;
        this.clearTrack();
        this.horses = [];
        this.finishOrder = [];
        this.startTime = 0;
        this.winner = null;
        
        this.raceTrack.style.minHeight = '400px';
        
        this.raceTrack.querySelectorAll('.sparkle').forEach(s => s.remove());
        
        this.generateBtn.disabled = false;
        this.startBtn.disabled = true;
        this.resetBtn.disabled = true;
        this.resultsDiv.style.display = 'none';
    }
    
    clearTrack() {
        const horses = this.raceTrack.querySelectorAll('.horse');
        horses.forEach(horse => horse.remove());
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    new HorseRace();
    
});