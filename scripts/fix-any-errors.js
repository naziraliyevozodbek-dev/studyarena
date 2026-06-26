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

  // Replace `catch (err: any) {` with `catch (err: unknown) {`
  if (content.includes('catch (err: any)')) {
    content = content.replace(/catch\s*\(\s*(err|error)\s*:\s*any\s*\)\s*\{/g, 'catch ($1: unknown) {');
    changed = true;
  }

  // Same for catch(e: any)
  if (content.includes('catch (e: any)')) {
    content = content.replace(/catch\s*\(\s*e\s*:\s*any\s*\)\s*\{/g, 'catch (e: unknown) {');
    changed = true;
  }

  if (changed) {
    content = content.replace(/err\.message/g, '(err instanceof Error ? err.message : String(err))');
    content = content.replace(/error\.message/g, '(error instanceof Error ? error.message : String(error))');
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated: ${file}`);
  }
});
