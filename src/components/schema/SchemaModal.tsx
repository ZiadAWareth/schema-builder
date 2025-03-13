// components/SchemaModal.tsx
import React from "react";
import { XIcon } from "lucide-react";

interface SchemaModalProps {
  schema: string;
  isOpen: boolean;
  onClose: () => void;
}

export const SchemaModal: React.FC<SchemaModalProps> = ({
  schema,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-4xl max-h-[80vh] bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Generated Prisma Schema</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
            aria-label="Close"
          >
            <XIcon size={24} />
          </button>
        </div>

        <div className="overflow-auto max-h-[calc(80vh-80px)] bg-gray-100 p-4 rounded">
          <pre className="text-sm font-mono whitespace-pre-wrap">{schema}</pre>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// export default SchemaModal;
