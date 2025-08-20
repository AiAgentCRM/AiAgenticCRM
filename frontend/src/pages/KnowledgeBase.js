import React from "react";
import KnowledgebaseEditor from "../components/KnowledgebaseEditor";
import "./KnowledgeBase.css";

const KnowledgeBase = ({ tenantId }) => {
  return (
    <div className="knowledge-base">
      {/* Header Section */}
      {/* <div className="kb-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="page-title">Knowledge Base</h1>
            <p className="page-subtitle">Edit your AI knowledge base content</p>
          </div>
        </div>
      </div> */}

      {/* Main Content Area */}
      <div className="kb-content">
        <KnowledgebaseEditor tenantId={tenantId} />
      </div>
    </div>
  );
};

export default KnowledgeBase;
