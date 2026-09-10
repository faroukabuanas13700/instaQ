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

try {
  if (
    window.supabase &&
    typeof window.supabase.createClient === "function"
  ) {
    supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    );
  }
} catch (error) {
  console.error("Erreur création Supabase :", error);
}

/* =========================================================
OUTILS
========================================================= */

function toast(text) {
  const el = $("#toast");

  if (!el) return;

  el.textContent = text;
  el.classList.add("show");

  clearTimeout(toast.timer);

  toast.timer = setTimeout(() => {
    el.classList.remove("show");
  }, 2500);
}

function supabaseReady() {
  if (!supabaseClient) {
    console.error("Supabase non disponible.");
    toast("Supabase ne s'est pas chargé.");
    return false;
  }

  return true;
}

/* =========================================================
AUTHENTIFICATION — AFFICHAGE
========================================================= */

function showAuthScreen() {
  const auth = $("#authScreen");
  const app = $("#app");

  if (auth) {
    auth.style.display = "flex";
  }

  if (app) {
    app.style.display = "none";
  }
}

function showApp() {
  const auth = $("#authScreen");
  const app = $("#app");

  if (auth) {
    auth.style.display = "none";
  }

  if (app) {
    app.style.display = "block";
  }
}

/* =========================================================
STYLES AUTH
========================================================= */

function addAuthStyles() {
  if ($("#instaqAuthStyles")) return;

  const style = document.createElement("style");

  style.id = "instaqAuthStyles";

  style.textContent = `
    .auth-screen{
      position:fixed;
      inset:0;
      z-index:99999;
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
      border-color:#666;
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
      min-height:18px;
      margin-top:2px;
    }
  `;

  document.head.appendChild(style);
}

/* =========================================================
PROFIL PAR DEFAUT
========================================================= */

const defaults = {
  name: "",
  username: "",
  bio: "",
  link: "",
  followers: 0,
  following: 0
};

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
    posts: [],
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
  : [];

state.liked = state.liked || {};

state.customMedia =
  state.customMedia || {};

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
  try {
    localStorage.setItem(
      "igGitHubState",
      JSON.stringify(state)
    );
  } catch (error) {
    console.error("Erreur sauvegarde :", error);
  }
}

/* =========================================================
CONNEXION
========================================================= */

let authEventsConfigured = false;

async function loginUser(email, password) {

  if (!supabaseReady()) return;

  const errorBox = $("#loginError");
  const button =
    $("#loginForm button[type='submit']");

  if (errorBox) {
    errorBox.textContent = "";
  }

  if (button) {
    button.disabled = true;
    button.textContent = "Connexion...";
  }

  try {

    console.log("Tentative de connexion...");

    const result =
      await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
      });

    console.log("Réponse Supabase :", result);

    if (result.error) {

      console.error(
        "Erreur connexion Supabase :",
        result.error
      );

      if (errorBox) {
        errorBox.textContent =
          result.error.message ||
          "Identifiants incorrects.";
      }

      if (button) {
        button.disabled = false;
        button.textContent = "Se connecter";
      }

      return;
    }

    const session =
      result.data?.session;

    if (!session) {

      if (errorBox) {
        errorBox.textContent =
          "Connexion réussie mais aucune session n'a été créée.";
      }

      return;
    }

    console.log(
      "Connexion réussie :",
      session.user.email
    );

    /* IMPORTANT :
       on affiche immédiatement l'application */
    showApp();
await loadUserProfile();
    toast("Connexion réussie");

    /* Chargement des publications sans bloquer l'accès */
    loadSupabasePosts();

  } catch (error) {

    console.error(
      "Erreur connexion :",
      error
    );

    if (errorBox) {
      errorBox.textContent =
        error?.message ||
        "Impossible de se connecter.";
    }

  } finally {

    if (button) {
      button.disabled = false;
      button.textContent = "Se connecter";
    }

  }
}

/* =========================================================
INSCRIPTION
========================================================= */

async function signupUser(email, password) {

  if (!supabaseReady()) return;

  const errorBox = $("#signupError");
  const button =
    $("#signupForm button[type='submit']");

  if (errorBox) {
    errorBox.textContent = "";
  }

  if (button) {
    button.disabled = true;
    button.textContent = "Création...";
  }

  try {

    const result =
      await supabaseClient.auth.signUp({
        email: email,
        password: password
      });

    console.log("Réponse inscription :", result);

    if (result.error) {

      console.error(
        "Erreur inscription :",
        result.error
      );

      if (errorBox) {
        errorBox.textContent =
          result.error.message;
      }

      return;
    }

    if (result.data?.session) {

  await loadUserProfile();

  showApp();

  toast("Compte créé");

  await loadSupabasePosts();

}

    } else {

      if (errorBox) {
        errorBox.textContent = "";
      }

      toast(
        "Compte créé. Connectez-vous maintenant."
      );
    }

  } catch (error) {

    console.error(
      "Erreur inscription :",
      error
    );

    if (errorBox) {
      errorBox.textContent =
        error?.message ||
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

  const loginForm =
    $("#loginForm");

  const signupForm =
    $("#signupForm");

  if (loginForm &&
      !loginForm.dataset.configured) {

    loginForm.dataset.configured = "true";

    loginForm.addEventListener(
      "submit",
      async e => {

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

        await loginUser(
          email,
          password
        );
      }
    );
  }

  if (signupForm &&
      !signupForm.dataset.configured) {

    signupForm.dataset.configured = "true";

    signupForm.addEventListener(
      "submit",
      async e => {

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

        await signupUser(
          email,
          password
        );
      }
    );
  }

  if (
    supabaseClient &&
    !authEventsConfigured
  ) {

    authEventsConfigured = true;

    supabaseClient.auth.onAuthStateChange(
      (_event, session) => {

        console.log(
          "Auth event :",
          _event,
          session ? "SESSION" : "NO SESSION"
        );

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
PROFIL
========================================================= */
async function loadUserProfile() {
  if (!supabaseReady()) return;

  try {
    const {
      data: { user },
      error: userError
    } = await supabaseClient.auth.getUser();

    if (userError || !user) return;

    const result = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (result.error) {
      console.error(
        "Erreur chargement profil :",
        result.error
      );
      return;
    }

    const profile = result.data;

    state.profile.name =
      profile.name || defaults.name;

    state.profile.username =
      profile.username || defaults.username;

    state.profile.bio =
      profile.bio || "";

    state.profile.link =
      profile.link || "";

    if (profile.avatar_url) {
      state.customMedia.avatar =
        profile.avatar_url;
    }

    if (profile.cover_url) {
      state.customMedia.cover =
        profile.cover_url;
    }

    save();

    renderProfile();
    restoreMedia();

  } catch (error) {
    console.error(
      "Erreur loadUserProfile :",
      error
    );
  }
}
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

    const link =
      state.profile.link || "";

    $("#bioLink").textContent =
      link.replace(/^https?:\/\//, "");

    $("#bioLink").href =
      link || "#";

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

function mediaElement(
  post,
  forViewer = false
) {

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
    post.caption ||
    "Publication";

  img.loading = "lazy";

  return img;
}

/* =========================================================
GRILLE
========================================================= */

function renderGrid() {

  const grid =
    $("#postGrid");

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

    card.dataset.id =
      post.id;

    card.appendChild(
      mediaElement(post)
    );

    if (post.type === "video") {

      const icon =
        document.createElement("span");

      icon.className =
        "video-icon";

      icon.textContent = "▶";

      card.appendChild(icon);
    }

    const likeBadge =
      document.createElement("span");

    likeBadge.className =
      "like-badge";

    likeBadge.textContent =
      "♥ " + (post.likes || 0);

    card.appendChild(
      likeBadge
    );

    let lastTap = 0;

    card.addEventListener(
      "click",
      () => {

        const now =
          Date.now();

        if (
          now - lastTap <
          350
        ) {

          like(
            post.id,
            true
          );

          lastTap = 0;

          return;
        }

        lastTap = now;

        setTimeout(() => {

          if (
            Date.now() -
            lastTap >= 300
          ) {

            openViewer(
              post.id
            );
          }

        }, 320);

      }
    );

    grid.appendChild(card);

  });
}

/* =========================================================
LIKE
========================================================= */

function like(
  id,
  showAnimation = false
) {

  const post =
    state.posts.find(
      p => p.id == id
    );

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

  if (
    showAnimation &&
    state.liked[id]
  ) {

    const target =
      [...(
        $("#postGrid")?.children ||
        []
      )].find(
        x => x.dataset.id == id
      );

    if (target) {

      const heart =
        document.createElement("div");

      heart.className =
        "heart-pop";

      heart.textContent = "♥";

      target.appendChild(
        heart
      );

      setTimeout(
        () => heart.remove(),
        750
      );
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

  const posts =
    getFilteredPosts();

  const index =
    posts.findIndex(
      post => post.id == id
    );

  if (index < 0) return;

  viewerIndex =
    index;

  showViewerPost();

  const viewer =
    $("#viewer");

  if (!viewer) return;

  viewer.classList.add("open");

  viewer.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.style.overflow =
    "hidden";
}

function showViewerPost() {

  const posts =
    getFilteredPosts();

  const post =
    posts[viewerIndex];

  if (!post) return;

  const content =
    $("#viewerContent");

  if (!content) return;

  content.innerHTML = "";

  const element =
    mediaElement(
      post,
      true
    );

  content.appendChild(
    element
  );

  if (post.type === "video") {

    element.autoplay = true;
    element.controls = true;

    element.addEventListener(
      "canplay",
      () => {
        element
          .play()
          .catch(() => {});
      },
      { once: true }
    );
  }

  if ($("#viewerCaption"))
    $("#viewerCaption").textContent =
      post.caption || "";
}

function closeViewer() {

  const viewer =
    $("#viewer");

  if (!viewer) return;

  viewer.classList.remove(
    "open"
  );

  viewer.setAttribute(
    "aria-hidden",
    "true"
  );

  if ($("#viewerContent"))
    $("#viewerContent").innerHTML =
      "";

  document.body.style.overflow =
    "";
}

$("#viewerClose")?.addEventListener(
  "click",
  closeViewer
);

$("#viewer")?.addEventListener(
  "click",
  e => {

    if (
      e.target.id ===
      "viewer"
    ) {
      closeViewer();
    }

  }
);

$("#viewerPrev")?.addEventListener(
  "click",
  () => {

    const posts =
      getFilteredPosts();

    if (!posts.length) return;

    viewerIndex =
      (
        viewerIndex -
        1 +
        posts.length
      ) %
      posts.length;

    showViewerPost();
  }
);

$("#viewerNext")?.addEventListener(
  "click",
  () => {

    const posts =
      getFilteredPosts();

    if (!posts.length) return;

    viewerIndex =
      (
        viewerIndex +
        1
      ) %
      posts.length;

    showViewerPost();
  }
);

document.addEventListener(
  "keydown",
  e => {

    const viewer =
      $("#viewer");

    if (
      !viewer ||
      !viewer.classList.contains(
        "open"
      )
    ) return;

    if (e.key === "Escape")
      closeViewer();

    if (e.key === "ArrowLeft")
      $("#viewerPrev")?.click();

    if (e.key === "ArrowRight")
      $("#viewerNext")?.click();

  }
);

/* =========================================================
FILTRES
========================================================= */

$$(".tab").forEach(
  tab => {

    tab.onclick = () => {

      $$(".tab").forEach(
        t =>
          t.classList.remove(
            "active"
          )
      );

      tab.classList.add(
        "active"
      );

      state.filter =
        tab.dataset.filter;

      save();

      renderGrid();
    };

  }
);

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

    const dialog =
      $("#profileDialog");

    if (
      dialog &&
      typeof dialog.showModal ===
      "function"
    ) {
      dialog.showModal();
    }

  }
);

$("#profileForm")?.addEventListener(
  "submit",
  async e => {

    e.preventDefault();

    if (!supabaseReady()) return;

    const name =
      $("#nameInput").value.trim() ||
      defaults.name;

    const username =
      $("#usernameInput").value.trim() ||
      defaults.username;

    const bio =
      $("#bioInput").value.trim();

    const link =
      $("#linkInput").value.trim();

    try {

      const {
        data: { user },
        error: userError
      } =
        await supabaseClient.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "Utilisateur non connecté."
        );
      }

      const result =
        await supabaseClient
          .from("profiles")
          .update({
            name,
            username,
            bio,
            link
          })
          .eq("id", user.id);

      if (result.error) {
        throw result.error;
      }

      state.profile.name = name;
      state.profile.username = username;
      state.profile.bio = bio;
      state.profile.link = link;

      save();
      renderProfile();

      $("#profileDialog")?.close();

      toast("Profil enregistré");

    } catch (error) {

      console.error(
        "Erreur modification profil :",
        error
      );

      toast(
        error?.message ||
        "Impossible d'enregistrer le profil"
      );

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
  storagePath,
  type
) {

  const file =
    input?.files?.[0];

  if (!file) return;

  if (!supabaseReady()) return;

  const progress =
    $("#uploadProgress");

  const progressText =
    $("#uploadProgressText");

  const progressFill =
    $("#uploadProgressFill");

  if (progress)
    progress.classList.add(
      "show"
    );

  try {

    if (progressText)
      progressText.textContent =
        "Envoi… 10%";

    if (progressFill)
      progressFill.style.width =
        "10%";

    const extension =
      file.name
        .split(".")
        .pop()
        .toLowerCase();

    const filename =
      type +
      "_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .slice(2) +
      "." +
      extension;

    const path =
      storagePath +
      "/" +
      filename;

    if (progressText)
      progressText.textContent =
        "Envoi… 30%";

    if (progressFill)
      progressFill.style.width =
        "30%";

    const upload =
      await supabaseClient.storage
        .from("media")
        .upload(
          path,
          file,
          {
            cacheControl: "3600",
            upsert: false
          }
        );

    if (upload.error)
      throw upload.error;

    if (progressText)
      progressText.textContent =
        "Envoi… 70%";

    if (progressFill)
      progressFill.style.width =
        "70%";

    const publicResult =
      supabaseClient.storage
        .from("media")
        .getPublicUrl(path);

    const publicUrl =
      publicResult.data?.publicUrl;

    if (!publicUrl)
      throw new Error(
        "Impossible d'obtenir l'URL publique."
      );

    state.customMedia[type] =
      publicUrl;

    save();

    displayMedia(
      img,
      video,
      publicUrl,
      file.type
    );

    if (progressText)
      progressText.textContent =
        "Envoi… 100%";

    if (progressFill)
      progressFill.style.width =
        "100%";

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
      error?.message ||
      "Erreur pendant l'envoi"
    );

  } finally {

    setTimeout(() => {

      if (progress)
        progress.classList.remove(
          "show"
        );

      if (progressFill)
        progressFill.style.width =
          "0%";

    }, 700);

  }
}

function displayMedia(
  img,
  video,
  url,
  mime = ""
) {

  const isVideo =
    mime.startsWith("video/") ||
    /\.(mp4|webm|mov|m4v|ogg)$/i.test(
      url
    );

  if (isVideo) {

    if (img) {

      img.style.display =
        "none";

      img.removeAttribute(
        "src"
      );
    }

    if (video) {

      video.src = url;

      video.style.display =
        "block";

      video.muted = true;
      video.loop = true;
      video.playsInline = true;

      video.play()
        .catch(() => {});
    }

  } else {

    if (video) {

      video.pause();

      video.removeAttribute(
        "src"
      );

      video.load();

      video.style.display =
        "none";
    }

    if (img) {

      img.src = url;

      img.style.display =
        "block";
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

    $("#postInput").value =
      "";

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
    progress.classList.add(
      "show"
    );

  try {

    if (progressText)
      progressText.textContent =
        "Envoi… 10%";

    if (progressFill)
      progressFill.style.width =
        "10%";

    const isVideo =
      file.type.startsWith(
        "video/"
      );

    const type =
      isVideo
        ? "video"
        : "image";

    const extension =
      file.name
        .split(".")
        .pop()
        .toLowerCase();

    const filename =
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .slice(2) +
      "." +
      extension;

    const path =
      "posts/" + filename;

    if (progressText)
      progressText.textContent =
        "Envoi… 30%";

    if (progressFill)
      progressFill.style.width =
        "30%";

    const upload =
      await supabaseClient.storage
        .from("media")
        .upload(
          path,
          file,
          {
            cacheControl: "3600",
            upsert: false
          }
        );

    if (upload.error)
      throw upload.error;

    if (progressText)
      progressText.textContent =
        "Envoi… 70%";

    if (progressFill)
      progressFill.style.width =
        "70%";

    const publicResult =
      supabaseClient.storage
        .from("media")
        .getPublicUrl(path);

    const publicUrl =
      publicResult.data?.publicUrl;

    if (!publicUrl)
      throw new Error(
        "URL publique introuvable."
      );

    const insertResult =
      await supabaseClient
        .from("posts")
        .insert({
          type: type,
          media_url: publicUrl,
          caption: "",
          likes: 0
        })
        .select();

    if (insertResult.error)
      throw insertResult.error;

    const newPost = {

      id:
        insertResult.data?.[0]?.id ||
        Date.now(),

      type: type,

      src: publicUrl,

      caption: "",

      likes: 0

    };

    state.posts.unshift(
      newPost
    );

    save();

    renderGrid();

    if (progressText)
      progressText.textContent =
        "Envoi… 100%";

    if (progressFill)
      progressFill.style.width =
        "100%";

    toast(
      type === "video"
        ? "Vidéo publiée"
        : "Photo publiée"
    );

  } catch (error) {

    console.error(
      "Erreur publication :",
      error
    );

    toast(
      error?.message ||
      "Erreur pendant la publication"
    );

  } finally {

    setTimeout(() => {

      if (progress)
        progress.classList.remove(
          "show"
        );

      if (progressFill)
        progressFill.style.width =
          "0%";

    }, 700);

  }
}

/* =========================================================
CHARGEMENT PUBLICATIONS SUPABASE
========================================================= */

async function loadSupabasePosts() {

  if (!supabaseReady())
    return;

  try {

    const result =
      await supabaseClient
        .from("posts")
        .select("*")
        .order(
          "id",
          {
            ascending: false
          }
        );

    if (result.error) {

      console.error(
        "Erreur chargement publications :",
        result.error
      );

      return;
    }

    const remotePosts =
      (result.data || [])
        .map(post => ({

          id: post.id,

          type:
            post.type ||
            "image",

          src:
            post.media_url,

          caption:
            post.caption ||
            "",

          likes:
            post.likes ||
            0

        }));

    state.posts =
      remotePosts;

    save();

    renderGrid();

  } catch (error) {

    console.error(
      "Erreur chargement Supabase :",
      error
    );

  }
}

/* =========================================================
THEME
========================================================= */

function applyTheme() {

  document.body.classList.toggle(
    "dark",
    state.dark
  );

  const button =
    $("#themeBtn");

  if (button) {

    button.textContent =
      state.dark
        ? "☀"
        : "☾";
  }
}

$("#themeBtn")?.addEventListener(
  "click",
  () => {

    state.dark =
      !state.dark;

    save();

    applyTheme();

  }
);

/* =========================================================
PARAMETRES
========================================================= */

$("#settingsBtn")?.addEventListener(
  "click",
  () => {

    toast(
      "Paramètres bientôt disponibles"
    );

  }
);

/* =========================================================
INITIALISATION
========================================================= */

async function initializeApp() {

  addAuthStyles();

  restoreMedia();

  renderProfile();

  renderGrid();

  applyTheme();

  if (!supabaseClient) {

    console.error(
      "Supabase n'est pas disponible."
    );

    showAuthScreen();

    setupAuth();

    return;
  }

  try {

    console.log(
      "Vérification de la session..."
    );

    const result =
      await supabaseClient.auth.getSession();

    console.log(
      "Session actuelle :",
      result.data?.session
        ? "CONNECTÉ"
        : "NON CONNECTÉ"
    );

    if (result.error) {

      console.error(
        "Erreur getSession :",
        result.error
      );

      showAuthScreen();

    } else if (
      result.data?.session?.user
    ) {

      showApp();

      await loadUserProfile();

      await loadSupabasePosts();

    } else {

      showAuthScreen();

    }

  } catch (error) {

    console.error(
      "Erreur vérification session :",
      error
    );

    showAuthScreen();

  }

  setupAuth();
}

/* =========================================================
LANCEMENT
========================================================= */

initializeApp();
