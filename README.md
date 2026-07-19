# FANSPHERE: GenAI-Powered Real-Time Stadium Intelligence System for FIFA 2026

**FANSPHERE** is a state-of-the-art, high-fidelity operations and fan assistance prototype designed for large-scale sporting events like the FIFA World Cup 2026. The system combines real-time crowd density simulations, step-free accessibility routing (Dijkstra's algorithm), and a localized Retrieval-Augmented Generation (RAG) Chatbot to provide immediate decision support for organizers and step-by-step guidance for fans.

---

## 🚀 Key Features

### 👤 For Fans
- **Interactive SVG Heatmap Map:** Displays live crowd density across gates, security checks, concessions, restrooms, and seat sections. Hovering over a section displays detailed stats (e.g. wait times, wheelchair availability).
- **Intelligent Navigation:** Calculates the shortest path between any two locations in the stadium. Includes a **Wheelchair-Accessible Route** toggle that automatically bypasses stairs/escalators in favor of ramps and elevators.
- **Multilingual RAG Chat Assistant:** An AI assistant that answers stadium queries in English, Spanish, Hindi, French, and Portuguese. It dynamically binds to the map (e.g., asking "How do I get to Seat C1 from Gate 1?" automatically calculates the route and overlays the path on the map).

### 🧑‍💼 For Staff & Organizers
- **Live Crowd Simulation Control:** Speed and density fluctuation controls with options to manually trigger simulated crowd spikes or safety incidents.
- **GenAI Real-Time Operations Summary:** Auto-generates a synthesized status report detailing average stadium density, high-congestion sectors, and active safety alerts.
- **GenAI Decision Support Recommendations:** Recommends action items (e.g. redirecting transit, dispatching stewards, or pushing concession discounts to disperse crowds) with quick-action buttons to resolve issues.
- **Active Incident Center:** A live tracker for safety alerts and structural issues, allowing stewards to review and resolve incidents in real time.
- **Sustainability & Transit Analytics:** Live monitoring of smart bin capacity, solar energy output, water consumption, carbon offset progress, and real-time transit wait times (Metro, Shuttle, Taxi).

---

## 🏗️ System Architecture

```mermaid
graph TD
    UI[Frontend Dashboard: index.html] --> Map[Interactive SVG Stadium Map]
    UI --> Chat[Multilingual Chat Assistant]
    UI --> Admin[Organizer Analytics & Incidents]
    
    subgraph Core Algorithms (JavaScript / ES6 Modules)
        Pathfinder[Dijkstra Navigation Engine]
        RAG[TF-IDF & Jaccard Similarity Search]
        Sim[Crowd & Transit Fluctuation Simulator]
        Sustain[Sustainability Metrics Engine]
    end
    
    Map -.-> Pathfinder
    Chat --> RAG
    Admin --> Sim
    Admin --> Sustain
    
    subgraph Data Layer
        DB[stadiumData.js: Layout Graph, FAQ DB, Translations, Transit & Sustainability Data]
    end
    
    Pathfinder --> DB
    RAG --> DB
    Sustain --> DB
```

---

## 🛠️ Core Algorithms Under the Hood

### 1. Accessibility-Aware Pathfinding (Dijkstra)
The navigation engine is built on an undirected graph representation of the stadium concourse, gates, and seats:
- Nodes contain metadata regarding coordinates `(x, y)` and a boolean flag `wheelchair` indicating accessibility.
- Edges connect nodes and carry weights representing spatial distance.
- When **Wheelchair-Accessible Route** is enabled, the pathfinder filters out all nodes and edges where `wheelchair === false` (e.g., stairs and escalators) and computes the optimal path using Dijkstra's algorithm.

### 2. Localized Retrieval-Augmented Generation (RAG)
To enable fast, zero-dependency natural language answers, the chatbot implements a lightweight vector-similarity search:
- The **stadium FAQ/layout knowledge base** is indexed locally.
- When a user submits a question, the query is normalized (lowercased, punctuation removed) and tokenized.
- The engine computes overlap and relevance scores using a Jaccard-like similarity index and keyword intersections.
- The highest scoring document is retrieved as "retrieved context", and a template-based GenAI response generator refines the answer into the selected language (English, Spanish, Hindi, French, Portuguese), appending clear source citations.

### 3. Sustainability & Transit Simulation
The system simulates real-time environmental and transit metrics:
- **Smart Bin Capacity:** Gradually increases over time, with recycling contributions reducing fill rate.
- **Solar Energy Output:** Fluctuates with simulated weather/cloud cover conditions.
- **Water Consumption:** Tracks cumulative usage during the event.
- **Carbon Offset:** Accumulates from solar energy generation and recycling activity.
- **Transit Wait Times:** Metro, shuttle bus, and taxi zone wait times fluctuate based on crowd density patterns.

---

## 🖥️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Markup** | HTML5 Semantic Elements |
| **Styling** | Tailwind CSS v3 (CDN) + Custom CSS |
| **Typography** | Google Fonts (Inter, Outfit) |
| **Icons** | Lucide Icons |
| **Logic** | Vanilla JavaScript (ES6 Modules) |
| **Dev Server** | Vite 5.x |
| **Visualization** | SVG (Interactive Heatmap & Pathfinding) |

---

## ⚙️ Running Locally

### Option A: Vite Dev Server (Recommended)

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Then open your browser to [http://localhost:3000](http://localhost:3000).

### Option B: Python HTTP Server

```bash
python3 -m http.server 8000
```

Then navigate to [http://localhost:8000](http://localhost:8000).

### Option C: Open File Directly

If your browser allows local ES6 modules (e.g., using `--allow-file-access-from-files` flags), you can double-click and run `index.html` directly from your file explorer.

---

## 📁 Project Structure

```
STADIUM/
├── index.html              # Main application (single-page app)
├── css/
│   └── styles.css          # Extracted & enhanced stylesheet
├── js/
│   ├── stadiumData.js      # Stadium graph, RAG knowledge base, translations, sustainability & transit data
│   └── stadiumAlgorithms.js # Dijkstra pathfinding, RAG search, AI response generation, sustainability simulation
├── favicon.svg             # SVG favicon
├── package.json            # Project config (Vite dev server)
├── vite.config.js          # Vite configuration
└── README.md               # This file
```
