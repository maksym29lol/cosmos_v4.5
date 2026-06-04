# 🌌 Cosmos v4.5 — Космічний Провідник

An interactive space explorer web app featuring a solar system catalog, 3D visualization, quizzes, a meteor shooter game, and an XP/rank progression system.

## 📁 Project Structure

```
cosmos/
├── index.html          ← Main HTML structure
├── style.css           ← All styles and animations
├── js/
│   ├── xp-system.js    ← Gamification: XP, ranks, badges, confetti
│   ├── audio.js        ← Generative ambient audio engine
│   ├── starfield.js    ← Animated canvas starfield background
│   ├── data.js         ← Space objects, missions, categories data
│   ├── main.js         ← UI logic: navigation, tabs, forum, compare, quiz
│   └── game.js         ← Meteor shooter game (Canvas 2D, ~600 lines)
└── README.md
```

## 🚀 How to Run

Just open `index.html` in any modern browser — no build step or server required.

```bash
# Option 1: open directly
open index.html

# Option 2: serve locally (avoids any CORS issues)
npx serve .
# or
python3 -m http.server 8080
```

## ✨ Features

- **Solar System Catalog** — Browse planets, moons, galaxies, and spacecraft
- **Spectral Gallery** — View objects in optical, infrared, X-ray, and more
- **Compare Tool** — Side-by-side visual and data comparison of any two objects
- **Space Missions** — Timeline of active, completed, and future missions
- **Live Forum** — Post messages about each object (stored in localStorage)
- **3D Solar System** — Interactive Three.js visualization with autopilot mode
- **☄️ Meteor Shooter** — Full arcade game with waves, combos, power-ups, and bosses
- **XP & Rank System** — Earn XP by exploring; unlock 7 ranks from Rookie to Legend
- **Cosmic Radio** — Generative ambient drone audio engine
- **Quiz Academy** — Test your space knowledge for bonus XP

## 🛠 Technologies

| File | Technology |
|------|-----------|
| `index.html` | HTML5 |
| `style.css` | CSS3 (custom properties, animations, grid/flex) |
| `xp-system.js` | Vanilla JS + Canvas 2D (badge rendering) |
| `audio.js` | Web Audio API |
| `starfield.js` | Canvas 2D animation |
| `data.js` | Vanilla JS (data layer) |
| `main.js` | Vanilla JS (UI/app logic) |
| `game.js` | Canvas 2D game engine |
| *(via CDN)* | [Three.js r128](https://threejs.org/) |

## 📦 Dependencies

Only one external dependency, loaded via CDN:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
```

No npm, no build tools, no framework.

## 🌐 Deploy to GitHub Pages

1. Push this folder to a GitHub repository
2. Go to **Settings → Pages**
3. Set source to `main` branch, `/ (root)`
4. Your app will be live at `https://<your-username>.github.io/<repo-name>/`

## 📝 License

Open source — feel free to fork and explore the cosmos.
