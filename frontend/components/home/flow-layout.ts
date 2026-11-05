export const nodeIds = ['start', 'engineer', 'developer', 'decision', 'design', 'build', 'works', 'talk'] as const;
export type NodeId = typeof nodeIds[number];
export type ConnectorId = NodeId | 'merge';
export type Box = { x: number; y: number; width: number; height: number };
export type Connection = { from: ConnectorId; to: ConnectorId };
export type Point = { x: number; y: number };
export type PanelRect = { left: number; top: number; width: number; height: number };

export const connections: Connection[] = [
  { from: 'start', to: 'engineer' },
  { from: 'engineer', to: 'developer' },
  { from: 'developer', to: 'decision' },
  { from: 'decision', to: 'design' },
  { from: 'decision', to: 'build' },
  { from: 'design', to: 'merge' },
  { from: 'build', to: 'merge' },
  { from: 'merge', to: 'works' },
  { from: 'works', to: 'talk' },
];

type SceneState = Record<NodeId, Point>;
const states: { progress: number; nodes: SceneState }[] = [
  { progress: 0, nodes: {
    start: { x: .12, y: .12 }, engineer: { x: .28, y: .26 }, developer: { x: .42, y: .41 },
    decision: { x: .53, y: .54 }, design: { x: .45, y: .67 }, build: { x: .66, y: .67 },
    works: { x: .78, y: .80 }, talk: { x: .88, y: .92 },
  } },
  { progress: .08, nodes: {
    start: { x: .10, y: .12 }, engineer: { x: .28, y: .25 }, developer: { x: .46, y: .42 },
    decision: { x: .54, y: .78 }, design: { x: .43, y: 1.10 }, build: { x: .62, y: 1.10 },
    works: { x: .79, y: 1.46 }, talk: { x: .91, y: 1.80 },
  } },
  { progress: .20, nodes: {
    start: { x: .10, y: .12 }, engineer: { x: .28, y: .24 }, developer: { x: .43, y: .94 },
    decision: { x: .53, y: 1.28 }, design: { x: .42, y: 1.56 }, build: { x: .62, y: 1.56 },
    works: { x: .79, y: 1.88 }, talk: { x: .91, y: 2.20 },
  } },
  { progress: .32, nodes: {
    start: { x: .10, y: .12 }, engineer: { x: .28, y: .24 }, developer: { x: .43, y: 1.08 },
    decision: { x: .53, y: 1.42 }, design: { x: .42, y: 1.70 }, build: { x: .62, y: 1.70 },
    works: { x: .79, y: 2.02 }, talk: { x: .91, y: 2.34 },
  } },
  { progress: .44, nodes: {
    start: { x: .12, y: -.22 }, engineer: { x: .28, y: -.06 }, developer: { x: .44, y: -.12 },
    decision: { x: .74, y: .11 }, design: { x: .61, y: .25 }, build: { x: .85, y: .25 },
    works: { x: .84, y: 1.15 }, talk: { x: .90, y: 1.52 },
  } },
  { progress: .60, nodes: {
    start: { x: .12, y: -.48 }, engineer: { x: .28, y: -.30 }, developer: { x: .44, y: -.12 },
    decision: { x: .74, y: .11 }, design: { x: .61, y: .25 }, build: { x: .85, y: .25 },
    works: { x: .84, y: 1.18 }, talk: { x: .90, y: 1.55 },
  } },
  { progress: .72, nodes: {
    start: { x: .12, y: -1.35 }, engineer: { x: .28, y: -1.30 }, developer: { x: .46, y: -1.28 },
    decision: { x: .59, y: -1.23 }, design: { x: .12, y: -1.18 }, build: { x: .96, y: -1.18 },
    works: { x: .85, y: .16 }, talk: { x: .85, y: .88 },
  } },
  { progress: .82, nodes: {
    start: { x: .12, y: -1.35 }, engineer: { x: .28, y: -1.30 }, developer: { x: .46, y: -1.28 },
    decision: { x: .59, y: -1.23 }, design: { x: .12, y: -1.18 }, build: { x: .96, y: -1.18 },
    works: { x: .85, y: .16 }, talk: { x: .85, y: .88 },
  } },
  { progress: 1, nodes: {
    start: { x: .12, y: -1.35 }, engineer: { x: .28, y: -1.30 }, developer: { x: .46, y: -1.28 },
    decision: { x: .59, y: -1.23 }, design: { x: .12, y: -1.18 }, build: { x: .96, y: -1.18 },
    works: { x: .85, y: .16 }, talk: { x: .85, y: .88 },
  } },
];

function interpolate<T extends Record<string, number>>(left: T, right: T, amount: number): T {
  return Object.fromEntries(Object.keys(left).map(key => [
    key,
    left[key] + (right[key] - left[key]) * amount,
  ])) as T;
}

function smooth(amount: number) {
  const clamped = Math.max(0, Math.min(1, amount));
  return clamped * clamped * (3 - 2 * clamped);
}

export function flowNodePositions(progress: number): Record<NodeId, Point> {
  const index = states.findIndex((state, i) => i < states.length - 1 && progress <= states[i + 1].progress);
  const from = states[Math.max(0, index)];
  const to = states[Math.min(states.length - 1, Math.max(1, index + 1))];
  const amount = smooth((progress - from.progress) / (to.progress - from.progress || 1));
  return Object.fromEntries(nodeIds.map(id => [id, interpolate(from.nodes[id], to.nodes[id], amount)])) as Record<NodeId, Point>;
}

export function flowPanelLayout(width: number, height: number, gutter: number): Record<'about' | 'tools' | 'projects', PanelRect> {
  const common = { left: gutter / width, top: 32 / height, width: 1 - 2 * gutter / width, height: 1 - 64 / height };
  return {
    about: common,
    tools: common,
    projects: { left: gutter / width, top: 60 / height, width: .70 - gutter / width, height: 1 - 92 / height },
  };
}

export function flowPanelOpacity(progress: number) {
  const fadeIn = (start: number, end: number) => smooth((progress - start) / (end - start));
  const fadeOut = (start: number, end: number) => 1 - smooth((progress - start) / (end - start));
  return {
    hero: 1 - fadeIn(.08, .14),
    about: fadeIn(.23, .25) * fadeOut(.31, .35),
    tools: fadeIn(.43, .46) * fadeOut(.59, .62),
    projects: fadeIn(.72, .76),
  };
}

function center(box: Box) {
  return { x: box.x, y: box.y };
}

function top(box: Box) {
  return { x: box.x, y: box.y - box.height / 2 };
}

function bottom(box: Box) {
  return { x: box.x, y: box.y + box.height / 2 };
}

type Routing = { spread: number; projectSpread: number; boardTop: number; gutter: number; width: number };

/** Fixed node ports keep every elbow continuous in forward and reverse scrolling. */
export function flowConnectorPath(boxes: Record<ConnectorId, Box>, edge: Connection, route: Routing) {
  const from = boxes[edge.from];
  const to = boxes[edge.to];
  const left = (box: Box) => ({ x: box.x - box.width / 2, y: box.y });
  const right = (box: Box) => ({ x: box.x + box.width / 2, y: box.y });
  if (edge.to === 'merge') {
    const isDesign = edge.from === 'design';
    const start = isDesign ? left(from) : right(from);
    const compactRail = start.x + (isDesign ? -28 : 28);
    const outsideRail = isDesign ? route.gutter / 2 : route.width - route.gutter / 2;
    const railX = compactRail + (outsideRail - compactRail) * route.spread;
    const merge = center(to);
    if (isDesign) {
      // Exit beside the description and join the outer lane underneath it.
      const turnY = merge.y + (route.boardTop - 24 - merge.y) * route.spread * (1 - route.projectSpread);
      const exitRail = compactRail + (railX - compactRail) * route.projectSpread;
      return `M ${start.x} ${start.y} H ${exitRail} V ${turnY} H ${railX} V ${merge.y} H ${merge.x}`;
    }
    return `M ${start.x} ${start.y} H ${railX} V ${merge.y} H ${merge.x}`;
  }
  if (edge.from === 'merge') {
    const start = center(from);
    const destination = top(to);
    return `M ${start.x} ${start.y} H ${destination.x} V ${destination.y}`;
  }
  if (edge.from === 'decision') {
    const start = edge.to === 'design' ? left(from) : right(from);
    const destination = top(to);
    return `M ${start.x} ${start.y} H ${destination.x} V ${destination.y}`;
  }
  if (edge.from === 'engineer' || edge.from === 'developer') {
    const start = right(from);
    const destination = top(to);
    if (destination.x < start.x + 16) {
      const railX = start.x + 24;
      const turnY = (bottom(from).y + destination.y) / 2;
      return `M ${start.x} ${start.y} H ${railX} V ${turnY} H ${destination.x} V ${destination.y}`;
    }
    return `M ${start.x} ${start.y} H ${destination.x} V ${destination.y}`;
  }
  const start = bottom(from);
  if (edge.to === 'engineer') {
    const destination = left(to);
    return `M ${start.x} ${start.y} V ${destination.y} H ${destination.x}`;
  }
  const destination = top(to);
  const middleY = (start.y + destination.y) / 2;
  return `M ${start.x} ${start.y} V ${middleY} H ${destination.x} V ${destination.y}`;
}
