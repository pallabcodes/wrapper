// Basic structure validation without requiring full build
console.log('🔍 Validating StreamVerse User Service Structure...\n');

// Check if files exist
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'src/main.ts',
  'src/app.module.ts',
  'src/domain/entities/user.entity.ts',
  'src/domain/value-objects/email.vo.ts',
  'src/domain/value-objects/username.vo.ts',
  'src/domain/value-objects/password.vo.ts',
  'src/domain/ports/user-repository.port.ts',
  'src/application/use-cases/register-user.usecase.ts',
  'src/presentation/http/controllers/user.controller.ts',
  'src/infrastructure/persistence/postgres-user.repository.ts',
];

let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (allFilesExist) {
  console.log('\n🎉 All required files exist!');
  console.log('The user-service structure is complete.');
  console.log('\nNext steps:');
  console.log('1. Start PostgreSQL: docker run -d --name postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=streamverse -p 5432:5432 postgres:15');
  console.log('2. Install dependencies: npm install');
  console.log('3. Set environment variables');
  console.log('4. Run: npm run start:dev');
} else {
  console.log('\n❌ Some files are missing. Please check the structure.');
  process.exit(1);
}
