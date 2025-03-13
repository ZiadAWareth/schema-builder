"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  PlusCircle,
  Database,
  Table2,
  Trash2,
  Edit,
  Save,
  X,
} from "lucide-react";
import { TablePage } from "@/components/schema/TablePage";
import { Table } from "@/types/Table";
import { Field } from "@/types/Field";
import { Sidebar } from "@/components/ui/Sidebar"; // Import the Sidebar component
import { handleGenerateSchema } from "@/services/schema-generation/generateSchema";
import { SchemaModal } from "@/components/schema/SchemaModal"; // Import the SchemaModal component

export default function SchemaEditor() {
  const searchParams = useSearchParams();
  const projectName = searchParams.get("name") || "Untitled Project";
  const initialDbType = searchParams.get("db") || "postgresql";

  // State management
  const [tables, setTables] = useState<Table[]>([]);
  const [dbConnected, setDbConnected] = useState(false);
  const [activeTableId, setActiveTableId] = useState<string | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0); // Force re-render trigger
  const [dbType, setDbType] = useState(initialDbType);
  const [generating, setGenerating] = useState(false); // Add generating state
  const [schemaModalOpen, setSchemaModalOpen] = useState(false); // State for schema modal
  const [generatedSchema, setGeneratedSchema] = useState(''); // State to store generated schema

  // State for inline table name editing
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [editTableName, setEditTableName] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  // State for project name editing
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [editedProjectName, setEditedProjectName] = useState(projectName);
  const projectNameInputRef = useRef<HTMLInputElement>(null);

  // Load tables from localStorage on initial render
  useEffect(() => {
    const loadTables = () => {
      try {
        const savedTables: Table[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith("table-")) {
            try {
              const tableJson = localStorage.getItem(key);
              if (tableJson) {
                const table = JSON.parse(tableJson);
                savedTables.push(table);
              }
            } catch (error) {
              console.error("Error parsing table from localStorage:", error);
            }
          }
        }

        if (savedTables.length > 0) {
          setTables(savedTables);
        }
      } catch (error) {
        console.error("Error loading tables from localStorage:", error);
      }
    };

    loadTables();
  }, []);

  // Focus input when editing table name
  useEffect(() => {
    if (editingTableId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingTableId]);

  // Handle clearing all tables
  const handleClearAllTables = () => {
    if (
      confirm(
        "Are you sure you want to clear all tables? This cannot be undone."
      )
    ) {
      // Remove all table entries from localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("table-")) {
          localStorage.removeItem(key);
        }
      }

      // Reset state
      setTables([]);
      setActiveTableId(null);
      showToast("All tables cleared");
    }
  };

  // Add a new table
  const addTable = () => {
    const now = Date.now();
    const newTableId = `table-${now}`;
    const newTable = {
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
        },
      ],
    };

    // Update state and localStorage
    const updatedTables = [...tables, newTable];
    localStorage.setItem(newTableId, JSON.stringify(newTable));

    setTables(updatedTables);
    setActiveTableId(newTableId);

    // Start editing the name of the new table
    setEditingTableId(newTableId);
    setEditTableName("New Table");
  };

  // Handle saving a table
  const handleSaveTable = (updatedTable: Table) => {
    // Make a deep copy to ensure React detects the change
    const tableCopy = JSON.parse(JSON.stringify(updatedTable));

    // Update localStorage first
    localStorage.setItem(tableCopy.id, JSON.stringify(tableCopy));

    // Update tables array with a completely new array
    const updatedTables = tables.map((table) =>
      table.id === tableCopy.id ? tableCopy : table
    );

    // Update state and force re-render
    setTables(updatedTables);
    setForceUpdate((prev) => prev + 1);

    // Show success toast
    showToast(`Table saved successfully`);
  };

  // Delete a table
  const handleDeleteTable = (tableId: string) => {
    if (confirm("Are you sure you want to delete this table?")) {
      localStorage.removeItem(tableId);
      setTables(tables.filter((table) => table.id !== tableId));
      if (activeTableId === tableId) {
        setActiveTableId(null);
      }
      showToast("Table deleted");
    }
  };

  // Start editing table name in sidebar
  const startEditingTableName = (tableId: string, name: string) => {
    setEditingTableId(tableId);
    setEditTableName(name);
  };

  // Save table name from sidebar
  const saveTableName = () => {
    if (!editingTableId || !editTableName.trim()) {
      setEditingTableId(null);
      return;
    }

    // Find the table
    const tableToUpdate = tables.find((t) => t.id === editingTableId);
    if (!tableToUpdate) {
      setEditingTableId(null);
      return;
    }

    // Create updated table
    const updatedTable = { ...tableToUpdate, name: editTableName };

    // Update localStorage
    localStorage.setItem(updatedTable.id, JSON.stringify(updatedTable));

    // Update state
    const updatedTables = tables.map((table) =>
      table.id === updatedTable.id ? updatedTable : table
    );

    setTables(updatedTables);
    setForceUpdate((prev) => prev + 1);
    setEditingTableId(null);

    showToast("Table name updated");
  };

  // Cancel editing table name
  const cancelEditingTableName = () => {
    setEditingTableId(null);
  };

  // Update project name
  const handleSaveProjectName = () => {
    if (editedProjectName.trim()) {
      // Create URL with new project name
      const params = new URLSearchParams(window.location.search);
      params.set("name", editedProjectName.trim());

      // Update URL without refreshing the page
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}?${params.toString()}`
      );

      // Exit edit mode
      setIsEditingProjectName(false);
      showToast("Project name updated");
    }
  };

  // Focus input when editing project name
  useEffect(() => {
    if (isEditingProjectName && projectNameInputRef.current) {
      projectNameInputRef.current.focus();
    }
  }, [isEditingProjectName]);

  // Handle database type change
  const handleDbTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setDbType(event.target.value);
  };

  // Helper to show toast notifications
  const showToast = (message: string) => {
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.right = "20px";
    toast.style.padding = "10px 15px";
    toast.style.backgroundColor = "#10b981";
    toast.style.color = "white";
    toast.style.borderRadius = "4px";
    toast.style.zIndex = "1000";
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), 2000);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="border-b h-14 flex items-center px-6 justify-between bg-background">
        <div className="font-semibold flex items-center">
          {isEditingProjectName ? (
            <div className="flex items-center space-x-2">
              <Input
                ref={projectNameInputRef}
                value={editedProjectName}
                onChange={(e) => setEditedProjectName(e.target.value)}
                className="h-8 text-sm font-semibold w-64"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSaveProjectName();
                  } else if (e.key === "Escape") {
                    setIsEditingProjectName(false);
                    setEditedProjectName(projectName);
                  }
                }}
                onBlur={() => {
                  handleSaveProjectName();
                }}
              />
            </div>
          ) : (
            <div
              className="cursor-pointer hover:text-primary flex items-center"
              onClick={() => {
                setIsEditingProjectName(true);
                setEditedProjectName(projectName);
              }}
              title="Click to edit project name"
            >
              <span>{projectName}</span>
              <Edit className="ml-2 h-3.5 w-3.5 opacity-50" />
            </div>
          )}
          <span className="ml-1"> - Schema Builder</span>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => (window.location.href = "/")}
          >
            Back to Home
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClearAllTables}
          >
            Clear All Tables
          </Button>
          <Button
            variant="default"
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            onClick={() =>
              handleGenerateSchema(
                dbType,
                projectName,
                tables,
                setGenerating,
                showToast,
                setSchemaModalOpen,
                setGeneratedSchema
              )
            }
            disabled={generating}
          >
            {generating ? "Generating..." : "Generate Schema"}
          </Button>
        </div>
      </header>

      <div className="flex overflow-hidden flex-1">
        <Sidebar
          projectName={projectName}
          dbType={dbType}
          dbConnected={dbConnected}
          handleDbTypeChange={handleDbTypeChange}
          setDbConnected={setDbConnected}
          addTable={addTable}
          tables={tables}
          activeTableId={activeTableId}
          setActiveTableId={setActiveTableId}
          editingTableId={editingTableId}
          editTableName={editTableName}
          editInputRef={editInputRef}
          saveTableName={saveTableName}
          cancelEditingTableName={cancelEditingTableName}
          startEditingTableName={startEditingTableName}
          handleDeleteTable={handleDeleteTable}
          forceUpdate={forceUpdate}
          setEditTableName={setEditTableName} // Add this line
        />

        {/* Main content area */}
        <main className="flex-1 p-6 overflow-auto">
          {tables.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <h2 className="text-2xl font-bold mb-4">
                Start Building Your Schema
              </h2>
              <p className="text-muted-foreground mb-8 text-center max-w-md">
                Create tables, define fields, and establish relationships
                between them
              </p>
              <Button onClick={addTable} size="lg">
                <PlusCircle className="mr-2 h-5 w-5" /> Add Your First Table
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {activeTableId ? (
                // Use the TablePage component which has the field editor at the top and tabs at the bottom
                <TablePage
                  key={`table-page-${activeTableId}-${forceUpdate}`}
                  table={tables.find((t) => t.id === activeTableId)!}
                  allTables={tables}
                  onSave={handleSaveTable}
                />
              ) : (
                // Show table summaries
                tables.map((table) => (
                  <Card
                    key={`summary-${table.id}`}
                    className="p-6 cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setActiveTableId(table.id)}
                  >
                    <h3 className="text-xl font-medium mb-3">{table.name}</h3>
                    {table.fields.length > 0 ? (
                      <div className="border rounded-md overflow-hidden">
                        <div className="bg-muted/40 p-2 text-xs font-medium grid grid-cols-2">
                          <div>Field Name</div>
                          <div>Type</div>
                        </div>
                        <div className="divide-y">
                          {table.fields.slice(0, 3).map((field) => (
                            <div
                              key={field.id}
                              className="p-2 text-sm grid grid-cols-2"
                            >
                              <div>
                                {field.name} {field.isPrimary && "🔑"}
                              </div>
                              <div>{field.type}</div>
                            </div>
                          ))}
                          {table.fields.length > 3 && (
                            <div className="p-2 text-xs text-muted-foreground">
                              And {table.fields.length - 3} more fields...
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="border rounded-md p-4 text-sm text-muted-foreground">
                        No fields defined yet. Click to add fields to this
                        table.
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          )}
        </main>
      </div>

      {/* Schema Modal */}
      <SchemaModal 
        schema={generatedSchema}
        isOpen={schemaModalOpen}
        onClose={() => setSchemaModalOpen(false)}
      />
    </div>
  );
}