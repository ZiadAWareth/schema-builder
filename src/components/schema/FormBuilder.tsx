"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormIcon, Info, Columns, Rows, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Field } from "@/types/Field";
import { Table } from "@/types/Table";
// // Field interface
// interface Field {
//   id: string;
//   name: string;
//   type: string;
//   isPrimary: boolean;
//   isRequired: boolean;
//   isUnique: boolean;
//   enumValues?: string[];
// }

// // Table interface
// interface Table {
//   id: string;
//   name: string;
//   fields: Field[];
// }

interface FormBuilderProps {
  table: Table;
}

export function FormBuilder({ table }: FormBuilderProps) {
  const [formLayout, setFormLayout] = useState<"1-column" | "2-columns">(
    "1-column"
  );

  // Map field types to form input types
  const getInputType = (field: Field): string => {
    switch (field.type.toLowerCase()) {
      case "string":
        return "text";
      case "int":
      case "float":
        return "number";
      case "boolean":
        return "checkbox";
      case "datetime":
        return "datetime-local";
      case "email":
        return "email";
      case "text":
        return "textarea";
      case "enum":
        return "select";
      default:
        return "text";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center">
          <FormIcon className="mr-2 h-5 w-5" /> Form Builder
        </h3>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant={formLayout === "1-column" ? "default" : "outline"}
            onClick={() => setFormLayout("1-column")}
            className="flex items-center"
          >
            <Rows className="mr-2 h-4 w-4" />1 Column
          </Button>
          <Button
            size="sm"
            variant={formLayout === "2-columns" ? "default" : "outline"}
            onClick={() => setFormLayout("2-columns")}
            className="flex items-center"
          >
            <Columns className="mr-2 h-4 w-4" />2 Columns
          </Button>
        </div>
      </div>

      <Tabs defaultValue="preview">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="preview" className="flex-1">
            Form Preview
          </TabsTrigger>
          <TabsTrigger value="code" className="flex-1">
            Generated Code
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex-1">
            Form Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preview">
          <Card className="p-6 border-2">
            <h2 className="text-xl font-bold mb-6">{table.name} Form</h2>

            <div
              className={`grid ${
                formLayout === "2-columns" ? "grid-cols-2" : "grid-cols-1"
              } gap-4`}
            >
              {table.fields
                // Filter out non-form fields like id, createdAt, updatedAt
                .filter(
                  (field) =>
                    !["id", "createdAt", "updatedAt"].includes(field.name)
                )
                .map((field) => (
                  <div key={field.id} className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      {field.name}
                      {field.isRequired && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>

                    {getInputType(field) === "textarea" ? (
                      <textarea
                        className="w-full p-2 border rounded-md"
                        placeholder={`Enter ${field.name}`}
                      />
                    ) : getInputType(field) === "select" ? (
                      <select className="w-full p-2 border rounded-md">
                        <option value="">Select {field.name}</option>
                        {field.enumValues?.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    ) : getInputType(field) === "checkbox" ? (
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                      />
                    ) : (
                      <input
                        type={getInputType(field)}
                        className="w-full p-2 border rounded-md"
                        placeholder={`Enter ${field.name}`}
                      />
                    )}
                  </div>
                ))}
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <Button variant="outline">Cancel</Button>
              <Button>Submit</Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="code">
          <Card className="bg-zinc-950 text-zinc-50 font-mono text-sm p-4 rounded-md overflow-x-auto h-72">
            <pre className="whitespace-pre">{`// This is a placeholder for generated form code
// In a complete implementation, this would generate React component code
// based on your form configuration

import React from 'react';
import { useForm } from 'react-hook-form';

export function ${table.name.replace(/\s+/g, "")}Form() {
  const { register, handleSubmit, formState } = useForm();
  const { errors } = formState;
  
  const onSubmit = (data) => {
    console.log(data);
    // Submit to API endpoint
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields would be generated here */}
      <button type="submit">Submit</button>
    </form>
  );
}`}</pre>
          </Card>

          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
            <p className="text-blue-700">
              This is a simple preview. The actual implementation would generate
              a complete, working form component with validation and API
              integration.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="p-6">
            <h4 className="text-lg font-medium mb-4 flex items-center">
              <Settings className="mr-2 h-5 w-5" /> Form Settings
            </h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Form Title
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter form title"
                  defaultValue={`${table.name} Form`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Form Description
                </label>
                <textarea
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter a description for this form"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Submit Button Text
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  defaultValue="Submit"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Cancel Button Text
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  defaultValue="Cancel"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    defaultChecked
                  />
                  <span>Enable form validation</span>
                </label>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    defaultChecked
                  />
                  <span>Show required field indicators</span>
                </label>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    defaultChecked
                  />
                  <span>Enable API submission</span>
                </label>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded border-gray-300" />
                  <span>Show success message after submission</span>
                </label>
              </div>
            </div>

            <div className="mt-6 text-right">
              <Button>Save Settings</Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm hidden">
        <p className="text-blue-700 mb-2 font-medium">✨ Form Builder</p>
        <p className="text-blue-600">
          This form builder automatically generates forms based on your schema.
          You can customize the layout, validation, and appearance of the form.
        </p>
      </div>
    </div>
  );
}
