"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableCreator } from "@/components/schema/TableCreator";
import { SchemaPreview } from "@/components/schema/SchemaPreview";
import { RelationshipDiagram } from "@/components/schema/RelationshipDiagram";
import { ApiPreview } from "@/components/schema/ApiPreview";

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

interface TablePageProps {
  table: Table;
  allTables: Table[];
  onSave: (table: Table) => void;
}

export function TablePage({ table, allTables, onSave }: TablePageProps) {
  const [activeTab, setActiveTab] = useState("fields");
  const [isAddingField, setIsAddingField] = useState(false);

  return (
    <div className="space-y-6">
      {/* Table Creator - Always visible at the top */}
      <TableCreator
        initialTable={table}
        onSave={onSave}
        onAddField={() => setIsAddingField(true)}
      />
      
      {/* Tabs for additional views - Below the table editor */}
      <div className="border rounded-md shadow-sm overflow-hidden">
        <Tabs 
          defaultValue="fields-editor" 
          className="w-full"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <div className="border-b">
            <TabsList className="w-full justify-start bg-muted/20 p-0">
              <TabsTrigger 
                value="fields-editor"
                className="flex-1 data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary py-3 px-4 rounded-none"
              >
                Fields Editor
              </TabsTrigger>
              <TabsTrigger 
                value="schema-preview" 
                className="flex-1 data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary py-3 px-4 rounded-none"
              >
                Schema Preview
              </TabsTrigger>
              <TabsTrigger 
                value="relationship-diagram" 
                className="flex-1 data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary py-3 px-4 rounded-none"
              >
                Relationship Diagram
              </TabsTrigger>
              <TabsTrigger 
                value="api-preview" 
                className="flex-1 data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary py-3 px-4 rounded-none"
              >
                API Preview
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="fields-editor" className="p-0">
            {/* Fields Editor tab is intentionally left empty as we're showing the TableCreator above */}
            <div className="p-6 text-center text-muted-foreground">
              Use the fields editor above to manage the fields for this table.
            </div>
          </TabsContent>
          
          <TabsContent value="schema-preview" className="p-6 m-0">
            <SchemaPreview table={table} />
          </TabsContent>
          
          <TabsContent value="relationship-diagram" className="p-6 m-0">
            <RelationshipDiagram table={table} allTables={allTables} />
          </TabsContent>
          
          <TabsContent value="api-preview" className="p-6 m-0">
            <ApiPreview table={table} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}