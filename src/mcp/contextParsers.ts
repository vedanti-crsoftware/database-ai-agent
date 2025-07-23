import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

export interface ContextItem {
  id: string;
  type: 'excel' | 'sql';
  title: string;
  content: string;
  metadata: Record<string, any>;
}

export class ExcelParser {
  static parseExcelFile(filePath: string): ContextItem[] {
    try {
      const workbook = XLSX.readFile(filePath);
      const contextItems: ContextItem[] = [];
      
      workbook.SheetNames.forEach((sheetName, index) => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Convert to structured text representation
        const headers = jsonData[0] as string[] || [];
        const rows = jsonData.slice(1);
        
        let content = `Sheet: ${sheetName}\n`;
        content += `Columns: ${headers.join(', ')}\n\n`;
        
        // Sample data (first 10 rows)
        const sampleRows = rows.slice(0, 10) as any[][];
        sampleRows.forEach((row, rowIndex) => {
          const rowData = headers.map((header, colIndex) => 
            `${header}: ${row[colIndex] || 'NULL'}`
          ).join(', ');
          content += `Row ${rowIndex + 1}: ${rowData}\n`;
        });
        
        if (rows.length > 10) {
          content += `... and ${rows.length - 10} more rows\n`;
        }
        
        contextItems.push({
          id: `excel_${path.basename(filePath)}_${sheetName}`,
          type: 'excel',
          title: `${path.basename(filePath)} - ${sheetName}`,
          content,
          metadata: {
            filePath,
            sheetName,
            totalRows: rows.length,
            columns: headers,
            hasHeaders: headers.length > 0
          }
        });
      });
      
      return contextItems;
    } catch (error) {
      console.error(`Error parsing Excel file ${filePath}:`, error);
      return [];
    }
  }
}

export class SQLParser {
  static parseSQLFile(filePath: string): ContextItem[] {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const contextItems: ContextItem[] = [];
      
      // Split SQL content by statements (rough parsing)
      const statements = content
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      
      let allTablesContent = '';
      const tableDefinitions: string[] = [];
      
      statements.forEach((statement, index) => {
        if (statement.toUpperCase().includes('CREATE TABLE')) {
          tableDefinitions.push(statement);
          allTablesContent += statement + ';\n\n';
        }
      });
      
      // Create a comprehensive context item for all table definitions
      contextItems.push({
        id: `sql_${path.basename(filePath)}_all_tables`,
        type: 'sql',
        title: `Database Schema - ${path.basename(filePath)}`,
        content: `SQL Schema File: ${path.basename(filePath)}\n\nTable Definitions:\n\n${allTablesContent}`,
        metadata: {
          filePath,
          totalStatements: statements.length,
          tableCount: tableDefinitions.length,
          tables: this.extractTableNames(tableDefinitions)
        }
      });
      
      // Create individual context items for each table
      tableDefinitions.forEach((tableDef, index) => {
        const tableName = this.extractTableName(tableDef);
        if (tableName) {
          contextItems.push({
            id: `sql_${path.basename(filePath)}_table_${tableName}`,
            type: 'sql',
            title: `Table: ${tableName}`,
            content: `Table Definition for ${tableName}:\n\n${tableDef};`,
            metadata: {
              filePath,
              tableName,
              columns: this.extractColumns(tableDef)
            }
          });
        }
      });
      
      return contextItems;
    } catch (error) {
      console.error(`Error parsing SQL file ${filePath}:`, error);
      return [];
    }
  }
  
  private static extractTableName(createStatement: string): string | null {
    const match = createStatement.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:dbo\.)?(\w+)/i);
    return match ? match[1] : null;
  }
  
  private static extractTableNames(statements: string[]): string[] {
    return statements
      .map(stmt => this.extractTableName(stmt))
      .filter((name): name is string => name !== null);
  }
  
  private static extractColumns(createStatement: string): string[] {
    const columns: string[] = [];
    const lines = createStatement.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.toUpperCase().startsWith('CREATE') && 
          !trimmed.startsWith('(') && !trimmed.startsWith(')') &&
          !trimmed.toUpperCase().startsWith('CONSTRAINT') &&
          !trimmed.toUpperCase().startsWith('INDEX') &&
          trimmed !== ',') {
        const columnMatch = trimmed.match(/^(\w+)\s+/);
        if (columnMatch) {
          columns.push(columnMatch[1]);
        }
      }
    }
    
    return columns;
  }
}

export class ContextManager {
  private contextItems: ContextItem[] = [];
  
  async loadContextFromDirectory(directory: string): Promise<void> {
    try {
      const files = fs.readdirSync(directory);
      this.contextItems = [];
      
      for (const file of files) {
        const filePath = path.join(directory, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isFile()) {
          const ext = path.extname(file).toLowerCase();
          
          if (['.xlsx', '.xls'].includes(ext)) {
            const excelItems = ExcelParser.parseExcelFile(filePath);
            this.contextItems.push(...excelItems);
          } else if (ext === '.sql') {
            const sqlItems = SQLParser.parseSQLFile(filePath);
            this.contextItems.push(...sqlItems);
          }
        }
      }
      
      console.log(`Loaded ${this.contextItems.length} context items from ${directory}`);
    } catch (error) {
      console.error(`Error loading context from directory ${directory}:`, error);
    }
  }
  
  getContextItems(): ContextItem[] {
    return this.contextItems;
  }
  
  getContextById(id: string): ContextItem | undefined {
    return this.contextItems.find(item => item.id === id);
  }
  
  searchContext(query: string): ContextItem[] {
    const queryLower = query.toLowerCase();
    return this.contextItems.filter(item => 
      item.title.toLowerCase().includes(queryLower) ||
      item.content.toLowerCase().includes(queryLower) ||
      (item.metadata.tableName && item.metadata.tableName.toLowerCase().includes(queryLower)) ||
      (item.metadata.columns && item.metadata.columns.some((col: string) => 
        col.toLowerCase().includes(queryLower)
      ))
    );
  }
} 