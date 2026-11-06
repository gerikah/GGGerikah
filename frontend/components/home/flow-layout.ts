export type Point = { x: number; y: number };
export type Box = { x: number; y: number; width: number; height: number };
export type Port = 'top' | 'right' | 'bottom' | 'left';
export type NodeId = 'start' | 'engineer' | 'developer' | 'decision' | 'design' | 'build' | 'works' | 'process' | 'talk';
export type ConnectorId = NodeId | 'merge';
export type Connection = { from: ConnectorId; to: ConnectorId };
export const connections: Connection[] = [
  { from: 'start', to: 'engineer' }, { from: 'engineer', to: 'developer' },
  { from: 'developer', to: 'decision' }, { from: 'decision', to: 'design' },
  { from: 'decision', to: 'build' }, { from: 'design', to: 'merge' },
  { from: 'build', to: 'merge' }, { from: 'merge', to: 'works' },
  { from: 'works', to: 'process' }, { from: 'process', to: 'talk' },
];
export function port(box: Box, side: Port): Point {
  return { x: box.x + (side === 'left' ? 0 : side === 'right' ? box.width : box.width / 2),
    y: box.y + (side === 'top' ? 0 : side === 'bottom' ? box.height : box.height / 2) };
}
export function connectorPoints(boxes: Record<ConnectorId, Box>, edge: Connection, layout: { mobile: boolean; rail: number; branchLeft: number; branchRight: number }): { points: Point[]; fromPort: Port; toPort: Port } {
  const from = boxes[edge.from], to = boxes[edge.to];
  if (edge.from === 'decision') {
    const fromPort = edge.to === 'design' ? 'left' : 'right';
    const start = port(from, fromPort), end = port(to, 'top');
    return { points: [start, { x: end.x, y: start.y }, end], fromPort, toPort: 'top' };
  }
  if (edge.to === 'merge') {
    const fromPort = edge.from === 'design' ? 'left' : 'right';
    const start = port(from, fromPort), end = port(to, 'top');
    const outside = edge.from === 'design' ? layout.branchLeft : layout.branchRight;
    return { points: [start, { x: outside, y: start.y }, { x: outside, y: end.y }, end], fromPort, toPort: 'top' };
  }
  if (edge.from === 'merge') {
    const start = port(from, 'bottom');
    const toPort = layout.mobile ? 'left' : 'top';
    const end = port(to, toPort);
    const bend = layout.mobile ? end.y : end.y - 28;
    return { points: [start, { x: layout.rail, y: start.y }, { x: layout.rail, y: bend }, { x: end.x, y: bend }, end], fromPort: 'bottom', toPort };
  }
  if (layout.mobile || edge.to === 'decision') {
    const fromPort = layout.mobile ? 'left' : 'bottom';
    const start = port(from, fromPort);
    const toPort = edge.to === 'decision' ? 'top' : 'left';
    const end = port(to, toPort), bend = toPort === 'top' ? end.y - 28 : end.y;
    return { points: [start, { x: layout.rail, y: start.y }, { x: layout.rail, y: bend }, { x: end.x, y: bend }, end], fromPort, toPort };
  }
  const start = port(from, 'bottom'), end = port(to, 'top');
  return { points: [start, { x: start.x, y: end.y - 32 }, { x: end.x, y: end.y - 32 }, end], fromPort: 'bottom', toPort: 'top' };
}
export function pathData(points: Point[]) {
  return points.map((point, index) => `${index ? 'L' : 'M'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');
}
/** Reveal by document position, including corners; there is no animation clock to outrun. */
export function lineProgress(points: Point[], revealY: number) {
  let total = 0, visible = 0;
  for (let index = 1; index < points.length; index++) {
    const a = points[index - 1], b = points[index];
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    total += length;
    const fraction = a.y === b.y ? Number(revealY >= a.y) : Math.max(0, Math.min(1, (revealY - Math.min(a.y, b.y)) / Math.abs(b.y - a.y)));
    visible += length * fraction;
  }
  return total ? visible / total : 1;
}
