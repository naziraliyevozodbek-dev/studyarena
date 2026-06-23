const fs = require('fs');

const apiFiles = [
  'src/app/api/courses/[id]/route.ts',
  'src/app/api/homeworks/[id]/route.ts',
  'src/app/api/mentor/courses/[id]/students/route.ts',
  'src/app/api/student/tasks/[id]/submit/route.ts',
  'src/app/api/submissions/[id]/grade/route.ts'
];

apiFiles.forEach(f => {
  if (!fs.existsSync(f)) return;
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/\{ params \}: \{ params: \{ (.*?): string \} \}/g, '{ params }: { params: Promise<{ $1: string }> }');
  content = content.replace(/params\.(id|homeworkId|studentId)/g, '(await params).$1');
  fs.writeFileSync(f, content);
  console.log('Fixed API: ' + f);
});

const pageFiles = [
  'src/app/mentor/courses/[id]/page.tsx',
  'src/app/mentor/courses/[id]/homeworks/[homeworkId]/page.tsx',
  'src/app/mentor/courses/[id]/students/[studentId]/page.tsx',
  'src/app/tasks/[id]/page.tsx'
];

pageFiles.forEach(f => {
  if (!fs.existsSync(f)) return;
  let content = fs.readFileSync(f, 'utf8');
  
  if (!content.includes("import { use }")) {
    content = content.replace("import { useEffect", "import { use, useEffect");
  }

  // Handle single param pages
  if (content.includes('params: { id: string }')) {
    content = content.replace('params: { id: string }', 'params: Promise<{ id: string }>');
    content = content.replace(/export default function \w+\(.*\) \{/, match => match + '\n  const resolvedParams = use(params);\n');
    content = content.replace(/params\.id/g, 'resolvedParams.id');
  } 
  // Handle double param pages
  else if (content.includes('params: { id: string, homeworkId: string }')) {
    content = content.replace('params: { id: string, homeworkId: string }', 'params: Promise<{ id: string, homeworkId: string }>');
    content = content.replace(/export default function \w+\(.*\) \{/, match => match + '\n  const resolvedParams = use(params);\n');
    content = content.replace(/params\.id/g, 'resolvedParams.id');
    content = content.replace(/params\.homeworkId/g, 'resolvedParams.homeworkId');
  }
  else if (content.includes('params: { id: string, studentId: string }')) {
    content = content.replace('params: { id: string, studentId: string }', 'params: Promise<{ id: string, studentId: string }>');
    content = content.replace(/export default function \w+\(.*\) \{/, match => match + '\n  const resolvedParams = use(params);\n');
    content = content.replace(/params\.id/g, 'resolvedParams.id');
    content = content.replace(/params\.studentId/g, 'resolvedParams.studentId');
  }

  fs.writeFileSync(f, content);
  console.log('Fixed Page: ' + f);
});
