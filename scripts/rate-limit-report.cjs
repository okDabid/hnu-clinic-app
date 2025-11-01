#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs/promises");
const path = require("path");
const ts = require("typescript");

const API_ROOT = path.join(process.cwd(), "src", "app", "api");

async function main() {
    const files = await listRouteFiles(API_ROOT);
    const summaries = [];

    for (const file of files) {
        const relativePath = path.relative(process.cwd(), file);
        const info = await analyzeRoute(file);
        for (const method of info.methods) {
            summaries.push({
                route: toRoutePath(relativePath),
                method: method.name,
                wrapperBuckets: method.wrapperBuckets,
                inHandlerBuckets: method.inHandlerBuckets,
            });
        }
        if (info.methods.length === 0) {
            summaries.push({
                route: toRoutePath(relativePath),
                method: "(none)",
                wrapperBuckets: 0,
                inHandlerBuckets: 0,
            });
        }
    }

    summaries.sort((a, b) => {
        if (a.route === b.route) {
            return a.method.localeCompare(b.method);
        }
        return a.route.localeCompare(b.route);
    });

    printMarkdown(summaries);
}

async function listRouteFiles(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
        entries.map(async (entry) => {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                return listRouteFiles(fullPath);
            }
            if (entry.isFile() && entry.name === "route.ts") {
                return [fullPath];
            }
            return [];
        })
    );
    return files.flat();
}

async function analyzeRoute(filePath) {
    const sourceText = await fs.readFile(filePath, "utf8");
    const sourceFile = ts.createSourceFile(
        filePath,
        sourceText,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS
    );

    const functionMap = new Map();
    sourceFile.forEachChild((node) => {
        if (ts.isFunctionDeclaration(node) && node.name) {
            functionMap.set(node.name.text, node);
        }
        if (ts.isVariableStatement(node)) {
            for (const decl of node.declarationList.declarations) {
                if (!decl.name || !ts.isIdentifier(decl.name)) continue;
                const name = decl.name.text;
                if (
                    decl.initializer &&
                    (ts.isFunctionExpression(decl.initializer) ||
                        ts.isArrowFunction(decl.initializer))
                ) {
                    functionMap.set(name, decl.initializer);
                }
            }
        }
    });

    const methods = [];

    sourceFile.forEachChild((node) => {
        if (ts.isVariableStatement(node) && hasExportModifier(node.modifiers)) {
            for (const decl of node.declarationList.declarations) {
                if (!ts.isIdentifier(decl.name)) continue;
                if (!isHttpMethodName(decl.name.text)) continue;
                const methodName = decl.name.text;
                const initializer = decl.initializer;
                const summary = summarizeExport(methodName, initializer, functionMap);
                if (summary) {
                    methods.push(summary);
                }
            }
        } else if (ts.isFunctionDeclaration(node) && hasExportModifier(node.modifiers) && node.name) {
            if (!isHttpMethodName(node.name.text)) return;
            const methodName = node.name.text;
            const inHandlerBuckets = countConsumeCalls(node.body);
            methods.push({
                name: methodName,
                wrapperBuckets: 0,
                inHandlerBuckets,
            });
        }
    });

    return { methods };
}

function summarizeExport(methodName, initializer, functionMap) {
    if (!initializer) {
        return {
            name: methodName,
            wrapperBuckets: 0,
            inHandlerBuckets: 0,
        };
    }

    if (ts.isCallExpression(initializer) && isWithRateLimit(initializer.expression)) {
        const [rulesArg, handlerArg] = initializer.arguments;
        const wrapperBuckets = countRuleBuckets(rulesArg);
        const inHandlerBuckets = countHandlerConsume(handlerArg, functionMap);
        return { name: methodName, wrapperBuckets, inHandlerBuckets };
    }

    const inHandlerBuckets = countHandlerConsume(initializer, functionMap);
    return { name: methodName, wrapperBuckets: 0, inHandlerBuckets };
}

function hasExportModifier(modifiers) {
    return Boolean(
        modifiers?.some((mod) => mod.kind === ts.SyntaxKind.ExportKeyword)
    );
}

function isWithRateLimit(expression) {
    return (
        ts.isIdentifier(expression) && expression.text === "withRateLimit"
    );
}

const HTTP_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]);

function isHttpMethodName(name) {
    return HTTP_METHODS.has(name);
}

function countRuleBuckets(arg) {
    if (!arg) return 0;
    if (ts.isArrayLiteralExpression(arg)) {
        return arg.elements.filter((el) => !ts.isOmittedExpression(el)).length;
    }
    return 1;
}

function countHandlerConsume(handler, functionMap) {
    if (!handler) return 0;
    if (ts.isIdentifier(handler)) {
        const target = functionMap.get(handler.text);
        if (!target) return 0;
        if (ts.isFunctionDeclaration(target) || ts.isFunctionExpression(target) || ts.isArrowFunction(target)) {
            return countConsumeCalls(target.body ?? target);
        }
        return 0;
    }

    if (ts.isFunctionExpression(handler) || ts.isArrowFunction(handler)) {
        return countConsumeCalls(handler.body);
    }

    if (ts.isCallExpression(handler) && ts.isIdentifier(handler.expression)) {
        const target = functionMap.get(handler.expression.text);
        if (!target) return 0;
        if (ts.isFunctionDeclaration(target) || ts.isFunctionExpression(target) || ts.isArrowFunction(target)) {
            return countConsumeCalls(target.body ?? target);
        }
    }

    return 0;
}

function countConsumeCalls(body) {
    if (!body) return 0;
    let count = 0;
    const visit = (node) => {
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
            if (node.expression.text === "consumeRateLimit") {
                count += 1;
            }
        }
        ts.forEachChild(node, visit);
    };
    visit(body);
    return count;
}

function toRoutePath(relativePath) {
    const parts = relativePath.split(path.sep);
    const apiIndex = parts.indexOf("api");
    if (apiIndex === -1) return relativePath;
    const routeParts = parts.slice(apiIndex + 1, -1);
    return "/api/" + routeParts.join("/");
}

function printMarkdown(rows) {
    console.log(
        "| Route | Method | Total rate limits | Wrapper buckets | In-handler buckets |"
    );
    console.log("|---|---|---|---|---|");
    for (const row of rows) {
        const total = row.wrapperBuckets + row.inHandlerBuckets;
        console.log(
            `| ${row.route} | ${row.method} | ${total} | ${row.wrapperBuckets} | ${row.inHandlerBuckets} |`
        );
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
