# 2026 World Cup Simulator

Monte Carlo simulator for the 2026 FIFA World Cup.
5,000 simulations · Dixon-Coles Poisson model · All 104 games · Full bracket.

---

## Deploy to GitHub Pages (step-by-step)

### What you need first

- A free account at [github.com](https://github.com)
- [Node.js 20+](https://nodejs.org) installed on your computer (LTS version)
- [Git](https://git-scm.com/downloads) installed on your computer

---

### Step 1 — Create a new GitHub repository

1. Go to [github.com/new](https://github.com/new)
2. Name it anything, e.g. `worldcup2026`
3. Leave it **Public** (required for free GitHub Pages)
4. **Do not** tick "Add a README" — leave the repo empty
5. Click **Create repository**
6. Copy the repo URL shown on the next page (looks like `https://github.com/YOUR_USERNAME/worldcup2026.git`)

---

### Step 2 — Enable GitHub Pages

1. In your new repo, go to **Settings → Pages** (left sidebar)
2. Under **Source**, choose **GitHub Actions**
3. Save — no other changes needed

---

### Step 3 — Clone the repo and add the files

Open a terminal (Mac: Terminal app; Windows: Command Prompt or PowerShell):

```bash
# Clone your new empty repo
git clone https://github.com/YOUR_USERNAME/worldcup2026.git
cd worldcup2026

# Copy all the files from this project folder into it
# (drag and drop works too — just copy everything inside worldcup2026-app/ into the cloned folder)
```

Or if you're comfortable with the terminal, just copy this whole `worldcup2026-app` folder's contents into the cloned directory.

---

### Step 4 — Install dependencies and test locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. The simulator should load and run. Press `Ctrl+C` to stop.

---

### Step 5 — Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

---

### Step 6 — Watch it deploy

1. Go to your repo on GitHub
2. Click the **Actions** tab
3. You'll see a workflow called "Deploy to GitHub Pages" running — it takes about 60–90 seconds
4. Once it shows a green tick, your site is live at:

```
https://YOUR_USERNAME.github.io/worldcup2026/
```

---

## Updating the simulator later

Any time you push a change to `main`, GitHub Actions automatically rebuilds and redeploys. No extra steps needed.

---

## Custom domain (optional)

1. Buy a domain (e.g. from Namecheap or Cloudflare, ~$10/year)
2. In your repo go to **Settings → Pages → Custom domain**
3. Enter your domain and follow the DNS instructions shown
4. GitHub handles the SSL certificate automatically

---

## Run locally

```bash
npm install      # first time only
npm run dev      # start dev server at localhost:5173
npm run build    # build for production (output goes to /dist)
npm run preview  # preview the production build locally
```
