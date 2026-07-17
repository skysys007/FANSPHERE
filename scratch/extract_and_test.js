const fs = require('fs');

const html = fs.readFileSync('/home/skysys/Desktop/Repositories/FAN SPHERE/index.html', 'utf8');

// Use a simple regex to extract the script tag content
const scriptMatch = html.match(/<script>(.*?)<\/script>/s);
if (scriptMatch) {
  let script = scriptMatch[1];
  
  // mock browser stuff
  script = `
    const document = {
      getElementById: (id) => ({
        getContext: () => ({
          translate: () => {}, rotate: () => {}, scale: () => {}, restore: () => {}, save: () => {},
          beginPath: () => {}, moveTo: () => {}, lineTo: () => {}, quadraticCurveTo: () => {},
          closePath: () => {}, fill: () => {}, stroke: () => {}, arc: () => {},
          fillText: () => {}, measureText: () => ({width: 10}), clearRect: () => {},
          setLineDash: () => {}
        }),
        addEventListener: () => {},
        classList: { toggle: () => {}, add: () => {}, remove: () => {}, contains: () => false },
        options: { length: 0 },
        add: () => {},
        value: 'sec-101'
      }),
      querySelectorAll: () => []
    };
    const window = {
      innerWidth: 1000, innerHeight: 1000,
      devicePixelRatio: 1,
      requestAnimationFrame: (cb) => cb(),
      addEventListener: () => {},
      lucide: { createIcons: () => {} }
    };
    const requestAnimationFrame = window.requestAnimationFrame;
    const setInterval = () => {};
    const setTimeout = (cb) => cb();
    
    class Option { constructor() {} }
    
    // inject stadium sim mock
    class StadiumSimulation { 
      constructor() { this.sections = new Map(); this.suites = new Map(); this.entryGates = new Map(); this.exitGates = new Map(); }
      addEntryGate() {} addExitGate() {} addSection() {} addSuite() {} setPhase() {} start() {}
    }
    window.StadiumSimulation = StadiumSimulation;

    ${script}
    
    // trigger populate
    populateNavDropdowns();
    
    // test route
    console.log("Testing calculateRoute('gate-amex', 'sec-101')");
    calculateRoute('gate-amex', 'sec-101');
    console.log("activeRoute:", activeRoute);
    
    // test render
    console.log("Testing renderStadium");
    renderStadium();
    console.log("Render completed");
  `;
  
  fs.writeFileSync('/home/skysys/Desktop/Repositories/FAN SPHERE/scratch/test_route_run.js', script);
}
