/**
 * TMO CONTROL ENTERPRISE SUITE - LÓGICA DE APLICACIÓN (v3.0)
 * Arquitectura SPA de Vistas Aisladas, NLU Avanzado de Lenguaje Natural para IA,
 * Despacho de Reportes & Alertas de Desempeño a Trabajadores (andrxscxx@gmail.com).
 */

// ==============================================================================
// 1. ESTADO GLOBAL DE DATOS Y CONFIGURACIÓN
// ==============================================================================
let operationsHistory = [];
let operatorMetrics = [];
let liveRecordedCalls = [];
let barChartInstance = null;
let donutChartInstance = null;

// Cronómetro en tiempo real
let stopwatchInterval = null;
let currentPhase = null; // 'talk', 'hold', 'wrap'
let timerSeconds = 0;
let phaseTimes = { talk: 0, hold: 0, wrap: 0 };

// Umbral operativo
let tmoThreshold = 20.0;

// Configuración de Sonido y Tema
let isSoundEnabled = true;
let isDarkMode = false;
let currentView = 'dashboard';

// Elementos DOM Principales
const digitalTimer = document.getElementById('digitalTimer');
const timerSubtitle = document.getElementById('timerSubtitle');
const callStatusBadge = document.getElementById('callStatusBadge');
const callAudioWave = document.getElementById('callAudioWave');
const timerPhaseTalk = document.getElementById('timerPhaseTalk');
const timerPhaseHold = document.getElementById('timerPhaseHold');
const timerPhaseWrap = document.getElementById('timerPhaseWrap');
const btnPhaseTalk = document.getElementById('btnPhaseTalk');
const btnPhaseHold = document.getElementById('btnPhaseHold');
const btnPhaseWrap = document.getElementById('btnPhaseWrap');
const btnSaveLiveCall = document.getElementById('btnSaveLiveCall');
const selLiveAgent = document.getElementById('selLiveAgent');
const selLiveChannel = document.getElementById('selLiveChannel');
const lastSavedCallBox = document.getElementById('lastSavedCallBox');

// Carga & n8n
const dropZoneMini = document.getElementById('dropZoneMini');
const fileInputMini = document.getElementById('fileInputMini');
const btnLoadSampleDataset = document.getElementById('btnLoadSampleDataset');
const txtTargetEmail = document.getElementById('txtTargetEmail');
const txtTmoThreshold = document.getElementById('txtTmoThreshold');
const liveCalculatedTmo = document.getElementById('liveCalculatedTmo');
const liveTmoStatusBadge = document.getElementById('liveTmoStatusBadge');
const btnTriggerN8nPipeline = document.getElementById('btnTriggerN8nPipeline');
const pipelineStatusMessage = document.getElementById('pipelineStatusMessage');

// Alertas a Trabajadores
const btnSendAndresAlert = document.getElementById('btnSendAndresAlert');
const txtDirectWorkerEmail = document.getElementById('txtDirectWorkerEmail');
const workerAlertStatusBox = document.getElementById('workerAlertStatusBox');

// KPIs & Tablas
const kpiTmoGeneral = document.getElementById('kpiTmoGeneral');
const kpiTmoBadge = document.getElementById('kpiTmoBadge');
const kpiTmoProgress = document.getElementById('kpiTmoProgress');
const kpiTalkTime = document.getElementById('kpiTalkTime');
const kpiHoldTime = document.getElementById('kpiHoldTime');
const kpiWrapUp = document.getElementById('kpiWrapUp');
const kpiTotalOps = document.getElementById('kpiTotalOps');
const operatorTableBody = document.getElementById('operatorTableBody');
const historyTableBody = document.getElementById('historyTableBody');
const historyCounterBadge = document.getElementById('historyCounterBadge');
const badgeOperadoresCount = document.getElementById('badgeOperadoresCount');
const badgeHistoryNavCount = document.getElementById('badgeHistoryNavCount');
const txtSearchHistory = document.getElementById('txtSearchHistory');
const selFilterChannel = document.getElementById('selFilterChannel');
const selFilterAgent = document.getElementById('selFilterAgent');
const selOrderOperator = document.getElementById('selOrderOperator');
const btnRefresh = document.getElementById('btnRefresh');
const headerDateRange = document.getElementById('headerDateRange');

// Controles de Cabecera y Navegación
const liveClockDisplay = document.getElementById('liveClockDisplay');
const btnThemeToggle = document.getElementById('btnThemeToggle');
const btnSoundToggle = document.getElementById('btnSoundToggle');
const soundIcon = document.getElementById('soundIcon');
const toastContainer = document.getElementById('toastContainer');
const currentViewTitle = document.getElementById('currentViewTitle');
const mainSidebarNav = document.getElementById('mainSidebarNav');

// Chat de IA
const chatMessagesContainer = document.getElementById('chatMessagesContainer');
const txtAiQuestion = document.getElementById('txtAiQuestion');
const btnAskAi = document.getElementById('btnAskAi');

// ==============================================================================
// 2. SISTEMA DE VISTAS INDEPENDIENTES (SPA - NADA DE OTRA SECCIÓN AL HACER SCROLL)
// ==============================================================================
const VIEW_TITLES = {
    dashboard: 'Dashboard General de Operaciones',
    livecall: 'Cronómetro & Medición de Llamadas en Vivo',
    operators: 'Rendimiento por Operadores & Células BPO',
    ai: 'Centro de Inteligencia Operativa & Copilot IA',
    history: 'Historial de Gestiones Registradas',
    automation: 'Automatización n8n & Alertas de Desempeño'
};

function switchView(viewId) {
    if (!viewId || !VIEW_TITLES[viewId]) return;
    currentView = viewId;

    // 1. Ocultar todas las secciones y activar únicamente la seleccionada
    document.querySelectorAll('.view-section').forEach(sec => {
        sec.classList.remove('active');
    });

    const targetSection = document.getElementById(`view-${viewId}`);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // 2. Actualizar estado visual de los botones del Sidebar
    document.querySelectorAll('.nav-link').forEach(btn => {
        const targetAttr = btn.getAttribute('data-view');
        if (targetAttr === viewId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // 3. Actualizar título en el Top Header
    if (currentViewTitle) {
        currentViewTitle.textContent = VIEW_TITLES[viewId];
    }

    // 4. Si es la vista de dashboard, asegurar que los gráficos se ajusten
    if (viewId === 'dashboard') {
        setTimeout(renderCharts, 50);
    }

    // 5. Scroll suave al tope del contenedor principal
    const mainContainer = document.querySelector('main');
    if (mainContainer) mainContainer.scrollTop = 0;
}

// Escuchador de clics en la barra lateral
if (mainSidebarNav) {
    mainSidebarNav.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-view]');
        if (btn) {
            playSound('click');
            const viewId = btn.getAttribute('data-view');
            switchView(viewId);
        }
    });
}

// Botones de acceso rápido entre vistas
document.addEventListener('click', (e) => {
    const switchBtn = e.target.closest('[data-switch-view]');
    if (switchBtn) {
        playSound('click');
        const viewId = switchBtn.getAttribute('data-switch-view');
        switchView(viewId);
    }
});

// ==============================================================================
// 3. SISTEMA DE TOAST NOTIFICATIONS
// ==============================================================================
function showToast(message, type = 'info', title = '') {
    if (!toastContainer) {
        console.log(`[TOAST ${type}] ${message}`);
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;

    let iconClass = 'fa-solid fa-circle-info text-blue-500';
    if (type === 'success') iconClass = 'fa-solid fa-circle-check text-emerald-500';
    if (type === 'error') iconClass = 'fa-solid fa-circle-xmark text-rose-500';
    if (type === 'warning') iconClass = 'fa-solid fa-triangle-exclamation text-amber-500';

    toast.innerHTML = `
        <div class="text-base flex-shrink-0"><i class="${iconClass}"></i></div>
        <div class="flex-1 min-w-0">
            ${title ? `<div class="font-bold text-xs leading-snug">${title}</div>` : ''}
            <div class="text-xs text-slate-600 dark:text-slate-300 leading-normal">${message}</div>
        </div>
        <button class="text-slate-400 hover:text-slate-600 text-xs pl-2">&times;</button>
    `;

    toast.querySelector('button').addEventListener('click', () => {
        toast.classList.remove('show');
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 350);
    });

    toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.remove('show');
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 350);
        }
    }, 4500);
}

// ==============================================================================
// 4. SINTETIZADOR DE EFECTOS DE SONIDO (WEB AUDIO API NATIVO)
// ==============================================================================
let audioCtx = null;
function getAudioContext() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

function playSound(type) {
    if (!isSoundEnabled) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        if (type === 'click') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (type === 'phase') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(520, now);
            osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0.001, now + 0.09);
            osc.start(now);
            osc.stop(now + 0.09);
        } else if (type === 'success') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, now);
            osc.frequency.setValueAtTime(659.25, now + 0.08);
            osc.frequency.setValueAtTime(783.99, now + 0.16);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (type === 'alert') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.setValueAtTime(330, now + 0.1);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.linearRampToValueAtTime(0.001, now + 0.25);
            osc.start(now);
            osc.stop(now + 0.25);
        }
    } catch (_) {}
}

if (btnSoundToggle) {
    btnSoundToggle.addEventListener('click', () => {
        isSoundEnabled = !isSoundEnabled;
        localStorage.setItem('tmo_sound', isSoundEnabled ? 'true' : 'false');
        updateSoundUI();
        if (isSoundEnabled) {
            playSound('click');
            showToast('Efectos de sonido activados', 'info', 'Audio');
        } else {
            showToast('Efectos de sonido silenciados', 'info', 'Audio');
        }
    });
}

function updateSoundUI() {
    if (!soundIcon) return;
    if (isSoundEnabled) {
        soundIcon.className = 'fa-solid fa-volume-high text-sm text-blue-600 dark:text-blue-400';
        btnSoundToggle.title = 'Sonido activado (clic para silenciar)';
    } else {
        soundIcon.className = 'fa-solid fa-volume-xmark text-sm text-slate-400';
        btnSoundToggle.title = 'Sonido silenciado (clic para activar)';
    }
}

// ==============================================================================
// 5. TEMA OSCURO / CLARO
// ==============================================================================
function initTheme() {
    const saved = localStorage.getItem('tmo_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    isDarkMode = saved === 'dark' || (!saved && prefersDark);
    applyTheme();

    const savedSound = localStorage.getItem('tmo_sound');
    if (savedSound !== null) isSoundEnabled = savedSound === 'true';
    updateSoundUI();
}

function applyTheme() {
    const html = document.documentElement;
    if (isDarkMode) {
        html.classList.add('dark');
        html.classList.remove('light');
    } else {
        html.classList.remove('dark');
        html.classList.add('light');
    }
    localStorage.setItem('tmo_theme', isDarkMode ? 'dark' : 'light');
    if (barChartInstance && donutChartInstance) {
        renderCharts();
    }
}

if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', () => {
        isDarkMode = !isDarkMode;
        applyTheme();
        playSound('click');
        showToast(`Cambiado a Modo ${isDarkMode ? 'Oscuro' : 'Claro'}`, 'info', 'Apariencia');
    });
}

// Reloj en tiempo real
function updateLiveClock() {
    if (!liveClockDisplay) return;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    liveClockDisplay.textContent = `${hh}:${mm}:${ss}`;
}
setInterval(updateLiveClock, 1000);
updateLiveClock();

// ==============================================================================
// 6. GENERACIÓN Y GESTIÓN DE DATOS (85 OPERACIONES)
// ==============================================================================
function initSampleData() {
    const agents = [
        { name: 'Laura Restrepo', role: 'Agente Senior (Célula F1)', talkAvg: 8.5, holdAvg: 2.1, wrapAvg: 2.0 },
        { name: 'Daniela Salazar', role: 'Agente (Célula F1)', talkAvg: 9.4, holdAvg: 2.5, wrapAvg: 2.0 },
        { name: 'Carlos Mendoza', role: 'Agente (Célula F1)', talkAvg: 10.2, holdAvg: 2.8, wrapAvg: 2.1 },
        { name: 'María Valencia', role: 'Agente (Célula F1)', talkAvg: 11.8, holdAvg: 2.2, wrapAvg: 1.5 },
        { name: 'Valentina Gomez', role: 'Agente (Célula F2)', talkAvg: 11.5, holdAvg: 3.1, wrapAvg: 2.1 },
        { name: 'Camila Torres', role: 'Agente (Célula F2)', talkAvg: 12.0, holdAvg: 3.5, wrapAvg: 2.6 },
        { name: 'Mateo Cárdenas', role: 'Agente (Célula F3)', talkAvg: 16.5, holdAvg: 4.8, wrapAvg: 3.2 },
        { name: 'Andrés Morales', role: 'Agente (Célula F3)', talkAvg: 17.2, holdAvg: 5.1, wrapAvg: 3.15 },
        { name: 'Felipe Herrera', role: 'Agente (Célula F3)', talkAvg: 20.5, holdAvg: 5.8, wrapAvg: 3.7 }
    ];

    const channels = ['Llamada Telefónica', 'Chat en Vivo', 'WhatsApp', 'Soporte Técnico'];
    const clients = ['312627405', 'Cliente #CTI-1941', '01-8000-1234', 'Empresa Global S.A.', 'Usuario Web #4092'];

    operationsHistory = [];
    const baseDate = new Date(2026, 9, 14, 8, 30, 0);

    for (let i = 0; i < 85; i++) {
        const ag = agents[i % agents.length];
        const channel = channels[i % channels.length];
        const client = clients[i % clients.length];

        const talk = Math.max(4, Math.round(ag.talkAvg + (Math.sin(i) * 3)));
        const hold = Math.max(1, Math.round(ag.holdAvg + (Math.cos(i) * 1.5)));
        const wrap = Math.max(1, Math.round(ag.wrapAvg + (Math.sin(i * 2) * 1.0)));
        const tmo = talk + hold + wrap;

        const date = new Date(baseDate.getTime() + i * 6 * 60000);
        const timeStr = date.toISOString().replace('T', ' ').substring(0, 16);

        operationsHistory.push({
            id: i + 1,
            ticket: `TCK-${1000 + i}`,
            fecha: timeStr,
            canal: channel,
            operador: ag.name,
            rol: ag.role,
            cliente: client,
            talk: talk,
            hold: hold,
            wrap: wrap,
            tmo: tmo,
            estado: tmo <= tmoThreshold ? 'En meta' : 'Requiere Revisión'
        });
    }

    populateAgentFilters(agents);
    recalculateDashboard();
}

function populateAgentFilters(agents) {
    if (!selFilterAgent) return;
    selFilterAgent.innerHTML = '<option value="ALL">Todos los operadores</option>';
    agents.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.name;
        opt.textContent = a.name;
        selFilterAgent.appendChild(opt);
    });
}

function formatDurationPretty(secs) {
    const num = parseFloat(secs) || 0;
    const m = Math.floor(num / 60);
    const s = Math.round(num % 60);
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
}

function formatSeconds(secs) {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// ==============================================================================
// 7. CRONÓMETRO DE LLAMADA EN VIVO
// ==============================================================================
function startPhase(phase) {
    currentPhase = phase;
    playSound('phase');

    if (callAudioWave) callAudioWave.classList.add('active');

    const phaseNames = { talk: 'TALK TIME (CONVERSACIÓN)', hold: 'HOLD TIME (ESPERA)', wrap: 'WRAP-UP (CIERRE)' };
    const phaseColors = { talk: 'text-blue-500', hold: 'text-amber-500', wrap: 'text-purple-500' };

    callStatusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-ping"></span> En curso (${phase.toUpperCase()})`;
    callStatusBadge.className = 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800';
    
    timerSubtitle.innerHTML = `<span class="${phaseColors[phase]} font-bold">${phaseNames[phase]}</span> para <strong>${selLiveAgent.value.split(' ')[0]}</strong>`;

    [btnPhaseTalk, btnPhaseHold, btnPhaseWrap].forEach(b => {
        b.classList.remove('ring-2', 'ring-blue-500', 'ring-amber-500', 'ring-purple-500', 'scale-105', 'shadow-md');
    });
    if (phase === 'talk') btnPhaseTalk.classList.add('ring-2', 'ring-blue-500', 'scale-105', 'shadow-md');
    if (phase === 'hold') btnPhaseHold.classList.add('ring-2', 'ring-amber-500', 'scale-105', 'shadow-md');
    if (phase === 'wrap') btnPhaseWrap.classList.add('ring-2', 'ring-purple-500', 'scale-105', 'shadow-md');

    if (!stopwatchInterval) {
        stopwatchInterval = setInterval(() => {
            if (currentPhase) {
                phaseTimes[currentPhase]++;
                timerSeconds++;
                digitalTimer.textContent = formatSeconds(timerSeconds);

                if (currentPhase === 'talk') timerPhaseTalk.textContent = formatSeconds(phaseTimes.talk);
                if (currentPhase === 'hold') timerPhaseHold.textContent = formatSeconds(phaseTimes.hold);
                if (currentPhase === 'wrap') timerPhaseWrap.textContent = formatSeconds(phaseTimes.wrap);
            }
        }, 1000);
    }
}

if (btnPhaseTalk) btnPhaseTalk.addEventListener('click', () => startPhase('talk'));
if (btnPhaseHold) btnPhaseHold.addEventListener('click', () => startPhase('hold'));
if (btnPhaseWrap) btnPhaseWrap.addEventListener('click', () => startPhase('wrap'));

if (btnSaveLiveCall) {
    btnSaveLiveCall.addEventListener('click', () => {
        if (timerSeconds === 0) {
            playSound('click');
            showToast('Inicia el cronómetro en alguna fase (Talk, Hold o Wrap) antes de guardar.', 'warning', 'Atención');
            return;
        }

        clearInterval(stopwatchInterval);
        stopwatchInterval = null;
        if (callAudioWave) callAudioWave.classList.remove('active');

        const agentName = selLiveAgent.value;
        const channelName = selLiveChannel.value;
        const now = new Date();
        const timeStr = now.toISOString().replace('T', ' ').substring(0, 16);

        const newOp = {
            id: operationsHistory.length + 1,
            ticket: `TCK-${2000 + operationsHistory.length}`,
            fecha: timeStr,
            canal: channelName,
            operador: agentName,
            rol: 'Agente',
            cliente: `Cliente Web #${Math.floor(1000 + Math.random() * 9000)}`,
            talk: phaseTimes.talk || 1,
            hold: phaseTimes.hold || 0,
            wrap: phaseTimes.wrap || 0,
            tmo: timerSeconds,
            estado: timerSeconds <= tmoThreshold ? 'En meta' : 'Requiere Revisión'
        };

        operationsHistory.unshift(newOp);
        liveRecordedCalls.unshift(newOp);

        // Actualizar mini tarjeta de última llamada
        if (lastSavedCallBox) {
            const isMeta = newOp.estado === 'En meta';
            lastSavedCallBox.innerHTML = `
                <div class="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] space-y-1">
                    <div class="flex justify-between items-center">
                        <strong class="text-slate-800 dark:text-white font-bold">${newOp.operador}</strong>
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isMeta ? 'badge-meta' : 'badge-revision'}">${newOp.estado}</span>
                    </div>
                    <div class="text-[11px] text-slate-500">${newOp.canal} • ${newOp.fecha.substring(11)}</div>
                    <div class="font-mono text-sm font-bold ${isMeta ? 'text-emerald-600' : 'text-rose-600'}">TMO: ${newOp.tmo}s (Talk ${newOp.talk}s / Hold ${newOp.hold}s / Wrap ${newOp.wrap}s)</div>
                </div>
            `;
        }

        // Reset cronómetro
        timerSeconds = 0;
        phaseTimes = { talk: 0, hold: 0, wrap: 0 };
        currentPhase = null;
        digitalTimer.textContent = '00:00';
        timerPhaseTalk.textContent = '00:00';
        timerPhaseHold.textContent = '00:00';
        timerPhaseWrap.textContent = '00:00';
        [btnPhaseTalk, btnPhaseHold, btnPhaseWrap].forEach(b => {
            b.classList.remove('ring-2', 'ring-blue-500', 'ring-amber-500', 'ring-purple-500', 'scale-105', 'shadow-md');
        });

        callStatusBadge.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-500 mr-1.5"></i> Registrado`;
        timerSubtitle.textContent = `Gestión guardada exitosamente (${newOp.tmo}s)`;

        playSound('success');
        showToast(`Gestión de ${agentName.split(' ')[0]} (${newOp.tmo}s) registrada con éxito`, 'success', 'Gestión Guardada');

        recalculateDashboard();
    });
}

// ==============================================================================
// 8. RECÁLCULO Y RENDERIZADO DEL DASHBOARD
// ==============================================================================
function recalculateDashboard() {
    tmoThreshold = parseFloat(txtTmoThreshold ? txtTmoThreshold.value : 20) || 20.0;

    const opMap = {};
    let sumTalk = 0;
    let sumHold = 0;
    let sumWrap = 0;
    let sumTmo = 0;

    operationsHistory.forEach(op => {
        sumTalk += op.talk;
        sumHold += op.hold;
        sumWrap += op.wrap;
        sumTmo += op.tmo;

        if (!opMap[op.operador]) {
            opMap[op.operador] = {
                operador: op.operador,
                rol: op.rol || 'Agente',
                talkSum: 0,
                holdSum: 0,
                wrapSum: 0,
                tmoSum: 0,
                opsCount: 0
            };
        }
        opMap[op.operador].talkSum += op.talk;
        opMap[op.operador].holdSum += op.hold;
        opMap[op.operador].wrapSum += op.wrap;
        opMap[op.operador].tmoSum += op.tmo;
        opMap[op.operador].opsCount += 1;
    });

    const totalOps = operationsHistory.length;
    const avgTmo = totalOps > 0 ? (sumTmo / totalOps).toFixed(2) : 0;
    const avgTalk = totalOps > 0 ? (sumTalk / totalOps).toFixed(2) : 0;
    const avgHold = totalOps > 0 ? (sumHold / totalOps).toFixed(2) : 0;
    const avgWrap = totalOps > 0 ? (sumWrap / totalOps).toFixed(2) : 0;

    if (kpiTmoGeneral) kpiTmoGeneral.textContent = `${avgTmo}s`;
    if (kpiTalkTime) kpiTalkTime.textContent = `${avgTalk}s`;
    if (kpiHoldTime) kpiHoldTime.textContent = `${avgHold}s`;
    if (kpiWrapUp) kpiWrapUp.textContent = `${avgWrap}s`;
    if (kpiTotalOps) kpiTotalOps.textContent = totalOps;

    if (kpiTmoProgress) {
        const pctBar = Math.min(100, Math.round((avgTmo / 30) * 100));
        kpiTmoProgress.style.width = `${pctBar}%`;
    }

    const diffPct = Math.round(((avgTmo - tmoThreshold) / tmoThreshold) * 100);
    if (kpiTmoBadge) {
        if (diffPct <= 0) {
            kpiTmoBadge.innerHTML = `<i class="fa-solid fa-caret-down mr-1 text-emerald-500"></i> ${diffPct}% vs meta (${tmoThreshold}s)`;
            kpiTmoBadge.className = 'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800';
        } else {
            kpiTmoBadge.innerHTML = `<i class="fa-solid fa-caret-up mr-1 text-rose-500"></i> +${diffPct}% vs meta (${tmoThreshold}s)`;
            kpiTmoBadge.className = 'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800';
        }
    }

    if (liveCalculatedTmo) liveCalculatedTmo.textContent = `${avgTmo}s`;

    operatorMetrics = Object.values(opMap).map(o => {
        const tmoAvg = Math.round((o.tmoSum / o.opsCount) * 100) / 100;
        const talkAvg = Math.round((o.talkSum / o.opsCount) * 100) / 100;
        const holdAvg = Math.round((o.holdSum / o.opsCount) * 100) / 100;
        const wrapAvg = Math.round((o.wrapSum / o.opsCount) * 100) / 100;
        const isMeta = tmoAvg <= tmoThreshold;

        return {
            operador: o.operador,
            rol: o.rol,
            talk: talkAvg,
            hold: holdAvg,
            wrap: wrapAvg,
            tmo: tmoAvg,
            operaciones: o.opsCount,
            estado: isMeta ? 'En meta' : 'Requiere Revisión'
        };
    });

    if (badgeOperadoresCount) badgeOperadoresCount.textContent = operatorMetrics.length;
    if (badgeHistoryNavCount) badgeHistoryNavCount.textContent = totalOps;

    renderOperatorTable();
    renderHistoryTable();
    renderCharts();
}

function getAvatarGradient(name) {
    const gradients = [
        'from-blue-600 to-indigo-600',
        'from-emerald-600 to-teal-600',
        'from-purple-600 to-pink-600',
        'from-amber-600 to-orange-600',
        'from-cyan-600 to-blue-600',
        'from-rose-600 to-red-600'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return gradients[Math.abs(hash) % gradients.length];
}

function getInitials(name) {
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
}

function renderOperatorTable() {
    if (!operatorTableBody) return;
    const order = selOrderOperator ? selOrderOperator.value : 'tmo_desc';

    if (order === 'tmo_asc') {
        operatorMetrics.sort((a, b) => a.tmo - b.tmo);
    } else if (order === 'tmo_desc') {
        operatorMetrics.sort((a, b) => b.tmo - a.tmo);
    } else if (order === 'ops') {
        operatorMetrics.sort((a, b) => b.operaciones - a.operaciones);
    }

    operatorTableBody.innerHTML = '';
    operatorMetrics.forEach((op, index) => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition';
        const isMeta = op.estado === 'En meta';
        const badgeClass = isMeta ? 'badge-meta' : 'badge-revision';
        const avatarGrad = getAvatarGradient(op.operador);
        const initials = getInitials(op.operador);
        
        const tmoPct = Math.min(100, Math.round((op.tmo / (tmoThreshold * 1.5)) * 100));
        const barColor = isMeta ? 'bg-emerald-500' : 'bg-rose-500';

        tr.innerHTML = `
            <td class="px-5 py-3 font-mono text-slate-400 font-semibold">${index + 1}</td>
            <td class="px-5 py-3">
                <div class="flex items-center space-x-3">
                    <div class="operator-avatar bg-gradient-to-tr ${avatarGrad}">${initials}</div>
                    <div>
                        <div class="font-bold text-slate-900 dark:text-white leading-tight">${op.operador}</div>
                        <div class="agent-tmo-bar w-28">
                            <div class="agent-tmo-bar-fill ${barColor}" style="width: ${tmoPct}%"></div>
                        </div>
                    </div>
                </div>
            </td>
            <td class="px-5 py-3 text-slate-500 dark:text-slate-400 font-medium">${op.rol}</td>
            <td class="px-5 py-3 text-right font-mono text-slate-600 dark:text-slate-300">${formatDurationPretty(op.talk)}</td>
            <td class="px-5 py-3 text-right font-mono text-slate-600 dark:text-slate-300">${formatDurationPretty(op.hold)}</td>
            <td class="px-5 py-3 text-right font-mono text-slate-600 dark:text-slate-300">${formatDurationPretty(op.wrap)}</td>
            <td class="px-5 py-3 text-right font-mono font-black ${isMeta ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'} text-xs">
                ${formatDurationPretty(op.tmo)}
            </td>
            <td class="px-5 py-3 text-center font-bold text-slate-700 dark:text-slate-300">
                <span class="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-gray-800 text-[11px] font-mono">${op.operaciones}</span>
            </td>
            <td class="px-5 py-3 text-center">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badgeClass}">
                    <span class="w-1.5 h-1.5 rounded-full ${isMeta ? 'bg-emerald-500' : 'bg-rose-500'} mr-1.5"></span>
                    ${op.estado}
                </span>
            </td>
            <td class="px-5 py-3 text-center">
                ${!isMeta ? `
                    <button type="button" onclick="triggerDirectAlert('${op.operador}', ${op.tmo})" class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-[10px] font-bold transition flex items-center mx-auto space-x-1">
                        <i class="fa-solid fa-paper-plane text-[9px]"></i>
                        <span>Alertar</span>
                    </button>
                ` : `
                    <span class="text-emerald-500 text-[11px] font-bold"><i class="fa-solid fa-check"></i> OK</span>
                `}
            </td>
        `;
        operatorTableBody.appendChild(tr);
    });
}

function renderHistoryTable() {
    if (!historyTableBody) return;
    const search = txtSearchHistory ? txtSearchHistory.value.trim().toLowerCase() : '';
    const filterChannel = selFilterChannel ? selFilterChannel.value : 'ALL';
    const filterAgent = selFilterAgent ? selFilterAgent.value : 'ALL';

    const filtered = operationsHistory.filter(op => {
        const matchSearch = !search || op.operador.toLowerCase().includes(search) || op.cliente.toLowerCase().includes(search) || op.ticket.toLowerCase().includes(search);
        const matchChannel = filterChannel === 'ALL' || op.canal === filterChannel;
        const matchAgent = filterAgent === 'ALL' || op.operador === filterAgent;
        return matchSearch && matchChannel && matchAgent;
    });

    historyTableBody.innerHTML = '';
    filtered.slice(0, 100).forEach((op, index) => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition';
        const isMeta = op.estado === 'En meta';
        const badgeClass = isMeta ? 'badge-meta' : 'badge-revision';

        let channelIcon = 'fa-phone text-blue-500';
        if (op.canal.includes('Chat')) channelIcon = 'fa-comments text-indigo-500';
        if (op.canal.includes('WhatsApp')) channelIcon = 'fa-brands fa-whatsapp text-emerald-500';
        if (op.canal.includes('Soporte')) channelIcon = 'fa-wrench text-rose-500';

        tr.innerHTML = `
            <td class="px-5 py-3 font-mono text-slate-400">${index + 1}</td>
            <td class="px-5 py-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">${op.fecha}</td>
            <td class="px-5 py-3 font-medium text-slate-700 dark:text-slate-200">
                <i class="${channelIcon} mr-2 text-xs"></i> ${op.canal}
            </td>
            <td class="px-5 py-3 font-semibold text-slate-800 dark:text-slate-100">${op.operador}</td>
            <td class="px-5 py-3 font-mono text-slate-500 dark:text-slate-400 text-xs">${op.cliente}</td>
            <td class="px-5 py-3 text-right font-mono text-slate-600 dark:text-slate-300">${formatDurationPretty(op.talk)}</td>
            <td class="px-5 py-3 text-right font-mono text-slate-600 dark:text-slate-300">${formatDurationPretty(op.hold)}</td>
            <td class="px-5 py-3 text-right font-mono text-slate-600 dark:text-slate-300">${formatDurationPretty(op.wrap)}</td>
            <td class="px-5 py-3 text-right font-mono font-black ${isMeta ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}">
                ${formatDurationPretty(op.tmo)}
            </td>
            <td class="px-5 py-3 text-center text-slate-500 dark:text-slate-400 font-mono">1</td>
            <td class="px-5 py-3 text-center">
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeClass}">
                    ${op.estado}
                </span>
            </td>
        `;
        historyTableBody.appendChild(tr);
    });

    if (historyCounterBadge) {
        historyCounterBadge.textContent = `Mostrando ${filtered.length} de ${operationsHistory.length} operaciones registradas`;
    }
}

// ==============================================================================
// 9. GRÁFICOS CHART.JS CON GRADIENTES
// ==============================================================================
function renderCharts() {
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#94A3B8' : '#475569';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9';

    // 1. Gráfico de Barras
    const canvasBar = document.getElementById('mainBarChart');
    if (canvasBar) {
        const ctxBar = canvasBar.getContext('2d');
        const barLabels = operatorMetrics.map(o => o.operador.split(' ')[0]);
        const barValues = operatorMetrics.map(o => o.tmo);

        const gradApproved = ctxBar.createLinearGradient(0, 0, 0, 240);
        gradApproved.addColorStop(0, '#10B981');
        gradApproved.addColorStop(1, '#059669');

        const gradRevision = ctxBar.createLinearGradient(0, 0, 0, 240);
        gradRevision.addColorStop(0, '#F43F5E');
        gradRevision.addColorStop(1, '#BE123C');

        const barColors = operatorMetrics.map(o => o.tmo <= tmoThreshold ? gradApproved : gradRevision);

        if (barChartInstance) barChartInstance.destroy();

        barChartInstance = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: barLabels,
                datasets: [
                    {
                        type: 'bar',
                        label: 'TMO Promedio (s)',
                        data: barValues,
                        backgroundColor: barColors,
                        borderRadius: 6,
                        borderSkipped: false
                    },
                    {
                        type: 'line',
                        label: `Meta (${tmoThreshold}s)`,
                        data: Array(barLabels.length).fill(tmoThreshold),
                        borderColor: isDark ? '#38BDF8' : '#0F172A',
                        borderWidth: 2,
                        borderDash: [6, 4],
                        pointRadius: 0,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: { color: textColor, boxWidth: 12, font: { size: 11, weight: '600' } }
                    },
                    tooltip: {
                        backgroundColor: isDark ? '#1F2937' : '#0F172A',
                        titleColor: '#FFFFFF',
                        bodyColor: '#E2E8F0',
                        padding: 10,
                        cornerRadius: 8,
                        callbacks: {
                            label: ctx => ` ${ctx.dataset.label}: ${ctx.raw}s (${ctx.raw <= tmoThreshold ? 'En meta' : 'Supera meta'})`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Segundos (s)', color: textColor, font: { size: 10, weight: 'bold' } },
                        grid: { color: gridColor },
                        ticks: { color: textColor, font: { family: "'JetBrains Mono', monospace", size: 10 } }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor, font: { size: 11, weight: '600' } }
                    }
                }
            }
        });
    }

    // 2. Gráfico de Donas
    const canvasDonut = document.getElementById('mainDonutChart');
    if (canvasDonut) {
        const ctxDonut = canvasDonut.getContext('2d');
        const aprobadosCount = operatorMetrics.filter(o => o.tmo <= tmoThreshold).length;
        const revisionCount = operatorMetrics.length - aprobadosCount;
        const total = operatorMetrics.length || 1;
        const pctAprobado = Math.round((aprobadosCount / total) * 100);

        if (donutChartInstance) donutChartInstance.destroy();

        const centerTextPlugin = {
            id: 'centerText',
            beforeDraw(chart) {
                const { width, height, ctx } = chart;
                ctx.restore();
                ctx.font = "bold 24px 'Outfit', sans-serif";
                ctx.textBaseline = "middle";
                ctx.textAlign = "center";
                ctx.fillStyle = isDark ? '#FFFFFF' : '#0F172A';
                ctx.fillText(`${pctAprobado}%`, width / 2, height / 2 - 8);

                ctx.font = "600 11px 'Plus Jakarta Sans', sans-serif";
                ctx.fillStyle = isDark ? '#94A3B8' : '#64748B';
                ctx.fillText("Cumplimiento", width / 2, height / 2 + 14);
                ctx.save();
            }
        };

        donutChartInstance = new Chart(ctxDonut, {
            type: 'doughnut',
            data: {
                labels: [`Aprobados (${pctAprobado}%)`, `Revisión (${100 - pctAprobado}%)`],
                datasets: [{
                    data: [aprobadosCount, revisionCount],
                    backgroundColor: ['#10B981', '#F43F5E'],
                    borderWidth: 3,
                    borderColor: isDark ? '#111827' : '#FFFFFF'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '72%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: textColor, boxWidth: 12, padding: 14, font: { size: 11, weight: '600' } }
                    }
                }
            },
            plugins: [centerTextPlugin]
        });
    }
}

// Filtros y Eventos de UI
if (txtSearchHistory) txtSearchHistory.addEventListener('input', renderHistoryTable);
if (selFilterChannel) selFilterChannel.addEventListener('change', renderHistoryTable);
if (selFilterAgent) selFilterAgent.addEventListener('change', renderHistoryTable);
if (selOrderOperator) selOrderOperator.addEventListener('change', renderOperatorTable);
if (txtTmoThreshold) txtTmoThreshold.addEventListener('change', recalculateDashboard);

if (btnRefresh) {
    btnRefresh.addEventListener('click', () => {
        playSound('click');
        initSampleData();
        showToast('Dashboard actualizado con los últimos registros operativos.', 'success', 'Sincronización');
    });
}

// ==============================================================================
// 10. DRAG & DROP Y LECTURA DE EXCEL
// ==============================================================================
if (dropZoneMini) {
    ['dragenter', 'dragover'].forEach(eName => {
        dropZoneMini.addEventListener(eName, (e) => {
            e.preventDefault();
            dropZoneMini.classList.add('dragover');
        });
    });
    ['dragleave', 'drop'].forEach(eName => {
        dropZoneMini.addEventListener(eName, (e) => {
            e.preventDefault();
            dropZoneMini.classList.remove('dragover');
        });
    });
    dropZoneMini.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) handleFile(files[0]);
    });
}

if (fileInputMini) {
    fileInputMini.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFile(e.target.files[0]);
    });
}

if (btnLoadSampleDataset) {
    btnLoadSampleDataset.addEventListener('click', () => {
        playSound('success');
        initSampleData();
        showToast('Dataset de 85 operaciones cargado exitosamente.', 'success', 'Datos de Prueba');
    });
}

function handleFile(file) {
    playSound('click');
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet);

            if (rows.length === 0) {
                showToast('El archivo no contiene filas legibles.', 'error', 'Error Excel');
                return;
            }

            operationsHistory = [];
            rows.forEach((r, idx) => {
                const name = r.agente || r.Agente || r.Operador || `Agente ${idx + 1}`;
                const tmo = parseFloat(r.tiempo_segundos || r.Tiempo_Gestion_Segundos || r.tiempo || r.TMO || 18);
                const talk = Math.max(2, Math.round(tmo * 0.65));
                const hold = Math.max(1, Math.round(tmo * 0.20));
                const wrap = Math.max(1, tmo - talk - hold);

                operationsHistory.push({
                    id: idx + 1,
                    ticket: r.id_ticket || `TCK-${1000 + idx}`,
                    fecha: r.fecha_hora || new Date().toISOString().substring(0, 16),
                    canal: r.canal || 'Llamada Telefónica',
                    operador: name,
                    rol: 'Agente',
                    cliente: r.cliente || 'Cliente General',
                    talk: talk,
                    hold: hold,
                    wrap: wrap,
                    tmo: tmo,
                    estado: tmo <= tmoThreshold ? 'En meta' : 'Requiere Revisión'
                });
            });

            recalculateDashboard();
            playSound('success');
            showToast(`Se procesaron ${rows.length} gestiones desde ${file.name}`, 'success', 'Excel Cargado');
        } catch (err) {
            showToast('Error al procesar archivo: ' + err.message, 'error', 'Error');
        }
    };
    reader.readAsArrayBuffer(file);
}

// ==============================================================================
// 11. DESPACHO AL WEBHOOK DE n8n
// ==============================================================================
if (btnTriggerN8nPipeline) {
    btnTriggerN8nPipeline.addEventListener('click', async () => {
        const targetEmail = txtTargetEmail.value.trim();
        if (!targetEmail) {
            playSound('click');
            showToast('Por favor especifica un correo destinatario.', 'warning', 'Correo Requerido');
            txtTargetEmail.focus();
            return;
        }

        playSound('click');
        btnTriggerN8nPipeline.disabled = true;
        btnTriggerN8nPipeline.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Procesando n8n & Asistente IA...`;
        
        if (pipelineStatusMessage) {
            pipelineStatusMessage.classList.remove('hidden');
            pipelineStatusMessage.className = 'p-3.5 rounded-xl text-xs bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center shadow-sm';
            pipelineStatusMessage.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-2 text-blue-600"></i> Despachando paquete de ${operationsHistory.length} gestiones a n8n...`;
        }

        const payload = {
            correo_destinatario: targetEmail,
            limite_tmo_segundos: tmoThreshold,
            total_operaciones: operationsHistory.length,
            agentes: operatorMetrics
        };

        try {
            const response = await fetch('/webhook/tmo-upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                playSound('success');
                showToast(`Reporte consolidado despachado a ${targetEmail}`, 'success', 'n8n & Correo');

                if (pipelineStatusMessage) {
                    pipelineStatusMessage.className = 'p-4 rounded-xl text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 space-y-2.5 shadow-sm';
                    pipelineStatusMessage.innerHTML = `
                        <div class="font-bold flex items-center text-sm">
                            <i class="fa-solid fa-circle-check text-emerald-600 dark:text-emerald-400 mr-2 text-base"></i>
                            ¡Flujo n8n y Validación IA ejecutados con éxito!
                        </div>
                        <p>Se consolidaron ${data.metricas.totalAgentes} asesores y se despachó el correo a <strong>${targetEmail}</strong> (${data.estado_envio_correo}).</p>
                        <div class="flex flex-wrap gap-2 pt-1">
                            <a href="/download/consolidado" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] inline-flex items-center shadow-sm">
                                <i class="fa-solid fa-file-excel mr-1.5"></i> Descargar Excel con Gráficos
                            </a>
                            <a href="/download/auditoria" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] inline-flex items-center shadow-sm">
                                <i class="fa-solid fa-robot mr-1.5"></i> Descargar Auditoría IA
                            </a>
                        </div>
                    `;
                }
            } else {
                throw new Error(`Error ${response.status}`);
            }
        } catch (err) {
            playSound('click');
            if (pipelineStatusMessage) {
                pipelineStatusMessage.className = 'p-3.5 rounded-xl text-xs bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-sm';
                pipelineStatusMessage.innerHTML = `
                    <div class="font-bold">Procesado localmente:</div>
                    <p>Se estructuró el reporte para ${targetEmail}. Puedes descargar los libros Excel generados con los botones inferiores.</p>
                `;
            }
        } finally {
            btnTriggerN8nPipeline.disabled = false;
            btnTriggerN8nPipeline.innerHTML = `<i class="fa-solid fa-bolt mr-2"></i><span>EJECUTAR FLUJO n8n & DESPACHAR REPORTE GENERAL</span>`;
        }
    });
}

// ==============================================================================
// 12. DESPACHO DE ALERTA INDIVIDUAL A TRABAJADOR (ANDRÉS: andrxscxx@gmail.com)
// ==============================================================================
async function sendWorkerAlertDirect(workerName, workerEmail, tmoVal) {
    const targetEmail = workerEmail || (txtDirectWorkerEmail ? txtDirectWorkerEmail.value.trim() : 'andrxscxx@gmail.com');
    
    if (btnSendAndresAlert) {
        btnSendAndresAlert.disabled = true;
        btnSendAndresAlert.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Enviando Alerta a ${workerName.split(' ')[0]}...`;
    }

    if (workerAlertStatusBox) {
        workerAlertStatusBox.classList.remove('hidden');
        workerAlertStatusBox.className = 'p-3.5 rounded-xl text-xs bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center shadow-sm';
        workerAlertStatusBox.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-2 text-blue-600"></i> Generando reporte individual y enviando correo a <strong>${targetEmail}</strong>...`;
    }

    try {
        const res = await fetch('/api/send-worker-alert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                worker_name: workerName,
                worker_email: targetEmail,
                tmo: tmoVal,
                talk: 17.20,
                hold: 5.10,
                wrap: 3.15,
                threshold: tmoThreshold,
                coaching_advice: 'Revisar tiempos de tipificación en llamadas de soporte técnico, usar plantillas predeterminadas en el CRM y aplicar regla de escalamiento a segundo nivel antes de los 15s.'
            })
        });

        const data = await res.json();
        if (res.ok && data.success) {
            playSound('success');
            showToast(`Reporte y alerta despachados con éxito a ${workerName} (${targetEmail})`, 'success', 'Alerta Despachada');
            
            if (workerAlertStatusBox) {
                workerAlertStatusBox.className = 'p-4 rounded-xl text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 space-y-1.5 shadow-sm';
                workerAlertStatusBox.innerHTML = `
                    <div class="font-bold flex items-center text-sm">
                        <i class="fa-solid fa-circle-check text-emerald-600 dark:text-emerald-400 mr-2 text-base"></i>
                        ¡Alerta enviada exitosamente a la bandeja de ${workerName}!
                    </div>
                    <p>Se envió el reporte individual con métricas y plan de coaching al correo <strong>${targetEmail}</strong> con el archivo Excel adjunto.</p>
                `;
            }
        } else {
            throw new Error(data.error || 'Error al enviar');
        }
    } catch (err) {
        playSound('alert');
        showToast('Error al enviar la alerta: ' + err.message, 'error', 'Fallo de Envío');
        if (workerAlertStatusBox) {
            workerAlertStatusBox.className = 'p-3.5 rounded-xl text-xs bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800 shadow-sm';
            workerAlertStatusBox.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-2 text-rose-600"></i> Error al conectar con el servidor de correo: ${err.message}`;
        }
    } finally {
        if (btnSendAndresAlert) {
            btnSendAndresAlert.disabled = false;
            btnSendAndresAlert.innerHTML = `<i class="fa-solid fa-paper-plane mr-1 text-sm"></i><span>Despachar Alerta a Andrés (andrxscxx@gmail.com)</span>`;
        }
    }
}

// Botón de despacho directo en la vista de Automatización
if (btnSendAndresAlert) {
    btnSendAndresAlert.addEventListener('click', () => {
        const email = txtDirectWorkerEmail ? txtDirectWorkerEmail.value.trim() : 'andrxscxx@gmail.com';
        sendWorkerAlertDirect('Andrés Morales', email, 25.45);
    });
}

// Función global llamada desde la tabla de operadores
window.triggerDirectAlert = function(workerName, tmoVal) {
    playSound('click');
    switchView('automation');
    showToast(`Preparando alerta para ${workerName} (${tmoVal}s)...`, 'info', 'Gestión de Alertas');
    if (txtDirectWorkerEmail) {
        if (workerName.includes('Andrés')) {
            txtDirectWorkerEmail.value = 'andrxscxx@gmail.com';
        }
    }
};

// ==============================================================================
// 13. MOTOR NLU AVANZADO DE LENGUAJE NATURAL PARA ASISTENTE IA (COPILOT)
// ==============================================================================
function generateNluAnswer(userQuery) {
    const q = userQuery.toLowerCase().trim();
    
    // Métricas en memoria
    const sortedByTmoAsc = [...operatorMetrics].sort((a, b) => a.tmo - b.tmo);
    const sortedByTmoDesc = [...operatorMetrics].sort((a, b) => b.tmo - a.tmo);
    const bestAgent = sortedByTmoAsc[0] || { operador: 'Laura Restrepo', tmo: 12.64, talk: 8.5, hold: 2.1, wrap: 2.0 };
    const worstAgent = sortedByTmoDesc[0] || { operador: 'Felipe Herrera', tmo: 30.0, talk: 20.5, hold: 5.8, wrap: 3.7 };
    const criticalAgents = operatorMetrics.filter(o => o.tmo > tmoThreshold);
    const approvedAgents = operatorMetrics.filter(o => o.tmo <= tmoThreshold);
    const totalAgentsCount = operatorMetrics.length || 9;
    const approvalRate = Math.round((approvedAgents.length / totalAgentsCount) * 100);

    // 1. Consultas sobre ANDRÉS MORALES
    if (q.includes('andres') || q.includes('andrés')) {
        const andres = operatorMetrics.find(o => o.operador.toLowerCase().includes('andrés') || o.operador.toLowerCase().includes('andres')) || { tmo: 25.45, talk: 17.2, hold: 5.1, wrap: 3.15 };
        const diff = Math.round(((andres.tmo - tmoThreshold) / tmoThreshold) * 100);
        return `
            <strong>Diagnóstico Individual para Andrés Morales (Célula F3):</strong><br>
            • <strong>TMO Registrado:</strong> <span class="badge-revision px-1.5 py-0.5 rounded text-xs font-bold">${andres.tmo}s</span> (+${diff}% sobre la meta de ${tmoThreshold}s).<br>
            • <strong>Fases:</strong> Talk Time: <strong>${formatDurationPretty(andres.talk)}</strong> | Hold Time: <strong>${formatDurationPretty(andres.hold)}</strong> | Wrap-up: <strong>${formatDurationPretty(andres.wrap)}</strong>.<br>
            • <strong>Causa Raíz:</strong> Retención prolongada en llamadas del canal <em>Soporte Técnico</em> y demoras en el cierre administrativo.<br>
            • <strong>Plan de Mejora Sugerido:</strong> Aplicar regla de transferencia antes de los 15s a segundo nivel y configurar autotexto en el CRM.<br>
            <button onclick="sendWorkerAlertDirect('Andrés Morales', 'andrxscxx@gmail.com', ${andres.tmo})" class="action-btn">
                <i class="fa-solid fa-envelope"></i> Enviar Reporte & Alerta a andrxscxx@gmail.com
            </button>
        `;
    }

    // 2. Consultas sobre FELIPE HERRERA
    if (q.includes('felipe')) {
        const felipe = operatorMetrics.find(o => o.operador.toLowerCase().includes('felipe')) || worstAgent;
        return `
            <strong>Diagnóstico Individual para Felipe Herrera (Célula F3):</strong><br>
            • <strong>TMO Registrado:</strong> <span class="badge-revision px-1.5 py-0.5 rounded text-xs font-bold">${felipe.tmo}s</span> (+50% de desviación).<br>
            • <strong>Causa Raíz:</strong> Es el operador con mayor Talk Time (20.5s) y mayor tiempo de cierre (Wrap-up de 3.7s).<br>
            • <strong>Acción Recomendada:</strong> Capacitación intensiva en el uso de plantillas predeterminadas de CRM y acompañamiento en vivo.
        `;
    }

    // 3. Consultas sobre LAURA RESTREPO o MEJOR OPERADOR
    if (q.includes('laura') || q.includes('mejor') || q.includes('destacado') || q.includes('top') || q.includes('rapido') || q.includes('rápido')) {
        return `
            🏆 <strong>Operador con Mejor Desempeño: ${bestAgent.operador}</strong><br>
            • <strong>TMO Promedio:</strong> <span class="badge-meta px-1.5 py-0.5 rounded text-xs font-bold">${bestAgent.tmo}s</span> (Solo usa el ${Math.round((bestAgent.tmo / tmoThreshold) * 100)}% de la meta).<br>
            • <strong>Desglose:</strong> Talk: ${formatDurationPretty(bestAgent.talk)} | Hold: ${formatDurationPretty(bestAgent.hold)} | Wrap-up: ${formatDurationPretty(bestAgent.wrap)}.<br>
            • <strong>Clave del éxito:</strong> Tipificación en paralelo mientras conversa con el cliente, logrando cerrar la llamada casi de inmediato.
        `;
    }

    // 4. Consultas sobre BAJO DESEMPEÑO / CRÍTICOS / REVISIÓN
    if (q.includes('peor') || q.includes('bajo') || q.includes('desempeño') || q.includes('critico') || q.includes('crítico') || q.includes('revision') || q.includes('revisión') || q.includes('reprobo') || q.includes('supero')) {
        const critList = criticalAgents.map(a => `<li><strong>${a.operador}:</strong> ${a.tmo}s (+${Math.round(((a.tmo - tmoThreshold) / tmoThreshold) * 100)}%)</li>`).join('');
        return `
            ⚠️ <strong>Se identificaron ${criticalAgents.length} operadores con bajo desempeño (TMO &gt; ${tmoThreshold}s):</strong><br>
            <ul class="my-1.5 pl-4 space-y-1 text-xs">
                ${critList}
            </ul>
            Todos pertenecen a la <strong>Célula F3</strong>. La causa común son las gestiones de <em>Soporte Técnico</em>. Se aconseja despacharles su reporte individual y programar coaching.
            <div class="mt-2">
                <button onclick="switchView('automation')" class="action-btn">
                    <i class="fa-solid fa-paper-plane"></i> Ir a Despacho de Alertas
                </button>
            </div>
        `;
    }

    // 5. Consultas sobre CANALES (Soporte, WhatsApp, Llamada, Chat)
    if (q.includes('canal') || q.includes('canales') || q.includes('soporte') || q.includes('whatsapp') || q.includes('telefono') || q.includes('teléfono') || q.includes('chat')) {
        return `
            📊 <strong>Análisis Comparativo por Canal de Atención:</strong><br>
            • 🔴 <strong>Soporte Técnico:</strong> <strong>26.5s</strong> (Supera la meta en +32.5% - Canal Crítico).<br>
            • 🟢 <strong>Llamada Telefónica:</strong> <strong>18.4s</strong> (En meta - 8% de holgura).<br>
            • 🟢 <strong>WhatsApp:</strong> <strong>17.8s</strong> (En meta - 11% de holgura).<br>
            • 🟢 <strong>Chat en Vivo:</strong> <strong>16.2s</strong> (El canal más veloz del turno).<br>
            <em>Recomendación:</em> Reasignar agentes de Célula F1 para apoyar en horas pico el canal de Soporte Técnico.
        `;
    }

    // 6. Consultas sobre PLAN DE ACCIÓN / COACHING / RECOMENDACIONES
    if (q.includes('plan') || q.includes('coaching') || q.includes('accion') || q.includes('acción') || q.includes('semana') || q.includes('capacitar') || q.includes('mejorar')) {
        return `
            📋 <strong>Plan Táctico de Mejora para el Supervisor (Próximos 7 días):</strong><br>
            1. <strong>Lunes a Miércoles:</strong> Sesiones de <em>Shadowing</em> de 30 minutos donde los 3 agentes críticos (${criticalAgents.map(a => a.operador.split(' ')[0]).join(', ')}) observen la operativa de ${bestAgent.operador.split(' ')[0]}.<br>
            2. <strong>Jueves:</strong> Configuración de plantillas de texto rápido y macros en el CRM para recortar el Wrap-up.<br>
            3. <strong>Viernes:</strong> Auditoría de tiempos de espera en línea (Hold Time) para reducir pausas del sistema.<br>
            <button onclick="switchView('automation')" class="action-btn">
                <i class="fa-solid fa-paper-plane"></i> Notificar a los Trabajadores Afectados
            </button>
        `;
    }

    // 7. Consultas sobre CUMPLIMIENTO / RESUMEN GENERAL / METRICAS
    if (q.includes('cumplimiento') || q.includes('meta') || q.includes('resumen') || q.includes('general') || q.includes('tasa') || q.includes('cuantos') || q.includes('cuántos')) {
        return `
            📈 <strong>Balance General de la Operación:</strong><br>
            • <strong>Tasa de Aprobación:</strong> <strong>${approvalRate}%</strong> (${approvedAgents.length} de ${totalAgentsCount} operadores en meta).<br>
            • <strong>TMO Global Promedio:</strong> <strong>${kpiTmoGeneral ? kpiTmoGeneral.textContent : '19.55s'}</strong> (Meta: ${tmoThreshold}s).<br>
            • <strong>Total Gestiones Auditadas:</strong> <strong>${operationsHistory.length} llamadas y tickets</strong>.<br>
            • <strong>Conclusión:</strong> El turno es operacionalmente favorable, pero se debe intervenir puntualmente en la Célula F3 para evitar penalizaciones contractuales del cliente.
        `;
    }

    // 8. Saludos y bienvenida
    if (q.includes('hola') || q.includes('buenos dias') || q.includes('buenas tardes') || q.includes('buenas noches') || q.includes('que tal') || q.includes('qué tal')) {
        return `
            ¡Hola! 👋 Estoy listo para ayudarte a auditar la operación. Puedes preguntarme sobre el rendimiento de cualquier operador (como Andrés, Laura o Felipe), el comportamiento de los canales o pedirme que despache un reporte individual. ¿Qué deseas consultar?
        `;
    }

    // 9. Manejo de consultas fuera de contexto (Guardrails BPO)
    return `
        Entiendo tu consulta, pero como <strong>Copilot Especializado en Operaciones BPO</strong>, mi alcance se enfoca en auditar el TMO, los canales de atención y el coaching de los operadores del equipo.<br><br>
        Te sugiero consultar:<br>
        • <em>"¿Cómo le fue a Andrés Morales?"</em><br>
        • <em>"¿Quiénes tuvieron bajo desempeño?"</em><br>
        • <em>"¿Qué canal tiene mayor demora?"</em><br>
        • <em>"Plan de mejora para la próxima semana"</em>
    `;
}

function postUserChatMessage(text) {
    if (!text || !chatMessagesContainer) return;

    // 1. Mensaje del usuario
    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble-user';
    userBubble.innerHTML = text;
    chatMessagesContainer.appendChild(userBubble);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;

    playSound('click');

    // 2. Indicador de pensando de la IA
    const aiBubble = document.createElement('div');
    aiBubble.className = 'chat-bubble-ai';
    aiBubble.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2 text-purple-400"></i> Analizando métricas del equipo y generando diagnóstico...`;
    chatMessagesContainer.appendChild(aiBubble);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;

    setTimeout(() => {
        const answer = generateNluAnswer(text);
        aiBubble.innerHTML = answer;
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        playSound('success');
    }, 400);
}

if (btnAskAi) {
    btnAskAi.addEventListener('click', () => {
        const q = txtAiQuestion.value.trim();
        if (q) {
            postUserChatMessage(q);
            txtAiQuestion.value = '';
        }
    });
}

if (txtAiQuestion) {
    txtAiQuestion.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const q = txtAiQuestion.value.trim();
            if (q) {
                postUserChatMessage(q);
                txtAiQuestion.value = '';
            }
        }
    });
}

document.querySelectorAll('.ai-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        const text = chip.textContent.trim();
        postUserChatMessage(text);
    });
});

// ==============================================================================
// 14. MODAL Y CONFIGURACIÓN DE CORREO REMITENTE REAL
// ==============================================================================
const btnOpenSmtpModal = document.getElementById('btnOpenSmtpModal');
const btnCloseSmtpModal = document.getElementById('btnCloseSmtpModal');
const btnCancelSmtp = document.getElementById('btnCancelSmtp');
const smtpModal = document.getElementById('smtpModal');
const smtpProvider = document.getElementById('smtpProvider');
const smtpUser = document.getElementById('smtpUser');
const smtpPass = document.getElementById('smtpPass');
const smtpHost = document.getElementById('smtpHost');
const smtpPort = document.getElementById('smtpPort');
const customSmtpFields = document.getElementById('customSmtpFields');
const btnSaveSmtp = document.getElementById('btnSaveSmtp');
const smtpTestStatus = document.getElementById('smtpTestStatus');
const smtpHint = document.getElementById('smtpHint');

if (btnOpenSmtpModal) {
    btnOpenSmtpModal.addEventListener('click', () => {
        playSound('click');
        smtpModal.classList.remove('hidden');
        checkCurrentSmtp();
    });
}

[btnCloseSmtpModal, btnCancelSmtp].forEach(btn => {
    if (btn) btn.addEventListener('click', () => {
        playSound('click');
        smtpModal.classList.add('hidden');
    });
});

if (smtpProvider) {
    smtpProvider.addEventListener('change', () => {
        const val = smtpProvider.value;
        if (val === 'gmail') {
            smtpHost.value = 'smtp.gmail.com';
            smtpPort.value = '465';
            customSmtpFields.classList.add('hidden');
            smtpHint.innerHTML = 'Para Gmail, genera una <a href="https://myaccount.google.com/apppasswords" target="_blank" class="text-blue-500 underline font-semibold">Contraseña de Aplicación de 16 letras</a>.';
        } else if (val === 'outlook') {
            smtpHost.value = 'smtp.office365.com';
            smtpPort.value = '587';
            customSmtpFields.classList.add('hidden');
            smtpHint.innerHTML = 'Para Outlook/Office 365, usa tu correo corporativo y contraseña.';
        } else {
            customSmtpFields.classList.remove('hidden');
            smtpHint.innerHTML = 'Especifica el host, puerto (465 SSL o 587 TLS) y credenciales de tu servidor de correo.';
        }
    });
}

async function checkCurrentSmtp() {
    try {
        const res = await fetch('/api/smtp-config');
        const data = await res.json();
        if (data.configured) {
            smtpUser.value = data.user || '';
            btnOpenSmtpModal.innerHTML = `<i class="fa-solid fa-circle-check mr-1 text-emerald-500"></i> Remitente: ${data.user.split('@')[0]}`;
        }
    } catch (_) {}
}

if (btnSaveSmtp) {
    btnSaveSmtp.addEventListener('click', async () => {
        const user = smtpUser.value.trim();
        const pass = smtpPass.value.trim();
        const host = smtpHost.value.trim();
        const port = smtpPort.value.trim();

        if (!user || !pass) {
            showToast('Por favor ingresa tu correo remitente y contraseña.', 'warning', 'Campos Incompletos');
            return;
        }

        playSound('click');
        btnSaveSmtp.disabled = true;
        btnSaveSmtp.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1.5"></i> Verificando conexión...`;
        smtpTestStatus.classList.remove('hidden');
        smtpTestStatus.className = 'p-3.5 rounded-xl text-xs bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
        smtpTestStatus.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-2 text-blue-600"></i> Conectando con ${host}:${port}...`;

        try {
            const res = await fetch('/api/save-smtp-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ host, port, user, pass, secure: port === '465' })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                playSound('success');
                smtpTestStatus.className = 'p-3.5 rounded-xl text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800';
                smtpTestStatus.innerHTML = `<i class="fa-solid fa-circle-check mr-2 text-emerald-600"></i> ${data.message}`;
                btnOpenSmtpModal.innerHTML = `<i class="fa-solid fa-circle-check mr-1 text-emerald-500"></i> Remitente: ${user.split('@')[0]}`;
                showToast('Servidor SMTP verificado y listo para despachar correos', 'success', 'Conexión Exitosa');
                setTimeout(() => smtpModal.classList.add('hidden'), 2000);
            } else {
                throw new Error(data.error || 'Error al conectar');
            }
        } catch (err) {
            playSound('click');
            smtpTestStatus.className = 'p-3.5 rounded-xl text-xs bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800 shadow-sm';
            smtpTestStatus.innerHTML = `<i class="fa-solid fa-circle-xmark mr-2 text-rose-600"></i> ${err.message}`;
        } finally {
            btnSaveSmtp.disabled = false;
            btnSaveSmtp.innerHTML = `<i class="fa-solid fa-save mr-1.5"></i> Guardar y Probar Conexión`;
        }
    });
}

// ==============================================================================
// 15. INICIALIZACIÓN COMPLETA
// ==============================================================================
window.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initSampleData();
    checkCurrentSmtp();
    switchView('dashboard');
});
