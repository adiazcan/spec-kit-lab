# 🧙‍♂️ A Text-Based Adventure Game

The quest that awaits holds **three grand challenges**, worthy of bards and future chronicles.

You may use **GitHub Copilot** throughout all challenges to aid you in your journey.

Between each challenge, there will be time for spirits to rest and minds to prepare.

---

## 🎲 Rules

---

## 🏰 First Challenge

### The Library at the End of the World

You must forge a **REST API** using the grimoire known as **Swagger (OpenAPI)**, in its version **3.0.1**.  
This will serve as the **backend** for your adventure.

The spell may be written in any of the following languages of power:

- **C#**
- **TypeScript**

High regard will be given to those who demonstrate diligence in the following virtues:

- Enabling a **simple text-based adventure**
- Attending to **security aspects**
- Clarity in the **scrolls** (API documentation)
- Observance of **best practices** in API development

---

### 🔧 Minimum Functionality

- **Initialize an adventure**
- **Character management**
  - Creation / editing / retrieval
  - Attributes: STR (Strength) / DEX (Dexterity) / INT (Intelligence) / CON (Constitution) / CHA (Charisma)
    - These core attributes define a character's capabilities and influence various gameplay mechanics
  - Calculated modifiers
  - Snapshots and versioning
- **Dice system**
  - Support for expressions like `2d6`
- **Basic turn-based combat**
  - NPCs / enemies
  - Simple states: aggressive / defensive / flee
  - Turn resolution using the dice engine
- **Inventory**
  - Stackable or equippable items
  - Loot tables
- **Multi-stage quests**
  - Progress tracking
  - Success / failure conditions
  - World state persistence
- **Tests and documentation**
  - Unit tests for:
    - Dice engine
    - Modifier calculation
    - Scene engine
  - Minimum resource documentation

---

## 🗣️ Second Challenge

### The Voice of the Narrator

Once the REST API has been forged and ignited, it's time to practice the arts of its invocation.

You must build a **frontend**, with the technology your knowledge dictates, that allows:

- Calling the REST API
- Embarking on a **text-based adventure**, as if it were an interactive scroll

It need not be complex nor visually impressive.  
It suffices that it fulfills its purpose with nobility.

Special consideration will be given to:

- Attention to **security**
- Clarity in the **scrolls** (code documentation)

---

## ☁️ Third Challenge

### The Plan of the Realm

You must invoke the arcane art of **Infrastructure as Code**, employing the secret known as **Terraform**.

Your task will be to deploy resources in the cloud realm of **Azure**, following the dictates of:

- Modules
- States
- Declarations

It need not be complex nor visually impressive.  
It suffices that it fulfills its purpose with nobility.

Special regard will be given to codices that demonstrate mastery in:

- 🔐 Deployment security
- 📜 Clear documentation
- 🛠️ Fidelity to best practices of the craft

---

## 📜 The Sacred Scrolls

When you are ready to embark upon your quest, seek the **ancient tomes** that hold the wisdom of each trial.

Within these scrolls lie the secrets, incantations, and guidance you shall need to conquer each challenge and emerge victorious.

**[⚔️ Enter the Hall of Knowledge](labs/README.md)** — _May your code be swift and your bugs be few._
