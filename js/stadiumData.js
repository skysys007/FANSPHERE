// SmartStadium AI - Stadium Data and Knowledge Base



// RAG (Retrieval-Augmented Generation) Knowledge Base
const RAG_DATABASE = [
  {
    id: "layout_gate1",
    category: "Layout",
    title: "Gate 1 Location & Accessibility",
    content: "Gate 1 is located on the North side of the stadium. It is adjacent to Parking Lot A and the Taxi Drop-off zone. This gate is fully equipped with wheelchair-accessible ramps, elevators, and dedicated wide gates for disabled access.",
    keywords: ["gate 1", "north gate", "parking a", "taxi", "wheelchair", "ramp"]
  },
  {
    id: "layout_gate2",
    category: "Layout",
    title: "Gate 2 East Gate Details",
    content: "Gate 2 is on the East side of the stadium, closest to the Metro Station Subway Line 1. It experiences high crowd density during peak hours (1-2 hours before kickoff). Staff suggest utilizing Gate 1 or Gate 3 if Gate 2 queues exceed 20 minutes.",
    keywords: ["gate 2", "east gate", "metro", "subway", "congestion", "delay", "queue"]
  },
  {
    id: "layout_gate3",
    category: "Layout",
    title: "Gate 3 South Gate & Buses",
    content: "Gate 3 is on the South side. It is the primary terminal for shuttle buses connecting to downtown hotels. It features wheelchair accessibility and a fast-track security lane for families.",
    keywords: ["gate 3", "south gate", "bus", "shuttle", "wheelchair", "family"]
  },
  {
    id: "layout_gate4",
    category: "Layout",
    title: "Gate 4 West Gate & VIP Entry",
    content: "Gate 4 is on the West side of the stadium. It is dedicated to Media and VIP ticket holders. General admission is allowed but priority is given to credentials.",
    keywords: ["gate 4", "west gate", "vip", "media", "credentials", "press"]
  },
  {
    id: "amenity_restroom",
    category: "Amenities",
    title: "Restrooms & Accessibility",
    content: "Restroom North is a state-of-the-art all-gender, fully wheelchair-accessible restroom. It includes baby changing tables and emergency help chords. Restroom South is standard male/female facilities, but has support rails. Hand washing stations are touchless.",
    keywords: ["restroom", "toilet", "washroom", "accessible", "wheelchair", "diaper", "baby"]
  },
  {
    id: "amenity_food",
    category: "Sustainability",
    title: "EcoEats Concession & Sustainability",
    content: "EcoEats is our flagship sustainability food court located at the North Concourse. It serves 100% plant-based food in compostable packaging. Fans receive a 15% discount when returning cup containers to automated recycling bins nearby. Menu features vegan burgers, tacos, and organic local fruit bowls.",
    keywords: ["food", "concession", "eat", "drink", "sustainability", "eco", "vegan", "plant-based", "discount", "recycle"]
  },
  {
    id: "safety_firstaid",
    category: "Safety",
    title: "First Aid Station",
    content: "The First Aid Station is located in the central concourse ring next to the main stadium administrative office. It is staffed 24/7 during matches with certified paramedics and has direct ambulance runway access. Call 911 or alert nearest steward in case of a medical emergency.",
    keywords: ["first aid", "doctor", "medical", "nurse", "paramedic", "injury", "sick", "emergency"]
  },
  {
    id: "match_schedule",
    category: "Match",
    title: "FIFA 2026 Match Schedule & Timing",
    content: "Kickoff is scheduled for 8:00 PM local time. Outer gates open at 5:00 PM. Fans are strongly encouraged to arrive before 6:30 PM to complete security screening and enjoy the pre-match light show. Closing ceremonies start 15 minutes after final whistle.",
    keywords: ["match", "schedule", "kickoff", "time", "gate open", "ceremony", "game", "start"]
  },
  {
    id: "transport_metro",
    category: "Transportation",
    title: "Metro Subway Schedules",
    content: "Subway Line 1 runs directly to 'Stadium East Station' near Gate 2. Trains run every 3 minutes starting 3 hours before kickoff, and will run every 2 minutes for 2 hours post-match. Public transport tickets are free when bundled with a valid match day FIFA ticket.",
    keywords: ["subway", "metro", "train", "ticket", "free", "schedule", "station"]
  },
  {
    id: "accessibility_routes",
    category: "Accessibility",
    title: "Wheelchair & Disabled Guidance",
    content: "SmartStadium provides voice-guided navigation for visually impaired fans and step-free routing for wheelchair users. To use wheelchair-friendly routing, enable the wheelchair icon on the navigation panel. Accessible elevators are located at the North and South Concourse sectors.",
    keywords: ["wheelchair", "disabled", "accessible", "blind", "voice guide", "step-free", "ramp", "elevator"]
  }
];

// BUNDESLIGA_ATTENDANCE_DATA removed per user request.

// Sustainability Metrics Baseline Data
const SUSTAINABILITY_METRICS = {
  smartBins: {
    label: "Smart Bin Recyclables",
    baseline: 42,
    unit: "%",
    warningThreshold: 75,
    criticalThreshold: 90,
    icon: "recycle"
  },
  solarGrid: {
    label: "Solar Energy Output",
    baseline: 68,
    unit: "kW",
    max: 150,
    icon: "sun"
  },
  waterUsage: {
    label: "Water Consumption",
    baseline: 35,
    unit: "kL",
    max: 100,
    warningThreshold: 70,
    icon: "droplets"
  },
  carbonOffset: {
    label: "Carbon Offset",
    baseline: 2.4,
    unit: "tons CO₂",
    target: 5.0,
    icon: "leaf"
  }
};

// Transit Schedule Data
const TRANSIT_SCHEDULE = {
  subway: {
    name: "Metro Line 1",
    gate: "Gate 2 (East)",
    frequencyPreMatch: 3,   // minutes
    frequencyPostMatch: 2,  // minutes
    frequencyNormal: 8,     // minutes
    currentWait: 4,         // live simulated wait in minutes
    capacity: 1200,
    status: "running"
  },
  shuttle: {
    name: "Hotel Shuttle Bus",
    gate: "Gate 3 (South)",
    frequencyPreMatch: 10,
    frequencyPostMatch: 5,
    frequencyNormal: 20,
    currentWait: 12,
    capacity: 55,
    status: "running"
  },
  taxi: {
    name: "Taxi Drop-off Zone",
    gate: "Gate 1 (North)",
    avgWait: 6,
    status: "available"
  }
};

// Dietary-Aware Food Stalls (Real-world data mapped to stadium)
const FOOD_STALLS = [
  {
    id: "fs_shahs_halal",
    name: "Shah's Halal",
    section: "node-126",
    category: "Halal",
    tags: ["halal", "dairy-free", "nut-free"],
    waitTimeMin: 8,
    description: "Halal Chicken, Beef, and Falafel Gyros and Platters."
  },
  {
    id: "fs_kosher_grill",
    name: "Kosher Stand",
    section: "node-123",
    category: "Kosher",
    tags: ["kosher", "dairy-free", "nut-free"],
    waitTimeMin: 5,
    description: "Kosher Hot Dogs, Pretzels, Chicken Nuggets, and Knish."
  },
  {
    id: "fs_petite_greens",
    name: "Petite Greens",
    section: "node-144",
    category: "Healthy/Salads",
    tags: ["vegetarian", "gluten-free", "vegan"],
    waitTimeMin: 4,
    description: "Chop Salad, Veggie Wraps, Quinoa Bowls, and Fruit Cups. Gluten Free options available."
  },
  {
    id: "fs_tacos_raqueros",
    name: "Taco’s Raqueros",
    section: "node-217",
    category: "Mexican",
    tags: ["vegetarian"],
    waitTimeMin: 12,
    description: "Tacos, Burritos (Chicken, Beef, Pork, Veggie), Rice & Beans, Loaded Nachos."
  },
  {
    id: "fs_pattys_burger",
    name: "Patty's Burger",
    section: "node-106",
    category: "Grill",
    tags: ["gluten-free", "nut-free"],
    waitTimeMin: 15,
    description: "Classic Burgers, Chicken Tender Basket, and Hot Dogs. Gluten Free Buns available upon request."
  },
  {
    id: "fs_boardwalk_fryer",
    name: "Boardwalk Fryer",
    section: "node-135",
    category: "Traditional",
    tags: ["nut-free"],
    waitTimeMin: 10,
    description: "Chicken Tender Basket, Fried Clams, Thumann’s Hot Dogs, Fries, Cheese Fries."
  },
  {
    id: "fs_fuku_chicken",
    name: "Fuku Chicken Sando",
    section: "node-330",
    category: "Chicken",
    tags: ["nut-free"],
    waitTimeMin: 18,
    description: "Fuku Spicy Chicken Sando, Fuku Fingers & Fries."
  },
  {
    id: "fs_nonna_fusco",
    name: "Nonna Fusco’s Kitchen",
    section: "node-118",
    category: "Italian",
    tags: ["nut-free"],
    waitTimeMin: 14,
    description: "Meatball Sandwich, Chicken Cutlet Sandwich, Fresh Pasta Options, and Zeppoles."
  },
  {
    id: "fs_mr_tot",
    name: "Mr. Tot",
    section: "node-339",
    category: "Snacks",
    tags: ["vegetarian", "nut-free"],
    waitTimeMin: 6,
    description: "Loaded Tots, Burnt Ends Chili Tots. Vegetarian options available."
  },
  {
    id: "fs_mrs_fields",
    name: "Mrs. Fields",
    section: "node-103",
    category: "Dessert",
    tags: ["vegetarian"],
    waitTimeMin: 3,
    description: "Freshly baked Cookies and Brownies."
  },
  {
    id: "fs_fresh_fruit",
    name: "Fresh Fruit Grab & Go",
    section: "node-116",
    category: "Snacks",
    tags: ["vegan", "vegetarian", "gluten-free", "dairy-free", "kosher", "halal"],
    waitTimeMin: 1,
    description: "Fresh fruit cups and light snacks."
  },
  {
    id: "fs_premio_sausage",
    name: "Premio Sausage",
    section: "node-215",
    category: "Grill",
    tags: ["gluten-free"],
    waitTimeMin: 9,
    description: "Premio Sausage Sandwich. Gluten Free buns available."
  }
];

// Multilingual translations database
const TRANSLATIONS = {
  en: {
    title: "SmartStadium AI • FIFA 2026",
    subtitle: "GenAI-Powered Real-Time Stadium Intelligence System",
    fanView: "Fan Guide",
    staffView: "Organizer Dashboard",
    gate: "Gate",
    security: "Security",
    restroom: "Restroom",
    concession: "EcoEats Food",
    section: "Section",
    seat: "Seat",
    findRoute: "Find Navigation Route",
    startLoc: "Select Starting Location",
    endLoc: "Select Destination",
    wheelchairFriendly: "Wheelchair-Accessible Route",
    calculateRoute: "Calculate Shortest Path",
    routeDetails: "Route Navigation Path",
    chatPlaceholder: "Ask SmartStadium AI... (e.g., 'Where is EcoEats?', 'How to reach Section A1?')",
    chatbotTitle: "SmartStadium AI Chatbot",
    send: "Send",
    language: "Language"
  },
  es: {
    title: "SmartStadium AI • FIFA 2026",
    subtitle: "Sistema de Inteligencia en Tiempo Real con IA Generativa",
    fanView: "Guía del Fan",
    staffView: "Panel del Organizador",
    gate: "Puerta",
    security: "Seguridad",
    restroom: "Baños",
    concession: "Comida EcoEats",
    section: "Sección",
    seat: "Asiento",
    findRoute: "Buscar Ruta de Navegación",
    startLoc: "Seleccione Ubicación Inicial",
    endLoc: "Seleccione Destino",
    wheelchairFriendly: "Ruta Accesible para Silla de Ruedas",
    calculateRoute: "Calcular Ruta Más Corta",
    routeDetails: "Detalles de la Ruta",
    chatPlaceholder: "Pregunte a SmartStadium AI... (ej. '¿Dónde está EcoEats?', '¿Cómo llego a la A1?')",
    chatbotTitle: "Asistente Virtual SmartStadium",
    send: "Enviar",
    language: "Idioma"
  },
  hi: {
    title: "स्मार्टस्टेडियम एआई • फीफा 2026",
    subtitle: "जेनएआई-संचालित रीयल-टाइम स्टेडियम इंटेलिजेंस सिस्टम",
    fanView: "प्रशंसक गाइड",
    staffView: "आयोजक डैशबोर्ड",
    gate: "गेट",
    security: "सुरक्षा",
    restroom: "शौचालय",
    concession: "इकोईट्स भोजन",
    section: "सेक्शन",
    seat: "सीट",
    findRoute: "मार्ग खोजें",
    startLoc: "शुरुआती स्थान चुनें",
    endLoc: "गंतव्य स्थान चुनें",
    wheelchairFriendly: "व्हीलचेयर अनुकूल मार्ग",
    calculateRoute: "सबसे छोटा मार्ग खोजें",
    routeDetails: "मार्ग का विवरण",
    chatPlaceholder: "स्मार्टस्टेडियम एआई से पूछें... (उदा., 'इकोईट्स कहाँ है?')",
    chatbotTitle: "स्मार्टस्टेडियम एआई चैटबॉट",
    send: "भेजें",
    language: "भाषा"
  },
  fr: {
    title: "SmartStadium AI • FIFA 2026",
    subtitle: "Système d'Intelligence de Stade en Temps Réel GenAI",
    fanView: "Guide des Supporters",
    staffView: "Tableau de Bord Organisateur",
    gate: "Porte",
    security: "Sécurité",
    restroom: "Toilettes",
    concession: "Nourriture EcoEats",
    section: "Section",
    seat: "Siège",
    findRoute: "Trouver l'Itinéraire",
    startLoc: "Sélectionner le Départ",
    endLoc: "Sélectionner la Destination",
    wheelchairFriendly: "Itinéraire Accessible aux Fauteuils",
    calculateRoute: "Calculer le Chemin le Plus Court",
    routeDetails: "Détails de l'Itinéraire",
    chatPlaceholder: "Demander à SmartStadium AI... (ex. 'Où sont les toilettes?')",
    chatbotTitle: "Assistant Virtuel SmartStadium",
    send: "Envoyer",
    language: "Langue"
  },
  pt: {
    title: "SmartStadium AI • FIFA 2026",
    subtitle: "Sistema de Inteligência Esportiva com IA Generativa",
    fanView: "Guia do Torcedor",
    staffView: "Painel do Organizador",
    gate: "Portão",
    security: "Segurança",
    restroom: "Banheiro",
    concession: "Comida EcoEats",
    section: "Setor",
    seat: "Assento",
    findRoute: "Encontrar Rota",
    startLoc: "Selecione o Início",
    endLoc: "Selecione o Destino",
    wheelchairFriendly: "Rota Acessível para Cadeirantes",
    calculateRoute: "Calcular Rota Mais Curta",
    routeDetails: "Detalhes do Trajeto",
    chatPlaceholder: "Pergunte ao SmartStadium AI... (ex. 'Como chego ao Setor A1?')",
    chatbotTitle: "Assistente SmartStadium AI",
    send: "Enviar",
    language: "Idioma"
  }
};
