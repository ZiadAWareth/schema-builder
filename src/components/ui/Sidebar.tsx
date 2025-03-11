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
import { Table } from "@/types/Table";
import { handleConnectToDB } from "@/services/db-connection/connectDB";
interface SidebarProps {
  projectName: string;
  dbType: string;
  dbConnected: boolean;
  tables: Table[];
  activeTableId: string | null;
  forceUpdate: number;
  editingTableId: string | null;
  editTableName: string;
  editInputRef: React.RefObject<HTMLInputElement>;
  setEditTableName: (name: string) => void;
  handleDbTypeChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  setDbConnected: (connected: boolean) => void;
  addTable: () => void;
  startEditingTableName: (tableId: string, name: string) => void;
  saveTableName: () => void;
  cancelEditingTableName: () => void;
  handleDeleteTable: (tableId: string) => void;
  setActiveTableId: (tableId: string | null) => void;
  handleConnectToDB: (dbType: string) => Promise<boolean>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  projectName,
  dbType,
  dbConnected,
  tables,
  activeTableId,
  forceUpdate,
  editingTableId,
  editTableName,
  editInputRef,
  handleDbTypeChange,
  setDbConnected,
  addTable,
  startEditingTableName,
  saveTableName,
  cancelEditingTableName,
  handleDeleteTable,
  setEditTableName,
}) => {
  return (
    <aside className="w-64 bg-muted/40 border-r p-4 flex flex-col h-full">
      {/* Project info */}
      <div className="mb-6">
        <h2 className="font-bold text-lg truncate">{projectName}</h2>
        <div className="flex items-center text-sm text-muted-foreground space-x-2">
          <Database className="h-4 w-4" />
          <select
            value={dbType}
            onChange={handleDbTypeChange}
            className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-700 hover:bg-gray-50 transition duration-150 ease-in-out"
          >
            <option value="postgresql" className="text-gray-700">
              PostgreSQL
            </option>
            <option value="mysql" className="text-gray-700">
              MySQL
            </option>
            <option value="mongodb" className="text-gray-700">
              MongoDB
            </option>
          </select>

          <span
            className={`h-2 w-2 rounded-full ${
              dbConnected ? "bg-green-500" : "bg-amber-500"
            }`}
          ></span>
        </div>
      </div>

      {/* Database connection button */}
      <div className="mb-4">
        <Button
          variant={dbConnected ? "outline" : "default"}
          size="sm"
          className="w-full"
          onClick={async () => {
            if (!dbConnected) {
              const prismaSchema = localStorage.getItem("prismaSchema") || "";
              const success = await handleConnectToDB(
                dbType,
                projectName,
                prismaSchema
              );
              setDbConnected(success);
            } else {
              setDbConnected(false);
            }
          }}
        >
          {dbConnected ? "Connected" : "Connect to DB"}
        </Button>
      </div>

      {/* Tables list - Key for re-render when tables change */}
      <div className="mb-4" key={`tables-list-${forceUpdate}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-sm">Tables</h3>
          <Button variant="ghost" size="icon" onClick={addTable}>
            <PlusCircle className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-1">
          {tables.map((table) => (
            <div
              key={`table-item-${table.id}-${forceUpdate}`}
              className={`flex items-center px-2 py-1 text-sm rounded-md hover:bg-muted cursor-pointer group ${
                activeTableId === table.id ? "bg-muted" : ""
              }`}
            >
              {editingTableId === table.id ? (
                // Editing state
                <div className="flex items-center space-x-1 w-full">
                  <Input
                    ref={editInputRef}
                    value={editTableName}
                    onChange={(e) => setEditTableName(e.target.value)}
                    className="h-7 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        saveTableName();
                      } else if (e.key === "Escape") {
                        cancelEditingTableName();
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={saveTableName}
                    className="h-6 w-6"
                  >
                    <Save className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={cancelEditingTableName}
                    className="h-6 w-6"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                // Display state
                <>
                  <div
                    className="flex-1 flex items-center space-x-2"
                    onClick={() => setActiveTableId(table.id)}
                  >
                    <Table2 className="h-4 w-4" />
                    <span>{table.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {table.fields.length}{" "}
                      {table.fields.length === 1 ? "field" : "fields"}
                    </span>
                  </div>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditingTableName(table.id, table.name);
                      }}
                      className="hover:text-blue-500"
                      title="Edit table name"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTable(table.id);
                      }}
                      className="hover:text-destructive"
                      title="Delete table"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          {tables.length === 0 && (
            <p className="text-xs text-muted-foreground px-2 py-1">
              No tables yet. Click + to add a table.
            </p>
          )}
        </div>
      </div>

      {/* Project summary */}
      <div className="mt-auto">
        <h3 className="font-medium text-sm mb-2">Project Summary</h3>
        <Card className="p-3 bg-muted">
          <div className="text-xs text-muted-foreground">
            <p className="mb-1">Tables: {tables.length}</p>
            <p className="mb-1">
              Fields:{" "}
              {tables.reduce((sum, table) => sum + table.fields.length, 0)}
            </p>
            <p>Database: {dbType}</p>
          </div>
        </Card>
      </div>
    </aside>
  );
};
