import fs from 'fs';
import path from 'path';

// Function to recursively find all TSX files
function findTsxFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findTsxFiles(fullPath));
    } else if (item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Function to find TSX files that have JSX counterparts
function findDuplicateFiles() {
  const tsxFiles = findTsxFiles('.');
  const duplicates = [];
  
  for (const tsxFile of tsxFiles) {
    const jsxFile = tsxFile.replace(/\.tsx$/, '.jsx');
    if (fs.existsSync(jsxFile)) {
      duplicates.push({
        tsx: tsxFile,
        jsx: jsxFile
      });
    }
  }
  
  return duplicates;
}

// Main function
function reviewAndDelete() {
  const duplicates = findDuplicateFiles();
  
  if (duplicates.length === 0) {
    console.log('No duplicate files found!');
    return;
  }
  
  console.log(`Found ${duplicates.length} TSX files that have JSX counterparts:\n`);
  
  duplicates.forEach((file, index) => {
    console.log(`${index + 1}. TSX: ${file.tsx}`);
    console.log(`   JSX: ${file.jsx}\n`);
  });
  
  console.log('These TSX files can be safely deleted since JSX versions exist.');
  console.log('Proceeding to delete them...\n');
  
  let deletedCount = 0;
  for (const file of duplicates) {
    try {
      fs.unlinkSync(file.tsx);
      console.log(`✓ Deleted: ${file.tsx}`);
      deletedCount++;
    } catch (error) {
      console.error(`✗ Error deleting ${file.tsx}: ${error.message}`);
    }
  }
  
  console.log(`\nDeletion complete! Deleted ${deletedCount} TSX files.`);
}

// Run the script
reviewAndDelete(); 