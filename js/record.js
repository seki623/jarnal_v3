// データリアルタイム計算・時間変換・トレードの新規保存ロジック
function autoCalculateAllMetrics() {
    const openDateVal = document.getElementById('tradeDate').value;
    const openTimeVal = document.getElementById('tradeTime').value.trim();
    const closeDateVal = document.getElementById('closeDate').value;
    const closeTimeVal = document.getElementById('closeTime').value.trim();

    const openVal = document.getElementById('openPriceInput').value;
    const closeVal = document.getElementById('closePriceInput').value;
    const tpVal = document.getElementById('tpPriceInput').value;
    const slVal = document.getElementById('slPriceInput').value;
    const lotVal = document.getElementById('lotInput').value;
    
    const result = getSelectedVal('resultGroup');
    const side = getSelectedVal('sideGroup');

    // 1. 保有時間の自動計算
    currentHoldingMinutes = null;
    const timePattern = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (openDateVal && closeDateVal && timePattern.test(openTimeVal) && timePattern.test(closeTimeVal)) {
        const openFullStr = `${openDateVal}T${openTimeVal.padStart(5, '0')}:00`;
        const closeFullStr = `${closeDateVal}T${closeTimeVal.padStart(5, '0')}:00`;
        const openDateTime = new Date(openFullStr);
        const closeDateTime = new Date(closeFullStr);

        if (!isNaN(openDateTime.getTime()) && !isNaN(closeDateTime.getTime())) {
            const diffMs = closeDateTime.getTime() - openDateTime.getTime();
            if (diffMs >= 0) {
                currentHoldingMinutes = Math.floor(diffMs / (1000 * 60));
                document.getElementById('liveHoldingBox').innerText = `保有時間: ${currentHoldingMinutes} 分`;
            } else {
                document.getElementById('liveHoldingBox').innerText = `保有時間: 不正な日時（CloseがOpenより過去です）`;
            }
        } else {
            document.getElementById('liveHoldingBox').innerText = `保有時間: --`;
        }
    } else {
        document.getElementById('liveHoldingBox').innerText = `保有時間: --`;
    }

    // 2. 獲得PIPS・損益計算
    if (openVal !== "" && closeVal !== "") {
        const openPrice = parseFloat(openVal);
        const closePrice = parseFloat(closeVal);
        let pipsValue = Math.abs(closePrice - openPrice) * 10;
        if (result === '負け') {
            pipsValue = -Math.abs(pipsValue);
        }
        document.getElementById('pipsInput').value = parseFloat(pipsValue.toFixed(2));

        if (lotVal !== "") {
            const lot = parseFloat(lotVal);
            let pnlValue = pipsValue * lot * 10;
            document.getElementById('pnlInput').value = parseFloat(pnlValue.toFixed(2));
        } else {
            document.getElementById('pnlInput').value = "";
        }
    }

    // 3. RR計算ロジック
    let targetRrText = "--";
    let actualRrText = "--";

    if (openVal !== "" && slVal !== "") {
        const openP = parseFloat(openVal);
        const slP = parseFloat(slVal);
        let riskWidth = (side === "Short") ? (slP - openP) : (openP - slP);

        if (riskWidth !== 0) {
            if (tpVal !== "") {
                const tpP = parseFloat(tpVal);
                let targetRewardWidth = (side === "Short") ? (openP - tpP) : (tpP - openP);
                let calcTargetRr = Math.abs(targetRewardWidth) / Math.abs(riskWidth);
                if (result === '負け') calcTargetRr = -calcTargetRr;
                
                if (calcTargetRr === 0 || result === '建値') {
                    targetRrText = "--";
                } else {
                    targetRrText = calcTargetRr.toFixed(2);
                }
            }
            if (closeVal !== "") {
                const closeP = parseFloat(closeVal);
                let actualRewardWidth = (side === "Short") ? (openP - closeP) : (closeP - openP);
                let calcActualRr = Math.abs(actualRewardWidth) / Math.abs(riskWidth);
                if (result === '負け') calcActualRr = -calcActualRr;

                if (calcActualRr === 0 || result === '建値') {
                    actualRrText = "--";
                } else {
                    actualRrText = calcActualRr.toFixed(2);
                }
            }
        }
    }

    currentCalculatedRr = { targetRr: targetRrText, actualRr: actualRrText };
    document.getElementById('liveRrBox').innerHTML = `
        <span>想定 RR 1 : ${targetRrText}</span>
        <span>実際 RR 1 : ${actualRrText}</span>
    `;
}

function runTimeConverter() {
    const timeStr = document.getElementById('foreignTimeInput').value.trim();
    const isSummer = document.getElementById('isSummerTime').checked;
    const targetSelect = document.getElementById('timeConvertTarget').value;
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    
    if (!timeRegex.test(timeStr)) {
        alert("お時間は「7:41」のように半角コロンで区切って入力してくださいね。");
        return;
    }

    const [hours, minutes] = timeStr.split(':').map(Number);
    let jstHours = (hours + 6) % 24;
    const formattedTime = `${String(jstHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    if (targetSelect === "open") {
        document.getElementById('tradeTime').value = formattedTime;
    } else {
        document.getElementById('closeTime').value = formattedTime;
    }

    let market = "";
    let asiaStart = 8, asiaEnd = 16;
    let lonStart = isSummer ? 15 : 16;
    let lonEnd = isSummer ? 23 : 24;

    if (jstHours >= asiaStart && jstHours < asiaEnd) {
        market = "アジア";
    } else if (jstHours >= lonStart && jstHours < lonEnd) {
        market = "ロンドン";
    } else {
        if (isSummer) {
            if (jstHours >= 23 || jstHours < 6) market = "ニューヨーク";
        } else {
            if (jstHours >= 0 && jstHours < 7) market = "ニューヨーク";
        }
    }

    if(!market) market = "アジア"; 
    activateButtonInGroup('marketGroup', market);
    autoCalculateAllMetrics();
}

function saveTradeLog() {
    const date = document.getElementById('tradeDate').value;
    const time = document.getElementById('tradeTime').value.trim();
    let pair = getSelectedVal('pairGroup');
    
    if (!date || !time || !pair) {
        alert("日にち、時間、通貨ペアは必ず選んで入力してくださいね。");
        return;
    }

    if (pair === 'その他') {
        pair = document.getElementById('customPairInput').value.trim() || "その他";
    }

    const editingId = document.getElementById('editingId').value;
    const pips = document.getElementById('pipsInput').value;
    const pnl = document.getElementById('pnlInput').value;

    autoCalculateAllMetrics();

    const logData = {
        date, 
        time,
        closeDate: document.getElementById('closeDate').value || "",
        closeTime: document.getElementById('closeTime').value.trim() || "",
        holdingMinutes: currentHoldingMinutes, 
        market: getSelectedVal('marketGroup') || "-",
        pair,
        monthly: getSelectedVal('monthlyGroup') || "-",
        weekly: getSelectedVal('weeklyGroup') || "-",
        daily: getSelectedVal('dailyGroup') || "-",
        bias: getSelectedVal('biasGroup') || "-",
        side: getSelectedVal('sideGroup') || "-",
        result: getSelectedVal('resultGroup') || "-",
        openPrice: document.getElementById('openPriceInput').value || "-",
        closePrice: document.getElementById('closePriceInput').value || "-",
        tpPrice: document.getElementById('tpPriceInput').value || "-",
        slPrice: document.getElementById('slPriceInput').value || "-",
        lot: document.getElementById('lotInput').value || "-",
        pips: pips !== "" ? parseFloat(pips) : 0,
        pnl: pnl !== "" ? parseFloat(pnl) : 0,
        emotion: getSelectedVal('emotionGroup') || "-",
        memo: document.getElementById('memoInput').value.trim() || "-",
        targetRr: currentCalculatedRr.targetRr,
        actualRr: currentCalculatedRr.actualRr
    };

    let trades = JSON.parse(localStorage.getItem('dark_trades')) || [];

    if (editingId) {
        trades = trades.map(t => (t.id === parseInt(editingId) ? { ...t, ...logData } : t));
        alert("記録を更新いたしましたわ！");
    } else {
        logData.id = Date.now();
        trades.unshift(logData);
        alert("トレードを保存いたしましたわ！");
    }

    localStorage.setItem('dark_trades', JSON.stringify(trades));
    setFormToNewMode();
    refreshApp();
    switchTab('list');
}

function setFormToNewMode() {
    document.getElementById('editingId').value = "";
    document.getElementById('formTitle').innerText = "📊 新規トレード記録";
    document.getElementById('submitBtn').innerText = "このトレードを保存する";

    document.getElementById('tradeTime').value = "";
    document.getElementById('closeTime').value = "";
    document.getElementById('foreignTimeInput').value = "";
    document.getElementById('openPriceInput').value = "";
    document.getElementById('closePriceInput').value = "";
    document.getElementById('tpPriceInput').value = "";
    document.getElementById('slPriceInput').value = "";
    document.getElementById('lotInput').value = "";
    document.getElementById('pipsInput').value = "";
    document.getElementById('pnlInput').value = "";
    document.getElementById('memoInput').value = "";
    document.getElementById('customPairInput').value = "";
    document.getElementById('customPairInput').style.display = "none";
    document.querySelectorAll('.select-btn').forEach(btn => btn.classList.remove('active'));
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tradeDate').value = today;
    document.getElementById('closeDate').value = today;
    updateDstDefault(); 

    currentHoldingMinutes = null;
    document.getElementById('liveHoldingBox').innerText = `保有時間: --`;
    currentCalculatedRr = { targetRr: "--", actualRr: "--" };
    document.getElementById('liveRrBox').innerHTML = `<span>想定 RR 1 : --</span><span>実際 RR 1 : --</span>`;
}