import React, { useState, useEffect, useRef } from "react";
import { fetchWhatsAppQR, fetchWhatsAppStatus, SOCKET_URL } from "../services/api";
import io from "socket.io-client";

const WhatsAppConnect = ({ tenantId }) => {
  const [qr, setQr] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const pollingRef = useRef(null);
  const socketRef = useRef(null);

  const pollStatus = async () => {
    try {
      const data = await fetchWhatsAppStatus(tenantId);
      if (data.status === "ready") {
        setReady(true);
        setMessage("WhatsApp is ready!");
        setQr(null);
        setError(null);
        if (pollingRef.current) clearTimeout(pollingRef.current);
        return;
      } else {
        setReady(false);
        setMessage("Waiting for scan...");
        pollingRef.current = setTimeout(pollStatus, 2000);
      }
    } catch (err) {
      setError("Failed to check WhatsApp status.");
      setReady(false);
      setMessage("");
      if (pollingRef.current) clearTimeout(pollingRef.current);
    }
  };

  const handleRequestQr = async () => {
    setLoading(true);
    setError(null);
    setMessage("Requesting QR code...");
    setQr(null);
    setReady(false);
    setAuthenticating(false);
    if (pollingRef.current) clearTimeout(pollingRef.current);
    try {
      const response = await fetchWhatsAppQR(tenantId);
      if (response.status === "ready") {
        setQr(null);
        setMessage(response.message || "WhatsApp is already connected!");
        setReady(true);
        setError(null);
      } else if (response.status === "qr") {
        setQr(response.qr);
        setMessage(response.message || "Scan this QR code with WhatsApp");
        setReady(false);
        setError(null);
        pollStatus(); // Start polling for ready status
      } else {
        setError(response.error || "Failed to get QR code");
        setReady(false);
      }
    } catch (err) {
      setError("Failed to connect to WhatsApp. Please try again.");
      setReady(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    setLoading(true);
    setError(null);
    setMessage("");
    setQr(null);
    setReady(false);
    setAuthenticating(false);
    try {
      const data = await fetchWhatsAppStatus(tenantId);
      if (data.status === "ready") {
        setReady(true);
        setMessage("WhatsApp is ready!");
      } else {
        setReady(false);
        setMessage("WhatsApp is not connected. Click 'Connect WhatsApp' to get started.");
      }
    } catch (err) {
      setError("Failed to check WhatsApp status.");
    } finally {
      setLoading(false);
    }
  };

  // Setup socket.io connection and listeners
  useEffect(() => {
    if (!tenantId) return;
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    const socket = io(SOCKET_URL, { transports: ["websocket"], withCredentials: true });
    socketRef.current = socket;
    socket.emit("join-tenant", tenantId);
    socket.on("whatsapp-qr", (data) => {
      if (data.tenantId === tenantId) {
        setQr(data.qr);
        setMessage("Scan this QR code with WhatsApp");
        setReady(false);
        setAuthenticating(false);
        setError(null);
      }
    });
    socket.on("whatsapp-authenticating", (data) => {
      if (data.tenantId === tenantId) {
        setAuthenticating(true);
        setMessage("QR code scanned! Logging into WhatsApp...");
        setQr(null);
        setError(null);
        
        // Set a timeout to clear authenticating state if it takes too long (5 minutes)
        setTimeout(() => {
          setAuthenticating(false);
          setMessage("Authentication taking longer than expected. Please try again.");
        }, 300000); // 5 minutes
      }
    });
    socket.on("whatsapp-ready", (data) => {
      if (data.tenantId === tenantId) {
        setReady(true);
        setAuthenticating(false);
        setMessage("WhatsApp is ready!");
        setQr(null);
        setError(null);
        if (pollingRef.current) clearTimeout(pollingRef.current);
      }
    });
    return () => {
      socket.disconnect();
      if (pollingRef.current) clearTimeout(pollingRef.current);
      setAuthenticating(false);
    };
  }, [tenantId]);

  // On mount, check status and poll until ready
  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    setMessage("");
    setQr(null);
    setReady(false);
    setAuthenticating(false);
    if (pollingRef.current) clearTimeout(pollingRef.current);
    const poll = async () => {
      try {
        const res = await fetch(`/api/${tenantId}/whatsapp/status`, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const data = await res.json();
        if (data.status === "ready") {
          setReady(true);
          setMessage("WhatsApp is ready!");
        } else {
          setReady(false);
          setMessage("WhatsApp is not connected. Click 'Connect WhatsApp' to get started.");
          pollingRef.current = setTimeout(poll, 2000);
        }
      } catch (err) {
        // Don't show error on first load, just set a neutral message
        setReady(false);
        setMessage("WhatsApp is not connected. Click 'Connect WhatsApp' to get started.");
      } finally {
        setLoading(false);
      }
    };
    poll();
    return () => {
      if (pollingRef.current) clearTimeout(pollingRef.current);
      setAuthenticating(false);
    };
  }, [tenantId]);

  return (
    <div className="mb-4">
      <h3>WhatsApp Connection</h3>
      <div className="d-flex align-items-center flex-nowrap mb-2">
        <button
          className="btn btn-success me-2"
          onClick={handleRequestQr}
          disabled={loading || ready || authenticating}
        >
          {loading ? "Connecting..." : authenticating ? "Logging in..." : ready ? "Connected" : "Connect WhatsApp"}
        </button>
      {/* <button
        className="btn btn-outline-primary mb-2 ms-2"
        onClick={handleCheckStatus}
        disabled={loading}
      >
        Check WhatsApp Status
      </button> */}
        {ready && (
          <span className="btn btn-success disabled" aria-disabled="true">✔ Connected</span>
        )}
              {authenticating && (
        <span className="btn btn-warning disabled" aria-disabled="true">
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          Logging in...
        </span>
      )}
        {!ready && !loading && !authenticating && (
          <span className="btn btn-danger disabled" aria-disabled="true">Not Connected</span>
        )}
      </div>
      {qr && (
        <div>
          <p>{message}</p>
          <img src={qr} alt="WhatsApp QR" style={{ width: 256, height: 256 }} />
        </div>
      )}
      {!qr && message && (
        <div className={`mt-2 ${authenticating ? 'text-warning' : 'text-success'}`}>
          {authenticating && (
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          )}
          {message}
        </div>
      )}
      {error && <div className="text-danger mt-2">{error}</div>}
      {!qr && !message && !error && (
        <div className="text-muted">
          Click "Connect WhatsApp" to get started
        </div>
      )}
    </div>
  );
};

export default WhatsAppConnect;
