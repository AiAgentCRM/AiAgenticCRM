// export.js
// Robust MongoDB Atlas exporter: exports a specific DB, and if empty, auto-exports all non-empty DBs.
// - Streams documents to NDJSON (one JSON per line) for big collections
// - Also writes index metadata per collection
// - Falls back to known app collections if listCollections() shows none

const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");

const URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://aiagenticcrm:TechDB%40%232025@cluster0.d2sgkdm.mongodb.net/aiagentcrm?retryWrites=true&w=majority&appName=Cluster0";
const FALLBACK_DB_NAME = process.env.DB_NAME || "aiagentcrm";

// Known collections from your app models (fallback if listCollections is empty or blocked)
const KNOWN_COLLECTIONS = [
  "tenants",
  "leads",
  "settings",
  "subscriptionplans",
  "knowledgebases",
  "reminders",
  "messages",
];

// Root export folder
const EXPORT_ROOT = path.join(__dirname, "DATABASE-EXPORT-FILES");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function timestamp() {
  return new Date()
    .toISOString()
    .replace(/:/g, "-")
    .replace("T", "_")
    .split(".")[0];
}

// Try to detect DB name from URI; e.g., ...mongodb.net/mydb?...
function dbNameFromUri(uri) {
  const m = uri.match(/mongodb(?:\+srv)?:\/\/[^/]+\/([^/?]+)(?:[/?]|$)/i);
  return m ? m[1] : null;
}

async function exportCollection(db, dbDir, collName, ts) {
  const outData = path.join(dbDir, `${collName}_${ts}.jsonl`);
  const outIndexes = path.join(dbDir, `${collName}_${ts}.indexes.json`);
  const writeStream = fs.createWriteStream(outData, { encoding: "utf8" });

  // Export indexes
  try {
    const indexes = await db.collection(collName).indexes();
    fs.writeFileSync(outIndexes, JSON.stringify(indexes, null, 2));
  } catch (e) {
    // Indexes may fail if perms are limited; ignore
  }

  let count = 0;
  const cursor = db.collection(collName).find({}, { batchSize: 1000 });
  for await (const doc of cursor) {
    writeStream.write(JSON.stringify(doc) + "\n");
    count++;
  }

  await new Promise((res, rej) => {
    writeStream.end(() => res());
    writeStream.on("error", rej);
  });

  console.log(`✅ Exported ${count} docs from "${collName}" → ${outData}`);
  return count;
}

async function listCollectionsSafe(db) {
  try {
    const cols = await db.listCollections({}, { nameOnly: true }).toArray();
    return cols.map((c) => c.name);
  } catch (_) {
    // Some roles can read but not list. Fallback to empty; caller will try known collections.
    return [];
  }
}

async function exportDatabase(client, dbName) {
  const dbDir = path.join(EXPORT_ROOT, dbName);
  ensureDir(dbDir);
  const ts = timestamp();

  const db = client.db(dbName);
  let collNames = await listCollectionsSafe(db);

  // Union with known collections to handle restricted listCollections permissions
  const set = new Set(collNames);
  for (const k of KNOWN_COLLECTIONS) set.add(k);
  collNames = Array.from(set);

  // Filter out collections that truly don't exist by trying countDocuments quickly
  const existing = [];
  for (const name of collNames) {
    try {
      // countDocuments is heavy; prefer estimatedDocumentCount for speed
      const est = await db.collection(name).estimatedDocumentCount();
      if (est > 0) existing.push(name);
      else {
        // If estimated is 0, still include empty collections if they exist in listCollections
        // (skip only when we added from KNOWN_COLLECTIONS but it's absent)
        if (
          (await db.listCollections({ name }, { nameOnly: true }).toArray())
            .length > 0
        ) {
          existing.push(name);
        }
      }
    } catch (_) {
      // Ignore genuinely missing collections
    }
  }

  if (existing.length === 0) {
    console.log(
      `⚠ No collections found (or accessible) in database "${dbName}"`
    );
    return { dbName, exportedCollections: 0, exportedDocs: 0 };
  }

  console.log(
    `📦 Exporting database "${dbName}" (${existing.length} collections)...`
  );
  let totalDocs = 0;
  for (const coll of existing) {
    try {
      totalDocs += await exportCollection(db, dbDir, coll, ts);
    } catch (e) {
      console.error(
        `❌ Failed exporting collection "${coll}" from "${dbName}":`,
        e.message
      );
    }
  }

  console.log(
    `🎉 Completed "${dbName}". Collections: ${existing.length}, Docs: ${totalDocs}`
  );
  return {
    dbName,
    exportedCollections: existing.length,
    exportedDocs: totalDocs,
  };
}

async function listDatabasesSafe(client) {
  try {
    const admin = client.db().admin();
    const res = await admin.listDatabases();
    return res.databases.map((d) => d.name);
  } catch (_) {
    return [];
  }
}

async function exportAll() {
  ensureDir(EXPORT_ROOT);

  const client = new MongoClient(URI);
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB Atlas");

    // Prefer DB name from URI, else fallback to your known DB name
    const uriDb = dbNameFromUri(URI);
    const primaryDbName = uriDb || FALLBACK_DB_NAME;

    // First try the intended DB
    const result = await exportDatabase(client, primaryDbName);

    // If nothing found/exported, auto-discover other DBs and export non-empty ones
    if (result.exportedCollections === 0) {
      console.log(
        `🔎 Trying to auto-discover databases (your user must have listDatabases)...`
      );
      const dbs = await listDatabasesSafe(client);

      if (dbs.length === 0) {
        console.log(
          "⚠ No databases visible to this user. Verify user privileges in Atlas."
        );
        return;
      }

      // Skip internal DBs unless you want them
      const skip = new Set(["admin", "local", "config"]);
      let totalExported = 0;
      for (const dbName of dbs) {
        if (skip.has(dbName)) continue;
        const r = await exportDatabase(client, dbName);
        totalExported += r.exportedCollections;
      }
      if (totalExported === 0) {
        console.log(
          "⚠ Enumerated databases but found no exportable collections. Check user roles/permissions."
        );
      }
    }

    console.log("\n✅ Done. Files are in:", EXPORT_ROOT);
    console.log("Tip: zip the folder to share it.");
  } catch (err) {
    console.error("❌ Error exporting:", err);
  } finally {
    await client.close();
  }
}

exportAll();
