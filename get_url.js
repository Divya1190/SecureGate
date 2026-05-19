const { execSync } = require('child_process');
try {
  const output = execSync('npx prisma dev ls', { encoding: 'utf-8' });
  console.log(output);
} catch (e) {
  console.log(e.stdout);
}
