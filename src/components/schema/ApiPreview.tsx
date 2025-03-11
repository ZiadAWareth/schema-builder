"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CopyIcon, ServerIcon } from "lucide-react";

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

interface ApiPreviewProps {
  table: Table;
}

export function ApiPreview({ table }: ApiPreviewProps) {
  const [copied, setCopied] = useState(false);
  
  // Format the table name for API paths
  const formatApiPath = (name: string): string => {
    // Convert to kebab-case for APIs
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  };
  
  // Format the model name for code
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
  
  // Get primary key field
  const getPrimaryKey = (): string => {
    const primaryField = table.fields.find(f => f.isPrimary);
    return primaryField ? primaryField.name : 'id';
  };
  
  // Generate API routes text
  const generateApiRoutes = (): string => {
    const apiPath = formatApiPath(table.name);
    const modelName = formatModelName(table.name);
    const primaryKey = getPrimaryKey();
    
    return `API ROUTES

# ${modelName} API Endpoints

GET    /api/${apiPath}           # List all ${table.name.toLowerCase()}s
POST   /api/${apiPath}           # Create a new ${table.name.toLowerCase()}
GET    /api/${apiPath}/:${primaryKey}  # Get a single ${table.name.toLowerCase()}
PUT    /api/${apiPath}/:${primaryKey}  # Update a ${table.name.toLowerCase()}
DELETE /api/${apiPath}/:${primaryKey}  # Delete a ${table.name.toLowerCase()}

# Additional Query Parameters
?sort=${table.fields[0]?.name ?? 'name'}:asc      # Sort by ${table.fields[0]?.name ?? 'name'} ascending`;
    
    // Add field-specific query parameters for filterable fields
    const filterableFields = table.fields.filter(f => 
      ['string', 'int', 'float', 'boolean', 'datetime', 'enum'].includes(f.type.toLowerCase())
    );
    
    let additionalParams = '';
    
    if (filterableFields.length > 0) {
      filterableFields.slice(0, 3).forEach(field => {
        if (field.type.toLowerCase() === 'string' || field.type.toLowerCase() === 'enum') {
          additionalParams += `\n?filter.${field.name}=value      # Filter by ${field.name}`;
        } else if (field.type.toLowerCase() === 'int' || field.type.toLowerCase() === 'float') {
          additionalParams += `\n?filter.${field.name}_gte=100    # Filter by ${field.name} >= 100`;
        } else if (field.type.toLowerCase() === 'boolean') {
          additionalParams += `\n?filter.${field.name}=true       # Filter by ${field.name} status`;
        }
      });
    }
    
    return additionalParams ? `${apiRoutes}\n${additionalParams}` : apiRoutes;
  };
  
  const apiRoutes = generateApiRoutes();
  
  const handleCopyClick = () => {
    navigator.clipboard.writeText(apiRoutes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center">
          <ServerIcon className="mr-2 h-5 w-5" /> API Endpoints
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
        <pre className="whitespace-pre">{apiRoutes}</pre>
      </Card>
      
      <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm">
        <p className="text-amber-700 mb-2 font-medium">✨ Implementation details</p>
        <p className="text-amber-600 mb-1">
          These RESTful API endpoints will be automatically generated for your table.
          You can use them to perform CRUD operations on your data.
        </p>
        <p className="text-amber-600">
          The endpoints support filtering, sorting, and pagination out of the box.
        </p>
      </div>
    </div>
  );
}