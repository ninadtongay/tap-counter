let count = 0;
let maxLimit = Infinity;
let currentMode = 'free';
let timerInterval = null;
let startTime = null;

const countDisplay = document.getElementById('count');
const resetButton = document.getElementById('reset-btn');
const modeBtns = document.querySelectorAll('.mode-btn');
const limitInput = document.getElementById('limit-input');
const descendingInput = document.getElementById('descending-input');
const maxLimitInput = document.getElementById('max-limit');
const startNumberInput = document.getElementById('start-number');

// Check if the browser supports vibration
const canVibrate = 'vibrate' in navigator;

// Initialize audio context and sound settings
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();
let isSoundEnabled = true; // Track sound enabled state

// Get sound toggle element
const soundToggle = document.getElementById('sound-toggle');

// Initialize sound preference from localStorage or default to true
isSoundEnabled = localStorage.getItem('soundEnabled') !== 'false';
updateSoundToggleState();

// Handle sound toggle clicks
soundToggle.addEventListener('click', () => {
    isSoundEnabled = !isSoundEnabled;
    localStorage.setItem('soundEnabled', isSoundEnabled);
    updateSoundToggleState();
});

function updateSoundToggleState() {
    soundToggle.classList.toggle('muted', !isSoundEnabled);
    soundToggle.setAttribute('aria-label', isSoundEnabled ? 'Mute Sound' : 'Unmute Sound');
}

function createBeep() {
    // Create two oscillators for a pleasant chord
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Use sine waves for a smooth sound
    oscillator1.type = 'sine';
    oscillator2.type = 'sine';
    
    // Set frequencies to create a pleasant major chord (C5 and E5)
    oscillator1.frequency.value = 523.25; // C5
    oscillator2.frequency.value = 659.25; // E5
    
    // Start with a lower volume
    gainNode.gain.value = 0.2;
    
    return { oscillator1, oscillator2, gainNode };
}

// Comprehensive interaction prevention
(function() {
    const preventDefault = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    // Prevent all gesture events
    const gestureEvents = ['gesturestart', 'gesturechange', 'gestureend'];
    gestureEvents.forEach(event => {
        document.addEventListener(event, preventDefault);
    });

    // Prevent zoom events
    document.addEventListener('touchmove', function(e) {
        if (e.target.tagName !== 'INPUT' && e.scale !== 1) {
            preventDefault(e);
        }
    }, { passive: false });

    // Prevent zoom on double tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(e) {
        if (e.target.tagName !== 'INPUT') {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                preventDefault(e);
            }
            lastTouchEnd = now;
        }
    }, false);

    // Prevent zoom on double tap and pinch
    document.addEventListener('touchstart', function(e) {
        if (e.target.tagName !== 'INPUT' && e.touches.length > 1) {
            preventDefault(e);
        }
    }, { passive: false });

    // Allow input fields to work
    document.addEventListener('focusin', function(e) {
        // Don't prevent input field focus
        if (e.target.tagName !== 'INPUT') {
            e.preventDefault();
            e.target.blur();
        }
    });

    // Handle input fields separately
    const selectionEvents = ['selectstart', 'mousedown', 'mouseup', 'contextmenu'];
    selectionEvents.forEach(event => {
        document.addEventListener(event, (e) => {
            if (e.target.tagName !== 'INPUT') {
                preventDefault(e);
            }
        });
    });

    // Enable proper input field behavior
    const inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        // Allow touch events on input fields
        input.addEventListener('touchstart', (e) => e.stopPropagation());
        input.addEventListener('touchend', (e) => e.stopPropagation());
        input.addEventListener('touchmove', (e) => e.stopPropagation());
        
        // Improve number input handling
        input.addEventListener('focus', () => {
            // Add some padding to prevent viewport shift
            document.body.style.height = window.innerHeight + 'px';
        });
        
        input.addEventListener('blur', () => {
            document.body.style.height = '100%';
        });
    });

    // Prevent double tap zoom
    document.addEventListener('touchend', function(e) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            preventDefault(e);
        }
        lastTouchEnd = now;
    }, false);

    // Prevent pinch zoom
    document.addEventListener('touchstart', function(e) {
        if (e.touches.length > 1) {
            preventDefault(e);
        }
    }, { passive: false });

    // Prevent keyboard zoom (ctrl/cmd + +/-)
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '=')) {
            preventDefault(e);
        }
    });

    // Force viewport settings
    const setViewport = () => {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.setAttribute('content', 
                'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no');
        }
    };

    // Update viewport settings on orientation change and page load
    window.addEventListener('orientationchange', setViewport);
    window.addEventListener('load', setViewport);

    // Disable text selection for all elements except inputs
    document.querySelectorAll('*:not(input)').forEach(element => {
        element.style.webkitUserSelect = 'none';
        element.style.userSelect = 'none';
    });
})();

function updateDisplay() {
    countDisplay.textContent = count;
    // Add and remove animation class
    countDisplay.classList.add('animate');
    setTimeout(() => countDisplay.classList.remove('animate'), 200);
}

function updateTimer() {
    if (!startTime) return;
    
    const now = Date.now();
    const elapsed = Math.floor((now - startTime) / 1000); // Convert to seconds
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    document.getElementById('timer').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startTimer() {
    // Only start timer if:
    // 1. In free mode, or
    // 2. In limit mode with a valid limit, or
    // 3. In descending mode with a valid starting number
    if (!startTime && (
        currentMode === 'free' ||
        (currentMode === 'limit' && maxLimit > 0) ||
        (currentMode === 'descending' && count > 0)
    )) {
        startTime = Date.now();
        timerInterval = setInterval(updateTimer, 1000);
    }
}

function resetTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    startTime = null;
    document.getElementById('timer').textContent = '00:00';
}

function reset() {
    count = 0;
    maxLimit = currentMode === 'limit' ? 0 : Infinity;
    updateDisplay();
    maxLimitInput.value = '';
    startNumberInput.value = '';
    resetTimer();
}

function notifyLimit() {
    // Play pleasant sound if enabled
    if (isSoundEnabled) {
        const { oscillator1, oscillator2, gainNode } = createBeep();
        const now = audioContext.currentTime;
        
        // Start both oscillators
        oscillator1.start();
        oscillator2.start();
        
        // Create a smooth fade out
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 2);
        
        // Stop after 2 seconds and clean up
        setTimeout(() => {
            oscillator1.stop();
            oscillator2.stop();
            gainNode.disconnect();
        }, 2000);
    }
    
    // Also vibrate if supported
    if (canVibrate) {
        navigator.vibrate(200);
    }
}

// Handle mode selection
modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all buttons
        modeBtns.forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        btn.classList.add('active');
        currentMode = btn.dataset.mode;
        
        // Hide all input fields first
        limitInput.classList.add('hidden');
        descendingInput.classList.add('hidden');
        
        // Show appropriate input field based on mode
        if (currentMode === 'limit') {
            limitInput.classList.remove('hidden');
        } else if (currentMode === 'descending') {
            descendingInput.classList.remove('hidden');
        }
        
        // Reset counter and inputs when changing modes
        reset();
    });
});

// Handle max limit input
maxLimitInput.addEventListener('input', () => {
    const value = parseInt(maxLimitInput.value);
    if (!isNaN(value) && value > 0) {
        maxLimit = value;
        count = Math.min(count, maxLimit);
        updateDisplay();
    }
});

// Handle starting number input for descending mode
startNumberInput.addEventListener('input', () => {
    if (currentMode === 'descending') {
        const value = parseInt(startNumberInput.value);
        if (!isNaN(value) && value >= 0) {
            count = value;
            updateDisplay();
        }
    }
});

const tapZone = document.getElementById('tap-zone');
const tapHint = document.querySelector('.tap-hint');

// Handle tap zone events
tapZone.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    tapZone.style.transform = 'scale(0.98)';
    tapZone.style.backgroundColor = 'var(--hover-color)';
    handleTap();
});

tapZone.addEventListener('touchend', (e) => {
    e.preventDefault();
    tapZone.style.transform = '';
    tapZone.style.backgroundColor = '';
});

// Fallback for non-touch devices
tapZone.addEventListener('mousedown', (e) => {
    if (!('ontouchstart' in window)) {
        tapZone.style.transform = 'scale(0.98)';
        tapZone.style.backgroundColor = 'var(--hover-color)';
        handleTap();
    }
});

tapZone.addEventListener('mouseup', (e) => {
    if (!('ontouchstart' in window)) {
        tapZone.style.transform = '';
        tapZone.style.backgroundColor = '';
    }
});

let lastTapTime = 0;
const TAP_DELAY = 100; // Minimum delay between taps

function handleTap() {
    const currentTime = Date.now();
    if (currentTime - lastTapTime < TAP_DELAY) {
        return; // Prevent multiple rapid taps
    }
    lastTapTime = currentTime;

    // Start timer on first tap
    startTimer();

    switch (currentMode) {
        case 'free':
            count++;
            break;
        case 'limit':
            if (maxLimit === Infinity) {
                // Don't allow counting if no limit is set
                return;
            }
            if (count < maxLimit) {
                count++;
                if (count >= maxLimit) {
                    notifyLimit();
                    if (timerInterval) {
                        clearInterval(timerInterval);
                        timerInterval = null;
                    }
                }
            }
            break;
        case 'descending':
            if (count > 0) {
                count--;
                if (count === 0) {
                    notifyLimit();
                    if (timerInterval) {
                        clearInterval(timerInterval);
                        timerInterval = null;
                    }
                }
            }
            break;
    }
    updateDisplay();
    
    // Provide haptic feedback if available
    if (canVibrate) {
        navigator.vibrate(50);
    }
}

// Handle reset button
resetButton.addEventListener('click', reset);

// Handle preset buttons
document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const value = parseInt(btn.dataset.value);
        if (currentMode === 'limit') {
            maxLimitInput.value = value;
            maxLimit = value;
        } else if (currentMode === 'descending') {
            startNumberInput.value = value;
            count = value;
        }
        updateDisplay();
    });
});

// Initialize display
updateDisplay();

// Initialize mode buttons and input fields
function initializeUI() {
    // Set Free Mode as active by default
    const freeModeBtn = document.querySelector('[data-mode="free"]');
    freeModeBtn.classList.add('active');
    
    // Hide input fields by default
    limitInput.classList.add('hidden');
    descendingInput.classList.add('hidden');
    
    // Initialize the counter display
    updateDisplay();
}

// Add touch event handlers to all buttons
function addTouchHandlers() {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            button.style.transform = 'scale(0.95)';
        });

        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            button.style.transform = '';
            button.click(); // Trigger the click event
        });

        button.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            button.style.transform = '';
        });
    });
}

// Call initialization when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeUI();
    addTouchHandlers();
});
