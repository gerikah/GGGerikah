/** Shared node coordinates, in fractions of the sticky viewport. */
export const nodeIds = ['start', 'engineer', 'developer', 'decision', 'design', 'build', 'works', 'talk'] as const;
export type NodeId = typeof nodeIds[number];
export type Point = { x: number; y: number };
export type Box = Point & { width: number; height: number };
type Layout = Record<NodeId, readonly [number, number]>;
export const stages = { about: .24, development: .49, works: .72 };
const overview: Layout = { start:[.106,.105], engineer:[.237,.233], developer:[.369,.361], decision:[.496,.494], design:[.403,.641], build:[.589,.641], works:[.708,.77], talk:[.842,.904] };
const about: Layout = { start:[.106,.06], engineer:[.237,.78], developer:[.369,1.21], decision:[.496,1.40], design:[.403,1.57], build:[.589,1.57], works:[.708,1.76], talk:[.842,1.91] };
const development: Layout = { start:[.106,-.6], engineer:[.237,-.26], developer:[.16,.15], decision:[.28,.36], design:[.16,.58], build:[.40,.58], works:[.51,1.12], talk:[.842,1.3] };
const works: Layout = { start:[.106,-2], engineer:[.237,-1.65], developer:[.369,-1.32], decision:[.496,-1.02], design:[.403,-.8], build:[.696,-.35], works:[.696,.265], talk:[.829,.435] };
const keyframes = [{ at:0, layout:overview }, { at:.06, layout:overview }, { at:.19, layout:about }, { at:.32, layout:about }, { at:.44, layout:development }, { at:.56, layout:development }, { at:.69, layout:works }, { at:1, layout:works }];
export const clamp = (value:number, low=0, high=1) => Math.min(high, Math.max(low, value));
export const ease = (value:number) => { const t=clamp(value); return t*t*(3-2*t); };
export function positions(progress:number, width:number, height:number): Record<NodeId, Point> {
  const end=keyframes.findIndex(frame => frame.at >= progress);
  const b=keyframes[end < 0 ? keyframes.length-1 : end];
  const a=keyframes[Math.max(0,(end < 0 ? keyframes.length-1 : end)-1)];
  const t=b.at === a.at ? 0 : ease((progress-a.at)/(b.at-a.at));
  return Object.fromEntries(nodeIds.map(id => [id,{x:(a.layout[id][0]+(b.layout[id][0]-a.layout[id][0])*t)*width,y:(a.layout[id][1]+(b.layout[id][1]-a.layout[id][1])*t)*height}])) as Record<NodeId,Point>;
}
export const connections: { from:NodeId; to:NodeId; exit:'bottom'|'left'|'right'; entry:'top'|'left' }[] = [
  {from:'start',to:'engineer',exit:'bottom',entry:'left'},
  {from:'engineer',to:'developer',exit:'right',entry:'top'},
  {from:'developer',to:'decision',exit:'right',entry:'top'},
  {from:'decision',to:'design',exit:'left',entry:'top'},
  {from:'decision',to:'build',exit:'right',entry:'top'},
  {from:'build',to:'works',exit:'right',entry:'top'},
  {from:'works',to:'talk',exit:'right',entry:'top'},
];
export function connectorPath(from:Box, to:Box, exit:'bottom'|'left'|'right', entry:'top'|'left') {
  const start={x:from.x+(exit==='right'?from.width/2:exit==='left'?-from.width/2:0), y:from.y+(exit==='bottom'?from.height/2:0)};
  const end={x:to.x-(entry==='left'?to.width/2:0), y:to.y-(entry==='top'?to.height/2:0)};
  return entry==='left' ? 'M '+start.x+' '+start.y+' V '+end.y+' H '+end.x : 'M '+start.x+' '+start.y+' H '+end.x+' V '+end.y;
}
