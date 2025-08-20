const mongoose = require("mongoose");

const knowledgebaseSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, unique: true },
  organizationName: { type: String, required: true },
  content: { type: String, required: true },
  knowledgeSources: { type: [String], default: [] },
  uploadDocument: { type: String, default: "" },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Knowledgebase", knowledgebaseSchema);
