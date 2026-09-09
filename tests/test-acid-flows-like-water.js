/**
 * Test: away from anything dissolvable, acid falls and flows like water.
 */
'use strict';

const { createSandbox, run } = require('./helpers/sandbox');

const sandbox = createSandbox();

run(sandbox, function () {
  // 1. Acid falls straight down into empty space.
  const falling = new Grid(40, 40);
  falling.set(10, 5, MATERIALS.ACID);
  Physics.tick(falling);
  assert.equal(falling.get(10, 5), MATERIALS.EMPTY, 'origin cell is empty');
  assert.equal(falling.get(10, 6), MATERIALS.ACID, 'acid fell one cell down');

  // 2. Acid floating above a walled water basin (walls would dissolve on
  //    contact, so water contains it) spreads horizontally into empty
  //    space, like water. The basin is fully sealed so nothing else moves.
  const pocket = new Grid(40, 40);
  pocket.set(10, 9, MATERIALS.ACID);
  pocket.set(9, 10, MATERIALS.WATER);
  pocket.set(10, 10, MATERIALS.WATER);
  pocket.set(11, 10, MATERIALS.WATER);
  // Sealing walls.
  for (let x = 8; x <= 12; x++) pocket.set(x, 11, MATERIALS.WALL);
  pocket.set(8, 10, MATERIALS.WALL);
  pocket.set(12, 10, MATERIALS.WALL);

  Physics.tick(pocket);

  const left = pocket.get(9, 9) === MATERIALS.ACID;
  const right = pocket.get(11, 9) === MATERIALS.ACID;
  assert.ok(
    left !== right,
    'acid must spread horizontally to exactly one side when boxed in'
  );
  assert.equal(pocket.get(10, 9), MATERIALS.EMPTY, 'acid left its cell');
  // The sealed water must be untouched by the acid (no dissolution).
  assert.equal(pocket.get(10, 10), MATERIALS.WATER, 'water below still there');
});
