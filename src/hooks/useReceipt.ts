import { useCallback } from 'react';
import { useSettings } from '../context/SettingsContext';
import { ReceiptSource, buildReceipt } from '../domain/receipt';

/** Returns a function that prints a receipt for a stored payment, using the clinic profile in Settings. */
export function useReceiptPrinter() {
  const { clinic } = useSettings();
  return useCallback((source: ReceiptSource) => {
    const receipt = buildReceipt(source, {
      name: clinic.name, branch: clinic.branch, address: clinic.address, phone: clinic.phone, licenseNo: clinic.licenseNo,
    });
    // jsPDF is loaded on demand to keep it out of the billing screen bundle.
    import('../utils/receiptPdf')
      .then(({ downloadReceiptPdf }) => downloadReceiptPdf(receipt))
      .catch((err) => console.error('Receipt PDF failed', err));
  }, [clinic]);
}
