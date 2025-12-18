<p align="center">
  <img src="public/logo.png" alt="Horadric Abacus" width="300">
</p>

<h1 align="center">Horadric Abacus</h1>

<p align="center">
  <strong>Diablo 4 Boss Rotation Optimizer</strong><br>
  Maximize your party's boss kills by optimizing material trades
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#tech-stack">Tech Stack</a>
</p>

---

## What is Horadric Abacus?

Horadric Abacus is a web tool designed for **Diablo 4 players** who want to optimize their boss farming rotations. When playing in a party, each player has different summoning materials. This tool calculates the **optimal way to trade materials** between party members to maximize the total number of boss summons.

### The Problem It Solves

In Diablo 4, summoning bosses requires specific materials. When farming in a party of 2-4 players:
- Each player has different amounts of various materials
- Some materials are more valuable than others
- **Stygian Stones** can substitute for certain materials (Duriel, Andariel, Harbinger)
- Manually figuring out optimal trades is tedious and error-prone

**Horadric Abacus does the math for you** — just enter each player's materials and get an optimized rotation plan with exact trade instructions.

## Features

- **Smart Optimization** — Calculates maximum possible boss summons from pooled materials
- **Trade Instructions** — Shows exactly who should trade what to whom
- **Stygian Stone Support** — Intelligently allocates Stygian Stones based on your priority
- **Priority Selection** — Choose to prioritize Duriel, Andariel, Harbinger, or balanced distribution
- **Party Flexibility** — Works with 2, 3, or 4 players
- **Data Persistence** — Your inputs are saved locally, survive page refreshes
- **Bilingual** — Available in English and Turkish
- **Mobile Friendly** — Fully responsive design

## How It Works

1. **Enter Materials** — Input each party member's material counts
2. **Set Priority** — Choose which Stygian-compatible boss to prioritize
3. **Optimize** — Click "Optimize Loot" to calculate the best rotation
4. **Trade & Farm** — Follow the trade list, then summon bosses together

### Supported Bosses & Materials

| Boss | Material | Cost |
|------|----------|------|
| Belial | Betrayer's Husk | 2 |
| Harbinger | Abhorrent Heart | 3 |
| Andariel | Pincushioned Doll | 3 |
| Duriel | Shard of Agony | 3 |
| Urivar | Judicator's Mask | 12 |
| Lord Zir | Exquisite Blood | 12 |
| Beast in Ice | Distilled Fear | 12 |
| Grigoire | Living Steel | 12 |
| Varshan | Malignant Heart | 12 |

**Stygian Stones** can substitute materials for Duriel, Andariel, and Harbinger only.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/umutterol/HoradricAbacus.git

# Navigate to directory
cd HoradricAbacus

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## Tech Stack

- **React 19** — UI framework
- **TypeScript** — Type safety
- **Vite** — Build tool
- **Tailwind CSS** — Styling
- **Lucide React** — Icons

## Design

The UI is inspired by Diablo 4's dark, gothic aesthetic featuring:
- Sanctuary dark theme with leather textures
- Custom Diablo-style buttons using 3-slice image technique
- Cinzel font for headings (medieval/fantasy feel)
- Material icons from the game

## Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## License

This project is open source and available under the [MIT License](LICENSE).

## Disclaimer

This project is **not affiliated with or endorsed by Blizzard Entertainment**. Diablo is a trademark of Blizzard Entertainment, Inc. All game assets and terminology are property of their respective owners.

---

<p align="center">
  Built for the Diablo community<br>
  <a href="https://github.com/umutterol/HoradricAbacus">GitHub</a> •
  <a href="https://x.com/UmutTuncErol">Twitter/X</a>
</p>
