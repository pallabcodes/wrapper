import * as fs from 'fs-extra';
import * as path from 'path';

export class FileUtils {
  static async ensureDirectory(dirPath: string): Promise<void> {
    await fs.ensureDir(dirPath);
  }

  static async readFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf8');
  }

  static async writeFile(filePath: string, content: string): Promise<void> {
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf8');
  }

  static async copyFile(src: string, dest: string): Promise<void> {
    await fs.ensureDir(path.dirname(dest));
    await fs.copy(src, dest);
  }

  static async exists(filePath: string): Promise<boolean> {
    return fs.pathExists(filePath);
  }

  static async remove(filePath: string): Promise<void> {
    await fs.remove(filePath);
  }

  static async getFileStats(filePath: string): Promise<fs.Stats | null> {
    try {
      return await fs.stat(filePath);
    } catch {
      return null;
    }
  }

  static async findFiles(dir: string, pattern: RegExp): Promise<string[]> {
    const files: string[] = [];
    
    const walk = async (currentDir: string) => {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile() && pattern.test(entry.name)) {
          files.push(fullPath);
        }
      }
    };
    
    await walk(dir);
    return files;
  }

  static async findDirectories(dir: string, pattern?: RegExp): Promise<string[]> {
    const directories: string[] = [];
    
    const walk = async (currentDir: string) => {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const fullPath = path.join(currentDir, entry.name);
          
          if (!pattern || pattern.test(entry.name)) {
            directories.push(fullPath);
          }
          
          await walk(fullPath);
        }
      }
    };
    
    await walk(dir);
    return directories;
  }
}

