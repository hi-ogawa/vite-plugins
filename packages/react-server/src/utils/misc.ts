export function findMapInverse<K, V>(map: Map<K, V>, v: V): K | undefined {
  for (const [k, v_] of map) {
    if (v === v_) return k;
  }
  return;
}
