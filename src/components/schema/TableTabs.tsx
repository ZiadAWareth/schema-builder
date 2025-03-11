"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableCreator } from "@/components/schema/TableCreator";
import { SchemaPreview } from "@/components/schema/SchemaPreview";
import { RelationshipDiagram } from "@/components/schema/RelationshipDiagram";
import { ApiPreview } from "@/components/schema/ApiPreview";
import { Card } from "@/components/ui/card";

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

// Props interface
interface TableTabsProps {
  table: Table;
  allTables: Table[];
  onSave: (table: Table) => void;
}

export function TableTabs({ table, allTables, onSave }: TableTabsProps) {
  const [activeTab, setActiveTab] = useState("fields");

  return (
    <Card className="border border-gray-200 rounded-md shadow-sm">
      <div className="border-b">
        <Tabs defaultValue="fields" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full h-12 px-4 bg-muted/20">
            <TabsTrigger value="fields" className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary">Fields Editor</TabsTrigger>
            <TabsTrigger value="schema" className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary">Schema Preview</TabsTrigger>
            <TabsTrigger value="relationships" className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary">Relationship Diagram</TabsTrigger>
            <TabsTrigger value="api" className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary">API Preview</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="p-0">
        {activeTab === "fields" && (
          <TableCreator 
            initialTable={table} 
            onSave={onSave}
          />
        )}
        
        {activeTab === "schema" && (
          <div className="p-6">
            <SchemaPreview table={table} />
          </div>
        )}
        
        {activeTab === "relationships" && (
          <div className="p-6">
            <RelationshipDiagram table={table} allTables={allTables} />
          </div>
        )}
        
        {activeTab === "api" && (
          <div className="p-6">
            <ApiPreview table={table} />
          </div>
        )}
      </div>
    </Card>
  );
}