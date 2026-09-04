const cfg=window.BOXPAK_CONFIG;
const validConfig=cfg&&cfg.supabaseUrl&&!cfg.supabaseUrl.startsWith("PASTE_")&&cfg.supabaseAnonKey&&!cfg.supabaseAnonKey.startsWith("PASTE_");
const client=validConfig?supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey):null;
const $=id=>document.getElementById(id);let currentRows=[];
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
const timeText=v=>v?String(v).replace("T"," ").slice(11,19):"";
function durationText(a,b){if(!a||!b)return "";const seconds=Math.max(0,(new Date(b)-new Date(a))/1000);return `${Math.floor(seconds/3600)} giờ ${Math.floor(seconds%3600/60)} phút`;}
function showApp(session){$("loginView").classList.add("hidden");$("appView").classList.remove("hidden");$("userEmail").textContent=session.user.email;loadData();}
function showLogin(){$("appView").classList.add("hidden");$("loginView").classList.remove("hidden");}
async function loadData(){
  $("loadStatus").textContent="Đang tải...";const date=$("workDate").value;const site=$("siteCode").value.trim();
  const {data,error}=await client.from("attendance_daily").select("*").eq("work_date",date).eq("site_code",site).order("first_seen");
  if(error){$("loadStatus").textContent="Lỗi: "+error.message;return;}currentRows=data||[];
  $("attendanceBody").innerHTML=currentRows.length?currentRows.map(r=>`<tr><td>${escapeHtml(r.employee_code)}</td><td class="name">${escapeHtml(r.full_name)}</td><td>${escapeHtml(r.department)}</td><td>${timeText(r.first_seen)}</td><td>${timeText(r.last_seen)}</td><td>${durationText(r.first_seen,r.last_seen)}</td><td>${r.recognition_count}</td></tr>`).join(""):`<tr><td colspan="7" class="empty">Chưa có dữ liệu</td></tr>`;
  $("totalCount").textContent=currentRows.length;$("deptCount").textContent=new Set(currentRows.map(r=>r.department)).size;
  $("lastUpdate").textContent=currentRows.length?timeText(currentRows.reduce((a,b)=>a.last_seen>b.last_seen?a:b).last_seen):"--:--";$("loadStatus").textContent=`${currentRows.length} công nhân`;
}
function escapeHtml(v){return String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));}
function exportCsv(){const head=["MSNV","Họ tên","Bộ phận","Giờ vào","Giờ ra","Tổng số giờ phút có mặt"];const lines=[head,...currentRows.map(r=>[r.employee_code,r.full_name,r.department,timeText(r.first_seen),timeText(r.last_seen),durationText(r.first_seen,r.last_seen)])];const csv="\ufeff"+lines.map(row=>row.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\r\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));a.download=`cham-cong-${$("siteCode").value}-${$("workDate").value}.csv`;a.click();URL.revokeObjectURL(a.href);}
$("workDate").value=today();$("siteCode").value=cfg?.defaultSite||"NHA_MAY_A";
$("loginForm").addEventListener("submit",async e=>{e.preventDefault();if(!client){$("loginError").textContent="Website chưa được cấu hình Supabase.";return;}$("loginError").textContent="Đang đăng nhập...";const {data,error}=await client.auth.signInWithPassword({email:$("email").value,password:$("password").value});if(error){$("loginError").textContent=error.message;return;}$("loginError").textContent="";showApp(data.session);});
$("logoutBtn").onclick=async()=>{await client.auth.signOut();showLogin();};$("refreshBtn").onclick=loadData;$("exportBtn").onclick=exportCsv;$("workDate").onchange=loadData;
if(client)client.auth.getSession().then(({data})=>data.session?showApp(data.session):showLogin());

