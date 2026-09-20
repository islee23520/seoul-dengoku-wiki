const p1 = /(?<![가-힣])(?<!대구 )약령/gu;
const p2 = /(?<![가-힣])(?<!대구 )(?<!제기동 )(?<!서울 )약령/gu;
const s1 = "제기동 약령";
console.log("p1 match:", !!s1.match(p1));
console.log("p2 match:", !!s1.match(p2));

const a1 = /아차(?=(?:의|에서|로|와|가|는|를|권|축|능선|관문|[·\s-]))/gu;
const s2 = "아차산";
console.log("a1 match (아차산):", !!s2.match(a1));

const q1 = /(?<!「)인준기록정/gu;
const s3 = "「인준기록정」";
const s4 = "인준기록정";
console.log("q1 match (quoted):", !!s3.match(q1));
console.log("q1 match (unquoted):", !!s4.match(q1));
