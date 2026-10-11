/* WildWalk shared script. Each page only runs the parts whose elements exist. */
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
// fetch JSON with a timeout so the loader can never hang forever
const J=async(u,o={},ms=30000)=>{const c=new AbortController,t=setTimeout(()=>c.abort(),ms);
  try{const r=await fetch(u,{...o,signal:c.signal});if(!r.ok)throw new Error("HTTP "+r.status);return await r.json()}finally{clearTimeout(t)}};
// safe localStorage (private mode can block it)
const store={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};

/* loader: shows on page open and while planning */
document.body.insertAdjacentHTML("afterbegin",'<div id="ld" class="on"><div class="bx"><i></i><i></i><i></i></div><p id="ldt">Loading WildWalk…</p></div>');
const load=(on,t)=>{$("#ld").classList.toggle("on",on);if(t)$("#ldt").textContent=t};
addEventListener("load",()=>setTimeout(()=>load(false),900));
addEventListener("pageshow",e=>{if(e.persisted)load(false)});

/* shared nav + footer */
const pages=[["index.html","Plan"],["journal.html","Journal"],["learn.html","Learn"]];
const here=location.pathname.split("/").pop()||"index.html";
$("#nav").innerHTML=`<div class="w bar"><a class="logo" href="index.html">🌿 WildWalk</a><nav>${pages.map(p=>`<a href="${p[0]}"${p[0]==here?' class="cur" aria-current="page"':""}>${p[1]}</a>`).join("")}</nav></div>`;
$("#foot").innerHTML='<div class="w">WildWalk · Hacktoberfest 2026 Open-Source AI Challenge · Weather and air quality by <a href="https://open-meteo.com" target="_blank" rel="noopener">Open-Meteo</a> · Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a></div>';

const plain=t=>String(t||"").replace(/\*\*/g,"");
let cur=null;
const say=t=>{if(!("speechSynthesis" in window))return false;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(plain(t));u.lang="en-IN";speechSynthesis.speak(u);return true};

/* ---------- PLAN PAGE ---------- */
if($("#f")){
  let mins=20,timer=null;
  const err=m=>{const e=$("#err");e.textContent=m||"";e.style.display=m?"block":"none"};
  const fmt=s=>String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");

  // city -> coordinates, then fill temperature, humidity and AQI from Open-Meteo (free, no key)
  async function geo(city){
    const g=await J("https://geocoding-api.open-meteo.com/v1/search?count=1&name="+encodeURIComponent(city),{},10000);
    const p=g.results&&g.results[0];if(!p)throw new Error("City not found: "+city);
    try{const q=`latitude=${p.latitude}&longitude=${p.longitude}`;
      const [w,a]=await Promise.all([J(`https://api.open-meteo.com/v1/forecast?${q}&current=temperature_2m,relative_humidity_2m`,{},10000),
        J(`https://air-quality-api.open-meteo.com/v1/air-quality?${q}&current=us_aqi`,{},10000)]);
      $("#t").value=Math.round(w.current.temperature_2m);$("#h").value=Math.round(w.current.relative_humidity_2m);$("#a").value=Math.round(a.current.us_aqi);
    }catch(e){console.warn("weather failed",e)}
    return p;
  }
  // parks and gardens near the city from OpenStreetMap (used only when the backend gives no spots)
  async function nearby(p){
    const at=`around:4000,${p.latitude},${p.longitude}`,q=`[out:json][timeout:12];(way[leisure=park](${at});way[leisure=garden](${at}););out center 12;`;
    const d=await J("https://overpass-api.de/api/interpreter",{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body:"data="+encodeURIComponent(q)},15000);
    return d.elements.filter(e=>e.tags&&e.tags.name).slice(0,4).map(e=>({title:e.tags.name,snippet:"Park or garden within about 4 km. Opens on the map.",
      link:`https://www.openstreetmap.org/?mlat=${e.center.lat}&mlon=${e.center.lon}#map=17/${e.center.lat}/${e.center.lon}`}));
  }
  // simple local score (0-10) used only if the backend is unreachable; NOT the TabPFN model
  function localPack(city,t,h,a,spots){
    const s=Math.max(0,Math.min(10,10-Math.abs(t-22)*.25-Math.max(0,h-65)*.05-Math.max(0,a-50)*.04));
    const tips=[];
    if(t>32)tips.push("It is hot, so carry water and walk before 8 am or after 5 pm.");else if(t<10)tips.push("It is cold, so wear layers and keep moving.");else tips.push("The temperature is comfortable for walking.");
    if(h>75)tips.push("Humidity is high and it will feel muggy, so go slow.");
    if(a>150)tips.push("Air quality is poor, so keep the walk very short or stay in.");else if(a>100)tips.push("Air quality is moderate, so avoid busy roads and choose a park.");else tips.push("The air is fine for a long walk.");
    const txt=`**${city}** walk guide\nScore ${s.toFixed(1)}/10 at ${t}°C, ${h}% humidity, AQI ${a}.\n\n${tips.join(" ")}\n\nPut your phone in your pocket, look up, and notice three birds, two trees and one sound.`;
    return{score:s,text:txt,spots,id:"local-"+Date.now(),local:true};
  }

  function show(r,city){
    cur=r;$("#res").style.display="block";$("#rtitle").textContent=city+" walk pack";
    const s=+r.score||0;$("#sc").textContent=s.toFixed(1);$("#bar").style.width=Math.min(100,s*10)+"%";
    $("#verdict").textContent=s>=7?"Go now 🌳":s>=5?"Okay, dress smart":"Short walk or skip";
    $("#guide").innerHTML=esc(r.text||"").replace(/\*\*(.+?)\*\*/g,"<b>$1</b>");
    const au=$("#au");if(r.audio){au.src=r.audio;au.style.display="block";$("#say").style.display="none"}else{au.removeAttribute("src");au.style.display="none";$("#say").style.display="inline-block"}
    $("#note").style.display=r.local?"block":"none";
    $("#spots").innerHTML=(r.spots||[]).slice(0,4).map(x=>`<a class="spot" href="${esc(x.link||"#")}" target="_blank" rel="noopener"><b>${esc(x.title)}</b><span>${esc((x.snippet||"").slice(0,110))}</span></a>`).join("")||'<div class="item">No spots found<span>Try a bigger city name.</span></div>';
    const a=store.get("ww",[]);a.unshift({city,score:s,id:r.id,ts:Date.now()});store.set("ww",a.slice(0,50));
    $("#res").scrollIntoView({behavior:"smooth"});
  }

  $("#f").addEventListener("submit",async e=>{
    e.preventDefault();err("");const btn=$("#f button");btn.disabled=true;
    const steps=["Finding spots…","Scoring the walk…","Checking facts…","Writing your guide…","Adding voice…"];let n=0;
    load(true,steps[0]);const tick=setInterval(()=>{n=Math.min(n+1,4);$("#ldt").textContent=steps[n]},6000);
    try{
      const city=$("#city").value.trim();let p={name:city};
      try{p=await geo(city)}catch(x){if(/not found/.test(x.message))throw x;console.warn(x)}
      const t=+$("#t").value,h=+$("#h").value,a=+$("#a").value;let r;
      try{r=await J("/walkpack",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({user:"web",city:p.name,temp_c:t,humidity:h,aqi:a})},60000)}
      catch(x){console.warn("backend unavailable",x);let sp=[];try{if(p.latitude)sp=await nearby(p)}catch(y){}r=localPack(p.name,t,h,a,sp)}
      show(r,p.name);
    }catch(x){err("Error: "+x.message)}
    clearInterval(tick);load(false);btn.disabled=false;
  });
  document.querySelectorAll(".hint button").forEach(b=>b.onclick=()=>{$("#city").value=b.dataset.c;$("#f").requestSubmit()});
  $("#share").onclick=()=>{navigator.clipboard.writeText(cur?plain(cur.text):"").then(()=>{$("#share").textContent="Copied ✓"})};
  $("#say").onclick=()=>{if(cur)say(cur.text)};

  /* pocket mode: big timer, screen stays quiet */
  $("#pk").onclick=()=>{$("#pocket").style.display="flex";$("#clock").textContent=fmt(mins*60);$("#rate").style.display="none";$("#pstart").style.display="inline-block";$("#mins").style.display="block"};
  $("#mins").onclick=e=>{if(e.target.dataset.m){mins=+e.target.dataset.m;$("#clock").textContent=fmt(mins*60)}};
  $("#pstart").onclick=()=>{
    if(cur){if(cur.audio)$("#au").play().catch(()=>{});else say(cur.text)}
    let left=mins*60;$("#pstart").style.display="none";$("#mins").style.display="none";
    timer=setInterval(()=>{left--;$("#clock").textContent=fmt(Math.max(left,0));if(left<=0){clearInterval(timer);$("#rate").style.display="block"}},1000);
  };
  $("#rv").oninput=()=>$("#rl").textContent=$("#rv").value+" / 10";
  $("#rsave").onclick=async()=>{
    const n=new Date();
    try{await J("/sensor",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({temp_c:+$("#t").value,humidity:+$("#h").value,aqi:+$("#a").value,month:n.getMonth()+1,hour:n.getHours(),enjoyment:+$("#rv").value})},10000)}catch(e){}
    const a=store.get("ww",[]);if(a[0]){a[0].walked=mins;a[0].rating=+$("#rv").value;store.set("ww",a)}
    speechSynthesis&&speechSynthesis.cancel();$("#pocket").style.display="none";
  };
  $("#pclose").onclick=()=>{clearInterval(timer);$("#au").pause();speechSynthesis&&speechSynthesis.cancel();$("#pocket").style.display="none"};

  /* falling leaves behind the hero */
  (function(){const c=$("#leaves"),x=c.getContext("2d"),col=["#F2A33A","#9CC38A","#F6F2E4","#5A3B28"];let L=[];
    function size(){c.width=c.offsetWidth;c.height=c.offsetHeight;L=Array.from({length:Math.floor(c.width/28)},()=>({x:Math.random()*c.width,y:Math.random()*c.height,s:6+Math.floor(Math.random()*3)*4,v:.3+Math.random()*.7,c:col[Math.floor(Math.random()*4)]}))}
    size();addEventListener("resize",size);
    if(matchMedia("(prefers-reduced-motion:reduce)").matches){L.forEach(l=>{x.fillStyle=l.c;x.fillRect(l.x,l.y,l.s,l.s)});return}
    (function loop(){x.clearRect(0,0,c.width,c.height);L.forEach(l=>{l.y+=l.v;l.x+=Math.sin(l.y/40)*.5;if(l.y>c.height){l.y=-10;l.x=Math.random()*c.width}x.fillStyle=l.c;x.fillRect(Math.round(l.x),Math.round(l.y),l.s,l.s)});requestAnimationFrame(loop)})()})();
}

/* ---------- JOURNAL PAGE ---------- */
if($("#hist")){
  const draw=()=>{
    const a=store.get("ww",[]);
    $("#hist").innerHTML=a.length?a.map(x=>`<div class="item">${esc(x.city)} · ${(+x.score).toFixed(1)}/10<span>${new Date(x.ts).toLocaleString()}${x.walked?` · walked ${x.walked} min ✅`:""}${x.rating?` · you rated ${x.rating}/10`:""}</span></div>`).join(""):'<div class="item">No walks yet<span>Plan your first walk on the Plan page.</span></div>';
    const m=a.reduce((s,x)=>s+(x.walked||0),0),avg=a.length?a.reduce((s,x)=>s+(+x.score||0),0)/a.length:0;
    $("#stats").innerHTML=`<div class="item"><b>${a.length}</b>walks planned</div><div class="item"><b>${m}</b>minutes outside</div><div class="item"><b>${avg.toFixed(1)}</b>average score</div>`;
    $("#chart").innerHTML=a.slice(0,12).reverse().map(x=>`<i style="height:${Math.max(3,x.score*10)}%" title="${esc(x.city)} ${(+x.score).toFixed(1)}"></i>`).join("");
  };
  $("#exp").onclick=()=>{const a=store.get("ww",[]);const csv="city,score,date,minutes_walked,rating\n"+a.map(x=>[`"${x.city}"`,(+x.score).toFixed(1),new Date(x.ts).toISOString(),x.walked||"",x.rating||""].join(",")).join("\n");
    const l=document.createElement("a");l.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));l.download="wildwalk-journal.csv";l.click()};
  $("#clr").onclick=()=>{if(confirm("Delete all journal entries from this browser?")){store.set("ww",[]);draw()}};
  draw();
}

/* ---------- LEARN PAGE ---------- */
if($("#addf")){
  const draw=()=>{const a=store.get("wwfacts",[]);
    $("#facts").innerHTML=a.length?a.map((f,i)=>`<div class="item fact"><div>${esc(f.text)}<span>${f.synced?"Saved to the knowledge base":"Saved in this browser only"}</span></div><button class="plain" data-i="${i}">Remove</button></div>`).join(""):'<div class="item">No facts yet<span>Add one above.</span></div>'};
  $("#facts").onclick=e=>{const i=e.target.dataset.i;if(i===undefined)return;const a=store.get("wwfacts",[]);a.splice(+i,1);store.set("wwfacts",a);draw()};
  $("#addf").onclick=async()=>{const f=$("#fact").value.trim();if(!f)return;const m=$("#fmsg");let synced=true;
    try{await J("/kb?body="+encodeURIComponent(f),{method:"POST"},15000);m.textContent="Saved ✓ The next guide can use it."}
    catch(e){synced=false;m.textContent="Backend not reachable, so the fact is saved in this browser only."}
    const a=store.get("wwfacts",[]);a.unshift({text:f,synced});store.set("wwfacts",a.slice(0,50));$("#fact").value="";draw()};
  draw();
}
