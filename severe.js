// server.js
// One-file backend + frontend for a church site
// Run: npm i express multer
// Start: node server.js  -> http://localhost:3000

const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;

// --------- storage / data ----------
const DATA_FILE = path.join(__dirname, "data.json");
const UPLOAD_DIR = path.join(__dirname, "uploads");

// ensure storage
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(
      {
        books: [
          { id: 1, title: "On the Incarnation", author: "St. Athanasius", cover: "", link: "https://example.com/incarnation" },
          { id: 2, title: "Sayings of the Desert Fathers", author: "Various", cover: "", link: "https://example.com/desert-fathers" }
        ],
        psalms: [
          { id: 1, title: "Moged Simetagn", artist: "DGKA Choir", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" }
        ],
        pictures: [],
        messages: []
      },
      null,
      2
    )
  );
}

const load = () => JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
const save = (db) => fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));

// --------- middleware ----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(UPLOAD_DIR));

// file uploads (pictures)
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const base = path.parse(file.originalname).name.replace(/\s+/g, "_");
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});
const upload = multer({ storage });

// --------- API routes ----------
// BOOKS
app.get("/api/books", (req, res) => {
  const db = load();
  res.json(db.books);
});

app.post("/api/books", (req, res) => {
  const { title, author, cover, link } = req.body || {};
  if (!title) return res.status(400).json({ error: "title is required" });
  const db = load();
  const id = (db.books.at(-1)?.id || 0) + 1;
  db.books.push({ id, title, author: author || "", cover: cover || "", link: link || "" });
  save(db);
  res.json({ ok: true, id });
});

// PSALMS
app.get("/api/psalms", (req, res) => {
  const db = load();
  res.json(db.psalms);
});

app.post("/api/psalms", (req, res) => {
  const { title, artist, url } = req.body || {};
  if (!title || !url) return res.status(400).json({ error: "title and url required" });
  const db = load();
  const id = (db.psalms.at(-1)?.id || 0) + 1;
  db.psalms.push({ id, title, artist: artist || "", url });
  save(db);
  res.json({ ok: true, id });
});

// PICTURES
app.get("/api/pictures", (req, res) => {
  const db = load();
  res.json(db.pictures);
});

app.post("/api/pictures", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "image file required (field name: image)" });
  const { caption } = req.body || {};
  const db = load();
  const id = (db.pictures.at(-1)?.id || 0) + 1;
  const url = `/uploads/${req.file.filename}`;
  db.pictures.push({ id, url, caption: caption || "" });
  save(db);
  res.json({ ok: true, id, url });
});

// CONTACT
app.post("/api/contact", (req, res) => {
  const { name, email, message } = req.body || {};
  if (!name || !email || !message) return res.status(400).json({ error: "name, email, message required" });
  const db = load();
  const id = (db.messages.at(-1)?.id || 0) + 1;
  db.messages.push({ id, name, email, message, createdAt: new Date().toISOString() });
  save(db);
  res.json({ ok: true });
});

// --------- Frontend (single page) ----------
app.get("/", (_req, res) => {
  res.type("html").send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Debre Genet Kidus Amanuel EOTC</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;800&display=swap" rel="stylesheet">
<style>
  :root{
    --bg:#0f1221;
    --card:#14182c;
    --soft:#1b2040;
    --text:#e9ecf5;
    --muted:#b2b7c9;
    --gold:#efd675;
    --gold-2:#d8b84b;
    --accent:#7cc4ff;
  }
  *{box-sizing:border-box}
  body{margin:0;font-family:Poppins,system-ui,-apple-system,Segoe UI,Roboto;color:var(--text);background:radial-gradient(1200px 800px at 15% -10%, #1c2246 0%, #0f1221 55%) fixed;}
  a{color:var(--gold-2);text-decoration:none}
  a:hover{color:var(--gold)}
  .container{width:92%;max-width:1200px;margin:0 auto}
  header{
    position:sticky;top:0;z-index:10;
    background:rgba(20,24,44,0.7);backdrop-filter:blur(10px);
    border-bottom:1px solid #232748;
  }
  .nav{display:flex;align-items:center;justify-content:space-between;padding:12px 0}
  .brand{display:flex;gap:.75rem;align-items:center;font-weight:800;letter-spacing:.3px}
  .brand img{width:40px;height:40px;border-radius:10px;object-fit:cover;border:1px solid #2a2e56}
  .brand span{color:var(--gold)}
  nav a{margin-left:14px;color:var(--muted);font-weight:600;font-size:.95rem}
  nav a:hover{color:var(--text)}
  section{padding:64px 0;scroll-margin-top:68px}
  h1,h2{color:var(--gold)}
  .lead{color:var(--muted);max-width:800px;margin:10px auto 0}
  .grid{display:grid;gap:18px}
  .hero{
    display:grid;gap:20px;grid-template-columns:1.2fr .8fr;align-items:center
  }
  .card{
    background:linear-gradient(180deg,var(--card),#11142a);
    border:1px solid #22254a;border-radius:16px;padding:16px;
    box-shadow:0 6px 30px rgba(0,0,0,.25);
    transition:transform .25s ease, box-shadow .25s ease, border-color .25s ease;
  }
  .card:hover{transform:translateY(-4px);border-color:#2e335f}
  .kicker{font-size:.8rem;color:var(--muted);letter-spacing:.12em;text-transform:uppercase}
  .btn{
    display:inline-flex;align-items:center;gap:.5rem;padding:10px 14px;border-radius:10px;
    background:linear-gradient(180deg,#2a2e56,#20264d);border:1px solid #2e335f;color:var(--text);
    font-weight:700
  }
  .btn:hover{filter:brightness(1.1)}
  /* Books */
  .books{grid-template-columns:repeat(auto-fit,minmax(180px,1fr))}
  .book img{width:100%;height:240px;object-fit:cover;border-radius:12px;border:1px solid #2a2e56;margin-bottom:10px}
  .book-title{font-weight:700}
  .book-meta{color:var(--muted);font-size:.9rem}
  /* Psalms */
  .audio-row{display:grid;grid-template-columns:1fr;gap:12px}
  audio{width:100%}
  /* Pictures */
  .pics{grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}
  .pic{overflow:hidden;border-radius:12px;border:1px solid #2a2e56;background:#0b0e1f}
  .pic img{width:100%;height:180px;object-fit:cover;display:block;transition:transform .35s ease}
  .pic:hover img{transform:scale(1.06)}
  /* Contact */
  form{display:grid;gap:10px;max-width:520px}
  input,textarea{
    background:#0e1329;color:var(--text);border:1px solid #2a2e56;border-radius:12px;
    padding:12px 14px;font-size:1rem;outline:none;transition:border-color .2s ease, box-shadow .2s ease;
  }
  input:focus,textarea:focus{border-color:#3a4080;box-shadow:0 0 0 4px rgba(90,105,255,.15)}
  button[type="submit"]{cursor:pointer}
  /* Sections dividers */
  .divider{height:1px;background:#232748;margin:30px 0}
  footer{padding:24px 0;border-top:1px solid #232748;color:var(--muted);text-align:center}
  /* Animations */
  .reveal{opacity:0;transform:translateY(18px);animation:rise .7s ease forwards}
  .reveal.delay-1{animation-delay:.1s}
  .reveal.delay-2{animation-delay:.2s}
  .reveal.delay-3{animation-delay:.3s}
  @keyframes rise{to{opacity:1;transform:none}}
  @media (max-width: 900px){ .hero{grid-template-columns:1fr} }
</style>
</head>
<body>
<header>
  <div class="container nav">
    <div class="brand">
      <img src="https://placehold.co/80x80/png" alt="Logo" />
      <span>Debre Genet Kidus Amanuel EOTC</span>
    </div>
    <nav>
      <a href="#home">Home</a>
      <a href="#about">About</a>
      <a href="#books">Books</a>
      <a href="#psalms">Psalms</a>
      <a href="#pictures">Pictures</a>
      <a href="#contact">Contact</a>
    </nav>
  </div>
</header>

<main>
  <!-- HOME -->
  <section id="home">
    <div class="container hero">
      <div class="card reveal">
        <div class="kicker">Welcome</div>
        <h1>Peace be with you ✨</h1>
        <p class="lead">
          For over 20 years we’ve served Philadelphia and the surrounding area as a house of prayer,
          hope, and community. Explore books, psalms, and photos, learn about our faith, and reach out—
          we’re glad you’re here.
        </p>
        <div style="margin-top:12px">
          <a class="btn" href="#psalms">Listen to Psalms</a>
        </div>
      </div>
      <div class="card reveal delay-2">
        <div class="kicker">Service Times</div>
        <ul style="margin:10px 0 0 16px;line-height:1.9">
          <li>Liturgy — Sun 6:00 AM</li>
          <li>Zemariyan — Fri 6:30–8:00 PM / Sat 3:00–6:00 PM</li>
          <li>Bible Study — Sun 12:00 PM</li>
        </ul>
      </div>
    </div>
  </section>

  <div class="divider container"></div>

  <!-- ABOUT -->
  <section id="about">
    <div class="container">
      <h2 class="reveal">About Our Church</h2>
      <p class="lead reveal delay-1">
        We believe in one God, the Father Almighty… and in one Lord Jesus Christ, the Only-Begotten Son of God…
        and in the Holy Spirit, the Lord, the Life-Giver. We confess one baptism for the remission of sins and
        look for the resurrection of the dead and the life of the age to come.
      </p>
    </div>
  </section>

  <div class="divider container"></div>

  <!-- BOOKS -->
  <section id="books">
    <div class="container">
      <h2 class="reveal">Books</h2>
      <div id="booksGrid" class="grid books"></div>
      <div class="card reveal" style="margin-top:16px">
        <div class="kicker">Add a Book</div>
        <form id="addBookForm">
          <input name="title" placeholder="Title" required />
          <input name="author" placeholder="Author" />
          <input name="cover" placeholder="Cover URL (optional)" />
          <input name="link" placeholder="Link URL (optional)" />
          <button class="btn" type="submit">Save Book</button>
        </form>
      </div>
    </div>
  </section>

  <div class="divider container"></div>

  <!-- PSALMS -->
  <section id="psalms">
    <div class="container">
      <h2 class="reveal">Psalms & Songs</h2>
      <div id="psalmList" class="grid audio-row"></div>
      <div class="card reveal" style="margin-top:16px">
        <div class="kicker">Add a Psalm</div>
        <form id="addPsalmForm">
          <input name="title" placeholder="Title" required />
          <input name="artist" placeholder="Artist" />
          <input name="url" placeholder="Audio URL (.mp3/.m4a)" required />
          <button class="btn" type="submit">Save Psalm</button>
        </form>
      </div>
    </div>
  </section>

  <div class="divider container"></div>

  <!-- PICTURES -->
  <section id="pictures">
    <div class="container">
      <h2 class="reveal">Pictures</h2>
      <div id="picsGrid" class="grid pics"></div>
      <div class="card reveal" style="margin-top:16px">
        <div class="kicker">Upload a Picture</div>
        <form id="uploadPicForm" enctype="multipart/form-data">
          <input type="file" name="image" accept="image/*" required />
          <input name="caption" placeholder="Caption (optional)" />
          <button class="btn" type="submit">Upload</button>
        </form>
      </div>
    </div>
  </section>

  <div class="divider container"></div>

  <!-- CONTACT -->
  <section id="contact">
    <div class="container">
      <h2 class="reveal">Contact Us</h2>
      <div class="grid" style="grid-template-columns:1fr 1fr;gap:18px">
        <div class="card">
          <form id="contactForm">
            <input name="name" placeholder="Your Name" required />
            <input type="email" name="email" placeholder="Your Email" required />
            <textarea name="message" rows="6" placeholder="Your Message" required></textarea>
            <button class="btn" type="submit">Send</button>
          </form>
        </div>
        <div class="card">
          <div class="kicker">Visit</div>
          <p class="lead">7100 Woodland Ave, Philadelphia, PA 19142</p>
          <p class="lead">Phone: (xxx) xxx-xxxx</p>
          <p class="lead">Email: example@yourchurch.org</p>
        </div>
      </div>
    </div>
  </section>
</main>

<footer>
  © <span id="year"></span> Debre Genet Kidus Amanuel EOTC — All rights reserved.
</footer>

<script>
  // footer year
  document.getElementById("year").textContent = new Date().getFullYear();

  // helper to create elements
  const el = (tag, attrs={}, children=[]) => {
    const n = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v])=>{
      if (k === "class") n.className = v;
      else if (k === "html") n.innerHTML = v;
      else n.setAttribute(k, v);
    });
    children.forEach(c => n.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
    return n;
  };

  // ----- BOOKS -----
  const booksGrid = document.getElementById("booksGrid");
  const refreshBooks = async () => {
    const res = await fetch("/api/books");
    const data = await res.json();
    booksGrid.innerHTML = "";
    data.forEach(b=>{
      const card = el("div", { class:"card book reveal" }, [
        el("img", { src: b.cover || "https://placehold.co/400x600?text=Book", alt: b.title }),
        el("div", { class:"book-title", html: b.title }),
        el("div", { class:"book-meta", html: (b.author||"") }),
        b.link ? el("a", { href:b.link, target:"_blank" }, ["Open"]) : el("span")
      ]);
      booksGrid.appendChild(card);
    });
  };
  document.getElementById("addBookForm").addEventListener("submit", async (e)=>{
    e.preventDefault();
    const form = e.target;
    const payload = Object.fromEntries(new FormData(form).entries());
    await fetch("/api/books", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) });
    form.reset();
    refreshBooks();
  });

  // ----- PSALMS -----
  const psalmList = document.getElementById("psalmList");
  const refreshPsalms = async () => {
    const res = await fetch("/api/psalms");
    const data = await res.json();
    psalmList.innerHTML = "";
    data.forEach(p=>{
      const card = el("div", { class:"card reveal" }, [
        el("div", { class:"kicker", html: p.artist || "Psalm" }),
        el("strong", { html: p.title }),
        el("audio", { controls:true, src: p.url })
      ]);
      psalmList.appendChild(card);
    });
  };
  document.getElementById("addPsalmForm").addEventListener("submit", async (e)=>{
    e.preventDefault();
    const form = e.target;
    const payload = Object.fromEntries(new FormData(form).entries());
    await fetch("/api/psalms", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) });
    form.reset();
    refreshPsalms();
  });

  // ----- PICTURES -----
  const picsGrid = document.getElementById("picsGrid");
  const refreshPics = async () => {
    const res = await fetch("/api/pictures");
    const data = await res.json();
    picsGrid.innerHTML = "";
    data.forEach(p=>{
      const card = el("div", { class:"pic reveal" }, [
        el("img", { src: p.url, alt: p.caption || "Picture" }),
      ]);
      picsGrid.appendChild(card);
    });
  };
  document.getElementById("uploadPicForm").addEventListener("submit", async (e)=>{
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
    await fetch("/api/pictures", { method:"POST", body: fd });
    form.reset();
    refreshPics();
  });

  // ----- CONTACT -----
  document.getElementById("contactForm").addEventListener("submit", async (e)=>{
    e.preventDefault();
    const form = e.target;
    const payload = Object.fromEntries(new FormData(form).entries());
    const res = await fetch("/api/contact", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) });
    if (res.ok) { alert("Thank you! We received your message."); form.reset(); }
    else alert("There was a problem. Please try again.");
  });

  // initial loads
  refreshBooks();
  refreshPsalms();
  refreshPics();
</script>
</body>
</html>`);
});

// --------- start ----------
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
