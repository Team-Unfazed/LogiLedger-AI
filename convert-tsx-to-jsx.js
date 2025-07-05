import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Function to convert TSX content to JSX
function convertTsxToJsx(content) {
  // Remove TypeScript-specific syntax
  let jsxContent = content;
  
  // Remove type imports
  jsxContent = jsxContent.replace(/import\s+.*\btype\b.*from\s+['"][^'"]+['"];?\n?/g, '');
  
  // Remove type annotations in function parameters
  jsxContent = jsxContent.replace(/:\s*[A-Za-z<>\[\]{}|&,.\s]+(?=\s*[,)])/g, '');
  
  // Remove interfaces
  jsxContent = jsxContent.replace(/interface\s+\w+\s*\{[^}]*\}/g, '');
  
  // Remove type aliases
  jsxContent = jsxContent.replace(/type\s+\w+\s*=\s*[^;]+;/g, '');
  
  // Remove exported interfaces
  jsxContent = jsxContent.replace(/export\s+interface\s+\w+\s*\{[^}]*\}/g, '');
  
  // Remove exported types
  jsxContent = jsxContent.replace(/export\s+type\s+\w+\s*=\s*[^;]+;/g, '');
  
  // Remove VariantProps
  jsxContent = jsxContent.replace(/VariantProps<[^>]+>/g, '');
  
  // Remove React type parameters
  jsxContent = jsxContent.replace(/React\.(\w+)<[^>]+>/g, 'React.$1');
  
  // Remove forwardRef type parameters
  jsxContent = jsxContent.replace(/React\.forwardRef<[^>]+>/g, 'React.forwardRef');
  
  // Clean up empty lines
  jsxContent = jsxContent.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return jsxContent;
}

// Main conversion function
function convertAllTsxFiles() {
  const tsxFiles = findTsxFiles('.');
  
  console.log(`Found ${tsxFiles.length} TSX files to convert...`);
  
  for (const tsxFile of tsxFiles) {
    console.log(`Converting ${tsxFile}...`);
    
    try {
      const content = fs.readFileSync(tsxFile, 'utf8');
      const jsxContent = convertTsxToJsx(content);
      
      const jsxFile = tsxFile.replace(/\.tsx$/, '.jsx');
      fs.writeFileSync(jsxFile, jsxContent, 'utf8');
      
      console.log(`Created ${jsxFile}`);
    } catch (error) {
      console.error(`Error converting ${tsxFile}:`, error.message);
    }
  }
  
  console.log('Conversion complete!');
}

// Run the conversion
convertAllTsxFiles(); 