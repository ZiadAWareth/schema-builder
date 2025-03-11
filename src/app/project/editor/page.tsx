"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
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
import { TableCreator } from "@/components/schema/TableCreator";
import { TableTabs } from "@/components/schema/TableTabs";
import { Table } from "@/types/Table";
import { Sidebar } from "@/components/ui/Sidebar"; // Import the Sidebar component

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

  // State for inline table name editing
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [editTableName, setEditTableName] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

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
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        projectName={projectName}
        dbType={dbType}
        dbConnected={dbConnected}
        handleDbTypeChange={(event) => setDbType(event.target.value)}
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
      />

      {/* Main content area */}
      <main className="flex-1 p-6 overflow-auto">
        {tables.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold mb-4">
              Start Building Your Schema
            </h2>
            <p className="text-muted-foreground mb-8 text-center max-w-md">
              Create tables, define fields, and establish relationships between
              them
            </p>
            <Button onClick={addTable} size="lg">
              <PlusCircle className="mr-2 h-5 w-5" /> Add Your First Table
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {activeTableId ? (
              // Show the TableTabs component for the active table
              <TableTabs
                key={`table-tabs-${activeTableId}-${forceUpdate}`}
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
                      No fields defined yet. Click to add fields to this table.
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
