const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else {
      if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, '../src'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // very basic fix for you're, don't, it's etc inside JSX text
  const fixes = [
    { from: /You're/g, to: "You&apos;re" },
    { from: /you're/g, to: "you&apos;re" },
    { from: /don't/g, to: "don&apos;t" },
    { from: /Don't/g, to: "Don&apos;t" },
    { from: /it's/g, to: "it&apos;s" },
    { from: /It's/g, to: "It&apos;s" },
    { from: /won't/g, to: "won&apos;t" },
    { from: /can't/g, to: "can&apos;t" },
    { from: /Let's/g, to: "Let&apos;s" },
    { from: /haven't/g, to: "haven&apos;t" },
    { from: /I'm/g, to: "I&apos;m" }
  ];

  fixes.forEach(fix => {
    if (content.match(fix.from)) {
      content = content.replace(fix.from, fix.to);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated quotes in: ${file}`);
  }
});
