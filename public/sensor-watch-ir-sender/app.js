let sendAborted = false;
let sending = false;

const clockEl = document.getElementById('clock');
const statusEl = document.getElementById('status');
const estimateEl = document.getElementById('estimate');
const sendBtn = document.getElementById('send-btn');
const abortBtn = document.getElementById('abort-btn');
const flashOverlay = document.getElementById('flash-overlay');
const progressFill = document.getElementById('progress-fill');
const bitRateInput = document.getElementById('bit-rate');
const bitRateLabel = document.getElementById('bit-rate-label');
const modeSelect = document.getElementById('output-mode');

function updateClock() {
    const now = new Date();
    clockEl.textContent = now.toLocaleString();
}

function updateEstimate() {
    const ms = bitRateInput.value;
    const bps = (1000 / ms).toFixed(1);
    bitRateLabel.textContent = `${ms}ms (~${bps} bps)`;
    const totalMs = IR_PROTOCOL.estimateTime(parseInt(ms));
    estimateEl.textContent = `${IR_PROTOCOL.frameLength} bits, ~${(totalMs / 1000).toFixed(1)}s transmission`;
}

setInterval(updateClock, 200);
updateClock();
updateEstimate();

bitRateInput.addEventListener('input', updateEstimate);

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// --- Torch (flashlight) API ---

let torchStream = null;
let torchTrack = null;

async function initTorch() {
    try {
        torchStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });
        torchTrack = torchStream.getVideoTracks()[0];
        const capabilities = torchTrack.getCapabilities();
        if (!capabilities.torch) {
            throw new Error('Torch not supported on this device');
        }
        return true;
    } catch (e) {
        statusEl.textContent = 'Torch error: ' + e.message;
        statusEl.className = 'error';
        torchStream = null;
        torchTrack = null;
        return false;
    }
}

async function setTorch(on) {
    if (torchTrack) {
        await torchTrack.applyConstraints({ advanced: [{ torch: on }] });
    }
}

function releaseTorch() {
    if (torchStream) {
        torchStream.getTracks().forEach(t => t.stop());
        torchStream = null;
        torchTrack = null;
    }
}

// --- Output: screen or torch ---

function getMode() {
    return modeSelect ? modeSelect.value : 'screen';
}

async function outputBit(value, durationMs) {
    if (getMode() === 'torch') {
        await setTorch(value === 1);
    } else {
        flashOverlay.className = value ? 'flash-white' : 'flash-black';
        flashOverlay.style.display = 'block';
    }
    await sleep(durationMs);
}

async function outputOff() {
    if (getMode() === 'torch') {
        await setTorch(false);
    }
    flashOverlay.style.display = 'none';
    flashOverlay.className = '';
}

// --- Send ---

async function startSend() {
    if (sending) return;
    sending = true;
    sendAborted = false;
    sendBtn.style.display = 'none';
    abortBtn.style.display = 'inline-block';

    const useTorch = getMode() === 'torch';

    if (useTorch) {
        const ok = await initTorch();
        if (!ok) {
            sending = false;
            sendBtn.style.display = 'inline-block';
            abortBtn.style.display = 'none';
            return;
        }
    }

    const bitPeriod = parseInt(bitRateInput.value);
    const totalMs = IR_PROTOCOL.estimateTime(bitPeriod);

    statusEl.textContent = 'Get ready...';
    statusEl.className = 'sending';

    for (let i = 3; i > 0; i--) {
        if (sendAborted) break;
        const hint = useTorch ? 'Point flashlight at sensor.' : 'Place phone screen on sensor.';
        statusEl.textContent = `Starting in ${i}... ${hint}`;
        await sleep(1000);
    }

    // Capture time AFTER countdown, add transmission time so the
    // encoded time matches the moment transmission finishes.
    const sendTime = new Date(Date.now() + totalMs);
    const { frame, dataBytes, checksum } = IR_PROTOCOL.encode(sendTime);

    if (!sendAborted) {
        statusEl.textContent = 'Transmitting...';

        for (let i = 0; i < frame.length; i++) {
            if (sendAborted) break;
            await outputBit(frame[i], bitPeriod);
            progressFill.style.width = `${((i + 1) / frame.length) * 100}%`;
        }
    }

    await outputOff();
    if (useTorch) releaseTorch();

    if (sendAborted) {
        statusEl.textContent = 'Aborted.';
        statusEl.className = 'error';
    } else {
        const timeStr = sendTime.toLocaleTimeString();
        statusEl.textContent = `Sent! Time value: ${timeStr}`;
        statusEl.className = 'success';
    }

    progressFill.style.width = '0';
    sendBtn.style.display = 'inline-block';
    abortBtn.style.display = 'none';
    sending = false;
}

function abortSend() {
    sendAborted = true;
}

// --- Export ---

function downloadSignal() {
    const bitPeriod = parseInt(bitRateInput.value);
    const totalMs = IR_PROTOCOL.estimateTime(bitPeriod);
    const sendTime = new Date(Date.now() + totalMs);
    const { frame, dataBytes, checksum } = IR_PROTOCOL.encode(sendTime);

    const signal = {
        version: 1,
        bitPeriodMs: bitPeriod,
        encodedTime: sendTime.toISOString(),
        dataBytes,
        checksum,
        frame,
    };

    const blob = new Blob([JSON.stringify(signal, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ir-signal.irsig';
    a.click();
    URL.revokeObjectURL(url);
}

// --- Test tools ---

async function testLight(on) {
    const useTorch = getMode() === 'torch';
    if (on) {
        if (useTorch) {
            const ok = torchTrack || await initTorch();
            if (ok) await setTorch(true);
        } else {
            flashOverlay.className = 'flash-white';
            flashOverlay.style.display = 'block';
        }
        statusEl.textContent = (useTorch ? 'Torch' : 'White screen') + ' ON — check ir_test_face reading';
        statusEl.className = 'sending';
    } else {
        if (useTorch) {
            await setTorch(false);
            releaseTorch();
        }
        flashOverlay.style.display = 'none';
        flashOverlay.className = '';
        statusEl.textContent = '';
        statusEl.className = '';
    }
}

let toggleInterval = null;
async function testToggle() {
    const useTorch = getMode() === 'torch';

    if (toggleInterval) {
        clearInterval(toggleInterval);
        toggleInterval = null;
        if (useTorch) {
            await setTorch(false);
            releaseTorch();
        }
        flashOverlay.style.display = 'none';
        flashOverlay.className = '';
        statusEl.textContent = 'Toggle stopped.';
        statusEl.className = '';
        document.getElementById('toggle-btn').textContent = 'Toggle On/Off (1Hz)';
        return;
    }

    if (useTorch) {
        const ok = torchTrack || await initTorch();
        if (!ok) return;
    }

    let on = false;
    toggleInterval = setInterval(async () => {
        on = !on;
        if (useTorch) {
            await setTorch(on);
        } else {
            flashOverlay.className = on ? 'flash-white' : 'flash-black';
            flashOverlay.style.display = 'block';
        }
    }, 500);
    statusEl.textContent = 'Toggling 1Hz — check ir_test_face counter';
    statusEl.className = 'sending';
    document.getElementById('toggle-btn').textContent = 'Stop Toggle';
}
