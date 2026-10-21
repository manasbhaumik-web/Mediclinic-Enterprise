const fs = require('fs');
const path = require('path');

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

let totalSm = 0, totalMd = 0, totalLg = 0, totalAria = 0, totalAnimate = 0, totalTransitions = 0;

console.log("UI/UX Static Code Analysis\n");

files.forEach(file => {
  const code = fs.readFileSync(path.join(dir, file), 'utf8');
  const sm = (code.match(/sm:/g) || []).length;
  const md = (code.match(/md:/g) || []).length;
  const lg = (code.match(/lg:/g) || []).length;
  const aria = (code.match(/aria-/g) || []).length;
  const animate = (code.match(/animate-/g) || []).length;
  const trans = (code.match(/transition-/g) || []).length;

  totalSm += sm; totalMd += md; totalLg += lg; totalAria += aria; totalAnimate += animate; totalTransitions += trans;

  if (code.length > 5000) {
    console.log(`${file}:`);
    console.log(`  Responsive: sm:${sm} md:${md} lg:${lg}`);
    console.log(`  A11y: aria:${aria}`);
    console.log(`  Motion: animate:${animate} transition:${trans}\n`);
  }
});

console.log("=== TOTALS ===");
console.log(`Responsive Classes (sm, md, lg): ${totalSm + totalMd + totalLg}`);
console.log(`Accessibility Attributes (aria-*): ${totalAria}`);
console.log(`Micro-interactions (animate-*, transition-*): ${totalAnimate + totalTransitions}`);
