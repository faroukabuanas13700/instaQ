const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

/* =========================================================
SUPABASE
========================================================= */

const SUPABASE_URL =
"https://sozzpklmlhtvwxbuecax.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
"sb_publishable_Xo20VSelYyO9tLTgT0SVbQ_4ZvkwH4B";

let supabaseClient = null;

if (
window.supabase &&
typeof window.supabase.createClient === "function"
) {
supabaseClient = window.supabase.createClient(
SUPABASE_URL,
SUPABASE_PUBLISHABLE_KEY
);
}

function supabaseReady() {
if (!supabaseClient) {
console.error("Supabase JS n'est pas chargé.");
toast("Supabase ne s'est pas chargé");
return false;
}
return true;
}

/* =========================================================
AUTHENTIFICATION
========================================================= */

function addAuthStyles() {
if ($("#instaqAuthStyles")) return;

const style = document.createElement("style");
style.id = "instaqAuthStyles";

style.textContent = `
.auth-screen{
position:fixed;
inset:0;
z-index:9999;
display:flex;
align-items:center;
justify-content:center;
background:#000;
padding:20px;
box-sizing:border-box;
}

.auth-box{
  width:min(350px,100%);
  text-align:center;
}

.auth-logo{
  color:#fff;
  font-size:38px;
  font-weight:700;
  margin-bottom:8px;
}

.auth-subtitle{
  color:#aaa;
  margin:0 0 25px;
  font-size:14px;
}

.auth-form{
  display:flex;
  flex-direction:column;
  gap:10px;
}

.auth-form input{
  width:100%;
  box-sizing:border-box;
  padding:13px;
  border:1px solid #333;
  border-radius:6px;
  background:#111;
  color:#fff;
  outline:none;
  font-size:14px;
}

.auth-form button{
  border:0;
  border-radius:6px;
  padding:12px;
  font-weight:600;
  cursor:pointer;
  font-size:14px;
}

.auth-primary{
  background:#0095f6;
  color:#fff;
}

.auth-secondary{
  background:#222;
  color:#fff;
}

.auth-separator{
  display:flex;
  align-items:center;
  gap:12px;
  color:#777;
  font-size:12px;
  margin:18px 0;
}

.auth-separator:before,
.auth-separator:after{
  content:"";
  height:1px;
  background:#333;
  flex:1;
}

.auth-error{
  color:#ff5c67;
  font-size:12px;
  min-height:16px;
  margin-top:2px;
}

#app{
  min-height:100vh;
}

.logout-btn{
  width:100%;
  margin-top:10px;
  padding:10px;
  border:1px solid #333;
  background:transparent;
  color:#fff;
  border-radius:6px;
  cursor:pointer;
}

`;

document.head.appendChild(style);
}

function showAuthScreen() {
const auth = $("#authScreen");
const app = $("#app");

if (auth) auth.style.display = "flex";
if (app) app.style.display = "none";
}

function showApp() {
const auth = $("#authScreen");
const app = $("#app");

if (auth) auth.style.display = "none";
if (app) app.style.display = "block";
}

async function loginUser(email, password) {
if (!supabaseReady()) return;

const errorBox = $("#loginError");

if (errorBox) errorBox.textContent = "";

const result =
await supabaseClient.auth.signInWithPassword({
email,
password
});

if (result.error) {
console.error(result.error);

if (errorBox) {
  errorBox.textContent =
    result.error.message;
}

return;

}

toast("Connexion réussie");

showApp();

await loadSupabasePosts();
}

async function signupUser(email, password) {
if (!supabaseReady()) return;

const errorBox = $("#signupError");

if (errorBox) errorBox.textContent = "";

const result =
await supabaseClient.auth.signUp({
email,
password
});

if (result.error) {
console.error(result.error);

if (errorBox) {
  errorBox.textContent =
    result.error.message;
}

return;

}

if (result.data.session) {
toast("Compte créé");
showApp();
await loadSupabasePosts();
} else {
toast("Compte créé. Vous pouvez vous connecter.");
}
}

function setupAuth() {
addAuthStyles();

const loginForm = $("#loginForm");
const signupForm = $("#signupForm");

if (loginForm) {
loginForm.addEventListener("submit", async e => {
e.preventDefault();

  const email =
    $("#loginEmail")?.value.trim();

  const password =
    $("#loginPassword")?.value;

  if (!email || !password) return;

  await loginUser(email, password);
});

}

if (signupForm) {
signupForm.addEventListener("submit", async e => {
e.preventDefault();

  const email =
    $("#signupEmail")?.value.trim();

  const password =
    $("#signupPassword")?.value;

  if (!email || !password) return;

  await signupUser(email, password);
});

}

supabaseClient?.auth.onAuthStateChange(
async (_event, session) => {
if (session?.user) {
showApp();
} else {
showAuthScreen();
}
}
);
}

/* =========================================================
PROFIL PAR DEFAUT
========================================================= */

const defaults = {
name: "farouk abu anas",
username: "farouk abu anas",
bio: "j'aime trop les salope 🔥🌹",
link: "",
followers: 0,
following: 0
};

/* =========================================================
PUBLICATIONS DEMO
========================================================= */

const samplePosts = [
{
id: "demo1",
type: "image",
src: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=900&q=80",
caption: "Bienvenue sur mon profil",
likes: 0
},
{
id: "demo2",
type: "image",
src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=900&q=80",
caption: "",
likes: 0
},
{
id: "demo3",
type: "image",
src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=900&q=80",
caption: "",
likes: 0
}
];

/* =========================================================
ETAT LOCAL
========================================================= */

let state;

try {
state = JSON.parse(
localStorage.getItem("igGitHubState") || "null"
);
} catch {
state = null;
}

if (!state) {
state = {
profile: { ...defaults },
posts: [...samplePosts],
filter: "all",
liked: {},
dark: true,
customMedia: {
avatar: "",
cover: ""
}
};
}

state.profile = {
...defaults,
...(state.profile || {})
};

state.posts = Array.isArray(state.posts)
? state.posts
: [...samplePosts];

state.liked = state.liked || {};
state.customMedia = state.customMedia || {};

state.customMedia.avatar =
state.customMedia.avatar || "";

state.customMedia.cover =
state.customMedia.cover || "";

if (typeof state.dark !== "boolean") {
state.dark = true;
}

if (!state.filter) {
state.filter = "all";
}

function save() {
localStorage.setItem(
"igGitHubState",
JSON.stringify(state)
);
}

/* =========================================================
NOTIFICATION
========================================================= */

function toast(text) {
const el = $("#toast");

if (!el) return;

el.textContent = text;
el.classList.add("show");

clearTimeout(toast.timer);

toast.timer = setTimeout(() => {
el.classList.remove("show");
}, 2200);
}

/* =========================================================
PROFIL
========================================================= */

function renderProfile() {
if ($("#displayName"))
$("#displayName").textContent =
state.profile.name;

if ($("#username"))
$("#username").textContent =
state.profile.username;

if ($("#bioText"))
$("#bioText").textContent =
state.profile.bio;

if ($("#followers"))
$("#followers").textContent =
state.profile.followers;

if ($("#following"))
$("#following").textContent =
state.profile.following;

if ($("#bioLink")) {
const link = state.profile.link || "";

$("#bioLink").textContent =
  link.replace(/^https?:\/\//, "");

$("#bioLink").href = link || "#";

$("#bioLink").style.display =
  link ? "inline" : "none";

}

document.title =
(state.profile.username ||
defaults.username) +
" — InstaQ";
}

/* =========================================================
MEDIA
========================================================= */

function mediaElement(post, forViewer = false) {
if (post.type === "video") {
const video =
document.createElement("video");

video.src = post.src;
video.loop = true;
video.playsInline = true;
video.preload = "metadata";

if (forViewer) {
  video.controls = true;
  video.muted = false;
} else {
  video.muted = true;
  video.autoplay = true;
}

return video;

}

const img =
document.createElement("img");

img.src = post.src;
img.alt =
post.caption || "Publication";
img.loading = "lazy";

return img;
}

/* =========================================================
GRILLE
========================================================= */

function renderGrid() {
const grid = $("#postGrid");

if (!grid) return;

grid.innerHTML = "";

const posts =
state.posts.filter(post =>
state.filter === "all" ||
post.type === state.filter
);

if ($("#postCount"))
$("#postCount").textContent =
state.posts.length;

if ($("#emptyState"))
$("#emptyState").style.display =
posts.length ? "none" : "block";

posts.forEach(post => {
const card =
document.createElement("article");

card.className = "post";
card.dataset.id = post.id;

card.appendChild(
  mediaElement(post)
);

if (post.type === "video") {
  const icon =
    document.createElement("span");

  icon.className = "video-icon";
  icon.textContent = "▶";

  card.appendChild(icon);
}

const likeBadge =
  document.createElement("span");

likeBadge.className = "like-badge";
likeBadge.textContent =
  "♥ " + (post.likes || 0);

card.appendChild(likeBadge);

let lastTap = 0;

card.addEventListener("click", () => {
  const now = Date.now();

  if (now - lastTap < 350) {
    like(post.id, true);
    lastTap = 0;
    return;
  }

  lastTap = now;

  setTimeout(() => {
    if (Date.now() - lastTap >= 300) {
      openViewer(post.id);
    }
  }, 320);
});

grid.appendChild(card);

});
}

/* =========================================================
LIKE
========================================================= */

function like(id, showAnimation = false) {
const post =
state.posts.find(p => p.id === id);

if (!post) return;

if (!state.liked[id]) {
post.likes =
(post.likes || 0) + 1;

state.liked[id] = true;

} else {
post.likes =
Math.max(
0,
(post.likes || 0) - 1
);

state.liked[id] = false;

}

save();
renderGrid();

if (showAnimation && state.liked[id]) {
const target =
[...($("#postGrid")?.children || [])]
.find(x => x.dataset.id === id);

if (target) {
  const heart =
    document.createElement("div");

  heart.className = "heart-pop";
  heart.textContent = "♥";

  target.appendChild(heart);

  setTimeout(() => heart.remove(), 750);
}

}
}

/* =========================================================
VISUALISEUR
========================================================= */

let viewerIndex = 0;

function getFilteredPosts() {
return state.posts.filter(post =>
state.filter === "all" ||
post.type === state.filter
);
}

function openViewer(id) {
const posts = getFilteredPosts();

const index =
posts.findIndex(post => post.id === id);

if (index < 0) return;

viewerIndex = index;
showViewerPost();

const viewer = $("#viewer");

if (!viewer) return;

viewer.classList.add("open");
viewer.setAttribute("aria-hidden", "false");
document.body.style.overflow = "hidden";
}

function showViewerPost() {
const posts = getFilteredPosts();
const post = posts[viewerIndex];

if (!post) return;

const content = $("#viewerContent");

if (!content) return;

content.innerHTML = "";

const element =
mediaElement(post, true);

content.appendChild(element);

if (post.type === "video") {
element.autoplay = true;
element.controls = true;
element.muted = false;

element.addEventListener(
  "canplay",
  () => element.play().catch(() => {}),
  { once: true }
);

}

if ($("#viewerCaption"))
$("#viewerCaption").textContent =
post.caption || "";
}

function closeViewer() {
const viewer = $("#viewer");

if (!viewer) return;

viewer.classList.remove("open");
viewer.setAttribute("aria-hidden", "true");

if ($("#viewerContent"))
$("#viewerContent").innerHTML = "";

document.body.style.overflow = "";
}

$("#viewerClose")?.addEventListener(
"click",
closeViewer
);

$("#viewer")?.addEventListener(
"click",
e => {
if (e.target.id === "viewer")
closeViewer();
}
);

$("#viewerPrev")?.addEventListener(
"click",
() => {
const posts = getFilteredPosts();

if (!posts.length) return;

viewerIndex =
  (viewerIndex - 1 + posts.length) %
  posts.length;

showViewerPost();

}
);

$("#viewerNext")?.addEventListener(
"click",
() => {
const posts = getFilteredPosts();

if (!posts.length) return;

viewerIndex =
  (viewerIndex + 1) %
  posts.length;

showViewerPost();

}
);

document.addEventListener("keydown", e => {
const viewer = $("#viewer");

if (
!viewer ||
!viewer.classList.contains("open")
) return;

if (e.key === "Escape")
closeViewer();

if (e.key === "ArrowLeft")
$("#viewerPrev")?.click();

if (e.key === "ArrowRight")
$("#viewerNext")?.click();
});

/* =========================================================
FILTRES
========================================================= */

$$(".tab").forEach(tab => {
tab.onclick = () => {
$$(".tab").forEach(t =>
t.classList.remove("active")
);

tab.classList.add("active");

state.filter =
  tab.dataset.filter;

save();
renderGrid();

};
});

/* =========================================================
MODIFICATION PROFIL
========================================================= */

$("#editProfileBtn")?.addEventListener(
"click",
() => {
if ($("#nameInput"))
$("#nameInput").value =
state.profile.name || "";

if ($("#usernameInput"))
  $("#usernameInput").value =
    state.profile.username || "";

if ($("#bioInput"))
  $("#bioInput").value =
    state.profile.bio || "";

if ($("#linkInput"))
  $("#linkInput").value =
    state.profile.link || "";

const dialog = $("#profileDialog");

if (
  dialog &&
  typeof dialog.showModal === "function"
) {
  dialog.showModal();
}

}
);

$("#profileForm")?.addEventListener(
"submit",
e => {
e.preventDefault();

state.profile.name =
  $("#nameInput").value.trim() ||
  defaults.name;

state.profile.username =
  $("#usernameInput").value.trim() ||
  defaults.username;

state.profile.bio =
  $("#bioInput").value.trim();

state.profile.link =
  $("#linkInput").value.trim();

save();
renderProfile();

$("#profileDialog")?.close();

toast("Profil modifié");

}
);

/* =========================================================
PARTAGE
========================================================= */

$("#shareBtn")?.addEventListener(
"click",
async () => {
try {
await navigator.clipboard.writeText(
location.href
);

  toast("Lien du profil copié");
} catch {
  toast("Copie du lien impossible");
}

}
);

/* =========================================================
MEDIA PROFIL / BANNIERE
========================================================= */

async function setMedia(
input,
img,
video,
key
) {
const file = input.files?.[0];

if (!file) return;
if (!supabaseReady()) return;

toast("Envoi en cours...");

const extension =
file.name.split(".").pop()?.toLowerCase() ||
"bin";

const path =
key +
"/" +
Date.now() +
"-" +
Math.random().toString(36).slice(2) +
"." +
extension;

try {
const result =
await supabaseClient.storage
.from("media")
.upload(path, file, {
upsert: false,
contentType: file.type
});

if (result.error) {
  toast(
    "Erreur upload : " +
    result.error.message
  );
  return;
}

const publicResult =
  supabaseClient.storage
    .from("media")
    .getPublicUrl(path);

const url =
  publicResult.data?.publicUrl;

if (!url) {
  toast("URL introuvable");
  return;
}

state.customMedia[key] = url;
save();

if (file.type.startsWith("video/")) {
  if (img) img.style.display = "none";

  if (video) {
    video.style.display = "block";
    video.src = url;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.load();
    video.play().catch(() => {});
  }
} else {
  if (video) {
    video.pause();
    video.removeAttribute("src");
    video.load();
    video.style.display = "none";
  }

  if (img) {
    img.style.display = "block";
    img.src = url;
  }
}

toast(
  key === "avatar"
    ? "Photo de profil modifiée"
    : "Bannière modifiée"
);

input.value = "";

} catch (error) {
console.error(error);
toast("Erreur pendant l'envoi");
}
}

$("#avatarInput")?.addEventListener(
"change",
() =>
setMedia(
$("#avatarInput"),
$("#avatarImg"),
$("#avatarVideo"),
"avatar"
)
);

$("#coverInput")?.addEventListener(
"change",
() =>
setMedia(
$("#coverInput"),
$("#coverImg"),
$("#coverVideo"),
"cover"
)
);

/* =========================================================
RESTAURATION MEDIA
========================================================= */

function restoreMedia() {
const avatar = state.customMedia.avatar;
const cover = state.customMedia.cover;

if (avatar && $("#avatarImg") && $("#avatarVideo")) {
const isVideo =
/.(mp4|webm|mov|m4v|ogg)(?|$)/i.test(avatar);

if (isVideo) {
  $("#avatarImg").style.display = "none";
  $("#avatarVideo").style.display = "block";
  $("#avatarVideo").src = avatar;
  $("#avatarVideo").muted = true;
  $("#avatarVideo").loop = true;
  $("#avatarVideo").playsInline = true;
  $("#avatarVideo").load();
  $("#avatarVideo").play().catch(() => {});
} else {
  $("#avatarVideo").pause();
  $("#avatarVideo").removeAttribute("src");
  $("#avatarVideo").load();
  $("#avatarVideo").style.display = "none";
  $("#avatarImg").style.display = "block";
  $("#avatarImg").src = avatar;
}

} else {
$("#avatarVideo")?.style &&
($("#avatarVideo").style.display = "none");

if ($("#avatarImg")) {
  $("#avatarImg").style.display = "block";
  $("#avatarImg").src =
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&q=80";
}

}

if (cover && $("#coverImg") && $("#coverVideo")) {
const isVideo =
/.(mp4|webm|mov|m4v|ogg)(?|$)/i.test(cover);

if (isVideo) {
  $("#coverImg").style.display = "none";
  $("#coverVideo").style.display = "block";
  $("#coverVideo").src = cover;
  $("#coverVideo").muted = true;
  $("#coverVideo").loop = true;
  $("#coverVideo").playsInline = true;
  $("#coverVideo").load();
  $("#coverVideo").play().catch(() => {});
} else {
  $("#coverVideo").pause();
  $("#coverVideo").removeAttribute("src");
  $("#coverVideo").load();
  $("#coverVideo").style.display = "none";
  $("#coverImg").style.display = "block";
  $("#coverImg").src = cover;
}

} else {
$("#coverVideo")?.style &&
($("#coverVideo").style.display = "none");

if ($("#coverImg")) {
  $("#coverImg").style.display = "block";
  $("#coverImg").src =
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1400&q=85";
}

}
}

/* =========================================================
AJOUT PUBLICATION
========================================================= */

$("#addPostBtn")?.addEventListener(
"click",
() => $("#postInput")?.click()
);

$("#postInput")?.addEventListener(
"change",
async () => {
const file = $("#postInput").files?.[0];

if (!file || !supabaseReady()) return;

const progress = $("#uploadProgress");
const progressText = $("#uploadProgressText");
const progressFill = $("#uploadProgressFill");

if (progress) progress.style.display = "block";
if (progressText)
  progressText.textContent = "Envoi en cours…";
if (progressFill)
  progressFill.style.width = "30%";

toast("Publication en cours...");

const extension =
  file.name.split(".").pop()?.toLowerCase() ||
  "bin";

const path =
  "posts/" +
  Date.now() +
  "-" +
  Math.random().toString(36).slice(2) +
  "." +
  extension;

try {
  const upload =
    await supabaseClient.storage
      .from("media")
      .upload(path, file, {
        upsert: false,
        contentType: file.type
      });

  if (upload.error) {
    if (progress)
      progress.style.display = "none";

    toast(
      "Erreur upload : " +
      upload.error.message
    );

    return;
  }

  if (progressFill)
    progressFill.style.width = "70%";

  const publicResult =
    supabaseClient.storage
      .from("media")
      .getPublicUrl(path);

  const mediaUrl =
    publicResult.data?.publicUrl;

  if (!mediaUrl) {
    if (progress)
      progress.style.display = "none";

    toast("URL introuvable");
    return;
  }

  const postData = {
    type:
      file.type.startsWith("video/")
        ? "video"
        : "image",

    media_url: mediaUrl,
    caption: "",
    likes: 0
  };

  const result =
    await supabaseClient
      .from("posts")
      .insert(postData)
      .select()
      .single();

  if (result.error) {
    if (progress)
      progress.style.display = "none";

    toast(
      "Erreur base de données : " +
      result.error.message
    );

    return;
  }

  if (progressFill)
    progressFill.style.width = "100%";

  if (progressText)
    progressText.textContent = "Publié ✓";

  const post = result.data;

  state.posts.unshift({
    id: post.id,
    type: post.type,
    src: post.media_url,
    caption: post.caption || "",
    likes: post.likes || 0
  });

  save();
  renderGrid();

  $("#postInput").value = "";

  toast("Publication ajoutée");

  setTimeout(() => {
    if (progress)
      progress.style.display = "none";
  }, 700);

} catch (error) {
  console.error(error);

  if (progress)
    progress.style.display = "none";

  toast("Erreur pendant la publication");
}

}
);

/* =========================================================
CHARGEMENT PUBLICATIONS
========================================================= */

async function loadSupabasePosts() {
if (!supabaseReady()) return;

try {
const result =
await supabaseClient
.from("posts")
.select("*")
.order("id", {
ascending: false
});

if (result.error) {
  console.error(
    "Erreur lecture posts:",
    result.error
  );
  return;
}

const remotePosts =
  result.data || [];

const converted =
  remotePosts.map(post => ({
    id: post.id,
    type: post.type,
    src: post.media_url,
    caption: post.caption || "",
    likes: post.likes || 0
  }));

if (converted.length > 0) {
  state.posts = converted;
}

save();
renderGrid();

} catch (error) {
console.error(
"Erreur chargement Supabase:",
error
);
}
}

/* =========================================================
THEME
========================================================= */

$("#themeBtn")?.addEventListener(
"click",
() => {
state.dark = !state.dark;

document.body.classList.toggle(
  "light",
  !state.dark
);

$("#themeBtn").textContent =
  state.dark ? "☾" : "☀";

save();

}
);

if (!state.dark) {
document.body.classList.add("light");

if ($("#themeBtn"))
$("#themeBtn").textContent = "☀";
}

/* =========================================================
INITIALISATION
========================================================= */

restoreMedia();
renderProfile();
renderGrid();

addAuthStyles();

if (supabaseClient) {
supabaseClient.auth.getSession()
.then(async ({ data }) => {
if (data?.session?.user) {
showApp();
await loadSupabasePosts();
} else {
showAuthScreen();
}
});
}

setupAuth();
