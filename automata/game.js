// ============================================================
// AUTOMATA — Resource Automation Game v2.0
// ============================================================

(function () {
    'use strict';

    // ===== CONSTANTS & DEFINITIONS =====

    const SAVE_KEY = 'automata_save_v2';
    const AUTO_SAVE_INTERVAL = 30000;
    const TICK_RATE = 20; // ticks per second
    const MAX_OFFLINE_HOURS = 8;
    const EVENT_CHANCE = 0.02; // per second

    // Resource definitions
    const RESOURCES = {
        energy:   { name: 'Energy',        icon: '⚡', tier: 1, baseCap: 500 },
        minerals: { name: 'Minerals',      icon: '⛏️', tier: 1, baseCap: 500 },
        data:     { name: 'Data',          icon: '📊', tier: 1, baseCap: 500 },
        circuits: { name: 'Circuits',      icon: '🔌', tier: 2, baseCap: 200 },
        alloys:   { name: 'Alloys',        icon: '🔩', tier: 2, baseCap: 200 },
        code:     { name: 'Code',          icon: '💻', tier: 2, baseCap: 200 },
        aiCores:  { name: 'AI Cores',      icon: '🧠', tier: 3, baseCap: 50 },
        qCells:   { name: 'Quantum Cells', icon: '⚛️', tier: 3, baseCap: 50 },
        nanofibers:{ name: 'Nanofibers',   icon: '🧬', tier: 3, baseCap: 50 },
        darkMatter:{ name: 'Dark Matter',  icon: '🌀', tier: 4, baseCap: 20 },
        antimatter:{ name: 'Antimatter',   icon: '✨', tier: 4, baseCap: 20 },
        shards:   { name: 'Singularity Shards', icon: '🔮', tier: 5, baseCap: Infinity },
    };

    const RESOURCE_IDS = Object.keys(RESOURCES);

    // Crafting recipes
    const RECIPES = [
        { id: 'circuits',  output: 'circuits',  amount: 1, costs: { energy: 20, data: 10 } },
        { id: 'alloys',    output: 'alloys',    amount: 1, costs: { minerals: 15, energy: 10 } },
        { id: 'code',      output: 'code',      amount: 1, costs: { data: 15, energy: 5 } },
        { id: 'aiCores',   output: 'aiCores',   amount: 1, costs: { circuits: 10, code: 8 } },
        { id: 'qCells',    output: 'qCells',    amount: 1, costs: { alloys: 8, circuits: 6 } },
        { id: 'nanofibers',output: 'nanofibers', amount: 1, costs: { code: 6, alloys: 8 } },
        { id: 'darkMatter',output: 'darkMatter', amount: 1, costs: { aiCores: 5, qCells: 5 } },
        { id: 'antimatter',output: 'antimatter', amount: 1, costs: { qCells: 5, nanofibers: 5 } },
    ];

    // Building definitions
    const BUILDING_CATEGORIES = {
        extractors: { name: '⛏️ Extractors', desc: 'Produce Tier 1 resources' },
        processors: { name: '🔧 Processors', desc: 'Convert T1 → T2' },
        factories:  { name: '🏭 Factories', desc: 'Convert T2 → T3' },
        advFactories: { name: '⚗️ Advanced Factories', desc: 'Convert T3 → T4' },
        storage:    { name: '📦 Storage', desc: 'Increase resource caps' },
        power:      { name: '⚡ Power', desc: 'Provide MW for buildings' },
    };

    const BUILDINGS = {
        // Extractors
        energyDrill:   { name: '⚡ Energy Drill',    cat: 'extractors', produces: { energy: 1 }, consumes: {}, costs: { energy: 10 }, powerUse: 1, desc: '+1 Energy/s' },
        mineralMiner:  { name: '⛏️ Mineral Miner',   cat: 'extractors', produces: { minerals: 1 }, consumes: {}, costs: { minerals: 10 }, powerUse: 1, desc: '+1 Mineral/s' },
        dataScanner:   { name: '📊 Data Scanner',    cat: 'extractors', produces: { data: 1 }, consumes: {}, costs: { data: 10 }, powerUse: 1, desc: '+1 Data/s' },
        // Processors
        circuitFoundry:{ name: '🔌 Circuit Foundry', cat: 'processors', produces: { circuits: 0.5 }, consumes: { energy: 2, data: 1 }, costs: { energy: 50, data: 30 }, powerUse: 2, desc: '+0.5 Circuits/s (uses 2⚡+1📊/s)', unlock: 'processorBlueprints' },
        alloySmelter:  { name: '🔩 Alloy Smelter',   cat: 'processors', produces: { alloys: 0.5 }, consumes: { minerals: 1.5, energy: 1 }, costs: { minerals: 40, energy: 25 }, powerUse: 2, desc: '+0.5 Alloys/s (uses 1.5⛏️+1⚡/s)', unlock: 'processorBlueprints' },
        codeCompiler:  { name: '💻 Code Compiler',   cat: 'processors', produces: { code: 0.5 }, consumes: { data: 1.5, energy: 0.5 }, costs: { data: 40, energy: 15 }, powerUse: 2, desc: '+0.5 Code/s (uses 1.5📊+0.5⚡/s)', unlock: 'processorBlueprints' },
        // Factories
        aiLab:         { name: '🧠 AI Lab',          cat: 'factories', produces: { aiCores: 0.2 }, consumes: { circuits: 1, code: 0.8 }, costs: { circuits: 100, code: 80 }, powerUse: 5, desc: '+0.2 AI Cores/s', unlock: 'factoryBlueprints' },
        quantumReactor:{ name: '⚛️ Quantum Reactor', cat: 'factories', produces: { qCells: 0.2 }, consumes: { alloys: 0.8, circuits: 0.6 }, costs: { alloys: 80, circuits: 60 }, powerUse: 5, desc: '+0.2 Q.Cells/s', unlock: 'factoryBlueprints' },
        nanoAssembler: { name: '🧬 Nano Assembler',  cat: 'factories', produces: { nanofibers: 0.2 }, consumes: { code: 0.6, alloys: 0.8 }, costs: { code: 60, alloys: 80 }, powerUse: 5, desc: '+0.2 Nanofibers/s', unlock: 'factoryBlueprints' },
        // Advanced Factories
        dmCondenser:   { name: '🌀 DM Condenser',    cat: 'advFactories', produces: { darkMatter: 0.05 }, consumes: { aiCores: 0.5, qCells: 0.5 }, costs: { aiCores: 20, qCells: 20 }, powerUse: 10, desc: '+0.05 Dark Matter/s', unlock: 'advFactoryBlueprints' },
        amForge:       { name: '✨ AM Forge',         cat: 'advFactories', produces: { antimatter: 0.05 }, consumes: { qCells: 0.5, nanofibers: 0.5 }, costs: { qCells: 20, nanofibers: 20 }, powerUse: 10, desc: '+0.05 Antimatter/s', unlock: 'advFactoryBlueprints' },
        // Storage
        energyBank:    { name: '⚡ Energy Bank',      cat: 'storage', produces: {}, consumes: {}, costs: { energy: 50 }, powerUse: 0, desc: '+500 Energy cap', capBonus: { energy: 500 } },
        mineralVault:  { name: '⛏️ Mineral Vault',    cat: 'storage', produces: {}, consumes: {}, costs: { minerals: 50 }, powerUse: 0, desc: '+500 Minerals cap', capBonus: { minerals: 500 } },
        dataArchive:   { name: '📊 Data Archive',     cat: 'storage', produces: {}, consumes: {}, costs: { data: 50 }, powerUse: 0, desc: '+500 Data cap', capBonus: { data: 500 } },
        advStorage:    { name: '🔧 Advanced Storage', cat: 'storage', produces: {}, consumes: {}, costs: { circuits: 30, alloys: 30, code: 30 }, powerUse: 0, desc: '+200 all T2 caps', capBonus: { circuits: 200, alloys: 200, code: 200 } },
        quantumVault:  { name: '⚛️ Quantum Vault',    cat: 'storage', produces: {}, consumes: {}, costs: { aiCores: 15, qCells: 15, nanofibers: 15 }, powerUse: 0, desc: '+50 all T3 caps', capBonus: { aiCores: 50, qCells: 50, nanofibers: 50 } },
        exoticContainer:{ name: '🌀 Exotic Container', cat: 'storage', produces: {}, consumes: {}, costs: { darkMatter: 5, antimatter: 5 }, powerUse: 0, desc: '+20 all T4 caps', capBonus: { darkMatter: 20, antimatter: 20 } },
        // Power
        solarPanel:    { name: '☀️ Solar Panel',      cat: 'power', produces: {}, consumes: {}, costs: { energy: 25, minerals: 10 }, powerUse: 0, desc: '+5 MW', powerGen: 5 },
        fusionPlant:   { name: '🔥 Fusion Plant',     cat: 'power', produces: {}, consumes: {}, costs: { energy: 100, alloys: 50 }, powerUse: 0, desc: '+25 MW', powerGen: 25 },
        dmGenerator:   { name: '🌀 DM Generator',     cat: 'power', produces: {}, consumes: {}, costs: { darkMatter: 20 }, powerUse: 0, desc: '+100 MW', powerGen: 100 },
    };

    const COST_SCALE = 1.15;

    // Research definitions
    const RESEARCH = {
        // Efficiency Branch
        optGathering1:    { name: 'Optimized Gathering I',   branch: 'efficiency', desc: '+25% click power', costs: { energy: 50, data: 50 }, time: 10, prereqs: [], effect: { clickMult: 0.25 } },
        optGathering2:    { name: 'Optimized Gathering II',  branch: 'efficiency', desc: '+50% click power', costs: { energy: 200, data: 200 }, time: 20, prereqs: ['optGathering1'], effect: { clickMult: 0.5 } },
        optGathering3:    { name: 'Optimized Gathering III', branch: 'efficiency', desc: '+100% click power', costs: { energy: 1000, data: 1000 }, time: 40, prereqs: ['optGathering2'], effect: { clickMult: 1.0 } },
        effExtractors1:   { name: 'Efficient Extractors I',  branch: 'efficiency', desc: '+50% extractor output', costs: { energy: 100, minerals: 100 }, time: 15, prereqs: [], effect: { extractorMult: 0.5 } },
        effExtractors2:   { name: 'Efficient Extractors II', branch: 'efficiency', desc: '+100% extractor output', costs: { energy: 500, minerals: 500 }, time: 30, prereqs: ['effExtractors1'], effect: { extractorMult: 1.0 } },
        effProcessors1:   { name: 'Efficient Processors I',  branch: 'efficiency', desc: '+50% processor output', costs: { circuits: 50, alloys: 50 }, time: 25, prereqs: ['processorBlueprints'], effect: { processorMult: 0.5 } },
        effProcessors2:   { name: 'Efficient Processors II', branch: 'efficiency', desc: '+100% processor output', costs: { circuits: 150, alloys: 150 }, time: 40, prereqs: ['effProcessors1'], effect: { processorMult: 1.0 } },
        effFactories:     { name: 'Efficient Factories',     branch: 'efficiency', desc: '+50% factory output', costs: { aiCores: 20, qCells: 20 }, time: 50, prereqs: ['factoryBlueprints'], effect: { factoryMult: 0.5 } },

        // Capacity Branch
        expStorage1:      { name: 'Expanded Storage I',      branch: 'capacity', desc: '+100% T1 caps', costs: { energy: 100, minerals: 100, data: 100 }, time: 10, prereqs: [], effect: { t1CapMult: 1.0 } },
        expStorage2:      { name: 'Expanded Storage II',     branch: 'capacity', desc: '+200% T1 caps', costs: { energy: 500, minerals: 500, data: 500 }, time: 20, prereqs: ['expStorage1'], effect: { t1CapMult: 2.0 } },
        expStorage3:      { name: 'Expanded Storage III',    branch: 'capacity', desc: '+500% T1 caps', costs: { energy: 2000, minerals: 2000, data: 2000 }, time: 35, prereqs: ['expStorage2'], effect: { t1CapMult: 5.0 } },
        advContainers1:   { name: 'Advanced Containers I',   branch: 'capacity', desc: '+100% T2 caps', costs: { circuits: 50, alloys: 50, code: 50 }, time: 20, prereqs: ['processorBlueprints'], effect: { t2CapMult: 1.0 } },
        advContainers2:   { name: 'Advanced Containers II',  branch: 'capacity', desc: '+200% T2 caps', costs: { circuits: 150, alloys: 150, code: 150 }, time: 35, prereqs: ['advContainers1'], effect: { t2CapMult: 2.0 } },
        quantumStorage:   { name: 'Quantum Storage',         branch: 'capacity', desc: '+100% T3 caps', costs: { aiCores: 15, qCells: 15, nanofibers: 15 }, time: 40, prereqs: ['factoryBlueprints'], effect: { t3CapMult: 1.0 } },
        exoticContainment:{ name: 'Exotic Containment',      branch: 'capacity', desc: '+100% T4 caps', costs: { darkMatter: 10, antimatter: 10 }, time: 50, prereqs: ['advFactoryBlueprints'], effect: { t4CapMult: 1.0 } },

        // Automation Branch
        autoExtractors:   { name: 'Auto-Extractors',         branch: 'automation', desc: 'Auto-buy extractors', costs: { energy: 200, data: 200 }, time: 15, prereqs: ['effExtractors1'], effect: { autoExtractors: true } },
        autoProcessors:   { name: 'Auto-Processors',         branch: 'automation', desc: 'Auto-buy processors', costs: { circuits: 100, code: 100 }, time: 25, prereqs: ['processorBlueprints', 'autoExtractors'], effect: { autoProcessors: true } },
        autoCrafting1:    { name: 'Auto-Crafting I',          branch: 'automation', desc: 'Auto-craft T2', costs: { circuits: 50, alloys: 50, code: 50 }, time: 20, prereqs: ['processorBlueprints'], effect: { autoCraftT2: true } },
        autoCrafting2:    { name: 'Auto-Crafting II',         branch: 'automation', desc: 'Auto-craft T3', costs: { aiCores: 20, qCells: 20, nanofibers: 20 }, time: 35, prereqs: ['autoCrafting1', 'factoryBlueprints'], effect: { autoCraftT3: true } },
        autoCrafting3:    { name: 'Auto-Crafting III',        branch: 'automation', desc: 'Auto-craft T4', costs: { darkMatter: 10, antimatter: 10 }, time: 50, prereqs: ['autoCrafting2', 'advFactoryBlueprints'], effect: { autoCraftT4: true } },
        autoFactories:    { name: 'Auto-Factories',           branch: 'automation', desc: 'Auto-buy factories', costs: { aiCores: 30, qCells: 30 }, time: 40, prereqs: ['factoryBlueprints', 'autoProcessors'], effect: { autoFactories: true } },
        smartAutomation:  { name: 'Smart Automation',         branch: 'automation', desc: 'Automation 2x faster', costs: { aiCores: 40, code: 200 }, time: 45, prereqs: ['autoFactories'], effect: { autoSpeed: 2 } },

        // Expansion Branch
        processorBlueprints: { name: 'Processor Blueprints', branch: 'expansion', desc: 'Unlock processors', costs: { energy: 80, minerals: 80, data: 80 }, time: 12, prereqs: [], effect: { unlockProcessors: true } },
        factoryBlueprints:   { name: 'Factory Blueprints',   branch: 'expansion', desc: 'Unlock factories', costs: { circuits: 80, alloys: 80, code: 80 }, time: 25, prereqs: ['processorBlueprints'], effect: { unlockFactories: true } },
        advFactoryBlueprints:{ name: 'Adv. Factory Blueprints', branch: 'expansion', desc: 'Unlock T4 buildings', costs: { aiCores: 30, qCells: 30, nanofibers: 30 }, time: 40, prereqs: ['factoryBlueprints'], effect: { unlockAdvFactories: true } },
        powerGrid1:          { name: 'Power Grid I',         branch: 'expansion', desc: '+50% power capacity', costs: { energy: 200, minerals: 100 }, time: 15, prereqs: [], effect: { powerCapMult: 0.5 } },
        powerGrid2:          { name: 'Power Grid II',        branch: 'expansion', desc: '+100% power capacity', costs: { alloys: 100, circuits: 100 }, time: 30, prereqs: ['powerGrid1', 'processorBlueprints'], effect: { powerCapMult: 1.0 } },
        overdrive1:          { name: 'Overdrive I',          branch: 'expansion', desc: '+100% all production', costs: { circuits: 200, alloys: 200 }, time: 35, prereqs: ['powerGrid2'], effect: { globalMult: 1.0 } },
        overdrive2:          { name: 'Overdrive II',         branch: 'expansion', desc: '+200% all production', costs: { aiCores: 40, qCells: 40 }, time: 50, prereqs: ['overdrive1'], effect: { globalMult: 2.0 } },

        // Transcendence Branch
        singularityTheory:   { name: 'Singularity Theory',   branch: 'transcendence', desc: 'Unlock prestige', costs: { aiCores: 40, qCells: 40, nanofibers: 40 }, time: 60, prereqs: ['factoryBlueprints'], effect: { unlockPrestige: true } },
        shardAmplification:  { name: 'Shard Amplification',  branch: 'transcendence', desc: '+50% shard gain', costs: { darkMatter: 15, antimatter: 15 }, time: 50, prereqs: ['singularityTheory', 'advFactoryBlueprints'], effect: { shardMult: 0.5 } },
        temporalEcho:        { name: 'Temporal Echo',        branch: 'transcendence', desc: 'Keep 10% resources on prestige', costs: { darkMatter: 20, antimatter: 20 }, time: 55, prereqs: ['shardAmplification'], effect: { temporalEcho: true } },
        dimensionalRift:     { name: 'Dimensional Rift',     branch: 'transcendence', desc: '+100% prod per prestige', costs: { darkMatter: 30, antimatter: 30 }, time: 60, prereqs: ['temporalEcho'], effect: { prestigeProdMult: 1.0 } },
        omegaPoint:          { name: 'The Omega Point',      branch: 'transcendence', desc: 'x5 everything!', costs: { darkMatter: 50, antimatter: 50 }, time: 90, prereqs: ['dimensionalRift'], effect: { omegaMult: 5 } },

        // Exotic Branch
        darkMatterTheory:    { name: 'Dark Matter Theory',   branch: 'exotic', desc: 'Unlock DM crafting', costs: { aiCores: 25, qCells: 25 }, time: 30, prereqs: ['factoryBlueprints'], effect: { unlockDM: true } },
        antimatterSynthesis: { name: 'Antimatter Synthesis',  branch: 'exotic', desc: 'Unlock AM crafting', costs: { qCells: 25, nanofibers: 25 }, time: 30, prereqs: ['darkMatterTheory'], effect: { unlockAM: true } },
        exoticMastery:       { name: 'Exotic Mastery',       branch: 'exotic', desc: '+100% T4 production', costs: { darkMatter: 20, antimatter: 20 }, time: 45, prereqs: ['antimatterSynthesis'], effect: { t4ProdMult: 1.0 } },
        realityWarping:      { name: 'Reality Warping',      branch: 'exotic', desc: '2x event frequency & power', costs: { darkMatter: 30, antimatter: 30 }, time: 55, prereqs: ['exoticMastery'], effect: { eventMult: 2 } },
    };

    const BRANCH_NAMES = {
        efficiency: '🎯 Efficiency',
        capacity: '📦 Capacity',
        automation: '⚙️ Automation',
        expansion: '🚀 Expansion',
        transcendence: '🔮 Transcendence',
        exotic: '🌀 Exotic',
    };

    // Prestige upgrades
    const PRESTIGE_UPGRADES = [
        { id: 'shardMagnet',     name: '🧲 Shard Magnet',      desc: '+10% shard gain',                cost: 1 },
        { id: 'quickStart',      name: '🚀 Quick Start',       desc: 'Start with 100 of each T1',     cost: 1 },
        { id: 'efficientReboot', name: '⚡ Efficient Reboot',   desc: '+25% all production',            cost: 2 },
        { id: 'persistentMemory',name: '💾 Persistent Memory',  desc: 'Keep extractors through prestige', cost: 2 },
        { id: 'researchEcho',    name: '🔬 Research Echo',      desc: 'Keep Efficiency branch research', cost: 3 },
        { id: 'autoStart',       name: '⚙️ Auto-Start',        desc: 'Start with automation unlocked', cost: 3 },
        { id: 'shardDoubler',    name: '✨ Shard Doubler',      desc: '2x shard gain',                  cost: 5 },
        { id: 'powerSurge',      name: '⚡ Power Surge',        desc: 'Start with 50 MW',              cost: 5 },
        { id: 'clickMastery',    name: '👆 Click Mastery',      desc: '+500% click power',             cost: 4 },
        { id: 'storageMastery',  name: '📦 Storage Mastery',    desc: '+200% all storage',             cost: 4 },
        { id: 'temporalMastery', name: '⏰ Temporal Mastery',   desc: '+50% game speed',               cost: 7 },
        { id: 'theSingularity',  name: '🌌 The Singularity',    desc: 'x5 all production',             cost: 10 },
    ];

    // Achievement definitions
    const ACHIEVEMENTS = [
        // Clicking
        { id: 'click10',       name: 'First Steps',       icon: '👆', desc: 'Click 10 times',           check: s => s.stats.totalClicks >= 10, bonus: 1 },
        { id: 'click100',      name: 'Clicker',           icon: '👆', desc: 'Click 100 times',          check: s => s.stats.totalClicks >= 100, bonus: 1 },
        { id: 'click1000',     name: 'Click Master',      icon: '👆', desc: 'Click 1,000 times',        check: s => s.stats.totalClicks >= 1000, bonus: 2 },
        { id: 'click10000',    name: 'Click Legend',       icon: '👆', desc: 'Click 10,000 times',       check: s => s.stats.totalClicks >= 10000, bonus: 3 },
        // Resources
        { id: 'energy100',     name: 'Powered Up',        icon: '⚡', desc: 'Have 100 Energy',          check: s => s.resources.energy >= 100, bonus: 1 },
        { id: 'energy1000',    name: 'Energized',         icon: '⚡', desc: 'Have 1,000 Energy',         check: s => s.resources.energy >= 1000, bonus: 2 },
        { id: 'minerals100',   name: 'Miner',             icon: '⛏️', desc: 'Have 100 Minerals',        check: s => s.resources.minerals >= 100, bonus: 1 },
        { id: 'minerals1000',  name: 'Deep Miner',        icon: '⛏️', desc: 'Have 1,000 Minerals',      check: s => s.resources.minerals >= 1000, bonus: 2 },
        { id: 'data100',       name: 'Data Collector',    icon: '📊', desc: 'Have 100 Data',            check: s => s.resources.data >= 100, bonus: 1 },
        { id: 'data1000',      name: 'Big Data',          icon: '📊', desc: 'Have 1,000 Data',          check: s => s.resources.data >= 1000, bonus: 2 },
        { id: 'circuits50',    name: 'Circuit Board',     icon: '🔌', desc: 'Have 50 Circuits',         check: s => s.resources.circuits >= 50, bonus: 2 },
        { id: 'alloys50',      name: 'Alloy Smith',       icon: '🔩', desc: 'Have 50 Alloys',           check: s => s.resources.alloys >= 50, bonus: 2 },
        { id: 'code50',        name: 'Programmer',        icon: '💻', desc: 'Have 50 Code',             check: s => s.resources.code >= 50, bonus: 2 },
        { id: 'aiCore10',      name: 'AI Pioneer',        icon: '🧠', desc: 'Have 10 AI Cores',         check: s => s.resources.aiCores >= 10, bonus: 3 },
        { id: 'qCell10',       name: 'Quantum Leap',      icon: '⚛️', desc: 'Have 10 Quantum Cells',    check: s => s.resources.qCells >= 10, bonus: 3 },
        { id: 'nano10',        name: 'Nano Engineer',     icon: '🧬', desc: 'Have 10 Nanofibers',       check: s => s.resources.nanofibers >= 10, bonus: 3 },
        { id: 'dm5',           name: 'Dark Explorer',     icon: '🌀', desc: 'Have 5 Dark Matter',       check: s => s.resources.darkMatter >= 5, bonus: 4 },
        { id: 'am5',           name: 'Anti World',        icon: '✨', desc: 'Have 5 Antimatter',        check: s => s.resources.antimatter >= 5, bonus: 4 },
        // Buildings
        { id: 'build5',        name: 'Builder',           icon: '🏗️', desc: 'Own 5 buildings',          check: s => totalBuildings(s) >= 5, bonus: 1 },
        { id: 'build25',       name: 'Architect',         icon: '🏗️', desc: 'Own 25 buildings',         check: s => totalBuildings(s) >= 25, bonus: 2 },
        { id: 'build100',      name: 'Mega Builder',      icon: '🏗️', desc: 'Own 100 buildings',        check: s => totalBuildings(s) >= 100, bonus: 3 },
        { id: 'build250',      name: 'City Planner',      icon: '🏗️', desc: 'Own 250 buildings',        check: s => totalBuildings(s) >= 250, bonus: 5 },
        // Research
        { id: 'research5',     name: 'Researcher',        icon: '🔬', desc: 'Complete 5 research',      check: s => s.stats.researchCompleted >= 5, bonus: 2 },
        { id: 'research15',    name: 'Scientist',         icon: '🔬', desc: 'Complete 15 research',     check: s => s.stats.researchCompleted >= 15, bonus: 3 },
        { id: 'research30',    name: 'Genius',            icon: '🔬', desc: 'Complete 30 research',     check: s => s.stats.researchCompleted >= 30, bonus: 5 },
        // Crafting
        { id: 'craft10',       name: 'Crafter',           icon: '🔧', desc: 'Craft 10 items',           check: s => s.stats.totalCrafts >= 10, bonus: 1 },
        { id: 'craft100',      name: 'Master Crafter',    icon: '🔧', desc: 'Craft 100 items',          check: s => s.stats.totalCrafts >= 100, bonus: 2 },
        { id: 'craft500',      name: 'Artisan',           icon: '🔧', desc: 'Craft 500 items',          check: s => s.stats.totalCrafts >= 500, bonus: 3 },
        // Prestige
        { id: 'prestige1',     name: 'Reborn',            icon: '🔮', desc: 'Prestige once',            check: s => s.stats.prestigeCount >= 1, bonus: 3 },
        { id: 'prestige5',     name: 'Cycle Master',      icon: '🔮', desc: 'Prestige 5 times',         check: s => s.stats.prestigeCount >= 5, bonus: 5 },
        { id: 'prestige10',    name: 'Eternal',           icon: '🔮', desc: 'Prestige 10 times',        check: s => s.stats.prestigeCount >= 10, bonus: 5 },
        { id: 'shard10',       name: 'Shard Collector',   icon: '🔮', desc: 'Have 10 shards',           check: s => s.resources.shards >= 10, bonus: 3 },
        { id: 'shard50',       name: 'Shard Hoarder',     icon: '🔮', desc: 'Have 50 shards',           check: s => s.resources.shards >= 50, bonus: 5 },
        // Power
        { id: 'power25',       name: 'Powered',           icon: '⚡', desc: 'Have 25 MW capacity',      check: s => getPowerCap(s) >= 25, bonus: 1 },
        { id: 'power100',      name: 'Power Plant',       icon: '⚡', desc: 'Have 100 MW capacity',     check: s => getPowerCap(s) >= 100, bonus: 2 },
        { id: 'power500',      name: 'Grid Master',       icon: '⚡', desc: 'Have 500 MW capacity',     check: s => getPowerCap(s) >= 500, bonus: 3 },
        // Production rates
        { id: 'rate10',        name: 'Flowing',           icon: '📈', desc: '10+ Energy/s',             check: s => getRate(s, 'energy') >= 10, bonus: 2 },
        { id: 'rate50',        name: 'Streaming',         icon: '📈', desc: '50+ Energy/s',             check: s => getRate(s, 'energy') >= 50, bonus: 3 },
        { id: 'rate100',       name: 'Flooding',          icon: '📈', desc: '100+ Energy/s',            check: s => getRate(s, 'energy') >= 100, bonus: 4 },
        // Time
        { id: 'time5m',        name: 'Getting Started',   icon: '⏰', desc: 'Play for 5 minutes',       check: s => s.stats.timePlayed >= 300, bonus: 1 },
        { id: 'time30m',       name: 'Dedicated',         icon: '⏰', desc: 'Play for 30 minutes',      check: s => s.stats.timePlayed >= 1800, bonus: 2 },
        { id: 'time2h',        name: 'Committed',         icon: '⏰', desc: 'Play for 2 hours',         check: s => s.stats.timePlayed >= 7200, bonus: 3 },
        // Events
        { id: 'event1',        name: 'Lucky',             icon: '🎲', desc: 'Witness an event',         check: s => s.stats.eventsTriggered >= 1, bonus: 1 },
        { id: 'event10',       name: 'Event Horizon',     icon: '🎲', desc: 'Witness 10 events',        check: s => s.stats.eventsTriggered >= 10, bonus: 2 },
        { id: 'event50',       name: 'Chaos Theory',      icon: '🎲', desc: 'Witness 50 events',        check: s => s.stats.eventsTriggered >= 50, bonus: 3 },
        // Automation
        { id: 'autoOn',        name: 'Hands Free',        icon: '🤖', desc: 'Enable any automation',    check: s => Object.values(s.automation).some(v => v), bonus: 2 },
        { id: 'allAutoOn',     name: 'Full Auto',         icon: '🤖', desc: 'Enable all automation',    check: s => countAutoEnabled(s) >= 6, bonus: 5 },
        // Special
        { id: 'allT1_500',     name: 'Stockpile',         icon: '📦', desc: '500+ of each T1',          check: s => s.resources.energy >= 500 && s.resources.minerals >= 500 && s.resources.data >= 500, bonus: 3 },
        { id: 'allT2_100',     name: 'Processed',         icon: '📦', desc: '100+ of each T2',          check: s => s.resources.circuits >= 100 && s.resources.alloys >= 100 && s.resources.code >= 100, bonus: 4 },
        { id: 'allT3_25',      name: 'Advanced',          icon: '📦', desc: '25+ of each T3',           check: s => s.resources.aiCores >= 25 && s.resources.qCells >= 25 && s.resources.nanofibers >= 25, bonus: 5 },
        { id: 'omega',         name: 'Omega',             icon: '🌌', desc: 'Research The Omega Point', check: s => s.research.omegaPoint === true, bonus: 5 },
    ];

    // Random events
    const EVENTS = [
        { name: '⚡ Power Surge',       desc: '+200% Energy production for 30s',   duration: 30, effect: { prodBonus: { energy: 2 } } },
        { name: '⛏️ Rich Vein',         desc: '+200% Mineral production for 30s',  duration: 30, effect: { prodBonus: { minerals: 2 } } },
        { name: '📊 Data Burst',        desc: '+200% Data production for 30s',     duration: 30, effect: { prodBonus: { data: 2 } } },
        { name: '🔌 Circuit Overload',  desc: '+300% Circuit production for 20s',  duration: 20, effect: { prodBonus: { circuits: 3 } } },
        { name: '🎁 Resource Cache',    desc: 'Gain 50 of each T1 resource',       duration: 0,  effect: { instant: { energy: 50, minerals: 50, data: 50 } } },
        { name: '🚀 Productivity Boost',desc: '+100% all production for 45s',      duration: 45, effect: { globalBonus: 1 } },
        { name: '🔬 Research Rush',     desc: 'Research 3x faster for 30s',        duration: 30, effect: { researchSpeed: 3 } },
        { name: '💎 Rare Find',         desc: 'Gain 10 of each T2 resource',       duration: 0,  effect: { instant: { circuits: 10, alloys: 10, code: 10 } } },
        { name: '⚛️ Quantum Fluctuation', desc: 'Gain 5 of each T3 resource',     duration: 0,  effect: { instant: { aiCores: 5, qCells: 5, nanofibers: 5 } } },
        { name: '🌀 Dark Pulse',        desc: '+500% T4 production for 20s',       duration: 20, effect: { prodBonus: { darkMatter: 5, antimatter: 5 } } },
        { name: '👆 Click Frenzy',      desc: '+500% click power for 15s',         duration: 15, effect: { clickBonus: 5 } },
        { name: '📦 Storage Expansion', desc: '+50% all caps for 60s',             duration: 60, effect: { capBonus: 0.5 } },
    ];

    // ===== HELPER FUNCTIONS =====

    function fmt(n) {
        if (n === Infinity) return '∞';
        if (n < 0) return '-' + fmt(-n);
        if (n < 1000) return n % 1 === 0 ? String(n) : n.toFixed(1);
        const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'];
        let tier = Math.floor(Math.log10(Math.abs(n)) / 3);
        if (tier >= suffixes.length) tier = suffixes.length - 1;
        const scaled = n / Math.pow(10, tier * 3);
        return scaled.toFixed(1) + suffixes[tier];
    }

    function fmtTime(seconds) {
        if (seconds < 60) return Math.ceil(seconds) + 's';
        if (seconds < 3600) return Math.floor(seconds / 60) + 'm ' + Math.ceil(seconds % 60) + 's';
        return Math.floor(seconds / 3600) + 'h ' + Math.floor((seconds % 3600) / 60) + 'm';
    }

    function totalBuildings(s) {
        let t = 0;
        for (const k in s.buildings) t += s.buildings[k];
        return t;
    }

    function countAutoEnabled(s) {
        let c = 0;
        for (const k in s.automation) if (s.automation[k]) c++;
        return c;
    }

    // ===== GAME STATE =====

    function createDefaultState() {
        const resources = {};
        for (const id of RESOURCE_IDS) resources[id] = 0;

        const buildings = {};
        for (const id in BUILDINGS) buildings[id] = 0;

        const research = {};
        for (const id in RESEARCH) research[id] = false;

        return {
            resources,
            buildings,
            research,
            researchQueue: null, // { id, progress, total }
            automation: {
                extractors: false,
                processors: false,
                factories: false,
                craftT2: false,
                craftT3: false,
                craftT4: false,
            },
            prestigeUpgrades: {},
            achievements: {},
            activeEvents: [], // { name, desc, effect, endTime }
            stats: {
                totalClicks: 0,
                totalCrafts: 0,
                researchCompleted: 0,
                prestigeCount: 0,
                totalGathered: {},
                buildingsBuilt: 0,
                eventsTriggered: 0,
                timePlayed: 0,
                achievementsUnlocked: 0,
            },
            lastSave: Date.now(),
            lastTick: Date.now(),
            gameSpeed: 1,
        };
    }

    let game = createDefaultState();

    // ===== COMPUTED VALUES =====

    function getResourceCap(resId) {
        const def = RESOURCES[resId];
        if (!def || def.baseCap === Infinity) return Infinity;

        let cap = def.baseCap;

        // Building storage bonuses
        for (const bId in BUILDINGS) {
            const b = BUILDINGS[bId];
            if (b.capBonus && b.capBonus[resId]) {
                cap += b.capBonus[resId] * game.buildings[bId];
            }
        }

        // Research cap multipliers
        const tier = def.tier;
        let mult = 1;
        for (const rId in RESEARCH) {
            if (!game.research[rId]) continue;
            const eff = RESEARCH[rId].effect;
            if (tier === 1 && eff.t1CapMult) mult += eff.t1CapMult;
            if (tier === 2 && eff.t2CapMult) mult += eff.t2CapMult;
            if (tier === 3 && eff.t3CapMult) mult += eff.t3CapMult;
            if (tier === 4 && eff.t4CapMult) mult += eff.t4CapMult;
        }

        // Prestige storage mastery
        if (game.prestigeUpgrades.storageMastery) mult += 2;

        // Event cap bonus
        for (const ev of game.activeEvents) {
            if (ev.effect.capBonus) mult += ev.effect.capBonus;
        }

        return Math.floor(cap * mult);
    }

    function getPowerCap(s) {
        let cap = 0;
        for (const bId in BUILDINGS) {
            const b = BUILDINGS[bId];
            if (b.powerGen) cap += b.powerGen * (s || game).buildings[bId];
        }

        // Research power grid multipliers
        let mult = 1;
        for (const rId in RESEARCH) {
            if (!(s || game).research[rId]) continue;
            if (RESEARCH[rId].effect.powerCapMult) mult += RESEARCH[rId].effect.powerCapMult;
        }

        // Prestige power surge
        if ((s || game).prestigeUpgrades.powerSurge) cap += 50;

        return Math.floor(cap * mult);
    }

    function getPowerUsage() {
        let usage = 0;
        for (const bId in BUILDINGS) {
            const b = BUILDINGS[bId];
            if (b.powerUse) usage += b.powerUse * game.buildings[bId];
        }
        return usage;
    }

    function getPowerEfficiency() {
        const cap = getPowerCap();
        const usage = getPowerUsage();
        if (usage === 0) return 1;
        if (cap >= usage) return 1;
        return 0.1; // 10% when over capacity
    }

    function getProductionMultiplier(buildingId) {
        const b = BUILDINGS[buildingId];
        let mult = 1;
        const eff = getPowerEfficiency();
        mult *= eff;

        // Research multipliers
        for (const rId in RESEARCH) {
            if (!game.research[rId]) continue;
            const re = RESEARCH[rId].effect;
            if (b.cat === 'extractors' && re.extractorMult) mult += re.extractorMult;
            if (b.cat === 'processors' && re.processorMult) mult += re.processorMult;
            if ((b.cat === 'factories' || b.cat === 'advFactories') && re.factoryMult) mult += re.factoryMult;
            if (b.cat === 'advFactories' && re.t4ProdMult) mult += re.t4ProdMult;
            if (re.globalMult) mult += re.globalMult;
            if (re.omegaMult) mult *= re.omegaMult;
        }

        // Prestige multipliers
        if (game.prestigeUpgrades.efficientReboot) mult += 0.25;
        if (game.prestigeUpgrades.theSingularity) mult *= 5;

        // Prestige count bonus (dimensional rift)
        for (const rId in RESEARCH) {
            if (!game.research[rId]) continue;
            if (RESEARCH[rId].effect.prestigeProdMult) {
                mult += RESEARCH[rId].effect.prestigeProdMult * game.stats.prestigeCount;
            }
        }

        // Achievement bonus
        let achBonus = 0;
        for (const ach of ACHIEVEMENTS) {
            if (game.achievements[ach.id]) achBonus += ach.bonus;
        }
        mult *= (1 + achBonus / 100);

        // Game speed (temporal mastery)
        if (game.prestigeUpgrades.temporalMastery) mult *= 1.5;

        // Event bonuses
        for (const ev of game.activeEvents) {
            if (ev.effect.globalBonus) mult += ev.effect.globalBonus;
            if (ev.effect.prodBonus) {
                for (const resId in b.produces) {
                    if (ev.effect.prodBonus[resId]) mult += ev.effect.prodBonus[resId];
                }
            }
        }

        return mult;
    }

    function getClickPower() {
        let power = 1;
        // Research
        for (const rId in RESEARCH) {
            if (!game.research[rId]) continue;
            if (RESEARCH[rId].effect.clickMult) power += RESEARCH[rId].effect.clickMult;
        }
        // Prestige
        if (game.prestigeUpgrades.clickMastery) power += 5;
        // Events
        for (const ev of game.activeEvents) {
            if (ev.effect.clickBonus) power += ev.effect.clickBonus;
        }
        // Achievement bonus
        let achBonus = 0;
        for (const ach of ACHIEVEMENTS) {
            if (game.achievements[ach.id]) achBonus += ach.bonus;
        }
        power *= (1 + achBonus / 100);
        return Math.floor(power);
    }

    function getRate(s, resId) {
        // Calculate net rate for a resource
        let rate = 0;
        for (const bId in BUILDINGS) {
            const b = BUILDINGS[bId];
            const count = (s || game).buildings[bId];
            if (count === 0) continue;
            const mult = getProductionMultiplier(bId);
            if (b.produces[resId]) rate += b.produces[resId] * count * mult;
            if (b.consumes[resId]) rate -= b.consumes[resId] * count * mult;
        }
        return rate;
    }

    function getBuildingCost(buildingId) {
        const b = BUILDINGS[buildingId];
        const count = game.buildings[buildingId];
        const costs = {};
        for (const resId in b.costs) {
            costs[resId] = Math.ceil(b.costs[resId] * Math.pow(COST_SCALE, count));
        }
        return costs;
    }

    function canAfford(costs) {
        for (const resId in costs) {
            if (game.resources[resId] < costs[resId]) return false;
        }
        return true;
    }

    function spendResources(costs) {
        for (const resId in costs) {
            game.resources[resId] -= costs[resId];
        }
    }

    function addResource(resId, amount) {
        const cap = getResourceCap(resId);
        game.resources[resId] = Math.min(game.resources[resId] + amount, cap);
    }

    function isBuildingUnlocked(buildingId) {
        const b = BUILDINGS[buildingId];
        if (!b.unlock) return true;
        return game.research[b.unlock] === true;
    }

    function isResearchUnlocked(researchId) {
        const r = RESEARCH[researchId];
        for (const prereq of r.prereqs) {
            if (!game.research[prereq]) return false;
        }
        return true;
    }

    function isRecipeUnlocked(recipe) {
        const tier = RESOURCES[recipe.output].tier;
        if (tier <= 2) return true;
        if (tier === 3) return game.research.factoryBlueprints === true;
        if (tier === 4) {
            if (recipe.output === 'darkMatter') return game.research.darkMatterTheory === true;
            if (recipe.output === 'antimatter') return game.research.antimatterSynthesis === true;
        }
        return true;
    }

    function getPrestigeShards() {
        let totalAdvanced = 0;
        // Sum of all T3 and T4 ever produced (approximate from current + buildings)
        for (const resId of RESOURCE_IDS) {
            const tier = RESOURCES[resId].tier;
            if (tier === 3 || tier === 4) {
                totalAdvanced += game.resources[resId];
            }
        }
        // Also count from building production rates
        for (const bId in BUILDINGS) {
            const b = BUILDINGS[bId];
            for (const resId in b.produces) {
                if (RESOURCES[resId].tier >= 3) {
                    totalAdvanced += b.produces[resId] * game.buildings[bId] * 100; // estimate
                }
            }
        }

        let shards = Math.floor(Math.pow(totalAdvanced / 5, 0.7));

        // Shard multipliers
        if (game.prestigeUpgrades.shardMagnet) shards = Math.floor(shards * 1.1);
        if (game.prestigeUpgrades.shardDoubler) shards *= 2;
        for (const rId in RESEARCH) {
            if (game.research[rId] && RESEARCH[rId].effect.shardMult) {
                shards = Math.floor(shards * (1 + RESEARCH[rId].effect.shardMult));
            }
        }

        return Math.max(0, shards);
    }

    // ===== GAME ACTIONS =====

    function gatherResource(resId, e) {
        const power = getClickPower();
        addResource(resId, power);
        game.stats.totalClicks++;
        if (!game.stats.totalGathered[resId]) game.stats.totalGathered[resId] = 0;
        game.stats.totalGathered[resId] += power;

        // Floating number
        if (e) {
            const rect = e.target.getBoundingClientRect();
            showFloatingNumber(`+${power}`, rect.left + rect.width / 2, rect.top);
        }
    }

    function craftRecipe(recipe) {
        if (!canAfford(recipe.costs)) return;
        const cap = getResourceCap(recipe.output);
        if (game.resources[recipe.output] >= cap) return;
        spendResources(recipe.costs);
        addResource(recipe.output, recipe.amount);
        game.stats.totalCrafts++;
    }

    function buyBuilding(buildingId) {
        const costs = getBuildingCost(buildingId);
        if (!canAfford(costs)) return;
        if (!isBuildingUnlocked(buildingId)) return;
        spendResources(costs);
        game.buildings[buildingId]++;
        game.stats.buildingsBuilt++;
    }

    function startResearch(researchId) {
        if (game.research[researchId]) return;
        if (game.researchQueue) return;
        if (!isResearchUnlocked(researchId)) return;
        const r = RESEARCH[researchId];
        if (!canAfford(r.costs)) return;
        spendResources(r.costs);
        game.researchQueue = { id: researchId, progress: 0, total: r.time };
    }

    function completeResearch(researchId) {
        game.research[researchId] = true;
        game.researchQueue = null;
        game.stats.researchCompleted++;
        showToast('🔬 Research Complete', RESEARCH[researchId].name, 'achievement');
    }

    function doPrestige() {
        if (!game.research.singularityTheory) return;
        const shards = getPrestigeShards();
        if (shards <= 0) return;

        const savedShards = game.resources.shards + shards;
        const savedPrestigeUpgrades = { ...game.prestigeUpgrades };
        const savedAchievements = { ...game.achievements };
        const savedStats = { ...game.stats };
        savedStats.prestigeCount++;

        // Temporal echo: keep 10% of resources
        let keptResources = {};
        if (game.research.temporalEcho || savedPrestigeUpgrades.temporalEcho) {
            for (const resId of RESOURCE_IDS) {
                if (RESOURCES[resId].tier <= 4) {
                    keptResources[resId] = Math.floor(game.resources[resId] * 0.1);
                }
            }
        }

        // Reset
        const newState = createDefaultState();
        newState.resources.shards = savedShards;
        newState.prestigeUpgrades = savedPrestigeUpgrades;
        newState.achievements = savedAchievements;
        newState.stats = savedStats;

        // Quick start
        if (savedPrestigeUpgrades.quickStart) {
            newState.resources.energy = 100;
            newState.resources.minerals = 100;
            newState.resources.data = 100;
        }

        // Temporal echo
        for (const resId in keptResources) {
            newState.resources[resId] = Math.max(newState.resources[resId], keptResources[resId]);
        }

        // Persistent memory: keep extractors
        if (savedPrestigeUpgrades.persistentMemory) {
            newState.buildings.energyDrill = game.buildings.energyDrill;
            newState.buildings.mineralMiner = game.buildings.mineralMiner;
            newState.buildings.dataScanner = game.buildings.dataScanner;
        }

        // Research echo: keep efficiency branch
        if (savedPrestigeUpgrades.researchEcho) {
            for (const rId in RESEARCH) {
                if (RESEARCH[rId].branch === 'efficiency' && game.research[rId]) {
                    newState.research[rId] = true;
                }
            }
        }

        // Auto-start
        if (savedPrestigeUpgrades.autoStart) {
            newState.research.autoExtractors = true;
            newState.research.autoCrafting1 = true;
            newState.automation.extractors = true;
            newState.automation.craftT2 = true;
        }

        game = newState;
        showToast('🔮 Prestige!', `Gained ${shards} Singularity Shards!`, 'prestige-toast');
        renderAll();
    }

    function buyPrestigeUpgrade(upgradeId) {
        const upg = PRESTIGE_UPGRADES.find(u => u.id === upgradeId);
        if (!upg) return;
        if (game.prestigeUpgrades[upgradeId]) return;
        if (game.resources.shards < upg.cost) return;
        game.resources.shards -= upg.cost;
        game.prestigeUpgrades[upgradeId] = true;
        showToast('🔮 Upgrade Purchased', upg.name, 'prestige-toast');
    }

    // ===== GAME LOOP =====

    let lastFrameTime = performance.now();
    let autoTimer = 0;
    let eventTimer = 0;
    let saveTimer = 0;

    function gameLoop(now) {
        try {
            const rawDt = (now - lastFrameTime) / 1000;
            lastFrameTime = now;
            const dt = Math.min(rawDt, 0.1); // cap delta

            const speed = game.prestigeUpgrades.temporalMastery ? 1.5 : 1;
            const effectiveDt = dt * speed;

            // Update timers
            game.stats.timePlayed += dt;
            saveTimer += dt * 1000;
            eventTimer += dt;
            autoTimer += effectiveDt;

            // Production tick
            tickProduction(effectiveDt);

            // Research tick
            tickResearch(effectiveDt);

            // Automation tick
            const autoInterval = game.research.smartAutomation ? 0.5 : 1;
            if (autoTimer >= autoInterval) {
                autoTimer -= autoInterval;
                tickAutomation();
            }

            // Events
            const eventChance = EVENT_CHANCE * dt * (game.research.realityWarping ? 2 : 1);
            if (Math.random() < eventChance) {
                triggerRandomEvent();
            }

            // Clean expired events
            game.activeEvents = game.activeEvents.filter(ev => {
                if (ev.duration === 0) return false;
                return Date.now() < ev.endTime;
            });

            // Auto-save
            if (saveTimer >= AUTO_SAVE_INTERVAL) {
                saveTimer = 0;
                saveGame();
            }

            // Check achievements
            checkAchievements();

            // Update UI
            updateUI();
        } catch (e) {
            console.error('Game loop error:', e);
        }

        requestAnimationFrame(gameLoop);
    }

    function tickProduction(dt) {
        for (const bId in BUILDINGS) {
            const b = BUILDINGS[bId];
            const count = game.buildings[bId];
            if (count === 0) continue;
            if (Object.keys(b.produces).length === 0) continue;

            const mult = getProductionMultiplier(bId);

            // Check if we can consume
            let canProduce = true;
            for (const resId in b.consumes) {
                const needed = b.consumes[resId] * count * mult * dt;
                if (game.resources[resId] < needed) {
                    canProduce = false;
                    break;
                }
            }

            if (canProduce) {
                // Consume
                for (const resId in b.consumes) {
                    game.resources[resId] -= b.consumes[resId] * count * mult * dt;
                    game.resources[resId] = Math.max(0, game.resources[resId]);
                }
                // Produce
                for (const resId in b.produces) {
                    addResource(resId, b.produces[resId] * count * mult * dt);
                }
            }
        }
    }

    function tickResearch(dt) {
        if (!game.researchQueue) return;
        let speed = 1;
        for (const ev of game.activeEvents) {
            if (ev.effect.researchSpeed) speed *= ev.effect.researchSpeed;
        }
        game.researchQueue.progress += dt * speed;
        if (game.researchQueue.progress >= game.researchQueue.total) {
            completeResearch(game.researchQueue.id);
        }
    }

    function tickAutomation() {
        // Auto-buy extractors
        if (game.automation.extractors && game.research.autoExtractors) {
            for (const bId of ['energyDrill', 'mineralMiner', 'dataScanner']) {
                const costs = getBuildingCost(bId);
                if (canAfford(costs)) buyBuilding(bId);
            }
        }

        // Auto-buy processors
        if (game.automation.processors && game.research.autoProcessors) {
            for (const bId of ['circuitFoundry', 'alloySmelter', 'codeCompiler']) {
                if (isBuildingUnlocked(bId)) {
                    const costs = getBuildingCost(bId);
                    if (canAfford(costs)) buyBuilding(bId);
                }
            }
        }

        // Auto-buy factories
        if (game.automation.factories && game.research.autoFactories) {
            for (const bId of ['aiLab', 'quantumReactor', 'nanoAssembler']) {
                if (isBuildingUnlocked(bId)) {
                    const costs = getBuildingCost(bId);
                    if (canAfford(costs)) buyBuilding(bId);
                }
            }
        }

        // Auto-craft T2
        if (game.automation.craftT2 && game.research.autoCrafting1) {
            for (const r of RECIPES) {
                if (RESOURCES[r.output].tier === 2 && canAfford(r.costs)) {
                    craftRecipe(r);
                }
            }
        }

        // Auto-craft T3
        if (game.automation.craftT3 && game.research.autoCrafting2) {
            for (const r of RECIPES) {
                if (RESOURCES[r.output].tier === 3 && canAfford(r.costs)) {
                    craftRecipe(r);
                }
            }
        }

        // Auto-craft T4
        if (game.automation.craftT4 && game.research.autoCrafting3) {
            for (const r of RECIPES) {
                if (RESOURCES[r.output].tier === 4 && isRecipeUnlocked(r) && canAfford(r.costs)) {
                    craftRecipe(r);
                }
            }
        }
    }

    function triggerRandomEvent() {
        // Filter events based on game progress
        const available = EVENTS.filter(ev => {
            if (ev.effect.prodBonus) {
                for (const resId in ev.effect.prodBonus) {
                    if (RESOURCES[resId].tier >= 3 && !game.research.factoryBlueprints) return false;
                    if (RESOURCES[resId].tier >= 4 && !game.research.advFactoryBlueprints) return false;
                }
            }
            if (ev.effect.instant) {
                for (const resId in ev.effect.instant) {
                    if (RESOURCES[resId].tier >= 3 && !game.research.factoryBlueprints) return false;
                }
            }
            return true;
        });

        if (available.length === 0) return;

        const event = available[Math.floor(Math.random() * available.length)];
        game.stats.eventsTriggered++;

        // Apply instant effects
        if (event.effect.instant) {
            for (const resId in event.effect.instant) {
                let amount = event.effect.instant[resId];
                if (game.research.realityWarping) amount *= 2;
                addResource(resId, amount);
            }
        }

        // Add timed effect
        if (event.duration > 0) {
            const dur = event.duration * (game.research.realityWarping ? 2 : 1);
            game.activeEvents.push({
                name: event.name,
                desc: event.desc,
                effect: event.effect,
                duration: dur,
                endTime: Date.now() + dur * 1000,
            });
        }

        showToast(event.name, event.desc, 'event', event.duration > 0 ? event.duration : undefined);
    }

    function checkAchievements() {
        for (const ach of ACHIEVEMENTS) {
            if (game.achievements[ach.id]) continue;
            try {
                if (ach.check(game)) {
                    game.achievements[ach.id] = true;
                    game.stats.achievementsUnlocked++;
                    showToast('🏆 Achievement!', `${ach.icon} ${ach.name} — +${ach.bonus}% production`, 'achievement');
                }
            } catch (e) { /* ignore */ }
        }
    }

    // ===== SAVE/LOAD =====

    function saveGame() {
        try {
            game.lastSave = Date.now();
            const data = JSON.stringify(game);
            localStorage.setItem(SAVE_KEY, data);
            updateSaveIndicator();
        } catch (e) {
            console.error('Save failed:', e);
        }
    }

    function loadGame() {
        try {
            const data = localStorage.getItem(SAVE_KEY);
            if (!data) return false;
            const parsed = JSON.parse(data);

            // Merge with defaults to handle missing fields
            const defaults = createDefaultState();
            game = deepMerge(defaults, parsed);

            // Calculate offline progress
            const now = Date.now();
            const offlineMs = now - (game.lastTick || now);
            const offlineSec = Math.min(offlineMs / 1000, MAX_OFFLINE_HOURS * 3600);

            if (offlineSec > 10) {
                // Simulate offline production
                tickProduction(offlineSec * 0.5); // 50% efficiency offline
                showToast('⏰ Welcome Back!', `Earned ${fmtTime(offlineSec)} of offline progress (50% efficiency)`, 'event');
            }

            game.lastTick = now;
            return true;
        } catch (e) {
            console.error('Load failed:', e);
            return false;
        }
    }

    function deepMerge(target, source) {
        const result = { ...target };
        for (const key in source) {
            if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key]) && typeof target[key] === 'object' && target[key] !== null) {
                result[key] = deepMerge(target[key], source[key]);
            } else {
                result[key] = source[key];
            }
        }
        return result;
    }

    function exportSave() {
        try {
            saveGame();
            const data = localStorage.getItem(SAVE_KEY);
            const encoded = btoa(data);
            navigator.clipboard.writeText(encoded).then(() => {
                showToast('📤 Exported', 'Save copied to clipboard!');
            }).catch(() => {
                // Fallback
                const ta = document.createElement('textarea');
                ta.value = encoded;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                showToast('📤 Exported', 'Save copied to clipboard!');
            });
        } catch (e) {
            showToast('❌ Error', 'Export failed');
        }
    }

    function importSave(encoded) {
        try {
            const data = atob(encoded.trim());
            const parsed = JSON.parse(data);
            localStorage.setItem(SAVE_KEY, data);
            const defaults = createDefaultState();
            game = deepMerge(defaults, parsed);
            game.lastTick = Date.now();
            renderAll();
            showToast('📥 Imported', 'Save loaded successfully!');
        } catch (e) {
            showToast('❌ Error', 'Invalid save data');
        }
    }

    function hardReset() {
        localStorage.removeItem(SAVE_KEY);
        game = createDefaultState();
        renderAll();
        showToast('🗑️ Reset', 'All progress has been deleted');
    }

    // ===== UI RENDERING =====

    const domCache = {};

    function $(id) {
        if (!domCache[id]) domCache[id] = document.getElementById(id);
        return domCache[id];
    }

    function renderAll() {
        renderResourceBar();
        renderGatherButtons();
        renderCraftingButtons();
        renderBuildings();
        renderResearch();
        renderAutomation();
        renderPrestige();
        renderAchievements();
        renderStats();
        updateUI();
    }

    function renderResourceBar() {
        const bar = $('resource-bar');
        bar.innerHTML = '';
        for (const resId of RESOURCE_IDS) {
            const def = RESOURCES[resId];
            // Only show resources that are relevant
            if (def.tier >= 2 && !hasAnyOfTier(def.tier) && !canProduceTier(def.tier)) continue;
            if (resId === 'shards' && !game.research.singularityTheory && game.resources.shards === 0) continue;

            const el = document.createElement('div');
            el.className = 'res-display';
            el.id = `res-${resId}`;
            el.innerHTML = `
                <span class="res-icon">${def.icon}</span>
                <span class="res-amount" id="res-amt-${resId}">0</span>
                ${def.baseCap !== Infinity ? `<span class="res-cap" id="res-cap-${resId}">/ 0</span>` : ''}
                <span class="res-rate" id="res-rate-${resId}"></span>
            `;
            bar.appendChild(el);
        }
    }

    function hasAnyOfTier(tier) {
        for (const resId of RESOURCE_IDS) {
            if (RESOURCES[resId].tier === tier && game.resources[resId] > 0) return true;
        }
        return false;
    }

    function canProduceTier(tier) {
        if (tier === 2) return game.research.processorBlueprints;
        if (tier === 3) return game.research.factoryBlueprints;
        if (tier === 4) return game.research.advFactoryBlueprints || game.research.darkMatterTheory;
        return false;
    }

    function renderGatherButtons() {
        const container = $('gather-buttons');
        container.innerHTML = '';
        for (const resId of ['energy', 'minerals', 'data']) {
            const def = RESOURCES[resId];
            const btn = document.createElement('button');
            btn.className = 'gather-btn';
            btn.innerHTML = `
                <span class="emoji">${def.icon}</span>
                <span class="label">Gather ${def.name}</span>
                <span class="amount" id="gather-power-${resId}">+${getClickPower()}</span>
            `;
            btn.addEventListener('click', (e) => gatherResource(resId, e));
            container.appendChild(btn);
        }
    }

    function renderCraftingButtons() {
        const container = $('crafting-buttons');
        container.innerHTML = '';
        for (const recipe of RECIPES) {
            if (!isRecipeUnlocked(recipe)) continue;
            const def = RESOURCES[recipe.output];
            const btn = document.createElement('button');
            btn.className = 'craft-btn';
            btn.dataset.recipe = recipe.id;
            btn.innerHTML = `
                <div class="craft-header">${def.icon} Craft ${def.name}</div>
                <div class="craft-cost" id="craft-cost-${recipe.id}"></div>
            `;
            btn.addEventListener('click', () => craftRecipe(recipe));
            container.appendChild(btn);
        }
    }

    function renderBuildings() {
        const container = $('building-categories');
        container.innerHTML = '';

        for (const catId in BUILDING_CATEGORIES) {
            const cat = BUILDING_CATEGORIES[catId];
            const buildings = Object.entries(BUILDINGS).filter(([, b]) => b.cat === catId);
            if (buildings.length === 0) continue;

            // Check if any building in category is unlocked
            const anyUnlocked = buildings.some(([id]) => isBuildingUnlocked(id));
            if (!anyUnlocked && catId !== 'extractors' && catId !== 'storage' && catId !== 'power') continue;

            const section = document.createElement('div');
            section.className = 'building-category';
            section.innerHTML = `<h3>${cat.name}</h3>`;

            const list = document.createElement('div');
            list.className = 'building-list';

            for (const [bId, b] of buildings) {
                const unlocked = isBuildingUnlocked(bId);
                const card = document.createElement('div');
                card.className = `building-card ${unlocked ? '' : 'locked'}`;
                card.id = `bcard-${bId}`;
                card.innerHTML = `
                    <div class="building-top">
                        <span class="building-name">${b.name}</span>
                        <span class="building-count" id="bcount-${bId}">×${game.buildings[bId]}</span>
                    </div>
                    <div class="building-desc">${b.desc}</div>
                    ${b.powerUse > 0 ? `<div class="building-power">⚡ ${b.powerUse} MW each</div>` : ''}
                    ${b.powerGen ? `<div class="building-power" style="color:var(--accent-green)">⚡ +${b.powerGen} MW each</div>` : ''}
                    <div class="building-cost" id="bcost-${bId}"></div>
                    <button class="building-buy" id="bbuy-${bId}" ${unlocked ? '' : 'disabled'}>Buy</button>
                `;
                list.appendChild(card);

                // Attach event after adding to DOM
                setTimeout(() => {
                    const buyBtn = document.getElementById(`bbuy-${bId}`);
                    if (buyBtn) buyBtn.addEventListener('click', () => buyBuilding(bId));
                }, 0);
            }

            section.appendChild(list);
            container.appendChild(section);
        }
    }

    function renderResearch() {
        const container = $('research-branches');
        container.innerHTML = '';

        for (const branchId in BRANCH_NAMES) {
            const techs = Object.entries(RESEARCH).filter(([, r]) => r.branch === branchId);
            if (techs.length === 0) continue;

            const section = document.createElement('div');
            section.className = 'research-branch';
            section.innerHTML = `<h3>${BRANCH_NAMES[branchId]}</h3>`;

            const list = document.createElement('div');
            list.className = 'research-list';

            for (const [rId, r] of techs) {
                const completed = game.research[rId];
                const unlocked = isResearchUnlocked(rId);
                const inProgress = game.researchQueue && game.researchQueue.id === rId;

                const card = document.createElement('div');
                card.className = `research-card ${completed ? 'completed' : ''} ${!unlocked && !completed ? 'locked' : ''} ${inProgress ? 'in-progress' : ''}`;
                card.id = `rcard-${rId}`;

                let content = `<div class="research-name">${r.name}</div>`;
                content += `<div class="research-desc">${r.desc}</div>`;

                if (r.prereqs.length > 0 && !completed) {
                    const prereqNames = r.prereqs.map(p => (game.research[p] ? '✅' : '❌') + ' ' + RESEARCH[p].name).join(', ');
                    content += `<div class="research-prereq">Requires: ${prereqNames}</div>`;
                }

                if (!completed) {
                    content += `<div class="research-time">⏱️ ${r.time}s</div>`;
                    content += `<div class="research-cost" id="rcost-${rId}"></div>`;

                    if (inProgress) {
                        content += `<div class="research-progress"><div class="research-progress-fill" id="rprog-${rId}"></div></div>`;
                    }

                    content += completed ? '' : `<button class="research-btn" id="rbtn-${rId}" ${unlocked && !game.researchQueue ? '' : 'disabled'}>Research</button>`;
                } else {
                    content += `<div class="research-complete-badge">✅ Completed</div>`;
                }

                card.innerHTML = content;
                list.appendChild(card);

                if (!completed) {
                    setTimeout(() => {
                        const btn = document.getElementById(`rbtn-${rId}`);
                        if (btn) btn.addEventListener('click', () => startResearch(rId));
                    }, 0);
                }
            }

            section.appendChild(list);
            container.appendChild(section);
        }
    }

    function renderAutomation() {
        const container = $('automation-controls');
        container.innerHTML = '';

        const autoOptions = [
            { id: 'extractors', name: '⛏️ Auto-Buy Extractors', desc: 'Automatically purchase extractors', unlock: 'autoExtractors' },
            { id: 'processors', name: '🔧 Auto-Buy Processors', desc: 'Automatically purchase processors', unlock: 'autoProcessors' },
            { id: 'factories', name: '🏭 Auto-Buy Factories', desc: 'Automatically purchase factories', unlock: 'autoFactories' },
            { id: 'craftT2', name: '🔌 Auto-Craft T2', desc: 'Automatically craft T2 resources', unlock: 'autoCrafting1' },
            { id: 'craftT3', name: '🧠 Auto-Craft T3', desc: 'Automatically craft T3 resources', unlock: 'autoCrafting2' },
            { id: 'craftT4', name: '🌀 Auto-Craft T4', desc: 'Automatically craft T4 resources', unlock: 'autoCrafting3' },
        ];

        for (const opt of autoOptions) {
            const unlocked = game.research[opt.unlock];
            const card = document.createElement('div');
            card.className = `auto-card ${unlocked ? '' : 'locked'}`;
            card.innerHTML = `
                <div>
                    <div class="auto-info">${opt.name}</div>
                    <div class="auto-desc">${unlocked ? opt.desc : '🔒 Requires: ' + RESEARCH[opt.unlock].name}</div>
                </div>
                <label class="toggle">
                    <input type="checkbox" id="auto-${opt.id}" ${game.automation[opt.id] ? 'checked' : ''} ${unlocked ? '' : 'disabled'}>
                    <span class="toggle-slider"></span>
                </label>
            `;
            container.appendChild(card);

            setTimeout(() => {
                const cb = document.getElementById(`auto-${opt.id}`);
                if (cb) cb.addEventListener('change', (e) => {
                    game.automation[opt.id] = e.target.checked;
                });
            }, 0);
        }
    }

    function renderPrestige() {
        const info = $('prestige-info');
        const unlocked = game.research.singularityTheory;

        if (!unlocked && game.resources.shards === 0) {
            info.innerHTML = `
                <p style="color:var(--text-dim)">🔒 Research "Singularity Theory" to unlock the prestige system.</p>
            `;
            $('prestige-upgrades').innerHTML = '';
            return;
        }

        const shards = getPrestigeShards();
        info.innerHTML = `
            <div class="prestige-shards">🔮 ${game.resources.shards} Singularity Shards</div>
            ${unlocked ? `
                <div class="prestige-gain">Prestige now to gain <strong style="color:var(--accent-magenta)">${shards}</strong> shards</div>
                <p style="font-size:0.75rem;color:var(--text-dim);margin-bottom:12px">Resets resources, buildings, and research. Keeps shards and prestige upgrades.</p>
                <button class="prestige-btn" id="prestige-btn" ${shards > 0 ? '' : 'disabled'}>🔮 Prestige for ${shards} Shards</button>
            ` : ''}
        `;

        if (unlocked) {
            setTimeout(() => {
                const btn = document.getElementById('prestige-btn');
                if (btn) btn.addEventListener('click', () => {
                    if (confirm(`Are you sure you want to prestige? You will gain ${shards} shards but lose most progress.`)) {
                        doPrestige();
                    }
                });
            }, 0);
        }

        // Prestige upgrades
        const upgContainer = $('prestige-upgrades');
        upgContainer.innerHTML = '';

        for (const upg of PRESTIGE_UPGRADES) {
            const purchased = game.prestigeUpgrades[upg.id];
            const canBuy = game.resources.shards >= upg.cost && !purchased;
            const card = document.createElement('div');
            card.className = `prestige-upgrade-card ${purchased ? 'purchased' : ''} ${!canBuy && !purchased ? 'locked' : ''}`;
            card.innerHTML = `
                <div class="pu-name">${upg.name}</div>
                <div class="pu-desc">${upg.desc}</div>
                <div class="pu-cost">🔮 ${upg.cost} Shards</div>
                ${purchased ? '<div style="color:var(--accent-green);font-size:0.75rem">✅ Purchased</div>' :
                    `<button class="pu-btn" id="pu-${upg.id}" ${canBuy ? '' : 'disabled'}>Buy</button>`}
            `;
            upgContainer.appendChild(card);

            if (!purchased) {
                setTimeout(() => {
                    const btn = document.getElementById(`pu-${upg.id}`);
                    if (btn) btn.addEventListener('click', () => {
                        buyPrestigeUpgrade(upg.id);
                        renderPrestige();
                    });
                }, 0);
            }
        }
    }

    function renderAchievements() {
        const container = $('achievement-grid');
        container.innerHTML = '';

        for (const ach of ACHIEVEMENTS) {
            const unlocked = game.achievements[ach.id];
            const card = document.createElement('div');
            card.className = `achievement-card ${unlocked ? 'unlocked' : ''}`;
            card.innerHTML = `
                <div class="ach-icon">${ach.icon}</div>
                <div class="ach-name">${unlocked ? ach.name : '???'}</div>
                <div class="ach-desc">${unlocked ? ach.desc : 'Hidden'}</div>
                ${unlocked ? `<div class="ach-bonus">+${ach.bonus}% production</div>` : ''}
            `;
            container.appendChild(card);
        }
    }

    function renderStats() {
        const container = $('stats-dashboard');
        container.innerHTML = '';

        const stats = [
            { label: '⏰ Time Played', value: fmtTime(game.stats.timePlayed) },
            { label: '👆 Total Clicks', value: fmt(game.stats.totalClicks) },
            { label: '🏗️ Buildings Built', value: fmt(game.stats.buildingsBuilt) },
            { label: '🏗️ Buildings Owned', value: fmt(totalBuildings(game)) },
            { label: '🔬 Research Completed', value: game.stats.researchCompleted },
            { label: '🔮 Prestige Count', value: game.stats.prestigeCount },
            { label: '🔮 Shards', value: game.resources.shards },
            { label: '🔧 Total Crafts', value: fmt(game.stats.totalCrafts) },
            { label: '🏆 Achievements', value: `${game.stats.achievementsUnlocked} / ${ACHIEVEMENTS.length}` },
            { label: '🎲 Events Triggered', value: game.stats.eventsTriggered },
            { label: '⚡ Power', value: `${getPowerUsage()} / ${getPowerCap()} MW` },
            { label: '📈 Achievement Bonus', value: `+${ACHIEVEMENTS.reduce((s, a) => s + (game.achievements[a.id] ? a.bonus : 0), 0)}%` },
        ];

        for (const stat of stats) {
            const card = document.createElement('div');
            card.className = 'stat-card';
            card.innerHTML = `
                <div class="stat-label">${stat.label}</div>
                <div class="stat-value">${stat.value}</div>
            `;
            container.appendChild(card);
        }
    }

    // ===== UI UPDATE (per frame) =====

    let uiThrottle = 0;

    function updateUI() {
        uiThrottle++;
        if (uiThrottle % 3 !== 0) return; // Update every 3 frames (~7fps for UI)

        updateResourceBar();
        updatePowerBar();
        updateBuildingCosts();
        updateCraftingCosts();
        updateResearchUI();
        updateGatherPower();
    }

    function updateResourceBar() {
        for (const resId of RESOURCE_IDS) {
            const amtEl = document.getElementById(`res-amt-${resId}`);
            if (!amtEl) continue;
            amtEl.textContent = fmt(game.resources[resId]);

            const capEl = document.getElementById(`res-cap-${resId}`);
            if (capEl) capEl.textContent = '/ ' + fmt(getResourceCap(resId));

            const rateEl = document.getElementById(`res-rate-${resId}`);
            if (rateEl) {
                const rate = getRate(game, resId);
                if (Math.abs(rate) < 0.001) {
                    rateEl.textContent = '';
                    rateEl.className = 'res-rate zero';
                } else {
                    rateEl.textContent = (rate > 0 ? '+' : '') + fmt(rate) + '/s';
                    rateEl.className = 'res-rate ' + (rate > 0 ? 'positive' : 'negative');
                }
            }
        }
    }

    function updatePowerBar() {
        const cap = getPowerCap();
        const usage = getPowerUsage();
        const pct = cap > 0 ? Math.min(usage / cap * 100, 100) : 0;
        const fill = document.getElementById('power-fill');
        const text = document.getElementById('power-text');

        if (fill) {
            fill.style.width = pct + '%';
            fill.className = 'power-fill' + (usage > cap ? ' over-capacity' : '');
        }
        if (text) {
            text.textContent = `${usage} / ${cap} MW`;
            text.style.color = usage > cap ? 'var(--accent-red)' : 'var(--text-primary)';
        }
    }

    function updateBuildingCosts() {
        for (const bId in BUILDINGS) {
            const costEl = document.getElementById(`bcost-${bId}`);
            if (!costEl) continue;
            const costs = getBuildingCost(bId);
            costEl.innerHTML = formatCosts(costs);

            const buyBtn = document.getElementById(`bbuy-${bId}`);
            if (buyBtn) {
                buyBtn.disabled = !canAfford(costs) || !isBuildingUnlocked(bId);
            }

            const countEl = document.getElementById(`bcount-${bId}`);
            if (countEl) countEl.textContent = '×' + game.buildings[bId];
        }
    }

    function updateCraftingCosts() {
        for (const recipe of RECIPES) {
            const costEl = document.getElementById(`craft-cost-${recipe.id}`);
            if (!costEl) continue;
            costEl.innerHTML = formatCosts(recipe.costs);

            const btn = costEl.closest('.craft-btn');
            if (btn) {
                const affordable = canAfford(recipe.costs);
                const cap = getResourceCap(recipe.output);
                const atCap = game.resources[recipe.output] >= cap;
                btn.classList.toggle('disabled', !affordable || atCap);
            }
        }
    }

    function updateResearchUI() {
        // Active research progress
        const activeArea = $('research-active');
        const progressArea = $('research-progress-area');

        if (game.researchQueue) {
            activeArea.style.display = 'block';
            const r = RESEARCH[game.researchQueue.id];
            const pct = (game.researchQueue.progress / game.researchQueue.total * 100).toFixed(1);
            const remaining = Math.max(0, game.researchQueue.total - game.researchQueue.progress);
            progressArea.innerHTML = `
                <div class="active-research-name">🔄 ${r.name}</div>
                <div class="active-research-bar"><div class="active-research-fill" style="width:${pct}%"></div></div>
                <div class="active-research-time">${pct}% — ${fmtTime(remaining)} remaining</div>
            `;
        } else {
            activeArea.style.display = 'none';
        }

        // Update research costs and buttons
        for (const rId in RESEARCH) {
            const costEl = document.getElementById(`rcost-${rId}`);
            if (costEl) costEl.innerHTML = formatCosts(RESEARCH[rId].costs);

            const btn = document.getElementById(`rbtn-${rId}`);
            if (btn) {
                btn.disabled = !isResearchUnlocked(rId) || !canAfford(RESEARCH[rId].costs) || game.researchQueue !== null || game.research[rId];
            }

            // Progress bar for in-progress
            if (game.researchQueue && game.researchQueue.id === rId) {
                const progEl = document.getElementById(`rprog-${rId}`);
                if (progEl) {
                    progEl.style.width = (game.researchQueue.progress / game.researchQueue.total * 100) + '%';
                }
            }
        }
    }

    function updateGatherPower() {
        const power = getClickPower();
        for (const resId of ['energy', 'minerals', 'data']) {
            const el = document.getElementById(`gather-power-${resId}`);
            if (el) el.textContent = '+' + power;
        }
    }

    function formatCosts(costs) {
        const parts = [];
        for (const resId in costs) {
            const def = RESOURCES[resId];
            const has = game.resources[resId] >= costs[resId];
            parts.push(`<span class="${has ? 'sufficient' : 'insufficient'}">${def.icon}${fmt(costs[resId])}</span>`);
        }
        return parts.join(' ');
    }

    function updateSaveIndicator() {
        const el = $('save-indicator');
        if (el) {
            const ago = Math.floor((Date.now() - game.lastSave) / 1000);
            el.textContent = ago < 5 ? '💾 Just saved' : `💾 ${ago}s ago`;
        }
    }

    // ===== TOAST & FLOATING NUMBERS =====

    function showToast(title, body, type, duration) {
        const container = $('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast ' + (type || '');
        toast.innerHTML = `
            <div class="toast-title">${title}</div>
            <div class="toast-body">${body}</div>
            ${duration ? `<div class="toast-timer">⏱️ ${duration}s</div>` : ''}
        `;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    }

    function showFloatingNumber(text, x, y) {
        const container = $('float-container');
        const el = document.createElement('div');
        el.className = 'float-number';
        el.textContent = text;
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        container.appendChild(el);
        setTimeout(() => el.remove(), 1000);
    }

    // ===== TAB NAVIGATION =====

    function setupTabs() {
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                if (tab.classList.contains('locked')) return;
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                const target = document.getElementById('tab-' + tab.dataset.tab);
                if (target) target.classList.add('active');

                // Re-render the active tab for freshness
                const tabId = tab.dataset.tab;
                if (tabId === 'buildings') renderBuildings();
                if (tabId === 'research') renderResearch();
                if (tabId === 'automation') renderAutomation();
                if (tabId === 'prestige') renderPrestige();
                if (tabId === 'achievements') renderAchievements();
                if (tabId === 'stats') renderStats();
            });
        });
    }

    // ===== HEADER BUTTONS =====

    function setupHeaderButtons() {
        $('btn-save').addEventListener('click', () => {
            saveGame();
            showToast('💾 Saved', 'Game saved successfully!');
        });

        $('btn-export').addEventListener('click', exportSave);

        $('btn-import').addEventListener('click', () => {
            $('import-modal').style.display = 'flex';
        });

        $('import-confirm').addEventListener('click', () => {
            const val = $('import-textarea').value;
            if (val) importSave(val);
            $('import-modal').style.display = 'none';
            $('import-textarea').value = '';
        });

        $('import-cancel').addEventListener('click', () => {
            $('import-modal').style.display = 'none';
            $('import-textarea').value = '';
        });

        $('btn-reset').addEventListener('click', () => {
            $('reset-modal').style.display = 'flex';
        });

        $('reset-confirm').addEventListener('click', () => {
            if ($('reset-input').value === 'RESET') {
                hardReset();
                $('reset-modal').style.display = 'none';
                $('reset-input').value = '';
            }
        });

        $('reset-cancel').addEventListener('click', () => {
            $('reset-modal').style.display = 'none';
            $('reset-input').value = '';
        });
    }

    // ===== SAVE INDICATOR TIMER =====

    setInterval(updateSaveIndicator, 5000);

    // ===== INITIALIZATION =====

    function init() {
        loadGame();
        setupTabs();
        setupHeaderButtons();
        renderAll();
        lastFrameTime = performance.now();
        requestAnimationFrame(gameLoop);
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
