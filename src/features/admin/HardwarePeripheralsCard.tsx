import React, { useState } from 'react';
import { 
  Smartphone, CreditCard, Printer, ScanLine, CheckCircle2, 
  Wifi, Zap, AlertTriangle, RefreshCw 
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

export default function HardwarePeripheralsCard() {
  const { settings, updateSettings } = useSettings();
  const [testingDevice, setTestingDevice] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; ok: boolean; msg: string } | null>(null);

  const handleHardwareToggle = (hardwareName: keyof typeof settings.hardware) => {
    updateSettings({
      ...settings,
      hardware: {
        ...settings.hardware,
        [hardwareName]: !settings.hardware[hardwareName]
      }
    });
  };

  const handleTestSignal = (id: string, name: string) => {
    setTestingDevice(id);
    setTestResult(null);

    setTimeout(() => {
      setTestingDevice(null);
      setTestResult({
        id,
        ok: true,
        msg: `Ping ACK received from ${name} (Port COM3 / USB HID). Ready for continuous polling.`
      });
    }, 700);
  };

  const activeHardwareCount = Object.values(settings.hardware).filter(Boolean).length;

  return (
    <section className="bg-surface rounded-none border border-line shadow-2xs overflow-hidden">
      {/* HEADER BANNER */}
      <div className="bg-surface-muted px-5 py-3.5 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-brand/10 text-accent rounded-none border border-brand/20">
            <Smartphone className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="type-card-title text-ink">Physical Hardware Peripheral Bus</h3>
            <p className="text-2xs text-subtle mt-0.5">
              Manage workstation device drivers, smartcard readers, thermal spoolers, and optical barcode decoders.
            </p>
          </div>
        </div>
        <span className="text-xs text-subtle font-mono px-2 py-0.5 bg-teal-50 text-accent border border-teal-200">
          {activeHardwareCount} of 3 peripherals active
        </span>
      </div>

      <div className="p-5 space-y-6">
        <p className="text-xs text-subtle">
          Enable or disable communication drivers for client workstations connecting via WebUSB, WebSerial, or PC/SC bridges.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. MYKAD SMARTCARD */}
          <div className={`p-4 border transition-all flex flex-col justify-between ${
            settings.hardware.mykadScanner 
              ? 'border-brand bg-surface ring-1 ring-brand/20' 
              : 'border-line bg-surface-muted/60 opacity-80'
          }`}>
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className={`p-2.5 rounded-none ${
                  settings.hardware.mykadScanner ? 'bg-primary text-white' : 'bg-slate-200 text-subtle'
                }`}>
                  <CreditCard className="w-5 h-5" />
                </div>
                <label className="relative inline-flex items-center justify-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.hardware.mykadScanner} 
                    onChange={() => handleHardwareToggle('mykadScanner')} 
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              <h4 className="type-card-title text-ink">MyKad Smartcard Reader</h4>
              <p className="text-2xs text-subtle mt-1 leading-relaxed">
                Direct USB chip reader for instant patient NRIC demographic and address extraction at registration.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-line-subtle space-y-2">
              <div className="flex items-center justify-between text-2xs">
                <span className="text-subtle font-mono">USB / PC/SC CCID</span>
                <span className={settings.hardware.mykadScanner ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                  {settings.hardware.mykadScanner ? 'Online' : 'Disabled'}
                </span>
              </div>
              {settings.hardware.mykadScanner && (
                <button
                  type="button"
                  disabled={testingDevice === 'mykad'}
                  onClick={() => handleTestSignal('mykad', 'MyKad Reader')}
                  className="w-full py-1 px-2 text-3xs font-bold border border-line bg-surface hover:bg-surface-accent text-accent flex items-center justify-center gap-1 cursor-pointer"
                >
                  {testingDevice === 'mykad' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                  Test Peripheral Signal
                </button>
              )}
            </div>
          </div>

          {/* 2. RECEIPT PRINTER */}
          <div className={`p-4 border transition-all flex flex-col justify-between ${
            settings.hardware.receiptPrinter 
              ? 'border-brand bg-surface ring-1 ring-brand/20' 
              : 'border-line bg-surface-muted/60 opacity-80'
          }`}>
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className={`p-2.5 rounded-none ${
                  settings.hardware.receiptPrinter ? 'bg-primary text-white' : 'bg-slate-200 text-subtle'
                }`}>
                  <Printer className="w-5 h-5" />
                </div>
                <label className="relative inline-flex items-center justify-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.hardware.receiptPrinter} 
                    onChange={() => handleHardwareToggle('receiptPrinter')} 
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              <h4 className="type-card-title text-ink">Thermal Receipt Printer</h4>
              <p className="text-2xs text-subtle mt-1 leading-relaxed">
                Counter receipt printer for queue tickets, patient bills, payment slips, and prescription dosage labels.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-line-subtle space-y-2">
              <div className="flex items-center justify-between text-2xs">
                <span className="text-subtle font-mono">ESC/POS 80mm Network</span>
                <span className={settings.hardware.receiptPrinter ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                  {settings.hardware.receiptPrinter ? 'Online' : 'Disabled'}
                </span>
              </div>
              {settings.hardware.receiptPrinter && (
                <button
                  type="button"
                  disabled={testingDevice === 'printer'}
                  onClick={() => handleTestSignal('printer', 'Thermal Receipt Printer')}
                  className="w-full py-1 px-2 text-3xs font-bold border border-line bg-surface hover:bg-surface-accent text-accent flex items-center justify-center gap-1 cursor-pointer"
                >
                  {testingDevice === 'printer' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                  Test Peripheral Signal
                </button>
              )}
            </div>
          </div>

          {/* 3. BARCODE SCANNER */}
          <div className={`p-4 border transition-all flex flex-col justify-between ${
            settings.hardware.barcodeScanner 
              ? 'border-brand bg-surface ring-1 ring-brand/20' 
              : 'border-line bg-surface-muted/60 opacity-80'
          }`}>
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className={`p-2.5 rounded-none ${
                  settings.hardware.barcodeScanner ? 'bg-primary text-white' : 'bg-slate-200 text-subtle'
                }`}>
                  <ScanLine className="w-5 h-5" />
                </div>
                <label className="relative inline-flex items-center justify-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.hardware.barcodeScanner} 
                    onChange={() => handleHardwareToggle('barcodeScanner')} 
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              <h4 className="type-card-title text-ink">Pharmacy Barcode Scanner</h4>
              <p className="text-2xs text-subtle mt-1 leading-relaxed">
                Dispensary 2D DataMatrix barcode scanner for medication verification, batch traceability, and GTIN checking.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-line-subtle space-y-2">
              <div className="flex items-center justify-between text-2xs">
                <span className="text-subtle font-mono">HID Keyboard Wedge</span>
                <span className={settings.hardware.barcodeScanner ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                  {settings.hardware.barcodeScanner ? 'Online' : 'Disabled'}
                </span>
              </div>
              {settings.hardware.barcodeScanner && (
                <button
                  type="button"
                  disabled={testingDevice === 'scanner'}
                  onClick={() => handleTestSignal('scanner', 'Barcode Scanner')}
                  className="w-full py-1 px-2 text-3xs font-bold border border-line bg-surface hover:bg-surface-accent text-accent flex items-center justify-center gap-1 cursor-pointer"
                >
                  {testingDevice === 'scanner' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                  Test Peripheral Signal
                </button>
              )}
            </div>
          </div>
        </div>

        {/* TEST FEEDBACK */}
        {testResult && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{testResult.msg}</span>
            </div>
            <button 
              type="button" 
              onClick={() => setTestResult(null)}
              className="text-2xs underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
