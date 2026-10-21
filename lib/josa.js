// 받침 유무에 따라 조사를 골라 붙임: josa('브랜드', '을/를') → '브랜드를'
export function josa(word, pair) {
  const [withFinal, withoutFinal] = pair.split('/');
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  const hasFinal = code >= 0 && code <= 11171 && code % 28 !== 0;
  return word + (hasFinal ? withFinal : withoutFinal);
}
