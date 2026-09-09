/**
 * Material definitions: numeric ids (stored in the grid) plus metadata used
 * by the UI and the renderer.
 */
const MATERIALS = Object.freeze({
  EMPTY: 0,
  SAND: 1,
  WATER: 2,
  WALL: 3,
  ACID: 4,
});

const MATERIAL_INFO = {
  // EMPTY is paintable: it doubles as the eraser.
  [MATERIALS.EMPTY]: { name: 'Empty', color: '#1e1e24', paintable: true, isEraser: true },
  [MATERIALS.SAND]: { name: 'Sand', color: '#e9c46a', paintable: true },
  [MATERIALS.WATER]: { name: 'Water', color: '#457b9d', paintable: true },
  [MATERIALS.WALL]: { name: 'Wall', color: '#6c757d', paintable: true },
  [MATERIALS.ACID]: { name: 'Acid', color: '#55ff33', paintable: true },
};

/** Materials the user can paint, in UI order (keyboard shortcut 1..5). */
const PAINTABLE_MATERIALS = [
  MATERIALS.SAND,
  MATERIALS.WATER,
  MATERIALS.WALL,
  MATERIALS.ACID,
  MATERIALS.EMPTY, // eraser
];
