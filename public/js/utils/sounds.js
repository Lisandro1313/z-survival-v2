/**
 * Sistema de sonidos completo del juego
 * Incluye archivos de audio + tonos sintetizados + música ambiente
 */

let soundEnabled = true;
let audioContext = null;
let audioVolume = 0.3;
let ambientMusic = null;
let ambientGain = null;

// Cache de archivos de audio
const audioFiles = {};

/**
 * Inicializa el contexto de audio (requiere interacción del usuario)
 */
export function initAudio() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('✅ AudioContext inicializado');
        } catch (e) {
            console.warn('Audio API no soportada:', e);
        }
    }
}

/**
 * Carga un archivo de audio
 */
function loadAudioFile(name, path) {
    const audio = new Audio(path);
    audio.volume = audioVolume;
    audioFiles[name] = audio;
}

/**
 * Precarga todos los sonidos disponibles
 */
export function preloadSounds() {
    console.log('🔊 Precargando sonidos...');

    loadAudioFile('npc_saludo', '/sounds/SaludoinicialNpcMale.m4a');
    loadAudioFile('npc_charla', '/sounds/CharlamediaNpcMale.m4a');
    loadAudioFile('npc_despedida', '/sounds/DespedidaNpcMale.m4a');
    loadAudioFile('ataque_melee', '/sounds/AtacoMele.m4a');
    loadAudioFile('recibo_dano', '/sounds/ReciboDaño.m4a');

    console.log(`✅ ${Object.keys(audioFiles).length} archivos de audio cargados`);
}

/**
 * Inicia música ambiente 8-bit tranquila
 */
function startAmbientMusic() {
    if (!soundEnabled || !audioContext || ambientMusic) return;

    ambientGain = audioContext.createGain();
    ambientGain.gain.value = 0.05; // Muy suave
    ambientGain.connect(audioContext.destination);

    // Secuencia de notas estilo 8-bit (C mayor relajante)
    const notes = [
        { freq: 261.63, duration: 0.4 }, // C
        { freq: 329.63, duration: 0.4 }, // E
        { freq: 392.00, duration: 0.4 }, // G
        { freq: 523.25, duration: 0.4 }, // C alto
        { freq: 392.00, duration: 0.4 }, // G
        { freq: 329.63, duration: 0.4 }, // E
        { freq: 293.66, duration: 0.4 }, // D
        { freq: 261.63, duration: 0.8 }  // C (más larga)
    ];

    let noteIndex = 0;

    function playNextNote() {
        if (!ambientMusic) return;

        const note = notes[noteIndex];

        const osc = audioContext.createOscillator();
        osc.type = 'square';
        osc.frequency.value = note.freq;

        const noteGain = audioContext.createGain();
        noteGain.gain.setValueAtTime(0, audioContext.currentTime);
        noteGain.gain.linearRampToValueAtTime(1, audioContext.currentTime + 0.02);
        noteGain.gain.setValueAtTime(1, audioContext.currentTime + note.duration - 0.05);
        noteGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + note.duration);

        osc.connect(noteGain);
        noteGain.connect(ambientGain);

        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + note.duration);

        noteIndex = (noteIndex + 1) % notes.length;
        setTimeout(playNextNote, note.duration * 1000);
    }

    playNextNote();
    ambientMusic = { playing: true };
}

/**
 * Detiene la música ambiente
 */
function stopAmbientMusic() {
    if (ambientMusic) {
        ambientMusic.playing = false;
        ambientMusic = null;
    }
}

/**
 * Reproduce un sonido (archivo de audio o tono sintetizado)
 */
export function playSound(type) {
    if (!soundEnabled) return;

    // Iniciar música ambiente si no está corriendo
    if (!ambientMusic && audioContext) {
        startAmbientMusic();
    }

    // Intentar reproducir archivo de audio real primero
    if (audioFiles[type]) {
        const audio = audioFiles[type].cloneNode();
        audio.volume = audioVolume;
        audio.play().catch(err => console.log('Error reproduciendo sonido:', err));
        return;
    }

    // Fallback a tonos sintetizados
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch (type) {
        case 'success':
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            break;

        case 'error':
            oscillator.frequency.value = 200;
            oscillator.type = 'sawtooth';
            gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
            break;

        case 'warning':
        case 'notification':
            oscillator.frequency.value = 600;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.12);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.12);
            break;

        case 'combat':
            oscillator.frequency.value = 150;
            oscillator.type = 'square';
            gainNode.gain.setValueAtTime(0.12, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            break;

        case 'levelup':
        case 'achievement':
        case 'level_up':
            // Sonido ascendente épico
            const osc1 = audioContext.createOscillator();
            const osc2 = audioContext.createOscillator();
            const osc3 = audioContext.createOscillator();
            const levelGain = audioContext.createGain();

            osc1.type = 'sine';
            osc2.type = 'sine';
            osc3.type = 'triangle';

            osc1.frequency.setValueAtTime(400, audioContext.currentTime);
            osc1.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.5);

            osc2.frequency.setValueAtTime(500, audioContext.currentTime + 0.1);
            osc2.frequency.exponentialRampToValueAtTime(1400, audioContext.currentTime + 0.5);

            osc3.frequency.setValueAtTime(600, audioContext.currentTime + 0.2);
            osc3.frequency.exponentialRampToValueAtTime(1600, audioContext.currentTime + 0.5);

            levelGain.gain.setValueAtTime(0.2, audioContext.currentTime);
            levelGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            levelGain.connect(audioContext.destination);

            osc1.connect(levelGain);
            osc2.connect(levelGain);
            osc3.connect(levelGain);

            osc1.start(audioContext.currentTime);
            osc2.start(audioContext.currentTime + 0.1);
            osc3.start(audioContext.currentTime + 0.2);

            osc1.stop(audioContext.currentTime + 0.5);
            osc2.stop(audioContext.currentTime + 0.5);
            osc3.stop(audioContext.currentTime + 0.5);
            return;

        case 'loot':
        case 'item_pickup':
            oscillator.frequency.value = 1000;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.08);
            return;

        case 'craft':
            oscillator.frequency.value = 300;
            oscillator.type = 'square';
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.05);
            return;

        case 'move':
            oscillator.frequency.value = 250;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.06);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.06);
            return;

        case 'death':
            oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.4);
            oscillator.type = 'sawtooth';
            gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.4);
            break;

        default:
            console.log(`Sonido ${type} no implementado`);
            return;
    }
}

/**
 * Activa/desactiva sonidos
 */
export function toggleSound() {
    soundEnabled = !soundEnabled;
    console.log('🔊 Sonido:', soundEnabled ? 'activado' : 'desactivado');

    if (!soundEnabled) {
        stopAmbientMusic();
    }

    return soundEnabled;
}

/**
 * Verifica si el sonido está habilitado
 */
export function isSoundEnabled() {
    return soundEnabled;
}

/**
 * Ajusta el volumen global
 */
export function setVolume(volume) {
    audioVolume = Math.max(0, Math.min(1, volume));
    Object.values(audioFiles).forEach(audio => {
        audio.volume = audioVolume;
    });
}
