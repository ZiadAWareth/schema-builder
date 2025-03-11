"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  PlusCircle, 
  Trash2, 
  Edit, 
  XCircle,
  Type,
  Hash,
  AtSign,
  AlignLeft,
  List,
} from "lucide-react";

// Define field types
const fieldTypes = [
  { id: "string", label: "String", icon: <Type className="h-4 w-4" /> },
  { id: "int", label: "Int", icon: <Hash className="h-4 w-4" /> },
  { id: "boolean", label: "Boolean", icon: <Type className="h-4 w-4" /> },
  { id: "email", label: "Email", icon: <AtSign className="h-4 w-4" /> },
  { id: "text", label: "Text", icon: <AlignLeft className="h-4 w-4" /> },
  { id: "enum", label: "Enum", icon: <List className="h-4 w-4" /> },
  { id: "float", label: "Float", icon: <Hash className="h-4 w-4" /> },
  { id: "datetime", label: "DateTime", icon: <Type className="h-4 w-4" /> },
];

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
interface TableCreatorProps {
  initialTable?: Table;
  onSave: (table: Table) => void;
  onAddField: () => void;
}

export function TableCreator({ initialTable, onSave, onAddField }: TableCreatorProps) {
  // State
  const [table, setTable] = useState<Table>(() => {
    if (initialTable) {
      return JSON.parse(JSON.stringify(initialTable)); // Deep copy
    }
    
    // Create a new table with default fields
    const now = Date.now();
    const newTableId = `table-${now}`;
    return {
      id: newTableId,
      name: "New Table",
      fields: [
        {
          id: `field-${now}-id`,
          name: "id",
          type: "int",
          isPrimary: true,
          isRequired: true,
          isUnique: true,
        },
        {
          id: `field-${now}-createdAt`,
          name: "createdAt",
          type: "datetime",
          isPrimary: false,
          isRequired: true,
          isUnique: false,
        },
        {
          id: `field-${now}-updatedAt`,
          name: "updatedAt",
          type: "datetime",
          isPrimary: false,
          isRequired: true,
          isUnique: false,
        }
      ],
    };
  });
  
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [enumValues, setEnumValues] = useState<string>("");

  // Update state if initialTable changes
  useEffect(() => {
    if (initialTable) {
      setTable(JSON.parse(JSON.stringify(initialTable))); // Deep copy
    }
  }, [initialTable]);

  // Edit an existing field
  const handleEditField = (field: Field) => {
    // Make a copy to avoid direct reference
    setEditingField({ ...field });
    setEnumValues((field.enumValues || []).join(", "));
    setShowFieldForm(true);
  };

  // Save field changes
  const handleSaveField = () => {
    if (!editingField || !editingField.name.trim()) return;

    // Make a deep copy
    const fieldToSave = { ...editingField };
    
    // Process enum values
    if (fieldToSave.type === "enum") {
      fieldToSave.enumValues = enumValues
        .split(",")
        .map((value) => value.trim())
        .filter((value) => value);
    } else {
      delete fieldToSave.enumValues;
    }

    // Update fields array
    let updatedFields;
    if (table.fields.find(f => f.id === fieldToSave.id)) {
      updatedFields = table.fields.map(f => 
        f.id === fieldToSave.id ? fieldToSave : f
      );
    } else {
      updatedFields = [...table.fields, fieldToSave];
    }

    // Update table state
    const updatedTable = { 
      ...table, 
      fields: updatedFields 
    };
    setTable(updatedTable);
    
    // Save to parent
    onSave(updatedTable);
    
    // Reset field editing state
    setEditingField(null);
    setShowFieldForm(false);
  };

  // Delete a field
  const handleDeleteField = (fieldId: string) => {
    if (confirm("Are you sure you want to delete this field?")) {
      const updatedTable = {
        ...table,
        fields: table.fields.filter((field) => field.id !== fieldId),
      };
      setTable(updatedTable);
      onSave(updatedTable);
    }
  };
  
  // Add a new field
  const handleAddField = () => {
    setEditingField({
      id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: "",
      type: "string",
      isPrimary: false,
      isRequired: false,
      isUnique: false,
    });
    setShowFieldForm(true);
    setEnumValues("");
  };

  return (
    <div className="w-full space-y-6">
      <Card className="border shadow-sm">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="font-medium">{table.name}</div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSave(table)}
          >
            Save Table
          </Button>
        </div>
        
        <div className="p-0">
          {/* Fields table */}
          <div className="w-full">
            <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b bg-muted/10 text-sm font-medium">
              <div className="col-span-3">Name</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Required</div>
              <div className="col-span-2">Primary</div>
              <div className="col-span-2">Unique</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>
            
            {table.fields.map(field => (
              <div 
                key={field.id}
                className="grid grid-cols-12 gap-4 px-4 py-3 border-b items-center text-sm hover:bg-gray-50"
              >
                <div className="col-span-3 font-medium">{field.name}</div>
                <div className="col-span-2 flex items-center">
                  {field.type === 'int' && <span className="text-xs text-muted-foreground mr-1">#</span>}
                  {field.type === 'string' && <span className="text-xs text-muted-foreground mr-1">T</span>}
                  {field.type === 'datetime' && <span className="text-xs text-muted-foreground mr-1">T</span>}
                  {field.type}
                </div>
                <div className="col-span-2">{field.isRequired ? "Yes" : "No"}</div>
                <div className="col-span-2">{field.isPrimary ? "Yes" : "No"}</div>
                <div className="col-span-2">{field.isUnique ? "Yes" : "No"}</div>
                <div className="col-span-1 flex justify-end space-x-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEditField(field)}
                    className="h-8 w-8"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteField(field.id)}
                    className="h-8 w-8 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {/* Add Field button */}
            <div className="p-4 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddField}
                className="w-full"
              >
                <PlusCircle className="h-4 w-4 mr-2" /> Add Field
              </Button>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Field Edit Form - shown when adding/editing fields */}
      {showFieldForm && (
        <Card className="border p-6">
          <h3 className="text-lg font-medium mb-4">
            {editingField?.id ? (
              table.fields.some(f => f.id === editingField.id) ? "Edit Field" : "Add Field"
            ) : "Add Field"}
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label htmlFor="fieldName">Field Name</Label>
                <Input
                  id="fieldName"
                  placeholder="Enter field name"
                  value={editingField?.name || ""}
                  onChange={(e) => setEditingField({
                    ...editingField!,
                    name: e.target.value,
                  })}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label>Field Type</Label>
                <Select
                  value={editingField?.type || "string"}
                  onValueChange={(value) => setEditingField({
                    ...editingField!,
                    type: value,
                  })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select field type" />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center">
                          {type.icon}
                          <span className="ml-2">{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Enum values */}
            {editingField?.type === "enum" && (
              <div>
                <Label>Enum Values</Label>
                <div className="mt-1 border rounded-md p-3 min-h-[100px]">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {enumValues.split(",").filter(v => v.trim()).map((value, index) => (
                      <div 
                        key={index} 
                        className="bg-muted rounded-md px-2 py-1 text-sm flex items-center"
                      >
                        <span>{value.trim()}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const values = enumValues.split(",").filter(v => v.trim());
                            values.splice(index, 1);
                            setEnumValues(values.join(","));
                          }}
                          className="ml-1 text-muted-foreground hover:text-destructive"
                        >
                          <XCircle className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <Input
                    placeholder="Add value and press Enter"
                    className="border-0 mt-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value.trim()) {
                        e.preventDefault();
                        const newValue = e.currentTarget.value.trim();
                        const currentValues = enumValues ? enumValues.split(",").map(v => v.trim()).filter(Boolean) : [];
                        if (!currentValues.includes(newValue)) {
                          const newValues = [...currentValues, newValue];
                          setEnumValues(newValues.join(","));
                          e.currentTarget.value = "";
                        }
                      }
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Enter values and press Enter to add them to the enum
                </p>
              </div>
            )}
            
            {/* Checkboxes */}
            <div className="flex space-x-6 mt-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={editingField?.isPrimary || false}
                  onChange={(e) => setEditingField({
                    ...editingField!,
                    isPrimary: e.target.checked,
                  })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isPrimary" className="cursor-pointer">Primary Key</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isRequired"
                  checked={editingField?.isRequired || false}
                  onChange={(e) => setEditingField({
                    ...editingField!,
                    isRequired: e.target.checked,
                  })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isRequired" className="cursor-pointer">Required</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isUnique"
                  checked={editingField?.isUnique || false}
                  onChange={(e) => setEditingField({
                    ...editingField!,
                    isUnique: e.target.checked,
                  })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isUnique" className="cursor-pointer">Unique</Label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowFieldForm(false);
                  setEditingField(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveField}>
                Save Field
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}