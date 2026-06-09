import React, { useState, useRef, useEffect } from 'react';
import { Camera, ShieldAlert, CheckCircle, RefreshCw, Sparkles } from 'lucide-react';

interface MyKadData {
  fullName: string;
  icNumber: string;
  gender: 'Male' | 'Female';
  dob: string;
  address: string;
}

interface MyKadScannerProps {
  onScanComplete: (data: MyKadData) => void;
  onClose: () => void;
}

const MOCK_KADS: MyKadData[] = [
  {
    fullName: 'Mohd Hafiz bin Razali',
    icNumber: '881105-14-5391',
    gender: 'Male',
    dob: '1988-11-05',
    address: 'No 24, Jalan Keramat Indah 5, Kampung Datuk Keramat, 54000 Kuala Lumpur'
  },
  {
    fullName: 'Siti Aminah binti Yusof',
    icNumber: '920412-10-5884',
    gender: 'Female',
    dob: '1992-04-12',
    address: 'Apartment Dahlia B-3-12, Jalan Pandan Indah 24, 55100 Ampang, Selangor'
  },
  {
    fullName: 'Tan Wei Seng',
    icNumber: '750821-08-6213',
    gender: 'Male',
    dob: '1975-08-21',
    address: '77, Lorong Bukit Rimau 14, Kota Kemuning, 40460 Shah Alam, Selangor'
  },
  {
    fullName: 'Nisha Pillay a/p Subramaniam',
    icNumber: '960228-08-5924',
    gender: 'Female',
    dob: '1996-02-28',
    address: 'Lot 451, Jalan Sentul Hilir, Sentul, 51100 Kuala Lumpur, WP Kuala Lumpur'
  }
];

export default function MyKadScanner({ onScanComplete, onClose }: MyKadScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [selectedKad, setSelectedKad] = useState<MyKadData>(MOCK_KADS[0]);
  const [videoStreamActive, setVideoStreamActive] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Keyboard support or automatic simulation timers
  useEffect(() => {
    let stream: MediaStream | null = null;
    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setVideoStreamActive(true);
        }
      } catch (err) {
        console.log("Using polished simulation scanner instead of hardware camera: ", err);
        setVideoStreamActive(false);
      }
    }
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const triggerScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(0);
    setScanSuccess(false);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsScanning(false);
            setScanSuccess(true);
            setTimeout(() => {
              onScanComplete(selectedKad);
            }, 1000);
          }, 400);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  return (
    <div id="mykad-scanner-modal" className="fixed inset-0 bg-slate-900/75 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-[#07B2B2] px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-300" />
            <h3 className="font-semibold tracking-wide">MyKad Smart OCR & Reader</h3>
          </div>
          <button 
            id="close-scanner-btn" 
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors text-xl font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Diagnostic Simulator Area */}
        <div className="p-5 space-y-4">
          <div className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              <strong>Smart PWA Simulation</strong> Mode active. Select a simulated Malaysian citizen ID chip sequence below, then test the real-time card capture triggers.
            </span>
          </div>

          {/* Scanner Window Screen */}
          <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-950 border-2 border-[#07B2B2] shadow-inner flex flex-col items-center justify-center text-white">
            {videoStreamActive ? (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="absolute inset-0 w-full h-full object-cover opacity-80"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-radial from-slate-900 to-slate-950">
                <Camera className="w-10 h-10 text-cyan-500 animate-pulse mb-2" />
                <span className="text-xs font-mono text-slate-400">PWA CHIP OCR ACTIVE</span>
                <span className="text-[10px] text-slate-500 mt-1">Align Malaysian IC with blue frame markings</span>
              </div>
            )}

            {/* Simulated frame overlay */}
            <div className="absolute inset-8 border border-dashed border-cyan-500 rounded flex items-center justify-center pointer-events-none">
              <div className="w-8 h-8 absolute top-0 left-0 border-t-2 border-l-2 border-cyan-400"></div>
              <div className="w-8 h-8 absolute top-0 right-0 border-t-2 border-r-2 border-cyan-400"></div>
              <div className="w-8 h-8 absolute bottom-0 left-0 border-b-2 border-l-2 border-cyan-400"></div>
              <div className="w-8 h-8 absolute bottom-0 right-0 border-b-2 border-r-2 border-cyan-400"></div>

              {/* Laser line scan animated */}
              {isScanning && (
                <div 
                  className="absolute w-full h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-bounce"
                  style={{ top: `${scanProgress}%` }}
                />
              )}
            </div>

            {/* Chip Reader Highlight */}
            <div className="absolute top-1/2 left-8 w-12 h-10 border border-amber-500 bg-amber-500/10 rounded pointer-events-none flex items-center justify-center">
              <span className="text-[8px] font-mono text-amber-400 uppercase tracking-tight">CHIP RFID</span>
            </div>

            {/* Scanned result indicator splash */}
            {scanSuccess && (
              <div className="absolute inset-0 bg-[#07B2B2]/90 flex flex-col items-center justify-center text-white transition-opacity duration-300">
                <CheckCircle className="w-12 h-12 text-cyan-400 animate-bounce mb-2" />
                <span className="font-mono text-sm tracking-wide font-semibold text-emerald-300">CARD CHIP READ!</span>
                <span className="text-xs text-emerald-100 font-mono mt-1">{selectedKad.fullName}</span>
                <span className="text-[10px] text-[#86efac] mt-0.5">{selectedKad.icNumber}</span>
              </div>
            )}
          </div>

          {/* Quick Mock Card Selectors */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-slate-500 animate-spin-slow" />
              Select Malaysian MyKad to load into RFID Reader:
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {MOCK_KADS.map((kad) => (
                <button
                  key={kad.icNumber}
                  type="button"
                  onClick={() => {
                    setSelectedKad(kad);
                    setScanSuccess(false);
                  }}
                  className={`p-2.5 rounded-lg border text-left flex flex-col transition-all cursor-pointer ${
                    selectedKad.icNumber === kad.icNumber 
                      ? 'border-[#07B2B2] bg-cyan-50/50 text-[#07B2B2] font-medium ring-2 ring-cyan-600/10' 
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className="font-medium truncate">{kad.fullName}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">{kad.icNumber}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Progress gauge bar */}
          {isScanning && (
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-[#07B2B2] h-2 transition-all duration-150"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          )}

          {/* Prompt info */}
          <div className="text-[10px] text-slate-400 bg-slate-50 p-2 rounded text-center">
            PWA biometric validation connects over ISO/IEC 7816 chip reader protocols.
          </div>
        </div>

        {/* Actions bar */}
        <div className="bg-slate-50 px-5 py-3.5 flex items-center justify-end gap-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            id="simulate-scan-start-btn"
            onClick={triggerScan}
            disabled={isScanning}
            className="bg-[#07B2B2] text-white px-5 py-2 rounded-lg text-xs font-medium hover:bg-[#058A8A] transition-colors flex items-center gap-2 focus:ring-2 focus:ring-cyan-600 focus:outline-none cursor-pointer disabled:opacity-60"
          >
            <Camera className="w-4 h-4" />
            {isScanning ? `${scanProgress}% Extracting Data...` : 'Initialize MyKad Scan'}
          </button>
        </div>

      </div>
    </div>
  );
}
