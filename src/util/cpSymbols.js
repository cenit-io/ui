export default function copySymbols(source, target) {
  Object.getOwnPropertySymbols(source).forEach(symbol => target[symbol] = source[symbol]);
  return target;
};
