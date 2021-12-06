
function defineChain(dict, obj, key, root = null) {
  if (root === null) {
    root = key;
  } else {
    if (root === key) throw new Error(`Chain key recursion. Cannot initialize`);
  }
  if (dict[key]) {
    return dict[key];
  }

  const o = Object.create(null);
  o[key] = true;

  if (!obj[key]) return o;
  if (!Array.isArray(obj[key])) throw new Error(`Chain key ${key} is not an array`);
  for (const k of obj[key]) {
    if (k === key) throw new Error(`Chain key ${key} contains itself`);
    for (const entry in defineChain(dict, obj, k, root)) {
      o[entry] = true;
    }
  }

  dict[key] = o;

  return o;
}

function generateStatusMap(statusMap) {
  const finalMap = Object.create(null);
  for (const k in statusMap) {
    if (!finalMap[k]) {
      defineChain(finalMap, statusMap, k);
    }
  }
  return finalMap;
}

function aggregate(fields, dict) {
  const o = Object.create(null);
  for (const k of fields) {
    for (const entry in dict[k] ?? { [k]: null }) {
      o[entry] = true;
    }
  }
  return o;
}

function anyInChain(fields, req, dict) {
  const agg = aggregate(fields, dict);
  for (const r of req) {
    if (agg[r]) return true;
  }
  return false;
}

module.exports = { generateStatusMap, anyInChain };
