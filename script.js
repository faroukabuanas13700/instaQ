const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

/* =========================================================
   SUPABASE
   ========================================================= */

const SUPABASE_URL = "https://sozzpklmlhtvwxbuecax.supabase.co";

/*
   IMPORTANT :
   Remplace UNIQUEMENT la valeur ci-dessous par TA clé actuelle.
   Ne change pas l'URL Supabase.
*/
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Xo20VSelYyO9tLTgT0SVbQ_4ZvkwH4B";

let supabaseClient = null;

if (window.supabase && typeof window.supabase.createClient === "function") {
  supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
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
  state = JSON.parse(localStorage.getItem("igGitHubState") || "null");
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

/* Sécurité pour les anciennes versions */
state.profile = { ...defaults, ...(state.profile || {}) };
state.posts = Array.isArray(state.posts) ? state.posts : [...samplePosts];
state.liked = state.liked || {};
state.customMedia = state.customMedia || {};
state.customMedia.avatar = state.customMedia.avatar || "";
state.customMedia.cover = state.customMedia.cover || "";
if (typeof state.dark !== "boolean") state.dark = true;
if (!state.filter) state.filter = "all";

function save() {
  localStorage.setItem("igGitHubState", JSON.stringify(state));
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
   VERIFICATION SUPABASE
   ========================================================= */

function supabaseReady() {
  if (!supabaseClient) {
    console.error("Supabase JS n'est pas chargé.");
    toast("Supabase ne s'est pas chargé");
    return false;
  }

  return true;
}

/* =========================================================
   PROFIL
   ========================================================= */

function renderProfile() {
  if ($("#displayName")) {
    $("#displayName").textContent = state.profile.name;
  }

  if ($("#username")) {
    $("#username").textContent = state.profile.username;
  }

  if ($("#bioText")) {
    $("#bioText").textContent = state.profile.bio;
  }

  if ($("#followers")) {
    $("#followers").textContent = state.profile.followers;
  }

  if ($("#following")) {
    $("#following").textContent = state.profile.following;
  }

  if ($("#bioLink")) {
    const link = state.profile.link || "";

    $("#bioLink").textContent =
      link.replace(/^https?:\/\//, "");

    $("#bioLink").href = link || "#";

    $("#bioLink").style.display =
      link ? "inline" : "none";
  }

  document.title =
    (state.profile.username || defaults.username) +
    " — Instagram";
}

/* =========================================================
   MEDIA
   ========================================================= */

function mediaElement(post, forViewer = false) {
  if (post.type === "video") {
    const video = document.createElement("video");

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

  const img = document.createElement("img");

  img.src = post.src;
  img.alt = post.caption || "Publication";
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

  const posts = state.posts.filter(post => {
    return (
      state.filter === "all" ||
      post.type === state.filter
    );
  });

  if ($("#postCount")) {
    $("#postCount").textContent = state.posts.length;
  }

  if ($("#emptyState")) {
    $("#emptyState").style.display =
      posts.length ? "none" : "block";
  }

  posts.forEach(post => {
    const card = document.createElement("article");

    card.className = "post";
    card.dataset.id = post.id;

    card.appendChild(mediaElement(post));

    if (post.type === "video") {
      const videoIcon = document.createElement("span");

      videoIcon.className = "video-icon";
      videoIcon.textContent = "▶";

      card.appendChild(videoIcon);
    }

    const likeBadge = document.createElement("span");

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
  const post = state.posts.find(p => p.id === id);

  if (!post) return;

  if (!state.liked[id]) {
    post.likes = (post.likes || 0) + 1;
    state.liked[id] = true;
  } else {
    post.likes = Math.max(
      0,
      (post.likes || 0) - 1
    );

    state.liked[id] = false;
  }

  save();
  renderGrid();

  if (showAnimation && state.liked[id]) {
    const target = [...$("#postGrid").children]
      .find(x => x.dataset.id === id);

    if (target) {
      const heart = document.createElement("div");

      heart.className = "heart-pop";
      heart.textContent = "♥";

      target.appendChild(heart);

      setTimeout(() => {
        heart.remove();
      }, 750);
    }
  }
}

/* =========================================================
   VISUALISEUR
   ========================================================= */

let viewerIndex = 0;

function getFilteredPosts() {
  return state.posts.filter(post => {
    return (
      state.filter === "all" ||
      post.type === state.filter
    );
  });
}

function openViewer(id) {
  const posts = getFilteredPosts();

  const index = posts.findIndex(
    post => post.id === id
  );

  if (index < 0) return;

  viewerIndex = index;

  showViewerPost();

  $("#viewer").classList.add("open");
  $("#viewer").setAttribute("aria-hidden", "false");

  document.body.style.overflow = "hidden";
}

function showViewerPost() {
  const posts = getFilteredPosts();
  const post = posts[viewerIndex];

  if (!post) return;

  const content = $("#viewerContent");

  content.innerHTML = "";

  const element = mediaElement(post, true);

  content.appendChild(element);

  if (post.type === "video") {
    element.autoplay = true;
    element.controls = true;
    element.muted = false;

    element.addEventListener(
      "canplay",
      () => {
        element.play().catch(() => {});
      },
      { once: true }
    );
  }

  $("#viewerCaption").textContent =
    post.caption || "";
}

function closeViewer() {
  $("#viewer").classList.remove("open");
  $("#viewer").setAttribute("aria-hidden", "true");

  $("#viewerContent").innerHTML = "";

  document.body.style.overflow = "";
}

if ($("#viewerClose")) {
  $("#viewerClose").onclick = closeViewer;
}

if ($("#viewer")) {
  $("#viewer").addEventListener("click", e => {
    if (e.target.id === "viewer") {
      closeViewer();
    }
  });
}

if ($("#viewerPrev")) {
  $("#viewerPrev").onclick = () => {
    const posts = getFilteredPosts();

    if (!posts.length) return;

    viewerIndex =
      (viewerIndex - 1 + posts.length) %
      posts.length;

    showViewerPost();
  };
}

if ($("#viewerNext")) {
  $("#viewerNext").onclick = () => {
    const posts = getFilteredPosts();

    if (!posts.length) return;

    viewerIndex =
      (viewerIndex + 1) %
      posts.length;

    showViewerPost();
  };
}

document.addEventListener("keydown", e => {
  if (
    !$("#viewer") ||
    !$("#viewer").classList.contains("open")
  ) {
    return;
  }

  if (e.key === "Escape") {
    closeViewer();
  }

  if (e.key === "ArrowLeft") {
    $("#viewerPrev").click();
  }

  if (e.key === "ArrowRight") {
    $("#viewerNext").click();
  }
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

    state.filter = tab.dataset.filter;

    save();
    renderGrid();
  };
});

/* =========================================================
   MODIFICATION DU PROFIL
   ========================================================= */

if ($("#editProfileBtn")) {
  $("#editProfileBtn").onclick = () => {
    $("#nameInput").value =
      state.profile.name || "";

    $("#usernameInput").value =
      state.profile.username || "";

    $("#bioInput").value =
      state.profile.bio || "";

    $("#linkInput").value =
      state.profile.link || "";

    const dialog = $("#profileDialog");

    if (dialog && typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog?.setAttribute("open", "");
    }
  };
}

if ($("#profileForm")) {
  $("#profileForm").addEventListener(
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

      const dialog = $("#profileDialog");

      if (dialog?.open) {
        dialog.close();
      }

      toast("Profil modifié");
    }
  );
}

/* =========================================================
   PARTAGE
   ========================================================= */

if ($("#shareBtn")) {
  $("#shareBtn").onclick = async () => {
    try {
      await navigator.clipboard.writeText(
        location.href
      );

      toast("Lien du profil copié");
    } catch {
      toast("Copie du lien impossible");
    }
  };
}

/* =========================================================
   ENVOI PHOTO PROFIL / BANNIERE
   ========================================================= */

async function setMedia(input, img, video, key) {
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
    const result = await supabaseClient.storage
      .from("media")
      .upload(
        path,
        file,
        {
          upsert: false,
          contentType: file.type
        }
      );

    if (result.error) {
      console.error(
        "Erreur Supabase Storage:",
        result.error
      );

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
      toast("URL du fichier introuvable");
      return;
    }

    /* Sauvegarde locale de l'URL */
    state.customMedia[key] = url;

    save();

    /* Affichage immédiat */
    if (file.type.startsWith("video/")) {
      img.style.display = "none";

      video.style.display = "block";
      video.src = url;

      video.load();

      video.play().catch(() => {});
    } else {
      video.pause();
      video.removeAttribute("src");
      video.load();

      video.style.display = "none";

      img.style.display = "block";
      img.src = url;
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

if ($("#avatarInput")) {
  $("#avatarInput").onchange = () => {
    setMedia(
      $("#avatarInput"),
      $("#avatarImg"),
      $("#avatarVideo"),
      "avatar"
    );
  };
}

if ($("#coverInput")) {
  $("#coverInput").onchange = () => {
    setMedia(
      $("#coverInput"),
      $("#coverImg"),
      $("#coverVideo"),
      "cover"
    );
  };
}

/* =========================================================
   RESTAURATION PHOTO PROFIL / BANNIERE
   ========================================================= */

function restoreMedia() {
  const avatar = state.customMedia.avatar;
  const cover = state.customMedia.cover;

  /* =========================
     PHOTO DE PROFIL
     ========================= */

  if (avatar) {
    const isVideo =
      /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(avatar);

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
    $("#avatarVideo").style.display = "none";
    $("#avatarImg").style.display = "block";

    $("#avatarImg").src =
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&q=80";
  }

  /* =========================
     BANNIERE
     ========================= */

  if (cover) {
    const isVideo =
      /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(cover);

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
    $("#coverVideo").style.display = "none";
    $("#coverImg").style.display = "block";

    $("#coverImg").src =
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1400&q=85";
  }
       }

  

/* =========================================================
   AJOUT D'UNE PUBLICATION
   ========================================================= */

if ($("#addPostBtn")) {
  $("#addPostBtn").onclick = () => {
    $("#postInput")?.click();
  };
}

if ($("#postForm")) {
  $("#postForm").addEventListener(
    "submit",
    async e => {
      e.preventDefault();

      const file =
        $("#postInput").files?.[0];

      if (!file) {
        toast("Choisis une photo ou une vidéo");
        return;
      }

      if (!supabaseReady()) return;

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
        /* 1. Upload du fichier */

        const upload =
          await supabaseClient.storage
            .from("media")
            .upload(
              path,
              file,
              {
                upsert: false,
                contentType: file.type
              }
            );

        if (upload.error) {
          console.error(
            "Erreur upload publication:",
            upload.error
          );

          toast(
            "Erreur upload : " +
            upload.error.message
          );

          return;
        }

        /* 2. URL publique */

        const publicResult =
          supabaseClient.storage
            .from("media")
            .getPublicUrl(path);

        const mediaUrl =
          publicResult.data?.publicUrl;

        if (!mediaUrl) {
          toast("URL de publication introuvable");
          return;
        }

        /* 3. Enregistrement dans posts */

        const postData = {
          type: file.type.startsWith("video/")
            ? "video"
            : "image",

          media_url: mediaUrl,

          caption:
            $("#captionInput").value.trim(),

          likes: 0
        };

        const result =
          await supabaseClient
            .from("posts")
            .insert(postData)
            .select()
            .single();

        if (result.error) {
          console.error(
            "Erreur table posts:",
            result.error
          );

          toast(
            "Erreur base de données : " +
            result.error.message
          );

          return;
        }

        const post = result.data;

        /* 4. Ajout immédiat à l'écran */

        state.posts.unshift({
          id: post.id,
          type: post.type,
          src: post.media_url,
          caption: post.caption || "",
          likes: post.likes || 0
        });

        save();

        renderGrid();

/* =========================================================
   AJOUT D'UNE PUBLICATION DIRECTE
   ========================================================= */

if ($("#postInput")) {
  $("#postInput").onchange = async () => {

    const file = $("#postInput").files?.[0];

    if (!file) return;

    if (!supabaseReady()) return;

    const progress = $("#uploadProgress");
    const progressText = $("#uploadProgressText");
    const progressFill = $("#uploadProgressFill");

    if (progress) progress.style.display = "block";
    if (progressText) progressText.textContent = "Envoi en cours…";
    if (progressFill) progressFill.style.width = "30%";

    toast("Publication en cours...");

    const extension =
      file.name.split(".").pop()?.toLowerCase() || "bin";

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
          .upload(
            path,
            file,
            {
              upsert: false,
              contentType: file.type
            }
          );

      if (upload.error) {
        console.error(
          "Erreur upload publication:",
          upload.error
        );

        if (progress) progress.style.display = "none";

        toast(
          "Erreur upload : " +
          upload.error.message
        );

        return;
      }

      if (progressFill) progressFill.style.width = "70%";

      const publicResult =
        supabaseClient.storage
          .from("media")
          .getPublicUrl(path);

      const mediaUrl =
        publicResult.data?.publicUrl;

      if (!mediaUrl) {
        if (progress) progress.style.display = "none";
        toast("URL de publication introuvable");
        return;
      }

      const postData = {
        type: file.type.startsWith("video/")
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
        console.error(
          "Erreur table posts:",
          result.error
        );

        if (progress) progress.style.display = "none";

        toast(
          "Erreur base de données : " +
          result.error.message
        );

        return;
      }

      if (progressFill) progressFill.style.width = "100%";

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
        if (progress) progress.style.display = "none";
      }, 500);

    } catch (error) {

      console.error(
        "Erreur publication:",
        error
      );

      if (progress) progress.style.display = "none";

      toast("Erreur pendant la publication");
    }
  };
   }

/* =========================================================
   CHARGEMENT DES PUBLICATIONS SUPABASE
   ========================================================= */

async function loadSupabasePosts() {
  if (!supabaseReady()) return;

  try {
    const result =
      await supabaseClient
        .from("posts")
        .select("*")
        .order("created_at", {
          ascending: false
        });

    if (result.error) {
      console.error(
        "Erreur lecture posts:",
        result.error
      );

      return;
    }

    const remotePosts = result.data || [];

    const converted = remotePosts.map(post => ({
      id: post.id,
      type: post.type,
      src: post.media_url,
      caption: post.caption || "",
      likes: post.likes || 0
    }));

    /*
      Les publications Supabase deviennent
      les publications principales.

      Les démos restent uniquement si aucune
      publication réelle n'existe.
    */

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

if ($("#themeBtn")) {
  $("#themeBtn").onclick = () => {
    state.dark = !state.dark;

    document.body.classList.toggle(
      "light",
      !state.dark
    );

    $("#themeBtn").textContent =
      state.dark ? "☾" : "☀";

    save();
  };
}

if (!state.dark) {
  document.body.classList.add("light");

  if ($("#themeBtn")) {
    $("#themeBtn").textContent = "☀";
  }
}

/* =========================================================
   INITIALISATION
   ========================================================= */

restoreMedia();
renderProfile();
renderGrid();

/*
   Charge les publications présentes
   dans Supabase.
*/
loadSupabasePosts();
