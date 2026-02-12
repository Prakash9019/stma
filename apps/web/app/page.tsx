"use client";

import { useState } from "react";
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  ArrowRight, 
  Loader2, 
  Copy, 
  CheckCircle2 
} from "lucide-react";

export default function Home() {
  const [partyId, setPartyId] = useState("");
  const [payload, setPayload] = useState('{\n  "amount": 5000,\n  "currency": "USD",\n  "reference": "TX-9982"\n}');
  const [record, setRecord] = useState<any>(null);
  const [decrypted, setDecrypted] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Use the deployed URL or local if needed
  const API_URL = "https://secure-tx-api-7qg4.vercel.app";

  async function handleEncrypt() {
    setError("");
    setLoading(true);
    setRecord(null);
    setDecrypted(null);

    try {
      // 1. Validate JSON
      let parsed;
      try { parsed = JSON.parse(payload); } 
      catch { throw new Error("Invalid JSON format. Please check your syntax."); }

      if (!partyId.trim()) throw new Error("Party ID is required");

      // 2. Send Request
      const res = await fetch(`${API_URL}/api/tx/encrypt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partyId, payload: parsed }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setRecord(data);
    } catch (err: any) {
      setError(err.message || "Encryption failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDecrypt() {
    if (!record?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/tx/${record.id}/decrypt`, { method: "POST" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDecrypted(data);
    } catch (err: any) {
      setError("Decryption failed. Integrity check might have failed.");
    } finally {
      setLoading(false);
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page-container">
      <style jsx global>{`
        /* Reset & Base */
        body { background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; }
        
        /* Animations */
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-fade { animation: fadeIn 0.4s ease-out forwards; }
        .animate-spin { animation: spin 1s linear infinite; }

        /* Layout */
        .page-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .card { background: white; width: 100%; max-width: 520px; border-radius: 16px; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.08); overflow: hidden; border: 1px solid #e2e8f0; }
        
        /* Header */
        .header { background: linear-gradient(135deg, #0070f3 0%, #005bb5 100%); padding: 32px; text-align: center; color: white; }
        .header-icon { background: rgba(255,255,255,0.2); width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; backdrop-filter: blur(4px); }
        .title { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
        .subtitle { margin: 8px 0 0; opacity: 0.9; font-size: 14px; font-weight: 400; }

        /* Form */
        .body { padding: 32px; }
        .label { display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 6px; }
        .input, .textarea { width: 100%; padding: 12px 16px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; transition: all 0.2s; outline: none; background: #fff; color: #334155; }
        .input:focus, .textarea:focus { border-color: #0070f3; box-shadow: 0 0 0 3px rgba(0, 112, 243, 0.1); }
        .textarea { font-family: "Menlo", "Monaco", "Courier New", monospace; background: #f8fafc; line-height: 1.5; }
        
        /* Buttons */
        .btn { width: 100%; padding: 14px; border: none; border-radius: 10px; font-weight: 600; font-size: 15px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: transform 0.1s, background 0.2s; }
        .btn:active { transform: scale(0.98); }
        .btn-primary { background: #0070f3; color: white; box-shadow: 0 4px 12px rgba(0, 112, 243, 0.2); }
        .btn-primary:hover:not(:disabled) { background: #0060df; }
        .btn-primary:disabled { background: #94a3b8; cursor: not-allowed; box-shadow: none; }
        
        .btn-secondary { background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0; margin-top: 16px; }
        .btn-secondary:hover { background: #e2e8f0; color: #0f172a; }

        /* Results */
        .result-area { margin-top: 24px; padding-top: 24px; border-top: 1px dashed #e2e8f0; }
        .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 12px; }
        .status-success { background: #dcfce7; color: #166534; }
        .status-encrypted { background: #e0f2fe; color: #075985; }
        
        .code-block-wrapper { position: relative; }
        .code-block { background: #1e293b; color: #e2e8f0; padding: 16px; border-radius: 8px; font-size: 12px; overflow-x: auto; font-family: monospace; border: 1px solid #334155; margin: 0; }
        .copy-btn { position: absolute; top: 8px; right: 8px; background: rgba(255,255,255,0.1); border: none; border-radius: 4px; padding: 4px; cursor: pointer; color: white; transition: background 0.2s; }
        .copy-btn:hover { background: rgba(255,255,255,0.2); }

        /* Utilities */
        .error-box { background: #fef2f2; border-left: 4px solid #ef4444; color: #b91c1c; padding: 12px; border-radius: 6px; font-size: 14px; margin-bottom: 20px; }
        .spacer { height: 20px; }
      `}</style>

      <div className="card animate-fade">
        {/* Header */}
        <div className="header">
          <div className="header-icon">
            <ShieldCheck size={28} color="white" />
          </div>
          <h1 className="title">Secure Transaction</h1>
          <p className="subtitle">AES-256-GCM Envelope Encryption</p>
        </div>

        <div className="body">
          {error && (
            <div className="error-box animate-fade">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Inputs */}
          <div>
            <label className="label">Party ID / Recipient</label>
            <input
              className="input"
              placeholder="e.g. bank_client_8821"
              value={partyId}
              onChange={(e) => setPartyId(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="spacer"></div>

          <div>
            <label className="label">Transaction Payload (JSON)</label>
            <textarea
              className="textarea"
              rows={5}
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="spacer"></div>

          <button 
            className="btn btn-primary"
            onClick={handleEncrypt}
            disabled={loading || !partyId}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Lock size={20} />}
            {loading ? "Encrypting..." : "Encrypt & Store Record"}
          </button>

          {/* Encrypted Result */}
          {record && (
            <div className="result-area animate-fade">
              <div className="status-badge status-encrypted">
                <Lock size={12} /> ENCRYPTED RECORD STORED
              </div>
              
              <div className="code-block-wrapper">
                <pre className="code-block">
                  {JSON.stringify(record, null, 2)}
                </pre>
                <button 
                  className="copy-btn" 
                  onClick={() => copyToClipboard(JSON.stringify(record))}
                  title="Copy JSON"
                >
                  {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                </button>
              </div>

              {/* Decrypt Action */}
              {!decrypted ? (
                <button 
                  className="btn btn-secondary"
                  onClick={handleDecrypt}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Unlock size={18} />}
                  Decrypt this Record
                </button>
              ) : (
                <div className="animate-fade" style={{ marginTop: '20px' }}>
                   <div className="status-badge status-success">
                    <ShieldCheck size={12} /> DECRYPTION VERIFIED
                  </div>
                   <pre className="code-block" style={{ background: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0' }}>
                     {JSON.stringify(decrypted, null, 2)}
                   </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}