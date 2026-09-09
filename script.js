const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const SUPABASE_URL = "TON_URL_SUPABASE";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Xo20VSelYyO9tLTgT0SVbQ_4ZvkwH4B";
const defaults = {
  name:"farouk abu anas",
  username:"farouk abu anas",
  bio:"j'aime trop les salope 🔥🌹",
  link:"",
  followers:0,
  following:0
};

const samplePosts = [
  {id:"demo1",type:"image",src:"https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=900&q=80",caption:"Bienvenue sur mon profil",likes:0},
  {id:"demo2",type:"image",src:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=900&q=80",caption:"",likes:0},
  {id:"demo3",type:"image",src:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=900&q=80",caption:"",likes:0}
];

let state = JSON.parse(localStorage.getItem("igGitHubState") || "null") || {
  profile:{...defaults},
  posts:samplePosts,
  filter:"all",
  liked:{},
  dark:true,
  customMedia:{}
};

function save(){ localStorage.setItem("igGitHubState",JSON.stringify(state)); }
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}
function toast(t){const el=$("#toast");el.textContent=t;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),1800)}

function renderProfile(){
  $("#displayName").textContent=state.profile.name;
  $("#username").textContent=state.profile.username;
  $("#bioText").textContent=state.profile.bio;
  $("#followers").textContent=state.profile.followers;
  $("#following").textContent=state.profile.following;
  $("#bioLink").textContent=state.profile.link ? state.profile.link.replace(/^https?:\/\//,"") : "";
  $("#bioLink").href=state.profile.link || "#";
  $("#bioLink").style.display=state.profile.link ? "inline" : "none";
  document.title = state.profile.username+" — Instagram";
}

function mediaElement(post,forViewer=false){
  if(post.type==="video"){
    const v=document.createElement("video");
    v.src=post.src; v.muted=!forViewer; v.loop=true; v.playsInline=true; v.preload="metadata";
    if(!forViewer){v.autoplay=true}
    return v;
  }
  const img=document.createElement("img"); img.src=post.src; img.alt=post.caption||"Publication"; img.loading="lazy"; return img;
}

function renderGrid(){
  const grid=$("#postGrid"); grid.innerHTML="";
  const posts=state.posts.filter(p=>state.filter==="all"||p.type===state.filter);
  $("#postCount").textContent=state.posts.length;
  $("#emptyState").style.display=posts.length?"none":"block";
  posts.forEach(post=>{
    const card=document.createElement("article"); card.className="post"; card.dataset.id=post.id;
    card.appendChild(mediaElement(post));
    if(post.type==="video"){const vi=document.createElement("span");vi.className="video-icon";vi.textContent="▶";card.appendChild(vi)}
    const badge=document.createElement("span");badge.className="like-badge";badge.textContent="♥ "+(post.likes||0);card.appendChild(badge);
    let lastTap=0;
    card.addEventListener("click",e=>{
      const now=Date.now();
      if(now-lastTap<350){like(post.id,card,true);lastTap=0;return}
      lastTap=now;
      setTimeout(()=>{if(Date.now()-lastTap>=300)openViewer(post.id)},320);
    });
    grid.appendChild(card);
  });
}

function like(id,card,pop=false){
  const post=state.posts.find(p=>p.id===id); if(!post)return;
  const key=id;
  if(!state.liked[key]){post.likes=(post.likes||0)+1;state.liked[key]=true}else{post.likes=Math.max(0,(post.likes||0)-1);state.liked[key]=false}
  save(); renderGrid();
  if(pop && state.liked[key]){
    const target=[...$("#postGrid").children].find(x=>x.dataset.id===id);
    if(target){const h=document.createElement("div");h.className="heart-pop";h.textContent="♥";target.appendChild(h);setTimeout(()=>h.remove(),750)}
  }
}

let viewerIndex=0;
function openViewer(id){
  const posts=state.posts.filter(p=>state.filter==="all"||p.type===state.filter);
  viewerIndex=Math.max(0,posts.findIndex(p=>p.id===id)); if(viewerIndex<0)return;
  showViewerPost();
  $("#viewer").classList.add("open");$("#viewer").setAttribute("aria-hidden","false");
  document.body.style.overflow="hidden";
}
function showViewerPost(){
  const posts=state.posts.filter(p=>state.filter==="all"||p.type===state.filter);
  const post=posts[viewerIndex]; if(!post)return;
  const c=$("#viewerContent");c.innerHTML="";
  const el=mediaElement(post,true); c.appendChild(el);
  if(post.type==="video"){el.autoplay=true;el.controls=true;el.muted=false;el.playsInline=true;el.addEventListener("canplay",()=>el.play().catch(()=>{}),{once:true})}
  $("#viewerCaption").textContent=post.caption||"";
}
function closeViewer(){$("#viewer").classList.remove("open");$("#viewer").setAttribute("aria-hidden","true");$("#viewerContent").innerHTML="";document.body.style.overflow=""}
$("#viewerClose").onclick=closeViewer;
$("#viewer").addEventListener("click",e=>{if(e.target.id==="viewer")closeViewer()});
$("#viewerPrev").onclick=()=>{const n=state.posts.filter(p=>state.filter==="all"||p.type===state.filter).length;viewerIndex=(viewerIndex-1+n)%n;showViewerPost()};
$("#viewerNext").onclick=()=>{const n=state.posts.filter(p=>state.filter==="all"||p.type===state.filter).length;viewerIndex=(viewerIndex+1)%n;showViewerPost()};
document.addEventListener("keydown",e=>{if(!$("#viewer").classList.contains("open"))return;if(e.key==="Escape")closeViewer();if(e.key==="ArrowLeft")$("#viewerPrev").click();if(e.key==="ArrowRight")$("#viewerNext").click()});

$$(".tab").forEach(t=>t.onclick=()=>{$$(".tab").forEach(x=>x.classList.remove("active"));t.classList.add("active");state.filter=t.dataset.filter;save();renderGrid()});

$("#editProfileBtn").onclick=()=>{
  $("#nameInput").value=state.profile.name;$("#usernameInput").value=state.profile.username;$("#bioInput").value=state.profile.bio;$("#linkInput").value=state.profile.link;
  $("#profileDialog").showModal();
};
$("#profileForm").addEventListener("submit",e=>{
  e.preventDefault();
  state.profile.name=$("#nameInput").value.trim()||defaults.name;
  state.profile.username=$("#usernameInput").value.trim()||defaults.username;
  state.profile.bio=$("#bioInput").value.trim();
  state.profile.link=$("#linkInput").value.trim();
  save();renderProfile();$("#profileDialog").close();toast("Profil modifié");
});

$("#shareBtn").onclick=async()=>{
  try{await navigator.clipboard.writeText(location.href);toast("Lien du profil copié")}catch{toast("Copie du lien impossible")}
};

function setMedia(input,img,video,key){
  const file=input.files?.[0];if(!file)return;
  const url=URL.createObjectURL(file);
  state.customMedia[key]=url; save();
  if(file.type.startsWith("video/")){img.style.display="none";video.style.display="block";video.src=url;video.currentTime=0;video.play().catch(()=>{})}
  else{video.pause();video.removeAttribute("src");video.load();video.style.display="none";img.style.display="block";img.src=url}
}
$("#avatarInput").onchange=()=>setMedia($("#avatarInput"),$("#avatarImg"),$("#avatarVideo"),"avatar");
$("#coverInput").onchange=()=>setMedia($("#coverInput"),$("#coverImg"),$("#coverVideo"),"cover");

function restoreMedia(){
  const a=state.customMedia.avatar,c=state.customMedia.cover;
  if(a){if(a.startsWith("blob:")){/* blob URLs do not survive a full refresh; file can be selected again */}}
  if(c){}
  // Default visuals if no custom media
  if(!a){$("#avatarImg").src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&q=80"}
  if(!c){$("#coverImg").src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1400&q=85"}
}
restoreMedia();

$("#addPostBtn").onclick=()=>$("#postDialog").showModal();
$("#postForm").addEventListener("submit",e=>{
  e.preventDefault();
  const f=$("#postInput").files?.[0];if(!f)return;
  const url=URL.createObjectURL(f);
  state.posts.unshift({id:"p"+Date.now(),type:f.type.startsWith("video/")?"video":"image",src:url,caption:$("#captionInput").value.trim(),likes:0});
  save();renderGrid();$("#postDialog").close();$("#postForm").reset();toast("Publication ajoutée");
});

$("#themeBtn").onclick=()=>{
  state.dark=!state.dark;document.body.classList.toggle("light",!state.dark);save();$("#themeBtn").textContent=state.dark?"☾":"☀";
};
if(!state.dark){document.body.classList.add("light");$("#themeBtn").textContent="☀"}

renderProfile();renderGrid();
