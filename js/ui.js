// UI制御・共通初期化に関連するロジック
let currentCalculatedRr = { targetRr: "--", actualRr: "--" };
let currentHoldingMinutes = null;

window.onload = function() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tradeDate').value = today;
    document.getElementById('closeDate').value = today;
    
    updateDstDefault();
    setupButtonGroups();
    refreshApp();
};

function switchTab(tabName) {
    document.querySelectorAll('.container').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    const targetTab = document.getElementById(`tab-${tabName}`);
    const targetBtn = document.getElementById(`btn-tab-${tabName}`);
    
    if (targetTab && targetBtn) {
        targetTab.classList.add('active');
        targetBtn.classList.add('active');
    }

    if(tabName === 'list' || tabName === 'stats') {
        refreshApp();
    }
}

function clearFormAndGoToRecord() {
    setFormToNewMode();
    switchTab('record');
}

function isUSDaylightSavingTime(dateString) {
    if (!dateString) return false;
    const d = new Date(dateString + 'T00:00:00');
    if (isNaN(d.getTime())) return false;
    const year = d.getFullYear();
    let marchSecondSunday = new Date(year, 2, 8); 
    while (marchSecondSunday.getDay() !== 0) {
        marchSecondSunday.setDate(marchSecondSunday.getDate() + 1);
    }
    let novemberFirstSunday = new Date(year, 10, 1); 
    while (novemberFirstSunday.getDay() !== 0) {
        novemberFirstSunday.setDate(novemberFirstSunday.getDate() + 1);
    }
    const targetTime = d.getTime();
    return targetTime >= marchSecondSunday.getTime() && targetTime < novemberFirstSunday.getTime();
}

function updateDstDefault() {
    const editingId = document.getElementById('editingId').value;
    if (!editingId) {
        const dateVal = document.getElementById('tradeDate').value;
        document.getElementById('isSummerTime').checked = isUSDaylightSavingTime(dateVal);
    }
}

function setupButtonGroups() {
    document.querySelectorAll('.btn-group').forEach(group => {
        group.addEventListener('click', e => {
            if (e.target.classList.contains('select-btn')) {
                if (e.target.classList.contains('active')) {
                    e.target.classList.remove('active');
                } else {
                    group.querySelectorAll('.select-btn').forEach(btn => btn.classList.remove('active'));
                    e.target.classList.add('active');
                }
                
                if (e.target.getAttribute('data-type') === 'pair') {
                    const customInput = document.getElementById('customPairInput');
                    if (e.target.getAttribute('data-val') === 'その他' && e.target.classList.contains('active')) {
                        customInput.style.display = 'block';
                    } else {
                        customInput.style.display = 'none';
                    }
                }
                autoCalculateAllMetrics();
            }
        });
    });
}

function activateButtonInGroup(groupId, value) {
    const group = document.getElementById(groupId);
    if (!group) return;
    group.querySelectorAll('.select-btn').forEach(btn => {
        if(value && btn.getAttribute('data-val') === value) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function getSelectedVal(groupId) {
    const activeBtn = document.querySelector(`#${groupId} .select-btn.active`);
    return activeBtn ? activeBtn.getAttribute('data-val') : "";
}