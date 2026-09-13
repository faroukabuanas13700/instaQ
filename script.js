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
let currentUser = null;
let currentUserAvatar = "";
let authEventsConfigured = false;

try {
  if (
    window.supabase &&
    typeof window.supabase.createClient === "function"
  ) {
    supabaseClient =
      window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
      );
  }
} catch (error) {
  console.error(
    "Erreur création Supabase :",
    error
  );
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

  toast.timer =
    setTimeout(() => {

      el.classList.remove("show");

    }, 2500);
}


function supabaseReady() {

  if (!supabaseClient) {

    console.error(
      "Supabase non disponible."
    );

    toast(
      "Supabase ne s'est pas chargé."
    );

    return false;
  }

  return true;
}


function clearAuthErrors() {

  if ($("#loginError")) {
    $("#loginError").textContent = "";
  }

  if ($("#signupError")) {
    $("#signupError").textContent = "";
  }
}


/* =========================================================
AFFICHAGE
========================================================= */

function showAuthScreen() {

  const auth =
    $("#authScreen");

  const app =
    $("#app");

  if (app) {
    app.hidden = true;
  }

  if (auth) {
    auth.hidden = false;
  }
}


function showApp() {

  const auth =
    $("#authScreen");

  const app =
    $("#app");

  if (auth) {
    auth.hidden = true;
  }

  if (app) {
    app.hidden = false;
  }
}


/* =========================================================
ETAT UTILISATEUR
========================================================= */

const defaults = {
  name: "",
  username: "",
  bio: "",
  link: "",
  followers: 0,
  following: 0
};


let state = {

  profile: {
    ...defaults
  },

  posts: [],

  filter: "all",

  liked: {},

  dark: true,

  customMedia: {
    avatar: "",
    cover: ""
  }

};


function getStateKey() {

  if (!currentUser) {
    return null;
  }

  return (
    "instaqState:" +
    currentUser.id
  );
}


function loadLocalStateForUser() {

  state = {

    profile: {
      ...defaults
    },

    posts: [],

    filter: "all",

    liked: {},

    dark: true,

    customMedia: {
      avatar: "",
      cover: ""
    }

  };


  const key =
    getStateKey();

  if (!key) return;


  try {

    const saved =
      JSON.parse(
        localStorage.getItem(key) ||
        "null"
      );


    if (saved) {

      state.profile = {
        ...defaults,
        ...(saved.profile || {})
      };


      state.posts =
        Array.isArray(saved.posts)
          ? saved.posts
          : [];


      state.filter =
        saved.filter ||
        "all";


      state.liked =
        saved.liked ||
        {};


      state.dark =
        typeof saved.dark ===
        "boolean"
          ? saved.dark
          : true;


      state.customMedia = {

        avatar:
          saved.customMedia?.avatar ||
          "",

        cover:
          saved.customMedia?.cover ||
          ""

      };

    }

  } catch (error) {

    console.error(
      "Erreur lecture état local :",
      error
    );

  }

}


function save() {

  const key =
    getStateKey();

  if (!key) return;


  try {

    localStorage.setItem(
      key,
      JSON.stringify(state)
    );

  } catch (error) {

    console.error(
      "Erreur sauvegarde locale :",
      error
    );

  }

}

function updateBottomProfileAvatar() {

  const button =
    $("#bottomProfileBtn");

  if (!button) {
    return;
  }

  button.innerHTML = "";

  if (currentUserAvatar) {

    const img =
      document.createElement(
        "img"
      );

    img.src =
      currentUserAvatar;

    img.alt =
      "Mon profil";

    img.className =
      "bottom-profile-avatar";

    button.appendChild(
      img
    );

  } else {

    const fallback =
      document.createElement(
        "span"
      );

    fallback.textContent =
      "👤";

    fallback.className =
      "bottom-profile-fallback";

    button.appendChild(
      fallback
    );

  }

}
/* =========================================================
AUTHENTIFICATION
========================================================= */

async function loginUser(
  email,
  password
) {

  if (!supabaseReady()) {
    return;
  }


  const errorBox =
    $("#loginError");

  const button =
    $(
      "#loginForm button[type='submit']"
    );


  clearAuthErrors();


  if (button) {

    button.disabled = true;

    button.textContent =
      "Connexion...";

  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth
        .signInWithPassword({
          email,
          password
        });


    if (error) {
      throw error;
    }


    if (
      !data?.session?.user
    ) {

      throw new Error(
        "Aucune session n'a été créée."
      );

    }


    currentUser =
      data.session.user;


    loadLocalStateForUser();

    applyTheme();

    await loadUserProfile();

    await loadSupabasePosts();

    setOwnerMode(true);

    showApp();

    playGridVideos();

    toast(
      "Connexion réussie"
    );


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


    showAuthScreen();


  } finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        "Se connecter";

    }

  }

}


async function signupUser(
  email,
  password
) {

  if (!supabaseReady()) {
    return;
  }


  const errorBox =
    $("#signupError");

  const button =
    $(
      "#signupForm button[type='submit']"
    );


  clearAuthErrors();


  if (button) {

    button.disabled = true;

    button.textContent =
      "Création...";

  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.signUp({
        email,
        password
      });


    if (error) {
      throw error;
    }


    if (
      data?.session?.user
    ) {

      currentUser =
        data.session.user;


      loadLocalStateForUser();

      applyTheme();

      await loadUserProfile();

      await loadSupabasePosts();

      setOwnerMode(true);

      showApp();

      playGridVideos();

      toast(
        "Compte créé"
      );


    } else {

      showAuthScreen();

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

      button.textContent =
        "Créer un compte";

    }

  }

}


async function logoutUser() {

  if (!supabaseReady()) {
    return;
  }


  try {

    const {
      error
    } =
      await supabaseClient.auth
        .signOut();


    if (error) {
      throw error;
    }


    currentUser = null;


    state = {

      profile: {
        ...defaults
      },

      posts: [],

      filter: "all",

      liked: {},

      dark: true,

      customMedia: {
        avatar: "",
        cover: ""
      }

    };


    renderProfile();

    renderGrid();


    clearMedia(
      $("#avatarImg"),
      $("#avatarVideo")
    );


    clearMedia(
      $("#coverImg"),
      $("#coverVideo")
    );


    clearAuthErrors();

    showAuthScreen();

    toast(
      "Déconnecté"
    );


  } catch (error) {

    console.error(
      "Erreur déconnexion :",
      error
    );


    toast(
      error?.message ||
      "Impossible de se déconnecter"
    );

  }

}


function setupAuth() {

  const loginForm =
    $("#loginForm");

  const signupForm =
    $("#signupForm");


  if (
    loginForm &&
    !loginForm.dataset.configured
  ) {

    loginForm.dataset.configured =
      "true";


    loginForm.addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        const email =
          $("#loginEmail")
            ?.value
            .trim();


        const password =
          $("#loginPassword")
            ?.value;


        if (
          !email ||
          !password
        ) {

          if ($("#loginError")) {

            $("#loginError")
              .textContent =
              "Veuillez remplir les deux champs.";

          }

          return;
        }


        await loginUser(
          email,
          password
        );

      }
    );

  }


  if (
    signupForm &&
    !signupForm.dataset.configured
  ) {

    signupForm.dataset.configured =
      "true";


    signupForm.addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        const email =
          $("#signupEmail")
            ?.value
            .trim();


        const password =
          $("#signupPassword")
            ?.value;


        if (
          !email ||
          !password
        ) {

          if ($("#signupError")) {

            $("#signupError")
              .textContent =
              "Veuillez remplir les deux champs.";

          }

          return;
        }


        await signupUser(
          email,
          password
        );

      }
    );

  }


  $("#logoutBtn")
    ?.addEventListener(
      "click",
      logoutUser
    );


  if (
    supabaseClient &&
    !authEventsConfigured
  ) {

    authEventsConfigured =
      true;


    supabaseClient.auth
      .onAuthStateChange(
        (
          event,
          session
        ) => {

          console.log(
            "Auth event :",
            event
          );


          if (
            event ===
              "SIGNED_OUT" ||
            !session?.user
          ) {

            currentUser =
              null;

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

  if (
    !supabaseReady() ||
    !currentUser
  ) {
    return;
  }


  try {

    const {
      data: profile,
      error
    } =
      await supabaseClient
        .from("profiles")
        .select(
          "id,email,username,name,bio,link,avatar_url,cover_url"
        )
        .eq(
          "id",
          currentUser.id
        )
        .single();


    if (error) {
      throw error;
    }


    state.profile.name =
      profile?.name ||
      profile?.username ||
      "";


    state.profile.username =
      profile?.username ||
      "";


    state.profile.bio =
      profile?.bio ||
      "";


    state.profile.link =
      profile?.link ||
      "";


    state.customMedia.avatar =
      profile?.avatar_url ||
      "";
currentUserAvatar =
  profile?.avatar_url ||
  "";

updateBottomProfileAvatar();

    state.customMedia.cover =
      profile?.cover_url ||
      "";

activeProfileId =
  currentUser.id;

await loadFollowCounts(
  currentUser.id
);

await updateFollowButton(
  currentUser.id
);
    save();

    renderProfile();

    restoreMedia();


  } catch (error) {

    console.error(
      "Erreur chargement profil :",
      error
    );

  }

}


function renderProfile() {

  if ($("#displayName")) {

    $("#displayName")
      .textContent =
      state.profile.name ||
      "";

  }


  if ($("#username")) {

    $("#username")
      .textContent =
      state.profile.username ||
      "";

  }


  if ($("#bioText")) {

    $("#bioText")
      .textContent =
      state.profile.bio ||
      "";

  }


  if ($("#followers")) {

    $("#followers")
      .textContent =
      state.profile.followers ||
      0;

  }


  if ($("#following")) {

    $("#following")
      .textContent =
      state.profile.following ||
      0;

  }

if ($("#totalLikes")) {

  const totalLikes =
    state.posts.reduce(
      (total, post) =>
        total +
        (Number(post.likes) || 0),
      0
    );

  $("#totalLikes")
    .textContent =
    formatLikes(totalLikes);

}
  const bioLink =
    $("#bioLink");


  if (bioLink) {

    const link =
      state.profile.link ||
      "";


    bioLink.textContent =
      link.replace(
        /^https?:\/\//,
        ""
      );


    bioLink.href =
      link ||
      "#";


    bioLink.style.display =
      link
        ? "inline"
        : "none";

  }


  document.title =
    state.profile.username
      ? (
        state.profile.username +
        " — extaze"
      )
      : "extaze";

}


$("#editProfileBtn")
  ?.addEventListener(
    "click",
    () => {

      if ($("#nameInput")) {

        $("#nameInput").value =
          state.profile.name ||
          "";

      }


      if ($("#usernameInput")) {

        $("#usernameInput").value =
          state.profile.username ||
          "";

      }


      if ($("#bioInput")) {

        $("#bioInput").value =
          state.profile.bio ||
          "";

      }


      if ($("#linkInput")) {

        $("#linkInput").value =
          state.profile.link ||
          "";

      }


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


$("#profileDialogClose")
  ?.addEventListener(
    "click",
    () => {

      $("#profileDialog")
        ?.close();

    }
  );


$("#profileCancelBtn")
  ?.addEventListener(
    "click",
    () => {

      $("#profileDialog")
        ?.close();

    }
  );


$("#profileForm")
  ?.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      if (
        !supabaseReady() ||
        !currentUser
      ) {
        return;
      }


      const name =
        $("#nameInput")
          ?.value
          .trim() ||
        "";


      const username =
        $("#usernameInput")
          ?.value
          .trim() ||
        "";


      const bio =
        $("#bioInput")
          ?.value
          .trim() ||
        "";


      const link =
        $("#linkInput")
          ?.value
          .trim() ||
        "";


      try {

        const {
          error
        } =
          await supabaseClient
            .from("profiles")
            .update({
              name,
              username,
              bio,
              link
            })
            .eq(
              "id",
              currentUser.id
            );


        if (error) {
          throw error;
        }


        state.profile = {

          ...state.profile,

          name,

          username,

          bio,

          link

        };


        save();

        renderProfile();


        $("#profileDialog")
          ?.close();


        toast(
          "Profil enregistré"
        );


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

function clearMedia(
  img,
  video
) {

  const placeholder =
    img
      ?.closest(
        ".avatar-wrap"
      )
      ?.querySelector(
        ".avatar-placeholder"
      );


  if (placeholder) {

    placeholder.style.display =
      "block";

  }


  if (img) {

    img.removeAttribute(
      "src"
    );

    img.style.display =
      "none";

  }


  if (video) {

    try {
      video.pause();
    } catch {}


    video.removeAttribute(
      "src"
    );

    video.style.display =
      "none";

  }

}


function displayMedia(
  img,
  video,
  url,
  mime = ""
) {

  const placeholder =
    img
      ?.closest(
        ".avatar-wrap"
      )
      ?.querySelector(
        ".avatar-placeholder"
      );


  if (!url) {

    clearMedia(
      img,
      video
    );

    return;
  }


  const isVideo =
    mime.startsWith(
      "video/"
    ) ||
    /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i
      .test(url);


  if (placeholder) {

    placeholder.style.display =
      "none";

  }


  if (isVideo) {

    if (img) {

      img.style.display =
        "none";

      img.removeAttribute(
        "src"
      );

    }


    if (video) {

      video.src =
        url;

      video.style.display =
        "block";

      video.muted =
        true;

      video.loop =
        true;

      video.autoplay =
        true;

      video.playsInline =
        true;


      video
        .play()
        .catch(
          () => {}
        );

    }


  } else {

    if (video) {

      try {
        video.pause();
      } catch {}


      video.removeAttribute(
        "src"
      );

      video.style.display =
        "none";

    }


    if (img) {

      img.src =
        url;

      img.style.display =
        "block";

    }

  }

}


function restoreMedia() {

  displayMedia(
    $("#avatarImg"),
    $("#avatarVideo"),
    state.customMedia.avatar ||
      ""
  );


  displayMedia(
    $("#coverImg"),
    $("#coverVideo"),
    state.customMedia.cover ||
      ""
  );

}


async function setMedia(
  input,
  img,
  video,
  folder,
  fieldName
) {

  const file =
    input?.files?.[0];


  if (
    !file ||
    !supabaseReady() ||
    !currentUser
  ) {
    return;
  }


  const progress =
    $("#uploadProgress");

  const progressText =
    $("#uploadProgressText");

  const progressFill =
    $("#uploadProgressFill");


  if (progress) {

    progress.classList.add(
      "show"
    );

  }


  try {

    if (progressText) {

      progressText.textContent =
        "Envoi… 10%";

    }


    if (progressFill) {

      progressFill.style.width =
        "10%";

    }


    const extension =
      (
        file.name
          .split(".")
          .pop() ||
        "bin"
      )
        .toLowerCase();


    const filename =
      currentUser.id +
      "_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .slice(2) +
      "." +
      extension;


    const path =
      folder +
      "/" +
      filename;


    if (progressText) {

      progressText.textContent =
        "Envoi… 35%";

    }


    if (progressFill) {

      progressFill.style.width =
        "35%";

    }


    const {
      error: uploadError
    } =
      await supabaseClient
        .storage
        .from("media")
        .upload(
          path,
          file,
          {
            cacheControl:
              "3600",

            upsert:
              false
          }
        );


    if (uploadError) {
      throw uploadError;
    }


    const {
      data: publicData
    } =
      supabaseClient
        .storage
        .from("media")
        .getPublicUrl(
          path
        );


    const publicUrl =
      publicData?.publicUrl;


    if (!publicUrl) {

      throw new Error(
        "URL publique introuvable."
      );

    }


    const updatePayload =
      fieldName ===
        "avatar_url"

        ? {
          avatar_url:
            publicUrl
        }

        : {
          cover_url:
            publicUrl
        };


    const {
      error: profileError
    } =
      await supabaseClient
        .from("profiles")
        .update(
          updatePayload
        )
        .eq(
          "id",
          currentUser.id
        );


    if (profileError) {
      throw profileError;
    }


    

      if (
  fieldName ===
  "avatar_url"
) {

  state.customMedia.avatar =
    publicUrl;

  currentUserAvatar =
    publicUrl;

  updateBottomProfileAvatar();

}

if (
  fieldName ===
  "cover_url"
) {

  state.customMedia.cover =
    publicUrl;

}


    save();


    displayMedia(
      img,
      video,
      publicUrl,
      file.type
    );


    if (progressText) {

      progressText.textContent =
        "Envoi… 100%";

    }


    if (progressFill) {

      progressFill.style.width =
        "100%";

    }


    toast(
      fieldName ===
        "avatar_url"

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

    if (input) {
      input.value = "";
    }


    setTimeout(
      () => {

        if (progress) {

          progress.classList.remove(
            "show"
          );

        }


        if (progressFill) {

          progressFill.style.width =
            "0%";

        }

      },
      600
    );

  }

}


$("#avatarInput")
  ?.addEventListener(
    "change",
    () => {

      setMedia(
        $("#avatarInput"),
        $("#avatarImg"),
        $("#avatarVideo"),
        "profiles",
        "avatar_url"
      );

    }
  );


$("#coverInput")
  ?.addEventListener(
    "change",
    () => {

      setMedia(
        $("#coverInput"),
        $("#coverImg"),
        $("#coverVideo"),
        "covers",
        "cover_url"
      );

    }
  );


/* =========================================================
PUBLICATIONS
========================================================= */
function formatLikes(number) {

  number = Number(number) || 0;

  if (number >= 1000000) {
    const value = number / 1000000;

    return (
      (value >= 10
        ? Math.floor(value)
        : Math.floor(value * 10) / 10
      )
      .toString()
      .replace(".", ",") + "M"
    );
  }

  if (number >= 1000) {
    const value = number / 1000;

    return (
      (value >= 10
        ? Math.floor(value)
        : Math.floor(value * 10) / 10
      )
      .toString()
      .replace(".", ",") + "K"
    );
  }

  return number.toString();
}
function mediaElement(
  post,
  forViewer = false
) {

  if (
    post.type ===
    "video"
  ) {

    const video =
      document.createElement(
        "video"
      );


    video.src =
      post.src;


    video.loop =
      true;


    video.playsInline =
      true;


    video.preload =
      "auto";


    if (forViewer) {

      video.controls =
        true;

      video.muted =
        false;

    } else {

      video.muted =
        true;

      video.autoplay =
        true;

      video.setAttribute(
  "autoplay",
  ""
);

      video.setAttribute(
        "muted",
        ""
      );

      video.setAttribute(
        "loop",
        ""
      );

      video.setAttribute(
        "playsinline",
        ""
      );

    }


    return video;

  }


  const img =
    document.createElement(
      "img"
    );


  img.src =
    post.src;


  img.alt =
    post.caption ||
    "Publication";


  img.loading =
    "lazy";


  return img;

}


function playGridVideos() {

  $$("#postGrid video")
    .forEach(
      video => {

        video.muted =
          true;

        video.loop =
          true;

        video.playsInline =
          true;


        const promise =
          video.play();


        if (
          promise &&
          typeof promise.catch ===
            "function"
        ) {

          promise.catch(
            () => {}
          );

        }

      }
    );

}


function renderGrid() {

  const grid =
    $("#postGrid");


  if (!grid) {
    return;
  }


  grid.innerHTML =
    "";


  const posts =
    state.posts.filter(
      post =>

        state.filter ===
          "all" ||

        post.type ===
          state.filter
    );


  if ($("#postCount")) {

    $("#postCount")
      .textContent =
      state.posts.length;

  }


  if ($("#emptyState")) {

    $("#emptyState")
      .style.display =
      posts.length
        ? "none"
        : "block";

  }


  posts.forEach(
    post => {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "post";


      card.dataset.id =
        post.id;


      const media =
        mediaElement(
          post
        );


      card.appendChild(
        media
      );


      if (
        post.type ===
        "video"
      ) {

        const icon =
          document.createElement(
            "span"
          );


        icon.className =
          "video-icon";


        icon.textContent =
          "▶";


        card.appendChild(
          icon
        );


        media
          .play()
          .catch(
            () => {}
          );

      }


      const likeBadge =
        document.createElement(
          "span"
        );


      likeBadge.className =
        "like-badge";


      likeBadge.innerHTML =
  `<span class="profile-like-heart">♡</span>
   <span class="profile-like-number">${formatLikes(post.likes)}</span>`;


      card.appendChild(
        likeBadge
      );


      let lastTap =
        0;


      card.addEventListener(
        "click",
        () => {

          const now =
            Date.now();


          if (
            now -
              lastTap <
            350
          ) {

            like(
              post.id,
              true
            );


            lastTap =
              0;


            return;
          }


          lastTap =
            now;


          setTimeout(
            () => {

              if (
                Date.now() -
                  lastTap >=
                300
              ) {

                if (
  post.type === "video"
) {

  openReels(post);

} else {

  openViewer(
    post.id
  );

}

              }

            },
            320
          );

        }
      );


      grid.appendChild(
        card
      );

    }
  );


  requestAnimationFrame(
    playGridVideos
  );

}


async function uploadPost(
  file
) {

  if (
    !supabaseReady() ||
    !currentUser
  ) {
    return;
  }


  const progress =
    $("#uploadProgress");

  const progressText =
    $("#uploadProgressText");

  const progressFill =
    $("#uploadProgressFill");


  if (progress) {

    progress.classList.add(
      "show"
    );

  }


  try {

    const type =
      file.type.startsWith(
        "video/"
      )
        ? "video"
        : "image";


    const extension =
      (
        file.name
          .split(".")
          .pop() ||
        "bin"
      )
        .toLowerCase();


    const filename =
      currentUser.id +
      "_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .slice(2) +
      "." +
      extension;


    const path =
      "posts/" +
      filename;


    if (progressText) {

      progressText.textContent =
        "Envoi… 20%";

    }


    if (progressFill) {

      progressFill.style.width =
        "20%";

    }


    const {
      error: uploadError
    } =
      await supabaseClient
        .storage
        .from("media")
        .upload(
          path,
          file,
          {
            cacheControl:
              "3600",

            upsert:
              false
          }
        );


    if (uploadError) {
      throw uploadError;
    }


    const {
      data: publicData
    } =
      supabaseClient
        .storage
        .from("media")
        .getPublicUrl(
          path
        );


    const publicUrl =
      publicData?.publicUrl;


    if (!publicUrl) {

      throw new Error(
        "URL publique introuvable."
      );

    }


    const {
      data,
      error: insertError
    } =
      await supabaseClient
        .from("posts")
        .insert({

          user_id:
            currentUser.id,

          type,

          media_url:
            publicUrl,

          caption:
            "",

          likes:
            0

        })
        .select()
        .single();


    if (insertError) {
      throw insertError;
    }


    state.posts.unshift({

      id:
        data.id,

      type:
        data.type ||
        type,

      src:
        data.media_url ||
        publicUrl,

      caption:
        data.caption ||
        "",

      likes:
        data.likes ||
        0

    });


    save();

    renderGrid();


    if (progressText) {

      progressText.textContent =
        "Envoi… 100%";

    }


    if (progressFill) {

      progressFill.style.width =
        "100%";

    }


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

    setTimeout(
      () => {

        if (progress) {

          progress.classList.remove(
            "show"
          );

        }


        if (progressFill) {

          progressFill.style.width =
            "0%";

        }

      },
      600
    );

  }

}


async function loadSupabasePosts() {

  if (
    !supabaseReady() ||
    !currentUser
  ) {
    return;
  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("posts")
        .select(
          "id,user_id,type,media_url,caption,likes"
        )
        .eq(
          "user_id",
          currentUser.id
        )
        .order(
          "id",
          {
            ascending:
              false
          }
        );


    if (error) {
      throw error;
    }


    state.posts =
      (
        data ||
        []
      ).map(
        post => ({

          id:
            post.id,

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

        })
      );
const postIds =
  state.posts.map(
    post => post.id
  );

if (postIds.length) {

  const {
    data: likesData,
    error: likesError
  } =
    await supabaseClient
      .from("post_likes")
      .select("post_id,user_id")
      .in("post_id", postIds);

  if (likesError) {
    throw likesError;
  }

  state.posts.forEach(
    post => {

      post.likes =
        (likesData || [])
          .filter(
            like =>
              like.post_id == post.id
          )
          .length;

      state.liked[post.id] =
        (likesData || [])
          .some(
            like =>
              like.post_id == post.id &&
              like.user_id === currentUser.id
          );

    }
  );

}

    save();

    renderGrid();
renderProfile();

  } catch (error) {

    console.error(
      "Erreur chargement publications :",
      error
    );


    state.posts =
      [];


    renderGrid();


    toast(
      "Impossible de charger les publications"
    );

  }

}


$("#addPostBtn")
  ?.addEventListener(
    "click",
    () => {

      $("#postInput")
        ?.click();

    }
  );


$("#bottomAddPostBtn")
  ?.addEventListener(
    "click",
    () => {

      $("#postInput")
        ?.click();

    }
  );


$("#postInput")
  ?.addEventListener(
    "change",
    async () => {

      const input =
        $("#postInput");


      const file =
        input?.files?.[0];


      if (!file) {
        return;
      }


      await uploadPost(
        file
      );


      input.value =
        "";

    }
  );


/* =========================================================
LIKES
========================================================= */

async function refreshPostLikes(postId) {

  if (!supabaseReady() || !postId) {
    return 0;
  }

  const {
    count,
    error
  } =
    await supabaseClient
      .from("post_likes")
      .select(
        "*",
        {
          count: "exact",
          head: true
        }
      )
      .eq(
        "post_id",
        postId
      );

  if (error) {
    console.error(
      "Erreur compteur likes :",
      error
    );

    return 0;
  }

  const total =
    count || 0;

  const post =
    state.posts.find(
      item =>
        item.id == postId
    );

  if (post) {
    post.likes = total;
  }

  const explorePost =
    explorePosts.find(
      item =>
        item.id == postId
    );

  if (explorePost) {
    explorePost.likes = total;
  }

  return total;
}


async function like(
  id,
  showAnimation = false
) {

  if (
    !supabaseReady() ||
    !currentUser ||
    !id
  ) {
    return;
  }

  try {

    const {
      data: existingLike,
      error: checkError
    } =
      await supabaseClient
        .from("post_likes")
        .select(
          "post_id,user_id"
        )
        .eq(
          "post_id",
          id
        )
        .eq(
          "user_id",
          currentUser.id
        )
        .maybeSingle();

    if (checkError) {
      throw checkError;
    }


    if (existingLike) {

      const {
        error
      } =
        await supabaseClient
          .from("post_likes")
          .delete()
          .eq(
            "post_id",
            id
          )
          .eq(
            "user_id",
            currentUser.id
          );

      if (error) {
        throw error;
      }

      state.liked[id] =
        false;

    } else {

      const {
        error
      } =
        await supabaseClient
          .from("post_likes")
          .insert({
            post_id: id,
            user_id: currentUser.id
          });

      if (error) {
        throw error;
      }

      state.liked[id] =
        true;

  }


    await refreshPostLikes(
      id
    );

    save();

    renderGrid();


    if (
      showAnimation &&
      state.liked[id]
    ) {

      const target =
        [...(
          $("#postGrid")
            ?.children ||
          []
        )]
          .find(
            element =>
              element.dataset.id ==
              id
          );


      if (target) {

        const heart =
          document.createElement(
            "div"
          );

        heart.className =
          "heart-pop";

        heart.textContent =
          "♥";

        target.appendChild(
          heart
        );

        setTimeout(
          () =>
            heart.remove(),
          750
        );
      }
    }

  } catch (error) {

    console.error(
      "Erreur like Supabase :",
      error
    );

    toast(
      "Impossible d'enregistrer le like"
    );
  }
}

/* =========================================================
OPTIONS PUBLICATION
========================================================= */

let selectedPostForMenu =
  null;


function getPostOwnerId(post) {

  return (
    post?.userId ||
    activeProfileId ||
    currentUser?.id ||
    null
  );

}


function isOwnPost(post) {

  if (
    !post ||
    !currentUser
  ) {
    return false;
  }

  return (
    getPostOwnerId(post) ===
    currentUser.id
  );

}


function openPostMenu(post) {

  if (!isOwnPost(post)) {
    return;
  }

  selectedPostForMenu =
    post;

  const overlay =
    $("#postMenuOverlay");

  if (overlay) {
    overlay.hidden =
      false;
  }

}


function closePostMenu() {

  const overlay =
    $("#postMenuOverlay");

  if (overlay) {
    overlay.hidden =
      true;
  }

}


function addPostOptionsButton(
  container,
  post
) {

  if (!container) {
    return;
  }


  container
    .querySelector(
      ".post-options-btn"
    )
    ?.remove();


  if (!isOwnPost(post)) {
    return;
  }


  const button =
    document.createElement(
      "button"
    );


  button.type =
    "button";

  button.className =
    "post-options-btn";


  button.setAttribute(
    "aria-label",
    "Options de la publication"
  );


  button.innerHTML =
    `
    <span
      class="post-options-lines"
    ></span>
    `;


  button.addEventListener(
    "click",
    event => {

      event.preventDefault();

      event.stopPropagation();

      openPostMenu(
        post
      );

    }
  );


  container.appendChild(
    button
  );

}


function updatePostCaptionLocally(
  postId,
  caption
) {

  const update =
    post => {

      if (
        post &&
        post.id == postId
      ) {

        post.caption =
          caption;

      }

    };


  state.posts.forEach(
    update
  );

  explorePosts.forEach(
    update
  );

  homeFeedPosts.forEach(
    update
  );


  if (
    currentReelPost &&
    currentReelPost.id == postId
  ) {

    currentReelPost.caption =
      caption;

  }

}


/* MODIFIER */

$("#editPostMenuBtn")
  ?.addEventListener(
    "click",
    async () => {

      const post =
        selectedPostForMenu;


      if (!isOwnPost(post)) {
        return;
      }


      closePostMenu();


      const oldCaption =
        post.caption ||
        "";


      const newCaption =
        window.prompt(
          "Modifier la légende :",
          oldCaption
        );


      if (
        newCaption ===
        null
      ) {
        return;
      }


      try {

        const caption =
          newCaption.trim();


        const {
          error
        } =
          await supabaseClient
            .from("posts")
            .update({
              caption
            })
            .eq(
              "id",
              post.id
            )
            .eq(
              "user_id",
              currentUser.id
            );


        if (error) {
          throw error;
        }


        updatePostCaptionLocally(
          post.id,
          caption
        );


        save();

        renderGrid();


        if (
          currentReelPost &&
          currentReelPost.id ==
            post.id &&
          $("#reelsCaption")
        ) {

          $("#reelsCaption")
            .textContent =
            caption;

        }


        toast(
          "Publication modifiée"
        );


      } catch (error) {

        console.error(
          "Erreur modification publication :",
          error
        );

        toast(
          "Impossible de modifier la publication"
        );

      }

    }
  );


/* SUPPRIMER */

$("#deletePostMenuBtn")
  ?.addEventListener(
    "click",
    async () => {

      const post =
        selectedPostForMenu;


      if (!isOwnPost(post)) {
        return;
      }


      const confirmed =
        window.confirm(
          "Supprimer définitivement cette publication ?"
        );


      if (!confirmed) {
        return;
      }


      closePostMenu();


      try {

        const {
          error
        } =
          await supabaseClient
            .from("posts")
            .delete()
            .eq(
              "id",
              post.id
            )
            .eq(
              "user_id",
              currentUser.id
            );


        if (error) {
          throw error;
        }


        state.posts =
          state.posts.filter(
            item =>
              item.id != post.id
          );


        explorePosts =
          explorePosts.filter(
            item =>
              item.id != post.id
          );


        homeFeedPosts =
          homeFeedPosts.filter(
            item =>
              item.id != post.id
          );


        save();

        renderGrid();

        renderProfile();


        if (
          currentReelPost &&
          currentReelPost.id ==
            post.id
        ) {

          closeReels();

        }


        const viewer =
          $("#viewer");

        if (
          viewer?.classList
            .contains("open")
        ) {

          closeViewer();

        }


        toast(
          "Publication supprimée"
        );


      } catch (error) {

        console.error(
          "Erreur suppression publication :",
          error
        );

        toast(
          "Impossible de supprimer la publication"
        );

      }

    }
  );


$("#closePostMenuBtn")
  ?.addEventListener(
    "click",
    () => {

      closePostMenu();

    }
  );


$("#postMenuOverlay")
  ?.addEventListener(
    "click",
    event => {

      if (
        event.target.id ===
        "postMenuOverlay"
      ) {

        closePostMenu();

      }

    }
  );
/* =========================================================
REELS
========================================================= */

let currentReelPost = null;


      async function openReels(post) {

  console.log("Ouverture Reel :", post);

  const page = document.getElementById("reelsPage");
  const video = document.getElementById("reelsVideo");

  if (!page) {
    console.error("reelsPage introuvable");
    toast("Erreur : page Reels introuvable");
    return;
  }

  if (!video) {
    console.error("reelsVideo introuvable");
    toast("Erreur : lecteur vidéo introuvable");
    return;
  }

  if (!post || !post.src) {
    console.error("Vidéo invalide :", post);
    toast("Impossible de charger cette vidéo");
    return;
  }

  currentReelPost = post;

addPostOptionsButton(
  page,
  post
);

  page.hidden = false;
  page.removeAttribute("hidden");

  page.style.display = "flex";
  page.style.position = "fixed";
  page.style.inset = "0";
  page.style.zIndex = "99999";

  document.body.style.overflow = "hidden";

  try {
    video.pause();
  } catch {}

  video.controls = false;
  video.removeAttribute("controls");

  video.src = post.src;
  video.loop = true;
  video.playsInline = true;

  video.setAttribute(
    "playsinline",
    ""
  );

  video.setAttribute(
    "webkit-playsinline",
    ""
  );

  video.muted = true;

  video.load();

  const likeCount =
    document.getElementById(
      "reelsLikeCount"
    );

  if (likeCount) {
    likeCount.textContent =
      post.likes || 0;
  }

  const caption =
    document.getElementById(
      "reelsCaption"
    );

  if (caption) {
    caption.textContent =
      post.caption || "";
  }

  const profileId =
    post.userId ||
    activeProfileId ||
    currentUser?.id;

  if (
    profileId &&
    supabaseClient
  ) {

    try {

      const {
        data: profile,
        error
      } =
        await supabaseClient
          .from("profiles")
          .select(
            "id,username,name,avatar_url"
          )
          .eq(
            "id",
            profileId
          )
          .single();

      if (
        !error &&
        profile
      ) {

        const username =
          document.getElementById(
            "reelsUsername"
          );

        if (username) {
          username.textContent =
            profile.username ||
            "Utilisateur";
        }

        const avatar =
          document.getElementById(
            "reelsAvatar"
          );

        if (avatar) {

          avatar.innerHTML = "";

          if (profile.avatar_url) {

            const img =
              document.createElement(
                "img"
              );

            img.src =
              profile.avatar_url;

            img.alt =
              profile.username || "";

            avatar.appendChild(
              img
            );

          } else {

            avatar.textContent =
              "👤";

          }

        }

      }

    } catch (error) {

      console.error(
        "Erreur profil Reel :",
        error
      );

    }

  }

  try {

    await video.play();

  } catch (error) {

    console.error(
      "Erreur lecture Reel :",
      error
    );

  }

}

function closeReels() {

  const page =
    document.getElementById(
      "reelsPage"
    );

  const video =
    document.getElementById(
      "reelsVideo"
    );


  if (video) {

    try {
      video.pause();
    } catch {}

    video.removeAttribute(
      "src"
    );

    video.load();

  }


  if (page) {

    page.hidden = true;

    page.setAttribute(
      "hidden",
      ""
    );

    page.style.display =
      "none";

  }


  document.body.style.overflow =
    "";

  currentReelPost =
    null;

}
$("#reelsBackBtn")
  ?.addEventListener(
    "click",
    closeReels
  );
  


$("#reelsVideo")
  ?.addEventListener(
    "click",
    () => {

      const video =
        $("#reelsVideo");

      if (!video) {
        return;
      }


      if (video.paused) {

        video
          .play()
          .catch(() => {});

      } else {

        video.pause();

      }

    }
  );


$("#reelsShareBtn")
  ?.addEventListener(
    "click",
    async () => {

      try {

        await navigator.clipboard
          .writeText(
            location.href
          );

        toast(
          "Lien copié"
        );

      } catch {

        toast(
          "Impossible de copier le lien"
        );

      }

    }
  );


$("#reelsLikeBtn")
  ?.addEventListener(
    "click",
    async () => {

      if (!currentReelPost) {
        return;
      }

      await like(
        currentReelPost.id,
        false
      );

      await refreshPostLikes(
        currentReelPost.id
      );

      const reelPost =
        explorePosts.find(
          post =>
            post.id ==
            currentReelPost.id
        );

      const total =
        reelPost?.likes ??
        currentReelPost.likes ??
        0;

      currentReelPost.likes =
        total;

      if ($("#reelsLikeCount")) {
        $("#reelsLikeCount")
          .textContent =
          formatLikes(total);
      }

    }
  );
/* =========================================================
VISIONNEUSE
========================================================= */

let viewerIndex =
  0;


function getFilteredPosts() {

  return state.posts.filter(
    post =>

      state.filter ===
        "all" ||

      post.type ===
        state.filter
  );

}


function openViewer(id) {

  const posts =
    getFilteredPosts();


  const index =
    posts.findIndex(
      post =>
        post.id ==
        id
    );


  if (
    index <
    0
  ) {
    return;
  }


  viewerIndex =
    index;


  showViewerPost();


  const viewer =
    $("#viewer");


  if (!viewer) {
    return;
  }


  viewer.classList.add(
    "open"
  );


  viewer.setAttribute(
    "aria-hidden",
    "false"
  );


  document.body
    .style.overflow =
    "hidden";

}


function showViewerPost() {

  const posts =
    getFilteredPosts();


  const post =
    posts[
      viewerIndex
    ];


  if (!post) {
    return;
  }


  const content =
    $("#viewerContent");


  if (!content) {
    return;
  }


  content.innerHTML =
    "";


  const element =
    mediaElement(
      post,
      true
    );


  content.appendChild(
    element
  );

addPostOptionsButton(
  $("#viewer"),
  post
);

  if (
    post.type ===
    "video"
  ) {

    element.autoplay =
      true;


    element.controls =
      true;


    element
      .addEventListener(
        "canplay",
        () => {

          element
            .play()
            .catch(
              () => {}
            );

        },
        {
          once:
            true
        }
      );

  }


  if (
    $("#viewerCaption")
  ) {

    $("#viewerCaption")
      .textContent =
      post.caption ||
      "";

  }

}


function closeViewer() {

  const viewer =
    $("#viewer");


  if (!viewer) {
    return;
  }


  viewer.classList.remove(
    "open"
  );


  viewer.setAttribute(
    "aria-hidden",
    "true"
  );


  if (
    $("#viewerContent")
  ) {

    $("#viewerContent")
      .innerHTML =
      "";

  }


  document.body
    .style.overflow =
    "";

}


$("#viewerClose")
  ?.addEventListener(
    "click",
    closeViewer
  );


$("#viewer")
  ?.addEventListener(
    "click",
    event => {

      if (
        event.target.id ===
        "viewer"
      ) {

        closeViewer();

      }

    }
  );


$("#viewerPrev")
  ?.addEventListener(
    "click",
    () => {

      const posts =
        getFilteredPosts();


      if (
        !posts.length
      ) {
        return;
      }


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


$("#viewerNext")
  ?.addEventListener(
    "click",
    () => {

      const posts =
        getFilteredPosts();


      if (
        !posts.length
      ) {
        return;
      }


      viewerIndex =
        (
          viewerIndex +
          1
        ) %
        posts.length;


      showViewerPost();

    }
  );


document
  .addEventListener(
    "keydown",
    event => {

      const viewer =
        $("#viewer");


      if (
        !viewer ||
        !viewer.classList
          .contains(
            "open"
          )
      ) {
        return;
      }


      if (
        event.key ===
        "Escape"
      ) {

        closeViewer();

      }


      if (
        event.key ===
        "ArrowLeft"
      ) {

        $("#viewerPrev")
          ?.click();

      }


      if (
        event.key ===
        "ArrowRight"
      ) {

        $("#viewerNext")
          ?.click();

      }

    }
  );


/* =========================================================
FILTRES
========================================================= */

$$(".tab")
  .forEach(
    tab => {

      tab.addEventListener(
        "click",
        () => {

          $$(".tab")
            .forEach(
              item => {

                item
                  .classList
                  .remove(
                    "active"
                  );

              }
            );


          tab
            .classList
            .add(
              "active"
            );


          state.filter =
            tab.dataset.filter ||
            "all";


          save();

          renderGrid();

        }
      );

    }
  );
/* =========================================================
ABONNEMENTS
========================================================= */

async function loadFollowCounts(userId) {

  if (
    !supabaseReady() ||
    !userId
  ) {
    return;
  }

  try {

    const [
      followersResult,
      followingResult
    ] = await Promise.all([

      supabaseClient
        .from("follows")
        .select(
          "*",
          {
            count: "exact",
            head: true
          }
        )
        .eq(
          "following_id",
          userId
        ),

      supabaseClient
        .from("follows")
        .select(
          "*",
          {
            count: "exact",
            head: true
          }
        )
        .eq(
          "follower_id",
          userId
        )

    ]);

    if (followersResult.error) {
      throw followersResult.error;
    }

    if (followingResult.error) {
      throw followingResult.error;
    }

    state.profile.followers =
      followersResult.count || 0;

    state.profile.following =
      followingResult.count || 0;

    renderProfile();

  } catch (error) {

    console.error(
      "Erreur compteurs abonnements :",
      error
    );

  }
}


async function updateFollowButton(userId) {

  const button =
    $("#followBtn");

  if (
    !button ||
    !currentUser ||
    !userId
  ) {
    return;
  }

  if (
    userId === currentUser.id
  ) {

    button.hidden = true;
    return;

  }

  button.hidden = false;

  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("follows")
        .select(
          "follower_id,following_id"
        )
        .eq(
          "follower_id",
          currentUser.id
        )
        .eq(
          "following_id",
          userId
        )
        .maybeSingle();

    if (error) {
      throw error;
    }

    const following =
      !!data;

    button.dataset.following =
      following
        ? "true"
        : "false";

    button.textContent =
      following
        ? "Abonné(e)"
        : "S’abonner";

    button.classList.toggle(
      "following",
      following
    );

  } catch (error) {

    console.error(
      "Erreur état abonnement :",
      error
    );

  }
}


async function toggleFollow() {

  const button =
    $("#followBtn");

  if (
    !button ||
    !currentUser ||
    !activeProfileId ||
    activeProfileId === currentUser.id
  ) {
    return;
  }

  button.disabled = true;

  try {

    const alreadyFollowing =
      button.dataset.following ===
      "true";

    if (alreadyFollowing) {

      const {
        error
      } =
        await supabaseClient
          .from("follows")
          .delete()
          .eq(
            "follower_id",
            currentUser.id
          )
          .eq(
            "following_id",
            activeProfileId
          );

      if (error) {
        throw error;
      }

      toast(
        "Vous ne suivez plus ce compte"
      );

    } else {

      const {
        error
      } =
        await supabaseClient
          .from("follows")
          .insert({
            follower_id:
              currentUser.id,

            following_id:
              activeProfileId
          });

      if (error) {
        throw error;
      }

      toast(
        "Vous suivez maintenant ce compte"
      );

    }

    await updateFollowButton(
      activeProfileId
    );

    await loadFollowCounts(
      activeProfileId
    );

  } catch (error) {

    console.error(
      "Erreur abonnement :",
      error
    );

    toast(
      "Impossible de modifier l’abonnement"
    );

  } finally {

    button.disabled = false;

  }

}


$("#followBtn")
  ?.addEventListener(
    "click",
    toggleFollow
  );


      /* =========================================================
LISTE ABONNÉS / ABONNEMENTS
========================================================= */

let followListUsers = [];


function renderFollowList(users) {

  const content =
    $("#followListContent");

  if (!content) {
    return;
  }

  content.innerHTML = "";


  if (!users.length) {

    content.innerHTML =
      `
      <div class="follow-list-empty">
        Aucun utilisateur trouvé
      </div>
      `;

    return;
  }


  users.forEach(
    profile => {

      const row =
        document.createElement(
          "div"
        );

      row.className =
        "follow-list-item";


      const avatar =
        document.createElement(
          "div"
        );

      avatar.className =
        "follow-list-avatar";


      if (profile.avatar_url) {

        const img =
          document.createElement(
            "img"
          );

        img.src =
          profile.avatar_url;

        img.alt =
          profile.username || "";

        avatar.appendChild(
          img
        );

      } else {

        avatar.textContent =
          "👤";

      }


      const text =
        document.createElement(
          "div"
        );

      text.className =
        "follow-list-text";


      const username =
        document.createElement(
          "div"
        );

      username.className =
        "follow-list-username";

      username.textContent =
        profile.username ||
        "Utilisateur";


      const name =
        document.createElement(
          "div"
        );

      name.className =
        "follow-list-name";

      name.textContent =
        profile.name || "";


      text.appendChild(
        username
      );

      text.appendChild(
        name
      );


      row.appendChild(
        avatar
      );

      row.appendChild(
        text
      );


      row.addEventListener(
        "click",
        async () => {

          $("#followListPage").hidden =
            true;

          await openUserProfile(
            profile.id
          );

        }
      );


      content.appendChild(
        row
      );

    }
  );

}


async function openFollowList(type) {

  if (
    !supabaseReady() ||
    !currentUser
  ) {
    return;
  }


  const userId =
    activeProfileId ||
    currentUser.id;


  const page =
    $("#followListPage");

  const title =
    $("#followListTitle");

  const searchInput =
    $("#followListSearch");

  const content =
    $("#followListContent");


  if (
    !page ||
    !title ||
    !content
  ) {
    return;
  }


  const isFollowers =
    type === "followers";


  title.textContent =
    isFollowers
      ? "Abonnés"
      : "Abonnements";


  if (searchInput) {
    searchInput.value = "";
  }


  content.innerHTML =
    `
    <div class="follow-list-empty">
      Chargement...
    </div>
    `;


  page.hidden = false;


  try {

    let followResult;


    if (isFollowers) {

      followResult =
        await supabaseClient
          .from("follows")
          .select("follower_id")
          .eq(
            "following_id",
            userId
          );

    } else {

      followResult =
        await supabaseClient
          .from("follows")
          .select("following_id")
          .eq(
            "follower_id",
            userId
          );

    }


    if (followResult.error) {
      throw followResult.error;
    }


    const ids =
      (followResult.data || [])
        .map(
          item =>
            isFollowers
              ? item.follower_id
              : item.following_id
        )
        .filter(Boolean);


    if (!ids.length) {

      followListUsers = [];

      content.innerHTML =
        `
        <div class="follow-list-empty">
          ${
            isFollowers
              ? "Aucun abonné pour le moment"
              : "Aucun abonnement pour le moment"
          }
        </div>
        `;

      return;
    }


    const {
      data: profiles,
      error: profilesError
    } =
      await supabaseClient
        .from("profiles")
        .select(
          "id,username,name,avatar_url"
        )
        .in(
          "id",
          ids
        );


    if (profilesError) {
      throw profilesError;
    }


    const profileMap =
      new Map(
        (profiles || []).map(
          profile => [
            profile.id,
            profile
          ]
        )
      );


    followListUsers =
      ids
        .map(
          id =>
            profileMap.get(id)
        )
        .filter(Boolean);


    renderFollowList(
      followListUsers
    );


  } catch (error) {

    console.error(
      "Erreur liste abonnements :",
      error
    );

    content.innerHTML =
      `
      <div class="follow-list-empty">
        Impossible de charger la liste
      </div>
      `;

  }

}


$("#followersBtn")
  ?.addEventListener(
    "click",
    () => {

      openFollowList(
        "followers"
      );

    }
  );


$("#followingBtn")
  ?.addEventListener(
    "click",
    () => {

      openFollowList(
        "following"
      );

    }
  );


$("#followListBack")
  ?.addEventListener(
    "click",
    () => {

      const page =
        $("#followListPage");

      if (page) {
        page.hidden = true;
      }

    }
  );


$("#followListSearch")
  ?.addEventListener(
    "input",
    event => {

      const query =
        event.target.value
          .trim()
          .toLowerCase();


      if (!query) {

        renderFollowList(
          followListUsers
        );

        return;
      }


      const filtered =
        followListUsers.filter(
          profile => {

            const username =
              (
                profile.username ||
                ""
              ).toLowerCase();

            const name =
              (
                profile.name ||
                ""
              ).toLowerCase();


            return (
              username.includes(
                query
              ) ||
              name.includes(
                query
              )
            );

          }
        );


      renderFollowList(
        filtered
      );

    }
  );
/* =========================================================
RECHERCHE UTILISATEURS
========================================================= */

let viewingOtherProfile =
  false;
let activeProfileId =
  null;

function setOwnerMode(
  isOwner
) {

  const addPostBtn =
    $("#addPostBtn");

  const bottomAddPostBtn =
    $("#bottomAddPostBtn");

  const editProfileBtn =
    $("#editProfileBtn");

  const coverEdit =
    $(".cover-edit");

  const avatarPlus =
    $(".avatar-plus");

  const avatarWrap =
    $(".avatar-wrap");
const followBtn =
  $("#followBtn");

  if (addPostBtn) {

    addPostBtn
      .style.display =
      isOwner
        ? ""
        : "none";

  }


  if (
    bottomAddPostBtn
  ) {

    bottomAddPostBtn
      .style.visibility =
      isOwner
        ? "visible"
        : "hidden";

  }


  if (editProfileBtn) {

    editProfileBtn
      .style.display =
      isOwner
        ? ""
        : "none";

  }


  if (coverEdit) {

    coverEdit
      .style.display =
      isOwner
        ? ""
        : "none";

  }


  if (avatarPlus) {

    avatarPlus
      .style.display =
      isOwner
        ? ""
        : "none";

  }


  if (avatarWrap) {

    avatarWrap
      .style.pointerEvents =
      isOwner
        ? ""
        : "none";

  }
if (followBtn) {
  followBtn.hidden =
    isOwner;
    }
}


async function searchUsers(
  query
) {

  if (!supabaseReady()) {
    return;
  }


  const resultsBox =
    $("#userSearchResults");


  if (!resultsBox) {
    return;
  }


  const search =
    query.trim();


  if (
    search.length <
    2
  ) {

    resultsBox.innerHTML =
      "";

    resultsBox
      .classList
      .remove(
        "show"
      );

    return;

  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("profiles")
        .select(
          "id,username,name,avatar_url"
        )
        .or(
          `username.ilike.%${search}%,name.ilike.%${search}%`
        )
        .limit(
          20
        );


    if (error) {
      throw error;
    }


    resultsBox.innerHTML =
      "";


    if (
      !data ||
      data.length ===
        0
    ) {

      resultsBox.innerHTML =
        `
        <div class="search-empty">
          Aucun utilisateur trouvé
        </div>
        `;


      resultsBox
        .classList
        .add(
          "show"
        );


      return;
    }


    data.forEach(
      profile => {

        const row =
          document.createElement(
            "div"
          );


        row.className =
          "user-result";


        const avatar =
          document.createElement(
            "div"
          );


        avatar.className =
          "user-result-avatar";


        if (
          profile.avatar_url
        ) {

          const img =
            document.createElement(
              "img"
            );


          img.src =
            profile.avatar_url;


          img.alt =
            profile.username ||
            "";


          avatar.appendChild(
            img
          );


        } else {

          avatar.textContent =
            "👤";

        }


        const text =
          document.createElement(
            "div"
          );


        text.className =
          "user-result-text";


        const username =
          document.createElement(
            "div"
          );


        username.className =
          "user-result-username";


        username.textContent =
          profile.username ||
          "Utilisateur";


        const name =
          document.createElement(
            "div"
          );


        name.className =
          "user-result-name";


        name.textContent =
          profile.name ||
          "";


        text.appendChild(
          username
        );


        text.appendChild(
          name
        );


        row.appendChild(
          avatar
        );


        row.appendChild(
          text
        );


        row.addEventListener(
          "click",
          async () => {

            await openUserProfile(
              profile.id
            );

          }
        );


        resultsBox.appendChild(
          row
        );

      }
    );


    resultsBox
      .classList
      .add(
        "show"
      );


  } catch (error) {

    console.error(
      "Erreur recherche utilisateurs :",
      error
    );


    resultsBox.innerHTML =
      `
      <div class="search-empty">
        Erreur pendant la recherche
      </div>
      `;


    resultsBox
      .classList
      .add(
        "show"
      );

  }

}


async function openUserProfile(
  userId
) {

  if (!supabaseReady()) {
    return;
  }


  try {

    const profileResult =
      await supabaseClient
        .from("profiles")
        .select(
          "id,username,name,bio,link,avatar_url,cover_url"
        )
        .eq(
          "id",
          userId
        )
        .single();


    if (
      profileResult.error
    ) {
      throw profileResult.error;
    }


    const postsResult =
      await supabaseClient
        .from("posts")
        .select(
          "id,user_id,type,media_url,caption,likes"
        )
        .eq(
          "user_id",
          userId
        )
        .order(
          "id",
          {
            ascending:
              false
          }
        );


    if (
      postsResult.error
    ) {
      throw postsResult.error;
    }


    const profile =
      profileResult.data;


    viewingOtherProfile =
      userId !==
      currentUser?.id;
activeProfileId =
  userId;

    state.profile.name =
      profile.name ||
      "";


    state.profile.username =
      profile.username ||
      "";


    state.profile.bio =
      profile.bio ||
      "";


    state.profile.link =
      profile.link ||
      "";


    state.customMedia.avatar =
      profile.avatar_url ||
      "";


    state.customMedia.cover =
      profile.cover_url ||
      "";


    state.posts =
      (
        postsResult.data ||
        []
      ).map(
        post => ({

          id:
            post.id,

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

        })
      );
const postIds =
  state.posts.map(
    post => post.id
  );

if (postIds.length) {

  const {
    data: likesData,
    error: likesError
  } =
    await supabaseClient
      .from("post_likes")
      .select("post_id,user_id")
      .in("post_id", postIds);

  if (likesError) {
    throw likesError;
  }

  state.posts.forEach(
    post => {

      post.likes =
        (likesData || [])
          .filter(
            like =>
              like.post_id == post.id
          )
          .length;

      state.liked[post.id] =
        (likesData || [])
          .some(
            like =>
              like.post_id == post.id &&
              like.user_id === currentUser.id
          );

    }
  );

}

    renderProfile();

    restoreMedia();

    renderGrid();


    setOwnerMode(
      !viewingOtherProfile
    );
await loadFollowCounts(
  userId
);

await updateFollowButton(
  userId
);

    const resultsBox =
      $("#userSearchResults");


    if (resultsBox) {

      resultsBox.innerHTML =
        "";


      if (
        viewingOtherProfile
      ) {

        const back =
          document.createElement(
            "button"
          );


        back.type =
          "button";


        back.className =
          "back-profile-btn";


        back.textContent =
          "← Revenir à mon profil";


        back.addEventListener(
          "click",
          returnToOwnProfile
        );


        resultsBox.appendChild(
          back
        );


        resultsBox
          .classList
          .add(
            "show"
          );

      }

    }


    window.scrollTo({
      top:
        0,

      behavior:
        "smooth"
    });


  } catch (error) {

    console.error(
      "Erreur ouverture profil :",
      error
    );


    toast(
      "Impossible d'ouvrir ce profil"
    );

  }

}


async function returnToOwnProfile() {

  if (!currentUser) {
    return;
  }


  viewingOtherProfile =
    false;
activeProfileId =
  currentUser.id;

  setOwnerMode(
    true
  );


  await loadUserProfile();

  await loadSupabasePosts();


  const input =
    $("#userSearchInput");


  const results =
    $("#userSearchResults");


  if (input) {

    input.value =
      "";

  }


  if (results) {

    results.innerHTML =
      "";

    results
      .classList
      .remove(
        "show"
      );

  }


  window.scrollTo({
    top:
      0,

    behavior:
      "smooth"
  });

}


let searchTimer =
  null;


$("#userSearchInput")
  ?.addEventListener(
    "input",
    event => {

      clearTimeout(
        searchTimer
      );


      const value =
        event.target.value;


      searchTimer =
        setTimeout(
          () => {

            searchUsers(
              value
            );

          },
          300
        );

    }
  );

/* =========================================================
EXPLORER
========================================================= */

let explorePosts = [];

async function loadExplorePosts() {

  if (
    !supabaseReady() ||
    !currentUser
  ) {
    return;
  }

  const grid =
    $("#exploreGrid");

  const empty =
    $("#exploreEmpty");

  if (!grid) {
    return;
  }

  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("posts")
        .select(
          "id,user_id,type,media_url,caption,likes"
        )
        .order(
          "id",
          {
            ascending: false
          }
        )
        .limit(100);

    if (error) {
      throw error;
    }

    explorePosts =
      (data || []).map(
        post => ({
          id: post.id,
          userId: post.user_id,
          type:
            post.type || "image",
          src:
            post.media_url,
          caption:
            post.caption || "",
          likes:
            post.likes || 0
        })
      );

    renderExploreGrid(
      explorePosts
    );

    if (empty) {
      empty.style.display =
        explorePosts.length
          ? "none"
          : "block";
    }

  } catch (error) {

    console.error(
      "Erreur chargement Explorer :",
      error
    );

    grid.innerHTML = "";

    if (empty) {
      empty.style.display =
        "block";
    }

    toast(
      "Impossible de charger Explorer"
    );
  }
}


function renderExploreGrid(posts) {

  const grid =
    $("#exploreGrid");

  if (!grid) {
    return;
  }

  grid.innerHTML = "";

  posts.forEach(
    post => {

      const card =
        document.createElement(
          "article"
        );

      card.className =
        "explore-post";

      card.dataset.id =
        post.id;

      const media =
        mediaElement(
          post
        );

      card.appendChild(
        media
      );

      if (
        post.type === "video"
      ) {

        const icon =
          document.createElement(
            "span"
          );

        icon.className =
          "explore-video-icon";

        icon.textContent =
          "▶";

        card.appendChild(
          icon
        );

        media.muted = true;
        media.loop = true;
        media.autoplay = true;
        media.playsInline = true;

        media
          .play()
          .catch(() => {});
      }

      card.addEventListener(
  "click",
  async () => {

    if (
      post.type === "video"
    ) {

      await openReels(
        post
      );

      return;
    }

    if (post.userId) {

      await showProfileInterface();

      await openUserProfile(
        post.userId
      );

    }

  }
);

      grid.appendChild(
        card
      );
    }
  );

  requestAnimationFrame(
    playExploreVideos
  );
}


function playExploreVideos() {

  $$("#exploreGrid video")
    .forEach(
      video => {

        video.muted = true;
        video.loop = true;
        video.playsInline = true;

        video
          .play()
          .catch(() => {});

      }
    );
}


async function showExploreInterface() {

  const profilePage =
    $("#profilePage");

  const profileSearch =
    $("#profileSearchSection");

  const explorePage =
    $("#explorePage");

  const topbar =
    $(".topbar");

  if (profilePage) {
    profilePage.hidden = true;
  }

  if (profileSearch) {
    profileSearch.hidden = true;
  }

  if (topbar) {
    topbar.style.display =
      "none";
  }

  if (explorePage) {
    explorePage.hidden = false;
  }

  $$(".bottom-nav-btn")
    .forEach(
      button => {
        button.classList.remove(
          "active"
        );
      }
    );

  $("#bottomSearchBtn")
    ?.classList
    .add(
      "active"
    );

  await loadExplorePosts();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


async function showProfileInterface() {

  const profilePage =
    $("#profilePage");

  const profileSearch =
    $("#profileSearchSection");

  const explorePage =
    $("#explorePage");

  const topbar =
    $(".topbar");

  if (explorePage) {
    explorePage.hidden = true;
  }

  if (profilePage) {
    profilePage.hidden = false;
  }

  if (profileSearch) {
    profileSearch.hidden = false;
  }

  if (topbar) {
    topbar.style.display =
      "";
  }

  $$(".bottom-nav-btn")
    .forEach(
      button => {
        button.classList.remove(
          "active"
        );
      }
    );

  $("#bottomProfileBtn")
    ?.classList
    .add(
      "active"
    );
}
/* =========================================================
RECHERCHE EXPLORER
========================================================= */

let exploreSearchTimer = null;


async function searchExplore(query) {

  if (!supabaseReady()) {
    return;
  }

  const resultsBox =
    $("#exploreSearchResults");

  if (!resultsBox) {
    return;
  }

  const search =
    query.trim();


  /* AUCUNE RECHERCHE */
  if (!search) {

    resultsBox.innerHTML = "";

    resultsBox.classList.remove(
      "show"
    );

    renderExploreGrid(
      explorePosts
    );

    return;
  }


  /* =====================================================
  RECHERCHE HASHTAG
  ===================================================== */

  if (search.startsWith("#")) {

    const tag =
      search
        .replace(/^#+/, "")
        .trim();


    if (!tag) {
      return;
    }


    try {

      const {
        data,
        error
      } =
        await supabaseClient
          .from("posts")
          .select(
            "id,user_id,type,media_url,caption,likes"
          )
          .ilike(
            "caption",
            `%#${tag}%`
          )
          .order(
            "id",
            {
              ascending: false
            }
          )
          .limit(100);


      if (error) {
        throw error;
      }


      const hashtagPosts =
        (data || []).map(
          post => ({
            id:
              post.id,

            userId:
              post.user_id,

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
          })
        );


      resultsBox.innerHTML =
        `
        <div class="explore-hashtag-result">
          #${tag}
          <span>
            ${hashtagPosts.length} publication(s)
          </span>
        </div>
        `;


      resultsBox.classList.add(
        "show"
      );


      renderExploreGrid(
        hashtagPosts
      );


    } catch (error) {

      console.error(
        "Erreur recherche hashtag :",
        error
      );

    }


    return;
  }


  /* =====================================================
  RECHERCHE UTILISATEURS
  ===================================================== */

  if (search.length < 2) {

    resultsBox.innerHTML = "";

    resultsBox.classList.remove(
      "show"
    );

    return;
  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("profiles")
        .select(
          "id,username,name,avatar_url"
        )
        .or(
          `username.ilike.%${search}%,name.ilike.%${search}%`
        )
        .limit(20);


    if (error) {
      throw error;
    }


    resultsBox.innerHTML = "";


    if (
      !data ||
      data.length === 0
    ) {

      resultsBox.innerHTML =
        `
        <div class="search-empty">
          Aucun utilisateur trouvé
        </div>
        `;

      resultsBox.classList.add(
        "show"
      );

      return;
    }


    data.forEach(
      profile => {

        const row =
          document.createElement(
            "div"
          );


        row.className =
          "explore-user-result";


        const avatar =
          document.createElement(
            "div"
          );


        avatar.className =
          "explore-user-avatar";


        if (profile.avatar_url) {

          const img =
            document.createElement(
              "img"
            );

          img.src =
            profile.avatar_url;

          img.alt =
            profile.username ||
            "";

          avatar.appendChild(
            img
          );

        } else {

          avatar.textContent =
            "👤";

        }


        const text =
          document.createElement(
            "div"
          );


        text.className =
          "explore-user-text";


        const username =
          document.createElement(
            "div"
          );


        username.className =
          "explore-user-username";


        username.textContent =
          profile.username ||
          "Utilisateur";


        const name =
          document.createElement(
            "div"
          );


        name.className =
          "explore-user-name";


        name.textContent =
          profile.name ||
          "";


        text.appendChild(
          username
        );

        text.appendChild(
          name
        );


        row.appendChild(
          avatar
        );

        row.appendChild(
          text
        );


        row.addEventListener(
          "click",
          async () => {

            await showProfileInterface();

            await openUserProfile(
              profile.id
            );

          }
        );


        resultsBox.appendChild(
          row
        );

      }
    );


    resultsBox.classList.add(
      "show"
    );


  } catch (error) {

    console.error(
      "Erreur recherche Explorer :",
      error
    );

  }

}


$("#exploreSearchInput")
  ?.addEventListener(
    "input",
    event => {

      clearTimeout(
        exploreSearchTimer
      );


      const value =
        event.target.value;


      exploreSearchTimer =
        setTimeout(
          () => {

            searchExplore(
              value
            );

          },
          300
        );

    }
  );
/* =========================================================
FIL D'ACTUALITÉ
========================================================= */

let homeFeedPosts = [];
let homeFeedProfiles = new Map();


async function loadHomeFeed() {

  if (
    !supabaseReady() ||
    !currentUser
  ) {
    return;
  }

  const feed =
    $("#homeFeed");

  const stories =
    $("#homeStories");

  const empty =
    $("#homeFeedEmpty");

  if (
    !feed ||
    !stories
  ) {
    return;
  }


  feed.innerHTML = "";
  stories.innerHTML = "";

  if (empty) {
    empty.hidden = true;
  }


  try {

    const {
      data: follows,
      error: followsError
    } =
      await supabaseClient
        .from("follows")
        .select("following_id")
        .eq(
          "follower_id",
          currentUser.id
        );

    if (followsError) {
      throw followsError;
    }


    const followingIds =
      (follows || [])
        .map(
          row =>
            row.following_id
        )
        .filter(Boolean);


    if (!followingIds.length) {

      if (empty) {
        empty.hidden = false;
        empty.textContent =
          "Vous ne suivez encore aucun compte.";
      }

      return;
    }


    const {
      data: profiles,
      error: profilesError
    } =
      await supabaseClient
        .from("profiles")
        .select(
          "id,username,name,avatar_url"
        )
        .in(
          "id",
          followingIds
        );

    if (profilesError) {
      throw profilesError;
    }


    homeFeedProfiles =
      new Map(
        (profiles || []).map(
          profile => [
            profile.id,
            profile
          ]
        )
      );


    followingIds.forEach(
      id => {

        const profile =
          homeFeedProfiles.get(id);

        if (!profile) {
          return;
        }


        const story =
          document.createElement(
            "div"
          );

        story.className =
          "home-story";


        const ring =
          document.createElement(
            "div"
          );

        ring.className =
          "home-story-ring";


        const avatar =
          document.createElement(
            "div"
          );

        avatar.className =
          "home-story-avatar";


        if (profile.avatar_url) {

          const img =
            document.createElement(
              "img"
            );

          img.src =
            profile.avatar_url;

          img.alt =
            profile.username ||
            "";

          avatar.appendChild(
            img
          );

        } else {

          avatar.textContent =
            "👤";

        }


        const name =
          document.createElement(
            "div"
          );

        name.className =
          "home-story-name";

        name.textContent =
          profile.username ||
          "Utilisateur";


        ring.appendChild(
          avatar
        );

        story.appendChild(
          ring
        );

        story.appendChild(
          name
        );


        story.addEventListener(
          "click",
          async () => {

            await showProfileInterface();

            await openUserProfile(
              profile.id
            );

          }
        );


        stories.appendChild(
          story
        );

      }
    );


    const {
      data: posts,
      error: postsError
    } =
      await supabaseClient
        .from("posts")
        .select(
          "id,user_id,type,media_url,caption,likes"
        )
        .in(
          "user_id",
          followingIds
        )
        .order(
          "id",
          {
            ascending: false
          }
        )
        .limit(100);

    if (postsError) {
      throw postsError;
    }


    homeFeedPosts =
      (posts || []).map(
        post => ({
          id:
            post.id,

          userId:
            post.user_id,

          type:
            post.type ||
            "image",

          src:
            post.media_url,

          caption:
            post.caption ||
            "",

          likes:
            0
        })
      );


    const postIds =
      homeFeedPosts.map(
        post => post.id
      );


    let likesData = [];


    if (postIds.length) {

      const {
        data,
        error
      } =
        await supabaseClient
          .from("post_likes")
          .select(
            "post_id,user_id"
          )
          .in(
            "post_id",
            postIds
          );

      if (error) {
        throw error;
      }


      likesData =
        data || [];


      homeFeedPosts.forEach(
        post => {

          post.likes =
            likesData.filter(
              like =>
                like.post_id ==
                post.id
            ).length;

        }
      );

    }


    if (!homeFeedPosts.length) {

      if (empty) {
        empty.hidden = false;
        empty.textContent =
          "Aucune publication pour le moment.";
      }

      return;
    }


    homeFeedPosts.forEach(
      post => {

        const profile =
          homeFeedProfiles.get(
            post.userId
          );

        const article =
          document.createElement(
            "article"
          );

        article.className =
          "feed-post";


        const mediaWrap =
          document.createElement(
            "div"
          );

        mediaWrap.className =
          "feed-post-media-wrap";


        const media =
          mediaElement(
            post
          );

        mediaWrap.appendChild(
          media
        );


        const top =
          document.createElement(
            "div"
          );

        top.className =
          "feed-post-top";


        const avatar =
          document.createElement(
            "div"
          );

        avatar.className =
          "feed-post-avatar";


        if (profile?.avatar_url) {

          const img =
            document.createElement(
              "img"
            );

          img.src =
            profile.avatar_url;

          img.alt =
            profile.username ||
            "";

          avatar.appendChild(
            img
          );

        } else {

          avatar.textContent =
            "👤";

        }


        const userBox =
          document.createElement(
            "div"
          );

        userBox.className =
          "feed-post-user";


        const username =
          document.createElement(
            "div"
          );

        username.className =
          "feed-post-username";

        username.textContent =
          profile?.username ||
          "Utilisateur";


        const audio =
          document.createElement(
            "div"
          );

        audio.className =
          "feed-post-audio";

        audio.textContent =
          post.type === "video"
            ? "♫ Audio d’origine"
            : "";


        userBox.appendChild(
          username
        );

        userBox.appendChild(
          audio
        );


        const menu =
          document.createElement(
            "button"
          );

        menu.className =
          "feed-post-menu";

        menu.type =
          "button";

        menu.textContent =
          "⋯";


        top.appendChild(
          avatar
        );

        top.appendChild(
          userBox
        );

        top.appendChild(
          menu
        );


        top.addEventListener(
          "click",
          async () => {

            if (!post.userId) {
              return;
            }

            await showProfileInterface();

            await openUserProfile(
              post.userId
            );

          }
        );


        mediaWrap.appendChild(
          top
        );


        if (
          post.type === "video"
        ) {

          media.muted = true;
          media.loop = true;
          media.playsInline = true;
          media.autoplay = true;

          media
            .play()
            .catch(
              () => {}
            );

          media.addEventListener(
            "click",
            () => {

              openReels(
                post
              );

            }
          );

        }


        const actions =
          document.createElement(
            "div"
          );

        actions.className =
          "feed-post-actions";


        const likeBtn =
          document.createElement(
            "button"
          );

        likeBtn.className =
          "feed-action-btn";

        likeBtn.type =
          "button";

        likeBtn.innerHTML =
          `♡ <span>${formatLikes(post.likes)}</span>`;


        likeBtn.addEventListener(
          "click",
          async () => {

            await like(
              post.id,
              false
            );

            const total =
              await refreshPostLikes(
                post.id
              );

            post.likes =
              total;

            likeBtn.innerHTML =
              `♡ <span>${formatLikes(total)}</span>`;

          }
        );


        const commentBtn =
          document.createElement(
            "button"
          );

        commentBtn.className =
          "feed-action-btn";

        commentBtn.type =
          "button";

        commentBtn.innerHTML =
          `◯ <span>0</span>`;


        const shareBtn =
          document.createElement(
            "button"
          );

        shareBtn.className =
          "feed-action-btn";

        shareBtn.type =
          "button";

        shareBtn.textContent =
          "↗";


        shareBtn.addEventListener(
          "click",
          async () => {

            try {

              await navigator.clipboard
                .writeText(
                  location.href
                );

              toast(
                "Lien copié"
              );

            } catch {

              toast(
                "Impossible de copier le lien"
              );

            }

          }
        );


        


        actions.appendChild(
          likeBtn
        );

        actions.appendChild(
          commentBtn
        );

        actions.appendChild(
          shareBtn
        );

        


        const caption =
          document.createElement(
            "div"
          );

        caption.className =
          "feed-post-caption";


        if (post.caption) {

          const strong =
            document.createElement(
              "strong"
            );

          strong.textContent =
            profile?.username ||
            "Utilisateur";

          caption.appendChild(
            strong
          );

          caption.appendChild(
            document.createTextNode(
              post.caption
            )
          );

        }


        article.appendChild(
          mediaWrap
        );

        article.appendChild(
          actions
        );

        article.appendChild(
          caption
        );


        feed.appendChild(
          article
        );

      }
    );


  } catch (error) {

    console.error(
      "Erreur fil actualité :",
      error
    );

    if (empty) {
      empty.hidden = false;
      empty.textContent =
        "Impossible de charger le fil d’actualité.";
    }

  }

}


async function showHomeFeed() {

  const profilePage =
    $("#profilePage");

  const explorePage =
    $("#explorePage");

  const homeFeedPage =
    $("#homeFeedPage");

  const topbar =
    $(".topbar");


  if (profilePage) {
    profilePage.hidden = true;
  }

  if (explorePage) {
    explorePage.hidden = true;
  }

  const followListPage =
    $("#followListPage");

  if (followListPage) {
    followListPage.hidden = true;
  }


  if (topbar) {
    topbar.style.display =
      "none";
  }

  if (homeFeedPage) {
    homeFeedPage.hidden = false;
  }


  $$(".bottom-nav-btn")
    .forEach(
      button => {

        button.classList.remove(
          "active"
        );

      }
    );


  $("#bottomHomeBtn")
    ?.classList
    .add(
      "active"
    );


  await loadHomeFeed();


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}
/* =========================================================
PAGE NOTIFICATIONS
========================================================= */


        async function loadNotifications() {

  if (
    !supabaseReady() ||
    !currentUser
  ) {
    return;
  }

  const list =
    $("#notificationsList");

  const empty =
    $("#notificationsEmpty");

  if (!list || !empty) {
    return;
  }

  list.innerHTML = "";
  empty.hidden = true;

  try {

    /* CHARGER LES NOTIFICATIONS */

    const {
      data: notifications,
      error
    } =
      await supabaseClient
        .from("notifications")
        .select(
          "id,recipient_id,actor_id,post_id,type,message,is_read,created_at"
        )
        .eq(
          "recipient_id",
          currentUser.id
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        )
        .limit(100);

    if (error) {

      console.error(
        "Erreur requête notifications :",
        error
      );

      throw error;
    }


    if (
      !notifications ||
      notifications.length === 0
    ) {

      empty.textContent =
        "Aucune notification pour le moment.";

      empty.hidden = false;

      return;
    }


    /* CHARGER LES PROFILS */

    const actorIds =
      [
        ...new Set(
          notifications
            .map(
              notification =>
                notification.actor_id
            )
            .filter(Boolean)
        )
      ];

    let profiles = [];


    if (actorIds.length) {

      const {
        data,
        error
      } =
        await supabaseClient
          .from("profiles")
          .select(
            "id,username,name,avatar_url"
          )
          .in(
            "id",
            actorIds
          );


      if (error) {

        console.error(
          "Erreur profils notifications :",
          error
        );

      } else {

        profiles =
          data || [];

      }

    }


    /* CHARGER LES PUBLICATIONS */

    const postIds =
      [
        ...new Set(
          notifications
            .map(
              notification =>
                notification.post_id
            )
            .filter(Boolean)
        )
      ];

    let posts = [];


    if (postIds.length) {

      const {
        data,
        error
      } =
        await supabaseClient
          .from("posts")
          .select(
            "id,user_id,type,media_url,caption"
          )
          .in(
            "id",
            postIds
          );


      if (error) {

        console.error(
          "Erreur publications notifications :",
          error
        );

      } else {

        posts =
          data || [];

      }

    }


    const profilesMap =
      new Map(
        profiles.map(
          profile => [
            profile.id,
            profile
          ]
        )
      );


    const postsMap =
      new Map(
        posts.map(
          post => [
            String(post.id),
            post
          ]
        )
      );


    /* AFFICHER LES NOTIFICATIONS */

    notifications.forEach(
      notification => {

        const profile =
          profilesMap.get(
            notification.actor_id
          );


        const post =
          postsMap.get(
            String(
              notification.post_id
            )
          );


        const item =
          document.createElement(
            "div"
          );

        item.className =
          "notification-item";


        if (!notification.is_read) {

          item.classList.add(
            "unread"
          );

        }


        /* AVATAR */

        const avatar =
          document.createElement(
            "div"
          );

        avatar.className =
          "notification-avatar";


        if (profile?.avatar_url) {

          const img =
            document.createElement(
              "img"
            );

          img.src =
            profile.avatar_url;

          img.alt =
            profile.username ||
            "";

          avatar.appendChild(
            img
          );

        } else {

          avatar.textContent =
            "👤";

        }


        /* TEXTE */

        const text =
          document.createElement(
            "div"
          );

        text.className =
          "notification-text";


        const username =
          document.createElement(
            "span"
          );

        username.className =
          "notification-username";

        username.textContent =
          profile?.username ||
          "Utilisateur";


        const message =
          document.createElement(
            "span"
          );

        message.textContent =
          " " +
          (
            notification.message ||
            (
              notification.type ===
                "comment"

                ? "a commenté votre publication"

                : "a aimé votre publication"
            )
          );


        text.appendChild(
          username
        );

        text.appendChild(
          message
        );


        /* MINIATURE PUBLICATION */

        const cover =
          document.createElement(
            "div"
          );

        cover.className =
          "notification-post-cover";


        if (post?.media_url) {

          if (
            post.type ===
            "video"
          ) {

            const video =
              document.createElement(
                "video"
              );

            video.src =
              post.media_url;

            video.muted =
              true;

            video.playsInline =
              true;

            video.preload =
              "metadata";

            cover.appendChild(
              video
            );

          } else {

            const img =
              document.createElement(
                "img"
              );

            img.src =
              post.media_url;

            img.alt =
              "Publication";

            cover.appendChild(
              img
            );

          }

        }


        /* CLIC SUR LA NOTIFICATION */

        item.addEventListener(
          "click",
          async () => {

            try {

              await supabaseClient
                .from("notifications")
                .update({
                  is_read: true
                })
                .eq(
                  "id",
                  notification.id
                );

            } catch (error) {

              console.error(
                "Erreur notification lue :",
                error
              );

            }


            if (post) {

              if (
                post.type ===
                "video"
              ) {

                openReels({
                  id:
                    post.id,

                  userId:
                    post.user_id,

                  type:
                    post.type,

                  src:
                    post.media_url,

                  caption:
                    post.caption || "",

                  likes:
                    0
                });

              } else {

                await showProfileInterface();

                await openUserProfile(
                  post.user_id
                );

                openViewer(
                  post.id
                );

              }

            }

          }
        );


        item.appendChild(
          avatar
        );

        item.appendChild(
          text
        );

        item.appendChild(
          cover
        );


        list.appendChild(
          item
        );

      }
    );


  } catch (error) {

  console.error(
    "Erreur chargement notifications :",
    error
  );

  empty.textContent =
    "ERREUR SUPABASE : " +
    (
      error?.message ||
      error?.details ||
      error?.hint ||
      JSON.stringify(error)
    );

  empty.hidden = false;

}

}


async function showNotificationsPage() {

  const notificationsPage =
    $("#notificationsPage");

  const homeFeedPage =
    $("#homeFeedPage");

  const profilePage =
    $("#profilePage");

  const explorePage =
    $("#explorePage");

  const followListPage =
    $("#followListPage");

  const topbar =
    $(".topbar");


  if (homeFeedPage) {
    homeFeedPage.hidden =
      true;
  }


  if (profilePage) {
    profilePage.hidden =
      true;
  }


  if (explorePage) {
    explorePage.hidden =
      true;
  }


  if (followListPage) {
    followListPage.hidden =
      true;
  }


  if (topbar) {

    topbar.style.display =
      "none";

  }


  if (notificationsPage) {

    notificationsPage.hidden =
      false;

  }


  await loadNotifications();


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}
  

$("#notificationsBtn")
  ?.addEventListener(
    "click",
    async () => {

      await showNotificationsPage();

    }
  );


$("#notificationsBackBtn")
  ?.addEventListener(
    "click",
    async () => {

      const notificationsPage =
        $("#notificationsPage");

      if (notificationsPage) {
        notificationsPage.hidden = true;
      }

      await showHomeFeed();

    }
  );
/* =========================================================
NAVIGATION BAS
========================================================= */ 

$("#bottomSearchBtn")
  ?.addEventListener(
    "click",
    async () => {

      await showExploreInterface();

      setTimeout(
        () => {
          $("#exploreSearchInput")
            ?.focus();
        },
        300
      );

    }
  );

$("#bottomProfileBtn")
  ?.addEventListener(
    "click",
    async () => {

      if (!currentUser) {
        return;
      }

      const homeFeedPage =
        $("#homeFeedPage");

      const explorePage =
        $("#explorePage");

      const notificationsPage =
        $("#notificationsPage");

      const followListPage =
        $("#followListPage");


      if (homeFeedPage) {
        homeFeedPage.hidden =
          true;
      }

      if (explorePage) {
        explorePage.hidden =
          true;
      }

      if (notificationsPage) {
        notificationsPage.hidden =
          true;
      }

      if (followListPage) {
        followListPage.hidden =
          true;
      }


      await showProfileInterface();

      await returnToOwnProfile();


      $("#bottomProfileBtn")
        ?.classList
        .add(
          "active"
        );

    }
  );


$("#bottomHomeBtn")
  ?.addEventListener(
    "click",
    async () => {

      await showHomeFeed();

    }
  );


/* =========================================================
PARTAGE
========================================================= */

$("#shareBtn")
  ?.addEventListener(
    "click",
    async () => {

      try {

        await navigator.clipboard
          .writeText(
            location.href
          );


        toast(
          "Lien du profil copié"
        );


      } catch {

        toast(
          "Copie du lien impossible"
        );

      }

    }
  );


/* =========================================================
THEME
========================================================= */

function applyTheme() {

  document.body
    .classList
    .toggle(
      "light",
      !state.dark
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


$("#themeBtn")
  ?.addEventListener(
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

$("#settingsBtn")
  ?.addEventListener(
    "click",
    () => {

      toast(
        "Paramètres bientôt disponibles"
      );

    }
  );


/* =========================================================
REPRISE VIDEOS QUAND ON REVIENT SUR LA PAGE
========================================================= */

document.addEventListener(
  "visibilitychange",
  () => {

    if (
      !document.hidden
    ) {

      playGridVideos();

    }

  }
);


/* =========================================================
INITIALISATION
========================================================= */

async function initializeApp() {

  try {

    setupAuth();

    if (!supabaseReady()) {

      showAuthScreen();
      return;

    }

    const {
      data,
      error
    } =
      await supabaseClient.auth
        .getSession();

    if (error) {
      throw error;
    }

    const session =
      data?.session;

    if (!session?.user) {

      currentUser = null;

      showAuthScreen();

      return;
    }

    currentUser =
      session.user;

    loadLocalStateForUser();

    applyTheme();

    await loadUserProfile();

    await loadSupabasePosts();

    setOwnerMode(true);

    showApp();

    playGridVideos();

  } catch (error) {

    console.error(
      "Erreur initialisation :",
      error
    );

    currentUser = null;

    showAuthScreen();

  }

}


initializeApp();


initializeApp();
