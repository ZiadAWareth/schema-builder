const fs = require("fs");
const path = require("path");
const Parser = require("tree-sitter");
const Python = require("tree-sitter-python");
const Java = require("tree-sitter-java");
const Cpp = require("tree-sitter-cpp");
const C = require("tree-sitter-c");
const Go = require("tree-sitter-go");
const esprima = require("esprima");
const babelParser = require("@babel/parser");

const LANGUAGES = {
  py: Python,
  java: Java,
  cpp: Cpp,
  c: C,
  go: Go,
};

const PARSERS = {};
for (const ext in LANGUAGES) {
  PARSERS[ext] = new Parser();
  PARSERS[ext].setLanguage(LANGUAGES[ext]);
}

// Add this function to your existing code
function parseReactFiles(filePath, code) {
  try {
    const ast = babelParser.parse(code, {
      sourceType: "module",
      plugins: [
        "jsx",
        "typescript",
        "classProperties",
        "decorators-legacy",
        "exportDefaultFrom",
        "exportNamespaceFrom",
        "objectRestSpread",
        "dynamicImport",
        "optionalChaining",
        "nullishCoalescingOperator",
      ],
    });

    const functions = [];
    const dependencies = [];
    const functionCalls = {};
    const functionDefinitions = {};
    let currentFunction = null;

    function addUniqueFunctionCall(parentFunction, calledFunction, location) {
      if (!functionCalls[parentFunction]) return;

      const exists = functionCalls[parentFunction].some(
        (call) =>
          call.name === calledFunction &&
          call.location.file === location.file &&
          (location.startLine === undefined ||
            call.location.startLine === location.startLine)
      );

      if (!exists) {
        functionCalls[parentFunction].push({ name: calledFunction, location });
      }
    }

    function traverse(node) {
      if (!node || typeof node !== "object") return;

      // Handle React Class Components
      if (node.type === "ClassDeclaration") {
        const functionName = node.id.name;
        const functionLocation = {
          file: filePath,
          startLine: node.loc?.start?.line,
          endLine: node.loc?.end?.line,
        };

        functions.push(functionName);
        functionDefinitions[functionName] = functionLocation;
        functionCalls[functionName] = [];
        currentFunction = functionName;
      }

      // Handle Function Components and Regular Functions
      if (node.type === "FunctionDeclaration" && node.id) {
        const functionName = node.id.name;
        const functionLocation = {
          file: filePath,
          startLine: node.loc?.start?.line,
          endLine: node.loc?.end?.line,
        };

        functions.push(functionName);
        functionDefinitions[functionName] = functionLocation;
        functionCalls[functionName] = [];
        currentFunction = functionName;
      }

      // Handle Arrow Functions and Variable Declarations
      if (node.type === "VariableDeclaration") {
        node.declarations.forEach((declaration) => {
          if (
            declaration.init &&
            ["ArrowFunctionExpression", "FunctionExpression"].includes(
              declaration.init.type
            )
          ) {
            if (declaration.id && declaration.id.name) {
              const functionName = declaration.id.name;
              const functionLocation = {
                file: filePath,
                startLine: declaration.loc?.start?.line,
                endLine: declaration.loc?.end?.line,
              };

              functions.push(functionName);
              functionDefinitions[functionName] = functionLocation;
              functionCalls[functionName] = [];
              currentFunction = functionName;
            }
          }
        });
      }

      // Handle Function Calls
      if (currentFunction && node.type === "CallExpression") {
        let functionName = null;

        if (node.callee.type === "MemberExpression") {
          functionName = node.callee.property.name;
        } else if (node.callee.type === "Identifier") {
          functionName = node.callee.name;
        }

        if (functionName) {
          const location = functionDefinitions[functionName] || {
            file: filePath,
          };
          addUniqueFunctionCall(currentFunction, functionName, location);
        }
      }

      // Handle Import statements
      if (node.type === "ImportDeclaration") {
        const importPath = node.source.value;
        if (!dependencies.includes(importPath)) {
          dependencies.push(importPath);
        }
      }

      // Traverse all keys of the node
      for (const key in node) {
        if (node[key] && typeof node[key] === "object") {
          if (Array.isArray(node[key])) {
            node[key].forEach((child) => traverse(child));
          } else {
            traverse(node[key]);
          }
        }
      }
    }

    traverse(ast.program);
    return { functions, dependencies, functionCalls };
  } catch (err) {
    console.error(`Error parsing React file ${filePath}:`, err.message);
    return { functions: [], dependencies: [], functionCalls: {} };
  }
}

// Then modify your parseCode function to use this new function:
function parseCode(filePath, code) {
  const ext = path.extname(filePath).substring(1);
  if (ext === "jsx" || ext === "tsx") {
    return parseReactFiles(filePath, code);
  } else if (ext === "js" || ext === "ts") {
    return parseJavaScript(filePath, code);
  } else if (PARSERS[ext]) {
    return parseTreeSitter(filePath, PARSERS[ext], code, ext);
  }
  return { functions: [], dependencies: [], functionCalls: {} };
}

function parseTreeSitter(filePath, parser, code, ext) {
  const tree = parser.parse(code);
  const functions = [];
  const dependencies = [];
  const functionCalls = {};
  // Track function definitions with their locations
  const functionDefinitions = {};

  function traverse(node, parentFunction = null) {
    // Handle imports/dependencies (unchanged)
    if (
      [
        "import_statement",
        "import_declaration",
        "package_declaration",
        "include_directive",
        "using_declaration",
      ].includes(node.type)
    ) {
      dependencies.push(code.slice(node.startIndex, node.endIndex).trim());
    }

    // Handle C++ function definitions
    if (ext === "cpp") {
      if (node.type === "function_definition") {
        let functionName = "";

        const declarator = node.children.find(
          (child) =>
            child.type === "function_declarator" ||
            child.type === "declaration" ||
            child.type === "field_declaration"
        );

        if (declarator) {
          const qualIdentifier = findNodeByType(
            declarator,
            "qualified_identifier"
          );
          if (qualIdentifier) {
            const lastIdentifier = findLastNodeByType(
              qualIdentifier,
              "identifier"
            );
            if (lastIdentifier) {
              functionName = lastIdentifier.text;
            }
          } else {
            const identifier = findNodeByType(declarator, "identifier");
            if (identifier) {
              functionName = identifier.text;
            }
          }
        }

        if (functionName) {
          // Store function location information
          const functionLocation = {
            file: filePath,
            startLine: node.startPosition.row,
            endLine: node.endPosition.row,
          };
          functions.push(functionName);
          functionDefinitions[functionName] = functionLocation;
          functionCalls[functionName] = [];

          const compoundStatement = node.children.find(
            (child) => child.type === "compound_statement"
          );
          if (compoundStatement) {
            traverseNode(compoundStatement, functionName);
          }
        }
      }

      // Handle C++ function calls
      if (parentFunction) {
        if (node.type === "call_expression") {
          let calledFunction = "";

          if (
            node.children.length > 0 &&
            node.children[0].type === "field_expression"
          ) {
            const fieldExpr = node.children[0];
            if (fieldExpr.children.length >= 2) {
              const methodName =
                fieldExpr.children[fieldExpr.children.length - 1];
              if (methodName && methodName.type === "identifier") {
                calledFunction = methodName.text;
              }
            }
          } else if (
            node.children.length > 0 &&
            node.children[0].type === "arrow_expression"
          ) {
            const arrowExpr = node.children[0];
            if (arrowExpr.children.length >= 2) {
              const methodName =
                arrowExpr.children[arrowExpr.children.length - 1];
              if (methodName && methodName.type === "identifier") {
                calledFunction = methodName.text;
              }
            }
          } else if (
            node.children.length > 0 &&
            node.children[0].type === "identifier"
          ) {
            calledFunction = node.children[0].text;
          }

          if (calledFunction && functionCalls[parentFunction]) {
            // Use function definition location if available, otherwise use filePath
            const location = functionDefinitions[calledFunction] || {
              file: filePath,
            };
            addUniqueFunctionCall(parentFunction, calledFunction, location);
          }
        }
      }
    }
    // Handle Java methods
    else if (ext === "java" && node.type === "method_declaration") {
      let functionName = findNodeByType(node, "identifier")?.text;
      if (functionName) {
        // Store function location information
        const functionLocation = {
          file: filePath,
          startLine: node.startPosition.row,
          endLine: node.endPosition.row,
        };
        functions.push(functionName);
        functionDefinitions[functionName] = functionLocation;
        functionCalls[functionName] = [];
        node.children.forEach((child) => traverse(child, functionName));
      }
    }
    // Handle Python functions
    else if (ext === "py" && node.type === "function_definition") {
      let functionName = findNodeByType(node, "identifier")?.text;
      if (functionName) {
        // Store function location information
        const functionLocation = {
          file: filePath,
          startLine: node.startPosition.row,
          endLine: node.endPosition.row,
        };
        functions.push(functionName);
        functionDefinitions[functionName] = functionLocation;
        functionCalls[functionName] = [];
        node.children.forEach((child) => traverse(child, functionName));
      }
    }

    // Handle function calls
    if (parentFunction) {
      // Java method calls
      if (ext === "java" && node.type === "method_invocation") {
        const identifier = findNodeByType(node, "identifier");
        if (identifier) {
          // Use function definition location if available, otherwise use filePath
          const calledFunction = identifier.text;
          const location = functionDefinitions[calledFunction] || {
            file: filePath,
          };
          addUniqueFunctionCall(parentFunction, calledFunction, location);
        }
      }
      // Python function calls
      else if (ext === "py" && node.type === "call") {
        let calledFunction = "";

        if (node.children.length > 0 && node.children[0].type === "attribute") {
          const attrIdentifier = findNodeByType(
            node.children[0],
            "identifier",
            (n) => n.parent.type === "attribute"
          );
          if (attrIdentifier) {
            calledFunction = attrIdentifier.text;
          }
        } else if (
          node.children.length > 0 &&
          node.children[0].type === "identifier"
        ) {
          calledFunction = node.children[0].text;
        }

        if (calledFunction && functionCalls[parentFunction]) {
          // Use function definition location if available, otherwise use filePath
          const location = functionDefinitions[calledFunction] || {
            file: filePath,
          };
          addUniqueFunctionCall(parentFunction, calledFunction, location);
        }
      }
    }

    node.children.forEach((child) => traverse(child, parentFunction));
  }

  // Updated function to use location object instead of just path string
  function addUniqueFunctionCall(parentFunction, calledFunction, location) {
    if (!functionCalls[parentFunction]) return;

    // Check if this function call already exists in the array
    const exists = functionCalls[parentFunction].some(
      (call) =>
        call.name === calledFunction &&
        call.location.file === location.file &&
        (location.startLine === undefined ||
          call.location.startLine === location.startLine)
    );

    // Only add if it doesn't already exist
    if (!exists) {
      functionCalls[parentFunction].push({ name: calledFunction, location });
    }
  }

  // Helper functions (unchanged)
  function findNodeByType(startNode, type, predicate = null) {
    if (!startNode) return null;
    if (startNode.type === type && (!predicate || predicate(startNode))) {
      return startNode;
    }
    for (const child of startNode.children) {
      const found = findNodeByType(child, type, predicate);
      if (found) return found;
    }
    return null;
  }

  function findLastNodeByType(startNode, type) {
    let result = null;

    function search(node) {
      if (node.type === type) {
        result = node;
      }
      node.children.forEach(search);
    }

    search(startNode);
    return result;
  }

  function traverseNode(node, parentFunc) {
    if (!node) return;
    traverse(node, parentFunc);
  }

  traverse(tree.rootNode);
  return { functions, dependencies, functionCalls };
}

// Update JavaScript parsing too
function parseJavaScript(filePath, code) {
  try {
    const ast = esprima.parseModule(code, { sourceType: "module" });
    const functions = [];
    const dependencies = [];
    const functionCalls = {};
    const functionDefinitions = {};
    let currentFunction = null;

    function addUniqueFunctionCall(parentFunction, calledFunction, location) {
      if (!functionCalls[parentFunction]) return;

      // Check if this function call already exists in the array
      const exists = functionCalls[parentFunction].some(
        (call) =>
          call.name === calledFunction &&
          call.location.file === location.file &&
          (location.startLine === undefined ||
            call.location.startLine === location.startLine)
      );

      // Only add if it doesn't already exist
      if (!exists) {
        functionCalls[parentFunction].push({ name: calledFunction, location });
      }
    }

    function traverse(node) {
      if (node.type === "FunctionDeclaration" && node.id) {
        const functionName = node.id.name;
        const functionLocation = {
          file: filePath,
          startLine: node.loc.start.line,
          endLine: node.loc.end.line,
        };

        functions.push(functionName);
        functionDefinitions[functionName] = functionLocation;
        functionCalls[functionName] = [];
        currentFunction = functionName;
      } else if (node.type === "VariableDeclaration") {
        node.declarations.forEach((declaration) => {
          if (
            declaration.init &&
            ["ArrowFunctionExpression", "FunctionExpression"].includes(
              declaration.init.type
            )
          ) {
            const functionName = declaration.id.name;
            const functionLocation = {
              file: filePath,
              startLine: declaration.loc.start.line,
              endLine: declaration.loc.end.line,
            };

            functions.push(functionName);
            functionDefinitions[functionName] = functionLocation;
            functionCalls[functionName] = [];
            currentFunction = functionName;
          }
        });
      } else if (
        (node.type === "CallExpression" || node.type === "AwaitExpression") &&
        currentFunction
      ) {
        let functionName = null;
        if (node.type === "CallExpression") {
          functionName =
            node.callee.type === "MemberExpression"
              ? node.callee.property.name
              : node.callee.name;
        } else {
          functionName =
            node.argument.callee.type === "MemberExpression"
              ? node.argument.callee.property.name
              : node.argument.callee.name;
        }
        if (functionName) {
          // Use function definition location if available, otherwise use filePath
          const location = functionDefinitions[functionName] || {
            file: filePath,
          };
          addUniqueFunctionCall(currentFunction, functionName, location);
        }
      } else if (node.type === "ImportDeclaration") {
        dependencies.push(node.source.value);
      }

      for (const key in node) {
        if (node[key] && typeof node[key] === "object" && key !== "loc") {
          traverse(node[key]);
        }
      }
    }

    ast.body.forEach(traverse);
    return { functions, dependencies, functionCalls };
  } catch (err) {
    return { functions: [], dependencies: [], functionCalls: {} };
  }
}

function parseJavaScript(filePath, code) {
  try {
    const ast = esprima.parseModule(code, { sourceType: "module" });
    const functions = [];
    const dependencies = [];
    const functionCalls = {};
    let currentFunction = null;

    // Helper function to add function calls only if they don't already exist
    function addUniqueFunctionCall(parentFunction, calledFunction, location) {
      if (!functionCalls[parentFunction]) return;

      // Check if this function call already exists in the array
      const exists = functionCalls[parentFunction].some(
        (call) => call.name === calledFunction && call.location === location
      );

      // Only add if it doesn't already exist
      if (!exists) {
        functionCalls[parentFunction].push({ name: calledFunction, location });
      }
    }

    function traverse(node) {
      if (node.type === "FunctionDeclaration" && node.id) {
        functions.push(node.id.name);
        functionCalls[node.id.name] = [];
        currentFunction = node.id.name;
      } else if (node.type === "VariableDeclaration") {
        node.declarations.forEach((declaration) => {
          if (
            declaration.init &&
            ["ArrowFunctionExpression", "FunctionExpression"].includes(
              declaration.init.type
            )
          ) {
            functions.push(declaration.id.name);
            functionCalls[declaration.id.name] = [];
            currentFunction = declaration.id.name;
          }
        });
      } else if (
        (node.type === "CallExpression" || node.type === "AwaitExpression") &&
        currentFunction
      ) {
        let functionName = null;
        if (node.type === "CallExpression") {
          functionName =
            node.callee.type === "MemberExpression"
              ? node.callee.property.name
              : node.callee.name;
        } else {
          functionName =
            node.argument.callee.type === "MemberExpression"
              ? node.argument.callee.property.name
              : node.argument.callee.name;
        }
        if (functionName) {
          addUniqueFunctionCall(currentFunction, functionName, filePath);
        }
      } else if (node.type === "ImportDeclaration") {
        dependencies.push(node.source.value);
      }

      for (const key in node) {
        if (node[key] && typeof node[key] === "object" && key !== "loc") {
          traverse(node[key]);
        }
      }
    }

    ast.body.forEach(traverse);
    return { functions, dependencies, functionCalls };
  } catch (err) {
    return { functions: [], dependencies: [], functionCalls: {} };
  }
}

function scanFolder(directory) {
  const structure = {};

  function scan(dir) {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    structure[dir] = { files: {}, subfolders: [] };

    items.forEach((item) => {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        structure[dir].subfolders.push(item.name);
        scan(fullPath);
      } else {
        const ext = path.extname(item.name).substring(1);
        if (
          ["py", "js", "ts", "java", "cpp", "c", "go", "jsx", "tsx"].includes(
            ext
          )
        ) {
          const code = fs.readFileSync(fullPath, "utf-8");
          structure[dir].files[item.name] = parseCode(fullPath, code);
        }
      }
    });
  }

  scan(directory);
  return structure;
}

const rootFolder = "/Users/helshamy/Documents/Dev/caudex/schema-builder/src";
const projectStructure = scanFolder(rootFolder);
console.log(JSON.stringify(projectStructure, null, 2));
fs.writeFileSync("output.json", JSON.stringify(projectStructure, null, 2));
