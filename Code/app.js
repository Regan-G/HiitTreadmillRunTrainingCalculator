// HIIT Treadmill Lap Calculator
(function(){
  const defaultIntervals = [4,1,1,1,1,1,1];
  const defaultSpeeds = [9.5,10,10.5,11,11.5,12,12.5];

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
        <td class="dist" data-idx="${idx}">${formatKm(distanceFor(it))}</td>
      `;
      intervalsTblBody.appendChild(tr);
    });
    attachBaseInputs();
  }

  function attachBaseInputs(){
    intervalsTblBody.querySelectorAll('input').forEach(inp=>{
      inp.addEventListener('input', e=>{
        const idx = Number(e.target.dataset.idx);
        const field = e.target.dataset.field;
        const val = parseFloat(e.target.value) || 0;
        base[idx][field] = val;
        intervalsTblBody.querySelector(`.dist[data-idx=\"${idx}\"]`).textContent = formatKm(distanceFor(base[idx]));
      });
    });
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
    let totalKm = 0;
    let totalMinutes = 0;
    const breakdownHtml = [];

    for(let l=0;l<laps;l++){
      const lapIntervals = (replicate || !lapOverrides[l]) ? base : lapOverrides[l];
      let lapKm = 0, lapMin = 0;
      const rows = [];
      lapIntervals.forEach((it,idx)=>{
        const d = it.duration;
        const s = it.speed;
        const km = distanceFor(it);
        lapKm += km;
        lapMin += d;
        rows.push(`<div>Interval ${idx+1}: ${d} min @ ${s} km/h → ${formatKm(km)}</div>`);
      });
      totalKm += lapKm;
      totalMinutes += lapMin;
      breakdownHtml.push(`<div class="lap-card"><strong>Lap ${l+1} — ${formatKm(lapKm)} — ${lapMin.toFixed(2)} min</strong>${rows.join('')}</div>`);
    }

    summary.innerHTML = `<div class="summary-block"><div><strong>Total distance:</strong> ${formatKm(totalKm)}</div><div><strong>Total time:</strong> ${formatTime(totalMinutes)}</div></div>`;
    breakdown.innerHTML = breakdownHtml.join('');
    results.style.display = '';
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
      const thead = document.createElement('thead'); thead.innerHTML = '<tr><th>#</th><th>Duration (min)</th><th>Speed (km/h)</th><th>Distance</th></tr>';
      const tbody = document.createElement('tbody');
      lap.forEach((it,idx)=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${idx+1}</td>
          <td><input class="interval-input" data-lap="${li}" data-idx="${idx}" data-field="duration" type="number" min="0" step="0.1" value="${it.duration}"></td>
          <td><input class="interval-input" data-lap="${li}" data-idx="${idx}" data-field="speed" type="number" min="0" step="0.1" value="${it.speed}"></td>
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
  });

  lapsCountInput.addEventListener('change', ()=>{
    const val = Math.max(1, Number(lapsCountInput.value)||1);
    lapsCountInput.value = val;
    if(!replicateChk.checked){
      renderLapOverrides();
    }
  });

  addLapBtn.addEventListener('click', ()=>{
    if(replicateChk.checked) return alert('Uncheck "Replicate base lap" to add lap-specific intervals.');
    lapOverrides.push(base.map(it=>({duration:it.duration, speed:it.speed})))
    lapsCountInput.value = lapOverrides.length;
    renderLapOverrides();
  });

  calcBtn.addEventListener('click', ()=>{
    calculate();
  });

  resetBtn.addEventListener('click', ()=>{
    base = defaultIntervals.map((d,i)=>({duration: d, speed: defaultSpeeds[i] || 10}));
    lapOverrides = [];
    lapsCountInput.value = 1;
    replicateChk.checked = true;
    extraLapsSection.style.display = 'none';
    results.style.display = 'none';
    renderBaseTable();
  });

  // initial render
  renderBaseTable();
})();
