"use client";

import { useState } from "react";

interface SidebarFinding {
  id: string;
  label: string;
  title: string;
}

const openFindings: SidebarFinding[] = [
  {
    id: "AWS-EC2-012",
    label: "AWS-EC2-012",
    title:
      "Security group 'Testing-SSH-Demo' allows SSH (port 22) from internet",
  },
  {
    id: "AWS-EC2-013",
    label: "AWS-EC2-012",
    title:
      "Security group 'launch-wizard-110' allows SSH (port 22) from internet",
  },
  {
    id: "AWS-EC2-014",
    label: "AWS-EC2-012",
    title:
      "Security group 'launch-wizard-109' allows SSH (port 22) from internet",
  },
  {
    id: "AWS-EC2-015",
    label: "AWS-EC2-012",
    title:
      "Security group 'launch-wizard-108' allows SSH (port 22) from internet",
  },
  {
    id: "AWS-EC2-016",
    label: "AWS-EC2-012",
    title:
      "Security group 'launch-wizard-107' allows SSH (port 22) from internet",
  },
  {
    id: "AWS-EC2-017",
    label: "AWS-EC2-012",
    title:
      "Security group 'launch-wizard-106' allows SSH (port 22) from internet",
  },
];

const quickActions = [
  "Explain this security finding in detail",
  "What is the risk if this is not fixed?",
  "Show me the exact commands to remediate this",
  "Generate Terraform code to fix this issue",
];

export default function RemediationPage() {
  const [selectedFinding, setSelectedFinding] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-80 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <h2 className="text-base font-semibold text-gray-900">
              Security Context
            </h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* No finding selected message */}
          {!selectedFinding && (
            <div className="px-5 py-4">
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
                <p className="text-sm text-gray-500">
                  No finding selected. Choose one below to get contextual
                  guidance.
                </p>
              </div>
            </div>
          )}

          {/* Open Findings List */}
          <div className="px-5 py-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              Open Findings
            </h3>
            <div className="space-y-2">
              {openFindings.map((finding) => (
                <button
                  key={finding.id}
                  onClick={() => setSelectedFinding(finding.id)}
                  className={`w-full text-left rounded-lg border p-3 transition-colors ${
                    selectedFinding === finding.id
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-red-100 text-red-700 text-[10px] font-bold">
                      C
                    </span>
                    <span className="text-xs font-mono font-medium text-gray-500">
                      {finding.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {finding.title}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-gray-900">
              AI Remediation Assistant
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              Powered by Claude · GCP security expert
            </span>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-3xl mx-auto">
            {/* Welcome Message */}
            <div className="flex gap-3 mb-6">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a2.25 2.25 0 01-1.591.659H9.061a2.25 2.25 0 01-1.591-.659L5 14.5m14 0V17a2.25 2.25 0 01-2.25 2.25H7.25A2.25 2.25 0 015 17v-2.5"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <p className="text-sm text-gray-700 mb-4">
                    Hello! I&apos;m your AI security remediation assistant.
                    Select a finding from the sidebar or navigate here from the
                    Findings page to get contextual remediation guidance.
                  </p>
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    I can help you with:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm text-gray-600">
                      <svg
                        className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Remediation steps with exact{" "}
                      <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">
                        gcloud
                      </code>{" "}
                      commands
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-600">
                      <svg
                        className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Terraform code to fix security issues
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-600">
                      <svg
                        className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Blast radius analysis for any finding
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-600">
                      <svg
                        className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Compliance context for CIS, NIST, and ISO 27001
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              {quickActions.map((action) => (
                <button
                  key={action}
                  onClick={() => setChatInput(action)}
                  className="text-left px-4 py-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors shadow-sm"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Input */}
        <div className="px-6 py-4 bg-white border-t border-gray-200">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <textarea
                rows={1}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about this finding, request gcloud commands, Terraform, or blast radius analysis..."
                className="w-full resize-none rounded-xl border border-gray-300 bg-white pl-4 pr-12 py-3 text-sm text-gray-700 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    // Handle send
                  }
                }}
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Press Enter to send · Shift+Enter for new line · Responses powered
              by Claude
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
