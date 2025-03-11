"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Network,
  Plus,
  Info 
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

// Relationship interface
interface Relationship {
  id: string;
  sourceTableId: string;
  targetTableId: string;
  type: "one-to-one" | "one-to-many" | "many-to-many";
}

interface RelationshipDiagramProps {
  table: Table;
  allTables: Table[];
}

export function RelationshipDiagram({ table, allTables }: RelationshipDiagramProps) {
  // In a real application, you would load relationships from storage
  // This is a simplified version that just shows a visual mockup
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [showAddRelationship, setShowAddRelationship] = useState(false);
  const [newRelationship, setNewRelationship] = useState<Partial<Relationship>>({
    sourceTableId: table.id,
    type: "one-to-many"
  });
  
  // Get the table name for a given ID
  const getTableName = (tableId: string): string => {
    const foundTable = allTables.find(t => t.id === tableId);
    return foundTable ? foundTable.name : "Unknown Table";
  };
  
  // Format model names to be valid
  const formatName = (name: string): string => {
    return name.replace(/[^\w]/g, '');
  };
  
  const addRelationship = () => {
    if (!newRelationship.targetTableId) return;
    
    const relationship: Relationship = {
      id: `rel-${Date.now()}`,
      sourceTableId: table.id,
      targetTableId: newRelationship.targetTableId as string,
      type: newRelationship.type as "one-to-one" | "one-to-many" | "many-to-many"
    };
    
    setRelationships([...relationships, relationship]);
    setShowAddRelationship(false);
    setNewRelationship({
      sourceTableId: table.id,
      type: "one-to-many"
    });
    
    // In a real app, you would save this relationship to storage/state
  };
  
  // Simplified diagram - in a real app, you would use a library like react-flow or mermaid
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center">
          <Network className="mr-2 h-5 w-5" /> Relationship Map
        </h3>
        <Button
          size="sm"
          onClick={() => setShowAddRelationship(true)}
          className="flex items-center"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Relationship
        </Button>
      </div>
      
      {/* Simple relationship diagram */}
      <Card className="p-6 bg-slate-50">
        {relationships.length > 0 ? (
          <div className="flex flex-col space-y-4">
            {relationships.map(rel => (
              <div 
                key={rel.id} 
                className="flex items-center justify-between border rounded-md p-3 bg-white"
              >
                <div className="flex-1 text-center p-2 bg-blue-100 rounded">
                  {getTableName(rel.sourceTableId)}
                </div>
                
                <div className="flex flex-col items-center mx-4">
                  <div className="text-xs font-semibold mb-1">
                    {rel.type === "one-to-one" && "1:1"}
                    {rel.type === "one-to-many" && "1:N"}
                    {rel.type === "many-to-many" && "N:N"}
                  </div>
                  <div className="h-px w-24 bg-gray-400"></div>
                </div>
                
                <div className="flex-1 text-center p-2 bg-blue-100 rounded">
                  {getTableName(rel.targetTableId)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
            <Info className="h-8 w-8 mb-2 opacity-50" />
            <p>No relationships defined yet.</p>
            <p className="text-sm">Add a relationship to visualize connections between tables.</p>
          </div>
        )}
      </Card>
      
      {/* Add relationship form */}
      {showAddRelationship && (
        <Card className="p-4 border-blue-200 bg-blue-50">
          <h4 className="font-medium mb-3">Create New Relationship</h4>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">From Table</label>
              <div className="p-2 bg-blue-100 rounded mt-1">{table.name}</div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Relationship Type</label>
              <Select
                value={newRelationship.type}
                onValueChange={(value) => setNewRelationship({...newRelationship, type: value as any})}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one-to-one">One-to-One (1:1)</SelectItem>
                  <SelectItem value="one-to-many">One-to-Many (1:N)</SelectItem>
                  <SelectItem value="many-to-many">Many-to-Many (N:N)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">To Table</label>
              <Select
                value={newRelationship.targetTableId}
                onValueChange={(value) => setNewRelationship({...newRelationship, targetTableId: value})}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select table" />
                </SelectTrigger>
                <SelectContent>
                  {allTables
                    .filter(t => t.id !== table.id)
                    .map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddRelationship(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={addRelationship}
                disabled={!newRelationship.targetTableId}
              >
                Add Relationship
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}