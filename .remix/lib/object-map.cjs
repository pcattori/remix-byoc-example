/** @type {<K,V1,V2>(obj: Record<K,V1>, f: (entry: [K,V1]) => [K,V2]) => Record<K,V2>} */
const objectMap = (obj, f) => Object.fromEntries(Object.entries(obj).map(f));

module.exports = {
  objectMap,
};
