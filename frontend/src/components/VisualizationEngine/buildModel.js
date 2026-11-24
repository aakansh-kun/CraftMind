/**
 * Canonical 3D BuildModel and Projection Engine for CraftMind
 * 
 * Unifies all blueprint representations into a single 3D coordinate model:
 * dimensions: { width, length, height }
 * blocks: Array<{ x: number, y: number, z: number, type: string, step: number }>
 * 
 * Derives Top, Front, and Isometric views from the SAME block model.
 */

export const BLOCK_CATALOG = {
  stone_bricks: {
    id: 'stone_bricks',
    name: 'Stone Bricks',
    icon: '🧱',
    topColor: '#78716c',
    leftColor: '#57534e',
    rightColor: '#44403c',
    pattern: 'bricks',
    textColor: '#ffffff',
  },
  cobblestone: {
    id: 'cobblestone',
    name: 'Cobblestone',
    icon: '🪨',
    topColor: '#57534e',
    leftColor: '#44403c',
    rightColor: '#292524',
    pattern: 'noise',
    textColor: '#ffffff',
  },
  stone: {
    id: 'stone',
    name: 'Stone',
    icon: '◻️',
    topColor: '#78716c',
    leftColor: '#57534e',
    rightColor: '#44403c',
    pattern: 'smooth',
    textColor: '#ffffff',
  },
  glass: {
    id: 'glass',
    name: 'Glass',
    icon: '🔲',
    topColor: 'rgba(203, 213, 225, 0.55)',
    leftColor: 'rgba(148, 163, 184, 0.45)',
    rightColor: 'rgba(100, 116, 139, 0.45)',
    pattern: 'glass',
    textColor: '#0f172a',
    isTransparent: true,
  },
  water: {
    id: 'water',
    name: 'Water Source / Flow',
    icon: '💧',
    topColor: 'rgba(56, 189, 248, 0.8)',
    leftColor: 'rgba(2, 132, 199, 0.8)',
    rightColor: 'rgba(3, 105, 161, 0.85)',
    pattern: 'water',
    textColor: '#ffffff',
    isFluid: true,
  },
  lava: {
    id: 'lava',
    name: 'Lava Blade',
    icon: '🔥',
    topColor: '#f97316',
    leftColor: '#ea580c',
    rightColor: '#c2410c',
    pattern: 'lava',
    textColor: '#ffffff',
    isFluid: true,
  },
  chest: {
    id: 'chest',
    name: 'Chest / Vault',
    icon: '📦',
    topColor: '#d97706',
    leftColor: '#b45309',
    rightColor: '#92400e',
    pattern: 'chest',
    textColor: '#ffffff',
  },
  hopper: {
    id: 'hopper',
    name: 'Hopper',
    icon: '📥',
    topColor: '#475569',
    leftColor: '#334155',
    rightColor: '#1e293b',
    pattern: 'hopper',
    textColor: '#ffffff',
  },
  bed: {
    id: 'bed',
    name: 'Red Bed',
    icon: '🛏️',
    topColor: '#ef4444',
    leftColor: '#dc2626',
    rightColor: '#b91c1c',
    pattern: 'bed',
    textColor: '#ffffff',
  },
  sign: {
    id: 'sign',
    name: 'Oak Sign (Lava Support)',
    icon: '🪧',
    topColor: '#d97706',
    leftColor: '#b45309',
    rightColor: '#78350f',
    pattern: 'wood',
    textColor: '#ffffff',
  },
  villager: {
    id: 'villager',
    name: 'Villager Chamber',
    icon: '👨‍🌾',
    topColor: '#22c55e',
    leftColor: '#16a34a',
    rightColor: '#15803d',
    pattern: 'entity',
    textColor: '#ffffff',
  },
  zombie: {
    id: 'zombie',
    name: 'Zombie Threat Pod',
    icon: '🧟',
    topColor: '#10b981',
    leftColor: '#059669',
    rightColor: '#047857',
    pattern: 'entity',
    textColor: '#ffffff',
  },
  boat: {
    id: 'boat',
    name: 'Oak Boat',
    icon: '🛶',
    topColor: '#b45309',
    leftColor: '#92400e',
    rightColor: '#78350f',
    pattern: 'wood',
    textColor: '#ffffff',
  },
  oak_planks: {
    id: 'oak_planks',
    name: 'Oak Planks',
    icon: '🪵',
    topColor: '#d97706',
    leftColor: '#b45309',
    rightColor: '#78350f',
    pattern: 'wood',
    textColor: '#ffffff',
  },
  oak_log: {
    id: 'oak_log',
    name: 'Oak Log Pillar',
    icon: '🪵',
    topColor: '#78350f',
    leftColor: '#451a03',
    rightColor: '#260e02',
    pattern: 'bark',
    textColor: '#ffffff',
  },
  door: {
    id: 'door',
    name: 'Doorway',
    icon: '🚪',
    topColor: '#a16207',
    leftColor: '#854d0e',
    rightColor: '#713f12',
    pattern: 'wood',
    textColor: '#ffffff',
  },
  torch: {
    id: 'torch',
    name: 'Wall Torch',
    icon: '🕯️',
    topColor: '#fde047',
    leftColor: '#eab308',
    rightColor: '#ca8a04',
    pattern: 'torch',
    textColor: '#0f172a',
  },
  slab: {
    id: 'slab',
    name: 'Stone Slab (Lightning Proof)',
    icon: '➖',
    topColor: '#a8a29e',
    leftColor: '#78716c',
    rightColor: '#57534e',
    pattern: 'smooth',
    textColor: '#ffffff',
  },
  stair: {
    id: 'stair',
    name: 'Stone Stairs',
    icon: '🪜',
    topColor: '#78716c',
    leftColor: '#57534e',
    rightColor: '#44403c',
    pattern: 'smooth',
    textColor: '#ffffff',
  },
  redstone_wire: {
    id: 'redstone_wire',
    name: 'Redstone Dust',
    icon: '⚡',
    topColor: '#ef4444',
    leftColor: '#dc2626',
    rightColor: '#991b1b',
    pattern: 'wire',
    textColor: '#ffffff',
  },
  piston: {
    id: 'piston',
    name: 'Piston',
    icon: '🧱',
    topColor: '#a16207',
    leftColor: '#78716c',
    rightColor: '#57534e',
    pattern: 'piston',
    textColor: '#ffffff',
  },
  sticky_piston: {
    id: 'sticky_piston',
    name: 'Sticky Piston',
    icon: '🟢',
    topColor: '#22c55e',
    leftColor: '#78716c',
    rightColor: '#57534e',
    pattern: 'piston',
    textColor: '#ffffff',
  },
  repeater: {
    id: 'repeater',
    name: 'Redstone Repeater',
    icon: '⏱️',
    topColor: '#a8a29e',
    leftColor: '#78716c',
    rightColor: '#dc2626',
    pattern: 'circuit',
    textColor: '#ffffff',
  },
  redstone_torch: {
    id: 'redstone_torch',
    name: 'Redstone Torch',
    icon: '🏮',
    topColor: '#f87171',
    leftColor: '#ef4444',
    rightColor: '#dc2626',
    pattern: 'torch',
    textColor: '#ffffff',
  },
  lever: {
    id: 'lever',
    name: 'Lever Switch',
    icon: '🕹️',
    topColor: '#78716c',
    leftColor: '#57534e',
    rightColor: '#d97706',
    pattern: 'lever',
    textColor: '#ffffff',
  },
  chute: {
    id: 'chute',
    name: 'Drop Hole / Chute',
    icon: '🕳️',
    topColor: '#1c1917',
    leftColor: '#0c0a09',
    rightColor: '#000000',
    pattern: 'void',
    textColor: '#78716c',
  },
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian Portal Frame',
    icon: '🔮',
    topColor: '#3b0764',
    leftColor: '#2e1065',
    rightColor: '#1e1b4b',
    pattern: 'dark',
    textColor: '#ffffff',
  },
  magma: {
    id: 'magma',
    name: 'Magma Spawning Block',
    icon: '🌋',
    topColor: '#ea580c',
    leftColor: '#c2410c',
    rightColor: '#7c2d12',
    pattern: 'lava',
    textColor: '#ffffff',
  },
  gold_block: {
    id: 'gold_block',
    name: 'Block of Gold',
    icon: '🪙',
    topColor: '#facc15',
    leftColor: '#eab308',
    rightColor: '#ca8a04',
    pattern: 'smooth',
    textColor: '#0f172a',
  },
  trapdoor: {
    id: 'trapdoor',
    name: 'Oak Trapdoor (Lure)',
    icon: '🪵',
    topColor: '#b45309',
    leftColor: '#92400e',
    rightColor: '#78350f',
    pattern: 'wood',
    textColor: '#ffffff',
  },
  portal: {
    id: 'portal',
    name: 'Nether Portal Film',
    icon: '🌀',
    topColor: '#a855f7',
    leftColor: '#9333ea',
    rightColor: '#7e22ce',
    pattern: 'glass',
    textColor: '#ffffff',
    isTransparent: true,
  }
};

/**
 * Normalizes raw block name strings to catalog keys
 */
export function normalizeBlockType(raw) {
  if (!raw || typeof raw !== 'string') return 'stone';
  const clean = raw.toLowerCase().replace(/[\s\-_]+/g, '_').trim();

  if (clean.includes('brick')) return 'stone_bricks';
  if (clean.includes('cobble')) return 'cobblestone';
  if (clean.includes('glass')) return 'glass';
  if (clean.includes('water')) return 'water';
  if (clean.includes('lava')) return 'lava';
  if (clean.includes('chest')) return 'chest';
  if (clean.includes('hopper')) return 'hopper';
  if (clean.includes('bed')) return 'bed';
  if (clean.includes('sign')) return 'sign';
  if (clean.includes('villager')) return 'villager';
  if (clean.includes('zombie')) return 'zombie';
  if (clean.includes('boat')) return 'boat';
  if (clean.includes('slab')) return 'slab';
  if (clean.includes('stair')) return 'stair';
  if (clean.includes('log')) return 'oak_log';
  if (clean.includes('plank') || clean.includes('wood')) return 'oak_planks';
  if (clean.includes('door')) return 'door';
  if (clean.includes('torch') && clean.includes('redstone')) return 'redstone_torch';
  if (clean.includes('torch')) return 'torch';
  if (clean.includes('sticky')) return 'sticky_piston';
  if (clean.includes('piston')) return 'piston';
  if (clean.includes('repeater')) return 'repeater';
  if (clean.includes('redstone') || clean.includes('wire')) return 'redstone_wire';
  if (clean.includes('lever')) return 'lever';
  if (clean.includes('obsidian')) return 'obsidian';
  if (clean.includes('magma')) return 'magma';
  if (clean.includes('gold')) return 'gold_block';
  if (clean.includes('trapdoor')) return 'trapdoor';
  if (clean.includes('portal')) return 'portal';
  if (clean.includes('hole') || clean.includes('chute')) return 'chute';
  if (clean.includes('air') || clean === 'none' || clean === 'empty') return 'air';

  if (BLOCK_CATALOG[clean]) return clean;
  return 'stone_bricks';
}

/**
 * Transforms any raw blueprint (layers or direct blocks) into a canonical 3D BuildModel.
 */
export function buildCanonicalModel(blueprint) {
  if (!blueprint) return null;

  // If already contains structured blocks array
  if (Array.isArray(blueprint.blocks) && blueprint.blocks.length > 0) {
    const dims = blueprint.dimensions || calculateDimensionsFromBlocks(blueprint.blocks);
    const normalizedBlocks = blueprint.blocks.map(b => ({
      x: Number(b.x),
      y: Number(b.y),
      z: Number(b.z),
      type: normalizeBlockType(b.type),
      step: Number(b.step) || (Number(b.y) + 1),
    }));

    return {
      title: blueprint.title || 'Minecraft Construction Blueprint',
      edition: blueprint.edition || 'Java & Bedrock 1.21.x',
      dimensions: dims,
      blocks: normalizedBlocks,
      materials: blueprint.materials || deriveMaterialsFromBlocks(normalizedBlocks),
      steps: blueprint.steps || deriveStepsFromBlocks(normalizedBlocks, dims.height),
      simulation: ensureSimulationModel(blueprint.simulation, normalizedBlocks, dims),
      rawBlueprint: blueprint,
    };
  }

  // If blueprint has layers
  if (Array.isArray(blueprint.layers) && blueprint.layers.length > 0) {
    const blocks = [];
    let maxRow = 0;
    let maxCol = 0;

    blueprint.layers.forEach((layer, layerIdx) => {
      const grid = layer.grid || [];
      grid.forEach((row, rowIdx) => {
        if (rowIdx > maxRow) maxRow = rowIdx;
        row.forEach((cell, colIdx) => {
          if (colIdx > maxCol) maxCol = colIdx;
          const blockType = normalizeBlockType(cell);
          if (blockType !== 'air') {
            blocks.push({
              x: colIdx,
              y: layerIdx,
              z: rowIdx,
              type: blockType,
              step: layerIdx + 1,
            });
          }
        });
      });
    });

    const dimensions = blueprint.dimensions || {
      width: maxCol + 1,
      length: maxRow + 1,
      height: blueprint.layers.length,
    };

    return {
      title: blueprint.title || 'Minecraft Construction Blueprint',
      edition: blueprint.edition || 'Java & Bedrock 1.21.x',
      dimensions,
      blocks,
      materials: blueprint.materials || deriveMaterialsFromBlocks(blocks),
      steps: blueprint.steps || deriveStepsFromBlocks(blocks, dimensions.height),
      simulation: ensureSimulationModel(blueprint.simulation, blocks, dimensions),
      rawBlueprint: blueprint,
    };
  }

  return null;
}

export function ensureSimulationModel(sim, blocks = [], dimensions = { width: 7, length: 7, height: 8 }) {
  if (sim && Array.isArray(sim.entities) && sim.entities.length > 0 && Array.isArray(sim.stages) && sim.stages.length > 0) {
    return sim;
  }

  const stages = (sim && Array.isArray(sim.stages) && sim.stages.length > 0)
    ? sim.stages
    : [
        { id: 'stage_1', label: '1. Mechanism Primed', icon: '⚡', detail: 'Structure integrity and power readiness verified.' },
        { id: 'stage_2', label: '2. Input Trigger', icon: '🕹️', detail: 'Primary mechanism trigger activates the process.' },
        { id: 'stage_3', label: '3. Conveyance & Flow', icon: '🌊', detail: 'Elements flow toward collection zone.' },
        { id: 'stage_4', label: '4. Sorting & Filter', icon: '📥', detail: 'Automated hoppers sort items by type.' },
        { id: 'stage_5', label: '5. Vault Storage', icon: '📦', detail: 'Items deposited into secure storage vault.' }
      ];

  const duration = sim?.duration || 10000;
  const stageDuration = Math.floor(duration / stages.length);
  const timedStages = stages.map((stg, idx) => ({
    ...stg,
    start: idx * stageDuration,
    end: (idx + 1) * stageDuration,
    statusBanner: stg.statusBanner || stg.label
  }));

  const chestBlock = blocks.find(b => b.type === 'chest');
  const hopperBlock = blocks.find(b => b.type === 'hopper');
  const midX = Math.floor(dimensions.width / 2);
  const midZ = Math.floor(dimensions.length / 2);
  const topY = Math.max(1, dimensions.height - 2);

  const entities = [
    {
      id: 'entity_primary',
      type: 'iron_golem',
      name: 'Mobile Entity',
      icon: '🤖',
      spawnTime: timedStages[0].end,
      despawnTime: timedStages[Math.min(3, timedStages.length - 1)].end,
      path: [
        { time: timedStages[0].end, x: midX + 1, y: topY, z: midZ - 1 },
        { time: timedStages[1].end, x: midX, y: topY, z: midZ },
        { time: timedStages[2].end, x: hopperBlock ? hopperBlock.x : midX, y: hopperBlock ? hopperBlock.y + 1 : 1, z: hopperBlock ? hopperBlock.z : midZ }
      ]
    },
    {
      id: 'item_drop',
      type: 'iron_ingot',
      name: 'Item Drop',
      icon: '◽',
      spawnTime: timedStages[2].end,
      despawnTime: duration,
      path: [
        { time: timedStages[2].end, x: hopperBlock ? hopperBlock.x : midX, y: 1.5, z: hopperBlock ? hopperBlock.z : midZ },
        { time: timedStages[3].end, x: chestBlock ? chestBlock.x : midX, y: 0.5, z: chestBlock ? chestBlock.z : midZ }
      ]
    }
  ];

  return {
    duration,
    yieldRateText: sim?.yieldRateText || '~330 Items / Hr',
    stages: timedStages,
    entities
  };
}

function calculateDimensionsFromBlocks(blocks) {
  let maxX = 0;
  let maxY = 0;
  let maxZ = 0;
  blocks.forEach(b => {
    if (b.x > maxX) maxX = b.x;
    if (b.y > maxY) maxY = b.y;
    if (b.z > maxZ) maxZ = b.z;
  });
  return {
    width: maxX + 1,
    length: maxZ + 1,
    height: maxY + 1,
  };
}

function deriveMaterialsFromBlocks(blocks) {
  const counts = {};
  blocks.forEach(b => {
    counts[b.type] = (counts[b.type] || 0) + 1;
  });

  return Object.entries(counts).map(([type, qty]) => {
    const info = BLOCK_CATALOG[type] || { name: type, icon: '🧱' };
    return {
      id: type,
      name: info.name,
      quantity: qty,
      icon: info.icon,
    };
  });
}

function deriveStepsFromBlocks(blocks, height) {
  const steps = [];
  for (let h = 0; h < height; h++) {
    const count = blocks.filter(b => b.y === h).length;
    steps.push({
      number: h + 1,
      layer: h + 1,
      title: `Layer ${h + 1} Construction`,
      description: `Place ${count} blocks on elevation Y=${h}.`,
    });
  }
  return steps;
}

/**
 * Projects a 3D block coordinate into 2D isometric screen space with rotation angle.
 * rotation: 0 | 90 | 180 | 270
 */
export function projectIsometric(x, y, z, dimensions, rotation = 0, tileW = 34, tileH = 18, blockH = 22) {
  const { width = 7, length = 7 } = dimensions || {};
  let rx = x;
  let rz = z;

  if (rotation === 90) {
    rx = z;
    rz = (width - 1) - x;
  } else if (rotation === 180) {
    rx = (width - 1) - x;
    rz = (length - 1) - z;
  } else if (rotation === 270) {
    rx = (length - 1) - z;
    rz = x;
  }

  // Classic isometric screen projection
  const isoX = (rx - rz) * (tileW / 2);
  const isoY = (rx + rz) * (tileH / 2) - (y * blockH);

  // Depth for sorting back-to-front
  const depth = (rx + rz) * 100 + y;

  return {
    isoX,
    isoY,
    depth,
    rx,
    rz,
  };
}

/**
 * Derives Top View grid (X vs Z) at a selected Y layer.
 * showStacked: if true, displays highest visible block at or below selectedLayer.
 */
export function getTopViewGrid(model, selectedLayer = 0, showStacked = false) {
  if (!model) return [];
  const { width, length } = model.dimensions;
  const grid = Array.from({ length }, () => Array.from({ length: width }, () => null));

  // Sort blocks bottom to top
  const sorted = [...model.blocks].sort((a, b) => a.y - b.y);

  sorted.forEach(block => {
    if (showStacked) {
      if (block.y <= selectedLayer && block.z < length && block.x < width) {
        grid[block.z][block.x] = block;
      }
    } else {
      if (block.y === selectedLayer && block.z < length && block.x < width) {
        grid[block.z][block.x] = block;
      }
    }
  });

  return grid;
}

/**
 * Derives Front View grid (X vs Y elevation, looking down Z axis).
 * For each column X and elevation Y, displays the front-most block (lowest Z).
 */
export function getFrontViewGrid(model) {
  if (!model) return [];
  const { width, height } = model.dimensions;
  const grid = Array.from({ length: height }, () => Array.from({ length: width }, () => null));

  // Sort blocks front-to-back (increasing Z)
  const sorted = [...model.blocks].sort((a, b) => a.z - b.z);

  sorted.forEach(block => {
    const rowY = height - 1 - block.y; // Invert so Y=0 is ground at bottom
    if (rowY >= 0 && rowY < height && block.x < width) {
      if (!grid[rowY][block.x]) {
        grid[rowY][block.x] = block;
      }
    }
  });

  return grid;
}

/**
 * Generic simulation event and entity position interpolator.
 * Converts 3D coordinates into smooth continuous motion.
 */
export function interpolateEntityPosition(entity, timeMs) {
  if (entity.position) {
    return { ...entity.position, opacity: 1, isDamaged: false };
  }

  const { path = [], spawnTime = 0, despawnTime = Infinity, damageStartTime } = entity;
  if (timeMs < spawnTime || timeMs > despawnTime) {
    return null;
  }

  // Fade in during first 300ms after spawn; fade out during last 400ms
  const age = timeMs - spawnTime;
  const timeUntilDespawn = despawnTime - timeMs;
  let opacity = 1;
  if (age < 300) {
    opacity = Math.max(0.2, age / 300);
  } else if (timeUntilDespawn < 400) {
    opacity = Math.max(0, timeUntilDespawn / 400);
  }

  const isDamaged = damageStartTime ? timeMs >= damageStartTime : false;

  if (path.length === 0) {
    return null;
  }

  if (timeMs <= path[0].time) {
    return { x: path[0].x, y: path[0].y, z: path[0].z, opacity, isDamaged };
  }

  if (timeMs >= path[path.length - 1].time) {
    const last = path[path.length - 1];
    return { x: last.x, y: last.y, z: last.z, opacity, isDamaged };
  }

  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i];
    const p2 = path[i + 1];
    if (timeMs >= p1.time && timeMs <= p2.time) {
      const dt = p2.time - p1.time;
      const progress = dt === 0 ? 0 : (timeMs - p1.time) / dt;
      return {
        x: p1.x + (p2.x - p1.x) * progress,
        y: p1.y + (p2.y - p1.y) * progress,
        z: p1.z + (p2.z - p1.z) * progress,
        opacity,
        isDamaged
      };
    }
  }

  const last = path[path.length - 1];
  return { x: last.x, y: last.y, z: last.z, opacity, isDamaged };
}

/**
 * Computes the complete simulation snapshot at time `timeMs`
 */
export function getSimulationSnapshot(simulation, timeMs, dimensions, rotation, tileW, tileH, blockH) {
  if (!simulation || !simulation.stages || simulation.stages.length === 0) {
    return null;
  }

  const duration = simulation.duration || 10000;
  const clampedTime = Math.max(0, Math.min(duration, timeMs));

  // Determine active stage
  let activeStageIdx = simulation.stages.findIndex(s => clampedTime >= s.start && clampedTime < s.end);
  if (activeStageIdx === -1) {
    activeStageIdx = clampedTime >= duration ? simulation.stages.length - 1 : 0;
  }
  const activeStage = simulation.stages[activeStageIdx];

  // Interpolate and project all active entities
  const entities = (simulation.entities || []).map(ent => {
    const pos = interpolateEntityPosition(ent, clampedTime);
    if (!pos) return null;

    const proj = projectIsometric(pos.x, pos.y, pos.z, dimensions, rotation, tileW, tileH, blockH);
    const isAlert = ent.alertStartTime !== undefined && clampedTime >= ent.alertStartTime && clampedTime <= ent.alertEndTime;

    return {
      ...ent,
      x: pos.x,
      y: pos.y,
      z: pos.z,
      opacity: pos.opacity,
      isDamaged: pos.isDamaged,
      isAlert,
      isoX: proj.isoX,
      isoY: proj.isoY,
      depth: proj.depth + 60
    };
  }).filter(Boolean);

  return {
    timeMs: clampedTime,
    duration,
    activeStage,
    activeStageIdx,
    entities,
    activeWater: Boolean(activeStage?.activeWater),
    activeLava: Boolean(activeStage?.activeLava),
    activeHopper: activeStage?.activeHopper || null,
    activeChest: activeStage?.activeChest || null,
    statusBanner: activeStage?.statusBanner || activeStage?.label || '',
    isComplete: clampedTime >= duration
  };
}

