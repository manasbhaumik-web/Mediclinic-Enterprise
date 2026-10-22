import React, { useState } from 'react';
import Button from '../ui/Button';
import { useInventoryActions } from '../../hooks/useInventoryData';
import { CONTROL_CLASSES, ControlClass, DrugItem } from '../../domain/inventory';
import { Dialog, Field, Notice, errorMessage, inputClass } from './shared';

const CATEGORIES = ['Analgesics', 'Antibiotics', 'Antihistamines', 'Antihypertensives', 'Antidiabetics', 'Cardiovascular', 'Dermatological', 'Gastrointestinal', 'Respiratory', 'Vitamins & Minerals', 'Supplies', 'General'];

/** Add or edit a drug. Stock is never entered here: it is received as a batch. */
export default function DrugForm({ drug, role, onClose }: { drug?: DrugItem | null; role: 'admin' | 'pharmacist'; onClose: () => void }) {
  const api = useInventoryActions();
  const [f, setF] = useState({
    name: drug?.name ?? '', genericName: drug?.genericName ?? '', category: drug?.category ?? 'General', drugType: drug?.drugType ?? '', manufacturer: drug?.manufacturer ?? '',
    unit: drug?.unit ?? 'tablet', price: String(drug?.price ?? ''), costPrice: drug?.costPrice == null ? '' : String(drug.costPrice),
    minThreshold: String(drug?.minThreshold ?? 0), reorderQuantity: drug?.reorderQuantity == null ? '' : String(drug.reorderQuantity),
    indications: drug?.indications ?? '', sideEffects: drug?.sideEffects ?? '', adults: drug?.suggestedDosage?.adults ?? '', children: drug?.suggestedDosage?.children ?? '',
    registerRequired: drug?.registerRequired ?? false, controlClass: (drug?.controlClass ?? '') as ControlClass | '',
  });
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const save = async () => {
    setErr(null);
    try {
      await api.saveDrug.mutateAsync({
        id: drug?.id ?? null,
        data: {
          name: f.name, generic_name: f.genericName, category: f.category, drug_type: f.drugType, manufacturer: f.manufacturer, unit: f.unit,
          price: f.price, cost_price: f.costPrice, min_threshold: f.minThreshold, reorder_quantity: f.reorderQuantity,
          indications: f.indications, side_effects: f.sideEffects, suggested_dosage: { adults: f.adults, children: f.children },
          register_required: f.registerRequired, control_class: f.registerRequired ? f.controlClass : null,
        },
      });
      onClose();
    } catch (e) { setErr(errorMessage(e)); }
  };

  return (
    <Dialog title={drug ? `Edit ${drug.name}` : 'Add a drug'} onClose={onClose} wide>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Name (as prescribed)"><input className={inputClass} value={f.name} onChange={set('name')} placeholder="e.g. Paracetamol 500mg Tablet" /></Field>
        <Field label="Generic name"><input className={inputClass} value={f.genericName} onChange={set('genericName')} /></Field>
        <Field label="Category"><input className={inputClass} list="drug-categories" value={f.category} onChange={set('category')} /><datalist id="drug-categories">{CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist></Field>
        <Field label="Form"><input className={inputClass} value={f.drugType} onChange={set('drugType')} placeholder="Tablet, Syrup, Cream…" /></Field>
        <Field label="Manufacturer"><input className={inputClass} value={f.manufacturer} onChange={set('manufacturer')} /></Field>
        <Field label="Unit of stock"><input className={inputClass} value={f.unit} onChange={set('unit')} placeholder="tablet, bottle, tube…" /></Field>
        <Field label="Selling price per unit (RM)"><input className={inputClass} type="number" min="0" step="0.01" value={f.price} onChange={set('price')} /></Field>
        <Field label="Cost price per unit (RM)"><input className={inputClass} type="number" min="0" step="0.01" value={f.costPrice} onChange={set('costPrice')} /></Field>
        <Field label="Reorder level (alert at or below)"><input className={inputClass} type="number" min="0" value={f.minThreshold} onChange={set('minThreshold')} /></Field>
        <Field label="Usual reorder quantity"><input className={inputClass} type="number" min="1" value={f.reorderQuantity} onChange={set('reorderQuantity')} placeholder="Optional" /></Field>
        <Field label="Adult dosage"><input className={inputClass} value={f.adults} onChange={set('adults')} /></Field>
        <Field label="Children's dosage"><input className={inputClass} value={f.children} onChange={set('children')} /></Field>
      </div>
      <Field label="Indications"><textarea className={`${inputClass} h-14`} value={f.indications} onChange={set('indications')} /></Field>
      <Field label="Side effects"><textarea className={`${inputClass} h-14`} value={f.sideEffects} onChange={set('sideEffects')} /></Field>

      <div className="border border-line-subtle p-3 space-y-2 bg-surface-accent">
        <label className="flex items-center gap-2 text-xs font-bold text-ink">
          <input type="checkbox" disabled={role !== 'admin'} checked={f.registerRequired} onChange={(e) => setF({ ...f, registerRequired: e.target.checked })} />
          Controlled drug: keep in the controlled-drug register
        </label>
        {f.registerRequired && (
          <Field label="Control class">
            <select className={inputClass} disabled={role !== 'admin'} value={f.controlClass} onChange={set('controlClass')}>
              <option value="">Choose…</option>
              {CONTROL_CLASSES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Field>
        )}
        <p className="text-2xs text-subtle leading-relaxed">
          Every receipt, dispense, disposal and correction of a controlled drug is written to the register with a running balance and needs a second person's signature. Dispensing records the patient and the prescriber.
          {role !== 'admin' && ' Only an administrator can change this setting.'} Pick the class that applies under Malaysian law; the system does not decide it for you.
        </p>
      </div>

      {err && <Notice ok={false}>{err}</Notice>}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={save} disabled={api.saveDrug.isPending}>{drug ? 'Save changes' : 'Add drug'}</Button>
      </div>
    </Dialog>
  );
}
