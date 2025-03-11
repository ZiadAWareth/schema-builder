// 1. Import necessary components
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// 2. Define the new project page component
export default function NewProject() {
  // 3. Set up state for form values
  const [projectName, setProjectName] = useState("");
  const [dbType, setDbType] = useState("postgresql");
  const router = useRouter();

  // 4. Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Here we would typically save the project details to state/localStorage/backend
    // For now, we'll just redirect to the schema editor page
    router.push(`/project/editor?name=${encodeURIComponent(projectName)}&db=${dbType}`);
  };

  // 5. Render the form
  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center py-10">
      <Card className="w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-2xl">Create New Project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 6. Project name input */}
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                placeholder="My Awesome Project"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
              />
            </div>
            
            {/* 7. Database type selection */}
            <div className="space-y-2">
              <Label>Database Type</Label>
              <RadioGroup value={dbType} onValueChange={setDbType} className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="postgresql" id="postgresql" />
                  <Label htmlFor="postgresql" className="cursor-pointer">PostgreSQL</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mongodb" id="mongodb" />
                  <Label htmlFor="mongodb" className="cursor-pointer">MongoDB</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={!projectName.trim()}>
              Create Project
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}