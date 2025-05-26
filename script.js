let count = 0;
let maxLimit = Infinity;
let currentMode = 'free';

const countDisplay = document.getElementById('count');
const tapButton = document.getElementById('tap-button');
const resetButton = document.getElementById('reset-btn');
const modeBtns = document.querySelectorAll('.mode-btn');
const limitInput = document.getElementById('limit-input');
const descendingInput = document.getElementById('descending-input');
const maxLimitInput = document.getElementById('max-limit');
const startNumberInput = document.getElementById('start-number');

// Check if the browser supports vibration
const canVibrate = 'vibrate' in navigator;

// Initialize audio for the beep sound
const audio = new Audio('data:audio/wav;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAGDgYtAgAyN+QWaAAihwMWm4G8QQRDiMcCBcH3Cc+CDv/7xA4Tvh9Rz/y8QADBwMWgQAZG/ILNAARQ4GLTcDeIIIhxGOBAuD7hOfBB3/94gcJ3w+o5/5eIAIAAAVwWgQAVQ2ORaIQwEMAJiDg95G4nQL7mQVWI6GwRcfsZAcsKkJvxgxEjzFUgfHoSQ9Qq7KNwqHwuB13MA4a1q/DmBrHgPcmjiGoh//EwC5nGPEmS4RcfkVKOhJf+WOgoxJclFz3kgn//dBA+ya1GhurNn8zb//9NNutNuhz31f////9vt///z+IdAEAAAK4LQIAKobHItEIYCGAExBwe8jcToF9zIKrEdDYIuP2MgOWFSE34wYiR5iqQPj0JIeoVdlG4VD4XA67mAcNa1fhzA1jwHuTRxDUQ//iYBczjHiTJcIuPyKlHQkv/LHQUYkuSi57yQT//uggfZNajQ3Vmz+Zt//+mm3Wm3Q576v////+32///5/EOgAAADVghQAAAAA==');

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
        if (e.scale !== 1) {
            preventDefault(e);
        }
    }, { passive: false });

    // Prevent zoom on double tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(e) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            preventDefault(e);
        }
        lastTouchEnd = now;
    }, false);

    // Prevent zoom on double tap and pinch
    document.addEventListener('touchstart', function(e) {
        if (e.touches.length > 1) {
            preventDefault(e);
        }
    }, { passive: false });

    // Prevent zoom on keyboard focus
    document.addEventListener('focusin', function(e) {
        if (e.target.tagName === 'INPUT') {
            e.preventDefault();
            e.target.blur();
        }
    });

    // Prevent selection events
    const selectionEvents = ['selectstart', 'mousedown', 'mouseup', 'contextmenu'];
    selectionEvents.forEach(event => {
        document.addEventListener(event, preventDefault);
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
}

function reset() {
    count = 0;
    maxLimit = Infinity;
    updateDisplay();
    maxLimitInput.value = '';
    startNumberInput.value = '';
}

function notifyLimit() {
    if (canVibrate) {
        navigator.vibrate(200);
    } else {
        // Play a beep sound if vibration is not supported
        audio.currentTime = 0; // Rewind to the start
        audio.play();
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
        
        // Reset counter when changing modes
        reset();
        
        // Show/hide appropriate input fields
        limitInput.classList.toggle('hidden', currentMode !== 'limit');
        descendingInput.classList.toggle('hidden', currentMode !== 'descending');
    });
});

// Handle max limit input
maxLimitInput.addEventListener('change', () => {
    maxLimit = parseInt(maxLimitInput.value) || Infinity;
    count = Math.min(count, maxLimit);
    updateDisplay();
});

// Handle starting number input for descending mode
startNumberInput.addEventListener('change', () => {
    if (currentMode === 'descending') {
        count = parseInt(startNumberInput.value) || 0;
        updateDisplay();
    }
});

// Handle tap button
tapButton.addEventListener('click', () => {
    handleTap();
});

// Handle touch events for mobile
tapButton.addEventListener('touchend', (e) => {
    e.preventDefault();
    handleTap();
});

function handleTap() {
    switch (currentMode) {
        case 'free':
            count++;
            break;
        case 'limit':
            if (count < maxLimit) {
                count++;
                if (count >= maxLimit) {
                    notifyLimit();
                }
            }
            break;
        case 'descending':
            if (count > 0) {
                count--;
                if (count === 0) {
                    notifyLimit();
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

// Initialize display
updateDisplay();
