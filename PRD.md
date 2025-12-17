# PRD: The Horadric Abacus (Diablo 4 Rota Optimizer)

## **1. Executive Summary**

* **Product:** A single-page web application to optimize "Boss Rota" farming in Diablo 4.
* **Goal:** Calculate the most efficient way to distribute uneven stacks of summoning materials among a 4-player party to maximize total boss kills.
* **Key Feature:** "Stygian Stone" Joker logic—smartly substituting wildcard items only when necessary to complete sets.
* **Theme:** Modern Diablo (Dark, Gold, Red).
* **Languages:** English & Turkish.

## **2. Technical Stack**

* **Framework:** React (Vite) + TypeScript.
* **Styling:** Tailwind CSS + `tailwindcss-animate`.
* **UI Components:** Shadcn/ui (Cards, Inputs, Buttons, Accordion).
* **Icons:** Lucide-React.
* **Fonts:** Google Fonts: `Cinzel` (Headers) and `Alegreya Sans` (Body).

## **3. The Data Layer (`constants.ts`)**

**Instruction to Agent:** Create a file named `src/constants.ts` and copy the code below exactly. This contains all game rules and translations.

```typescript
// src/constants.ts

export type BossId = 
  | 'belial' | 'harbinger' | 'andariel' | 'duriel' 
  | 'urivar' | 'zir' | 'beast' | 'grigoire' | 'varshan';

export interface BossData {
  id: BossId;
  nameKey: string;     // Key for translation
  materialKey: string; // Key for translation
  cost: number;
  isJokerCompatible: boolean; // Can use Stygian Stone?
}

export const BOSS_LIST: BossData[] = [
  { 
    id: 'belial', 
    nameKey: 'boss_belial', 
    materialKey: 'mat_husk', 
    cost: 2, 
    isJokerCompatible: false 
  },
  { 
    id: 'harbinger', 
    nameKey: 'boss_harbinger', 
    materialKey: 'mat_abhorrent', 
    cost: 3, 
    isJokerCompatible: true 
  },
  { 
    id: 'andariel', 
    nameKey: 'boss_andariel', 
    materialKey: 'mat_doll', 
    cost: 3, 
    isJokerCompatible: true 
  },
  { 
    id: 'duriel', 
    nameKey: 'boss_duriel', 
    materialKey: 'mat_shard', 
    cost: 3, 
    isJokerCompatible: true 
  },
  { 
    id: 'urivar', 
    nameKey: 'boss_urivar', 
    materialKey: 'mat_mask', 
    cost: 12, 
    isJokerCompatible: false 
  },
  { 
    id: 'zir', 
    nameKey: 'boss_zir', 
    materialKey: 'mat_blood', 
    cost: 12, 
    isJokerCompatible: false 
  },
  { 
    id: 'beast', 
    nameKey: 'boss_beast', 
    materialKey: 'mat_fear', 
    cost: 12, 
    isJokerCompatible: false 
  },
  { 
    id: 'grigoire', 
    nameKey: 'boss_grigoire', 
    materialKey: 'mat_steel', 
    cost: 12, 
    isJokerCompatible: false 
  },
  { 
    id: 'varshan', 
    nameKey: 'boss_varshan', 
    materialKey: 'mat_heart', 
    cost: 12, 
    isJokerCompatible: false 
  },
];

export const TRANSLATIONS = {
  en: {
    app_title: "Horadric Abacus",
    app_subtitle: "Diablo 4 Rota Optimizer",
    lbl_player: "Player",
    lbl_stygian: "Stygian Stone",
    btn_calculate: "Optimize Loot",
    btn_reset: "Reset Forms",
    sec_results: "Optimization Results",
    sec_trades: "Required Trades",
    txt_total_kills: "Total Summons",
    txt_no_trades: "No trades required. Everyone has optimal materials.",
    // Bosses
    boss_belial: "Belial, Lord of Lies",
    boss_harbinger: "Harbinger of Hatred",
    boss_andariel: "Andariel",
    boss_duriel: "Duriel, King of Maggots",
    boss_urivar: "Urivar",
    boss_zir: "Lord Zir",
    boss_beast: "Beast in the Ice",
    boss_grigoire: "Grigoire",
    boss_varshan: "Echo of Varshan",
    // Materials
    mat_husk: "Betrayer's Husk",
    mat_abhorrent: "Abhorrent Heart",
    mat_doll: "Pincushioned Doll",
    mat_shard: "Shard of Agony",
    mat_mask: "Judicator's Mask",
    mat_blood: "Exquisite Blood",
    mat_fear: "Distilled Fear",
    mat_steel: "Living Steel",
    mat_heart: "Malignant Heart",
    mat_stygian: "Stygian Stone"
  },
  tr: {
    app_title: "Horadrim Abaküsü",
    app_subtitle: "Diablo 4 Rota Hesaplayıcı",
    lbl_player: "Oyuncu",
    lbl_stygian: "Stygian Stone",
    btn_calculate: "Ganimeti Optimize Et",
    btn_reset: "Sıfırla",
    sec_results: "Sonuçlar",
    sec_trades: "Gerekli Takaslar",
    txt_total_kills: "Toplam Çağırma",
    txt_no_trades: "Takas gerekmiyor. Herkesin malzemesi uygun.",
    // Bosses
    boss_belial: "Belial, Yalanların Efendisi",
    boss_harbinger: "Nefretin Habercisi",
    boss_andariel: "Andariel",
    boss_duriel: "Duriel, Kurtçukların Kralı",
    boss_urivar: "Urivar",
    boss_zir: "Lord Zir",
    boss_beast: "Buzdaki Canavar",
    boss_grigoire: "Grigoire, Galvanik Aziz",
    boss_varshan: "Varshan'ın Yankısı",
    // Materials
    mat_husk: "Hainin Kabuğu",
    mat_abhorrent: "İğrenç Kalp",
    mat_doll: "İğneli Bebek",
    mat_shard: "Izdırap Parçası",
    mat_mask: "Yargıcın Maskesi",
    mat_blood: "Enfes Kan",
    mat_fear: "Damıtılmış Korku",
    mat_steel: "Canlı Çelik",
    mat_heart: "Habis Kalp",
    mat_stygian: "Stygian Stone"
  }
};

```

## **4. Core Logic & Algorithm (The Brain)**

### **Step 1: Input Handling**

* Create a state object that holds inventory for 4 Players.
* Structure: `inventory[playerId][materialKey] = amount`.
* Include a separate field for `Stygian Stone` count for each player.

### **Step 2: The "Joker" Optimization Logic**

When the user clicks **Optimize**, execute this sequence:

1. **Global Pooling:** Calculate the `Total` of every item across all 4 players.
2. **Standard Bosses (Non-Joker):**
* `TotalSummons = Math.floor(TotalSpecificItem / Cost)`.
* *Example:* 50 Living Steel / 12 Cost = 4 Grigoire Summons (2 left over).


3. **Joker Bosses (Harbinger, Andariel, Duriel):**
* **Phase A (Base):** Calculate summons using *only* the specific item (Heart/Doll/Shard).
* **Phase B (Gap Filling):** Calculate the remainder needed to complete one more set.
* *Example:* We have 2 Shards left (Need 3). Gap is 1.
* If `GlobalStygian >= 1`, use 1 Stygian + 2 Shards -> +1 Summon. Deduct 1 Stygian.


* **Phase C (Pure Stygian Sets):**
* If Stygians still remain, create full "Mixed Sets" (e.g., 2 Specific + 1 Stygian, or 1 Specific + 2 Stygian).
* *Priority Rule:* Distribute remaining Stygians to balance the total kill counts between the 3 Joker bosses, or default to Duriel if counts are equal.





### **Step 3: Trade Calculation**

* Determine the **Target State**: Each player should ideally hold enough mats to summon `TotalSummons / 4`.
* Since items don't split evenly, assign "Summoning Duties":
* *Example:* If we have 5 Duriel Summons. Player 1 does 2, Player 2 does 1, P3 does 1, P4 does 1.


* **Generate Moves:**
* Compare `CurrentInventory` vs `TargetInventory` for the assigned duty.
* If P1 has 0 Shards but needs to summon 2 times (Cost 6): Generate trade `Someone -> P1: 6 Shards`.



## **5. UI/UX Design System**

### **Theme: Sanctuary Dark**

* **Background:** Use a dark noise texture or radial gradient `#0c0a09` (Warm Black).
* **Borders:** All containers must have `border` with color `#78350f` (Bronze/Brown).
* **Inputs:**
* Background: `#000000` (Pure Black) with `opacity-50`.
* Text: `#e7e5e4` (Stone 200).
* Focus: Ring color `#b91c1c` (Red 700).


* **Typography:**
* Headings: `Cinzel` (Gold color `#fcd34d`).
* Body: `Alegreya Sans` (Grey color `#a8a29e`).



### **Layout Structure**

1. **Header:** Title centered, Language Toggle (EN/TR) on the top right.
2. **Main Grid:**
* **Left Column:** Material Icons (use colored squares or Lucide placeholders for now) + Names.
* **Columns 2-5:** Inputs for Player 1, 2, 3, 4.
* **Row Highlight:** Make the "Stygian Stone" row glow purple or have a distinct border to show it's special.


3. **Footer Action:** Large "OPTIMIZE" button.
* Style: `bg-red-900` hover `bg-red-800`, text uppercase, tracking widely.


4. **Results Section (Appears after click):**
* **Summary Card:** Grid showing "Boss Name: X Summons".
* **Trade List:** A clear step-by-step list.
* *Format:* `[Player 1] gives [3 Shards] to [Player 2]`.





## **6. Action Plan for the Agent**

1. Initialize project with `npm create vite@latest`.
2. Install Tailwind & Shadcn.
3. Create `constants.ts` with the provided code.
4. Build `components/RotaCalculator.tsx` implementing the logic.
5. Style `App.tsx` with the Sanctuary Dark theme.