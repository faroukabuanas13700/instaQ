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

    .auth-form input:focus{
      border-color:#555;
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

    .auth-form button:disabled{
      opacity:.6;
      cursor:wait;
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

/* =========================================================
CONNEXION
========================================================= */

async function loginUser(email, password) {
  if (!supabaseReady()) return;

  const errorBox = $("#loginError");
  const button = $("#loginForm button[type='submit']");

  if (errorBox) errorBox.textContent = "";

  if (button) {
    button.disabled = true;
    button.textContent = "Connexion...";
  }

  try {
    const result =
      await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

    if (result.error) {
      console.error(result.error);

      if (errorBox) {
        errorBox.textContent = result.error.message;
      }

      if (button) {
        button.disabled = false;
        button.textContent = "Se connecter";
      }

      return;
    }

    showApp();
    toast("Connexion réussie");

    await loadSupabasePosts();

  } catch (error) {
    console.error("Erreur connexion :", error);

    if (errorBox) {
      errorBox.textContent =
        error.message || "Erreur de connexion.";
    }
  }

  if (button) {
    button.disabled = false;
    button.textContent = "Se connecter";
  }
}

/* =========================================================
INSCRIPTION
========================================================= */

async function signupUser(email, password) {
  if (!supabaseReady()) return;

  const errorBox = $("#signupError");
  const button = $("#signupForm button[type='submit']");

  if (errorBox) errorBox.textContent = "";

  if (button) {
    button.disabled = true;
    button.textContent = "Création...";
  }

  try {
    const result =
      await supabaseClient.auth.signUp({
        email,
        password
      });

    if (result.error) {
      console.error(result.error);

      if (errorBox) {
        errorBox.textContent = result.error.message;
      }

      return;
    }

    if (result.data.session) {
      showApp();
      toast("Compte créé");
      await loadSupabasePosts();
    } else {
      toast("Compte créé. Vous pouvez vous connecter.");
    }

  } catch (error) {
    console.error("Erreur inscription :", error);

    if (errorBox) {
      errorBox.textContent =
        error.message ||
        "Erreur pendant la création du compte.";
    }

  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Créer un compte";
    }
  }
}

/* =========================================================
CONFIGURATION AUTH
========================================================= */

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

      if (!email || !password) {
        $("#loginError").textContent =
          "Veuillez remplir les deux champs.";
        return;
      }

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

      if (!email || !password) {
        $("#signupError").textContent =
          "Veuillez remplir les deux champs.";
        return;
      }

      await signupUser(email, password);
    });
  }

  if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          showApp();
        } else {
          showAuthScreen();
        }
      }
    );
  }
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
    state.posts.find(p => p.id == id);

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
        .find(x => x.dataset.id == id);

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
    posts.findIndex(post => post.id == id);

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

async function setMedia(input, img, video, storagePath, type) {
  const file = input?.files?.[0];

  if (!file) return;

  if (!supabaseReady()) return;

  const progress = $("#uploadProgress");
  const progressText = $("#uploadProgressText");
  const progressFill = $("#uploadProgressFill");

  if (progress) {
    progress.classList.add("show");
  }

  if (progressText)
    progressText.textContent = "Envoi… 10%";

  if (progressFill)
    progressFill.style.width = "10%";

  try {
    const extension =
      file.name.split(".").pop().toLowerCase();

    const filename =
      type +
      "_" +
      Date.now() +
      "_" +
      Math.random().toString(36).slice(2) +
      "." +
      extension;

    const path =
      storagePath + "/" + filename;

    if (progressText)
      progressText.textContent = "Envoi… 30%";

    if (progressFill)
      progressFill.style.width = "30%";

    const upload =
      await supabaseClient.storage
        .from("media")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false
        });

    if (upload.error) {
      throw upload.error;
    }

    if (progressText)
      progressText.textContent = "Envoi… 70%";

    if (progressFill)
      progressFill.style.width = "70%";

    const publicResult =
      supabaseClient.storage
        .from("media")
        .getPublicUrl(path);

    const publicUrl =
      publicResult.data?.publicUrl;

    if (!publicUrl) {
      throw new Error(
        "Impossible d'obtenir l'URL publique."
      );
    }

    state.customMedia[type] = publicUrl;

    save();

    if (type === "avatar") {
      displayMedia(
        img,
        video,
        publicUrl,
        file.type
      );
    }

    if (type === "cover") {
      displayMedia(
        img,
        video,
        publicUrl,
        file.type
      );
    }

    if (progressText)
      progressText.textContent = "Envoi… 100%";

    if (progressFill)
      progressFill.style.width = "100%";

    toast(
      type === "avatar"
        ? "Photo de profil modifiée"
        : "Bannière modifiée"
    );

  } catch (error) {
    console.error(
      "Erreur upload média :",
      error
    );

    toast(
      error.message ||
      "Erreur pendant l'envoi"
    );

  } finally {
    setTimeout(() => {
      if (progress)
        progress.classList.remove("show");

      if (progressFill)
        progressFill.style.width = "0%";
    }, 700);
  }
}

function displayMedia(img, video, url, mime = "") {
  const isVideo =
    mime.startsWith("video/") ||
    /\.(mp4|webm|mov|m4v|ogg)$/i.test(url);

  if (isVideo) {
    if (img) {
      img.style.display = "none";
      img.removeAttribute("src");
    }

    if (video) {
      video.src = url;
      video.style.display = "block";
      video.muted = true;
      video.loop = true;
      video.playsInline = true;

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
      img.src = url;
      img.style.display = "block";
    }
  }
}

function restoreMedia() {
  const avatarUrl =
    state.customMedia.avatar;

  const coverUrl =
    state.customMedia.cover;

  if (avatarUrl) {
    displayMedia(
      $("#avatarImg"),
      $("#avatarVideo"),
      avatarUrl
    );
  }

  if (coverUrl) {
    displayMedia(
      $("#coverImg"),
      $("#coverVideo"),
      coverUrl
    );
  }
}

$("#avatarInput")?.addEventListener(
  "change",
  () => {
    setMedia(
      $("#avatarInput"),
      $("#avatarImg"),
      $("#avatarVideo"),
      "profiles",
      "avatar"
    );
  }
);

$("#coverInput")?.addEventListener(
  "change",
  () => {
    setMedia(
      $("#coverInput"),
      $("#coverImg"),
      $("#coverVideo"),
      "covers",
      "cover"
    );
  }
);

/* =========================================================
PUBLICATION
========================================================= */

$("#addPostBtn")?.addEventListener(
  "click",
  () => {
    $("#postInput")?.click();
  }
);

$("#postInput")?.addEventListener(
  "change",
  async () => {
    const file =
      $("#postInput")?.files?.[0];

    if (!file) return;

    await uploadPost(file);

    $("#postInput").value = "";
  }
);

async function uploadPost(file) {
  if (!supabaseReady()) return;

  const progress =
    $("#uploadProgress");

  const progressText =
    $("#uploadProgressText");

  const progressFill =
    $("#uploadProgressFill");

  if (progress)
    progress.classList.add("show");

  if (progressText)
    progressText.textContent =
      "Envoi… 10%";

  if (progressFill)
    progressFill.style.width = "10%";

  try {
    const isVideo =
      file.type.startsWith("video/");

    const type =
      isVideo ? "video" : "image";

    const extension =
      file.name.split(".").pop().toLowerCase();

    const filename =
      Date.now() +
      "_" +
      Math.random().toString(36).slice(2) +
      "." +
      extension;

    const path =
      "posts/" + filename;

    if (progressText)
     
