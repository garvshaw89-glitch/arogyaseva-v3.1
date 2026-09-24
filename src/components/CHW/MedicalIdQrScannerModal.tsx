import React, { useState, useEffect, useRef, useCallback } from "react";
import jsQR from "jsqr";
import QRCode from "qrcode";
import {
  PatientCase,
  ScannedMedicalIdData,
  SupportedLanguage,
} from "../../types";
import {
  SAMPLE_MEDICAL_CARDS,
  SampleMedicalCard,
  parseMedicalIdQr,
} from "../../utils/medicalIdParser";
import { playHapticSound } from "../../utils/audioFeedback";
import {
  Camera,
  CameraOff,
  SwitchCamera,
  Zap,
  ZapOff,
  Upload,
  QrCode,
  X,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  ShieldCheck,
  Heart,
  Phone,
  Calendar,
  MapPin,
  RefreshCw,
  Sparkles,
  ArrowRight,
  HelpCircle,
  ExternalLink,
} from "lucide-react";

interface MedicalIdQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientIdentified: (
    data: ScannedMedicalIdData,
    matchedCase?: PatientCase
  ) => void;
  existingCases?: PatientCase[];
  language?: SupportedLanguage;
}

export const MedicalIdQrScannerModal: React.FC<MedicalIdQrScannerModalProps> = ({
  isOpen,
  onClose,
  onPatientIdentified,
  existingCases = [],
  language = "en",
}) => {
  // Tabs: "camera" | "upload" | "samples"
  const [activeTab, setActiveTab] = useState<"camera" | "upload" | "samples">("camera");

  // Camera & Stream states
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [hasTorchSupport, setHasTorchSupport] = useState<boolean>(false);

  // Scanned result state
  const [scannedResult, setScannedResult] = useState<ScannedMedicalIdData | null>(null);
  const [matchedExistingCase, setMatchedExistingCase] = useState<PatientCase | undefined>(undefined);
  const [scanSuccessAnim, setScanSuccessAnim] = useState<boolean>(false);

  // Sample cards QR data URLs cache
  const [sampleQrs, setSampleQrs] = useState<Record<string, string>>({});

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Pre-render sample QR images
  useEffect(() => {
    const generateQrs = async () => {
      const qrs: Record<string, string> = {};
      for (const card of SAMPLE_MEDICAL_CARDS) {
        try {
          const url = await QRCode.toDataURL(card.payloadString, {
            width: 180,
            margin: 1,
            color: { dark: "#0F172A", light: "#FFFFFF" },
          });
          qrs[card.id] = url;
        } catch (e) {
          console.error("Failed to generate sample QR:", e);
        }
      }
      setSampleQrs(qrs);
    };
    generateQrs();
  }, []);

  // Stop camera tracks cleanly
  const stopCameraStream = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setTorchOn(false);
    setHasTorchSupport(false);
  }, []);

  // Process a successful raw QR code string
  const handleDecodedString = useCallback(
    (rawString: string) => {
      if (!rawString || !rawString.trim()) return;

      playHapticSound("success");
      setScanSuccessAnim(true);

      const parsed = parseMedicalIdQr(rawString, existingCases);
      setScannedResult(parsed);

      // Check if matched to an existing record
      if (parsed.matchedCaseId) {
        const found = existingCases.find((c) => c.id === parsed.matchedCaseId);
        setMatchedExistingCase(found);
      } else {
        const foundByName = existingCases.find(
          (c) =>
            c.patientName.toLowerCase() === parsed.patientName.toLowerCase()
        );
        setMatchedExistingCase(foundByName);
      }

      // Stop camera once scanned
      stopCameraStream();
    },
    [existingCases, stopCameraStream]
  );

  // Frame scanner loop
  const scanVideoFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data && code.data.trim().length > 0) {
          handleDecodedString(code.data);
          return; // Stop scanning loop on match
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
  }, [handleDecodedString]);

  // Start camera stream
  const startCameraStream = useCallback(async () => {
    stopCameraStream();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Camera access is not supported in this browser or environment.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      // Check torch support
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities?.() as any;
        if (capabilities && capabilities.torch) {
          setHasTorchSupport(true);
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        setCameraActive(true);
        animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
      }
    } catch (err: any) {
      console.warn("Camera start failed:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError(
          "Camera permission was denied. Please allow camera permissions in your browser or use 'Upload Card Photo' / 'Sample Medical Cards'."
        );
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError(
          "No camera hardware detected. Use 'Upload Card Photo' or try the sample test cards below."
        );
      } else {
        setCameraError(
          `Unable to access camera (${err.message || "Unknown error"}). Try uploading an image instead.`
        );
      }
      setCameraActive(false);
    }
  }, [facingMode, scanVideoFrame, stopCameraStream]);

  // Toggle torch/flashlight
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        const nextState = !torchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextState } as any],
        });
        setTorchOn(nextState);
        playHapticSound("click");
      } catch (e) {
        console.warn("Failed to toggle torch:", e);
      }
    }
  };

  // Flip camera
  const toggleFacingMode = () => {
    playHapticSound("click");
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Switch tabs & manage stream lifecycle
  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
      setScannedResult(null);
      setMatchedExistingCase(undefined);
      setScanSuccessAnim(false);
      return;
    }

    if (activeTab === "camera" && !scannedResult) {
      startCameraStream();
    } else {
      stopCameraStream();
    }

    return () => {
      stopCameraStream();
    };
  }, [isOpen, activeTab, scannedResult, startCameraStream, stopCameraStream]);

  // Handle image upload scanning
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    playHapticSound("click");
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            handleDecodedString(code.data);
          } else {
            alert(
              "No valid QR code was detected in this photo. Please make sure the QR code on the patient's card is clear and well-lit, or use one of the 1-click sample cards!"
            );
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Select sample card
  const handleSelectSampleCard = (card: SampleMedicalCard) => {
    playHapticSound("click");
    handleDecodedString(card.payloadString);
  };

  // Confirm and apply scanned data to intake workflow
  const handleApplyScannedData = () => {
    if (!scannedResult) return;
    playHapticSound("success");
    onPatientIdentified(scannedResult, matchedExistingCase);
    onClose();
  };

  // Scan again
  const handleScanAgain = () => {
    playHapticSound("click");
    setScannedResult(null);
    setMatchedExistingCase(undefined);
    setScanSuccessAnim(false);
    if (activeTab === "camera") {
      startCameraStream();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden text-left flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header Strip */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center shadow-2xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900">
                  Medical ID Card Scanner
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold border border-blue-200">
                  ABHA / Ayushman
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Scan patient's national health card, rural clinic ID, or ArogyaSeva QR
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Navigation Tabs */}
        {!scannedResult && (
          <div className="flex border-b border-slate-200 bg-slate-100/70 px-4 pt-2 shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("camera")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "camera"
                  ? "bg-white text-blue-700 shadow-2xs border-t-2 border-blue-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Live Camera Scanner</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "upload"
                  ? "bg-white text-blue-700 shadow-2xs border-t-2 border-blue-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload Card Photo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("samples")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "samples"
                  ? "bg-white text-blue-700 shadow-2xs border-t-2 border-blue-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Sample Medical Cards (Demo)</span>
            </button>
          </div>
        )}

        {/* Main Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {/* ============================================================
              STATE 1: SCANNED PATIENT RESULT VIEW
              ============================================================ */}
          {scannedResult ? (
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
              {/* Verification Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                      Medical ID Successfully Verified
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-bold">
                      Format: {scannedResult.format}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-emerald-950 mt-0.5">
                    {scannedResult.patientName}
                  </h3>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Identity records decoded and matched with frontline health registry.
                  </p>
                </div>
              </div>

              {/* Matched Existing Record Notice if available */}
              {matchedExistingCase && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-700 space-y-1">
                    <div className="font-bold text-blue-900 flex items-center gap-2">
                      <span>Existing Registered Patient History Found!</span>
                      <span className="font-mono text-[10px] bg-blue-200/70 text-blue-800 px-1.5 py-0.5 rounded">
                        ID: {matchedExistingCase.id}
                      </span>
                    </div>
                    <p className="text-slate-600">
                      Last clinical screening:{" "}
                      <span className="font-semibold">
                        {new Date(matchedExistingCase.createdAt).toLocaleDateString()}
                      </span>{" "}
                      • Risk:{" "}
                      <span
                        className={`font-bold ${
                          matchedExistingCase.riskLevel === "URGENT"
                            ? "text-red-600"
                            : matchedExistingCase.riskLevel === "CONSULTATION"
                            ? "text-amber-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {matchedExistingCase.riskLevel}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-500 italic">
                      Clinical Impression: {matchedExistingCase.clinicalImpression}
                    </p>
                  </div>
                </div>
              )}

              {/* Patient Demographics Card Grid */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-4">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Decoded Clinical Demographics
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">
                      Age & Gender
                    </span>
                    <span className="font-bold text-slate-800 text-sm">
                      {scannedResult.age} Yrs • {scannedResult.gender}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">
                      ABHA / Health ID
                    </span>
                    <span className="font-mono font-bold text-blue-700 text-sm truncate block">
                      {scannedResult.abhaId || "ABHA-LOCAL-REG"}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">
                      Village / Location
                    </span>
                    <span className="font-bold text-slate-800 text-sm truncate block">
                      {scannedResult.village || "Sub-Centre"}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">
                      Blood Group
                    </span>
                    <span className="font-bold text-rose-600 text-sm">
                      {scannedResult.bloodGroup || "Not Recorded"}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">
                      Contact Number
                    </span>
                    <span className="font-bold text-slate-800 text-sm font-mono">
                      {scannedResult.contactNumber || "None"}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">
                      Maternal Status
                    </span>
                    <span className="font-bold text-slate-800 text-sm">
                      {scannedResult.isPregnant
                        ? `Pregnant (${scannedResult.pregnancyWeeks || 30}w)`
                        : "No"}
                    </span>
                  </div>
                </div>

                {/* Chronic conditions & allergies badges */}
                {(scannedResult.chronicConditions?.length ||
                  scannedResult.allergies?.length ||
                  scannedResult.currentMedications?.length) && (
                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    {scannedResult.chronicConditions &&
                      scannedResult.chronicConditions.length > 0 && (
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                            Pre-Existing Conditions
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {scannedResult.chronicConditions.map((c, i) => (
                              <span
                                key={i}
                                className="text-xs px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-semibold border border-amber-200"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    {scannedResult.allergies && scannedResult.allergies.length > 0 && (
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                          Known Allergies
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {scannedResult.allergies.map((a, i) => (
                            <span
                              key={i}
                              className="text-xs px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 font-semibold border border-rose-200"
                            >
                              ⚠ {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleScanAgain}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Scan Another Card</span>
                </button>

                <button
                  type="button"
                  onClick={handleApplyScannedData}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-200 cursor-pointer"
                >
                  <span>Apply & Start Clinical Intake</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* ============================================================
                  TAB 1: LIVE CAMERA SCANNER
                  ============================================================ */}
              {activeTab === "camera" && (
                <div className="space-y-4">
                  {cameraError ? (
                    <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center">
                        <CameraOff className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">
                        Camera Stream Unavailable
                      </h4>
                      <p className="text-xs text-slate-600 max-w-md mx-auto">
                        {cameraError}
                      </p>
                      <div className="flex justify-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => startCameraStream()}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Retry Camera</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("samples")}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Use Sample Medical Cards</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-slate-800 aspect-[4/3] max-h-[380px] flex items-center justify-center">
                      {/* Video Stream Element */}
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                      />
                      {/* Hidden canvas for jsQR analysis */}
                      <canvas ref={canvasRef} className="hidden" />

                      {/* Viewfinder Overlay & Framing Box */}
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                        {/* Shaded backdrop */}
                        <div className="relative w-64 sm:w-80 h-44 sm:h-52 rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                          {/* Corner Reticles */}
                          <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg" />
                          <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg" />
                          <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg" />
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-lg" />

                          {/* Laser Scanner Line Animation */}
                          <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#06B6D4] animate-bounce-laser" />

                          {/* ID Card Target Watermark */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40 gap-1.5">
                            <QrCode className="w-8 h-8 opacity-60" />
                            <span className="text-[10px] font-mono tracking-widest uppercase">
                              Align Medical ID QR
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Camera Controls Overlay */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs pointer-events-auto">
                        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-[11px] font-semibold">
                            Scanning Video...
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {hasTorchSupport && (
                            <button
                              type="button"
                              onClick={toggleTorch}
                              className={`p-2 rounded-full backdrop-blur-md transition-colors cursor-pointer ${
                                torchOn
                                  ? "bg-amber-400 text-slate-900"
                                  : "bg-black/60 text-white hover:bg-black/80"
                              }`}
                              title="Toggle Flashlight"
                            >
                              {torchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={toggleFacingMode}
                            className="p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white transition-colors cursor-pointer"
                            title="Flip Camera (Rear / Front)"
                          >
                            <SwitchCamera className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                    <span>Point at patient's Ayushman Bharat, ABHA card, or slip.</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab("samples")}
                      className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>No card? Try sample cards</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================================
                  TAB 2: UPLOAD CARD PHOTO
                  ============================================================ */}
              {activeTab === "upload" && (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-blue-50/20 space-y-3"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 mx-auto flex items-center justify-center">
                      <Upload className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        Upload Photo of Medical ID Card
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        Select a photo taken on your phone or tablet. The scanner will automatically locate and parse the QR code.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
                    >
                      Choose Photo File
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>

                  <div className="text-[11px] text-slate-400 text-center">
                    Supports PNG, JPG, WEBP formats. High contrast and good lighting recommended.
                  </div>
                </div>
              )}

              {/* ============================================================
                  TAB 3: SAMPLE MEDICAL CARDS (INSTANT 1-CLICK DEMO)
                  ============================================================ */}
              {activeTab === "samples" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Frontline Patient Demo Registry
                      </h4>
                      <p className="text-xs text-slate-600">
                        Select any card below to simulate instant scanning, or scan the QR on screen with another phone:
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {SAMPLE_MEDICAL_CARDS.map((card) => {
                      const qrUrl = sampleQrs[card.id];
                      return (
                        <div
                          key={card.id}
                          className="bg-white rounded-2xl border-2 border-slate-200 hover:border-blue-400 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3 text-left group"
                        >
                          <div className="flex items-start gap-3">
                            {/* Mini Scannable QR */}
                            <div className="w-20 h-20 bg-slate-50 p-1 rounded-xl border border-slate-200 shrink-0 flex items-center justify-center">
                              {qrUrl ? (
                                <img
                                  src={qrUrl}
                                  alt="Card QR"
                                  className="w-full h-full object-contain rounded"
                                />
                              ) : (
                                <QrCode className="w-8 h-8 text-slate-300 animate-pulse" />
                              )}
                            </div>

                            {/* Card Details */}
                            <div className="flex-1 min-w-0 space-y-1">
                              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                {card.cardTitle.split("-")[0]}
                              </span>
                              <h5 className="text-sm font-black text-slate-900 truncate">
                                {card.patientName}
                              </h5>
                              <p className="text-[11px] text-slate-500">
                                {card.age} Yrs • {card.gender} • {card.bloodGroup}
                              </p>
                              <p className="text-[10px] font-mono text-blue-700 truncate">
                                {card.abhaId}
                              </p>
                              {card.isPregnant && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 inline-block">
                                  Maternal ({card.pregnancyWeeks}w)
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quick Scan Button */}
                          <button
                            type="button"
                            onClick={() => handleSelectSampleCard(card)}
                            className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5 text-cyan-300" />
                            <span>Scan This Card</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-700 text-[11px]">
              Privacy Protected • Offline Secure
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
