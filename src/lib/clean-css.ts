/**
 * Clean CSS to keep only color-related rules, declarations, and variables
 */

import * as csstree from "css-tree";

// ============================================================================
// Types
// ============================================================================

export interface CleanCssOptions {
  /** Keep declarations when uncertain (default: true) */
  lenient?: boolean;
  /** Additional shorthand properties to include (default: empty) */
  includeShorthands?: string[];
  /** Preserve CSS comments in output (default: false) */
  preserveComments?: boolean;
  /** Maximum depth for var() resolution (default: 15) */
  maxVarDepth?: number;
}

interface VariableInfo {
  valueAst: csstree.CssNode;
  declaringRule: csstree.Rule | csstree.Atrule | null;
  isColorVariable: boolean;
}

interface FilterContext {
  variables: Map<string, VariableInfo>;
  keptDeclarations: Set<csstree.Declaration>;
  keptVariables: Set<string>;
  visitedVars: Set<string>;
  options: Required<CleanCssOptions>;
}

// ============================================================================
// CSS Color Keywords (W3C Specification)
// ============================================================================

const CSS_COLOR_KEYWORDS = new Set([
  // Basic colors
  "black",
  "silver",
  "gray",
  "white",
  "maroon",
  "red",
  "purple",
  "fuchsia",
  "green",
  "lime",
  "olive",
  "yellow",
  "navy",
  "blue",
  "teal",
  "aqua",
  // Extended colors
  "aliceblue",
  "antiquewhite",
  "aquamarine",
  "azure",
  "beige",
  "bisque",
  "blanchedalmond",
  "blueviolet",
  "brown",
  "burlywood",
  "cadetblue",
  "chartreuse",
  "chocolate",
  "coral",
  "cornflowerblue",
  "cornsilk",
  "crimson",
  "cyan",
  "darkblue",
  "darkcyan",
  "darkgoldenrod",
  "darkgray",
  "darkgrey",
  "darkgreen",
  "darkkhaki",
  "darkmagenta",
  "darkolivegreen",
  "darkorange",
  "darkorchid",
  "darkred",
  "darksalmon",
  "darkseagreen",
  "darkslateblue",
  "darkslategray",
  "darkslategrey",
  "darkturquoise",
  "darkviolet",
  "deeppink",
  "deepskyblue",
  "dimgray",
  "dimgrey",
  "dodgerblue",
  "firebrick",
  "floralwhite",
  "forestgreen",
  "gainsboro",
  "ghostwhite",
  "gold",
  "goldenrod",
  "greenyellow",
  "grey",
  "honeydew",
  "hotpink",
  "indianred",
  "indigo",
  "ivory",
  "khaki",
  "lavender",
  "lavenderblush",
  "lawngreen",
  "lemonchiffon",
  "lightblue",
  "lightcoral",
  "lightcyan",
  "lightgoldenrodyellow",
  "lightgray",
  "lightgrey",
  "lightgreen",
  "lightpink",
  "lightsalmon",
  "lightseagreen",
  "lightskyblue",
  "lightslategray",
  "lightslategrey",
  "lightsteelblue",
  "lightyellow",
  "limegreen",
  "linen",
  "magenta",
  "mediumaquamarine",
  "mediumblue",
  "mediumorchid",
  "mediumpurple",
  "mediumseagreen",
  "mediumslateblue",
  "mediumspringgreen",
  "mediumturquoise",
  "mediumvioletred",
  "midnightblue",
  "mintcream",
  "mistyrose",
  "moccasin",
  "navajowhite",
  "oldlace",
  "olivedrab",
  "orange",
  "orangered",
  "orchid",
  "palegoldenrod",
  "palegreen",
  "paleturquoise",
  "palevioletred",
  "papayawhip",
  "peachpuff",
  "peru",
  "pink",
  "plum",
  "powderblue",
  "rebeccapurple",
  "rosybrown",
  "royalblue",
  "saddlebrown",
  "salmon",
  "sandybrown",
  "seagreen",
  "seashell",
  "sienna",
  "skyblue",
  "slateblue",
  "slategray",
  "slategrey",
  "snow",
  "springgreen",
  "steelblue",
  "tan",
  "thistle",
  "tomato",
  "turquoise",
  "violet",
  "wheat",
  "whitesmoke",
  "yellowgreen",
  // Special keywords
  "transparent",
  "currentcolor",
  // CSS-wide keywords (lenient mode)
  "inherit",
  "initial",
  "unset",
  "revert",
  "revert-layer",
]);

// ============================================================================
// Color-bearing property names
// ============================================================================

const COLOR_PROPERTY_KEYWORDS = new Set([
  "color",
  "background",
  "background-color",
  "border",
  "border-top",
  "border-right",
  "border-bottom",
  "border-left",
  "border-color",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "border-block",
  "border-block-start",
  "border-block-end",
  "border-inline",
  "border-inline-start",
  "border-inline-end",
  "box-shadow",
  "outline",
  "outline-color",
  "text-decoration",
  "text-decoration-color",
  "text-shadow",
  "column-rule",
  "column-rule-color",
  "fill",
  "stroke",
  "caret-color",
  "text-emphasis-color",
  "scrollbar-color",
  "-webkit-text-fill-color",
  "-webkit-text-stroke-color",
  "-moz-text-fill-color",
  "-moz-text-stroke-color",
]);

// Color function names
const COLOR_FUNCTIONS = new Set([
  "rgb",
  "rgba",
  "hsl",
  "hsla",
  "lab",
  "lch",
  "oklab",
  "oklch",
  "hwb",
  "color",
  "color-mix",
  "color-contrast",
]);

// ============================================================================
// Helper: Detect color tokens in value AST
// ============================================================================

/**
 * Check if a css-tree value AST contains color tokens
 */
function hasColorInValueAst(valueAst: csstree.CssNode): boolean {
  let hasColor = false;

  csstree.walk(valueAst, {
    visit: "Hash",
    enter() {
      hasColor = true;
    },
  });

  if (hasColor) return true;

  csstree.walk(valueAst, {
    visit: "Function",
    enter(node: csstree.CssNode) {
      if (node.type === "Function") {
        if (COLOR_FUNCTIONS.has(node.name.toLowerCase())) {
          hasColor = true;
        }
      }
    },
  });

  if (hasColor) return true;

  csstree.walk(valueAst, {
    visit: "Identifier",
    enter(node: csstree.CssNode) {
      if (node.type === "Identifier") {
        const lower = node.name.toLowerCase();
        if (CSS_COLOR_KEYWORDS.has(lower)) {
          hasColor = true;
        }
      }
    },
  });

  return hasColor;
}

/**
 * Check if a value AST contains var() function calls
 */
function hasVarFunction(valueAst: csstree.CssNode): boolean {
  let hasVar = false;

  csstree.walk(valueAst, {
    visit: "Function",
    enter(node: csstree.CssNode) {
      if (node.type === "Function" && node.name.toLowerCase() === "var") {
        hasVar = true;
      }
    },
  });

  return hasVar;
}

/**
 * Extract var() references from a value AST
 * Returns array of {varName, fallbackAst?}
 */
function extractVarReferences(
  valueAst: csstree.CssNode,
): Array<{ varName: string; fallbackAst?: csstree.CssNode }> {
  const refs: Array<{ varName: string; fallbackAst?: csstree.CssNode }> = [];

  csstree.walk(valueAst, {
    visit: "Function",
    enter(node: csstree.CssNode) {
      if (node.type !== "Function" || node.name.toLowerCase() !== "var") {
        return;
      }

      // Parse var() arguments: var(--name) or var(--name, fallback)
      const args = node.children.toArray();
      if (args.length === 0) return;

      // First arg should be the variable name (Identifier starting with --)
      const firstArg = args[0];
      let varName = "";

      if (firstArg.type === "Identifier") {
        varName = firstArg.name;
      } else {
        // Try to extract from generated string
        varName = csstree.generate(firstArg).trim();
      }

      if (!varName.startsWith("--")) return;

      // Check if there's a fallback (after comma)
      let fallbackAst: csstree.CssNode | undefined;
      let foundComma = false;

      for (let i = 1; i < args.length; i++) {
        const arg = args[i];
        if (arg.type === "Operator" && arg.value === ",") {
          foundComma = true;
        } else if (foundComma) {
          // Everything after comma is the fallback
          // Create a Value node containing remaining args
          if (!fallbackAst) {
            fallbackAst = {
              type: "Value",
              children: new csstree.List<csstree.CssNode>(),
            } as csstree.Value;
          }
          if (fallbackAst.type === "Value") {
            fallbackAst.children.appendData(arg);
          }
        }
      }

      refs.push({ varName, fallbackAst });
    },
  });

  return refs;
}

// ============================================================================
// Step 1: Collect custom properties
// ============================================================================

function collectVariables(ast: csstree.CssNode): Map<string, VariableInfo> {
  const variables = new Map<string, VariableInfo>();

  csstree.walk(ast, {
    visit: "Declaration",
    enter(node: csstree.CssNode, item: csstree.ListItem<csstree.CssNode>) {
      if (node.type !== "Declaration" || !node.property.startsWith("--")) {
        return;
      }

      // Find the declaring rule by walking up the tree
      let declaringRule: csstree.Rule | csstree.Atrule | null = null;
      let current = item;

      while (current && current.prev) {
        current = current.prev;
      }

      // Get parent context - css-tree doesn't expose parent directly in walk
      // We'll collect variables in a second pass with full context

      const valueAst = node.value;
      const isColorVariable = hasColorInValueAst(valueAst);

      variables.set(node.property, {
        valueAst,
        declaringRule,
        isColorVariable,
      });
    },
  });

  return variables;
}

// ============================================================================
// Step 2: Resolve var() with cycle detection
// ============================================================================

function isVariableColorBearing(
  varName: string,
  ctx: FilterContext,
  depth = 0,
): boolean {
  // Prevent infinite recursion
  if (depth > ctx.options.maxVarDepth) {
    return ctx.options.lenient; // Keep if lenient
  }

  // Prevent cycles
  if (ctx.visitedVars.has(varName)) {
    return ctx.options.lenient; // Keep cycles if lenient
  }

  // Check if variable exists
  const varInfo = ctx.variables.get(varName);
  if (!varInfo) {
    // Undefined variable - might be defined elsewhere, keep if lenient
    return ctx.options.lenient;
  }

  // If already determined to be a color variable, return true
  if (varInfo.isColorVariable) {
    return true;
  }

  // Mark as visiting to detect cycles
  ctx.visitedVars.add(varName);

  // Check if value contains var() references
  if (!hasVarFunction(varInfo.valueAst)) {
    // No var() references, check if it contains colors directly
    const result = hasColorInValueAst(varInfo.valueAst);
    ctx.visitedVars.delete(varName);
    return result;
  }

  // Resolve var() references recursively
  const varRefs = extractVarReferences(varInfo.valueAst);
  for (const ref of varRefs) {
    // Check if referenced variable is color-bearing
    const refIsColor = isVariableColorBearing(ref.varName, ctx, depth + 1);

    if (refIsColor) {
      ctx.visitedVars.delete(varName);
      return true;
    }

    // Check fallback if referenced var is undefined
    if (!ctx.variables.has(ref.varName) && ref.fallbackAst) {
      // Fallback exists and referenced var is undefined
      const fallbackHasColor = hasColorInValueAst(ref.fallbackAst);
      if (fallbackHasColor) {
        ctx.visitedVars.delete(varName);
        return true;
      }

      // Check if fallback contains var() to undefined variables
      if (hasVarFunction(ref.fallbackAst)) {
        const fallbackVarRefs = extractVarReferences(ref.fallbackAst);
        for (const fallbackRef of fallbackVarRefs) {
          if (!ctx.variables.has(fallbackRef.varName)) {
            // Undefined var in fallback - might be color
            ctx.visitedVars.delete(varName);
            return ctx.options.lenient;
          }
          const fallbackRefIsColor = isVariableColorBearing(
            fallbackRef.varName,
            ctx,
            depth + 1,
          );
          if (fallbackRefIsColor) {
            ctx.visitedVars.delete(varName);
            return true;
          }
        }
      }
    }
  }

  ctx.visitedVars.delete(varName);
  return false;
}

// ============================================================================
// Step 3: Check if declaration is color-bearing
// ============================================================================

function isDeclarationColorBearing(
  decl: csstree.Declaration,
  ctx: FilterContext,
): boolean {
  const prop = decl.property.toLowerCase();

  // Check if property name indicates color
  if (
    prop.includes("color") ||
    COLOR_PROPERTY_KEYWORDS.has(prop) ||
    ctx.options.includeShorthands.includes(prop)
  ) {
    return true;
  }

  // Check if value contains color tokens
  if (hasColorInValueAst(decl.value)) {
    return true;
  }

  // Check if value contains var() references to color variables
  if (hasVarFunction(decl.value)) {
    const varRefs = extractVarReferences(decl.value);
    for (const ref of varRefs) {
      // Reset visited set for each top-level check
      ctx.visitedVars.clear();
      const isColor = isVariableColorBearing(ref.varName, ctx);
      if (isColor) {
        // Mark this variable as kept
        ctx.keptVariables.add(ref.varName);
        return true;
      }

      // Check fallback
      if (ref.fallbackAst) {
        if (hasColorInValueAst(ref.fallbackAst)) {
          return true;
        }
        // Check if fallback has var() to undefined variables
        if (hasVarFunction(ref.fallbackAst)) {
          const fallbackRefs = extractVarReferences(ref.fallbackAst);
          for (const fallbackRef of fallbackRefs) {
            if (!ctx.variables.has(fallbackRef.varName)) {
              // Undefined var in fallback - keep if lenient
              if (ctx.options.lenient) {
                return true;
              }
            }
          }
        }
      }
    }
  }

  return false;
}

// ============================================================================
// Step 4: Filter declarations and mark kept variables
// ============================================================================

function filterDeclarations(ast: csstree.CssNode, ctx: FilterContext): void {
  csstree.walk(ast, {
    visit: "Declaration",
    enter(node: csstree.CssNode) {
      if (node.type !== "Declaration") return;

      // Skip custom properties (they're handled separately)
      if (node.property.startsWith("--")) return;

      if (isDeclarationColorBearing(node, ctx)) {
        ctx.keptDeclarations.add(node);

        // Mark any referenced variables as kept
        if (hasVarFunction(node.value)) {
          const varRefs = extractVarReferences(node.value);
          for (const ref of varRefs) {
            markVariableAsKept(ref.varName, ctx);
          }
        }
      }
    },
  });
}

function markVariableAsKept(
  varName: string,
  ctx: FilterContext,
  depth = 0,
): void {
  if (depth > ctx.options.maxVarDepth) return;
  if (ctx.keptVariables.has(varName)) return;

  const varInfo = ctx.variables.get(varName);
  if (!varInfo) {
    // Undefined variable - can't mark it
    return;
  }

  ctx.keptVariables.add(varName);

  // Recursively mark any variables this one references
  if (hasVarFunction(varInfo.valueAst)) {
    const varRefs = extractVarReferences(varInfo.valueAst);
    for (const ref of varRefs) {
      markVariableAsKept(ref.varName, ctx, depth + 1);
    }
  }
}

// ============================================================================
// Step 5: Build reduced CSS string
// ============================================================================

function buildReducedCss(ast: csstree.StyleSheet, ctx: FilterContext): string {
  const cssChunks: string[] = [];

  ast.children.forEach((node) => {
    const chunk = processNode(node, ctx);
    if (chunk) {
      cssChunks.push(chunk);
    }
  });

  return cssChunks.join("");
}

function processNode(node: csstree.CssNode, ctx: FilterContext): string | null {
  if (node.type === "Rule") {
    return processRule(node, ctx);
  }

  if (node.type === "Atrule") {
    return processAtrule(node, ctx);
  }

  // Keep comments if option is set
  if (node.type === "Comment" && ctx.options.preserveComments) {
    return csstree.generate(node);
  }

  // Keep other node types as-is (shouldn't happen in well-formed CSS)
  return null;
}

function processRule(rule: csstree.Rule, ctx: FilterContext): string | null {
  const declarations: string[] = [];

  rule.block.children.forEach((child) => {
    if (child.type === "Declaration") {
      // Keep if it's a kept regular declaration
      if (ctx.keptDeclarations.has(child)) {
        declarations.push(csstree.generate(child));
      }
      // Keep if it's a kept variable
      else if (
        child.property.startsWith("--") &&
        ctx.keptVariables.has(child.property)
      ) {
        declarations.push(csstree.generate(child));
      }
      // Keep if it's a color variable (even if not referenced)
      else if (child.property.startsWith("--")) {
        const varInfo = ctx.variables.get(child.property);
        if (varInfo?.isColorVariable) {
          declarations.push(csstree.generate(child));
        }
      }
    } else if (child.type === "Comment" && ctx.options.preserveComments) {
      declarations.push(csstree.generate(child));
    }
  });

  // Only keep rule if it has declarations
  if (declarations.length === 0) {
    return null;
  }

  const selector = csstree.generate(rule.prelude);
  return `${selector}{${declarations.join(";")}}`;
}

function processAtrule(
  atrule: csstree.Atrule,
  ctx: FilterContext,
): string | null {
  const name = atrule.name.toLowerCase();

  // Skip non-selector at-rules
  if (
    name === "import" ||
    name === "font-face" ||
    name === "charset" ||
    name === "namespace"
  ) {
    return null;
  }

  // Handle at-rules with blocks (media, supports, keyframes, etc.)
  if (atrule.block) {
    const contentChunks: string[] = [];

    atrule.block.children.forEach((child) => {
      const chunk = processNode(child, ctx);
      if (chunk) {
        contentChunks.push(chunk);
      }
    });

    // Only keep at-rule if it has content
    if (contentChunks.length === 0) {
      return null;
    }

    const prelude = atrule.prelude ? csstree.generate(atrule.prelude) : "";
    return `@${atrule.name}${prelude ? " " + prelude : ""}{${contentChunks.join("")}}`;
  }

  // Keep at-rules without blocks as-is (shouldn't be many)
  return null;
}

// ============================================================================
// Main function
// ============================================================================

/**
 * Clean CSS to keep only color-related rules, declarations, and variables.
 *
 * @param cssString - The CSS string to clean
 * @param options - Cleaning options
 * @returns Cleaned CSS string containing only color-related content
 *
 * @example
 * ```typescript
 * const css = `
 *   :root {
 *     --primary: #007bff;
 *     --spacing: 1rem;
 *   }
 *   .button {
 *     color: var(--primary);
 *     padding: var(--spacing);
 *   }
 * `;
 * const cleaned = cleanCss(css);
 * // Result:
 * // :root {
 * //   --primary: #007bff;
 * // }
 * // .button {
 * //   color: var(--primary);
 * // }
 * ```
 */
export function cleanCss(
  cssString: string,
  options: CleanCssOptions = {},
): string {
  // Merge options with defaults
  const opts: Required<CleanCssOptions> = {
    lenient: options.lenient ?? true,
    includeShorthands: options.includeShorthands ?? [],
    preserveComments: options.preserveComments ?? false,
    maxVarDepth: options.maxVarDepth ?? 15,
  };

  // Parse CSS
  const ast = csstree.parse(cssString) as csstree.StyleSheet;

  // Collect variables
  const variables = collectVariables(ast);

  // Create filter context
  const ctx: FilterContext = {
    variables,
    keptDeclarations: new Set(),
    keptVariables: new Set(),
    visitedVars: new Set(),
    options: opts,
  };

  // Filter declarations and mark kept variables
  filterDeclarations(ast, ctx);

  // Build reduced CSS string
  return buildReducedCss(ast, ctx);
}
