// 一覧表示・カードレンダリング・インポート・エクスポート制御ロジック
function refreshApp() {
    const trades = JSON.parse(localStorage.getItem('dark_trades')) || [];
    document.getElementById('totalCountText').innerText = `${trades.length} 件の記録`;

    const cardContainer = document.getElementById('cardContainer');
    cardContainer.innerHTML = "";

    if(trades.length === 0) {
        cardContainer.innerHTML = `<p style="text-align:center; color:var(--text-muted); margin-top:30px;">まだ記録がありませんわ。【記録】タブから追加してくださいね。</p>`;
    } else {
        trades.forEach(t => {
            const card = document.createElement('div');
            card.className = 'trade-card';
            
            let pnlColor = 'var(--text-color)';
            if (t.pnl > 0) pnlColor = 'var(--color-win)';
            if (t.pnl < 0) pnlColor = 'var(--color-lose)';

            let envStr = "";
            if(t.monthly && t.monthly !== "-") envStr += `月:${t.monthly} `;
            if(t.weekly && t.weekly !== "-") envStr += `週:${t.weekly} `;
            if(t.daily && t.daily !== "-") envStr += `日:${t.daily} `;
            if(t.bias && t.bias !== "-") envStr += `目線:${t.bias}`;

            const tRr = t.targetRr !== undefined ? t.targetRr : "--";
            const aRr = t.actualRr !== undefined ? t.actualRr : "--";

            const dispOpenDate = t.date || "--";
            const dispOpenTime = t.time || "--";
            const dispCloseDate = t.closeDate || "--";
            const dispCloseTime = t.closeTime || "--";
            const dispHolding = (t.holdingMinutes !== undefined && t.holdingMinutes !== null) ? `${t.holdingMinutes}分` : "--分";

            card.innerHTML = `
                <div class="card-row1">
                    <span>📊 ${t.market || "-"}市場</span>
                    <span>😊 : ${t.emotion || "-"}</span>
                </div>
                <div class="card-row2">
                    ${t.side && t.side !== "-" ? `<span class="badge ${t.side}">${t.side === 'Long' ? 'ロング' : 'ショート'}</span>` : ''}
                    ${t.result && t.result !== "-" ? `<span class="badge ${t.result}">${t.result}</span>` : ''}
                    <span class="card-pair">${t.pair}</span>
                    ${envStr ? `<span class="badge env">${envStr}</span>` : ''}
                </div>
                
                <div class="card-time-display">
                    <div>
                        <span class="time-block-label">Open</span>
                        <strong>${dispOpenDate}</strong><br>${dispOpenTime}
                    </div>
                    <div>
                        <span class="time-block-label">Close</span>
                        <strong>${dispCloseDate}</strong><br>${dispCloseTime}
                    </div>
                    <div>
                        <span class="time-block-label">保有時間</span>
                        <span style="color:#ecc94b; font-weight:bold;">${dispHolding}</span>
                    </div>
                </div>

                <div class="card-line-prices">Open: ${t.openPrice}  Close: ${t.closePrice}  TP: ${t.tpPrice}  SL: ${t.slPrice}  RR 1 : ${tRr}</div>
                <div class="card-line-metrics">ロット: ${t.lot}  獲得: <span style="font-weight:bold; color:${t.pips >= 0 ? 'var(--color-win)':'var(--color-lose)'}">${t.pips} pips</span>  損益: <span style="font-weight:bold; color:${pnlColor}">${t.pnl} USD</span>  RR 1 : ${aRr}</div>

                <div class="card-memo">${(t.memo || "-").replace(/\n/g, '<br>')}</div>
                
                <div class="card-footer">
                    <button class="card-op-btn edit" onclick="editTrade(${t.id})">✏️ 編集</button>
                    <button class="card-op-btn delete" onclick="deleteTrade(${t.id})">🗑️ 削除</button>
                </div>
            `;
            cardContainer.appendChild(card);
        });
    }

    calculateStatistics(trades);
}

function editTrade(id) {
    const trades = JSON.parse(localStorage.getItem('dark_trades')) || [];
    const t = trades.find(item => item.id === id);
    if (!t) return;

    document.getElementById('editingId').value = t.id;
    document.getElementById('formTitle').innerText = "🔧 トレード記録を編集";
    document.getElementById('submitBtn').innerText = "修正内容を更新する";

    document.getElementById('tradeDate').value = t.date || "";
    document.getElementById('tradeTime').value = t.time || "";
    
    document.getElementById('closeDate').value = t.closeDate || t.date || "";
    document.getElementById('closeTime').value = t.closeTime || "";

    document.getElementById('openPriceInput').value = t.openPrice === "-" ? "" : t.openPrice;
    document.getElementById('closePriceInput').value = t.closePrice === "-" ? "" : t.closePrice;
    document.getElementById('tpPriceInput').value = t.tpPrice === "-" ? "" : t.tpPrice;
    document.getElementById('slPriceInput').value = t.slPrice === "-" ? "" : t.slPrice;
    document.getElementById('lotInput').value = t.lot === "-" ? "" : t.lot;
    document.getElementById('pipsInput').value = t.pips;
    document.getElementById('pnlInput').value = t.pnl;
    document.getElementById('memoInput').value = t.memo === "-" ? "" : t.memo;

    activateButtonInGroup('marketGroup', t.market);
    activateButtonInGroup('monthlyGroup', t.monthly);
    activateButtonInGroup('weeklyGroup', t.weekly);
    activateButtonInGroup('dailyGroup', t.daily);
    activateButtonInGroup('biasGroup', t.bias);
    activateButtonInGroup('sideGroup', t.side);
    activateButtonInGroup('resultGroup', t.result);
    activateButtonInGroup('emotionGroup', t.emotion);

    const basePairs = ["XAUUSD", "BTCUSD", "OIL", "USDJPY", "EURUSD", "AUDJPY", "AUDUSD", "EURJPY"];
    if (basePairs.includes(t.pair)) {
        activateButtonInGroup('pairGroup', t.pair);
        document.getElementById('customPairInput').style.display = "none";
    } else {
        activateButtonInGroup('pairGroup', "その他");
        const customInput = document.getElementById('customPairInput');
        customInput.style.display = "block";
        customInput.value = t.pair;
    }

    autoCalculateAllMetrics();
    switchTab('record');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteTrade(id) {
    if(confirm("このトレード記録を削除してもよろしくて？")) {
        let trades = JSON.parse(localStorage.getItem('dark_trades')) || [];
        trades = trades.filter(t => t.id !== id);
        localStorage.setItem('dark_trades', JSON.stringify(trades));
        refreshApp();
    }
}

function exportToCSV() {
    const trades = JSON.parse(localStorage.getItem('dark_trades')) || [];
    if(trades.length === 0) { alert("出力するデータがありませんわ。"); return; }

    let csvContent = "\uFEFF"; 
    csvContent += "日にち,時間,closeDate,closeTime,holdingMinutes,市場,通貨ペア,月足,週足,日足,目線,売買,結果,Open,Close,TP,SL,ロット,獲得PIPS,損益額USD,感情,想定RR,実際RR,メモ\n";

    trades.forEach(t => {
        const holdingVal = (t.holdingMinutes !== undefined && t.holdingMinutes !== null) ? t.holdingMinutes : "";
        const row = [
            t.date || "", 
            t.time || "", 
            t.closeDate || "", 
            t.closeTime || "", 
            holdingVal,
            t.market || "", 
            t.pair || "", 
            t.monthly || "", 
            t.weekly || "", 
            t.daily || "", 
            t.bias || "", 
            t.side || "", 
            t.result || "",
            t.openPrice || "", 
            t.closePrice || "", 
            t.tpPrice || "", 
            t.slPrice || "", 
            t.lot || "", 
            t.pips !== undefined ? t.pips : 0, 
            t.pnl !== undefined ? t.pnl : 0, 
            t.emotion || "",
            t.targetRr !== undefined ? t.targetRr : "--", 
            t.actualRr !== undefined ? t.actualRr : "--",
            `"${(t.memo || "").replace(/"/g, '""')}"`
        ].join(",");
        csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `trade_log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportToText() {
    const trades = localStorage.getItem('dark_trades');
    if(!trades || trades === "[]") { alert("出力するデータがありませんわ。"); return; }
    navigator.clipboard.writeText(trades).then(() => {
        alert("テキストをコピーしましたわ！");
    });
}

function importFromText() {
    const jsonText = prompt("データをここに貼り付けてくださいわ。");
    if(!jsonText) return;
    try {
        const parsed = JSON.parse(jsonText);
        if (Array.isArray(parsed)) {
            if(confirm("データを上書き復元してもよろしくて？")) {
                const upgraded = parsed.map(t => {
                    if(t.closeDate === undefined) t.closeDate = t.date || "";
                    if(t.closeTime === undefined) t.closeTime = "";
                    if(t.holdingMinutes === undefined) t.holdingMinutes = null;
                    return t;
                });
                localStorage.setItem('dark_trades', JSON.stringify(upgraded));
                refreshApp();
                alert("復元完了いたしましたわ！");
            }
        }
    } catch(e) { alert("失敗しました。データの形式をご確認くださいね。"); }
}

function clearAllData() {
    if(confirm("本当に全て削除しますの？")) {
        localStorage.removeItem('dark_trades');
        refreshApp();
    }
}