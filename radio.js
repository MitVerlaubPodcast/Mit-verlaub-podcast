(() => {
  if (window.__mitVerlaubRadioReady) return;
  window.__mitVerlaubRadioReady = true;

  const playerStyle = document.createElement("style");
  playerStyle.id = "mitverlaub-radio-style";
  playerStyle.textContent = `
    body { padding-bottom: 184px !important; }
    #mitverlaub-radio { position:fixed; z-index:99999; left:0; right:0; bottom:0; background:rgba(12,8,20,.97); border-top:1px solid #68459a; box-shadow:0 -8px 30px #0008; color:#fff; font-family:Arial,sans-serif; }
    #mitverlaub-radio .radio-inner { max-width:1240px; margin:auto; padding:8px 18px 10px; }
    #mitverlaub-radio .radio-top { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:6px; }
    #mitverlaub-radio .radio-brand { font-size:12px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:#f58ac2; }
    #mitverlaub-radio .radio-toggle { border:1px solid #72539b; color:#fff; background:#241735; border-radius:18px; padding:6px 12px; font-weight:700; cursor:pointer; }
    #mitverlaub-radio iframe { display:block; width:100%; height:80px; border:0; border-radius:12px; }
    #mitverlaub-radio.is-open iframe { height:152px; }
    #mitverlaub-radio.is-closed .radio-inner { padding:8px 18px; }
    #mitverlaub-radio.is-closed .radio-top { margin:0; }
    #mitverlaub-radio.is-closed iframe { display:none; }
    #mitverlaub-radio.is-closed + #radio-spacer { display:none; }
    @media(max-width:600px) {
      body { padding-bottom:178px !important; }
      #mitverlaub-radio .radio-inner { padding:7px 10px 9px; }
      #mitverlaub-radio.is-open iframe { height:152px; }
      #mitverlaub-radio .radio-brand { font-size:10px; }
    }
  `;
  document.head.appendChild(playerStyle);

  const content = document.createElement("div");
  content.id = "site-content";
  while (document.body.firstChild) content.appendChild(document.body.firstChild);
  document.body.appendChild(content);

  const player = document.createElement("aside");
  player.id = "mitverlaub-radio";
  player.className = "is-open";
  player.setAttribute("aria-label", "Mit Verlaub Podcast-Player");
  player.innerHTML = `
    <div class="radio-inner">
      <div class="radio-top">
        <div class="radio-brand">♫ Mit Verlaub · Podcast-Radio</div>
        <button class="radio-toggle" type="button" aria-expanded="true">Player einklappen</button>
      </div>
      <iframe title="Mit Verlaub auf Spotify" src="https://open.spotify.com/embed/show/1vw3NAgj6bdS60r13hYVzk?utm_source=generator&theme=0" allow="clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="eager"></iframe>
    </div>`;
  document.body.appendChild(player);

  const toggle = player.querySelector(".radio-toggle");
  toggle.addEventListener("click", () => {
    const closed = player.classList.toggle("is-closed");
    player.classList.toggle("is-open", !closed);
    toggle.textContent = closed ? "Player ausklappen" : "Player einklappen";
    toggle.setAttribute("aria-expanded", String(!closed));
  });

  function shouldHandle(link) {
    if (!link || !link.href || link.target || link.hasAttribute("download")) return false;
    const url = new URL(link.href, location.href);
    return url.origin === location.origin &&
      !url.hash && /\\.html?$/.test(url.pathname) &&
      !/^(mailto:|tel:|javascript:)/i.test(link.getAttribute("href") || "");
  }

  async function navigate(url, addHistory = true) {
    const target = new URL(url, location.href);
    if (target.origin !== location.origin) { location.href = target.href; return; }
    try {
      const response = await fetch(target.href, { credentials: "same-origin" });
      if (!response.ok) throw new Error("Seite konnte nicht geladen werden");
      const html = await response.text();
      const next = new DOMParser().parseFromString(html, "text/html");

      document.title = next.title || "Mit Verlaub";
      const oldStyles = [...document.head.querySelectorAll("style:not(#mitverlaub-radio-style)")];
      oldStyles.forEach(style => style.remove());
      [...next.head.querySelectorAll("style")].forEach(style => {
        document.head.insertBefore(document.importNode(style, true), playerStyle);
      });
      ["description", "theme-color"].forEach(name => {
        const incoming = next.head.querySelector('meta[name="' + name + '"]');
        const current = document.head.querySelector('meta[name="' + name + '"]');
        if (incoming && current) current.content = incoming.content;
        else if (incoming) document.head.appendChild(document.importNode(incoming, true));
      });

      const freshNodes = [...next.body.childNodes].filter(node =>
        !(node.nodeType === 1 && node.tagName === "SCRIPT" && node.src && node.src.includes("radio.js"))
      );
      content.replaceChildren(...freshNodes.map(node => document.importNode(node, true)));

      // Inline page scripts are re-created so each page's existing features initialize.
      const scripts = [...content.querySelectorAll("script")];
      for (const oldScript of scripts) {
        const freshScript = document.createElement("script");
        for (const attr of oldScript.attributes) freshScript.setAttribute(attr.name, attr.value);
        freshScript.textContent = oldScript.textContent;
        oldScript.replaceWith(freshScript);
        if (freshScript.src) {
          await new Promise(resolve => { freshScript.onload = resolve; freshScript.onerror = resolve; });
        }
      }

      if (addHistory) history.pushState({}, "", target.pathname + target.search + target.hash);
      window.scrollTo(0, 0);
    } catch (error) {
      console.warn("Mit Verlaub Navigation:", error);
      location.href = target.href;
    }
  }

  document.addEventListener("click", event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest("a");
    if (!shouldHandle(link)) return;
    const url = new URL(link.href);
    if (url.pathname === location.pathname) return;
    event.preventDefault();
    navigate(url.href);
  });

  window.addEventListener("popstate", () => navigate(location.href, false));
})();