/* ============================================
   AUTOMATA - Resource Management & Automation Game
   Complete Game Engine
   ============================================ */

// ==========================================
// NUMBER FORMATTING
// ==========================================
const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

function formatNumber(n, decimals = 1) {
    if (n === undefined || n === null || isNaN(n)) return '0';
    if (n < 0) return '-' + formatNumber(-n, decimals);
    if (n < 1000) return n < 10 ? n.toFixed(decimals) : Math.floor(n).toString();
    let tier = Math.floor(Math.log10(Math.abs(n)) / 3);
    if (tier >= SUFFIXES.length) tier = SUFFIXES.length - 1;
    const suffix = SUFFIXES[tier];
    const scale = Math.pow(10, tier * 3);
    const scaled = n / scale;
    return scaled.toFixed(decimals) + suffix;
}

function formatRate(n) {
    const sign = n >= 0 ? '+' : '';
    return sign + formatNumber(n, 1) + '/s';
}

function formatTime(seconds) {
    if (seconds < 60) return Math.floor(seconds) + 's';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ' + Math.floor(seconds % 60) + 's';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ' + Math.floor((seconds % 3600) / 60) + 'm';
    return Math.floor(seconds / 86400) + 'd ' + Math.floor((seconds % 86400) / 3600) + 'h';
}

// ==========================================
// GAME DATA DEFINITIONS
// ==========================================

/** Resource definitions with caps and tiers */
const RESOURCES = {
    // Tier 1 - Raw
    energy:       { name: 'Energy',        icon: '⚡', tier: 1, baseCap: 500 },
    minerals:     { name: 'Minerals',      icon: '💎', tier: 1, baseCap: 500 },
    data:         { name: 'Data',          icon: '📊', tier: 1, baseCap: 500 },
    // Tier 2 - Processed
    circuits:     { name: 'Circuits',      icon: '🔌', tier: 2, baseCap: 200 },
    alloys:       { name: 'Alloys',        icon: '🔩', tier: 2, baseCap: 200 },
    code:         { name: 'Code Modules',  icon: '💻', tier: 2, baseCap: 200 },
    // Tier 3 - Advanced
    aiCores:      { name: 'AI Cores',      icon: '🧠', tier: 3, baseCap: 50 },
    quantumCells: { name: 'Quantum Cells', icon: '⚛️', tier: 3, baseCap: 50 },
    nanofibers:   { name: 'Nanofibers',    icon: '🧬', tier: 3, baseCap: 50 },
    // Tier 4 - Prestige (no cap)
    shards:       { name: 'Singularity Shards', icon: '🔮', tier: 4, baseCap: Infinity },
};

/** Crafting recipes */
const RECIPES = {
    circuits:     { output: 'circuits',     amount: 1, inputs: { energy: 20, data: 10 } },
    alloys:       { output: 'alloys',       amount: 1, inputs: { minerals: 25, energy: 10 } },
    code:         { output: 'code',         amount: 1, inputs: { data: 20, energy: 15 } },
    aiCores:      { output: 'aiCores',      amount: 1, inputs: { circuits: 10, code: 8 } },
    quantumCells: { output: 'quantumCells', amount: 1, inputs: { circuits: 8, alloys: 10 } },
    nanofibers:   { output: 'nanofibers',   amount: 1, inputs: { alloys: 8, code: 10 } },
};

/** Building definitions */
const BUILDINGS = {
    // Extractors
    energyDrill:    { name: 'Energy Drill',     icon: '⛏️', category: 'extractors', desc: 'Generates energy passively', produces: { energy: 1.5 }, consumes: {}, baseCost: { energy: 15 }, costScale: 1.15, powerUse: 0, unlocked: true },
    mineralMiner:   { name: 'Mineral Miner',    icon: '💎', category: 'extractors', desc: 'Extracts minerals from the ground', produces: { minerals: 1.2 }, consumes: {}, baseCost: { minerals: 10, energy: 20 }, costScale: 1.15, powerUse: 1, unlocked: true },
    dataScanner:    { name: 'Data Scanner',     icon: '📡', category: 'extractors', desc: 'Scans for data fragments', produces: { data: 1.0 }, consumes: {}, baseCost: { energy: 25, data: 5 }, costScale: 1.15, powerUse: 1, unlocked: true },
    // Processors
    circuitFoundry: { name: 'Circuit Foundry',  icon: '🔌', category: 'processors', desc: 'Converts energy + data into circuits', produces: { circuits: 0.3 }, consumes: { energy: 2, data: 1 }, baseCost: { energy: 100, data: 50 }, costScale: 1.18, powerUse: 3, unlocked: false },
    alloySmelter:   { name: 'Alloy Smelter',    icon: '🔩', category: 'processors', desc: 'Smelts minerals + energy into alloys', produces: { alloys: 0.25 }, consumes: { minerals: 2.5, energy: 1 }, baseCost: { minerals: 80, energy: 80 }, costScale: 1.18, powerUse: 3, unlocked: false },
    codeCompiler:   { name: 'Code Compiler',    icon: '💻', category: 'processors', desc: 'Compiles data + energy into code modules', produces: { code: 0.25 }, consumes: { data: 2, energy: 1.5 }, baseCost: { data: 80, energy: 60 }, costScale: 1.18, powerUse: 3, unlocked: false },
    // Factories
    aiLab:          { name: 'AI Lab',           icon: '🧠', category: 'factories', desc: 'Produces AI Cores from circuits + code', produces: { aiCores: 0.05 }, consumes: { circuits: 0.5, code: 0.4 }, baseCost: { circuits: 50, code: 40, energy: 200 }, costScale: 1.22, powerUse: 8, unlocked: false },
    quantumReactor: { name: 'Quantum Reactor',  icon: '⚛️', category: 'factories', desc: 'Creates quantum cells from circuits + alloys', produces: { quantumCells: 0.04 }, consumes: { circuits: 0.4, alloys: 0.5 }, baseCost: { circuits: 40, alloys: 50, energy: 200 }, costScale: 1.22, powerUse: 8, unlocked: false },
    nanoAssembler:  { name: 'Nano Assembler',   icon: '🧬', category: 'factories', desc: 'Assembles nanofibers from alloys + code', produces: { nanofibers: 0.04 }, consumes: { alloys: 0.4, code: 0.5 }, baseCost: { alloys: 40, code: 50, energy: 200 }, costScale: 1.22, powerUse: 8, unlocked: false },
    // Storage
    energyBank:     { name: 'Energy Bank',      icon: '🔋', category: 'storage', desc: '+500 energy storage', produces: {}, consumes: {}, baseCost: { energy: 50, minerals: 30 }, costScale: 1.2, powerUse: 0, unlocked: true, storageBonus: { energy: 500 } },
    mineralVault:   { name: 'Mineral Vault',    icon: '🏦', category: 'storage', desc: '+500 mineral storage', produces: {}, consumes: {}, baseCost: { minerals: 50, energy: 30 }, costScale: 1.2, powerUse: 0, unlocked: true, storageBonus: { minerals: 500 } },
    dataArchive:    { name: 'Data Archive',     icon: '💾', category: 'storage', desc: '+500 data storage', produces: {}, consumes: {}, baseCost: { data: 40, energy: 40 }, costScale: 1.2, powerUse: 0, unlocked: true, storageBonus: { data: 500 } },
    advancedStorage:{ name: 'Advanced Storage',  icon: '📦', category: 'storage', desc: '+200 T2 storage (all)', produces: {}, consumes: {}, baseCost: { circuits: 20, alloys: 20, code: 20 }, costScale: 1.25, powerUse: 1, unlocked: false, storageBonus: { circuits: 200, alloys: 200, code: 200 } },
    quantumVault:   { name: 'Quantum Vault',    icon: '🔐', category: 'storage', desc: '+50 T3 storage (all)', produces: {}, consumes: {}, baseCost: { aiCores: 5, quantumCells: 5, nanofibers: 5 }, costScale: 1.3, powerUse: 2, unlocked: false, storageBonus: { aiCores: 50, quantumCells: 50, nanofibers: 50 } },
    // Power
    solarPanel:     { name: 'Solar Panel',      icon: '☀️', category: 'power', desc: '+5 MW power generation', produces: {}, consumes: {}, baseCost: { energy: 30, minerals: 20 }, costScale: 1.12, powerUse: -5, unlocked: true },
    fusionPlant:    { name: 'Fusion Plant',     icon: '🌟', category: 'power', desc: '+25 MW power generation', produces: {}, consumes: {}, baseCost: { alloys: 30, circuits: 20, energy: 500 }, costScale: 1.2, powerUse: -25, unlocked: false },
    darkMatterGen:  { name: 'Dark Matter Gen',  icon: '🌑', category: 'power', desc: '+100 MW power generation', produces: {}, consumes: {}, baseCost: { quantumCells: 10, aiCores: 5, nanofibers: 5 }, costScale: 1.25, powerUse: -100, unlocked: false },
};

/** Research definitions - 35 techs */
const RESEARCH = {
    // Efficiency branch
    efficientDrills:    { name: 'Efficient Drills',     branch: 'efficiency', desc: 'Energy drills produce 50% more', cost: { energy: 100, data: 50 }, requires: [], effect: () => { Game.researchBonuses.energyDrillMult = 1.5; } },
    efficientMiners:    { name: 'Efficient Miners',     branch: 'efficiency', desc: 'Mineral miners produce 50% more', cost: { minerals: 100, energy: 50 }, requires: [], effect: () => { Game.researchBonuses.mineralMinerMult = 1.5; } },
    efficientScanners:  { name: 'Efficient Scanners',   branch: 'efficiency', desc: 'Data scanners produce 50% more', cost: { data: 100, energy: 50 }, requires: [], effect: () => { Game.researchBonuses.dataScannerMult = 1.5; } },
    advancedRefining:   { name: 'Advanced Refining',    branch: 'efficiency', desc: 'Processors use 25% less input', cost: { circuits: 30, energy: 200 }, requires: ['efficientDrills'], effect: () => { Game.researchBonuses.processorEfficiency = 0.75; } },
    quantumOptimize:    { name: 'Quantum Optimization', branch: 'efficiency', desc: 'All production +25%', cost: { quantumCells: 5, aiCores: 3 }, requires: ['advancedRefining'], effect: () => { Game.researchBonuses.globalProductionMult = 1.25; } },
    hyperEfficiency:    { name: 'Hyper Efficiency',     branch: 'efficiency', desc: 'All production +50% (stacks)', cost: { quantumCells: 15, aiCores: 10, nanofibers: 10 }, requires: ['quantumOptimize'], effect: () => { Game.researchBonuses.globalProductionMult *= 1.5; } },
    
    // Capacity branch
    expandedStorage1:   { name: 'Expanded Storage I',   branch: 'capacity', desc: 'T1 base storage +500', cost: { energy: 80, minerals: 80 }, requires: [], effect: () => { Game.researchBonuses.t1StorageBonus += 500; } },
    expandedStorage2:   { name: 'Expanded Storage II',  branch: 'capacity', desc: 'T1 base storage +1000 more', cost: { circuits: 20, alloys: 20 }, requires: ['expandedStorage1'], effect: () => { Game.researchBonuses.t1StorageBonus += 1000; } },
    t2Storage:          { name: 'T2 Storage Tech',      branch: 'capacity', desc: 'T2 base storage +200', cost: { circuits: 40, energy: 200 }, requires: ['expandedStorage1'], effect: () => { Game.researchBonuses.t2StorageBonus += 200; } },
    t3Storage:          { name: 'T3 Storage Tech',      branch: 'capacity', desc: 'T3 base storage +50', cost: { aiCores: 5, quantumCells: 5 }, requires: ['t2Storage'], effect: () => { Game.researchBonuses.t3StorageBonus += 50; } },
    massStorage:        { name: 'Mass Storage',         branch: 'capacity', desc: 'All storage buildings 2x effective', cost: { nanofibers: 10, quantumCells: 10 }, requires: ['t3Storage'], effect: () => { Game.researchBonuses.storageBuildingMult = 2; } },
    infiniteWarehouse:  { name: 'Infinite Warehouse',   branch: 'capacity', desc: 'All storage +100%', cost: { aiCores: 20, quantumCells: 15, nanofibers: 15 }, requires: ['massStorage'], effect: () => { Game.researchBonuses.storageGlobalMult = 2; } },

    // Automation branch
    basicAutomation:    { name: 'Basic Automation',     branch: 'automation', desc: 'Unlock auto-buyers for extractors', cost: { data: 100, circuits: 10 }, requires: [], effect: () => { Game.automationUnlocks.autoBuyExtractors = true; } },
    autoCrafting:       { name: 'Auto-Crafting',        branch: 'automation', desc: 'Unlock auto-crafters for T2', cost: { circuits: 30, code: 20 }, requires: ['basicAutomation'], effect: () => { Game.automationUnlocks.autoCraftT2 = true; } },
    advancedAutomation: { name: 'Advanced Automation',  branch: 'automation', desc: 'Unlock auto-buyers for processors', cost: { code: 40, circuits: 40 }, requires: ['autoCrafting'], effect: () => { Game.automationUnlocks.autoBuyProcessors = true; } },
    smartRouting:       { name: 'Smart Routing',        branch: 'automation', desc: 'Unlock auto-crafters for T3', cost: { aiCores: 5, code: 50 }, requires: ['advancedAutomation'], effect: () => { Game.automationUnlocks.autoCraftT3 = true; } },
    factoryAutomation:  { name: 'Factory Automation',   branch: 'automation', desc: 'Unlock auto-buyers for factories', cost: { aiCores: 10, code: 60 }, requires: ['smartRouting'], effect: () => { Game.automationUnlocks.autoBuyFactories = true; } },
    autoSelling:        { name: 'Auto-Selling',         branch: 'automation', desc: 'Unlock auto-sellers', cost: { aiCores: 8, circuits: 50 }, requires: ['advancedAutomation'], effect: () => { Game.automationUnlocks.autoSell = true; } },
    fullAutomation:     { name: 'Full Automation',      branch: 'automation', desc: 'Auto-buyers for storage & power', cost: { aiCores: 15, quantumCells: 10, nanofibers: 10 }, requires: ['factoryAutomation'], effect: () => { Game.automationUnlocks.autoBuyAll = true; } },

    // Expansion branch
    unlockProcessors:   { name: 'Processing Tech',     branch: 'expansion', desc: 'Unlock processor buildings', cost: { energy: 150, minerals: 100, data: 100 }, requires: [], effect: () => { Game.unlockBuildings(['circuitFoundry', 'alloySmelter', 'codeCompiler', 'advancedStorage']); } },
    unlockFactories:    { name: 'Factory Tech',        branch: 'expansion', desc: 'Unlock factory buildings', cost: { circuits: 60, alloys: 60, code: 60 }, requires: ['unlockProcessors'], effect: () => { Game.unlockBuildings(['aiLab', 'quantumReactor', 'nanoAssembler', 'quantumVault']); } },
    fusionTech:         { name: 'Fusion Technology',    branch: 'expansion', desc: 'Unlock Fusion Plants', cost: { circuits: 40, alloys: 30, energy: 300 }, requires: ['unlockProcessors'], effect: () => { Game.unlockBuildings(['fusionPlant']); } },
    darkMatterTech:     { name: 'Dark Matter Tech',     branch: 'expansion', desc: 'Unlock Dark Matter Generators', cost: { quantumCells: 8, aiCores: 5 }, requires: ['unlockFactories', 'fusionTech'], effect: () => { Game.unlockBuildings(['darkMatterGen']); } },
    doubleExtractors:   { name: 'Extractor Overdrive',  branch: 'expansion', desc: 'Extractors produce 2x', cost: { alloys: 50, circuits: 50 }, requires: ['unlockProcessors'], effect: () => { Game.researchBonuses.extractorMult = 2; } },
    doubleProcessors:   { name: 'Processor Overdrive',  branch: 'expansion', desc: 'Processors produce 2x', cost: { aiCores: 10, nanofibers: 8 }, requires: ['unlockFactories', 'doubleExtractors'], effect: () => { Game.researchBonuses.processorMult = 2; } },
    doubleFactories:    { name: 'Factory Overdrive',    branch: 'expansion', desc: 'Factories produce 2x', cost: { aiCores: 20, quantumCells: 15, nanofibers: 15 }, requires: ['doubleProcessors'], effect: () => { Game.researchBonuses.factoryMult = 2; } },

    // Transcendence branch
    singularityTheory:  { name: 'Singularity Theory',  branch: 'transcendence', desc: 'Unlock the Prestige system', cost: { aiCores: 15, quantumCells: 10, nanofibers: 10 }, requires: ['unlockFactories'], effect: () => { Game.prestigeUnlocked = true; } },
    shardAmplifier:     { name: 'Shard Amplifier',     branch: 'transcendence', desc: 'Earn 50% more shards on prestige', cost: { aiCores: 25, quantumCells: 20, nanofibers: 20 }, requires: ['singularityTheory'], effect: () => { Game.researchBonuses.shardMult = 1.5; } },
    temporalEcho:       { name: 'Temporal Echo',        branch: 'transcendence', desc: 'Start with 50 of each T1 after prestige', cost: { aiCores: 30, quantumCells: 25, nanofibers: 25 }, requires: ['shardAmplifier'], effect: () => { Game.researchBonuses.prestigeStartBonus = 50; } },
    dimensionalRift:    { name: 'Dimensional Rift',     branch: 'transcendence', desc: 'All production x2 per prestige count', cost: { aiCores: 40, quantumCells: 30, nanofibers: 30 }, requires: ['temporalEcho'], effect: () => { Game.researchBonuses.prestigeProductionMult = true; } },
    transcendence:      { name: 'Transcendence',        branch: 'transcendence', desc: 'Ultimate tech: all production x5', cost: { aiCores: 50, quantumCells: 50, nanofibers: 50 }, requires: ['dimensionalRift'], effect: () => { Game.researchBonuses.transcendenceMult = 5; } },
    clickPower1:        { name: 'Enhanced Clicking',    branch: 'efficiency', desc: 'Manual gathering gives 5x resources', cost: { energy: 200, minerals: 200, data: 200 }, requires: ['efficientDrills', 'efficientMiners', 'efficientScanners'], effect: () => { Game.researchBonuses.clickMult = 5; } },
    clickPower2:        { name: 'Mega Clicking',        branch: 'efficiency', desc: 'Manual gathering gives 25x resources', cost: { circuits: 100, alloys: 100, code: 100 }, requires: ['clickPower1'], effect: () => { Game.researchBonuses.clickMult = 25; } },
};

/** Prestige upgrades */
const PRESTIGE_UPGRADES = {
    shardBoost1:     { name: 'Shard Resonance I',    desc: 'All production +10% per shard (up to 100%)', cost: 1, maxLevel: 1 },
    shardBoost2:     { name: 'Shard Resonance II',   desc: 'All production +25% per shard (up to 250%)', cost: 5, maxLevel: 1, requires: 'shardBoost1' },
    startEnergy:     { name: 'Energy Jumpstart',     desc: 'Start with 200 energy after prestige', cost: 2, maxLevel: 1 },
    startMinerals:   { name: 'Mineral Jumpstart',    desc: 'Start with 200 minerals after prestige', cost: 2, maxLevel: 1 },
    startData:       { name: 'Data Jumpstart',       desc: 'Start with 200 data after prestige', cost: 2, maxLevel: 1 },
    keepExtractors:  { name: 'Extractor Memory',     desc: 'Keep 1 of each extractor after prestige', cost: 3, maxLevel: 1 },
    keepResearch1:   { name: 'Research Memory I',    desc: 'Keep T1 efficiency research after prestige', cost: 5, maxLevel: 1 },
    autoUnlock:      { name: 'Auto-Start',           desc: 'Start with basic automation unlocked', cost: 4, maxLevel: 1 },
    shardMultiplier: { name: 'Shard Multiplier',     desc: 'Earn 2x shards on prestige', cost: 10, maxLevel: 1 },
    storageBoost:    { name: 'Expanded Foundations',  desc: 'All base storage x2', cost: 3, maxLevel: 1 },
    powerBoost:      { name: 'Power Surplus',        desc: 'Start with +50 MW base power', cost: 4, maxLevel: 1 },
    clickBoost:      { name: 'Click Amplifier',      desc: 'Manual clicks give 10x resources', cost: 3, maxLevel: 1 },
};

/** Milestones */
const MILESTONES = [
    { id: 'first_prestige',  name: 'First Singularity',   desc: 'Perform your first prestige', icon: '🔮', check: () => Game.stats.totalPrestiges >= 1 },
    { id: 'prestige_5',      name: 'Experienced',          desc: 'Prestige 5 times', icon: '⭐', check: () => Game.stats.totalPrestiges >= 5 },
    { id: 'prestige_10',     name: 'Veteran',              desc: 'Prestige 10 times', icon: '🌟', check: () => Game.stats.totalPrestiges >= 10 },
    { id: 'shards_10',       name: 'Shard Collector',      desc: 'Accumulate 10 total shards', icon: '💎', check: () => Game.stats.totalShardsEarned >= 10 },
    { id: 'shards_50',       name: 'Shard Hoarder',        desc: 'Accumulate 50 total shards', icon: '💰', check: () => Game.stats.totalShardsEarned >= 50 },
    { id: 'shards_100',      name: 'Shard Master',         desc: 'Accumulate 100 total shards', icon: '👑', check: () => Game.stats.totalShardsEarned >= 100 },
];

/** Achievements - 55 achievements */
const ACHIEVEMENTS = [
    // Resource gathering
    { id: 'gather_1',        name: 'First Click',          desc: 'Gather a resource manually', icon: '👆', reward: 'Click power +1', check: () => Game.stats.totalClicks >= 1 },
    { id: 'gather_100',      name: 'Clicker',              desc: 'Click 100 times', icon: '👆', reward: 'Click power +2', check: () => Game.stats.totalClicks >= 100 },
    { id: 'gather_1000',     name: 'Click Master',         desc: 'Click 1,000 times', icon: '🖱️', reward: 'Click power +5', check: () => Game.stats.totalClicks >= 1000 },
    { id: 'gather_10000',    name: 'Click Legend',          desc: 'Click 10,000 times', icon: '⚡', reward: 'Click power +10', check: () => Game.stats.totalClicks >= 10000 },
    // Energy milestones
    { id: 'energy_100',      name: 'Powered Up',           desc: 'Accumulate 100 energy', icon: '⚡', reward: '+5% energy production', check: () => Game.stats.totalEnergyGathered >= 100 },
    { id: 'energy_1000',     name: 'Energy Surplus',       desc: 'Accumulate 1,000 energy', icon: '⚡', reward: '+10% energy production', check: () => Game.stats.totalEnergyGathered >= 1000 },
    { id: 'energy_10000',    name: 'Power Plant',          desc: 'Accumulate 10,000 energy', icon: '⚡', reward: '+15% energy production', check: () => Game.stats.totalEnergyGathered >= 10000 },
    { id: 'energy_100000',   name: 'Energy Tycoon',        desc: 'Accumulate 100K energy', icon: '⚡', reward: '+20% energy production', check: () => Game.stats.totalEnergyGathered >= 100000 },
    // Mineral milestones
    { id: 'minerals_100',    name: 'Prospector',           desc: 'Accumulate 100 minerals', icon: '💎', reward: '+5% mineral production', check: () => Game.stats.totalMineralsGathered >= 100 },
    { id: 'minerals_1000',   name: 'Mining Corp',          desc: 'Accumulate 1,000 minerals', icon: '💎', reward: '+10% mineral production', check: () => Game.stats.totalMineralsGathered >= 1000 },
    { id: 'minerals_10000',  name: 'Mineral Baron',        desc: 'Accumulate 10,000 minerals', icon: '💎', reward: '+15% mineral production', check: () => Game.stats.totalMineralsGathered >= 10000 },
    // Data milestones
    { id: 'data_100',        name: 'Data Miner',           desc: 'Accumulate 100 data', icon: '📊', reward: '+5% data production', check: () => Game.stats.totalDataGathered >= 100 },
    { id: 'data_1000',       name: 'Data Center',          desc: 'Accumulate 1,000 data', icon: '📊', reward: '+10% data production', check: () => Game.stats.totalDataGathered >= 1000 },
    { id: 'data_10000',      name: 'Big Data',             desc: 'Accumulate 10,000 data', icon: '📊', reward: '+15% data production', check: () => Game.stats.totalDataGathered >= 10000 },
    // Building milestones
    { id: 'build_1',         name: 'Constructor',          desc: 'Build your first building', icon: '🏗️', reward: 'Unlocked!', check: () => Game.stats.totalBuildingsBuilt >= 1 },
    { id: 'build_10',        name: 'Developer',            desc: 'Build 10 buildings', icon: '🏗️', reward: '+5% all production', check: () => Game.stats.totalBuildingsBuilt >= 10 },
    { id: 'build_50',        name: 'Architect',            desc: 'Build 50 buildings', icon: '🏗️', reward: '+10% all production', check: () => Game.stats.totalBuildingsBuilt >= 50 },
    { id: 'build_100',       name: 'Mega Builder',         desc: 'Build 100 buildings', icon: '🏗️', reward: '+15% all production', check: () => Game.stats.totalBuildingsBuilt >= 100 },
    { id: 'build_500',       name: 'City Planner',         desc: 'Build 500 buildings', icon: '🏙️', reward: '+25% all production', check: () => Game.stats.totalBuildingsBuilt >= 500 },
    // Research milestones
    { id: 'research_1',      name: 'Researcher',           desc: 'Complete first research', icon: '🔬', reward: 'Unlocked!', check: () => Game.stats.totalResearchCompleted >= 1 },
    { id: 'research_5',      name: 'Scientist',            desc: 'Complete 5 researches', icon: '🔬', reward: '+5% all production', check: () => Game.stats.totalResearchCompleted >= 5 },
    { id: 'research_10',     name: 'Professor',            desc: 'Complete 10 researches', icon: '🔬', reward: '+10% all production', check: () => Game.stats.totalResearchCompleted >= 10 },
    { id: 'research_20',     name: 'Genius',               desc: 'Complete 20 researches', icon: '🧠', reward: '+15% all production', check: () => Game.stats.totalResearchCompleted >= 20 },
    { id: 'research_all',    name: 'Omniscient',           desc: 'Complete all research', icon: '🌟', reward: '+50% all production', check: () => Game.stats.totalResearchCompleted >= Object.keys(RESEARCH).length },
    // T2 resources
    { id: 'circuits_1',      name: 'First Circuit',        desc: 'Craft your first circuit', icon: '🔌', reward: 'Unlocked!', check: () => Game.stats.totalCircuitsCrafted >= 1 },
    { id: 'alloys_1',        name: 'First Alloy',          desc: 'Craft your first alloy', icon: '🔩', reward: 'Unlocked!', check: () => Game.stats.totalAlloysCrafted >= 1 },
    { id: 'code_1',          name: 'First Code',           desc: 'Compile your first code module', icon: '💻', reward: 'Unlocked!', check: () => Game.stats.totalCodeCrafted >= 1 },
    // T3 resources
    { id: 'aicore_1',        name: 'Artificial Mind',      desc: 'Create your first AI Core', icon: '🧠', reward: '+10% all production', check: () => Game.stats.totalAICoresCrafted >= 1 },
    { id: 'qcell_1',         name: 'Quantum Leap',         desc: 'Create your first Quantum Cell', icon: '⚛️', reward: '+10% all production', check: () => Game.stats.totalQuantumCellsCrafted >= 1 },
    { id: 'nano_1',          name: 'Nano Revolution',      desc: 'Create your first Nanofiber', icon: '🧬', reward: '+10% all production', check: () => Game.stats.totalNanofibersCrafted >= 1 },
    // Prestige
    { id: 'prestige_1',      name: 'Singularity',          desc: 'Perform your first prestige', icon: '🔮', reward: 'Permanent bonus!', check: () => Game.stats.totalPrestiges >= 1 },
    { id: 'prestige_3',      name: 'Recurring',            desc: 'Prestige 3 times', icon: '🔮', reward: '+10% shard gain', check: () => Game.stats.totalPrestiges >= 3 },
    { id: 'prestige_5a',     name: 'Cycle Master',         desc: 'Prestige 5 times', icon: '🔮', reward: '+20% shard gain', check: () => Game.stats.totalPrestiges >= 5 },
    { id: 'prestige_10a',    name: 'Eternal',              desc: 'Prestige 10 times', icon: '✨', reward: '+50% shard gain', check: () => Game.stats.totalPrestiges >= 10 },
    // Power
    { id: 'power_50',        name: 'Powered Grid',         desc: 'Have 50+ MW power capacity', icon: '⚡', reward: '+5% all production', check: () => Game.getPowerMax() >= 50 },
    { id: 'power_200',       name: 'Power Grid',           desc: 'Have 200+ MW power capacity', icon: '⚡', reward: '+10% all production', check: () => Game.getPowerMax() >= 200 },
    { id: 'power_500',       name: 'Mega Grid',            desc: 'Have 500+ MW power capacity', icon: '⚡', reward: '+15% all production', check: () => Game.getPowerMax() >= 500 },
    // Speed
    { id: 'energy_rate_10',  name: 'Energy Flow',          desc: 'Produce 10+ energy/s', icon: '⚡', reward: '+5% energy rate', check: () => Game.getProductionRate('energy') >= 10 },
    { id: 'energy_rate_100', name: 'Energy Torrent',       desc: 'Produce 100+ energy/s', icon: '⚡', reward: '+10% energy rate', check: () => Game.getProductionRate('energy') >= 100 },
    { id: 'mineral_rate_10', name: 'Mineral Stream',       desc: 'Produce 10+ minerals/s', icon: '💎', reward: '+5% mineral rate', check: () => Game.getProductionRate('minerals') >= 10 },
    { id: 'mineral_rate_100',name: 'Mineral Flood',        desc: 'Produce 100+ minerals/s', icon: '💎', reward: '+10% mineral rate', check: () => Game.getProductionRate('minerals') >= 100 },
    // Time
    { id: 'time_1h',         name: 'Dedicated',            desc: 'Play for 1 hour', icon: '⏰', reward: '+5% all production', check: () => Game.stats.totalTimePlayed >= 3600 },
    { id: 'time_8h',         name: 'Committed',            desc: 'Play for 8 hours', icon: '⏰', reward: '+10% all production', check: () => Game.stats.totalTimePlayed >= 28800 },
    { id: 'time_24h',        name: 'Obsessed',             desc: 'Play for 24 hours', icon: '⏰', reward: '+15% all production', check: () => Game.stats.totalTimePlayed >= 86400 },
    // Events
    { id: 'events_1',        name: 'Lucky',                desc: 'Experience your first event', icon: '🎲', reward: 'Unlocked!', check: () => Game.stats.totalEvents >= 1 },
    { id: 'events_10',       name: 'Event Horizon',        desc: 'Experience 10 events', icon: '🎲', reward: '+5% all production', check: () => Game.stats.totalEvents >= 10 },
    { id: 'events_50',       name: 'Chaos Theory',         desc: 'Experience 50 events', icon: '🎲', reward: '+10% all production', check: () => Game.stats.totalEvents >= 50 },
    // Automation
    { id: 'auto_1',          name: 'Automated',            desc: 'Enable your first auto-buyer', icon: '🤖', reward: 'Unlocked!', check: () => Game.stats.autoBuyersEnabled >= 1 },
    { id: 'auto_5',          name: 'Hands Free',           desc: 'Enable 5 automation features', icon: '🤖', reward: '+5% all production', check: () => Game.stats.autoBuyersEnabled >= 5 },
    // Storage
    { id: 'storage_5000',    name: 'Warehouse',            desc: 'Have 5,000+ energy storage', icon: '📦', reward: '+10% storage', check: () => Game.getResourceCap('energy') >= 5000 },
    { id: 'storage_50000',   name: 'Mega Warehouse',       desc: 'Have 50,000+ energy storage', icon: '📦', reward: '+20% storage', check: () => Game.getResourceCap('energy') >= 50000 },
    // Special
    { id: 'all_t2',          name: 'Processor Complete',   desc: 'Have all 3 T2 resources', icon: '⚙️', reward: '+10% T2 production', check: () => Game.resources.circuits > 0 && Game.resources.alloys > 0 && Game.resources.code > 0 },
    { id: 'all_t3',          name: 'Factory Complete',     desc: 'Have all 3 T3 resources', icon: '🏭', reward: '+10% T3 production', check: () => Game.resources.aiCores > 0 && Game.resources.quantumCells > 0 && Game.resources.nanofibers > 0 },
    { id: 'full_storage',    name: 'Overflowing',          desc: 'Fill any resource to cap', icon: '📦', reward: '+5% all production', check: () => { for (const r in RESOURCES) { if (RESOURCES[r].tier < 4 && Game.resources[r] >= Game.getResourceCap(r)) return true; } return false; } },
    { id: 'rich',            name: 'Tycoon',               desc: 'Have 10K+ of every T1 resource', icon: '💰', reward: '+20% all production', check: () => Game.resources.energy >= 10000 && Game.resources.minerals >= 10000 && Game.resources.data >= 10000 },
];

/** Random events */
const EVENTS = [
    { name: 'Solar Flare',      icon: '☀️', desc: 'Energy production doubled for 30s!', duration: 30, effect: 'energyBoost', mult: 2 },
    { name: 'Data Storm',       icon: '🌩️', desc: 'Data production doubled for 30s!', duration: 30, effect: 'dataBoost', mult: 2 },
    { name: 'Mineral Vein',     icon: '💎', desc: 'Mineral production doubled for 30s!', duration: 30, effect: 'mineralBoost', mult: 2 },
    { name: 'Power Surge',      icon: '⚡', desc: 'All production +50% for 20s!', duration: 20, effect: 'allBoost', mult: 1.5 },
    { name: 'Quantum Flux',     icon: '⚛️', desc: 'T3 production tripled for 15s!', duration: 15, effect: 't3Boost', mult: 3 },
    { name: 'System Glitch',    icon: '🐛', desc: 'Free 50 of each T1 resource!', duration: 0, effect: 'freeT1', amount: 50 },
    { name: 'Cache Found',      icon: '📦', desc: 'Free 10 of each T2 resource!', duration: 0, effect: 'freeT2', amount: 10 },
    { name: 'Inspiration',      icon: '💡', desc: 'Click power x5 for 30s!', duration: 30, effect: 'clickBoost', mult: 5 },
    { name: 'Efficiency Wave',  icon: '🌊', desc: 'Buildings use 50% less input for 25s!', duration: 25, effect: 'efficiencyBoost', mult: 0.5 },
    { name: 'Cosmic Ray',       icon: '🌠', desc: 'All production x3 for 10s!', duration: 10, effect: 'allBoost', mult: 3 },
];

// ==========================================
// GAME STATE
// ==========================================

const Game = {
    resources: {},
    buildings: {},
    research: {},
    prestigeUpgrades: {},
    milestones: {},
    achievements: {},
    automation: { buyers: {}, crafters: {}, sellers: {} },
    
    // Bonuses from research
    researchBonuses: {},
    automationUnlocks: {},
    prestigeUnlocked: false,
    
    // Active events
    activeEvents: [],
    eventTimer: 0,
    
    // Stats
    stats: {
        totalTimePlayed: 0,
        currentRunTime: 0,
        totalClicks: 0,
        totalBuildingsBuilt: 0,
        totalResearchCompleted: 0,
        totalPrestiges: 0,
        totalEnergyGathered: 0,
        totalMineralsGathered: 0,
        totalDataGathered: 0,
        totalShardsEarned: 0,
        totalCircuitsCrafted: 0,
        totalAlloysCrafted: 0,
        totalCodeCrafted: 0,
        totalAICoresCrafted: 0,
        totalQuantumCellsCrafted: 0,
        totalNanofibersCrafted: 0,
        totalEvents: 0,
        autoBuyersEnabled: 0,
    },
    
    lastSave: 0,
    lastTick: Date.now(),
    tickRate: 50, // ms per tick (20 ticks/sec)
    saveInterval: 30000, // 30 seconds
    
    // ==========================================
    // INITIALIZATION
    // ==========================================
    
    init() {
        this.resetState();
        this.loadGame();
        this.setupUI();
        this.startGameLoop();
        this.startAutoSave();
        console.log('Automata initialized!');
    },
    
    resetState() {
        // Initialize resources
        for (const key in RESOURCES) {
            this.resources[key] = 0;
        }
        // Initialize buildings
        for (const key in BUILDINGS) {
            this.buildings[key] = { count: 0, unlocked: BUILDINGS[key].unlocked };
        }
        // Initialize research
        for (const key in RESEARCH) {
            this.research[key] = false;
        }
        // Initialize prestige upgrades
        for (const key in PRESTIGE_UPGRADES) {
            this.prestigeUpgrades[key] = 0;
        }
        // Initialize milestones
        for (const m of MILESTONES) {
            this.milestones[m.id] = false;
        }
        // Initialize achievements
        for (const a of ACHIEVEMENTS) {
            this.achievements[a.id] = false;
        }
        // Initialize automation
        this.automation = { buyers: {}, crafters: {}, sellers: {} };
        for (const key in BUILDINGS) {
            this.automation.buyers[key] = false;
        }
        for (const key in RECIPES) {
            this.automation.crafters[key] = false;
        }
        for (const key in RESOURCES) {
            if (RESOURCES[key].tier < 4) this.automation.sellers[key] = false;
        }
        
        this.researchBonuses = {
            energyDrillMult: 1, mineralMinerMult: 1, dataScannerMult: 1,
            processorEfficiency: 1, globalProductionMult: 1,
            extractorMult: 1, processorMult: 1, factoryMult: 1,
            t1StorageBonus: 0, t2StorageBonus: 0, t3StorageBonus: 0,
            storageBuildingMult: 1, storageGlobalMult: 1,
            shardMult: 1, prestigeStartBonus: 0, prestigeProductionMult: false,
            transcendenceMult: 1, clickMult: 1,
        };
        this.automationUnlocks = {
            autoBuyExtractors: false, autoBuyProcessors: false, autoBuyFactories: false,
            autoBuyAll: false, autoCraftT2: false, autoCraftT3: false, autoSell: false,
        };
        this.prestigeUnlocked = false;
        this.activeEvents = [];
        this.eventTimer = 0;
    },
    
    // ==========================================
    // RESOURCE MANAGEMENT
    // ==========================================
    
    getResourceCap(resource) {
        const def = RESOURCES[resource];
        if (!def || def.tier === 4) return Infinity;
        
        let cap = def.baseCap;
        
        // Prestige upgrade: base storage x2
        if (this.prestigeUpgrades.storageBoost > 0) cap *= 2;
        
        // Research storage bonuses
        if (def.tier === 1) cap += this.researchBonuses.t1StorageBonus;
        if (def.tier === 2) cap += this.researchBonuses.t2StorageBonus;
        if (def.tier === 3) cap += this.researchBonuses.t3StorageBonus;
        
        // Building storage bonuses
        for (const bKey in BUILDINGS) {
            const bDef = BUILDINGS[bKey];
            if (bDef.storageBonus && bDef.storageBonus[resource]) {
                cap += bDef.storageBonus[resource] * this.buildings[bKey].count * this.researchBonuses.storageBuildingMult;
            }
        }
        
        // Global storage multiplier from research
        cap *= this.researchBonuses.storageGlobalMult;
        
        // Achievement bonuses
        if (this.achievements.storage_5000) cap *= 1.1;
        if (this.achievements.storage_50000) cap *= 1.2;
        
        return Math.floor(cap);
    },
    
    addResource(resource, amount) {
        const cap = this.getResourceCap(resource);
        this.resources[resource] = Math.min(this.resources[resource] + amount, cap);
        if (this.resources[resource] < 0) this.resources[resource] = 0;
    },
    
    canAfford(costs) {
        for (const r in costs) {
            if ((this.resources[r] || 0) < costs[r]) return false;
        }
        return true;
    },
    
    spendResources(costs) {
        for (const r in costs) {
            this.resources[r] -= costs[r];
        }
    },
    
    // ==========================================
    // PRODUCTION CALCULATIONS
    // ==========================================
    
    getProductionRate(resource) {
        let rate = 0;
        const powerOk = this.getPowerUsed() <= this.getPowerMax();
        
        for (const bKey in BUILDINGS) {
            const bDef = BUILDINGS[bKey];
            const count = this.buildings[bKey].count;
            if (count <= 0) continue;
            
            // Production
            if (bDef.produces[resource]) {
                let prod = bDef.produces[resource] * count;
                
                // Apply category multipliers
                if (bDef.category === 'extractors') {
                    prod *= this.researchBonuses.extractorMult;
                    // Specific extractor bonuses
                    if (bKey === 'energyDrill') prod *= this.researchBonuses.energyDrillMult;
                    if (bKey === 'mineralMiner') prod *= this.researchBonuses.mineralMinerMult;
                    if (bKey === 'dataScanner') prod *= this.researchBonuses.dataScannerMult;
                }
                if (bDef.category === 'processors') prod *= this.researchBonuses.processorMult;
                if (bDef.category === 'factories') prod *= this.researchBonuses.factoryMult;
                
                // Global production multiplier
                prod *= this.researchBonuses.globalProductionMult;
                prod *= this.researchBonuses.transcendenceMult;
                
                // Prestige production multiplier
                if (this.researchBonuses.prestigeProductionMult && this.stats.totalPrestiges > 0) {
                    prod *= (1 + this.stats.totalPrestiges * 0.5);
                }
                
                // Shard resonance
                if (this.prestigeUpgrades.shardBoost1 > 0) {
                    const shardBonus = Math.min(this.resources.shards * 0.1, 1.0);
                    prod *= (1 + shardBonus);
                }
                if (this.prestigeUpgrades.shardBoost2 > 0) {
                    const shardBonus = Math.min(this.resources.shards * 0.25, 2.5);
                    prod *= (1 + shardBonus);
                }
                
                // Achievement bonuses
                prod *= this.getAchievementProductionMult(resource);
                
                // Event bonuses
                prod *= this.getEventMult(resource, bDef.category);
                
                // Power check - non-power buildings need power
                if (bDef.powerUse > 0 && !powerOk) prod *= 0.1;
                
                rate += prod;
            }
            
            // Consumption
            if (bDef.consumes[resource]) {
                let cons = bDef.consumes[resource] * count;
                cons *= this.researchBonuses.processorEfficiency;
                
                // Event efficiency boost
                for (const evt of this.activeEvents) {
                    if (evt.effect === 'efficiencyBoost') cons *= evt.mult;
                }
                
                if (bDef.powerUse > 0 && !powerOk) cons *= 0.1;
                
                rate -= cons;
            }
        }
        
        return rate;
    },
    
    getAchievementProductionMult(resource) {
        let mult = 1;
        // General production achievements
        if (this.achievements.build_10) mult *= 1.05;
        if (this.achievements.build_50) mult *= 1.10;
        if (this.achievements.build_100) mult *= 1.15;
        if (this.achievements.build_500) mult *= 1.25;
        if (this.achievements.research_5) mult *= 1.05;
        if (this.achievements.research_10) mult *= 1.10;
        if (this.achievements.research_20) mult *= 1.15;
        if (this.achievements.research_all) mult *= 1.50;
        if (this.achievements.time_1h) mult *= 1.05;
        if (this.achievements.time_8h) mult *= 1.10;
        if (this.achievements.time_24h) mult *= 1.15;
        if (this.achievements.events_10) mult *= 1.05;
        if (this.achievements.events_50) mult *= 1.10;
        if (this.achievements.power_50) mult *= 1.05;
        if (this.achievements.power_200) mult *= 1.10;
        if (this.achievements.power_500) mult *= 1.15;
        if (this.achievements.auto_5) mult *= 1.05;
        if (this.achievements.full_storage) mult *= 1.05;
        if (this.achievements.rich) mult *= 1.20;
        if (this.achievements.aicore_1) mult *= 1.10;
        if (this.achievements.qcell_1) mult *= 1.10;
        if (this.achievements.nano_1) mult *= 1.10;
        
        // Resource-specific
        if (resource === 'energy') {
            if (this.achievements.energy_100) mult *= 1.05;
            if (this.achievements.energy_1000) mult *= 1.10;
            if (this.achievements.energy_10000) mult *= 1.15;
            if (this.achievements.energy_100000) mult *= 1.20;
            if (this.achievements.energy_rate_10) mult *= 1.05;
            if (this.achievements.energy_rate_100) mult *= 1.10;
        }
        if (resource === 'minerals') {
            if (this.achievements.minerals_100) mult *= 1.05;
            if (this.achievements.minerals_1000) mult *= 1.10;
            if (this.achievements.minerals_10000) mult *= 1.15;
            if (this.achievements.mineral_rate_10) mult *= 1.05;
            if (this.achievements.mineral_rate_100) mult *= 1.10;
        }
        if (resource === 'data') {
            if (this.achievements.data_100) mult *= 1.05;
            if (this.achievements.data_1000) mult *= 1.10;
            if (this.achievements.data_10000) mult *= 1.15;
        }
        
        // T2/T3 specific
        if (['circuits', 'alloys', 'code'].includes(resource) && this.achievements.all_t2) mult *= 1.10;
        if (['aiCores', 'quantumCells', 'nanofibers'].includes(resource) && this.achievements.all_t3) mult *= 1.10;
        
        return mult;
    },
    
    getEventMult(resource, category) {
        let mult = 1;
        for (const evt of this.activeEvents) {
            if (evt.effect === 'energyBoost' && resource === 'energy') mult *= evt.mult;
            if (evt.effect === 'mineralBoost' && resource === 'minerals') mult *= evt.mult;
            if (evt.effect === 'dataBoost' && resource === 'data') mult *= evt.mult;
            if (evt.effect === 'allBoost') mult *= evt.mult;
            if (evt.effect === 't3Boost' && ['aiCores', 'quantumCells', 'nanofibers'].includes(resource)) mult *= evt.mult;
        }
        return mult;
    },
    
    // ==========================================
    // POWER SYSTEM
    // ==========================================
    
    getPowerUsed() {
        let used = 0;
        for (const bKey in BUILDINGS) {
            const pw = BUILDINGS[bKey].powerUse;
            if (pw > 0) used += pw * this.buildings[bKey].count;
        }
        return used;
    },
    
    getPowerMax() {
        let max = 10; // Base power
        if (this.prestigeUpgrades.powerBoost > 0) max += 50;
        for (const bKey in BUILDINGS) {
            const pw = BUILDINGS[bKey].powerUse;
            if (pw < 0) max += Math.abs(pw) * this.buildings[bKey].count;
        }
        return max;
    },
    
    // ==========================================
    // BUILDING SYSTEM
    // ==========================================
    
    getBuildingCost(buildingKey) {
        const def = BUILDINGS[buildingKey];
        const count = this.buildings[buildingKey].count;
        const costs = {};
        for (const r in def.baseCost) {
            costs[r] = Math.ceil(def.baseCost[r] * Math.pow(def.costScale, count));
        }
        return costs;
    },
    
    buyBuilding(buildingKey) {
        const costs = this.getBuildingCost(buildingKey);
        if (!this.canAfford(costs)) return false;
        if (!this.buildings[buildingKey].unlocked) return false;
        
        this.spendResources(costs);
        this.buildings[buildingKey].count++;
        this.stats.totalBuildingsBuilt++;
        
        return true;
    },
    
    unlockBuildings(keys) {
        for (const key of keys) {
            if (this.buildings[key]) {
                this.buildings[key].unlocked = true;
            }
        }
    },
    
    // ==========================================
    // CRAFTING SYSTEM
    // ==========================================
    
    canCraft(recipeKey) {
        const recipe = RECIPES[recipeKey];
        return this.canAfford(recipe.inputs);
    },
    
    craft(recipeKey) {
        const recipe = RECIPES[recipeKey];
        if (!this.canAfford(recipe.inputs)) return false;
        
        this.spendResources(recipe.inputs);
        this.addResource(recipe.output, recipe.amount);
        
        // Track stats
        if (recipe.output === 'circuits') this.stats.totalCircuitsCrafted += recipe.amount;
        if (recipe.output === 'alloys') this.stats.totalAlloysCrafted += recipe.amount;
        if (recipe.output === 'code') this.stats.totalCodeCrafted += recipe.amount;
        if (recipe.output === 'aiCores') this.stats.totalAICoresCrafted += recipe.amount;
        if (recipe.output === 'quantumCells') this.stats.totalQuantumCellsCrafted += recipe.amount;
        if (recipe.output === 'nanofibers') this.stats.totalNanofibersCrafted += recipe.amount;
        
        return true;
    },
    
    // ==========================================
    // RESEARCH SYSTEM
    // ==========================================
    
    canResearch(techKey) {
        if (this.research[techKey]) return false;
        const tech = RESEARCH[techKey];
        // Check requirements
        for (const req of tech.requires) {
            if (!this.research[req]) return false;
        }
        return this.canAfford(tech.cost);
    },
    
    isResearchAvailable(techKey) {
        if (this.research[techKey]) return true; // Already done
        const tech = RESEARCH[techKey];
        for (const req of tech.requires) {
            if (!this.research[req]) return false;
        }
        return true;
    },
    
    doResearch(techKey) {
        if (!this.canResearch(techKey)) return false;
        const tech = RESEARCH[techKey];
        this.spendResources(tech.cost);
        this.research[techKey] = true;
        this.stats.totalResearchCompleted++;
        
        // Apply effect
        tech.effect();
        
        showToast(`🔬 Research Complete: ${tech.name}`, 'info');
        return true;
    },
    
    // Re-apply all completed research effects (for loading saves)
    reapplyResearch() {
        this.researchBonuses = {
            energyDrillMult: 1, mineralMinerMult: 1, dataScannerMult: 1,
            processorEfficiency: 1, globalProductionMult: 1,
            extractorMult: 1, processorMult: 1, factoryMult: 1,
            t1StorageBonus: 0, t2StorageBonus: 0, t3StorageBonus: 0,
            storageBuildingMult: 1, storageGlobalMult: 1,
            shardMult: 1, prestigeStartBonus: 0, prestigeProductionMult: false,
            transcendenceMult: 1, clickMult: 1,
        };
        this.automationUnlocks = {
            autoBuyExtractors: false, autoBuyProcessors: false, autoBuyFactories: false,
            autoBuyAll: false, autoCraftT2: false, autoCraftT3: false, autoSell: false,
        };
        this.prestigeUnlocked = false;
        
        for (const key in RESEARCH) {
            if (this.research[key]) {
                RESEARCH[key].effect();
            }
        }
    },
    
    // ==========================================
    // PRESTIGE SYSTEM
    // ==========================================
    
    getPrestigeShards() {
        // Based on total T3 resources produced
        const t3Total = this.stats.totalAICoresCrafted + this.stats.totalQuantumCellsCrafted + this.stats.totalNanofibersCrafted;
        // Also count current T3 + building-produced
        const currentT3 = this.resources.aiCores + this.resources.quantumCells + this.resources.nanofibers;
        const total = t3Total + currentT3;
        
        let shards = Math.floor(Math.pow(total / 5, 0.7));
        
        // Research bonus
        shards = Math.floor(shards * this.researchBonuses.shardMult);
        
        // Prestige upgrade bonus
        if (this.prestigeUpgrades.shardMultiplier > 0) shards *= 2;
        
        // Achievement bonuses
        if (this.achievements.prestige_3) shards = Math.floor(shards * 1.1);
        if (this.achievements.prestige_5a) shards = Math.floor(shards * 1.2);
        if (this.achievements.prestige_10a) shards = Math.floor(shards * 1.5);
        
        return Math.max(0, shards);
    },
    
    doPrestige() {
        const shards = this.getPrestigeShards();
        if (shards <= 0) return;
        
        // Save persistent data
        const savedShards = this.resources.shards + shards;
        const savedPrestigeUpgrades = { ...this.prestigeUpgrades };
        const savedMilestones = { ...this.milestones };
        const savedAchievements = { ...this.achievements };
        const savedStats = { ...this.stats };
        savedStats.totalPrestiges++;
        savedStats.totalShardsEarned += shards;
        savedStats.currentRunTime = 0;
        
        // Reset game state
        this.resetState();
        
        // Restore persistent data
        this.resources.shards = savedShards;
        this.prestigeUpgrades = savedPrestigeUpgrades;
        this.milestones = savedMilestones;
        this.achievements = savedAchievements;
        this.stats = savedStats;
        
        // Apply prestige upgrade bonuses
        if (this.prestigeUpgrades.startEnergy > 0) this.resources.energy = 200;
        if (this.prestigeUpgrades.startMinerals > 0) this.resources.minerals = 200;
        if (this.prestigeUpgrades.startData > 0) this.resources.data = 200;
        
        // Research start bonus
        if (this.researchBonuses.prestigeStartBonus > 0) {
            const bonus = this.researchBonuses.prestigeStartBonus;
            this.resources.energy = Math.max(this.resources.energy, bonus);
            this.resources.minerals = Math.max(this.resources.minerals, bonus);
            this.resources.data = Math.max(this.resources.data, bonus);
        }
        
        // Keep extractors
        if (this.prestigeUpgrades.keepExtractors > 0) {
            this.buildings.energyDrill.count = 1;
            this.buildings.mineralMiner.count = 1;
            this.buildings.dataScanner.count = 1;
        }
        
        // Keep research
        if (this.prestigeUpgrades.keepResearch1 > 0) {
            this.research.efficientDrills = true;
            this.research.efficientMiners = true;
            this.research.efficientScanners = true;
        }
        
        // Auto-start
        if (this.prestigeUpgrades.autoUnlock > 0) {
            this.automationUnlocks.autoBuyExtractors = true;
        }
        
        // Re-apply research
        this.reapplyResearch();
        
        showToast(`🔮 Singularity! Earned ${shards} Shards!`, 'prestige');
        this.saveGame();
    },
    
    buyPrestigeUpgrade(key) {
        const upgrade = PRESTIGE_UPGRADES[key];
        if (!upgrade) return false;
        if (this.prestigeUpgrades[key] >= (upgrade.maxLevel || 1)) return false;
        if (upgrade.requires && this.prestigeUpgrades[upgrade.requires] <= 0) return false;
        if (this.resources.shards < upgrade.cost) return false;
        
        this.resources.shards -= upgrade.cost;
        this.prestigeUpgrades[key]++;
        
        showToast(`✨ Purchased: ${upgrade.name}`, 'prestige');
        return true;
    },
    
    // ==========================================
    // MANUAL GATHERING
    // ==========================================
    
    gatherResource(resource) {
        let amount = 1;
        amount *= this.researchBonuses.clickMult;
        if (this.prestigeUpgrades.clickBoost > 0) amount *= 10;
        
        // Achievement click bonuses
        if (this.achievements.gather_1) amount += 1;
        if (this.achievements.gather_100) amount += 2;
        if (this.achievements.gather_1000) amount += 5;
        if (this.achievements.gather_10000) amount += 10;
        
        // Event click boost
        for (const evt of this.activeEvents) {
            if (evt.effect === 'clickBoost') amount *= evt.mult;
        }
        
        this.addResource(resource, amount);
        this.stats.totalClicks++;
        
        // Track totals
        if (resource === 'energy') this.stats.totalEnergyGathered += amount;
        if (resource === 'minerals') this.stats.totalMineralsGathered += amount;
        if (resource === 'data') this.stats.totalDataGathered += amount;
        
        return amount;
    },
    
    // ==========================================
    // EVENTS SYSTEM
    // ==========================================
    
    tickEvents(dt) {
        // Decrease event timers
        this.activeEvents = this.activeEvents.filter(evt => {
            evt.remaining -= dt;
            return evt.remaining > 0;
        });
        
        // Random event chance
        this.eventTimer += dt;
        if (this.eventTimer >= 1) {
            this.eventTimer = 0;
            // ~2% chance per second
            if (Math.random() < 0.02) {
                this.triggerRandomEvent();
            }
        }
    },
    
    triggerRandomEvent() {
        const evt = EVENTS[Math.floor(Math.random() * EVENTS.length)];
        this.stats.totalEvents++;
        
        if (evt.duration > 0) {
            this.activeEvents.push({
                ...evt,
                remaining: evt.duration,
            });
            showToast(`${evt.icon} ${evt.name}: ${evt.desc}`, 'event');
        } else {
            // Instant effect
            if (evt.effect === 'freeT1') {
                this.addResource('energy', evt.amount);
                this.addResource('minerals', evt.amount);
                this.addResource('data', evt.amount);
            } else if (evt.effect === 'freeT2') {
                this.addResource('circuits', evt.amount);
                this.addResource('alloys', evt.amount);
                this.addResource('code', evt.amount);
            }
            showToast(`${evt.icon} ${evt.name}: ${evt.desc}`, 'event');
        }
    },
    
    // ==========================================
    // AUTOMATION TICK
    // ==========================================
    
    tickAutomation() {
        // Auto-buyers
        for (const bKey in this.automation.buyers) {
            if (!this.automation.buyers[bKey]) continue;
            if (!this.isAutoBuyerUnlocked(bKey)) continue;
            this.buyBuilding(bKey);
        }
        
        // Auto-crafters
        for (const rKey in this.automation.crafters) {
            if (!this.automation.crafters[rKey]) continue;
            if (!this.isAutoCrafterUnlocked(rKey)) continue;
            this.craft(rKey);
        }
        
        // Auto-sellers (convert excess to energy)
        for (const rKey in this.automation.sellers) {
            if (!this.automation.sellers[rKey]) continue;
            if (!this.automationUnlocks.autoSell) continue;
            const cap = this.getResourceCap(rKey);
            if (this.resources[rKey] >= cap * 0.9 && rKey !== 'energy') {
                const sellAmount = this.resources[rKey] * 0.1;
                this.resources[rKey] -= sellAmount;
                const energyGain = sellAmount * (RESOURCES[rKey].tier === 1 ? 0.5 : RESOURCES[rKey].tier === 2 ? 5 : 50);
                this.addResource('energy', energyGain);
            }
        }
    },
    
    isAutoBuyerUnlocked(buildingKey) {
        const cat = BUILDINGS[buildingKey].category;
        if (cat === 'extractors') return this.automationUnlocks.autoBuyExtractors;
        if (cat === 'processors') return this.automationUnlocks.autoBuyProcessors;
        if (cat === 'factories') return this.automationUnlocks.autoBuyFactories;
        if (cat === 'storage' || cat === 'power') return this.automationUnlocks.autoBuyAll;
        return false;
    },
    
    isAutoCrafterUnlocked(recipeKey) {
        const tier = RESOURCES[RECIPES[recipeKey].output].tier;
        if (tier === 2) return this.automationUnlocks.autoCraftT2;
        if (tier === 3) return this.automationUnlocks.autoCraftT3;
        return false;
    },
    
    // ==========================================
    // GAME LOOP
    // ==========================================
    
    tick(dt) {
        // dt in seconds
        
        // Production
        for (const rKey in RESOURCES) {
            if (RESOURCES[rKey].tier === 4) continue;
            const rate = this.getProductionRate(rKey);
            if (rate !== 0) {
                this.addResource(rKey, rate * dt);
                // Track totals for positive production
                if (rate > 0) {
                    if (rKey === 'energy') this.stats.totalEnergyGathered += rate * dt;
                    if (rKey === 'minerals') this.stats.totalMineralsGathered += rate * dt;
                    if (rKey === 'data') this.stats.totalDataGathered += rate * dt;
                }
            }
        }
        
        // Events
        this.tickEvents(dt);
        
        // Stats
        this.stats.totalTimePlayed += dt;
        this.stats.currentRunTime += dt;
        
        // Check achievements
        this.checkAchievements();
        this.checkMilestones();
    },
    
    startGameLoop() {
        const loop = () => {
            const now = Date.now();
            const dt = Math.min((now - this.lastTick) / 1000, 5); // Cap at 5s per tick
            this.lastTick = now;
            
            this.tick(dt);
            
            // Automation runs every tick
            this.tickAutomation();
            
            // Update UI
            this.updateUI();
            
            requestAnimationFrame(loop);
        };
        this.lastTick = Date.now();
        requestAnimationFrame(loop);
    },
    
    // ==========================================
    // OFFLINE PROGRESS
    // ==========================================
    
    calculateOfflineProgress(offlineSeconds) {
        if (offlineSeconds <= 0) return;
        // Cap offline progress at 8 hours
        offlineSeconds = Math.min(offlineSeconds, 8 * 3600);
        
        // Simulate in 1-second chunks (simplified)
        const chunks = Math.min(offlineSeconds, 1000); // Max 1000 iterations
        const chunkSize = offlineSeconds / chunks;
        
        for (let i = 0; i < chunks; i++) {
            for (const rKey in RESOURCES) {
                if (RESOURCES[rKey].tier === 4) continue;
                const rate = this.getProductionRate(rKey);
                if (rate > 0) {
                    this.addResource(rKey, rate * chunkSize);
                }
            }
            this.stats.totalTimePlayed += chunkSize;
            this.stats.currentRunTime += chunkSize;
        }
        
        showToast(`⏰ Welcome back! ${formatTime(offlineSeconds)} of offline progress applied.`, 'info');
    },
    
    // ==========================================
    // ACHIEVEMENTS & MILESTONES
    // ==========================================
    
    checkAchievements() {
        for (const ach of ACHIEVEMENTS) {
            if (this.achievements[ach.id]) continue;
            try {
                if (ach.check()) {
                    this.achievements[ach.id] = true;
                    showToast(`🏆 Achievement: ${ach.name}!`, 'achievement');
                }
            } catch (e) { /* ignore check errors */ }
        }
    },
    
    checkMilestones() {
        for (const m of MILESTONES) {
            if (this.milestones[m.id]) continue;
            try {
                if (m.check()) {
                    this.milestones[m.id] = true;
                    showToast(`⭐ Milestone: ${m.name}!`, 'achievement');
                }
            } catch (e) { /* ignore */ }
        }
    },
    
    // ==========================================
    // SAVE / LOAD
    // ==========================================
    
    saveGame() {
        const saveData = {
            version: 1,
            timestamp: Date.now(),
            resources: this.resources,
            buildings: {},
            research: this.research,
            prestigeUpgrades: this.prestigeUpgrades,
            milestones: this.milestones,
            achievements: this.achievements,
            automation: this.automation,
            stats: this.stats,
        };
        
        // Save building counts and unlock states
        for (const key in this.buildings) {
            saveData.buildings[key] = {
                count: this.buildings[key].count,
                unlocked: this.buildings[key].unlocked,
            };
        }
        
        try {
            localStorage.setItem('automata_save', JSON.stringify(saveData));
            this.lastSave = Date.now();
            document.getElementById('last-save').textContent = 'Last save: just now';
        } catch (e) {
            console.error('Save failed:', e);
        }
    },
    
    loadGame() {
        try {
            const raw = localStorage.getItem('automata_save');
            if (!raw) return;
            
            const data = JSON.parse(raw);
            
            // Restore resources
            for (const key in data.resources) {
                if (this.resources.hasOwnProperty(key)) {
                    this.resources[key] = data.resources[key] || 0;
                }
            }
            
            // Restore buildings
            for (const key in data.buildings) {
                if (this.buildings[key]) {
                    this.buildings[key].count = data.buildings[key].count || 0;
                    this.buildings[key].unlocked = data.buildings[key].unlocked || false;
                }
            }
            
            // Restore research
            for (const key in data.research) {
                if (this.research.hasOwnProperty(key)) {
                    this.research[key] = data.research[key];
                }
            }
            
            // Restore prestige upgrades
            for (const key in data.prestigeUpgrades) {
                if (this.prestigeUpgrades.hasOwnProperty(key)) {
                    this.prestigeUpgrades[key] = data.prestigeUpgrades[key];
                }
            }
            
            // Restore milestones
            if (data.milestones) {
                for (const key in data.milestones) {
                    this.milestones[key] = data.milestones[key];
                }
            }
            
            // Restore achievements
            if (data.achievements) {
                for (const key in data.achievements) {
                    this.achievements[key] = data.achievements[key];
                }
            }
            
            // Restore automation
            if (data.automation) {
                if (data.automation.buyers) Object.assign(this.automation.buyers, data.automation.buyers);
                if (data.automation.crafters) Object.assign(this.automation.crafters, data.automation.crafters);
                if (data.automation.sellers) Object.assign(this.automation.sellers, data.automation.sellers);
            }
            
            // Restore stats
            if (data.stats) {
                Object.assign(this.stats, data.stats);
            }
            
            // Re-apply research effects
            this.reapplyResearch();
            
            // Calculate offline progress
            if (data.timestamp) {
                const offlineSeconds = (Date.now() - data.timestamp) / 1000;
                if (offlineSeconds > 10) {
                    this.calculateOfflineProgress(offlineSeconds);
                }
            }
            
            console.log('Game loaded successfully');
        } catch (e) {
            console.error('Load failed:', e);
        }
    },
    
    exportSave() {
        this.saveGame();
        const raw = localStorage.getItem('automata_save');
        return btoa(raw);
    },
    
    importSave(encoded) {
        try {
            const raw = atob(encoded);
            JSON.parse(raw); // Validate
            localStorage.setItem('automata_save', raw);
            location.reload();
        } catch (e) {
            showToast('❌ Invalid save data!', 'warning');
        }
    },
    
    hardReset() {
        if (confirm('Are you sure? This will DELETE ALL progress permanently!')) {
            if (confirm('Really? This cannot be undone!')) {
                localStorage.removeItem('automata_save');
                location.reload();
            }
        }
    },
    
    startAutoSave() {
        setInterval(() => {
            this.saveGame();
        }, this.saveInterval);
    },
    
    // ==========================================
    // UI SETUP
    // ==========================================
    
    setupUI() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('panel-' + btn.dataset.tab).classList.add('active');
            });
        });
        
        // Manual gather buttons
        document.getElementById('gather-energy').addEventListener('click', (e) => {
            const amt = this.gatherResource('energy');
            createClickFeedback(e, '+' + formatNumber(amt));
        });
        document.getElementById('gather-minerals').addEventListener('click', (e) => {
            const amt = this.gatherResource('minerals');
            createClickFeedback(e, '+' + formatNumber(amt));
        });
        document.getElementById('gather-data').addEventListener('click', (e) => {
            const amt = this.gatherResource('data');
            createClickFeedback(e, '+' + formatNumber(amt));
        });
        
        // Building category buttons
        document.querySelectorAll('.cat-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderBuildings(btn.dataset.cat);
            });
        });
        
        // Research branch buttons
        document.querySelectorAll('.branch-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.branch-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderResearch(btn.dataset.branch);
            });
        });
        
        // Header buttons
        document.getElementById('btn-save').addEventListener('click', () => {
            this.saveGame();
            showToast('💾 Game saved!', 'info');
        });
        document.getElementById('btn-export').addEventListener('click', () => {
            const data = this.exportSave();
            navigator.clipboard.writeText(data).then(() => {
                showToast('📤 Save copied to clipboard!', 'info');
            }).catch(() => {
                prompt('Copy this save data:', data);
            });
        });
        document.getElementById('btn-import').addEventListener('click', () => {
            document.getElementById('modal-import').style.display = 'flex';
        });
        document.getElementById('btn-import-confirm').addEventListener('click', () => {
            const data = document.getElementById('import-textarea').value.trim();
            if (data) this.importSave(data);
            document.getElementById('modal-import').style.display = 'none';
        });
        document.getElementById('btn-import-cancel').addEventListener('click', () => {
            document.getElementById('modal-import').style.display = 'none';
        });
        document.getElementById('btn-reset').addEventListener('click', () => {
            this.hardReset();
        });
        
        // Prestige button
        document.getElementById('btn-prestige').addEventListener('click', () => {
            if (this.getPrestigeShards() > 0) {
                if (confirm('Perform Singularity Reset? You will lose all resources, buildings, and research, but gain Singularity Shards.')) {
                    this.doPrestige();
                }
            }
        });
        
        // Initial renders
        this.renderCraftGrid();
        this.renderBuildings('extractors');
        this.renderResearch('all');
        this.renderAutomation();
        this.renderPrestige();
        this.renderAchievements();
    },
    
    // ==========================================
    // UI RENDERING
    // ==========================================
    
    renderCraftGrid() {
        const grid = document.getElementById('craft-grid');
        grid.innerHTML = '';
        
        for (const key in RECIPES) {
            const recipe = RECIPES[key];
            const resDef = RESOURCES[recipe.output];
            
            const card = document.createElement('div');
            card.className = 'craft-card';
            card.dataset.recipe = key;
            
            let costHtml = '';
            for (const r in recipe.inputs) {
                const has = this.resources[r] || 0;
                const need = recipe.inputs[r];
                const cls = has >= need ? 'affordable' : 'expensive';
                costHtml += `<span class="${cls}">${RESOURCES[r].icon} ${formatNumber(need)} ${RESOURCES[r].name}</span> `;
            }
            
            card.innerHTML = `
                <div class="craft-header">
                    <span class="craft-name">${resDef.icon} ${resDef.name}</span>
                </div>
                <div class="craft-cost">${costHtml}</div>
                <button class="btn-craft" data-recipe="${key}">Craft x1</button>
            `;
            
            card.querySelector('.btn-craft').addEventListener('click', () => {
                this.craft(key);
            });
            
            grid.appendChild(card);
        }
    },
    
    renderBuildings(category) {
        const grid = document.getElementById('buildings-grid');
        grid.innerHTML = '';
        
        for (const key in BUILDINGS) {
            const def = BUILDINGS[key];
            if (def.category !== category) continue;
            
            const card = document.createElement('div');
            card.className = 'building-card' + (this.buildings[key].unlocked ? '' : ' locked');
            card.dataset.building = key;
            
            const costs = this.getBuildingCost(key);
            let costHtml = '';
            for (const r in costs) {
                const has = this.resources[r] || 0;
                const cls = has >= costs[r] ? 'affordable' : 'expensive';
                costHtml += `<span class="${cls}">${RESOURCES[r].icon}${formatNumber(costs[r])}</span> `;
            }
            
            let statsHtml = '';
            for (const r in def.produces) {
                statsHtml += `+${def.produces[r]}${RESOURCES[r].icon}/s `;
            }
            for (const r in def.consumes) {
                statsHtml += `-${def.consumes[r]}${RESOURCES[r].icon}/s `;
            }
            if (def.storageBonus) {
                for (const r in def.storageBonus) {
                    statsHtml += `+${def.storageBonus[r]}${RESOURCES[r].icon} cap `;
                }
            }
            
            let powerHtml = '';
            if (def.powerUse > 0) powerHtml = `⚡ Uses ${def.powerUse} MW`;
            else if (def.powerUse < 0) powerHtml = `⚡ Generates ${Math.abs(def.powerUse)} MW`;
            
            card.innerHTML = `
                <div class="building-top">
                    <div class="building-info">
                        <h4>${def.icon} ${def.name}</h4>
                        <div class="building-desc">${def.desc}</div>
                    </div>
                    <span class="building-count">${this.buildings[key].count}</span>
                </div>
                <div class="building-stats">${statsHtml}</div>
                <div class="building-power">${powerHtml}</div>
                <div class="building-cost">Cost: ${costHtml}</div>
                <button class="btn-buy" data-building="${key}" ${!this.canAfford(costs) ? 'disabled' : ''}>Buy</button>
            `;
            
            card.querySelector('.btn-buy').addEventListener('click', () => {
                if (this.buyBuilding(key)) {
                    this.renderBuildings(category);
                }
            });
            
            grid.appendChild(card);
        }
    },
    
    renderResearch(branch) {
        const tree = document.getElementById('research-tree');
        tree.innerHTML = '';
        
        for (const key in RESEARCH) {
            const tech = RESEARCH[key];
            if (branch !== 'all' && tech.branch !== branch) continue;
            
            const available = this.isResearchAvailable(key);
            const done = this.research[key];
            
            const card = document.createElement('div');
            card.className = `research-card branch-${tech.branch}` + 
                (done ? ' researched' : '') + 
                (!available && !done ? ' locked' : '');
            card.dataset.tech = key;
            
            let costHtml = '';
            for (const r in tech.cost) {
                const has = this.resources[r] || 0;
                const cls = has >= tech.cost[r] ? 'affordable' : 'expensive';
                costHtml += `<span class="${cls}">${RESOURCES[r].icon}${formatNumber(tech.cost[r])}</span> `;
            }
            
            let reqHtml = '';
            if (tech.requires.length > 0) {
                const reqNames = tech.requires.map(r => RESEARCH[r].name).join(', ');
                reqHtml = `<div class="research-requires">Requires: ${reqNames}</div>`;
            }
            
            card.innerHTML = `
                <div class="research-name">
                    ${tech.name}
                    <span class="research-branch-tag">${tech.branch}</span>
                </div>
                <div class="research-desc">${tech.desc}</div>
                ${reqHtml}
                ${done ? '<div class="research-complete-badge">✅ Completed</div>' : 
                    `<div class="research-cost">Cost: ${costHtml}</div>
                     <button class="btn-research" data-tech="${key}" ${!this.canResearch(key) ? 'disabled' : ''}>Research</button>`}
            `;
            
            if (!done) {
                const btn = card.querySelector('.btn-research');
                if (btn) {
                    btn.addEventListener('click', () => {
                        if (this.doResearch(key)) {
                            this.renderResearch(branch);
                        }
                    });
                }
            }
            
            tree.appendChild(card);
        }
    },
    
    renderAutomation() {
        // Auto-buyers
        const buyersList = document.getElementById('auto-buyers-list');
        buyersList.innerHTML = '';
        for (const key in BUILDINGS) {
            const def = BUILDINGS[key];
            const unlocked = this.isAutoBuyerUnlocked(key);
            
            const item = document.createElement('div');
            item.className = 'auto-item' + (unlocked ? '' : ' locked');
            item.innerHTML = `
                <div class="auto-item-info">
                    <span class="auto-item-name">${def.icon} ${def.name}</span>
                    <span class="auto-item-desc">Auto-buy when affordable</span>
                </div>
                <label class="toggle-switch">
                    <input type="checkbox" data-autobuyer="${key}" ${this.automation.buyers[key] ? 'checked' : ''} ${!unlocked ? 'disabled' : ''}>
                    <span class="toggle-slider"></span>
                </label>
            `;
            
            const checkbox = item.querySelector('input');
            checkbox.addEventListener('change', () => {
                this.automation.buyers[key] = checkbox.checked;
                this.countAutoBuyers();
            });
            
            buyersList.appendChild(item);
        }
        
        // Auto-crafters
        const craftersList = document.getElementById('auto-craft-list');
        craftersList.innerHTML = '';
        for (const key in RECIPES) {
            const recipe = RECIPES[key];
            const resDef = RESOURCES[recipe.output];
            const unlocked = this.isAutoCrafterUnlocked(key);
            
            const item = document.createElement('div');
            item.className = 'auto-item' + (unlocked ? '' : ' locked');
            item.innerHTML = `
                <div class="auto-item-info">
                    <span class="auto-item-name">${resDef.icon} ${resDef.name}</span>
                    <span class="auto-item-desc">Auto-craft when possible</span>
                </div>
                <label class="toggle-switch">
                    <input type="checkbox" data-autocrafter="${key}" ${this.automation.crafters[key] ? 'checked' : ''} ${!unlocked ? 'disabled' : ''}>
                    <span class="toggle-slider"></span>
                </label>
            `;
            
            const checkbox = item.querySelector('input');
            checkbox.addEventListener('change', () => {
                this.automation.crafters[key] = checkbox.checked;
                this.countAutoBuyers();
            });
            
            craftersList.appendChild(item);
        }
        
        // Auto-sellers
        const sellersList = document.getElementById('auto-sell-list');
        sellersList.innerHTML = '';
        for (const key in RESOURCES) {
            if (RESOURCES[key].tier >= 4) continue;
            const resDef = RESOURCES[key];
            const unlocked = this.automationUnlocks.autoSell;
            
            const item = document.createElement('div');
            item.className = 'auto-item' + (unlocked ? '' : ' locked');
            item.innerHTML = `
                <div class="auto-item-info">
                    <span class="auto-item-name">${resDef.icon} ${resDef.name}</span>
                    <span class="auto-item-desc">Sell excess (>90% cap) for energy</span>
                </div>
                <label class="toggle-switch">
                    <input type="checkbox" data-autoseller="${key}" ${this.automation.sellers[key] ? 'checked' : ''} ${!unlocked ? 'disabled' : ''}>
                    <span class="toggle-slider"></span>
                </label>
            `;
            
            const checkbox = item.querySelector('input');
            checkbox.addEventListener('change', () => {
                this.automation.sellers[key] = checkbox.checked;
                this.countAutoBuyers();
            });
            
            sellersList.appendChild(item);
        }
    },
    
    countAutoBuyers() {
        let count = 0;
        for (const key in this.automation.buyers) {
            if (this.automation.buyers[key]) count++;
        }
        for (const key in this.automation.crafters) {
            if (this.automation.crafters[key]) count++;
        }
        for (const key in this.automation.sellers) {
            if (this.automation.sellers[key]) count++;
        }
        this.stats.autoBuyersEnabled = count;
    },
    
    renderPrestige() {
        // Prestige upgrades
        const grid = document.getElementById('prestige-grid');
        grid.innerHTML = '';
        
        for (const key in PRESTIGE_UPGRADES) {
            const upgrade = PRESTIGE_UPGRADES[key];
            const purchased = this.prestigeUpgrades[key] > 0;
            const canBuy = !purchased && this.resources.shards >= upgrade.cost && 
                (!upgrade.requires || this.prestigeUpgrades[upgrade.requires] > 0);
            
            const card = document.createElement('div');
            card.className = 'prestige-upgrade-card' + (purchased ? ' purchased' : '') + (!canBuy && !purchased ? ' locked' : '');
            
            card.innerHTML = `
                <div class="prestige-upgrade-name">${upgrade.name}</div>
                <div class="prestige-upgrade-desc">${upgrade.desc}</div>
                <div class="prestige-upgrade-cost">🔮 ${upgrade.cost} Shards</div>
                ${purchased ? '<div class="research-complete-badge">✅ Purchased</div>' :
                    `<button class="btn-prestige-buy" data-pupgrade="${key}" ${!canBuy ? 'disabled' : ''}>Purchase</button>`}
            `;
            
            if (!purchased) {
                const btn = card.querySelector('.btn-prestige-buy');
                if (btn) {
                    btn.addEventListener('click', () => {
                        if (this.buyPrestigeUpgrade(key)) {
                            this.renderPrestige();
                        }
                    });
                }
            }
            
            grid.appendChild(card);
        }
        
        // Milestones
        const mList = document.getElementById('milestone-list');
        mList.innerHTML = '';
        for (const m of MILESTONES) {
            const achieved = this.milestones[m.id];
            const item = document.createElement('div');
            item.className = 'milestone-item' + (achieved ? ' achieved' : '');
            item.innerHTML = `
                <span class="milestone-icon">${m.icon}</span>
                <div class="milestone-info">
                    <div class="milestone-name">${m.name}</div>
                    <div class="milestone-desc">${m.desc}</div>
                </div>
                <span class="milestone-status">${achieved ? '✅' : '🔒'}</span>
            `;
            mList.appendChild(item);
        }
    },
    
    renderAchievements() {
        const grid = document.getElementById('achievements-grid');
        grid.innerHTML = '';
        
        let unlocked = 0;
        for (const ach of ACHIEVEMENTS) {
            if (this.achievements[ach.id]) unlocked++;
            
            const card = document.createElement('div');
            card.className = 'achievement-card' + (this.achievements[ach.id] ? ' unlocked' : '');
            card.innerHTML = `
                <span class="achievement-icon">${this.achievements[ach.id] ? ach.icon : '🔒'}</span>
                <div class="achievement-info">
                    <div class="achievement-name">${ach.name}</div>
                    <div class="achievement-desc">${ach.desc}</div>
                    <div class="achievement-reward">Reward: ${ach.reward}</div>
                </div>
            `;
            grid.appendChild(card);
        }
        
        document.getElementById('achievement-count').textContent = unlocked;
        document.getElementById('achievement-total').textContent = ACHIEVEMENTS.length;
        document.getElementById('achievement-bar').style.width = (unlocked / ACHIEVEMENTS.length * 100) + '%';
    },
    
    // ==========================================
    // UI UPDATE (called every frame)
    // ==========================================
    
    updateUI() {
        // Resource bar
        for (const key in RESOURCES) {
            const el = document.getElementById('res-' + key);
            if (el) el.textContent = formatNumber(this.resources[key]);
            
            const rateEl = document.getElementById('rate-' + key);
            if (rateEl && RESOURCES[key].tier < 4) {
                rateEl.textContent = formatRate(this.getProductionRate(key));
            }
            
            const barEl = document.getElementById('bar-' + key);
            if (barEl && RESOURCES[key].tier < 4) {
                const cap = this.getResourceCap(key);
                barEl.style.width = Math.min(100, (this.resources[key] / cap) * 100) + '%';
            }
        }
        
        // Power display
        const powerUsed = this.getPowerUsed();
        const powerMax = this.getPowerMax();
        document.getElementById('power-current').textContent = powerUsed;
        document.getElementById('power-max').textContent = powerMax;
        const powerBar = document.getElementById('power-bar');
        const powerPct = powerMax > 0 ? (powerUsed / powerMax) * 100 : 0;
        powerBar.style.width = Math.min(100, powerPct) + '%';
        if (powerPct > 90) powerBar.style.background = 'linear-gradient(90deg, var(--neon-orange), var(--neon-red))';
        else if (powerPct > 70) powerBar.style.background = 'linear-gradient(90deg, var(--neon-yellow), var(--neon-orange))';
        else powerBar.style.background = 'linear-gradient(90deg, var(--neon-green), var(--neon-yellow))';
        
        // Update gather button amounts
        let clickAmt = 1;
        clickAmt *= this.researchBonuses.clickMult;
        if (this.prestigeUpgrades.clickBoost > 0) clickAmt *= 10;
        if (this.achievements.gather_1) clickAmt += 1;
        if (this.achievements.gather_100) clickAmt += 2;
        if (this.achievements.gather_1000) clickAmt += 5;
        if (this.achievements.gather_10000) clickAmt += 10;
        document.querySelectorAll('.gather-amount').forEach(el => {
            el.textContent = '+' + formatNumber(clickAmt);
        });
        
        // Update craft buttons
        document.querySelectorAll('.btn-craft').forEach(btn => {
            const key = btn.dataset.recipe;
            btn.disabled = !this.canCraft(key);
        });
        
        // Update craft costs
        document.querySelectorAll('.craft-card').forEach(card => {
            const key = card.dataset.recipe;
            if (!key) return;
            const recipe = RECIPES[key];
            const costEl = card.querySelector('.craft-cost');
            if (costEl) {
                let costHtml = '';
                for (const r in recipe.inputs) {
                    const has = this.resources[r] || 0;
                    const need = recipe.inputs[r];
                    const cls = has >= need ? 'affordable' : 'expensive';
                    costHtml += `<span class="${cls}">${RESOURCES[r].icon} ${formatNumber(need)}</span> `;
                }
                costEl.innerHTML = costHtml;
            }
        });
        
        // Update building buy buttons
        document.querySelectorAll('.btn-buy').forEach(btn => {
            const key = btn.dataset.building;
            if (!key) return;
            const costs = this.getBuildingCost(key);
            btn.disabled = !this.canAfford(costs);
        });
        
        // Update building counts and costs
        document.querySelectorAll('.building-card').forEach(card => {
            const key = card.dataset.building;
            if (!key) return;
            const countEl = card.querySelector('.building-count');
            if (countEl) countEl.textContent = this.buildings[key].count;
            
            const costEl = card.querySelector('.building-cost');
            if (costEl) {
                const costs = this.getBuildingCost(key);
                let costHtml = 'Cost: ';
                for (const r in costs) {
                    const has = this.resources[r] || 0;
                    const cls = has >= costs[r] ? 'affordable' : 'expensive';
                    costHtml += `<span class="${cls}">${RESOURCES[r].icon}${formatNumber(costs[r])}</span> `;
                }
                costEl.innerHTML = costHtml;
            }
            
            // Update locked state
            if (this.buildings[key].unlocked) {
                card.classList.remove('locked');
            }
        });
        
        // Update research buttons
        document.querySelectorAll('.btn-research').forEach(btn => {
            const key = btn.dataset.tech;
            if (!key) return;
            btn.disabled = !this.canResearch(key);
        });
        
        // Update prestige info
        if (this.prestigeUnlocked) {
            document.getElementById('prestige-current').textContent = formatNumber(this.resources.shards);
            document.getElementById('prestige-gain').textContent = formatNumber(this.getPrestigeShards());
            document.getElementById('prestige-total').textContent = formatNumber(this.resources.shards + this.getPrestigeShards());
            document.getElementById('btn-prestige').disabled = this.getPrestigeShards() <= 0;
        }
        
        // Update prestige buy buttons
        document.querySelectorAll('.btn-prestige-buy').forEach(btn => {
            const key = btn.dataset.pupgrade;
            if (!key) return;
            const upgrade = PRESTIGE_UPGRADES[key];
            const canBuy = this.prestigeUpgrades[key] <= 0 && this.resources.shards >= upgrade.cost &&
                (!upgrade.requires || this.prestigeUpgrades[upgrade.requires] > 0);
            btn.disabled = !canBuy;
        });
        
        // Update stats
        document.getElementById('stat-time').textContent = formatTime(this.stats.totalTimePlayed);
        document.getElementById('stat-run-time').textContent = formatTime(this.stats.currentRunTime);
        document.getElementById('stat-clicks').textContent = formatNumber(this.stats.totalClicks, 0);
        document.getElementById('stat-buildings').textContent = formatNumber(this.stats.totalBuildingsBuilt, 0);
        document.getElementById('stat-research').textContent = this.stats.totalResearchCompleted;
        document.getElementById('stat-prestiges').textContent = this.stats.totalPrestiges;
        document.getElementById('stat-total-energy').textContent = formatNumber(this.stats.totalEnergyGathered);
        document.getElementById('stat-total-minerals').textContent = formatNumber(this.stats.totalMineralsGathered);
        document.getElementById('stat-total-data').textContent = formatNumber(this.stats.totalDataGathered);
        document.getElementById('stat-total-shards').textContent = formatNumber(this.stats.totalShardsEarned);
        document.getElementById('stat-achievements').textContent = Object.values(this.achievements).filter(Boolean).length;
        document.getElementById('stat-events').textContent = this.stats.totalEvents;
        
        // Update achievement count
        const unlocked = Object.values(this.achievements).filter(Boolean).length;
        document.getElementById('achievement-count').textContent = unlocked;
        document.getElementById('achievement-bar').style.width = (unlocked / ACHIEVEMENTS.length * 100) + '%';
        
        // Update last save display
        if (this.lastSave > 0) {
            const ago = Math.floor((Date.now() - this.lastSave) / 1000);
            document.getElementById('last-save').textContent = `Last save: ${ago}s ago`;
        }
        
        // Show/hide T2, T3 resource groups based on unlock
        const hasT2 = this.research.unlockProcessors || Object.values(this.buildings).some((b, i) => {
            const key = Object.keys(this.buildings)[i];
            return BUILDINGS[key].category === 'processors' && b.count > 0;
        }) || this.resources.circuits > 0 || this.resources.alloys > 0 || this.resources.code > 0;
        
        const hasT3 = this.research.unlockFactories || this.resources.aiCores > 0 || this.resources.quantumCells > 0 || this.resources.nanofibers > 0;
        
        document.getElementById('resource-group-t2').style.display = hasT2 ? 'flex' : 'none';
        document.getElementById('resource-group-t3').style.display = hasT3 ? 'flex' : 'none';
        document.getElementById('resource-group-t4').style.display = (this.prestigeUnlocked || this.resources.shards > 0) ? 'flex' : 'none';
    },
};

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = { info: 'ℹ️', event: '🎲', achievement: '🏆', prestige: '🔮', warning: '⚠️' };
    toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 4000);
}

// ==========================================
// CLICK FEEDBACK
// ==========================================

function createClickFeedback(event, text) {
    const el = document.createElement('div');
    el.className = 'click-feedback';
    el.textContent = text;
    el.style.left = (event.clientX || event.pageX || 100) + 'px';
    el.style.top = (event.clientY || event.pageY || 100) + 'px';
    document.body.appendChild(el);
    setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
    }, 800);
}

// ==========================================
// INITIALIZE
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
