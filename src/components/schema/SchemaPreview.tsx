"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CopyIcon, Code } from "lucide-react";

// Field interface
interface Field {
  id: string;
  name: string;
  type: string;
  isPrimary: boolean;
  isRequired: boolean;
  isUnique: boolean;
  enumValues?: string[];
}

// Table interface
interface Table {
  id: string;
  name: string;
  fields: Field[];
}

interface SchemaPreviewProps {
  table: Table;
}

export function SchemaPreview({ table }: SchemaPreviewProps) {
  const [copied, setCopied] = useState(false);
  
  // Function to format model names to be valid Prisma identifiers
  const formatModelName = (name: string): string => {
    // Replace spaces and special characters with nothing
    let formatted = name.replace(/[^\w]/g, '');
    
    // Ensure it starts with a letter
    if (!/^[A-Za-z]/.test(formatted)) {
      formatted = 'Model' + formatted;
    }
    
    // Convert to PascalCase (capitalize first letter)
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };
  
  // Map field types to Prisma types
  const mapToPrismaType = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'string':
        return 'String';
      case 'int':
        return 'Int';
      case 'boolean':
        return 'Boolean';
      case 'float':
        return 'Float';
      case 'datetime':
        return 'DateTime';
      case 'email':
        return 'String'; // Email is String in Prisma
      case 'text':
        return 'String'; // Text is String in Prisma
      case 'enum':
        return 'String'; // For simplicity, we'll treat enum as String
      default:
        return 'String';
    }
  };
  
  // Generate the schema for this table
  const generateSchema = (): string => {
    const modelName = formatModelName(table.name);
    
    let schema = `model ${modelName} {\n`;
    
    // Add fields
    table.fields.forEach(field => {
      if (!field.name) return;
      
      const prismaType = mapToPrismaType(field.type);
      const modifiers = [];
      
      // Add required modifier (or make optional with ?)
      const requiredModifier = field.isRequired ? '' : '?';
      
      // Add primary key modifier
      if (field.isPrimary) {
        modifiers.push('@id');
      }
      
      // Add unique modifier
      if (field.isUnique) {
        modifiers.push('@unique');
      }
      
      // Add special default values
      if (field.name === 'id' && field.isPrimary) {
        modifiers.push('@default(autoincrement())');
      } else if (field.name === 'createdAt') {
        modifiers.push('@default(now())');
      }
      
      // Combine modifiers
      const modifierString = modifiers.length > 0 ? ' ' + modifiers.join(' ') : '';
      
      // Add the field to the model
      schema += `  ${field.name} ${prismaType}${requiredModifier}${modifierString}\n`;
    });
    
    // Check if we have enum values to add
    const enumFields = table.fields.filter(f => f.type === 'enum' && f.enumValues && f.enumValues.length > 0);
    
    // Close the model definition
    schema += '}\n';
    
    // Add enum definitions if any
    if (enumFields.length > 0) {
      enumFields.forEach(field => {
        if (!field.enumValues?.length) return;
        
        const enumName = formatModelName(field.name);
        schema += `\nenum ${enumName} {\n`;
        field.enumValues.forEach(value => {
          schema += `  ${value}\n`;
        });
        schema += '}\n';
      });
    }
    
    return schema;
  };
  
  const handleCopyClick = () => {
    navigator.clipboard.writeText(generateSchema());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center">
          <Code className="mr-2 h-5 w-5" /> Generated Schema
        </h3>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopyClick}
          className="flex items-center"
        >
          <CopyIcon className="mr-2 h-4 w-4" />
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>
      
      <Card className="bg-zinc-950 text-zinc-50 font-mono text-sm p-4 rounded-md overflow-x-auto">
        <pre className="whitespace-pre">{generateSchema()}</pre>
      </Card>
    </div>
  );
}