// State management - متغيرات تخزن حالة التطبيق
const state = {
    shots: [],
    selectedBody: null,
    selectedSituation: null,
    selectedState: null,
    minute: 60,
    homeTeam: true
};

// DOM Elements - الحصول على العناصر من HTML
const minuteSlider = document.getElementById('minute-slider');
const minuteValue = document.getElementById('minute-value');
const homeTeamCheckbox = document.getElementById('home-team');
const shotsContainer = document.getElementById('shots-container');
const pitchContainer = document.querySelector('.pitch-container');
const clearShotsBtn = document.getElementById('clear-shots');
const downloadCsvBtn = document.getElementById('download-csv');
const csvUpload = document.getElementById('csv-upload');
const controlBtns = document.querySelectorAll('.control-btn');

// Initialize - تشغيل الكود عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

// إضافة مستمعي الأحداث (Event Listeners)
function setupEventListeners() {
    // عند النقر على أي زر تحكم
    controlBtns.forEach(btn => {
        btn.addEventListener('click', handleControlBtnClick);
    });

    // عند تحريك منزلق الدقيقة
    minuteSlider.addEventListener('input', (e) => {
        state.minute = parseInt(e.target.value);
        minuteValue.textContent = state.minute;
    });

    // عند تغيير خيار الفريق الأساسي
    homeTeamCheckbox.addEventListener('change', (e) => {
        state.homeTeam = e.target.checked;
    });

    // عند النقر على الملعب
    shotsContainer.addEventListener('click', handlePitchClick);

    // عند النقر على أزرار الإجراءات
    clearShotsBtn.addEventListener('click', clearShots);
    downloadCsvBtn.addEventListener('click', downloadCSV);
    csvUpload.addEventListener('change', handleCSVUpload);
}

// معالج النقر على أزرار التحكم
function handleControlBtnClick(e) {
    const btn = e.target;
    const body = btn.dataset.body;
    const situation = btn.dataset.situation;
    const gameState = btn.dataset.state;

    if (body) {
        btn.parentElement.querySelectorAll('.control-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.selectedBody = body;
    }

    if (situation) {
        btn.parentElement.querySelectorAll('.control-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.selectedSituation = situation;
    }

    if (gameState) {
        btn.parentElement.querySelectorAll('.control-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.selectedState = gameState;
    }
}

// معالج النقر على الملعب لإضافة لقطة
function handlePitchClick(e) {
    // حساب موقع النقر بالنسبة المئوية
    const rect = shotsContainer.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // إنشاء كائن لقطة جديد
    const shot = {
        id: Date.now(),
        x: Math.round(x * 100) / 100,
        y: Math.round(y * 100) / 100,
        xG: Math.random() * 0.5 + 0.1,
        body: state.selectedBody || 'RightFoot',
        situation: state.selectedSituation || 'OpenPlay',
        state: state.selectedState || 'Drawing',
        minute: state.minute,
        home: state.homeTeam
    };

    state.shots.push(shot);
    renderShot(shot);
}

// رسم اللقطة على الملعب
function renderShot(shot) {
    const shotEl = document.createElement('div');
    shotEl.className = 'shot';
    shotEl.dataset.id = shot.id;
    shotEl.style.left = shot.x + '%';
    shotEl.style.top = shot.y + '%';
    shotEl.title = `xG: ${shot.xG.toFixed(2)}\n${shot.body} | ${shot.situation}\nMin: ${shot.minute}`;

    shotEl.addEventListener('click', (e) => {
        e.stopPropagation();
        removeShot(shot.id);
    });

    shotsContainer.appendChild(shotEl);
}

// حذف لقطة
function removeShot(id) {
    state.shots = state.shots.filter(shot => shot.id !== id);
    document.querySelector(`[data-id="${id}"]`).remove();
}

// مسح جميع اللقطات
function clearShots() {
    if (state.shots.length > 0 && confirm('Are you sure you want to clear all shots?')) {
        state.shots = [];
        shotsContainer.innerHTML = '';
    }
}

// تنزيل البيانات بصيغة CSV
function downloadCSV() {
    if (state.shots.length === 0) {
        alert('No shots to download');
        return;
    }

    const headers = ['x', 'y', 'xG', 'body', 'situation', 'state', 'minute', 'home'];
    const rows = state.shots.map(shot => [
        shot.x,
        shot.y,
        shot.xG.toFixed(3),
        shot.body,
        shot.situation,
        shot.state,
        shot.minute,
        shot.home ? 'true' : 'false'
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `xg_shots_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

// تحميل ملف CSV
function handleCSVUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const csv = event.target.result;
            const lines = csv.trim().split('\n');
            const headers = lines[0].split(',');

            const xIndex = headers.findIndex(h => h.trim().toLowerCase() === 'x');
            const yIndex = headers.findIndex(h => h.trim().toLowerCase() === 'y');

            if (xIndex === -1 || yIndex === -1) {
                alert('CSV must contain x and y columns');
                return;
            }

            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',');
                if (values.length <= Math.max(xIndex, yIndex)) continue;

                const shot = {
                    id: Date.now() + i,
                    x: parseFloat(values[xIndex]),
                    y: parseFloat(values[yIndex]),
                    xG: parseFloat(values[headers.findIndex(h => h.trim().toLowerCase() === 'xg')] || 0.2),
                    body: values[headers.findIndex(h => h.trim().toLowerCase() === 'body')] || 'RightFoot',
                    situation: values[headers.findIndex(h => h.trim().toLowerCase() === 'situation')] || 'OpenPlay',
                    state: values[headers.findIndex(h => h.trim().toLowerCase() === 'state')] || 'Drawing',
                    minute: parseInt(values[headers.findIndex(h => h.trim().toLowerCase() === 'minute')] || 60),
                    home: values[headers.findIndex(h => h.trim().toLowerCase() === 'home')] !== 'false'
                };

                if (!isNaN(shot.x) && !isNaN(shot.y)) {
                    state.shots.push(shot);
                    renderShot(shot);
                }
            }

            alert(`Loaded ${state.shots.length} shots from CSV`);
            csvUpload.value = '';
        } catch (error) {
            alert('Error parsing CSV: ' + error.message);
        }
    };

    reader.readAsText(file);
}
