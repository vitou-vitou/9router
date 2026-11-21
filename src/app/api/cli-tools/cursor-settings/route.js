import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import os from "os";

const getCursorSettingsPath = () => {
  const home = os.homedir();
  if (os.platform() === "win32") {
    return path.join(
      process.env.APPDATA || path.join(home, "AppData", "Roaming"),
      "Cursor",
      "User",
      "settings.json"
    );
  }
  if (os.platform() === "darwin") {
    return path.join(
      home,
      "Library",
      "Application Support",
      "Cursor",
      "User",
      "settings.json"
    );
  }
  return path.join(home, ".config", "Cursor", "User", "settings.json");
};

const readJson = async (filePath) => {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    // Strip trailing commas outside of string literals
    const stripped = content.replace(
      /("(?:\\.|[^"\\])*")|,(\s*[}\]])/g,
      (m, str, tail) => str ?? tail
    );
    return JSON.parse(stripped);
  } catch {
    return null;
  }
};

const has9RouterConfig = (settings) => {
  if (!settings) return false;
  const baseUrl = settings["cursor.general.customOpenAIBaseUrl"] || "";
  return (
    baseUrl.includes("localhost") ||
    baseUrl.includes("127.0.0.1") ||
    baseUrl.includes("9router") ||
    baseUrl.includes("20128")
  );
};

export async function GET() {
  try {
    const settingsPath = getCursorSettingsPath();
    let installed = false;
    try {
      await fs.access(settingsPath);
      installed = true;
    } catch {
      // Check parent directory
      try {
        await fs.access(path.dirname(settingsPath));
        installed = true;
      } catch {
        installed = false;
      }
    }

    if (!installed) {
      return NextResponse.json({
        installed: false,
        settings: null,
        message: "Cursor IDE settings directory not found",
      });
    }

    const settings = await readJson(settingsPath);
    return NextResponse.json({
      installed: true,
      settings: {
        baseUrl: settings?.["cursor.general.customOpenAIBaseUrl"] || null,
        models: settings?.["cursor.general.customOpenAIModels"] || [],
      },
      has9Router: has9RouterConfig(settings),
      settingsPath,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to check Cursor settings: " + (error?.message || error) },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { baseUrl, apiKey, model } = await request.json();

    const isSafeString = (v, max = 512) =>
      typeof v === "string" &&
      v.trim().length > 0 &&
      v.length <= max &&
      !/[\x00-\x1f]/.test(v);

    if (
      !isSafeString(baseUrl) ||
      !isSafeString(apiKey) ||
      (model !== undefined && !isSafeString(model, 128))
    ) {
      return NextResponse.json(
        { error: "Invalid or missing baseUrl, apiKey, or model parameters" },
        { status: 400 }
      );
    }

    const settingsPath = getCursorSettingsPath();
    await fs.mkdir(path.dirname(settingsPath), { recursive: true });

    const normalizedBaseUrl = baseUrl.endsWith("/v1")
      ? baseUrl
      : `${baseUrl.replace(/\/+$/, "")}/v1`;

    const settings = (await readJson(settingsPath)) || {};
    settings["cursor.general.customOpenAIBaseUrl"] = normalizedBaseUrl;
    settings["cursor.general.customOpenAIKey"] = apiKey;

    if (model) {
      const models = Array.isArray(settings["cursor.general.customOpenAIModels"])
        ? settings["cursor.general.customOpenAIModels"]
        : [];
      if (!models.includes(model)) {
        models.unshift(model);
      }
      settings["cursor.general.customOpenAIModels"] = models;
    }

    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));

    return NextResponse.json({
      success: true,
      message: "Cursor IDE custom OpenAI settings applied successfully!",
      settingsPath,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update Cursor settings: " + (error?.message || error) },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const settingsPath = getCursorSettingsPath();
    const settings = await readJson(settingsPath);
    if (!settings) {
      return NextResponse.json({
        success: true,
        message: "No Cursor settings file found to reset",
      });
    }

    delete settings["cursor.general.customOpenAIBaseUrl"];
    delete settings["cursor.general.customOpenAIKey"];
    delete settings["cursor.general.customOpenAIModels"];

    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));

    return NextResponse.json({
      success: true,
      message: "9Router custom OpenAI settings removed from Cursor IDE",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to reset Cursor settings: " + (error?.message || error) },
      { status: 500 }
    );
  }
}
