// 24時間データ集計・通貨別平均保有時間・テキストグラフ出力関連ロジック
function calculateStatistics(trades) {
    const total = trades.length;
    document.getElementById('statTotalTrades').innerText = total;

    if(total === 0) {
        document.getElementById('statWinRate').innerText = "0%";
        document.getElementById('statWLD').innerText = "0勝 0敗 0分";
        document.getElementById('statTotalPnl').innerText = "0 USD";
        document.getElementById('statTotalPips').innerText = "0 pips";
        document.getElementById('emotionStatList').innerHTML = "データがありません";
        document.getElementById('pairStatList').innerHTML = "データがありません";
        document.getElementById('openTimeStatList').innerHTML = "データがありません";
        document.getElementById('closeTimeStatList').innerHTML = "データがありません";
        return;
    }

    let wins = 0, loses = 0, draws = 0;
    let totalPnl = 0, totalPips = 0;
    let emotions = { 冷静: 0, 焦り: 0, 不安: 0, "-": 0 };
    let pairs = {};

    let openHourlyCounts = Array(24).fill(0);
    let closeHourlyCounts = Array(24).fill(0);

    trades.forEach(t => {
        if (t.result === '勝ち') wins++;
        else if (t.result === '負け') loses++;
        else if (t.result === '建値') draws++;

        totalPnl += t.pnl;
        totalPips += t.pips;

        if(emotions[t.emotion] !== undefined) emotions[t.emotion]++;

        if(!pairs[t.pair]) {
            pairs[t.pair] = { total: 0, wins: 0, loses: 0, draws: 0, holdingMinutesList: [] };
        }
        pairs[t.pair].total++;
        if (t.result === '勝ち') pairs[t.pair].wins++;
        else if (t.result === '負け') pairs[t.pair].loses++;
        else if (t.result === '建値') pairs[t.pair].draws++;
        
        if(t.holdingMinutes !== undefined && t.holdingMinutes !== null) {
            pairs[t.pair].holdingMinutesList.push(t.holdingMinutes);
        }

        if (t.time && t.time.includes(":")) {
            const h = parseInt(t.time.split(":")[0], 10);
            if (!isNaN(h) && h >= 0 && h < 24) openHourlyCounts[h]++;
        }
        if (t.closeTime && t.closeTime.includes(":")) {
            const h = parseInt(t.closeTime.split(":")[0], 10);
            if (!isNaN(h) && h >= 0 && h < 24) closeHourlyCounts[h]++;
        }
    });

    const winRate = ((wins / (wins + loses || 1)) * 100).toFixed(1);
    document.getElementById('statWinRate').innerText = `${winRate}%`;
    document.getElementById('statWLD').innerText = `${wins}勝 ${loses}敗 ${draws}分`;
    
    document.getElementById('statTotalPnl').innerText = `${totalPnl.toFixed(2)} USD`;
    document.getElementById('statTotalPnl').style.color = totalPnl >= 0 ? 'var(--color-win)' : 'var(--color-lose)';
    document.getElementById('statTotalPips').innerText = `${totalPips.toFixed(1)} pips`;
    document.getElementById('statTotalPips').style.color = totalPips >= 0 ? 'var(--color-win)' : 'var(--color-lose)';

    const emotionContainer = document.getElementById('emotionStatList');
    emotionContainer.innerHTML = "";
    let validEmotionTotal = total - emotions["-"];
    for (let key in emotions) {
        if(key === "-") continue;
        const count = emotions[key];
        const rate = validEmotionTotal > 0 ? ((count / validEmotionTotal) * 100).toFixed(1) : "0.0";
        const item = document.createElement('div');
        item.className = 'stat-item';
        item.innerHTML = `<span>${key}</span><span>${rate}% (${count}回)</span>`;
        emotionContainer.appendChild(item);
    }

    const pairContainer = document.getElementById('pairStatList');
    pairContainer.innerHTML = "";
    for (let p in pairs) {
        const pData = pairs[p];
        const pRate = ((pData.wins / (pData.wins + pData.loses || 1)) * 100).toFixed(1);
        
        let avgHoldingStr = "--分";
        if (pData.holdingMinutesList.length > 0) {
            const sum = pData.holdingMinutesList.reduce((a, b) => a + b, 0);
            avgHoldingStr = `${Math.floor(sum / pData.holdingMinutesList.length)}分`;
        }

        const item = document.createElement('div');
        item.className = 'stat-item';
        item.innerHTML = `
            <span style="font-weight:bold;">${p} <br><small style="color:#ecc94b; font-weight:normal;">平均保有: ${avgHoldingStr}</small></span>
            <span style="text-align:right;">勝率 ${pRate}% <br><small style="color:var(--text-muted)">(${pData.wins}勝 ${pData.loses}敗 ${pData.draws}分)</small></span>
        `;
        pairContainer.appendChild(item);
    }

    renderTextChart(document.getElementById('openTimeStatList'), openHourlyCounts);
    renderTextChart(document.getElementById('closeTimeStatList'), closeHourlyCounts);
}

function renderTextChart(containerElement, hourlyArray) {
    containerElement.innerHTML = "";
    for (let h = 0; h < 24; h++) {
        const count = hourlyArray[h];
        const label = String(h).padStart(2, '0') + "時";
        
        let barStr = "";
        if(count > 0) {
            barStr = "█".repeat(count);
        }

        const row = document.createElement('div');
        row.className = 'chart-row';
        row.innerHTML = `
            <span class="chart-label">${label}</span>
            <span class="chart-bar">${barStr}</span>
            <span class="chart-count">${count}回</span>
        `;
        containerElement.appendChild(row);
    }
}