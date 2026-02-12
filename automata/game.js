/* ============================================
   AUTOMATA - Resource Management & Automation Game
   Complete Game Engine
   ============================================ */

// ==================== UTILITY FUNCTIONS ====================

/** Format large numbers with suffixes */
function formatNumber(n, decimals = 1) {
    if (n === undefined || n === null || isNaN(n)) return '0';
    const notation = Game.settings.notation || 'suffix';
    if (notation === 'plain') return Math.floor(n).toLocaleString();
    if (notation === 'scientific' && Math.abs(n) >= 1000) {
        return n.toExponential(2);
    }
    const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
    if (Math.abs(n) < 1000) return Math.floor(n * 10) / 10 + '';
    let tier = Math.floor(Math.log10(Math.abs(n)) / 3);
    if (tier >= suffixes.length) tier = suffixes.length - 1;
    const scaled = n / Math.pow(10, tier * 3);
    return scaled.toFixed(decimals) + suffixes[tier];
}

/** Format time duration */
function formatTime(seconds) {
    if (seconds < 60) return Math.floor(seconds) + 's';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ' + Math.floor(seconds % 60) + 's';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ' + Math.floor((seconds % 3600) / 60) + 'm';
    return Math.floor(seconds / 86400) + 'd ' + Math.floor((seconds % 86400) / 3600) + 'h';
}

/** Format rate per second */
function formatRate(n) {
    if (n === 0) return '+0/s';
    const sign = n >= 0 ? '+' : '';
    return sign + formatNumber(n, 2) + '/s';
}

// ==================== GAME DATA DEFINITIONS ====================

const RESOURCE_DEFS = {
    // Tier 1 - Raw
    energy:    { name: 'Energy',         icon: '⚡', tier: 1, baseCap: 100, sellPrice: 1 },
    minerals:  { name: 'Minerals',       icon: '💎', tier: 1, baseCap: 100, sellPrice: 1 },
    data:      { name: 'Data Fragments',  icon: '📊', tier: 1, baseCap: 100, sellPrice: 1 },
    // Tier 2 - Processed
    circuits:     { name: 'Circuits',      icon: '🔌', tier: 2, baseCap: 50, sellPrice: 5 },
    alloys:       { name: 'Alloys',        icon: '🔩', tier: 2, baseCap: 50, sellPrice: 5 },
    codeModules:  { name: 'Code Modules',  icon: '💻', tier: 2, baseCap: 50, sellPrice: 5 },
    // Tier 3 - Advanced
    aiCores:      { name: 'AI Cores',      icon: '🧠', tier: 3, baseCap: 25, sellPrice: 50 },
    quantumCells: { name: 'Quantum Cells', icon: '⚛️', tier: 3, baseCap: 25, sellPrice: 50 },
    nanofibers:   { name: 'Nanofibers',    icon: '🧬', tier: 3, baseCap: 25, sellPrice: 50 },
    // Tier 4 - Ultimate (prestige)
    singularityShards: { name: 'Singularity Shards', icon: '✨', tier: 4, baseCap: Infinity, sellPrice: 0 },
    // Currency
    credits: { name: 'Credits', icon: '🪙', tier: 0, baseCap: Infinity, sellPrice: 0 },
};

const BUILDING_DEFS = {
    // === EXTRACTORS ===
    energyDrill: {
        name: 'Energy Drill', icon: '⛏️⚡', category: 'extractors',
        desc: 'Automatically extracts energy from the environment.',
        baseCost: { energy: 10, minerals: 5 }, costScale: 1.15,
        production: { energy: 1 }, consumption: {},
        powerUse: 0, powerGen: 0,
        unlockReq: null,
    },
    mineralMiner: {
        name: 'Mineral Miner', icon: '⛏️💎', category: 'extractors',
        desc: 'Mines minerals from underground deposits.',
        baseCost: { minerals: 15, energy: 5 }, costScale: 1.15,
        production: { minerals: 1 }, consumption: {},
        powerUse: 0, powerGen: 0,
        unlockReq: null,
    },
    dataScanner: {
        name: 'Data Scanner', icon: '📡', category: 'extractors',
        desc: 'Scans the environment for data fragments.',
        baseCost: { data: 10, energy: 10 }, costScale: 1.15,
        production: { data: 1 }, consumption: {},
        powerUse: 0, powerGen: 0,
        unlockReq: null,
    },
    // === PROCESSORS ===
    circuitFoundry: {
        name: 'Circuit Foundry', icon: '🏭🔌', category: 'processors',
        desc: 'Converts energy and minerals into circuits.',
        baseCost: { energy: 50, minerals: 50, data: 25 }, costScale: 1.2,
        production: { circuits: 0.5 }, consumption: { energy: 2, minerals: 1 },
        powerUse: 5, powerGen: 0,
        unlockReq: { research: 'basicProcessing' },
    },
    alloySmelter: {
        name: 'Alloy Smelter', icon: '🏭🔩', category: 'processors',
        desc: 'Smelts minerals into high-grade alloys.',
        baseCost: { minerals: 75, energy: 40, data: 20 }, costScale: 1.2,
        production: { alloys: 0.5 }, consumption: { minerals: 2, energy: 1 },
        powerUse: 5, powerGen: 0,
        unlockReq: { research: 'basicProcessing' },
    },
    codeCompiler: {
        name: 'Code Compiler', icon: '🏭💻', category: 'processors',
        desc: 'Compiles data fragments into code modules.',
        baseCost: { data: 75, energy: 40, minerals: 20 }, costScale: 1.2,
        production: { codeModules: 0.5 }, consumption: { data: 2, energy: 1 },
        powerUse: 5, powerGen: 0,
        unlockReq: { research: 'basicProcessing' },
    },
    // === FACTORIES ===
    aiLab: {
        name: 'AI Lab', icon: '🧠🔬', category: 'factories',
        desc: 'Synthesizes AI Cores from circuits and code modules.',
        baseCost: { circuits: 20, codeModules: 20, alloys: 10, credits: 100 }, costScale: 1.3,
        production: { aiCores: 0.1 }, consumption: { circuits: 1, codeModules: 1 },
        powerUse: 15, powerGen: 0,
        unlockReq: { research: 'advancedManufacturing' },
    },
    quantumReactor: {
        name: 'Quantum Reactor', icon: '⚛️🔬', category: 'factories',
        desc: 'Generates quantum cells from energy and circuits.',
        baseCost: { circuits: 25, alloys: 15, energy: 200, credits: 100 }, costScale: 1.3,
        production: { quantumCells: 0.1 }, consumption: { circuits: 1, energy: 5 },
        powerUse: 20, powerGen: 0,
        unlockReq: { research: 'advancedManufacturing' },
    },
    nanoAssembler: {
        name: 'Nano Assembler', icon: '🧬🔬', category: 'factories',
        desc: 'Assembles nanofibers from alloys and code modules.',
        baseCost: { alloys: 25, codeModules: 15, minerals: 200, credits: 100 }, costScale: 1.3,
        production: { nanofibers: 0.1 }, consumption: { alloys: 1, codeModules: 0.5 },
        powerUse: 15, powerGen: 0,
        unlockReq: { research: 'advancedManufacturing' },
    },
    // === STORAGE ===
    battery: {
        name: 'Battery Bank', icon: '🔋', category: 'storage',
        desc: 'Increases energy storage capacity by 100.',
        baseCost: { minerals: 20, energy: 10 }, costScale: 1.2,
        production: {}, consumption: {},
        powerUse: 0, powerGen: 0,
        storageBonus: { energy: 100 },
        unlockReq: null,
    },
    warehouse: {
        name: 'Warehouse', icon: '📦', category: 'storage',
        desc: 'Increases mineral storage capacity by 100.',
        baseCost: { minerals: 30, energy: 10 }, costScale: 1.2,
        production: {}, consumption: {},
        powerUse: 0, powerGen: 0,
        storageBonus: { minerals: 100 },
        unlockReq: null,
    },
    dataBank: {
        name: 'Data Bank', icon: '💾', category: 'storage',
        desc: 'Increases data storage capacity by 100.',
        baseCost: { data: 20, energy: 15 }, costScale: 1.2,
        production: {}, consumption: {},
        powerUse: 0, powerGen: 0,
        storageBonus: { data: 100 },
        unlockReq: null,
    },
    advancedStorage: {
        name: 'Advanced Vault', icon: '🏛️', category: 'storage',
        desc: 'Increases Tier 2 resource storage by 50 each.',
        baseCost: { alloys: 10, circuits: 10, credits: 50 }, costScale: 1.25,
        production: {}, consumption: {},
        powerUse: 2, powerGen: 0,
        storageBonus: { circuits: 50, alloys: 50, codeModules: 50 },
        unlockReq: { research: 'expandedStorage' },
    },
    quantumVault: {
        name: 'Quantum Vault', icon: '🔮', category: 'storage',
        desc: 'Increases Tier 3 resource storage by 25 each.',
        baseCost: { aiCores: 2, quantumCells: 2, nanofibers: 2, credits: 500 }, costScale: 1.3,
        production: {}, consumption: {},
        powerUse: 5, powerGen: 0,
        storageBonus: { aiCores: 25, quantumCells: 25, nanofibers: 25 },
        unlockReq: { research: 'quantumStorage' },
    },
    // === POWER ===
    solarPanel: {
        name: 'Solar Panel', icon: '☀️', category: 'power',
        desc: 'Generates 5 MW of clean power.',
        baseCost: { minerals: 25, energy: 15 }, costScale: 1.15,
        production: {}, consumption: {},
        powerUse: 0, powerGen: 5,
        unlockReq: null,
    },
    fusionReactor: {
        name: 'Fusion Reactor', icon: '🌟', category: 'power',
        desc: 'Generates 25 MW of power. Requires energy to start.',
        baseCost: { alloys: 20, circuits: 15, energy: 100, credits: 200 }, costScale: 1.25,
        production: {}, consumption: { energy: 2 },
        powerUse: 0, powerGen: 25,
        unlockReq: { research: 'fusionPower' },
    },
    antimatterPlant: {
        name: 'Antimatter Plant', icon: '💥', category: 'power',
        desc: 'Generates 100 MW of power. Extremely expensive.',
        baseCost: { quantumCells: 5, aiCores: 3, alloys: 50, credits: 2000 }, costScale: 1.35,
        production: {}, consumption: { quantumCells: 0.1 },
        powerUse: 0, powerGen: 100,
        unlockReq: { research: 'antimatterTech' },
    },
};

const RESEARCH_DEFS = {
    // === EFFICIENCY BRANCH ===
    efficientDrills: {
        name: 'Efficient Drills', branch: 'efficiency',
        desc: 'Extractors produce 50% more resources.',
        effect: 'Extractor output ×1.5',
        cost: { energy: 100, minerals: 100, data: 50 },
        prereq: null,
        apply: () => { Game.multipliers.extractorOutput *= 1.5; },
    },
    overclocking: {
        name: 'Overclocking', branch: 'efficiency',
        desc: 'All production buildings work 25% faster.',
        effect: 'All production ×1.25',
        cost: { circuits: 15, energy: 200 },
        prereq: 'efficientDrills',
        apply: () => { Game.multipliers.allProduction *= 1.25; },
    },
    recycling: {
        name: 'Recycling Systems', branch: 'efficiency',
        desc: 'Processors consume 25% fewer raw resources.',
        effect: 'Processor input ×0.75',
        cost: { circuits: 25, alloys: 15, codeModules: 10 },
        prereq: 'overclocking',
        apply: () => { Game.multipliers.processorConsumption *= 0.75; },
    },
    quantumOptimization: {
        name: 'Quantum Optimization', branch: 'efficiency',
        desc: 'All production doubled.',
        effect: 'All production ×2',
        cost: { quantumCells: 5, aiCores: 3, credits: 1000 },
        prereq: 'recycling',
        apply: () => { Game.multipliers.allProduction *= 2; },
    },
    singularityEngine: {
        name: 'Singularity Engine', branch: 'efficiency',
        desc: 'All production tripled. The ultimate efficiency.',
        effect: 'All production ×3',
        cost: { singularityShards: 5, quantumCells: 20, aiCores: 15 },
        prereq: 'quantumOptimization',
        apply: () => { Game.multipliers.allProduction *= 3; },
    },
    clickPower1: {
        name: 'Enhanced Gathering', branch: 'efficiency',
        desc: 'Manual gathering yields 5× resources.',
        effect: 'Click power ×5',
        cost: { energy: 50, minerals: 50, data: 50 },
        prereq: null,
        apply: () => { Game.multipliers.clickPower *= 5; },
    },
    clickPower2: {
        name: 'Power Gathering', branch: 'efficiency',
        desc: 'Manual gathering yields 10× more.',
        effect: 'Click power ×10',
        cost: { circuits: 20, alloys: 10 },
        prereq: 'clickPower1',
        apply: () => { Game.multipliers.clickPower *= 10; },
    },

    // === CAPACITY BRANCH ===
    expandedStorage: {
        name: 'Expanded Storage', branch: 'capacity',
        desc: 'Unlocks Advanced Vault building. All Tier 1 caps +200.',
        effect: 'Unlock Advanced Vault, +200 T1 caps',
        cost: { energy: 80, minerals: 80, data: 80 },
        prereq: null,
        apply: () => { Game.bonusCaps.energy += 200; Game.bonusCaps.minerals += 200; Game.bonusCaps.data += 200; },
    },
    quantumStorage: {
        name: 'Quantum Storage', branch: 'capacity',
        desc: 'Unlocks Quantum Vault. All Tier 2 caps +100.',
        effect: 'Unlock Quantum Vault, +100 T2 caps',
        cost: { circuits: 30, alloys: 30, codeModules: 30, credits: 300 },
        prereq: 'expandedStorage',
        apply: () => { Game.bonusCaps.circuits += 100; Game.bonusCaps.alloys += 100; Game.bonusCaps.codeModules += 100; },
    },
    infiniteStorage: {
        name: 'Dimensional Pockets', branch: 'capacity',
        desc: 'All storage caps doubled.',
        effect: 'All caps ×2',
        cost: { quantumCells: 10, nanofibers: 5, credits: 2000 },
        prereq: 'quantumStorage',
        apply: () => { Game.multipliers.storageCap *= 2; },
    },
    massStorage: {
        name: 'Mass Storage Arrays', branch: 'capacity',
        desc: 'All Tier 1 caps +500.',
        effect: '+500 T1 caps',
        cost: { minerals: 200, energy: 150 },
        prereq: 'expandedStorage',
        apply: () => { Game.bonusCaps.energy += 500; Game.bonusCaps.minerals += 500; Game.bonusCaps.data += 500; },
    },
    throughputBoost: {
        name: 'Throughput Boost', branch: 'capacity',
        desc: 'Processors work 50% faster.',
        effect: 'Processor speed ×1.5',
        cost: { circuits: 40, alloys: 20, credits: 500 },
        prereq: 'massStorage',
        apply: () => { Game.multipliers.processorOutput *= 1.5; },
    },

    // === AUTOMATION BRANCH ===
    basicAutomation: {
        name: 'Basic Automation', branch: 'automation',
        desc: 'Unlocks auto-sellers for Tier 1 resources.',
        effect: 'Unlock Auto-Sellers (T1)',
        cost: { data: 50, circuits: 5 },
        prereq: null,
        apply: () => { Game.unlocks.autoSellT1 = true; },
    },
    advancedAutomation: {
        name: 'Advanced Automation', branch: 'automation',
        desc: 'Unlocks auto-sellers for Tier 2 resources.',
        effect: 'Unlock Auto-Sellers (T2)',
        cost: { codeModules: 15, circuits: 15, credits: 200 },
        prereq: 'basicAutomation',
        apply: () => { Game.unlocks.autoSellT2 = true; },
    },
    taskQueues: {
        name: 'Task Queues', branch: 'automation',
        desc: 'Unlocks the task queue system for automated building.',
        effect: 'Unlock Task Queue',
        cost: { codeModules: 10, data: 100 },
        prereq: 'basicAutomation',
        apply: () => { Game.unlocks.taskQueue = true; },
    },
    logisticsAI: {
        name: 'Logistics AI', branch: 'automation',
        desc: 'Unlocks smart routing - auto-distributes resources optimally.',
        effect: 'Unlock Smart Routing',
        cost: { aiCores: 5, codeModules: 25, credits: 1000 },
        prereq: 'advancedAutomation',
        apply: () => { Game.unlocks.smartRouting = true; },
    },
    blueprintSystem: {
        name: 'Blueprint System', branch: 'automation',
        desc: 'Unlocks production blueprints - save and load configs.',
        effect: 'Unlock Blueprints',
        cost: { codeModules: 20, data: 150 },
        prereq: 'taskQueues',
        apply: () => { Game.unlocks.blueprints = true; },
    },
    masterAutomation: {
        name: 'Master Automation', branch: 'automation',
        desc: 'All automated processes run 2× faster.',
        effect: 'Automation speed ×2',
        cost: { aiCores: 10, quantumCells: 5, credits: 5000 },
        prereq: 'logisticsAI',
        apply: () => { Game.multipliers.automationSpeed *= 2; },
    },

    // === EXPANSION BRANCH ===
    basicProcessing: {
        name: 'Basic Processing', branch: 'expansion',
        desc: 'Unlocks Tier 2 processor buildings.',
        effect: 'Unlock Processors',
        cost: { energy: 50, minerals: 50, data: 50 },
        prereq: null,
        apply: () => { Game.unlocks.processors = true; },
    },
    advancedManufacturing: {
        name: 'Advanced Manufacturing', branch: 'expansion',
        desc: 'Unlocks Tier 3 factory buildings.',
        effect: 'Unlock Factories',
        cost: { circuits: 25, alloys: 25, codeModules: 25, credits: 500 },
        prereq: 'basicProcessing',
        apply: () => { Game.unlocks.factories = true; },
    },
    fusionPower: {
        name: 'Fusion Power', branch: 'expansion',
        desc: 'Unlocks the Fusion Reactor power building.',
        effect: 'Unlock Fusion Reactor',
        cost: { circuits: 20, alloys: 15, energy: 200 },
        prereq: 'basicProcessing',
        apply: () => { Game.unlocks.fusionReactor = true; },
    },
    antimatterTech: {
        name: 'Antimatter Technology', branch: 'expansion',
        desc: 'Unlocks the Antimatter Plant.',
        effect: 'Unlock Antimatter Plant',
        cost: { quantumCells: 10, aiCores: 5, credits: 3000 },
        prereq: 'advancedManufacturing',
        apply: () => { Game.unlocks.antimatterPlant = true; },
    },
    sectorExpansion: {
        name: 'Sector Expansion', branch: 'expansion',
        desc: 'Unlocks Zone 2 with bonus resource deposits. All production +50%.',
        effect: 'All production ×1.5',
        cost: { aiCores: 3, quantumCells: 3, nanofibers: 3, credits: 2000 },
        prereq: 'advancedManufacturing',
        apply: () => { Game.multipliers.allProduction *= 1.5; Game.unlocks.zone2 = true; },
    },
    deepSpaceProbe: {
        name: 'Deep Space Probe', branch: 'expansion',
        desc: 'Discovers rare resource veins. Extractor output ×2.',
        effect: 'Extractor output ×2',
        cost: { quantumCells: 8, nanofibers: 5, credits: 5000 },
        prereq: 'sectorExpansion',
        apply: () => { Game.multipliers.extractorOutput *= 2; },
    },

    // === TRANSCENDENCE BRANCH ===
    singularityTheory: {
        name: 'Singularity Theory', branch: 'transcendence',
        desc: 'Unlocks the Prestige system.',
        effect: 'Unlock Prestige',
        cost: { aiCores: 1, quantumCells: 1, nanofibers: 1 },
        prereq: null,
        apply: () => { Game.unlocks.prestige = true; },
    },
    shardAmplifier: {
        name: 'Shard Amplifier', branch: 'transcendence',
        desc: 'Gain 50% more Singularity Shards on prestige.',
        effect: 'Prestige gain ×1.5',
        cost: { aiCores: 5, quantumCells: 5, nanofibers: 5, credits: 3000 },
        prereq: 'singularityTheory',
        apply: () => { Game.multipliers.prestigeGain *= 1.5; },
    },
    transcendentMemory: {
        name: 'Transcendent Memory', branch: 'transcendence',
        desc: 'Keep 10% of credits through prestige.',
        effect: 'Keep 10% credits on prestige',
        cost: { singularityShards: 3 },
        prereq: 'shardAmplifier',
        apply: () => { Game.unlocks.keepCredits = true; },
    },
    dimensionalRift: {
        name: 'Dimensional Rift', branch: 'transcendence',
        desc: 'All Tier 3 production doubled.',
        effect: 'T3 production ×2',
        cost: { singularityShards: 10, quantumCells: 15 },
        prereq: 'transcendentMemory',
        apply: () => { Game.multipliers.factoryOutput *= 2; },
    },
    omniscience: {
        name: 'Omniscience', branch: 'transcendence',
        desc: 'Unlock all research prerequisites. The ultimate knowledge.',
        effect: 'All research unlocked',
        cost: { singularityShards: 25 },
        prereq: 'dimensionalRift',
        apply: () => { Game.unlocks.omniscience = true; },
    },
};

const PRESTIGE_UPGRADES = [
    { id: 'startBoost', name: 'Head Start', desc: 'Start each run with 50 of each Tier 1 resource.', cost: 1, effect: () => { Game.prestigePerks.startBoost = true; } },
    { id: 'clickMulti', name: 'Empowered Clicks', desc: 'Permanent 3× click multiplier.', cost: 2, effect: () => { Game.prestigePerks.clickMulti = 3; } },
    { id: 'prodBoost1', name: 'Production Boost I', desc: 'Permanent 1.5× all production.', cost: 3, effect: () => { Game.prestigePerks.prodBoost = (Game.prestigePerks.prodBoost || 1) * 1.5; } },
    { id: 'storageBoost', name: 'Expanded Capacity', desc: 'Permanent 2× all storage caps.', cost: 3, effect: () => { Game.prestigePerks.storageBoost = 2; } },
    { id: 'autoUnlock', name: 'Auto-Start', desc: 'Start with basic automation unlocked.', cost: 5, effect: () => { Game.prestigePerks.autoUnlock = true; } },
    { id: 'prodBoost2', name: 'Production Boost II', desc: 'Permanent 2× all production.', cost: 8, effect: () => { Game.prestigePerks.prodBoost = (Game.prestigePerks.prodBoost || 1) * 2; } },
    { id: 'shardMulti', name: 'Shard Resonance', desc: 'Gain 2× Singularity Shards.', cost: 10, effect: () => { Game.prestigePerks.shardMulti = 2; } },
    { id: 'powerBoost', name: 'Infinite Power', desc: 'Start with +50 MW power capacity.', cost: 5, effect: () => { Game.prestigePerks.powerBoost = 50; } },
    { id: 'speedBoost', name: 'Time Warp', desc: 'Game ticks 50% faster.', cost: 15, effect: () => { Game.prestigePerks.speedBoost = 1.5; } },
    { id: 'megaBoost', name: 'Transcendent Power', desc: 'All production ×5. The ultimate perk.', cost: 25, effect: () => { Game.prestigePerks.prodBoost = (Game.prestigePerks.prodBoost || 1) * 5; } },
];

const ACHIEVEMENTS = [
    { id: 'firstClick', name: 'First Steps', desc: 'Gather your first resource.', icon: '👆', check: () => Game.stats.totalClicks >= 1, reward: 'Unlocked!' },
    { id: 'click100', name: 'Clicker', desc: 'Click 100 times.', icon: '🖱️', check: () => Game.stats.totalClicks >= 100, reward: '+1 click power' },
    { id: 'click1000', name: 'Click Master', desc: 'Click 1,000 times.', icon: '⚡', check: () => Game.stats.totalClicks >= 1000, reward: '+5 click power' },
    { id: 'energy100', name: 'Power Up', desc: 'Accumulate 100 energy.', icon: '🔋', check: () => Game.stats.totalProduced.energy >= 100, reward: '' },
    { id: 'energy10k', name: 'Energized', desc: 'Produce 10,000 energy total.', icon: '⚡', check: () => Game.stats.totalProduced.energy >= 10000, reward: '' },
    { id: 'minerals10k', name: 'Mining Baron', desc: 'Produce 10,000 minerals total.', icon: '💎', check: () => Game.stats.totalProduced.minerals >= 10000, reward: '' },
    { id: 'data10k', name: 'Data Hoarder', desc: 'Produce 10,000 data total.', icon: '📊', check: () => Game.stats.totalProduced.data >= 10000, reward: '' },
    { id: 'firstBuilding', name: 'Constructor', desc: 'Build your first building.', icon: '🏗️', check: () => Game.stats.totalBuildings >= 1, reward: '' },
    { id: 'buildings10', name: 'Architect', desc: 'Own 10 buildings.', icon: '🏛️', check: () => Game.stats.totalBuildings >= 10, reward: '' },
    { id: 'buildings50', name: 'Mega Builder', desc: 'Own 50 buildings.', icon: '🌆', check: () => Game.stats.totalBuildings >= 50, reward: '' },
    { id: 'buildings100', name: 'Empire Builder', desc: 'Own 100 buildings.', icon: '🌇', check: () => Game.stats.totalBuildings >= 100, reward: '' },
    { id: 'firstCircuit', name: 'First Circuit', desc: 'Produce your first circuit.', icon: '🔌', check: () => Game.stats.totalProduced.circuits >= 1, reward: '' },
    { id: 'firstAlloy', name: 'First Alloy', desc: 'Produce your first alloy.', icon: '🔩', check: () => Game.stats.totalProduced.alloys >= 1, reward: '' },
    { id: 'firstCode', name: 'Hello World', desc: 'Produce your first code module.', icon: '💻', check: () => Game.stats.totalProduced.codeModules >= 1, reward: '' },
    { id: 'firstAI', name: 'Artificial Intelligence', desc: 'Produce your first AI Core.', icon: '🧠', check: () => Game.stats.totalProduced.aiCores >= 1, reward: '' },
    { id: 'firstQuantum', name: 'Quantum Leap', desc: 'Produce your first Quantum Cell.', icon: '⚛️', check: () => Game.stats.totalProduced.quantumCells >= 1, reward: '' },
    { id: 'firstNano', name: 'Nanotechnology', desc: 'Produce your first Nanofiber.', icon: '🧬', check: () => Game.stats.totalProduced.nanofibers >= 1, reward: '' },
    { id: 'firstResearch', name: 'Researcher', desc: 'Complete your first research.', icon: '🔬', check: () => Game.stats.totalResearch >= 1, reward: '' },
    { id: 'research10', name: 'Scientist', desc: 'Complete 10 researches.', icon: '🧪', check: () => Game.stats.totalResearch >= 10, reward: '' },
    { id: 'research20', name: 'Genius', desc: 'Complete 20 researches.', icon: '🎓', check: () => Game.stats.totalResearch >= 20, reward: '' },
    { id: 'firstPrestige', name: 'Singularity', desc: 'Prestige for the first time.', icon: '✨', check: () => Game.stats.totalPrestiges >= 1, reward: '' },
    { id: 'prestige5', name: 'Transcendent', desc: 'Prestige 5 times.', icon: '🌟', check: () => Game.stats.totalPrestiges >= 5, reward: '' },
    { id: 'credits1k', name: 'Wealthy', desc: 'Accumulate 1,000 credits.', icon: '🪙', check: () => Game.resources.credits >= 1000, reward: '' },
    { id: 'credits100k', name: 'Tycoon', desc: 'Accumulate 100,000 credits.', icon: '💰', check: () => Game.resources.credits >= 100000, reward: '' },
    { id: 'power100', name: 'Power Grid', desc: 'Generate 100 MW of power.', icon: '⚡', check: () => Game.powerGen >= 100, reward: '' },
    { id: 'shards10', name: 'Shard Collector', desc: 'Accumulate 10 Singularity Shards.', icon: '💎', check: () => Game.resources.singularityShards >= 10, reward: '' },
    { id: 'shards100', name: 'Shard Hoarder', desc: 'Accumulate 100 Singularity Shards.', icon: '🏆', check: () => Game.resources.singularityShards >= 100, reward: '' },
    { id: 'allT2', name: 'Full Spectrum', desc: 'Produce all three Tier 2 resources.', icon: '🌈', check: () => Game.stats.totalProduced.circuits >= 1 && Game.stats.totalProduced.alloys >= 1 && Game.stats.totalProduced.codeModules >= 1, reward: '' },
    { id: 'allT3', name: 'Advanced Empire', desc: 'Produce all three Tier 3 resources.', icon: '👑', check: () => Game.stats.totalProduced.aiCores >= 1 && Game.stats.totalProduced.quantumCells >= 1 && Game.stats.totalProduced.nanofibers >= 1, reward: '' },
    { id: 'speedrun10m', name: 'Speed Runner', desc: 'Reach Tier 2 in under 10 minutes.', icon: '🏃', check: () => Game.stats.totalProduced.circuits >= 1 && Game.stats.runTime < 600, reward: '' },
    { id: 'event5', name: 'Lucky', desc: 'Experience 5 random events.', icon: '🍀', check: () => Game.stats.totalEvents >= 5, reward: '' },
    { id: 'event20', name: 'Eventful', desc: 'Experience 20 random events.', icon: '🎲', check: () => Game.stats.totalEvents >= 20, reward: '' },
    { id: 'sell1k', name: 'Merchant', desc: 'Earn 1,000 credits from selling.', icon: '🏪', check: () => Game.stats.totalCreditsEarned >= 1000, reward: '' },
    { id: 'sell100k', name: 'Trade Baron', desc: 'Earn 100,000 credits from selling.', icon: '🏦', check: () => Game.stats.totalCreditsEarned >= 100000, reward: '' },
    { id: 'offline1h', name: 'Away Manager', desc: 'Collect offline progress of 1+ hour.', icon: '⏰', check: () => Game.stats.maxOfflineTime >= 3600, reward: '' },
    { id: 'allBuildings', name: 'Completionist', desc: 'Build at least one of every building type.', icon: '🏆', check: () => { return Object.keys(BUILDING_DEFS).every(k => (Game.buildings[k] || 0) > 0); }, reward: '' },
    { id: 'energy1m', name: 'Energy Magnate', desc: 'Produce 1,000,000 energy total.', icon: '⚡', check: () => Game.stats.totalProduced.energy >= 1000000, reward: '' },
    { id: 'circuits1k', name: 'Circuit Board', desc: 'Produce 1,000 circuits total.', icon: '🔌', check: () => Game.stats.totalProduced.circuits >= 1000, reward: '' },
    { id: 'aiCores100', name: 'AI Overlord', desc: 'Produce 100 AI Cores total.', icon: '🧠', check: () => Game.stats.totalProduced.aiCores >= 100, reward: '' },
    { id: 'prestigeUpgrade5', name: 'Empowered', desc: 'Purchase 5 prestige upgrades.', icon: '⭐', check: () => Game.stats.totalPrestigeUpgrades >= 5, reward: '' },
    { id: 'maxPower500', name: 'Power Surge', desc: 'Generate 500+ MW of power.', icon: '💥', check: () => Game.powerGen >= 500, reward: '' },
    { id: 'play1h', name: 'Dedicated', desc: 'Play for 1 hour total.', icon: '⏱️', check: () => Game.stats.totalPlayTime >= 3600, reward: '' },
    { id: 'play10h', name: 'Addicted', desc: 'Play for 10 hours total.', icon: '🎮', check: () => Game.stats.totalPlayTime >= 36000, reward: '' },
];

const EVENTS = [
    { name: 'Solar Flare', desc: 'A solar flare boosts energy production!', icon: '☀️', duration: 30, effect: () => { Game.eventMultipliers.energy = 3; }, end: () => { Game.eventMultipliers.energy = 1; } },
    { name: 'Data Storm', desc: 'A data storm floods your scanners!', icon: '🌩️', duration: 25, effect: () => { Game.eventMultipliers.data = 3; }, end: () => { Game.eventMultipliers.data = 1; } },
    { name: 'Mineral Vein', desc: 'A rich mineral vein discovered!', icon: '💎', duration: 30, effect: () => { Game.eventMultipliers.minerals = 3; }, end: () => { Game.eventMultipliers.minerals = 1; } },
    { name: 'Power Surge', desc: 'Power grid surging! +50 MW temporarily.', icon: '⚡', duration: 20, effect: () => { Game.eventBonusPower = 50; }, end: () => { Game.eventBonusPower = 0; } },
    { name: 'Market Boom', desc: 'Resource prices doubled!', icon: '📈', duration: 30, effect: () => { Game.eventMultipliers.sellPrice = 2; }, end: () => { Game.eventMultipliers.sellPrice = 1; } },
    { name: 'Efficiency Wave', desc: 'All production boosted by 2×!', icon: '🚀', duration: 20, effect: () => { Game.eventMultipliers.allProd = 2; }, end: () => { Game.eventMultipliers.allProd = 1; } },
    { name: 'Brownout', desc: 'Power grid unstable! -25% production.', icon: '🔌', duration: 15, effect: () => { Game.eventMultipliers.allProd = 0.75; }, end: () => { Game.eventMultipliers.allProd = 1; }, negative: true },
    { name: 'System Glitch', desc: 'Data corruption! Data production halved.', icon: '🐛', duration: 15, effect: () => { Game.eventMultipliers.data = 0.5; }, end: () => { Game.eventMultipliers.data = 1; }, negative: true },
    { name: 'Credit Windfall', desc: 'Found a cache of credits!', icon: '🪙', duration: 0, effect: () => { const amt = Math.max(100, Game.resources.credits * 0.1); Game.resources.credits += amt; showToast(`Found ${formatNumber(amt)} credits!`, 'success'); }, end: () => {} },
    { name: 'Research Breakthrough', desc: 'Research costs reduced by 50% temporarily!', icon: '🔬', duration: 30, effect: () => { Game.eventMultipliers.researchCost = 0.5; }, end: () => { Game.eventMultipliers.researchCost = 1; } },
];

// ==================== GAME STATE ====================

const Game = {
    resources: {},
    buildings: {},
    research: {},
    settings: { notation: 'suffix', autosaveInterval: 60, offlineProgress: true },
    unlocks: {},
    multipliers: {},
    bonusCaps: {},
    prestigePerks: {},
    prestigeUpgradesPurchased: {},
    autoSellers: {},
    taskQueue: [],
    blueprints: [],
    stats: {
        totalClicks: 0, totalBuildings: 0, totalResearch: 0, totalPrestiges: 0,
        totalProduced: {}, totalCreditsEarned: 0, totalEvents: 0, maxOfflineTime: 0,
        totalPrestigeUpgrades: 0, totalPlayTime: 0, runTime: 0, startTime: Date.now(),
    },
    achievementsUnlocked: {},
    eventMultipliers: {},
    eventBonusPower: 0,
    activeEvent: null,
    activeEventTimer: 0,
    powerGen: 0,
    powerUse: 0,
    lastSave: Date.now(),
    lastTick: Date.now(),
    currentBuildingCategory: 'extractors',
    currentResearchBranch: 'efficiency',
    currentTab: 'resources',
    tickRate: 50, // ms per tick (20 ticks/sec)
    version: '1.0.0',
};

// ==================== INITIALIZATION ====================

function initGame() {
    // Init resources
    for (const [key, def] of Object.entries(RESOURCE_DEFS)) {
        Game.resources[key] = Game.resources[key] || 0;
        Game.stats.totalProduced[key] = Game.stats.totalProduced[key] || 0;
    }
    // Init buildings
    for (const key of Object.keys(BUILDING_DEFS)) {
        Game.buildings[key] = Game.buildings[key] || 0;
    }
    // Init research
    for (const key of Object.keys(RESEARCH_DEFS)) {
        Game.research[key] = Game.research[key] || false;
    }
    // Init multipliers
    resetMultipliers();
    // Init event multipliers
    Game.eventMultipliers = { energy: 1, minerals: 1, data: 1, allProd: 1, sellPrice: 1, researchCost: 1 };
    Game.eventBonusPower = 0;
    // Init bonus caps
    for (const key of Object.keys(RESOURCE_DEFS)) {
        Game.bonusCaps[key] = Game.bonusCaps[key] || 0;
    }
    // Init auto sellers
    for (const key of Object.keys(RESOURCE_DEFS)) {
        if (RESOURCE_DEFS[key].sellPrice > 0) {
            Game.autoSellers[key] = Game.autoSellers[key] || false;
        }
    }
    // Apply prestige perks
    applyPrestigePerks();
    // Re-apply completed research
    for (const [key, completed] of Object.entries(Game.research)) {
        if (completed && RESEARCH_DEFS[key]) {
            RESEARCH_DEFS[key].apply();
        }
    }
}

function resetMultipliers() {
    Game.multipliers = {
        clickPower: 1,
        extractorOutput: 1,
        processorOutput: 1,
        factoryOutput: 1,
        allProduction: 1,
        processorConsumption: 1,
        storageCap: 1,
        prestigeGain: 1,
        automationSpeed: 1,
    };
}

function applyPrestigePerks() {
    if (Game.prestigePerks.clickMulti) {
        Game.multipliers.clickPower *= Game.prestigePerks.clickMulti;
    }
    if (Game.prestigePerks.prodBoost) {
        Game.multipliers.allProduction *= Game.prestigePerks.prodBoost;
    }
    if (Game.prestigePerks.storageBoost) {
        Game.multipliers.storageCap *= Game.prestigePerks.storageBoost;
    }
    if (Game.prestigePerks.shardMulti) {
        Game.multipliers.prestigeGain *= Game.prestigePerks.shardMulti;
    }
    if (Game.prestigePerks.startBoost) {
        Game.resources.energy = Math.max(Game.resources.energy, 50);
        Game.resources.minerals = Math.max(Game.resources.minerals, 50);
        Game.resources.data = Math.max(Game.resources.data, 50);
    }
    if (Game.prestigePerks.autoUnlock) {
        Game.unlocks.autoSellT1 = true;
    }
}

// ==================== RESOURCE CAPS ====================

function getResourceCap(resKey) {
    const def = RESOURCE_DEFS[resKey];
    if (!def || def.baseCap === Infinity) return Infinity;
    let cap = def.baseCap + (Game.bonusCaps[resKey] || 0);
    // Add storage building bonuses
    for (const [bKey, bDef] of Object.entries(BUILDING_DEFS)) {
        if (bDef.storageBonus && bDef.storageBonus[resKey]) {
            cap += bDef.storageBonus[resKey] * (Game.buildings[bKey] || 0);
        }
    }
    cap *= Game.multipliers.storageCap;
    return Math.floor(cap);
}

// ==================== POWER SYSTEM ====================

function calculatePower() {
    let gen = 0, use = 0;
    for (const [key, def] of Object.entries(BUILDING_DEFS)) {
        const count = Game.buildings[key] || 0;
        if (count > 0) {
            gen += (def.powerGen || 0) * count;
            use += (def.powerUse || 0) * count;
        }
    }
    gen += (Game.prestigePerks.powerBoost || 0);
    gen += Game.eventBonusPower;
    Game.powerGen = gen;
    Game.powerUse = use;
    return { gen, use, ratio: gen > 0 ? use / gen : 0 };
}

function getPowerEfficiency() {
    const { gen, use } = calculatePower();
    if (use === 0) return 1;
    if (gen === 0 && use > 0) return 0.25; // brownout
    if (use > gen) return Math.max(0.25, gen / use); // partial brownout
    return 1;
}

// ==================== PRODUCTION RATES ====================

function getProductionRates() {
    const rates = {};
    for (const key of Object.keys(RESOURCE_DEFS)) {
        rates[key] = 0;
    }
    const powerEff = getPowerEfficiency();
    const speedMult = (Game.prestigePerks.speedBoost || 1);

    for (const [bKey, bDef] of Object.entries(BUILDING_DEFS)) {
        const count = Game.buildings[bKey] || 0;
        if (count === 0) continue;

        // Production
        for (const [resKey, amount] of Object.entries(bDef.production || {})) {
            let rate = amount * count;
            // Apply category multipliers
            if (bDef.category === 'extractors') {
                rate *= Game.multipliers.extractorOutput;
                rate *= (Game.eventMultipliers[resKey] || 1);
            }
            if (bDef.category === 'processors') {
                rate *= Game.multipliers.processorOutput;
            }
            if (bDef.category === 'factories') {
                rate *= Game.multipliers.factoryOutput;
            }
            rate *= Game.multipliers.allProduction;
            rate *= (Game.eventMultipliers.allProd || 1);
            rate *= powerEff;
            rate *= speedMult;
            rates[resKey] = (rates[resKey] || 0) + rate;
        }

        // Consumption
        for (const [resKey, amount] of Object.entries(bDef.consumption || {})) {
            let rate = amount * count;
            if (bDef.category === 'processors') {
                rate *= Game.multipliers.processorConsumption;
            }
            rate *= powerEff;
            rate *= speedMult;
            rates[resKey] = (rates[resKey] || 0) - rate;
        }
    }

    return rates;
}

// ==================== BUILDING COSTS ====================

function getBuildingCost(buildingKey) {
    const def = BUILDING_DEFS[buildingKey];
    const count = Game.buildings[buildingKey] || 0;
    const costs = {};
    for (const [res, base] of Object.entries(def.baseCost)) {
        costs[res] = Math.ceil(base * Math.pow(def.costScale, count));
    }
    return costs;
}

function canAfford(costs) {
    for (const [res, amount] of Object.entries(costs)) {
        if ((Game.resources[res] || 0) < amount) return false;
    }
    return true;
}

function spendResources(costs) {
    for (const [res, amount] of Object.entries(costs)) {
        Game.resources[res] -= amount;
    }
}

function isBuildingUnlocked(buildingKey) {
    const def = BUILDING_DEFS[buildingKey];
    if (!def.unlockReq) return true;
    if (Game.unlocks.omniscience) return true;
    if (def.unlockReq.research) {
        return Game.research[def.unlockReq.research] === true;
    }
    return true;
}

// ==================== RESEARCH ====================

function getResearchCost(researchKey) {
    const def = RESEARCH_DEFS[researchKey];
    const costs = {};
    const mult = Game.eventMultipliers.researchCost || 1;
    for (const [res, base] of Object.entries(def.cost)) {
        costs[res] = Math.ceil(base * mult);
    }
    return costs;
}

function isResearchAvailable(researchKey) {
    const def = RESEARCH_DEFS[researchKey];
    if (Game.research[researchKey]) return false; // already done
    if (Game.unlocks.omniscience) return true;
    if (def.prereq && !Game.research[def.prereq]) return false;
    return true;
}

// ==================== PRESTIGE ====================

function calculatePrestigeGain() {
    const t3Total = (Game.stats.totalProduced.aiCores || 0) +
                    (Game.stats.totalProduced.quantumCells || 0) +
                    (Game.stats.totalProduced.nanofibers || 0);
    if (t3Total < 3) return 0;
    let shards = Math.floor(Math.pow(t3Total, 0.5));
    shards = Math.floor(shards * Game.multipliers.prestigeGain);
    return Math.max(0, shards);
}

function canPrestige() {
    return Game.unlocks.prestige &&
           Game.stats.totalProduced.aiCores >= 1 &&
           Game.stats.totalProduced.quantumCells >= 1 &&
           Game.stats.totalProduced.nanofibers >= 1;
}

function doPrestige() {
    if (!canPrestige()) return;
    const shards = calculatePrestigeGain();
    if (shards <= 0) return;

    // Grant shards
    Game.resources.singularityShards = (Game.resources.singularityShards || 0) + shards;
    Game.stats.totalPrestiges++;

    // Keep some credits if perk
    const keepCredits = Game.unlocks.keepCredits ? Math.floor(Game.resources.credits * 0.1) : 0;

    // Reset resources (except shards)
    for (const key of Object.keys(RESOURCE_DEFS)) {
        if (key === 'singularityShards') continue;
        if (key === 'credits') { Game.resources[key] = keepCredits; continue; }
        Game.resources[key] = 0;
    }

    // Reset buildings
    for (const key of Object.keys(BUILDING_DEFS)) {
        Game.buildings[key] = 0;
    }

    // Reset research
    for (const key of Object.keys(RESEARCH_DEFS)) {
        Game.research[key] = false;
    }

    // Reset unlocks (keep prestige-related)
    const keepUnlocks = { prestige: Game.unlocks.prestige, keepCredits: Game.unlocks.keepCredits, omniscience: Game.unlocks.omniscience };
    Game.unlocks = keepUnlocks;

    // Reset multipliers and re-apply
    resetMultipliers();
    Game.bonusCaps = {};
    for (const key of Object.keys(RESOURCE_DEFS)) {
        Game.bonusCaps[key] = 0;
    }

    // Reset stats for this run
    Game.stats.runTime = 0;
    Game.stats.totalBuildings = 0;
    Game.stats.totalResearch = 0;
    Game.stats.totalProduced = {};
    for (const key of Object.keys(RESOURCE_DEFS)) {
        Game.stats.totalProduced[key] = 0;
    }

    // Reset task queue
    Game.taskQueue = [];

    // Reset auto sellers
    for (const key of Object.keys(Game.autoSellers)) {
        Game.autoSellers[key] = false;
    }

    // Reset event
    if (Game.activeEvent) {
        Game.activeEvent = null;
        Game.activeEventTimer = 0;
    }
    Game.eventMultipliers = { energy: 1, minerals: 1, data: 1, allProd: 1, sellPrice: 1, researchCost: 1 };
    Game.eventBonusPower = 0;

    // Apply prestige perks
    applyPrestigePerks();

    addLog('✨ Singularity achieved! Gained ' + shards + ' Singularity Shards.', 'prestige');
    showToast('🌀 Singularity! +' + shards + ' Shards', 'prestige');
    saveGame();
    renderAll();
}

// ==================== GAME TICK ====================

function gameTick(dt) {
    // dt in seconds
    const rates = getProductionRates();
    const powerEff = getPowerEfficiency();

    // Apply production
    for (const [resKey, rate] of Object.entries(rates)) {
        if (rate === 0) continue;
        const cap = getResourceCap(resKey);

        if (rate > 0) {
            // Check if consuming resources are available for processors/factories
            Game.resources[resKey] = Math.min(cap, Game.resources[resKey] + rate * dt);
            if (rate > 0) {
                Game.stats.totalProduced[resKey] = (Game.stats.totalProduced[resKey] || 0) + rate * dt;
            }
        } else {
            // Consumption - don't go below 0
            Game.resources[resKey] = Math.max(0, Game.resources[resKey] + rate * dt);
        }
    }

    // Auto-sellers
    processAutoSellers(dt);

    // Task queue
    processTaskQueue();

    // Event timer
    if (Game.activeEvent && Game.activeEventTimer > 0) {
        Game.activeEventTimer -= dt;
        if (Game.activeEventTimer <= 0) {
            Game.activeEvent.end();
            addLog(`Event ended: ${Game.activeEvent.name}`, 'event');
            Game.activeEvent = null;
            Game.activeEventTimer = 0;
        }
    }

    // Random events
    if (!Game.activeEvent && Math.random() < 0.0005 * dt) { // ~every 2000 seconds on average
        triggerRandomEvent();
    }

    // Stats
    Game.stats.runTime += dt;
    Game.stats.totalPlayTime += dt;

    // Check achievements
    checkAchievements();
}

// ==================== AUTO-SELLERS ====================

function processAutoSellers(dt) {
    for (const [resKey, active] of Object.entries(Game.autoSellers)) {
        if (!active) continue;
        const def = RESOURCE_DEFS[resKey];
        if (!def || def.sellPrice <= 0) continue;

        // Check unlock
        if (def.tier === 1 && !Game.unlocks.autoSellT1) continue;
        if (def.tier === 2 && !Game.unlocks.autoSellT2) continue;
        if (def.tier === 3) continue; // T3 not auto-sellable

        const cap = getResourceCap(resKey);
        const threshold = cap * 0.9; // Sell when above 90%
        if (Game.resources[resKey] > threshold) {
            const sellAmount = Math.min((Game.resources[resKey] - threshold), cap * 0.1 * dt);
            if (sellAmount > 0) {
                const price = def.sellPrice * (Game.eventMultipliers.sellPrice || 1);
                Game.resources[resKey] -= sellAmount;
                Game.resources.credits += sellAmount * price;
                Game.stats.totalCreditsEarned += sellAmount * price;
            }
        }
    }
}

// ==================== TASK QUEUE ====================

function processTaskQueue() {
    if (!Game.unlocks.taskQueue || Game.taskQueue.length === 0) return;
    const task = Game.taskQueue[0];
    const costs = getBuildingCost(task.buildingKey);
    if (canAfford(costs) && isBuildingUnlocked(task.buildingKey)) {
        spendResources(costs);
        Game.buildings[task.buildingKey]++;
        Game.stats.totalBuildings++;
        Game.taskQueue.shift();
        addLog(`🤖 Auto-built: ${BUILDING_DEFS[task.buildingKey].name}`, 'info');
        showToast(`🤖 Auto-built ${BUILDING_DEFS[task.buildingKey].name}`, 'info');
        renderTaskQueue();
        renderBuildings();
    }
}

// ==================== EVENTS ====================

function triggerRandomEvent() {
    const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    Game.activeEvent = event;
    Game.activeEventTimer = event.duration;
    event.effect();
    Game.stats.totalEvents++;

    const type = event.negative ? 'warning' : 'event';
    addLog(`${event.icon} Event: ${event.name} - ${event.desc}`, type);
    showToast(`${event.icon} ${event.name}: ${event.desc}`, type);
}

// ==================== ACHIEVEMENTS ====================

function checkAchievements() {
    for (const ach of ACHIEVEMENTS) {
        if (Game.achievementsUnlocked[ach.id]) continue;
        try {
            if (ach.check()) {
                Game.achievementsUnlocked[ach.id] = true;
                addLog(`🏆 Achievement unlocked: ${ach.name}!`, 'achievement');
                showToast(`🏆 ${ach.name}: ${ach.desc}`, 'achievement');
                // Apply reward
                if (ach.id === 'click100') Game.multipliers.clickPower += 1;
                if (ach.id === 'click1000') Game.multipliers.clickPower += 5;
            }
        } catch (e) { /* ignore check errors */ }
    }
}

// ==================== UI FUNCTIONS ====================

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

function addLog(message, type = '') {
    const log = document.getElementById('log-messages');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    const time = new Date().toLocaleTimeString();
    entry.textContent = `[${time}] ${message}`;
    log.insertBefore(entry, log.firstChild);
    // Keep max 100 entries
    while (log.children.length > 100) log.removeChild(log.lastChild);
}

function showNumberPop(element, amount) {
    const pop = document.createElement('div');
    pop.className = 'number-pop';
    pop.textContent = '+' + formatNumber(amount);
    const rect = element.getBoundingClientRect();
    pop.style.left = (rect.left + rect.width / 2 - 20) + 'px';
    pop.style.top = (rect.top - 10) + 'px';
    pop.style.position = 'fixed';
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 800);
}

// ==================== RENDERING ====================

function renderAll() {
    renderTicker();
    renderPower();
    renderResourceBars();
    renderBuildings();
    renderResearch();
    renderAutomation();
    renderPrestige();
    renderStats();
}

function renderTicker() {
    const rates = getProductionRates();
    for (const [key, def] of Object.entries(RESOURCE_DEFS)) {
        const valEl = document.getElementById(`ticker-${key}`);
        const rateEl = document.getElementById(`ticker-${key}-rate`);
        if (valEl) valEl.textContent = formatNumber(Game.resources[key] || 0);
        if (rateEl) rateEl.textContent = formatRate(rates[key] || 0);
    }
}

function renderPower() {
    const { gen, use } = calculatePower();
    document.getElementById('power-current').textContent = formatNumber(use);
    document.getElementById('power-max').textContent = formatNumber(gen);
    const bar = document.getElementById('power-bar');
    const ratio = gen > 0 ? (use / gen) * 100 : 0;
    bar.style.width = Math.min(100, ratio) + '%';
    bar.className = 'power-bar';
    if (ratio > 90) bar.classList.add('critical');
    else if (ratio > 70) bar.classList.add('warning');
}

function renderResourceBars() {
    const rates = getProductionRates();
    const allRes = ['energy', 'minerals', 'data', 'circuits', 'alloys', 'codeModules', 'aiCores', 'quantumCells', 'nanofibers'];
    for (const key of allRes) {
        const bar = document.getElementById(`bar-${key}`);
        const text = document.getElementById(`bar-text-${key}`);
        const rateEl = document.getElementById(`rate-${key}`);
        if (!bar) continue;
        const cap = getResourceCap(key);
        const val = Game.resources[key] || 0;
        const pct = cap > 0 ? (val / cap) * 100 : 0;
        bar.style.width = Math.min(100, pct) + '%';
        if (pct >= 99) bar.classList.add('full');
        else bar.classList.remove('full');
        if (text) text.textContent = `${formatNumber(val)} / ${formatNumber(cap)}`;
        if (rateEl) rateEl.textContent = formatRate(rates[key] || 0);
    }
}

function renderBuildings() {
    const container = document.getElementById('buildings-list');
    container.innerHTML = '';
    const category = Game.currentBuildingCategory;

    for (const [key, def] of Object.entries(BUILDING_DEFS)) {
        if (def.category !== category) continue;
        const unlocked = isBuildingUnlocked(key);
        const costs = getBuildingCost(key);
        const affordable = canAfford(costs);
        const count = Game.buildings[key] || 0;

        const card = document.createElement('div');
        card.className = `building-card ${unlocked ? '' : 'locked'}`;

        let costHTML = '';
        for (const [res, amt] of Object.entries(costs)) {
            const have = Game.resources[res] || 0;
            const cls = have >= amt ? 'affordable' : 'expensive';
            const icon = RESOURCE_DEFS[res]?.icon || '';
            costHTML += `<span class="cost-item ${cls}">${icon} ${formatNumber(amt)}</span>`;
        }

        let statsHTML = '';
        for (const [res, amt] of Object.entries(def.production)) {
            statsHTML += `<div class="building-stat"><span>Produces ${RESOURCE_DEFS[res]?.name}</span><span class="stat-value positive">+${formatNumber(amt * count, 2)}/s</span></div>`;
        }
        for (const [res, amt] of Object.entries(def.consumption || {})) {
            statsHTML += `<div class="building-stat"><span>Consumes ${RESOURCE_DEFS[res]?.name}</span><span class="stat-value negative">-${formatNumber(amt * count, 2)}/s</span></div>`;
        }
        if (def.storageBonus) {
            for (const [res, amt] of Object.entries(def.storageBonus)) {
                statsHTML += `<div class="building-stat"><span>${RESOURCE_DEFS[res]?.name} cap</span><span class="stat-value positive">+${formatNumber(amt * count)}</span></div>`;
            }
        }

        let powerBadge = '';
        if (def.powerGen > 0) powerBadge = `<div class="building-power-badge producer">+${def.powerGen} MW</div>`;
        if (def.powerUse > 0) powerBadge = `<div class="building-power-badge consumer">-${def.powerUse} MW</div>`;

        card.innerHTML = `
            ${powerBadge}
            <div class="building-header">
                <div class="building-name">${def.icon} ${def.name}</div>
                <span class="building-count">${count}</span>
            </div>
            <div class="building-desc">${unlocked ? def.desc : '🔒 Locked - Research required'}</div>
            ${count > 0 ? `<div class="building-stats">${statsHTML}</div>` : ''}
            <div class="building-cost">${costHTML}</div>
            <button class="btn-build" ${(!unlocked || !affordable) ? 'disabled' : ''} data-building="${key}">
                Build ${def.name} (${formatNumber(Object.values(costs)[0])})
            </button>
        `;

        container.appendChild(card);
    }

    // Attach build handlers
    container.querySelectorAll('.btn-build').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.building;
            buildBuilding(key);
        });
    });
}

function renderResearch() {
    const container = document.getElementById('research-list');
    container.innerHTML = '';
    const branch = Game.currentResearchBranch;

    for (const [key, def] of Object.entries(RESEARCH_DEFS)) {
        if (def.branch !== branch) continue;
        const completed = Game.research[key];
        const available = isResearchAvailable(key);
        const costs = getResearchCost(key);
        const affordable = canAfford(costs);

        let status, statusClass;
        if (completed) { status = '✅ Completed'; statusClass = 'completed'; }
        else if (available) { status = 'Available'; statusClass = 'available'; }
        else { status = '🔒 Locked'; statusClass = 'locked'; }

        const card = document.createElement('div');
        card.className = `research-card ${completed ? 'completed' : ''} ${!available && !completed ? 'locked' : ''}`;

        let costHTML = '';
        if (!completed) {
            for (const [res, amt] of Object.entries(costs)) {
                const have = Game.resources[res] || 0;
                const cls = have >= amt ? 'affordable' : 'expensive';
                const icon = RESOURCE_DEFS[res]?.icon || '';
                costHTML += `<span class="cost-item ${cls}">${icon} ${formatNumber(amt)}</span>`;
            }
        }

        card.innerHTML = `
            <div class="research-header">
                <span class="research-name">${def.name}</span>
                <span class="research-status ${statusClass}">${status}</span>
            </div>
            <div class="research-desc">${def.desc}</div>
            <div class="research-effect">Effect: ${def.effect}</div>
            ${!completed ? `<div class="research-cost">${costHTML}</div>` : ''}
            ${!completed && available ? `<button class="btn-research" ${!affordable ? 'disabled' : ''} data-research="${key}">Research</button>` : ''}
        `;

        container.appendChild(card);
    }

    // Attach research handlers
    container.querySelectorAll('.btn-research').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.research;
            doResearch(key);
        });
    });
}

function renderAutomation() {
    // Auto-sellers
    const sellerList = document.getElementById('auto-sellers-list');
    sellerList.innerHTML = '';

    const sellableResources = Object.entries(RESOURCE_DEFS).filter(([k, d]) => {
        if (d.sellPrice <= 0) return false;
        if (d.tier === 1 && !Game.unlocks.autoSellT1) return false;
        if (d.tier === 2 && !Game.unlocks.autoSellT2) return false;
        if (d.tier === 3) return false;
        return true;
    });

    if (sellableResources.length === 0) {
        sellerList.innerHTML = '<div class="queue-empty">Unlock through Research: "Basic Automation"</div>';
    } else {
        for (const [key, def] of sellableResources) {
            const row = document.createElement('div');
            row.className = 'auto-seller-row';
            const active = Game.autoSellers[key] || false;
            row.innerHTML = `
                <span class="seller-icon">${def.icon}</span>
                <span class="seller-name">${def.name}</span>
                <span class="seller-price">${def.sellPrice} 🪙/unit</span>
                <div class="seller-toggle ${active ? 'active' : ''}" data-resource="${key}"></div>
            `;
            sellerList.appendChild(row);
        }
        sellerList.querySelectorAll('.seller-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => {
                const key = toggle.dataset.resource;
                Game.autoSellers[key] = !Game.autoSellers[key];
                toggle.classList.toggle('active');
            });
        });
    }

    // Task queue select
    const select = document.getElementById('task-queue-select');
    select.innerHTML = '<option value="">-- Select a building --</option>';
    for (const [key, def] of Object.entries(BUILDING_DEFS)) {
        if (isBuildingUnlocked(key)) {
            select.innerHTML += `<option value="${key}">${def.icon} ${def.name}</option>`;
        }
    }

    // Smart routing
    const routingStatus = document.getElementById('smart-routing-status');
    if (Game.unlocks.smartRouting) {
        routingStatus.className = '';
        routingStatus.innerHTML = '<p style="color:var(--green);">✅ Smart Routing Active - Resources are being optimally distributed.</p>';
    } else {
        routingStatus.className = 'locked-feature';
        routingStatus.innerHTML = '🔒 Unlock through Research: "Logistics AI"';
    }

    renderTaskQueue();
}

function renderTaskQueue() {
    const list = document.getElementById('task-queue-list');
    if (!Game.unlocks.taskQueue || Game.taskQueue.length === 0) {
        list.innerHTML = '<div class="queue-empty">' + (Game.unlocks.taskQueue ? 'Queue is empty' : '🔒 Unlock through Research: "Task Queues"') + '</div>';
        return;
    }
    list.innerHTML = '';
    Game.taskQueue.forEach((task, i) => {
        const def = BUILDING_DEFS[task.buildingKey];
        const item = document.createElement('div');
        item.className = 'queue-item';
        item.innerHTML = `
            <span class="queue-num">#${i + 1}</span>
            <span class="queue-name">${def.icon} ${def.name}</span>
            <button class="btn-remove-queue" data-index="${i}">✕</button>
        `;
        list.appendChild(item);
    });
    list.querySelectorAll('.btn-remove-queue').forEach(btn => {
        btn.addEventListener('click', () => {
            Game.taskQueue.splice(parseInt(btn.dataset.index), 1);
            renderTaskQueue();
        });
    });
}

function renderPrestige() {
    const gain = calculatePrestigeGain();
    document.getElementById('current-shards').textContent = formatNumber(Game.resources.singularityShards || 0);
    document.getElementById('prestige-gain').textContent = gain + ' Singularity Shards';

    const btn = document.getElementById('btn-prestige');
    btn.disabled = !canPrestige() || gain <= 0;

    const req = document.getElementById('prestige-req');
    if (canPrestige()) {
        req.textContent = `You will gain ${gain} shards. All progress will be reset.`;
    } else if (!Game.unlocks.prestige) {
        req.textContent = 'Unlock through Research: "Singularity Theory"';
    } else {
        req.textContent = 'Requires at least 1 AI Core, 1 Quantum Cell, and 1 Nanofiber produced';
    }

    // Prestige upgrades
    const list = document.getElementById('prestige-upgrades-list');
    list.innerHTML = '';
    for (const upg of PRESTIGE_UPGRADES) {
        const purchased = Game.prestigeUpgradesPurchased[upg.id] || false;
        const affordable = (Game.resources.singularityShards || 0) >= upg.cost;
        const card = document.createElement('div');
        card.className = `prestige-upgrade-card ${purchased ? 'purchased' : ''}`;
        card.innerHTML = `
            <div class="pu-name">${upg.name}</div>
            <div class="pu-desc">${upg.desc}</div>
            <div class="pu-cost">✨ ${upg.cost} Shards</div>
            ${purchased ? '<div style="color:var(--green);font-size:0.8rem;">✅ Purchased</div>' :
                `<button class="btn-prestige-buy" ${!affordable ? 'disabled' : ''} data-upgrade="${upg.id}">Purchase</button>`}
        `;
        list.appendChild(card);
    }
    list.querySelectorAll('.btn-prestige-buy').forEach(btn => {
        btn.addEventListener('click', () => {
            buyPrestigeUpgrade(btn.dataset.upgrade);
        });
    });
}

function renderStats() {
    const statsGrid = document.getElementById('general-stats');
    const powerEff = getPowerEfficiency();
    const stats = [
        { label: 'Total Play Time', value: formatTime(Game.stats.totalPlayTime) },
        { label: 'Current Run Time', value: formatTime(Game.stats.runTime) },
        { label: 'Total Clicks', value: formatNumber(Game.stats.totalClicks) },
        { label: 'Total Buildings', value: Game.stats.totalBuildings },
        { label: 'Total Research', value: Game.stats.totalResearch },
        { label: 'Total Prestiges', value: Game.stats.totalPrestiges },
        { label: 'Credits Earned', value: formatNumber(Game.stats.totalCreditsEarned) },
        { label: 'Events Experienced', value: Game.stats.totalEvents },
        { label: 'Power Efficiency', value: Math.floor(powerEff * 100) + '%' },
        { label: 'Power Gen / Use', value: `${formatNumber(Game.powerGen)} / ${formatNumber(Game.powerUse)} MW` },
        { label: 'Singularity Shards', value: formatNumber(Game.resources.singularityShards || 0) },
        { label: 'Achievements', value: `${Object.keys(Game.achievementsUnlocked).length} / ${ACHIEVEMENTS.length}` },
    ];

    statsGrid.innerHTML = '';
    for (const s of stats) {
        statsGrid.innerHTML += `<div class="stat-card"><div class="stat-label">${s.label}</div><div class="stat-val">${s.value}</div></div>`;
    }

    // Achievements
    document.getElementById('achievement-count').textContent = Object.keys(Game.achievementsUnlocked).length;
    document.getElementById('achievement-total').textContent = ACHIEVEMENTS.length;

    const achGrid = document.getElementById('achievements-list');
    achGrid.innerHTML = '';
    for (const ach of ACHIEVEMENTS) {
        const unlocked = Game.achievementsUnlocked[ach.id] || false;
        const card = document.createElement('div');
        card.className = `achievement-card ${unlocked ? 'unlocked' : 'locked'}`;
        card.innerHTML = `
            <span class="ach-icon">${ach.icon}</span>
            <div class="ach-info">
                <div class="ach-name">${ach.name}</div>
                <div class="ach-desc">${unlocked ? ach.desc : '???'}</div>
                ${ach.reward ? `<div class="ach-reward">${ach.reward}</div>` : ''}
            </div>
        `;
        achGrid.appendChild(card);
    }
}

// ==================== GAME ACTIONS ====================

function gatherResource(resKey) {
    const cap = getResourceCap(resKey);
    const amount = Game.multipliers.clickPower;
    const current = Game.resources[resKey] || 0;
    if (current >= cap) {
        showToast(`${RESOURCE_DEFS[resKey].name} storage full!`, 'warning');
        return;
    }
    Game.resources[resKey] = Math.min(cap, current + amount);
    Game.stats.totalClicks++;
    Game.stats.totalProduced[resKey] = (Game.stats.totalProduced[resKey] || 0) + amount;
}

function buildBuilding(key) {
    if (!isBuildingUnlocked(key)) return;
    const costs = getBuildingCost(key);
    if (!canAfford(costs)) return;
    spendResources(costs);
    Game.buildings[key]++;
    Game.stats.totalBuildings++;
    addLog(`Built ${BUILDING_DEFS[key].name} (now ${Game.buildings[key]})`, '');
    showToast(`🏗️ Built ${BUILDING_DEFS[key].name}`, 'success');
    renderBuildings();
}

function doResearch(key) {
    if (Game.research[key] || !isResearchAvailable(key)) return;
    const costs = getResearchCost(key);
    if (!canAfford(costs)) return;
    spendResources(costs);
    Game.research[key] = true;
    Game.stats.totalResearch++;
    RESEARCH_DEFS[key].apply();
    addLog(`Researched: ${RESEARCH_DEFS[key].name}`, '');
    showToast(`🔬 Researched: ${RESEARCH_DEFS[key].name}`, 'success');
    renderResearch();
    renderBuildings();
    renderAutomation();
}

function buyPrestigeUpgrade(id) {
    const upg = PRESTIGE_UPGRADES.find(u => u.id === id);
    if (!upg || Game.prestigeUpgradesPurchased[id]) return;
    if ((Game.resources.singularityShards || 0) < upg.cost) return;
    Game.resources.singularityShards -= upg.cost;
    Game.prestigeUpgradesPurchased[id] = true;
    Game.stats.totalPrestigeUpgrades++;
    upg.effect();
    addLog(`Purchased prestige upgrade: ${upg.name}`, 'prestige');
    showToast(`✨ ${upg.name} purchased!`, 'prestige');
    renderPrestige();
}

// ==================== SAVE / LOAD ====================

function saveGame() {
    const saveData = {
        version: Game.version,
        resources: Game.resources,
        buildings: Game.buildings,
        research: Game.research,
        settings: Game.settings,
        unlocks: Game.unlocks,
        bonusCaps: Game.bonusCaps,
        prestigePerks: Game.prestigePerks,
        prestigeUpgradesPurchased: Game.prestigeUpgradesPurchased,
        autoSellers: Game.autoSellers,
        taskQueue: Game.taskQueue,
        blueprints: Game.blueprints,
        stats: Game.stats,
        achievementsUnlocked: Game.achievementsUnlocked,
        lastSave: Date.now(),
    };
    try {
        localStorage.setItem('automata_save', JSON.stringify(saveData));
        Game.lastSave = Date.now();
    } catch (e) {
        console.error('Save failed:', e);
    }
}

function loadGame() {
    try {
        const raw = localStorage.getItem('automata_save');
        if (!raw) return false;
        const data = JSON.parse(raw);

        // Restore state
        Object.assign(Game.resources, data.resources || {});
        Object.assign(Game.buildings, data.buildings || {});
        Object.assign(Game.research, data.research || {});
        Object.assign(Game.settings, data.settings || {});
        Object.assign(Game.unlocks, data.unlocks || {});
        Object.assign(Game.bonusCaps, data.bonusCaps || {});
        Object.assign(Game.prestigePerks, data.prestigePerks || {});
        Object.assign(Game.prestigeUpgradesPurchased, data.prestigeUpgradesPurchased || {});
        Object.assign(Game.autoSellers, data.autoSellers || {});
        Game.taskQueue = data.taskQueue || [];
        Game.blueprints = data.blueprints || [];
        Object.assign(Game.stats, data.stats || {});
        Object.assign(Game.achievementsUnlocked, data.achievementsUnlocked || {});
        Game.lastSave = data.lastSave || Date.now();

        // Calculate offline progress
        if (Game.settings.offlineProgress && data.lastSave) {
            const offlineSeconds = (Date.now() - data.lastSave) / 1000;
            if (offlineSeconds > 10) {
                calculateOfflineProgress(offlineSeconds);
            }
        }

        return true;
    } catch (e) {
        console.error('Load failed:', e);
        return false;
    }
}

function calculateOfflineProgress(seconds) {
    // Cap at 24 hours
    seconds = Math.min(seconds, 86400);
    // Apply at 50% efficiency
    const effSeconds = seconds * 0.5;

    Game.stats.maxOfflineTime = Math.max(Game.stats.maxOfflineTime || 0, seconds);

    const rates = getProductionRates();
    const gains = {};

    for (const [resKey, rate] of Object.entries(rates)) {
        if (rate > 0) {
            const cap = getResourceCap(resKey);
            const gain = Math.min(rate * effSeconds, cap - (Game.resources[resKey] || 0));
            if (gain > 0) {
                Game.resources[resKey] = Math.min(cap, (Game.resources[resKey] || 0) + gain);
                Game.stats.totalProduced[resKey] = (Game.stats.totalProduced[resKey] || 0) + gain;
                gains[resKey] = gain;
            }
        }
    }

    // Show offline modal
    if (Object.keys(gains).length > 0) {
        const modal = document.getElementById('offline-modal');
        document.getElementById('offline-time').textContent = formatTime(seconds);
        const gainsList = document.getElementById('offline-gains');
        gainsList.innerHTML = '';
        for (const [key, amount] of Object.entries(gains)) {
            const def = RESOURCE_DEFS[key];
            if (def) {
                gainsList.innerHTML += `<div class="offline-gain-item"><span>${def.icon} ${def.name}</span><span class="gain-val">+${formatNumber(amount)}</span></div>`;
            }
        }
        modal.classList.remove('hidden');
    }
}

function exportSave() {
    saveGame();
    const raw = localStorage.getItem('automata_save');
    const area = document.getElementById('save-data-area');
    area.classList.remove('hidden');
    area.value = btoa(raw);
    area.select();
    try { document.execCommand('copy'); showToast('Save data copied to clipboard!', 'success'); }
    catch (e) { showToast('Save data shown - copy it manually', 'info'); }
}

function importSave() {
    const area = document.getElementById('save-data-area');
    area.classList.remove('hidden');
    area.value = '';
    area.placeholder = 'Paste save data here and press Enter...';
    area.focus();
    area.onkeydown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            try {
                const decoded = atob(area.value.trim());
                localStorage.setItem('automata_save', decoded);
                location.reload();
            } catch (e) {
                showToast('Invalid save data!', 'warning');
            }
        }
    };
}

function hardReset() {
    if (confirm('Are you sure? This will DELETE ALL progress permanently!')) {
        if (confirm('Really? This cannot be undone!')) {
            localStorage.removeItem('automata_save');
            location.reload();
        }
    }
}

// ==================== EVENT HANDLERS ====================

function setupEventHandlers() {
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const tab = btn.dataset.tab;
            document.getElementById(`tab-${tab}`).classList.add('active');
            Game.currentTab = tab;
            renderAll();
        });
    });

    // Gather buttons
    document.querySelectorAll('.btn-gather').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const res = btn.dataset.resource;
            gatherResource(res);
            // Ripple effect
            btn.classList.remove('clicked');
            void btn.offsetWidth;
            btn.classList.add('clicked');
            showNumberPop(btn, Game.multipliers.clickPower);
        });
    });

    // Building categories
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            Game.currentBuildingCategory = btn.dataset.category;
            renderBuildings();
        });
    });

    // Research branches
    document.querySelectorAll('.branch-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.branch-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            Game.currentResearchBranch = btn.dataset.branch;
            renderResearch();
        });
    });

    // Prestige button
    document.getElementById('btn-prestige').addEventListener('click', () => {
        if (confirm('Are you sure you want to prestige? All progress will be reset for Singularity Shards.')) {
            doPrestige();
        }
    });

    // Save button
    document.getElementById('btn-save').addEventListener('click', () => {
        saveGame();
        showToast('💾 Game saved!', 'success');
    });

    // Settings
    document.getElementById('btn-settings').addEventListener('click', () => {
        document.getElementById('modal-overlay').classList.remove('hidden');
    });
    document.getElementById('btn-close-modal').addEventListener('click', () => {
        document.getElementById('modal-overlay').classList.add('hidden');
    });
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
        if (e.target === document.getElementById('modal-overlay')) {
            document.getElementById('modal-overlay').classList.add('hidden');
        }
    });

    // Settings controls
    document.getElementById('setting-notation').addEventListener('change', (e) => {
        Game.settings.notation = e.target.value;
    });
    document.getElementById('setting-autosave').addEventListener('change', (e) => {
        Game.settings.autosaveInterval = parseInt(e.target.value);
    });
    document.getElementById('setting-offline').addEventListener('change', (e) => {
        Game.settings.offlineProgress = e.target.value === '1';
    });

    // Export/Import/Reset
    document.getElementById('btn-export').addEventListener('click', exportSave);
    document.getElementById('btn-import').addEventListener('click', importSave);
    document.getElementById('btn-hard-reset').addEventListener('click', hardReset);

    // Offline modal close
    document.getElementById('btn-close-offline').addEventListener('click', () => {
        document.getElementById('offline-modal').classList.add('hidden');
    });

    // Event log toggle
    document.getElementById('btn-toggle-log').addEventListener('click', () => {
        const log = document.getElementById('log-messages');
        log.classList.toggle('collapsed');
        document.getElementById('btn-toggle-log').textContent = log.classList.contains('collapsed') ? '▲' : '▼';
    });

    // Task queue
    document.getElementById('btn-add-task').addEventListener('click', () => {
        const select = document.getElementById('task-queue-select');
        if (select.value && Game.unlocks.taskQueue) {
            Game.taskQueue.push({ buildingKey: select.value });
            renderTaskQueue();
            showToast(`Added ${BUILDING_DEFS[select.value].name} to queue`, 'info');
        }
    });
    document.getElementById('btn-clear-queue').addEventListener('click', () => {
        Game.taskQueue = [];
        renderTaskQueue();
    });

    // Blueprint save
    document.getElementById('btn-save-blueprint').addEventListener('click', () => {
        if (!Game.unlocks.blueprints) {
            showToast('Unlock Blueprints through Research first!', 'warning');
            return;
        }
        const bp = {
            name: `Blueprint ${Game.blueprints.length + 1}`,
            buildings: { ...Game.buildings },
            timestamp: Date.now(),
        };
        Game.blueprints.push(bp);
        showToast('Blueprint saved!', 'success');
        renderBlueprints();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
        const keyMap = { '1': 'resources', '2': 'buildings', '3': 'research', '4': 'automation', '5': 'prestige', '6': 'stats' };
        if (keyMap[e.key]) {
            document.querySelector(`.tab-btn[data-tab="${keyMap[e.key]}"]`).click();
        }
        if (e.key === 's' && e.ctrlKey) {
            e.preventDefault();
            saveGame();
            showToast('💾 Game saved!', 'success');
        }
    });
}

function renderBlueprints() {
    const list = document.getElementById('blueprints-list');
    if (Game.blueprints.length === 0) {
        list.innerHTML = '<div class="queue-empty">No blueprints saved</div>';
        return;
    }
    list.innerHTML = '';
    Game.blueprints.forEach((bp, i) => {
        const card = document.createElement('div');
        card.className = 'blueprint-card';
        const buildingCount = Object.values(bp.buildings).reduce((a, b) => a + b, 0);
        card.innerHTML = `
            <h4>${bp.name}</h4>
            <p>${buildingCount} buildings total</p>
            <button class="btn-action" onclick="loadBlueprint(${i})">Load</button>
            <button class="btn-action btn-danger" onclick="deleteBlueprint(${i})">Delete</button>
        `;
        list.appendChild(card);
    });
}

window.loadBlueprint = function(index) {
    const bp = Game.blueprints[index];
    if (!bp) return;
    // Add missing buildings to task queue
    for (const [key, count] of Object.entries(bp.buildings)) {
        const current = Game.buildings[key] || 0;
        for (let i = current; i < count; i++) {
            Game.taskQueue.push({ buildingKey: key });
        }
    }
    showToast('Blueprint loaded into task queue!', 'success');
    renderTaskQueue();
};

window.deleteBlueprint = function(index) {
    Game.blueprints.splice(index, 1);
    renderBlueprints();
};

// ==================== MAIN GAME LOOP ====================

function startGameLoop() {
    Game.lastTick = Date.now();

    function loop() {
        const now = Date.now();
        const dt = (now - Game.lastTick) / 1000;
        Game.lastTick = now;

        // Cap dt to prevent huge jumps
        const cappedDt = Math.min(dt, 1);
        gameTick(cappedDt);

        // Render at ~10fps for performance
        renderTicker();
        renderResourceBars();
        renderPower();

        // Full render less frequently
        if (Game.currentTab === 'buildings') renderBuildings();
        if (Game.currentTab === 'prestige') renderPrestige();
        if (Game.currentTab === 'stats') renderStats();

        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);

    // Auto-save
    setInterval(() => {
        saveGame();
    }, (Game.settings.autosaveInterval || 60) * 1000);
}

// ==================== BOOT ====================

document.addEventListener('DOMContentLoaded', () => {
    const loaded = loadGame();
    initGame();
    setupEventHandlers();
    renderAll();

    if (!loaded) {
        addLog('Welcome to Automata! Click resources to begin gathering.', '');
        showToast('Welcome to Automata! Start by gathering resources.', 'info');
    }

    startGameLoop();
    console.log('⚡ Automata v' + Game.version + ' initialized');
});
