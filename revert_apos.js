const fs=require('fs');
const files=[
  'src/app/challenges/[id]/page.tsx',
  'src/app/chat/[groupId]/page.tsx',
  'src/app/chat/page.tsx',
  'src/app/learn/page.tsx',
  'src/app/learn/weak/page.tsx',
  'src/app/mentor/challenges/[id]/page.tsx',
  'src/app/mentor/challenges/page.tsx',
  'src/app/mentor/courses/[id]/page.tsx',
  'src/app/mentor/courses/[id]/students/[studentId]/page.tsx',
  'src/app/mentor/resources/page.tsx',
  'src/app/onboarding/page.tsx',
  'src/app/page.tsx',
  'src/app/profile/settings/page.tsx',
  'src/app/resources/page.tsx',
  'src/app/tasks/[id]/page.tsx',
  'src/components/ui/Select.tsx'
];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/&apos;/g, "'");
  fs.writeFileSync(f, content);
  console.log('Reverted', f);
});
