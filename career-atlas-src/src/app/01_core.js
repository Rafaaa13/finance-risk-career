const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ST={view:'overview',cat:'all',mode:'stable',q:'',sort:'idx',onlyHC:false,sel:null,cmp:[],my:{},roleGroup:'全部',roleQ:'',roleOpen:null};
const W={stable:{st:.22,wl:.14,gr:.12,pa:.12,fi:.24,en:.16},growth:{st:.08,wl:.08,gr:.24,pa:.24,fi:.22,en:.14}};
const SK=[['st','稳定性'],['wl','工作节奏'],['gr','成长性'],['pa','薪酬上限'],['fi','目标适配'],['en','进入容易度']];
const idx=c=>{const w=W[ST.mode];let t=0,s=0;for(const k in w){t+=w[k]*c.s[k];s+=w[k]}return t/s};
const vw=b=>({E1:1,E2:1,E3:.5,ND:0}[b]??0);
const unk=t=>!t||/^未(核实|披露)/.test(t)||t==='未核实';
const comp=c=>vw(c.hc[1])+vw(c.pay[1])+(unk(c.req.deg)?0:1)+(c.pos.length&&c.pos.some(p=>!/未取得|未核实/.test(p.w))?1:0)+(unk(c.time)?0:1);
const reqB=c=>/转载/.test(c.time)||c.src.some(s=>/career\.nankai|job\.hust|career\.cup/.test(s[1]))?'E3':'E1';
const payVal=c=>{const m=(c.pay[0]||'').match(/≈([\d.]+)万元\/人/);return m?m[1]:null};
const catOf=id=>CATS.find(x=>x.id===id)||{n:id};
const coBy=id=>CO.find(c=>c.id===id);
const badge=b=>`<span class="ev ${b}" title="${EV[b]}">${b}</span>`;
const tag=(t,k='')=>`<span class="tag ${k}">${t}</span>`;
const short=(t,n=46)=>{t=String(t||'');return t.length>n?t.slice(0,n)+'…':t};
function rankMap(){const m={};CATS.forEach(k=>{CO.filter(c=>c.cat===k.id).sort((a,b)=>idx(b)-idx(a)).forEach((c,i)=>m[c.id]=i+1)});return m}
function list(){
 const q=ST.q.trim().toLowerCase();
 let a=CO.filter(c=>(ST.cat==='all'||c.cat===ST.cat)&&(!q||(c.n+c.why+c.pos.map(p=>p.n+p.w).join('')).toLowerCase().includes(q))&&(!ST.onlyHC||c.hc[1]==='E1'||c.hc[1]==='E2'));
 const f={idx:c=>idx(c),comp:c=>comp(c)*10+idx(c)/10,en:c=>c.s.en*10+idx(c)/10,st:c=>c.s.st*10+idx(c)/10,pa:c=>c.s.pa*10+idx(c)/10};
 return a.sort((x,y)=>f[ST.sort](y)-f[ST.sort](x));
}
const KEY='career-atlas-v2';
function load(){try{const d=JSON.parse(localStorage.getItem(KEY)||'{}');if(d.mode)ST.mode=d.mode;if(Array.isArray(d.cmp))ST.cmp=d.cmp.filter(i=>coBy(i));if(d.my)ST.my=d.my}catch(e){}}
function save(){try{localStorage.setItem(KEY,JSON.stringify({mode:ST.mode,cmp:ST.cmp,my:ST.my}))}catch(e){}}
function download(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
function toast(m){const n=$('#toast');n.textContent=m;n.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>n.classList.remove('show'),2200)}
function csv(rows){return '\ufeff'+rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\n')}
function exportCSV(){
 const rm=rankMap(),rows=[['类别','类内排名','机构','综合指数','证据完整度/5','2027/最近HC','HC证据','薪酬口径','学历','英语','实习','时间节点','未核实项']];
 list().forEach(c=>rows.push([catOf(c.cat).n,rm[c.id],c.n,idx(c).toFixed(2),comp(c).toFixed(1),c.hc[0],c.hc[1],c.pay[0],c.req.deg,c.req.eng,c.req.int,c.time,c.gap.join('；')]));
 download('金融机构岗位对比表.csv',csv(rows),'text/csv;charset=utf-8');toast('已导出当前列表 CSV')}
function myOf(id){return ST.my[id]||(ST.my[id]={s:'',n:''})}
