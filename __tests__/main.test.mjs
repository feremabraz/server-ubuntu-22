import { beforeEach, describe, expect, it, vi } from "vitest";
import * as main from "../main.mjs";

// ESM + Node core mocks
vi.mock("node:fs/promises", () => {
	const appendFile = vi.fn(async () => {});
	const readFile = vi.fn(async (file) => {
		if (file === "exists.txt") return "existing line\n";
		throw new Error("File not found");
	});
	const writeFile = vi.fn(async () => {});
	return {
		default: { appendFile, readFile, writeFile },
		appendFile,
		readFile,
		writeFile,
	};
});

vi.mock("node:child_process", () => {
	// Use a single vi.fn() for exec so that all imports/requires are the same instance
	if (!globalThis.__vitest_exec) globalThis.__vitest_exec = vi.fn();
	return {
		default: { exec: globalThis.__vitest_exec },
		exec: globalThis.__vitest_exec,
	};
});

import { exec } from "node:child_process";
import fs from "node:fs/promises";

describe("ensureLineInFile", () => {
	beforeEach(() => {
		fs.appendFile.mockClear();
		fs.readFile.mockClear();
	});

	it("appends if line is missing", async () => {
		await main.ensureLineInFile("exists.txt", "new line\n");
		expect(fs.appendFile).toHaveBeenCalledWith(
			"exists.txt",
			"new line\n",
			"utf8",
		);
	});

	it("does not append if line exists", async () => {
		await main.ensureLineInFile("exists.txt", "existing line\n");
		expect(fs.appendFile).not.toHaveBeenCalled();
	});

	it("appends if file does not exist", async () => {
		await main.ensureLineInFile("notfound.txt", "new line\n");
		expect(fs.appendFile).toHaveBeenCalledWith(
			"notfound.txt",
			"new line\n",
			"utf8",
		);
	});
});

describe("runCommand", () => {
	it("logs and returns output", async () => {
		exec.mockImplementationOnce((cmd, cb) =>
			cb(null, { stdout: "ok", stderr: "" }),
		);
		const { stdout, stderr } = await main.runCommand("echo test");
		expect(stdout).toBe("ok");
		expect(stderr).toBe("");
	});
});

describe("editFile", () => {
	it("replaces content and writes file", async () => {
		fs.readFile.mockResolvedValue("hello old");
		await main.editFile("file.txt", "old", "new");
		expect(fs.writeFile).toHaveBeenCalledWith("file.txt", "hello new", "utf8");
	});
});

describe("appendToFile", () => {
	it("appends content", async () => {
		await main.appendToFile("file.txt", "line\n");
		expect(fs.appendFile).toHaveBeenCalledWith("file.txt", "line\n", "utf8");
	});
});

describe("serviceExists", () => {
	it("returns true if service exists", async () => {
		exec.mockImplementationOnce((cmd, cb) =>
			cb(null, { stdout: "ok", stderr: "" }),
		);
		const result = await main.serviceExists("ssh");
		expect(result).toBe(true);
	});
	it("returns false if service does not exist", async () => {
		exec.mockImplementationOnce((cmd, cb) => cb(new Error("fail")));
		const result = await main.serviceExists("notfound");
		expect(result).toBe(false);
	});
});
