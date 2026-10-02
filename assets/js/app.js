'use strict';

// RELAY DEMO. All data is synthetic and independent of any operational export.
// No dependencies, network requests, credentials, analytics, or external fonts.
const DATES = ['2030-10-14', '2030-10-15', '2030-10-16'];
const SERVICES = ['Local move', 'Packing', 'Delivery', 'Storage', 'Office move'];
const LEVELS = {1:'Pack van', 2:'Straight truck · non-CDL', 3:'Straight truck · CDL-B', 4:'Tractor + trailer'};
const STATUS = {planning:'To plan', ready:'Ready to go', running:'In progress', done:'Completed'};
const COLORS = {planning:'#cca052',ready:'#5875e9',running:'#4b9b84',done:'#b6c0d2'};
const STORAGE_KEY = 'relay-fictional-dispatch-v1';
const clone = value => JSON.parse(JSON.stringify(value));
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $ = selector => document.querySelector(selector);
const num = value => Number(value).toLocaleString('en-US');
const dayLabel = (date, long=false) => new Date(date+'T12:00:00').toLocaleDateString('en-US', long ? {weekday:'long',month:'long',day:'numeric'} : {weekday:'short',day:'numeric'});
const minutes = time => { const [h,m] = time.split(':').map(Number); return h*60+m; };
const timeLabel = time => { const [h,m] = time.split(':').map(Number); return `${h%12||12}:${String(m).padStart(2,'0')} ${h<12?'am':'pm'}`; };
const initials = name => name.split(' ').map(s=>s[0]).slice(0,2).join('');
const paths = {
  board:'<rect x="3" y="3" width="7" height="18" rx="1.5"/><rect x="14" y="3" width="7" height="11" rx="1.5"/>',
  table:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11M3 14h18"/>',
  chart:'<path d="M4 4v16h17M8 15v-4M13 15V7M18 15v-7"/>',
  activity:'<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  shield:'<path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z"/><path d="m8 12 3 3 5-6"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  close:'<path d="m6 6 12 12M18 6 6 18"/>',
  download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 11h18M8 15h2M14 15h2"/>',
  chevronDown:'<path d="m6 9 6 6 6-6"/>',
  chevronRight:'<path d="m9 6 6 6-6 6"/>',
  arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
  undo:'<path d="m8 4-5 5 5 5M3 9h11a6 6 0 0 1 0 12"/>',
  redo:'<path d="m16 4 5 5-5 5m5-5H10a6 6 0 0 0 0 12"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  truck:'<path d="M3 6h11v11H3V6Zm11 5h4l3 4v2h-7"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
  people:'<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  box:'<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 5v10l9 4 9-4V8M12 13v9M7 6l10 5"/>',
  flag:'<path d="M5 21V4h7l2 2h6v10h-7l-2-2H5"/>',
  alert:'<path d="m12 3 10 18H2L12 3ZM12 9v5m0 3v.1"/>',
  filter:'<path d="M4 7h16M7 12h10m-7 5h4"/>',
  grip:'<circle cx="8" cy="5" r="1"/><circle cx="16" cy="5" r="1"/><circle cx="8" cy="12" r="1"/><circle cx="16" cy="12" r="1"/><circle cx="8" cy="19" r="1"/><circle cx="16" cy="19" r="1"/>',
  sort:'<path d="M8 4v16m-4-4 4 4 4-4M16 4v16m-4-12 4-4 4 4"/>',
  play:'<path d="m8 4 13 8-13 8V4Z"/>',
  refresh:'<path d="M20 7v5h-5M4 17v-5h5M5 8a8 8 0 0 1 14-3l1 2M4 17l1 2a8 8 0 0 0 14-3"/>'
};
const icon = name => `<svg aria-hidden="true" viewBox="0 0 24 24">${paths[name]||paths.box}</svg>`;

function makeRoster() {
  const names = {
    driver:['Avery Vale','Robin Finch','Quinn Mercer','Casey Rowan','Jordan Wren','Morgan Elwood','Reese Alder','Drew Hartwell','Taylor Birch','Cameron Moss'],
    foreman:['Sage Whitlock','Emery Lark','Blair Linden','Rory Ashby','Ellis North','Arden Brook','Lane Hollis','Remy Cedar','Marlow Quill'],
    mover:['Alex Bramble','Kit Harlow','Jules Meadow','Riley Fenwick','Charlie Westvale','Devon Pine','Finley Grove','Jamie Easton','Lennox Briar','Parker Woodby','Rowan Lake','Shay Darrow','Toby Ashwell','Winter Fordham','Frankie Dell','Harley Morrow','Milan Everly','Eden Glen'],
    packer:['Aspen Wilder','Bailey Solace','Dallas Shore','Haven Clover','Indigo Fields','Jesse Tilden','Kendall Fern','Logan Reeve','Oakley Marsh','Phoenix Sol','River Belden','Sky Arden']
  };
  const training=[3,1,3,3,4,2,3,2,4,3];
  return Object.entries(names).flatMap(([role,list])=>list.map((name,i)=>({
    id:`DEMO-${{driver:'D',foreman:'F',mover:'M',packer:'P'}[role]}${String(i+1).padStart(2,'0')}`,
    name, role, cleared:![1,5,7].includes(i), trained:role==='driver'?training[i]:0,
    license:role==='driver'?(i===1?4:training[i]>=4?4:training[i]>=3?3:2):0
  })));
}
const PEOPLE = makeRoster();
const PERSON = Object.fromEntries(PEOPLE.map(p=>[p.id,p]));
const roster = role => PEOPLE.filter(p=>p.role===role);
const FLEET = [2,1,3,3,4,2,2,1,3,3,2,4,1,3].map((level,i)=>({
  id:`DEMO-V${String(i+1).padStart(2,'0')}`, label:`V-${String(i+1).padStart(2,'0')}`,
  level, type:LEVELS[level], capacity:{1:3000,2:9000,3:16000,4:26000}[level], seats:5
}));
const VEHICLE = Object.fromEntries(FLEET.map(v=>[v.id,v]));
const CONTRACTORS = [
  {id:'DEMO-C01',name:'Juniper crew',movers:3,packers:1,level:3,capacity:16000,cleared:true},
  {id:'DEMO-C02',name:'Orchard crew',movers:2,packers:1,level:2,capacity:9000,cleared:false},
  {id:'DEMO-C03',name:'Bramble crew',movers:4,packers:1,level:4,capacity:26000,cleared:true}
];
const CONTRACTOR = Object.fromEntries(CONTRACTORS.map(c=>[c.id,c]));
const blankTruck = () => ({driver:null,foreman:null,vehicle:null,crew:[]});
function makeSeed() {
  const clients=['Alder residence','Willow apartment','Northline studio','Finch residence','Maple townhouse','Clover design office','Linden residence','Hearth workshop','Brook residence','Elm apartment','Fern residence','Moss studio','Bramble creative'];
  const places=['Maple Row','Harbor Quarter','Willow Park','Cedar Point','Orchard Hill','East Grove','Birch Square','Westhaven'];
  const starts=['09:00','09:30','10:00','09:00','09:30','10:00','08:00','08:30','08:30','06:00','10:30','06:00','14:30'];
  const ends=['13:00','13:00','14:00','13:00','12:30','15:00','12:00','14:30','13:00','08:30','15:00','08:45','18:00'];
  const weights=[3700,null,5400,4600,1400,7200,5100,18000,5800,2800,6500,1800,21000];
  const services=['Local move','Packing','Storage','Local move','Packing','Office move','Local move','Office move','Storage','Delivery','Local move','Delivery','Office move'];
  const statuses=['planning','planning','planning','ready','ready','ready','running','running','running','done','ready','done','ready'];
  const levels=[2,1,3,2,1,3,3,4,2,2,2,1,3];
  const assignment=(d,f,v,movers=[],packers=[])=>({driver:roster('driver')[d].id,foreman:roster('foreman')[f].id,vehicle:FLEET[v].id,crew:[...movers.map(i=>roster('mover')[i].id),...packers.map(i=>roster('packer')[i].id)]});
  const jobs=DATES.flatMap((date,di)=>clients.map((client,i)=>({
    id:`DEMO-J${101+di*clients.length+i}`, move:`DEMO-M${501+di*clients.length+i}`,
    customerId:`DEMO-U${701+di*clients.length+i}`, client:clients[(i+di*3)%clients.length],
    date,start:starts[i],end:ends[i],service:services[i],from:places[(i+di)%places.length],to:places[(i+di+3)%places.length],
    weight:weights[i],minLevel:levels[i],reqMovers:i===12?4:i===4||i===1?1:i===5?3:2,
    reqPackers:[1,4].includes(i)?2:[5,7,8,10].includes(i)?1:0,
    priority:[0,7,12].includes(i),secure:[5,6].includes(i),status:statuses[i],
    notes:i===0?'Use the side entrance. Reserve space for the truck.':i===1?'Confirm the survey weight before dispatch.':i===7?'Protect work surfaces and label equipment by room.':i===12?'Two trucks are planned for this move. Keep the loads together.':'',
    contractor:i===5?'DEMO-C01':i===8?'DEMO-C02':null,
    assignments:i===0||i===1?[blankTruck()]:i===2?[assignment(2,2,2)]:i===3?[assignment(0,0,0,[0])]:i===4?[assignment(1,1,1,[],[0,1])]:i===5||i===8?[]:i===6?[assignment(3,3,3,[3])]:i===7?[assignment(4,4,4,[4],[4])]:i===9?[assignment(5,5,5,[5])]:i===10?[assignment(6,6,6,[6],[6])]:i===11?[assignment(7,7,7,[7])]:[assignment(8,8,8,[8]),assignment(0,0,9,[0])]
  })));
  return {schema:1,jobs,events:[]};
}

// Validation is shared by pickers, saves, drag-and-drop, and reports.
// Planning gaps may be saved; resource conflicts and incompatible assignments may not.
const overlaps = (a,b) => a.date===b.date && minutes(a.start)<minutes(b.end) && minutes(b.start)<minutes(a.end);
const truckPeople = a => [a.driver,a.foreman,...a.crew].filter(Boolean);
// ponytail: scans the small demo schedule; index bookings by resource/date if the dataset grows.
function resourceReason(job,slot,kind,id,jobs) {
  if (!id) return '';
  const a=job.assignments[slot];
  if (!a) return 'Unknown truck assignment.';
  const person=PERSON[id],vehicle=VEHICLE[id];
  if (kind==='vehicle') {
    if (!vehicle) return 'Unknown vehicle.';
    if (vehicle.level<job.minLevel) return `Requires ${LEVELS[job.minLevel]}.`;
    if (job.assignments.some((other,i)=>i!==slot&&other.vehicle===id)) return 'Already assigned to another truck on this job.';
    const d=PERSON[a.driver];
    if(d&&d.trained<vehicle.level) return `${d.name} needs more vehicle training.`;
    if(d&&d.license<vehicle.level) return `${d.name}'s licence does not match this vehicle.`;
  } else {
    if (!person) return 'Unknown person.';
    if ((kind==='driver'&&person.role!=='driver')||(kind==='foreman'&&person.role!=='foreman')||(kind==='crew'&&!['mover','packer'].includes(person.role))) return 'This person has a different role.';
    if (job.secure&&!person.cleared) return 'Site clearance is required.';
    if (job.assignments.some((other,i)=>i!==slot&&truckPeople(other).includes(id))) return 'Already assigned to another truck on this job.';
    if(kind==='driver') {
      const level=VEHICLE[a.vehicle]?.level||job.minLevel;
      if(person.trained<level) return `Training covers ${LEVELS[person.trained]}; level ${level} is needed.`;
      if(person.license<level) return 'The vehicle needs a higher licence class.';
    }
    if(kind==='crew'&&!a.crew.includes(id)&&a.crew.length+(a.foreman?1:0)>=4) return 'Four people besides the driver is the limit.';
  }
  const conflict=jobs.find(other=>other.id!==job.id&&overlaps(job,other)&&!other.contractor&&other.assignments.some(x=>kind==='vehicle'?x.vehicle===id:truckPeople(x).includes(id)));
  return conflict?`Booked on ${conflict.id}, ${timeLabel(conflict.start)}–${timeLabel(conflict.end)}.`:'';
}
function crewCount(job) {
  const c=CONTRACTOR[job.contractor];
  if(c) return {movers:c.movers,packers:c.packers,total:c.movers+c.packers};
  const ids=new Set(job.assignments.flatMap(a=>[a.foreman,...a.crew].filter(Boolean)));
  const movers=[...ids].filter(id=>['foreman','mover'].includes(PERSON[id]?.role)).length;
  const packers=[...ids].filter(id=>PERSON[id]?.role==='packer').length;
  return {movers,packers,total:movers+packers};
}
function issuesFor(job,jobs) {
  const issues=[];
  const add=(text,hard=false)=>{if(!issues.some(i=>i.text===text))issues.push({text,hard});};
  if(!job.client.trim()) add('Add a customer name.',true);
  if(!job.from.trim()||!job.to.trim()) add('Add both route locations.',true);
  if(!DATES.includes(job.date)) add('Choose a date in the demo window.',true);
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(job.start)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(job.end)||minutes(job.end)<=minutes(job.start)) add('Use valid times, with the end after the start on the same day.',true);
  if(job.weight===null) add('Survey weight is missing.');
  else if(!Number.isFinite(job.weight)||job.weight<=0||job.weight>1000000) add('Weight must be between 1 and 1,000,000 lb.',true);
  if(!Number.isInteger(job.reqMovers)||!Number.isInteger(job.reqPackers)||job.reqMovers<0||job.reqPackers<0||job.reqMovers+job.reqPackers<1) add('Request at least one crew member.',true);
  if(!LEVELS[job.minLevel]) add('Choose a required vehicle type.',true);
  const c=CONTRACTOR[job.contractor];
  if(job.contractor) {
    if(!c) add('Choose a contractor.',true);
    else {
      if(job.secure&&!c.cleared) add('Contractor is not cleared for this site.',true);
      if(c.level<job.minLevel) add('Contractor vehicle is below the requested level.',true);
      if(job.weight>c.capacity) add('Load exceeds the contractor vehicle capacity.',true);
      if(jobs.some(other=>other.id!==job.id&&other.contractor===job.contractor&&overlaps(job,other))) add('Contractor has an overlapping job.',true);
    }
  } else {
    if(!job.assignments.length) add('Assign at least one truck.');
    job.assignments.forEach((a,slot)=>{
      const label=job.assignments.length>1?`Truck ${slot+1}: `:'';
      for(const [kind,title] of [['driver','driver'],['foreman','foreman'],['vehicle','vehicle']]) {
        if(!a[kind]) add(`${label}Assign a ${title}.`);
        else {const reason=resourceReason(job,slot,kind,a[kind],jobs);if(reason)add(`${label}${title[0].toUpperCase()+title.slice(1)}: ${reason}`,true);}
      }
      if(a.crew.length+(a.foreman?1:0)>4) add(`${label}Only four people besides the driver fit in this truck.`,true);
      if(new Set(truckPeople(a)).size!==truckPeople(a).length) add(`${label}The same person is listed more than once.`,true);
      a.crew.forEach(id=>{const reason=resourceReason(job,slot,'crew',id,jobs);if(reason)add(`${label}${PERSON[id]?.name||'Crew'}: ${reason}`,true);});
    });
    const capacity=job.assignments.reduce((n,a)=>n+(VEHICLE[a.vehicle]?.capacity||0),0);
    if(job.weight&&job.assignments.every(a=>a.vehicle)&&capacity<job.weight) add(`Load exceeds the combined vehicle capacity by ${num(job.weight-capacity)} lb.`,true);
  }
  const crew=crewCount(job);
  if(crew.movers<job.reqMovers) add(`Needs ${job.reqMovers-crew.movers} more mover${job.reqMovers-crew.movers===1?'':'s'}.`);
  if(crew.packers<job.reqPackers) add(`Needs ${job.reqPackers-crew.packers} more packer${job.reqPackers-crew.packers===1?'':'s'}.`);
  return issues;
}
function stateOf(job,jobs) {
  if(job.status==='done'||job.status==='running')return job.status;
  return job.status==='ready'&&!issuesFor(job,jobs).length?'ready':'planning';
}
function utilization(jobs) {
  const groups={driver:roster('driver').length,foreman:roster('foreman').length,mover:roster('mover').length,packer:roster('packer').length,vehicle:FLEET.length};
  return Object.fromEntries(Object.entries(groups).map(([role,capacity])=>{
    const used=Math.max(0,...DATES.map(date=>{
      const assignments=jobs.filter(j=>j.date===date&&!j.contractor).flatMap(j=>j.assignments);
      return new Set(role==='vehicle'?assignments.map(a=>a.vehicle).filter(Boolean):assignments.flatMap(truckPeople).filter(id=>PERSON[id]?.role===role)).size;
    }));
    return [role,{used,capacity}];
  }));
}
function summary(jobs,allJobs=jobs) {
  const statuses=Object.fromEntries(Object.keys(STATUS).map(s=>[s,jobs.filter(j=>stateOf(j,allJobs)===s).length]));
  const attention=jobs.filter(j=>issuesFor(j,allJobs).length>0||stateOf(j,allJobs)==='planning').length;
  return {total:jobs.length,statuses,attention,covered:jobs.filter(j=>!issuesFor(j,allJobs).length&&stateOf(j,allJobs)!=='planning').length,contractors:jobs.filter(j=>j.contractor).length,
    weight:jobs.reduce((n,j)=>n+(j.weight||0),0),unknownWeight:jobs.filter(j=>j.weight===null).length,util:utilization(jobs)};
}

function validSaved(candidate) {
  if(candidate?.schema!==1||!Array.isArray(candidate.jobs)||!candidate.jobs.length||candidate.jobs.length>500||!Array.isArray(candidate.events))return false;
  const ids=new Set();
  for(const j of candidate.jobs) {
    if(!j||typeof j.id!=='string'||!/^DEMO-J\d+$/.test(j.id)||ids.has(j.id))return false;
    ids.add(j.id);
    if(!['client','from','to','notes','move','customerId'].every(k=>typeof j[k]==='string'&&j[k].length<=2000))return false;
    if(!DATES.includes(j.date)||!SERVICES.includes(j.service)||!STATUS[j.status]||!LEVELS[j.minLevel])return false;
    if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(j.start)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(j.end)||minutes(j.end)<=minutes(j.start))return false;
    if(j.weight!==null&&(!Number.isFinite(j.weight)||j.weight<=0||j.weight>1000000))return false;
    if(!Number.isInteger(j.reqMovers)||!Number.isInteger(j.reqPackers)||j.reqMovers<0||j.reqPackers<0||j.reqMovers+j.reqPackers<1)return false;
    if(j.contractor!==null&&!CONTRACTOR[j.contractor])return false;
    if(!Array.isArray(j.assignments)||j.assignments.length>3||(!j.contractor&&!j.assignments.length))return false;
    if(j.assignments.some(a=>!a||!Array.isArray(a.crew)||a.crew.length>4||a.crew.some(id=>!PERSON[id])||a.driver&&!PERSON[a.driver]||a.foreman&&!PERSON[a.foreman]||a.vehicle&&!VEHICLE[a.vehicle]))return false;
  }
  return candidate.events.length<=150&&candidate.events.every(e=>e&&typeof e.label==='string'&&typeof e.jobId==='string'&&typeof e.time==='string'&&Number.isFinite(Date.parse(e.time)));
}
let state=makeSeed(), storageOK=true, restored=false;
let ui={view:'board',date:DATES[0],query:'',service:'all',attention:false,sort:'start',direction:1};
let undoStack=[],redoStack=[],draft=null,drawerTab='assignment',isNew=false,dragId=null;
function loadState() {
  try {const raw=localStorage.getItem(STORAGE_KEY);if(raw){const parsed=JSON.parse(raw);if(validSaved(parsed)){state=parsed;restored=true;}else localStorage.removeItem(STORAGE_KEY);}}
  catch {storageOK=false;}
}
function persist() {
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));storageOK=true;}
  catch{storageOK=false;}
}
function record(label,jobId='') {state.events.unshift({label,jobId,time:new Date().toISOString()});state.events=state.events.slice(0,150);}
function commit(label,jobId,mutation) {
  const before=clone(state);mutation();record(label,jobId);
  undoStack.push({before,after:clone(state),label,jobId});if(undoStack.length>30)undoStack.shift();redoStack=[];
  persist();render();toast(label,false,true);
}
function undo() {
  const entry=undoStack.pop();if(!entry)return;
  redoStack.push(entry);state=clone(entry.before);record(`Undid: ${entry.label}`,entry.jobId);persist();render();toast('Change undone.');
}
function redo() {
  const entry=redoStack.pop();if(!entry)return;
  undoStack.push(entry);state=clone(entry.after);record(`Redid: ${entry.label}`,entry.jobId);persist();render();toast('Change restored.');
}
function scopedJobs(){return state.jobs.filter(j=>ui.date==='all'||j.date===ui.date);}
function matchingJobs() {
  const q=ui.query.trim().toLowerCase();
  return scopedJobs().filter(j=>{
    const people=j.assignments.flatMap(truckPeople).map(id=>PERSON[id]?.name||'');
    const haystack=[j.id,j.move,j.customerId,j.client,j.service,j.from,j.to,j.notes,CONTRACTOR[j.contractor]?.name,...people,...j.assignments.map(a=>a.vehicle)].join(' ').toLowerCase();
    return (!q||haystack.includes(q))&&(ui.service==='all'||j.service===ui.service)&&(!ui.attention||issuesFor(j,state.jobs).length>0||stateOf(j,state.jobs)==='planning');
  });
}
function sortedJobs(jobs) {
  return [...jobs].sort((a,b)=>a.date.localeCompare(b.date)||ui.direction*(String(ui.sort==='status'?STATUS[stateOf(a,state.jobs)]:a[ui.sort]).localeCompare(String(ui.sort==='status'?STATUS[stateOf(b,state.jobs)]:b[ui.sort])))||a.id.localeCompare(b.id));
}
function toast(message,error=false,withUndo=false) {
  if($('#job-dialog').open){const note=$('.drawer-foot small');if(note){note.textContent=message;note.classList.toggle('field-error',error);note.setAttribute('role','status');}return;}
  const t=$('#toast');t.innerHTML=`${icon(error?'alert':'check')}<span>${esc(message)}</span>${withUndo?'<button data-action="undo">Undo</button>':''}`;
  t.className=`toast show${error?' error':''}`;clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),5000);
}
function renderNavigation() {
  const links=[['board','board','Board'],['schedule','table','Schedule'],['reports','chart','Reports'],['activity','activity','Activity']];
  $('#navigation').innerHTML=links.map(([view,ic,label])=>`<button class="nav-item${ui.view===view?' active':''}" data-action="view" data-view="${view}" ${ui.view===view?'aria-current="page"':''} title="${label}">${icon(ic)}<span>${label}</span>${view==='activity'&&state.events.length?`<span class="nav-count">${state.events.length}</span>`:''}</button>`).join('');
}
function renderMetrics() {
  const jobs=scopedJobs(),s=summary(jobs,state.jobs),u=s.util.vehicle;
  $('#overview-scope').textContent=ui.date==='all'?'3-DAY OVERVIEW · UNFILTERED':`${dayLabel(ui.date).toUpperCase()} · DAY OVERVIEW`;
  $('#metrics').innerHTML=`
    <article class="metric"><div class="metric-label">Scheduled jobs${icon('box')}</div><div class="metric-value">${s.total}<span class="metric-note">${s.contractors} contractor</span></div><div class="metric-bottom">${s.statuses.done} completed · ${s.statuses.running} in progress</div><div class="tiny-progress" aria-label="Job status distribution">${Object.entries(s.statuses).map(([k,n])=>`<span style="width:${s.total?n/s.total*100:0}%;background:${COLORS[k]}"></span>`).join('')}</div></article>
    <article class="metric"><div class="metric-label">Ready to go${icon('check')}</div><div class="metric-value">${s.statuses.ready}<span class="metric-note">jobs</span></div><div class="metric-bottom">Crew & vehicles checked</div><div class="tiny-progress"><span style="width:${s.total?s.covered/s.total*100:0}%;background:#7f98ee"></span></div></article>
    <article class="metric attention"><div class="metric-label">Needs attention${icon('alert')}</div><div class="metric-value">${s.attention}<span class="metric-note">jobs</span></div><button class="metric-link" data-action="attention-focus">${s.attention?'Review planning gaps →':'All jobs are covered'}</button><div class="tiny-progress"><span style="width:${s.total?s.attention/s.total*100:0}%;background:#d7b370"></span></div></article>
    <article class="metric"><div class="metric-label">Fleet committed${icon('truck')}</div><div class="metric-value">${u.used}<span class="metric-note">/ ${u.capacity} vehicles</span></div><div class="metric-bottom">${u.capacity-u.used} unscheduled${ui.date==='all'?' on peak day':''}</div><div class="tiny-progress"><span style="width:${u.used/u.capacity*100}%;background:#879abf"></span></div></article>`;
}
function card(job,showDate=false) {
  const st=stateOf(job,state.jobs),issues=issuesFor(job,state.jobs),crew=crewCount(job),contractor=CONTRACTOR[job.contractor];
  const ids=[...new Set(job.assignments.flatMap(a=>[a.foreman,...a.crew].filter(Boolean)))];
  const lead=PERSON[job.assignments[0]?.foreman];
  const assigned=contractor||job.assignments.some(a=>a.driver||a.foreman||a.vehicle||a.crew.length);
  const vehicle=VEHICLE[job.assignments[0]?.vehicle];
  const problem=issues.find(i=>i.text.includes('weight'))||issues.find(i=>i.text.startsWith('Needs '))||issues[0];
  return `<article class="job-card" draggable="true" data-job="${esc(job.id)}">
    <button class="card-open" data-action="open" data-job="${esc(job.id)}" aria-label="Open ${esc(job.client)}, ${esc(job.id)}, ${STATUS[st]}">
      <div class="card-top"><span class="job-id">${esc(job.id)}</span>${job.priority?`<span class="priority">${icon('flag')}Priority</span>`:''}</div>
      <h3 class="card-title">${esc(job.client)}</h3><div class="card-route"><span>${esc(job.from)}</span>${icon('arrow')}<span>${esc(job.to)}</span></div>
      <div class="card-facts"><span>${icon('clock')}${timeLabel(job.start)}</span><span>${icon('box')}${esc(job.service)}</span><span>${icon('people')}${crew.total}/${job.reqMovers+job.reqPackers}</span></div>
      <div class="card-tags">${showDate?`<span class="tag status-${st}">${STATUS[st]}</span>`:''}<span class="tag">${job.weight===null?'Weight pending':num(job.weight)+' lb'}</span>${job.secure?`<span class="tag secure">Site clearance</span>`:''}${job.assignments.length>1?`<span class="tag">${job.assignments.length} trucks</span>`:''}${contractor?'<span class="tag">Contractor</span>':''}</div>
    </button>
    ${problem?`<div class="card-alert">${icon('alert')}<span>${esc(problem.text)}</span>${issues.length>1?`<span title="${issues.length} planning gaps">+${issues.length-1}</span>`:''}</div>`:''}
    <div class="card-footer">${assigned?`<div class="crew-line">${!contractor?`<span class="avatar-stack" aria-hidden="true">${ids.slice(0,3).map(id=>`<span class="avatar">${initials(PERSON[id].name)}</span>`).join('')}</span>`:icon('people')}<span class="card-assignee">${esc(contractor?.name||lead?.name||'Assignment started')}</span></div><button class="text-button card-unit" data-action="open" data-job="${job.id}" aria-label="Edit resources for ${esc(job.client)}">${contractor?'Partner':vehicle?.label||'Assign'}${job.assignments.length>1?` +${job.assignments.length-1}`:''}</button>`:`<button class="assign-link" data-action="open" data-job="${job.id}">${icon('plus')}Assign resources</button><span class="card-unit">Open</span>`}</div>
  </article>`;
}
function emptyState(title,copy,reset=true) {return `<div class="empty-state">${icon('search')}<h2>${esc(title)}</h2><p>${esc(copy)}</p>${reset?'<button class="btn" data-action="clear-filters">Clear filters</button>':''}</div>`;}
function renderBoard(jobs) {
  if(!jobs.length)return emptyState('No matching jobs','Try another name, service, or filter.');
  const days=ui.date==='all';
  const lanes=days?DATES.map(date=>({key:date,label:dayLabel(date,true),jobs:jobs.filter(j=>j.date===date)})):Object.entries(STATUS).map(([key,label])=>({key,label,jobs:jobs.filter(j=>stateOf(j,state.jobs)===key)}));
  return `<div class="board${days?' days':''}">${lanes.map(lane=>`<section class="lane" data-drop="${lane.key}" data-drop-type="${days?'date':'status'}" aria-label="${esc(lane.label)}"><div class="lane-head"><h2 class="lane-title">${days?'':`<span class="lane-dot ${lane.key}" aria-hidden="true"></span>`}${esc(lane.label)}<span class="lane-count">${lane.jobs.length}</span></h2>${lane.key==='planning'||days?`<button class="lane-add" data-action="new" data-date="${days?lane.key:ui.date}" aria-label="Add a job${days?' on '+dayLabel(lane.key):''}">+</button>`:''}</div><div class="lane-body">${[...lane.jobs].sort((a,b)=>(Number(b.priority)-Number(a.priority))||a.start.localeCompare(b.start)).map(j=>card(j,days)).join('')||`<div class="lane-empty">${lane.key==='done'?'Completed jobs will appear here.':'No jobs in this lane.'}</div>`}</div></section>`).join('')}</div>`;
}
function renderSchedule(jobs) {
  if(!jobs.length)return emptyState('No matching jobs','Try another name, service, or filter.');
  let lastDate='';
  return `<div class="table-shell"><table class="schedule-table"><caption class="sr-only">${jobs.length} matching dispatch jobs. Times are planned start and end times.</caption><thead><tr>${[['start','Time'],['client','Job / route'],['service','Service'],['status','Status']].map(([key,label])=>`<th scope="col"><button data-action="sort" data-sort="${key}">${label}${icon(ui.sort===key?'chevronDown':'sort')}</button></th>`).join('')}<th scope="col">Lead / crew</th><th scope="col">Vehicles</th><th scope="col">Load</th><th scope="col"><span class="sr-only">Edit</span></th></tr></thead><tbody>${sortedJobs(jobs).map(j=>{
    const st=stateOf(j,state.jobs),c=crewCount(j),lead=CONTRACTOR[j.contractor]?.name||PERSON[j.assignments[0]?.foreman]?.name||'Unassigned';
    const group=ui.date==='all'&&lastDate!==j.date?`<tr class="day-heading"><td colspan="8">${dayLabel(j.date,true)}</td></tr>`:'';lastDate=j.date;
    return `${group}<tr><td>${timeLabel(j.start)}<span class="table-sub">to ${timeLabel(j.end)}</span></td><td><button class="table-job" data-action="open" data-job="${j.id}">${esc(j.client)}</button><span class="table-sub">${esc(j.from)} → ${esc(j.to)}</span><span class="job-id">${j.id}${j.assignments.length>1?' · '+j.assignments.length+' trucks':''}</span></td><td>${j.service}</td><td><span class="table-state ${st}">${STATUS[st]}</span>${issuesFor(j,state.jobs).length?'<span class="table-sub" style="color:var(--amber)">Review resources</span>':''}</td><td>${esc(lead)}<span class="table-sub">${c.total} / ${j.reqMovers+j.reqPackers} crew</span></td><td>${j.contractor?'Partner fleet':j.assignments.map(a=>VEHICLE[a.vehicle]?.label).filter(Boolean).join(', ')||'—'}</td><td>${j.weight===null?'Pending':num(j.weight)+' lb'}</td><td><button class="icon-button" data-action="open" data-job="${j.id}" aria-label="Edit ${esc(j.client)}">${icon('chevronRight')}</button></td></tr>`;
  }).join('')}</tbody></table></div>`;
}
function renderReports(jobs) {
  if(!jobs.length)return emptyState('Nothing to report','Choose another date or clear the current filters.');
  const s=summary(jobs,state.jobs),pct=s.total?Math.round(s.covered/s.total*100):0;
  const dates=ui.date==='all'?DATES:[ui.date];
  const max=Math.max(1,...dates.map(d=>jobs.filter(j=>j.date===d).length));
  const exceptions=jobs.filter(j=>issuesFor(j,state.jobs).length||stateOf(j,state.jobs)==='planning').sort((a,b)=>b.priority-a.priority||a.date.localeCompare(b.date)||a.start.localeCompare(b.start));
  const serviceCounts=SERVICES.map(service=>({service,n:jobs.filter(j=>j.service===service).length})).sort((a,b)=>b.n-a.n);
  return `<div class="reports-grid">
    <article class="report-panel"><div class="report-title"><div><h2>Dispatch coverage</h2><p class="report-sub">${jobs.length} jobs in the current selection</p></div>${icon('chart')}</div><div class="coverage-summary"><div class="coverage-ring" style="--value:${pct}" role="img" aria-label="${pct} percent of jobs fully covered"><span class="coverage-number">${pct}%</span></div><div class="coverage-copy"><h3>${s.covered} of ${s.total} jobs covered</h3><p>${s.attention?`${s.attention} still need planning or resource checks.`:'Every job has a complete assignment.'}</p></div></div><div class="legend">${Object.entries(STATUS).map(([k,label])=>`<span><i style="background:${COLORS[k]}"></i>${label} · ${s.statuses[k]}</span>`).join('')}</div>${dates.map(date=>{
      const ds=summary(jobs.filter(j=>j.date===date),state.jobs);
      return `<div class="chart-row"><button class="chart-day" data-action="date" data-date="${date}">${dayLabel(date)}</button><div class="chart-track" role="img" aria-label="${dayLabel(date)}: ${Object.entries(ds.statuses).map(([k,n])=>n+' '+STATUS[k]).join(', ')}">${Object.entries(ds.statuses).map(([k,n])=>`<span style="background:${COLORS[k]};width:${n/max*100}%" title="${STATUS[k]}: ${n}"></span>`).join('')}</div><span class="chart-total">${ds.total}</span></div>`;
    }).join('')}<p class="resource-caption">Covered = ready, in progress, or completed with all assignment checks passing.</p></article>
    <article class="report-panel"><div class="report-title"><div><h2>Resource use</h2><p class="report-sub">${ui.date==='all'?'Peak use on any single day':'Unique resources scheduled today'}</p></div>${icon('people')}</div>${Object.entries(s.util).map(([role,u])=>`<div class="resource-row"><div class="resource-meta"><span>${{driver:'Drivers',foreman:'Foremen',mover:'Movers',packer:'Packers',vehicle:'Vehicles'}[role]}</span><span>${u.used}<small> / ${u.capacity}</small></span></div><div class="resource-track" role="meter" aria-label="${role} scheduled" aria-valuemin="0" aria-valuemax="${u.capacity}" aria-valuenow="${u.used}"><span style="width:${u.used/u.capacity*100}%"></span></div></div>`).join('')}<p class="resource-caption">Distinct internal resources, including completed jobs. Contractor crews are separate. This measures daily commitments, not time-based utilization.</p></article>
    <article class="report-panel"><div class="report-title"><div><h2>Planning queue</h2><p class="report-sub">${exceptions.length} jobs to review</p></div>${icon('alert')}</div><div class="exceptions">${exceptions.slice(0,8).map(j=>{const issues=issuesFor(j,state.jobs);return `<button class="exception" data-action="open" data-job="${j.id}"><span class="exception-icon">${icon('alert')}</span><span><strong>${esc(j.client)}</strong><p>${j.id} · ${dayLabel(j.date)} · ${timeLabel(j.start)}</p><p>${esc(issues[0]?.text||'Ready for dispatcher review.')}${issues.length>1?' +'+(issues.length-1)+' more':''}</p></span>${icon('chevronRight')}</button>`;}).join('')||'<p class="muted">No open planning gaps.</p>'}${exceptions.length>8?'<button class="text-button" data-action="attention-focus">View all planning gaps →</button>':''}</div></article>
    <article class="report-panel"><div class="report-title"><div><h2>Workload mix</h2><p class="report-sub">Jobs by service</p></div>${icon('box')}</div>${serviceCounts.map(({service,n})=>`<div class="service-row"><span>${service}</span><div class="chart-track" role="img" aria-label="${n} ${service} jobs"><span style="width:${n/Math.max(1,...serviceCounts.map(s=>s.n))*100}%"></span></div><span class="chart-total">${n}</span></div>`).join('')}<div style="border-top:1px solid var(--line);margin-top:25px;padding-top:19px"><div class="resource-meta"><span>Recorded load</span><strong>${num(s.weight)} lb</strong></div><p class="report-sub">${s.unknownWeight?`${s.unknownWeight} job${s.unknownWeight===1?' has':'s have'} no survey weight.`:'All survey weights are recorded.'} Multi-truck jobs are counted once.</p></div></article>
  </div>`;
}
function renderActivity() {
  if(!state.events.length)return emptyState('A fresh start','Assign resources or move a job. Your changes will appear here.',false);
  return `<div class="table-shell"><div class="audit-head"><div><h2>Activity log</h2><p class="report-sub">${state.events.length} changes in this browser · latest first</p></div><button class="btn small" data-action="export-activity">${icon('download')}Export log</button></div><ol class="audit-list">${state.events.map(e=>`<li class="audit-item"><span class="audit-icon">${icon('activity')}</span><div class="audit-copy">${esc(e.label)}${e.jobId?`<small><button class="text-button" data-action="open" data-job="${esc(e.jobId)}">${esc(e.jobId)}</button></small>`:'<small>Demo workspace</small>'}</div><time class="audit-time" datetime="${esc(e.time)}">${new Date(e.time).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</time></li>`).join('')}</ol></div>`;
}
function render() {
  renderNavigation();renderMetrics();
  const titles={board:'Dispatch board',schedule:'Schedule',reports:'Operations report',activity:'Activity'};
  const subtitles={board:'October 2030 · Local operations',schedule:'Planned times and assigned resources',reports:'Coverage, capacity, and open planning gaps',activity:'Assignment changes and status updates'};
  $('#page-title').textContent=titles[ui.view];$('#breadcrumb').textContent=titles[ui.view];$('#page-subtitle').textContent=subtitles[ui.view];
  $('#date-tabs').innerHTML=[...DATES.map(date=>({date,label:dayLabel(date),count:state.jobs.filter(j=>j.date===date).length})),{date:'all',label:'All 3 days',count:state.jobs.length}].map(d=>`<button class="date-tab${ui.date===d.date?' active':''}" data-action="date" data-date="${d.date}" aria-pressed="${ui.date===d.date}">${d.label}<span class="date-num">${d.count}</span></button>`).join('');
  $('#date-tabs').closest('.datebar').hidden=ui.view==='activity';$('#metrics').hidden=ui.view==='activity';$('.overview-caption').hidden=ui.view==='activity';$('#filters').hidden=ui.view==='activity';$('#view-hint').hidden=ui.view==='activity';
  $('#save-status').innerHTML=icon(storageOK?'check':'alert')+(storageOK?'Saved in this browser':'Session only');
  $('#footer-copy').textContent=storageOK?'Entirely fictional data. Changes stay in this browser.':'Entirely fictional data. Browser storage is unavailable; export before closing.';
  $('#undo').disabled=!undoStack.length;$('#redo').disabled=!redoStack.length;
  $('#attention-filter').classList.toggle('active',ui.attention);$('#attention-filter').setAttribute('aria-pressed',String(ui.attention));
  $('#clear-filters').hidden=!ui.query&&ui.service==='all'&&!ui.attention;
  const jobs=matchingJobs();$('#result-count').textContent=`${jobs.length} of ${scopedJobs().length} jobs`;
  $('#view-hint').innerHTML=icon(ui.view==='board'?'grip':'filter')+(ui.view==='board'?(ui.date==='all'?'Drag between days to reschedule. Open a job to edit its crew and vehicles.':'Drag cards to update status. Open any job to assign resources.'):ui.view==='reports'?'Charts follow the current filters. Overview totals above cover the full date selection.':'Click a column heading to sort. Overview totals above cover the full date selection.');
  $('#view').innerHTML=ui.view==='board'?renderBoard(jobs):ui.view==='schedule'?renderSchedule(jobs):ui.view==='reports'?renderReports(jobs):renderActivity();
  $('#view').setAttribute('aria-label',titles[ui.view]);
}

function newJob(date) {
  const next=Math.max(100,...state.jobs.map(j=>Number(j.id.replace('DEMO-J',''))))+1;
  return {id:`DEMO-J${next}`,move:`DEMO-M${next+400}`,customerId:`DEMO-U${next+600}`,client:'',date:DATES.includes(date)?date:DATES[0],start:'09:00',end:'13:00',service:'Local move',from:'',to:'',weight:null,minLevel:2,reqMovers:2,reqPackers:0,priority:false,secure:false,status:'planning',notes:'',contractor:null,assignments:[blankTruck()]};
}
function openJob(id,create=false,date) {
  const found=create?newJob(date||ui.date):state.jobs.find(j=>j.id===id);
  if(!found){toast('This job is no longer on the board.',true);return;}
  draft=clone(found);isNew=create;drawerTab=create?'details':'assignment';renderDrawer();
  const dialog=$('#job-dialog');if(!dialog.open)dialog.showModal();
  if(create)$('#job-client').focus();
}
function field(label,key,type='text',options={}) {
  const val=draft[key];
  const body=type==='select'?`<select data-field="${key}" ${options.required?'required':''}>${options.items.map(([v,l])=>`<option value="${esc(v)}" ${String(v)===String(val)?'selected':''}>${esc(l)}</option>`).join('')}</select>`:type==='textarea'?`<textarea data-field="${key}" maxlength="2000">${esc(val)}</textarea>`:`<input ${key==='client'?'id="job-client"':''} data-field="${key}" type="${type}" value="${esc(val)}" ${options.required?'required':''} ${options.min!==undefined?`min="${options.min}"`:''} ${options.max!==undefined?`max="${options.max}"`:''} ${type==='number'?'step="1"':''} ${options.placeholder?`placeholder="${esc(options.placeholder)}"`:''} ${type==='text'?'maxlength="120"':''}>`;
  return `<label class="field${options.full?' full':''}"><span>${label}</span>${body}${options.hint?`<small>${options.hint}</small>`:''}</label>`;
}
function picker(slot,kind,label) {
  const a=draft.assignments[slot],selected=kind==='crew'?'':a[kind];
  const choices=kind==='vehicle'?FLEET:PEOPLE.filter(p=>kind==='crew'?['mover','packer'].includes(p.role)&&!a.crew.includes(p.id):p.role===kind);
  const options=choices.map(item=>{
    const reason=resourceReason(draft,slot,kind,item.id,state.jobs);
    const title=kind==='vehicle'?`${item.label} · ${item.type}`:kind==='driver'?`${item.name} · trained L${item.trained}`:kind==='crew'?`${item.name} · ${item.role}`:item.name;
    return {id:item.id,title,reason};
  }).sort((x,y)=>Number(Boolean(x.reason))-Number(Boolean(y.reason))||x.title.localeCompare(y.title));
  return `<label class="field${kind==='vehicle'||kind==='crew'?' full':''}"><span>${label}</span><select data-resource="${kind}" data-slot="${slot}"><option value="">${kind==='crew'?'Add a mover or packer…':'Choose '+kind+'…'}</option>${options.map(o=>`<option value="${o.id}" ${o.id===selected?'selected':''} ${o.reason&&o.id!==selected?'disabled':''}>${esc(o.title)}${o.reason?' — '+esc(o.reason):''}</option>`).join('')}</select></label>`;
}
function renderAssignments() {
  const c=crewCount(draft),con=CONTRACTOR[draft.contractor];
  const local=!draft.contractor;
  return `<div class="assignment-top"><div><h3>Who is handling this move?</h3><p>Availability checks use the planned time window.</p></div><select class="filter-select" id="assignment-mode" aria-label="Assignment type"><option value="internal" ${local?'selected':''}>Internal crew</option><option value="contractor" ${!local?'selected':''}>Contractor</option></select></div>
    <div class="requirements"><span>Requested / assigned</span><span class="${c.movers<draft.reqMovers?'short':''}">Movers <strong>${draft.reqMovers} / ${c.movers}</strong></span><span class="${c.packers<draft.reqPackers?'short':''}">Packers <strong>${draft.reqPackers} / ${c.packers}</strong></span></div>
    ${local?draft.assignments.map((a,i)=>`<section class="truck-panel"><div class="truck-heading"><span>${icon('truck')} Truck ${i+1}<span class="tag">${a.crew.length+(a.foreman?1:0)} / 4 riders</span></span>${draft.assignments.length>1?`<button type="button" class="text-button" data-action="remove-truck" data-slot="${i}">Remove truck</button>`:''}</div><div class="truck-grid">${picker(i,'vehicle','Vehicle')}${picker(i,'driver','Driver')}${picker(i,'foreman','Foreman / crew lead')}${picker(i,'crew','Movers & packers')}</div><div class="crew-chips">${a.crew.map(id=>`<span class="crew-chip">${esc(PERSON[id].name)} · ${PERSON[id].role}<button type="button" data-action="remove-crew" data-slot="${i}" data-person="${id}" aria-label="Remove ${esc(PERSON[id].name)}">×</button></span>`).join('')}</div></section>`).join('')+`<button type="button" class="btn small" data-action="add-truck" ${draft.assignments.length>=3?'disabled':''}>${icon('plus')}Add a truck</button><p class="assignment-note">The foreman counts as a mover. The driver is separate. Each truck carries up to four people besides its driver. Unavailable choices show the reason.</p>`:`<label class="field"><span>Contractor team</span><select id="contractor-choice">${CONTRACTORS.map(co=>`<option value="${co.id}" ${co.id===draft.contractor?'selected':''}>${co.name} · ${co.movers+co.packers} people</option>`).join('')}</select></label><div class="truck-panel" style="margin-top:16px"><h3>${esc(con?.name||'Choose a crew')}</h3><p class="assignment-note">${con?.movers||0} movers, including the contractor lead · ${con?.packers||0} packers<br>${LEVELS[con?.level||1]} · ${num(con?.capacity||0)} lb capacity<br>${con?.cleared?'Cleared for restricted sites':'Standard site access only'}</p></div><p class="assignment-note">The contractor supplies the vehicle and its full crew. Crew size includes the contractor.</p>`}`;
}
function renderDetails() {
  return `<div class="drawer-section"><div class="field-grid">
    ${field('Customer / job name','client','text',{required:true,full:true,placeholder:'e.g. Cedar residence'})}
    ${field('Origin','from','text',{required:true,placeholder:'e.g. Willow Park'})}${field('Destination','to','text',{required:true,placeholder:'e.g. Maple Row'})}
    ${field('Service date','date','select',{items:DATES.map(d=>[d,dayLabel(d,true)])})}${field('Service','service','select',{items:SERVICES.map(s=>[s,s])})}
    ${field('Planned start','start','time',{required:true})}${field('Planned end','end','time',{required:true})}
    ${field('Survey weight (lb)','weight','number',{min:1,max:1000000,placeholder:'Pending'})}${field('Minimum vehicle level','minLevel','select',{items:Object.entries(LEVELS)})}
    ${field('Movers requested','reqMovers','number',{required:true,min:0,max:12,hint:'Includes foremen; excludes drivers.'})}${field('Packers requested','reqPackers','number',{required:true,min:0,max:12})}
    ${field('Dispatch notes','notes','textarea',{full:true})}
    </div><div class="check-row"><label class="check"><input type="checkbox" data-field="priority" ${draft.priority?'checked':''}>Priority job</label><label class="check"><input type="checkbox" data-field="secure" ${draft.secure?'checked':''}>Site clearance required</label></div></div>`;
}
function renderDrawer() {
  if(!draft)return;
  const oldBody=$('.drawer-body'),scroll=oldBody?.scrollTop||0;
  const issues=issuesFor(draft,state.jobs),hard=issues.filter(i=>i.hard),original=state.jobs.find(j=>j.id===draft.id);
  const st=stateOf(draft,state.jobs);
  const transitions={planning:['ready','Mark ready'],ready:['running','Start job'],running:['done','Complete job'],done:['ready','Reopen job']};
  const [next,label]=transitions[st];
  $('#job-dialog').innerHTML=`<form class="drawer-inner" id="job-form"><header class="drawer-head"><div class="drawer-head-copy"><span class="mono muted">${draft.id} · ${isNew?'NEW JOB':STATUS[st]}</span><h2 id="drawer-title">${esc(draft.client||'New demo job')}</h2><p class="drawer-route">${esc(draft.from||'Origin')}${icon('arrow')}${esc(draft.to||'Destination')}<span>· ${dayLabel(draft.date)}</span></p></div><button type="button" class="icon-button" data-action="close-job" aria-label="Close job details">${icon('close')}</button></header>
    <div class="drawer-tabs" aria-label="Job detail sections"><button type="button" class="drawer-tab${drawerTab==='assignment'?' active':''}" data-action="drawer-tab" data-tab="assignment" aria-pressed="${drawerTab==='assignment'}">Crew & vehicles</button><button type="button" class="drawer-tab${drawerTab==='details'?' active':''}" data-action="drawer-tab" data-tab="details" aria-pressed="${drawerTab==='details'}">Job details</button></div>
    <div class="drawer-body">${drawerTab==='assignment'?renderAssignments():renderDetails()}
      <div class="issue-box${issues.length?'':' good'}"><div class="issue-title">${icon(issues.length?'alert':'check')}${issues.length?(hard.length?'Assignment needs correction':'Still to plan'):'All dispatch checks pass'}</div>${issues.length?`<ul>${issues.map(i=>`<li>${esc(i.text)}</li>`).join('')}</ul>`:'<p style="font-size:12px;margin-top:5px">Crew, training, clearance, vehicle capacity, and availability are covered.</p>'}</div>
      ${!isNew?`<div class="state-actions"><span>Job status · ${STATUS[st]}</span><button type="button" class="btn small${next==='done'?' soft':''}" data-action="status" data-status="${next}" ${issues.length?'disabled':''}>${icon(next==='running'?'play':'check')}${label}</button></div>`:''}
    </div><footer class="drawer-foot"><div><small>${isNew?'Fictional workspace · use sample data':hard.length?'Resolve conflicts before saving':issues.length?'Incomplete assignments save to To plan':'Changes save to this browser'}</small></div><div class="foot-group"><button type="button" class="btn" data-action="close-job">Cancel</button><button type="submit" class="btn primary">${isNew?'Create job':'Save changes'}</button></div></footer></form>`;
  $('.drawer-body').scrollTop=scroll;
}
function updateDraftField(el) {
  const key=el.dataset.field;if(!draft||!key)return;
  if(['priority','secure'].includes(key))draft[key]=el.checked;
  else if(['weight','reqMovers','reqPackers','minLevel'].includes(key))draft[key]=el.value===''?(key==='weight'?null:0):Number(el.value);
  else draft[key]=el.value;
}
function refreshDraftValidation() {
  if(!draft)return;
  const issues=issuesFor(draft,state.jobs),hard=issues.filter(i=>i.hard),box=$('.issue-box');
  if(box){box.className='issue-box'+(issues.length?'':' good');box.innerHTML=`<div class="issue-title">${icon(issues.length?'alert':'check')}${issues.length?(hard.length?'Assignment needs correction':'Still to plan'):'All dispatch checks pass'}</div>${issues.length?`<ul>${issues.map(i=>`<li>${esc(i.text)}</li>`).join('')}</ul>`:'<p style="font-size:12px;margin-top:5px">Crew, training, clearance, vehicle capacity, and availability are covered.</p>'}`;}
  const statusButton=$('.state-actions button');if(statusButton)statusButton.disabled=issues.length>0;
  const note=$('.drawer-foot small');if(note)note.textContent=hard.length?'Resolve conflicts before saving':issues.length?'Incomplete assignments save to To plan':'Changes save to this browser';
}
function closeJob() {$('#job-dialog').close();draft=null;}
function saveDraft(targetStatus=null) {
  if(!draft)return;
  const issues=issuesFor(draft,state.jobs),hard=issues.filter(i=>i.hard);
  if(hard.length){renderDrawer();toast(hard[0].text,true);return;}
  if((targetStatus&&targetStatus!=='planning'||['running','done'].includes(draft.status))&&issues.length){toast(issues[0].text,true);return;}
  const candidate=clone(draft);
  candidate.client=candidate.client.trim();candidate.from=candidate.from.trim();candidate.to=candidate.to.trim();
  if(targetStatus)candidate.status=targetStatus;
  else if(!['running','done'].includes(candidate.status))candidate.status=issues.length?'planning':'ready';
  const newFlag=isNew;
  if(!newFlag&&JSON.stringify(candidate)===JSON.stringify(state.jobs.find(j=>j.id===candidate.id))){closeJob();toast('No changes to save.');return;}
  closeJob();
  commit(newFlag?`Created ${candidate.client}`:targetStatus?`${candidate.client} → ${STATUS[candidate.status]}`:`Updated ${candidate.client}`,candidate.id,()=>{
    if(newFlag)state.jobs.push(candidate);else state.jobs=state.jobs.map(j=>j.id===candidate.id?candidate:j);
  });
}
function moveJob(id,target,kind) {
  const original=state.jobs.find(j=>j.id===id);if(!original)return;
  const candidate=clone(original);
  if(kind==='date') {
    if(!DATES.includes(target)||target===candidate.date)return;
    if(['running','done'].includes(candidate.status)){toast('Reopen the job before rescheduling it.',true);return;}
    candidate.date=target;
    const hard=issuesFor(candidate,state.jobs).filter(i=>i.hard);
    if(hard.length){toast(hard[0].text,true);return;}
    if(issuesFor(candidate,state.jobs).length)candidate.status='planning';
  } else {
    if(!STATUS[target]||target===stateOf(candidate,state.jobs))return;
    const st=stateOf(candidate,state.jobs),issues=issuesFor(candidate,state.jobs);
    if(target!=='planning'&&issues.length){toast(issues[0].text,true);return;}
    if(target==='running'&&st!=='ready'){toast('Move the job to Ready to go before starting it.',true);return;}
    if(target==='done'&&st!=='running'){toast('Start the job before marking it completed.',true);return;}
    if(st==='done'&&target!=='ready'){toast('Move the completed job to Ready to go to reopen it.',true);return;}
    candidate.status=target;
  }
  commit(kind==='date'?`Rescheduled ${candidate.client} to ${dayLabel(candidate.date)}`:`${candidate.client} → ${STATUS[candidate.status]}`,id,()=>{state.jobs=state.jobs.map(j=>j.id===id?candidate:j);});
}

// CSV cells are escaped and formula-like input is neutralized for spreadsheets.
function csvText(rows) {
  return '\uFEFF'+rows.map(row=>row.map(value=>{
    let s=String(value??'');if(/^[\s]*[=+\-@]/.test(s)||/^[\t\r\n]/.test(s))s="'"+s;
    return '"'+s.replace(/"/g,'""')+'"';
  }).join(',')).join('\r\n');
}
function scheduleRows(jobs) {
  const head=['dataset','date','job_id','move_id','customer_id','customer','origin','destination','service','planned_start','planned_end','status','job_weight_lb','job_movers_requested','job_packers_requested','truck_slot','driver','foreman','vehicle','riders','contractor','contractor_crew_including_lead','priority','clearance_required','planning_issues','notes'];
  const rows=sortedJobs(jobs).flatMap(j=>(j.contractor?[null]:j.assignments).map((a,i)=>[
    'FICTIONAL DEMO',j.date,j.id,j.move,j.customerId,j.client,j.from,j.to,j.service,j.start,j.end,STATUS[stateOf(j,state.jobs)],j.weight??'',j.reqMovers,j.reqPackers,j.contractor?'contractor':`${i+1} of ${j.assignments.length}`,
    a?PERSON[a.driver]?.name||'':'',a?PERSON[a.foreman]?.name||'':'',a?VEHICLE[a.vehicle]?.label||'':'',a?[a.foreman,...a.crew].filter(Boolean).map(id=>PERSON[id].name).join(' | '):'',CONTRACTOR[j.contractor]?.name||'',j.contractor?crewCount(j).total:'',j.priority?'YES':'NO',j.secure?'YES':'NO',issuesFor(j,state.jobs).map(i=>i.text).join(' | '),j.notes
  ]));return [head,...rows];
}
function summaryRows(jobs) {
  return [['dataset','date','jobs','to_plan','ready','in_progress','completed','needs_attention','covered_jobs','contractor_jobs','recorded_weight_lb','jobs_missing_weight','drivers_committed','foremen_committed','movers_committed','packers_committed','vehicles_committed'],...DATES.filter(date=>ui.date==='all'||date===ui.date).map(date=>{
    const s=summary(jobs.filter(j=>j.date===date),state.jobs);return ['FICTIONAL DEMO',date,s.total,s.statuses.planning,s.statuses.ready,s.statuses.running,s.statuses.done,s.attention,s.covered,s.contractors,s.weight,s.unknownWeight,s.util.driver.used,s.util.foreman.used,s.util.mover.used,s.util.packer.used,s.util.vehicle.used];
  })];
}
function download(kind) {
  const jobs=matchingJobs();
  const rows=kind==='schedule'?scheduleRows(jobs):kind==='summary'?summaryRows(jobs):[['dataset','timestamp','job_id','action'],...state.events.map(e=>['FICTIONAL DEMO',e.time,e.jobId,e.label])];
  const url=URL.createObjectURL(new Blob([csvText(rows)],{type:'text/csv;charset=utf-8;'}));
  const link=document.createElement('a');link.href=url;link.download=`relay-demo-${kind}-${kind==='activity'?'log':ui.date}.csv`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  $('#export-menu').hidden=true;$('#export-button').setAttribute('aria-expanded','false');toast(kind==='activity'?'Activity log exported.':`${jobs.length} jobs included in the export.`);
}
function clearFilters() {ui.query='';ui.service='all';ui.attention=false;$('#search').value='';$('#service-filter').value='all';}
function handleAction(button) {
  const a=button.dataset.action;
  if(a==='view'){ui.view=button.dataset.view;render();}
  else if(a==='date'){ui.date=button.dataset.date;render();}
  else if(a==='open')openJob(button.dataset.job);
  else if(a==='new')openJob(null,true,button.dataset.date);
  else if(a==='close-job')closeJob();
  else if(a==='drawer-tab'){drawerTab=button.dataset.tab;renderDrawer();}
  else if(a==='undo')undo();
  else if(a==='redo')redo();
  else if(a==='attention'){ui.attention=!ui.attention;render();}
  else if(a==='attention-focus'){clearFilters();ui.attention=true;ui.view='board';render();}
  else if(a==='clear-filters'){clearFilters();render();}
  else if(a==='sort'){ui.direction=ui.sort===button.dataset.sort?-ui.direction:1;ui.sort=button.dataset.sort;render();}
  else if(a==='export-menu'){const m=$('#export-menu');m.hidden=!m.hidden;button.setAttribute('aria-expanded',String(!m.hidden));}
  else if(a.startsWith('export-'))download(a.replace('export-',''));
  else if(a==='reset')$('#confirm-dialog').showModal();
  else if(a==='cancel-reset')$('#confirm-dialog').close();
  else if(a==='confirm-reset'){$('#confirm-dialog').close();clearFilters();commit('Reset the demo schedule','',()=>{state=makeSeed();});}
  else if(a==='add-truck'&&draft&&draft.assignments.length<3){draft.assignments.push(blankTruck());renderDrawer();}
  else if(a==='remove-truck'&&draft&&draft.assignments.length>1){draft.assignments.splice(Number(button.dataset.slot),1);renderDrawer();}
  else if(a==='remove-crew'&&draft){const slot=Number(button.dataset.slot);draft.assignments[slot].crew=draft.assignments[slot].crew.filter(id=>id!==button.dataset.person);renderDrawer();}
  else if(a==='status')saveDraft(button.dataset.status);
}
function init() {
  loadState();document.querySelectorAll('[data-icon]').forEach(el=>{el.innerHTML=icon(el.dataset.icon);});
  $('#service-filter').innerHTML='<option value="all">All services</option>'+SERVICES.map(s=>`<option>${s}</option>`).join('');
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-action]');if(button&&!button.disabled){event.preventDefault();handleAction(button);}
    if(!event.target.closest('.export-wrap')){$('#export-menu').hidden=true;$('#export-button').setAttribute('aria-expanded','false');}
  });
  $('#search').addEventListener('input',event=>{ui.query=event.target.value;render();});
  $('#service-filter').addEventListener('change',event=>{ui.service=event.target.value;render();});
  $('#job-dialog').addEventListener('input',event=>{if(event.target.dataset.field){updateDraftField(event.target);refreshDraftValidation();}});
  $('#job-dialog').addEventListener('change',event=>{
    const el=event.target;if(!draft)return;
    if(el.dataset.field){updateDraftField(el);const key=el.dataset.field;if(el.tagName==='SELECT'||el.type==='checkbox'){renderDrawer();const next=$(`[data-field="${key}"]`);if(next)next.focus();}else refreshDraftValidation();}
    else if(el.dataset.resource){const kind=el.dataset.resource,slot=Number(el.dataset.slot),id=el.value||null;
      const reason=id?resourceReason(draft,slot,kind,id,state.jobs):'';if(reason){toast(reason,true);renderDrawer();return;}
      if(kind==='crew'){if(id)draft.assignments[slot].crew.push(id);}else draft.assignments[slot][kind]=id;
      renderDrawer();const next=$(`[data-resource="${kind}"][data-slot="${slot}"]`);if(next)next.focus();
    } else if(el.id==='assignment-mode'){draft.contractor=el.value==='contractor'?CONTRACTORS[0].id:null;draft.assignments=draft.contractor?[]:[blankTruck()];renderDrawer();}
    else if(el.id==='contractor-choice'){draft.contractor=el.value;renderDrawer();}
  });
  $('#job-dialog').addEventListener('submit',event=>{event.preventDefault();saveDraft();});
  $('#job-dialog').addEventListener('cancel',()=>{draft=null;});
  for(const id of ['job-dialog','confirm-dialog'])$('#'+id).addEventListener('click',event=>{if(event.target===$('#'+id)){const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom){event.target.close();if(id==='job-dialog')draft=null;}}});
  $('#view').addEventListener('dragstart',event=>{const card=event.target.closest('.job-card');if(!card)return;dragId=card.dataset.job;card.classList.add('dragging');event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',dragId);});
  $('#view').addEventListener('dragover',event=>{const lane=event.target.closest('[data-drop]');if(!lane||!dragId)return;event.preventDefault();lane.classList.add('drop-over');event.dataTransfer.dropEffect='move';});
  $('#view').addEventListener('dragleave',event=>{const lane=event.target.closest('[data-drop]');if(lane&&!lane.contains(event.relatedTarget))lane.classList.remove('drop-over');});
  $('#view').addEventListener('drop',event=>{event.preventDefault();const lane=event.target.closest('[data-drop]');if(lane&&dragId)moveJob(dragId,lane.dataset.drop,lane.dataset.dropType);dragId=null;document.querySelectorAll('.drop-over').forEach(x=>x.classList.remove('drop-over'));});
  $('#view').addEventListener('dragend',()=>{dragId=null;document.querySelectorAll('.dragging,.drop-over').forEach(x=>x.classList.remove('dragging','drop-over'));});
  document.addEventListener('keydown',event=>{
    const editing=event.target.matches('input,textarea,select,[contenteditable="true"]');
    if(event.key==='Escape'){$('#export-menu').hidden=true;$('#export-button').setAttribute('aria-expanded','false');}
    if(editing||$('#job-dialog').open||$('#confirm-dialog').open)return;
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();event.shiftKey?redo():undo();}
    else if(event.key==='/'&&!event.ctrlKey&&!event.metaKey){event.preventDefault();if(ui.view==='activity'){ui.view='board';render();}$('#search').focus();}
    else if(event.key.toLowerCase()==='n'&&!event.ctrlKey&&!event.metaKey){event.preventDefault();openJob(null,true,ui.date);}
  });
  render();if(!storageOK)toast('Browser storage is unavailable. You can still work and export this session.',true);
}
if(typeof document!=='undefined')init();
