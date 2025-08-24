// HIIT Treadmill Lap Calculator
(function(){
  const defaultIntervals = [2,2,1,1,1,1,1,1];
  const defaultSpeeds = [9.5,9.8,10,10.5,11,11.5,12,12.5];

  const intervalsTblBody = document.querySelector('#intervalsTbl tbody');
  const lapsCountInput = document.getElementById('lapsCount');
  const replicateChk = document.getElementById('replicateLap');
  const addLapBtn = document.getElementById('addLapBtn');
  const calcBtn = document.getElementById('calcBtn');
  const resetBtn = document.getElementById('resetBtn');
  const extraLapsSection = document.getElementById('extraLaps');
  const lapsContainer = document.getElementById('lapsContainer');
  const results = document.getElementById('results');
  const summary = document.getElementById('summary');
  const breakdown = document.getElementById('breakdown');
  const overviewDistanceEl = document.getElementById('overviewDistance');
  const overviewTimeEl = document.getElementById('overviewTime');
  const overviewAvgPaceEl = document.getElementById('overviewAvgPace');
  const targetPaceInput = document.getElementById('targetPace');
  const downloadBtn = document.getElementById('downloadBtn');
  const baseLapAvgPaceEl = document.getElementById('baseLapAvgPace');
  const baseLapTotalDistEl = document.getElementById('baseLapTotalDist');
  const limitDistanceChk = document.getElementById('limitDistance');
  const targetDistanceInput = document.getElementById('targetDistance');
  const goalDistanceInfo = document.getElementById('goalDistanceInfo');
  const goalReachedAt = document.getElementById('goalReachedAt');
  const autoIncrementChk = document.getElementById('autoIncrement');
  const autoIncrementStepInput = document.getElementById('autoIncrementStep');
  const propagateAutoIncChk = document.getElementById('propagateAutoIncrement');

  // state
  let base = defaultIntervals.map((d,i)=>({duration: d, speed: defaultSpeeds[i] || 10}));
  let lapOverrides = []; // per-lap intervals when not replicating

  function renderBaseTable(){
    intervalsTblBody.innerHTML = '';
    base.forEach((it,idx)=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${idx+1}</td>
        <td><input class="interval-input" type="number" min="0" step="0.1" data-idx="${idx}" data-field="duration" value="${it.duration}"></td>
    <td><input class="interval-input" type="number" min="0" step="0.1" data-idx="${idx}" data-field="speed" value="${it.speed}"></td>
    <td class="pace" data-idx="${idx}">${formatPace(speedToPace(it.speed))}</td>
    <td class="dist" data-idx="${idx}">${formatKm(distanceFor(it))}</td>
      `;
      intervalsTblBody.appendChild(tr);
    });
    attachBaseInputs();
  computeOverview();
  }

  function attachBaseInputs(){
    intervalsTblBody.querySelectorAll('input').forEach(inp=>{
      inp.addEventListener('input', e=>{
        const idx = Number(e.target.dataset.idx);
        const field = e.target.dataset.field;
        const val = parseFloat(e.target.value) || 0;
        base[idx][field] = val;
        intervalsTblBody.querySelector(`.dist[data-idx=\"${idx}\"]`).textContent = formatKm(distanceFor(base[idx]));
        const paceEl = intervalsTblBody.querySelector(`.pace[data-idx=\"${idx}\"]`);
        if(paceEl) paceEl.textContent = formatPace(speedToPace(base[idx].speed));
        computeOverview();
        // if auto-increment enabled and first speed changed, apply incremental steps
        if(autoIncrementChk && autoIncrementChk.checked && field === 'speed' && idx === 0){
          const step = parseFloat(autoIncrementStepInput.value) || 0.5;
          for(let i=1;i<base.length;i++){
            base[i].speed = +(base[0].speed + step * i).toFixed(2);
          }
          // optionally propagate to existing lapOverrides
          if(propagateAutoIncChk && propagateAutoIncChk.checked){
            lapOverrides = lapOverrides.map(lap => lap.map((it,i) => ({duration: it.duration, speed: +(base[i].speed)})));
          }
          // re-render base table and overrides to reflect updated speeds and paces
          renderBaseTable();
          if(!replicateChk.checked) renderLapOverrides();
        }
      });
    });
  }

  function speedToPace(kmh){
    if(!kmh || kmh <= 0) return Infinity; // min per km
    return 60 / kmh;
  }
  function formatPace(minPerKm){
    if(!isFinite(minPerKm)) return '—';
    const totalSeconds = Math.round(minPerKm * 60);
    const mins = Math.floor(totalSeconds/60);
    const secs = totalSeconds % 60;
    return `${String(mins)}:${String(secs).padStart(2,'0')} /km`;
  }

  function parsePace(text){
    // accept mm:ss or m:ss or mm:ss /km
    if(!text) return NaN;
    const m = text.trim().match(/^(\d+):(\d{1,2})/);
    if(!m) return NaN;
    const mins = parseInt(m[1],10);
    const secs = parseInt(m[2],10);
    return (mins + secs/60);
  }

  function paceColorClass(minPerKm){
    const target = parsePace(targetPaceInput.value);
    if(!isFinite(minPerKm) || isNaN(target)) return '';
    // faster than target -> green, close -> yellow, slower -> red
    if(minPerKm <= target - 0.15) return 'pace-good';
    if(minPerKm <= target + 0.15) return 'pace-ok';
    return 'pace-bad';
  }

  function computeOverview(){
    const laps = Math.max(1, Number(lapsCountInput.value)||1);
    const replicate = replicateChk.checked;
    let totalKm = 0;
    let totalMinutes = 0;
    for(let l=0;l<laps;l++){
      const lapIntervals = (replicate || !lapOverrides[l]) ? base : lapOverrides[l];
      lapIntervals.forEach(it=>{
        totalKm += distanceFor(it);
        totalMinutes += it.duration;
      });
    }
    overviewDistanceEl.textContent = formatKm(totalKm);
    overviewTimeEl.textContent = formatTime(totalMinutes);
  // average pace for all laps combined (min per km)
  const avgPaceAll = totalKm > 0 ? (totalMinutes / totalKm) : Infinity;
  overviewAvgPaceEl.textContent = formatPace(avgPaceAll);
    // base lap avg and total
    const baseKm = base.reduce((s,it)=>s+distanceFor(it),0);
    const baseMin = base.reduce((s,it)=>s+it.duration,0);
    const baseAvg = baseKm>0 ? (baseMin / baseKm) : Infinity;
    baseLapAvgPaceEl.textContent = formatPace(baseAvg);
    baseLapTotalDistEl.textContent = formatKm(baseKm);
    // color-code base table pace cells
    intervalsTblBody.querySelectorAll('.pace').forEach((el,idx)=>{
      const p = speedToPace(base[idx].speed);
      el.className = 'pace ' + paceColorClass(p);
    });
  // goal info
  const limit = limitDistanceChk.checked;
  const goal = parseFloat(targetDistanceInput.value) || 0;
  goalDistanceInfo.textContent = limit ? `${goal.toFixed(2)} km` : '—';
  goalReachedAt.textContent = '—';
  }

  function distanceFor(it){
    return (it.speed * (it.duration/60));
  }
  function formatKm(km){
    return km.toFixed(3) + ' km';
  }
  function formatTime(totalMinutes){
    const totalSeconds = Math.round(totalMinutes * 60);
    const hrs = Math.floor(totalSeconds/3600);
    const mins = Math.floor((totalSeconds%3600)/60);
    const secs = totalSeconds%60;
    return `${hrs>0?hrs+':':''}${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  }

  function calculate(){
    const laps = Math.max(1, Number(lapsCountInput.value)||1);
    const replicate = replicateChk.checked;
    const limit = limitDistanceChk.checked;
    const goal = parseFloat(targetDistanceInput.value) || 0;

    let totalKm = 0;
    let totalMinutes = 0;
    const breakdownHtml = [];
    let goalReached = false;
    let goalInfo = null;

    for(let l=0;l<laps && !goalReached;l++){
      const lapIntervals = (replicate || !lapOverrides[l]) ? base : lapOverrides[l];
      let lapKm = 0, lapMin = 0;
      const rows = [];
      for(let idx=0; idx<lapIntervals.length && !goalReached; idx++){
        const it = lapIntervals[idx];
        const d = it.duration;
        const s = it.speed;
        const km = distanceFor(it);
        // if limiting by distance, check whether this interval would exceed the goal
        if(limit && goal > 0 && (totalKm + km) >= goal){
          // compute partial duration needed inside this interval to reach goal
          const remainingKm = goal - totalKm;
          const fraction = remainingKm / km; // portion of interval
          const minutesNeeded = d * fraction;
          const partialKm = remainingKm;
          lapKm += partialKm;
          lapMin += minutesNeeded;
          rows.push(`<div>Interval ${idx+1}: ${minutesNeeded.toFixed(3)} min of ${d} min @ ${s} km/h → ${formatKm(partialKm)} (partial)</div>`);
          totalKm += partialKm;
          totalMinutes += minutesNeeded;
          goalReached = true;
          goalInfo = {lap: l+1, interval: idx+1, minutes: totalMinutes, distance: totalKm};
          break;
        } else {
          lapKm += km;
          lapMin += d;
          rows.push(`<div>Interval ${idx+1}: ${d} min @ ${s} km/h → ${formatKm(km)}</div>`);
          totalKm += km;
          totalMinutes += d;
        }
      }
      const lapAvgPace = lapKm > 0 ? (lapMin / lapKm) : Infinity;
      breakdownHtml.push(`<div class="lap-card"><strong>Lap ${l+1} — ${formatKm(lapKm)} — ${lapMin.toFixed(2)} min — avg pace: ${formatPace(lapAvgPace)}</strong>${rows.join('')}</div>`);
    }

    summary.innerHTML = `<div class="summary-block"><div><strong>Total distance:</strong> ${formatKm(totalKm)}</div><div><strong>Total time:</strong> ${formatTime(totalMinutes)}</div></div>`;
    breakdown.innerHTML = breakdownHtml.join('');
    results.style.display = '';

    // show goal reached info
    if(limit && goal > 0){
      if(goalReached && goalInfo){
        goalReachedAt.textContent = `Lap ${goalInfo.lap}, interval ${goalInfo.interval} — ${formatTime(goalInfo.minutes)} (reached ${goalInfo.distance.toFixed(3)} km)`;
      } else {
        goalReachedAt.textContent = 'Not reached';
      }
    } else {
      goalReachedAt.textContent = '—';
    }
  }

  function ensureLapOverridesCount(count){
    while(lapOverrides.length < count){
      // clone base
  lapOverrides.push(base.map(it=>({duration:it.duration, speed:it.speed})))
    }
    while(lapOverrides.length > count) lapOverrides.pop();
  }

  function renderLapOverrides(){
    const laps = Math.max(1, Number(lapsCountInput.value)||1);
    ensureLapOverridesCount(laps);
    lapsContainer.innerHTML = '';
    lapOverrides.forEach((lap,li)=>{
      const card = document.createElement('div');
      card.className = 'lap-card';
      card.innerHTML = `<h3>Lap ${li+1}</h3>`;
      const tbl = document.createElement('table');
  const thead = document.createElement('thead'); thead.innerHTML = '<tr><th>#</th><th>Duration (min)</th><th>Speed (km/h)</th><th>Pace (min/km)</th><th>Distance</th></tr>';
      const tbody = document.createElement('tbody');
  lap.forEach((it,idx)=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${idx+1}</td>
          <td><input class="interval-input" data-lap="${li}" data-idx="${idx}" data-field="duration" type="number" min="0" step="0.1" value="${it.duration}"></td>
          <td><input class="interval-input" data-lap="${li}" data-idx="${idx}" data-field="speed" type="number" min="0" step="0.1" value="${it.speed}"></td>
          <td class="pace" data-lap="${li}" data-idx="${idx}">${formatPace(speedToPace(it.speed))}</td>
          <td class="dist" data-lap="${li}" data-idx="${idx}">${formatKm(distanceFor(it))}</td>`;
        tbody.appendChild(tr);
      });
      tbl.appendChild(thead); tbl.appendChild(tbody);
      card.appendChild(tbl);
      lapsContainer.appendChild(card);
    });
    // attach events
    lapsContainer.querySelectorAll('input').forEach(inp=>{
      inp.addEventListener('input', e=>{
        const li = Number(e.target.dataset.lap);
        const idx = Number(e.target.dataset.idx);
        const field = e.target.dataset.field;
        const val = parseFloat(e.target.value)||0;
        lapOverrides[li][idx][field] = val;
        const el = lapsContainer.querySelector(`.dist[data-lap=\"${li}\"][data-idx=\"${idx}\"]`);
        if(el) el.textContent = formatKm(distanceFor(lapOverrides[li][idx]));
        const paceEl = lapsContainer.querySelector(`.pace[data-lap=\"${li}\"][data-idx=\"${idx}\"]`);
        if(paceEl) paceEl.textContent = formatPace(speedToPace(lapOverrides[li][idx].speed));
  if(paceEl) paceEl.className = 'pace ' + paceColorClass(speedToPace(lapOverrides[li][idx].speed));
        computeOverview();
      });
    });
  }

  // events
  replicateChk.addEventListener('change', ()=>{
    if(replicateChk.checked){
      extraLapsSection.style.display = 'none';
    } else {
      extraLapsSection.style.display = '';
      renderLapOverrides();
    }
  computeOverview();
  });

  lapsCountInput.addEventListener('change', ()=>{
    const val = Math.max(1, Number(lapsCountInput.value)||1);
    lapsCountInput.value = val;
    if(!replicateChk.checked){
      renderLapOverrides();
    }
  computeOverview();
  });

  addLapBtn.addEventListener('click', ()=>{
    if(replicateChk.checked) return alert('Uncheck "Replicate base lap" to add lap-specific intervals.');
    lapOverrides.push(base.map(it=>({duration:it.duration, speed:it.speed})))
    lapsCountInput.value = lapOverrides.length;
    renderLapOverrides();
  computeOverview();
  });

  calcBtn.addEventListener('click', ()=>{
    calculate();
  });

  downloadBtn.addEventListener('click', ()=>{
    // build CSV: lap,interval,duration_min,speed_kmh,distance_km
    const laps = Math.max(1, Number(lapsCountInput.value)||1);
    const replicate = replicateChk.checked;
    const rows = [['lap','interval','duration_min','speed_kmh','distance_km']];
    for(let l=0;l<laps;l++){
      const lapIntervals = (replicate || !lapOverrides[l]) ? base : lapOverrides[l];
      lapIntervals.forEach((it,idx)=>{
        rows.push([l+1, idx+1, it.duration, it.speed, distanceFor(it).toFixed(6)]);
      });
    }
    const csv = rows.map(r=>r.join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hiit_laps.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  resetBtn.addEventListener('click', ()=>{
    base = defaultIntervals.map((d,i)=>({duration: d, speed: defaultSpeeds[i] || 10}));
    lapOverrides = [];
    lapsCountInput.value = 1;
    replicateChk.checked = true;
    extraLapsSection.style.display = 'none';
    results.style.display = 'none';
    renderBaseTable();
  computeOverview();
  });

  // initial render
  renderBaseTable();
  computeOverview();

  // Local address discovery removed; UI no longer shows local addresses.
})();
