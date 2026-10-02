import React, { useState } from 'react';

interface PresetCase {
  id: string;
  name: string;
  filename: string;
  docTitle: string;
  docId: string;
  date: string;
  client: string;
  paymentMethod: string;
  concept: string;
  company: string;
  nif: string;
  baseAmount: string;
  tax: string;
  total: string;
  validationText: string;
}

const PRESETS: PresetCase[] = [
  {
    id: '1',
    name: '1. Factura Proveedor (Estándar)',
    filename: 'factura_proveedor_acme_8924.pdf',
    docTitle: 'FACTURA COMERCIAL OFICIAL',
    docId: 'INV-2026-M0812',
    date: '24 de Octubre de 2026',
    client: 'Empresa Demo S.A.',
    paymentMethod: 'Transferencia a 30 días',
    concept: 'Servicios de Transporte y Logística Industrial',
    company: 'Acme Logistics Solutions S.L.',
    nif: 'B-84920394',
    baseAmount: '3.719,01 €',
    tax: '780,99 € (21%)',
    total: '4.500,00 €',
    validationText: 'Datos contrastados con la orden de compra #OC-9012. Coincidencia del 100%.',
  },
  {
    id: '2',
    name: '2. Albarán de Transporte (Escaneado)',
    filename: 'albaran_transporte_scan_04.jpg',
    docTitle: 'ALBARÁN DE ENTREGA FÍSICA',
    docId: 'ALB-883921',
    date: '28 de Septiembre de 2026',
    client: 'Distribuciones Norte S.L.',
    paymentMethod: 'Albarán sin cargo (Sujeto a factura)',
    concept: 'Despacho de 8 palés mercadería en tránsito',
    company: 'Transportes Rápidos Ibéricos S.A.',
    nif: 'A-28941049',
    baseAmount: '1.240,50 €',
    tax: '260,50 € (21%)',
    total: '1.501,00 €',
    validationText: 'Firma de recepción detectada vía visión computacional. Conforme.',
  },
  {
    id: '3',
    name: '3. Factura Internacional ($ USD)',
    filename: 'cloud_services_invoice_us.pdf',
    docTitle: 'COMMERCIAL INVOICE',
    docId: 'US-994021',
    date: '15 de Octubre de 2026',
    client: 'Daarick Systems Tech',
    paymentMethod: 'Credit Card / Auto-Debit',
    concept: 'High-Performance Cloud GPU Compute - Cluster 4',
    company: 'CloudMatrix Technologies Inc.',
    nif: 'US-EIN-94-8192039',
    baseAmount: '2.400,00 $',
    tax: '0,00 $ (Reverse Charge)',
    total: '2.400,00 $',
    validationText: 'Conversión de divisa a tipo de cambio BCE aplicada automáticamente.',
  },
];

export const DocumentExtractorDemo: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<PresetCase>(PRESETS[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState('✓ Listo para ERP');

  const handleSelect = (preset: PresetCase) => {
    setSelectedPreset(preset);
    setIsProcessing(true);
    setProcessStatus('⏳ Procesando OCR...');
    setTimeout(() => {
      setIsProcessing(false);
      setProcessStatus('✓ Listo para ERP');
    }, 300);
  };

  const simulateProcess = () => {
    setIsProcessing(true);
    setProcessStatus('⚡ Leyendo documento...');
    setTimeout(() => {
      setIsProcessing(false);
      setProcessStatus('✓ Extracción Verificada');
    }, 400);
  };

  return (
    <div className="rounded-2xl bg-[rgba(26,15,30,0.95)] border border-[rgba(147,80,115,0.4)] shadow-2xl overflow-hidden backdrop-blur-xl">
      {/* Window Title Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[rgba(21,10,25,0.95)] border-b border-[rgba(147,80,115,0.3)] select-none">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
          <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
          <span className="ml-3 font-mono text-xs text-[#c084fc]">
            [ SIMULADOR INTERACTIVO // PRUÉBALO TÚ MISMO ]
          </span>
        </div>
        <span className="font-mono text-xs text-[#10B981]">
          [ ● {processStatus} ]
        </span>
      </div>

      <div className="p-4 sm:p-6 flex flex-col gap-6">
        {/* Preset Selector */}
        <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-[rgba(147,80,115,0.25)]">
          <span className="font-mono text-xs text-[rgba(246,219,192,0.65)] mr-2">
            // SELECCIONA UN CASO:
          </span>
          {PRESETS.map((preset) => {
            const isSelected = preset.id === selectedPreset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelect(preset)}
                className={`px-3 py-1.5 rounded font-mono text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#c084fc] text-[#500989] font-bold shadow-md'
                    : 'bg-[rgba(80,45,85,0.25)] hover:bg-[rgba(80,45,85,0.4)] text-[#F6DBC0]'
                }`}
              >
                {preset.name}
              </button>
            );
          })}
        </div>

        {/* Split Screen: Left PDF Preview vs Right AI Extraction */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Original Received Document Preview */}
          <div className="flex flex-col gap-3 p-4 rounded-xl bg-[rgba(15,7,18,0.85)] border border-[rgba(147,80,115,0.3)]">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-[#ddb8ff] flex items-center gap-1">
                📄 Documento original recibido
              </span>
              <span className="text-[rgba(246,219,192,0.65)] bg-[rgba(80,45,85,0.3)] px-2 py-0.5 rounded">
                {selectedPreset.filename}
              </span>
            </div>

            {/* Document Graphic Mockup */}
            <div className="p-5 rounded-lg bg-[rgba(26,15,30,0.9)] border border-[rgba(147,80,115,0.25)] flex flex-col gap-3 font-mono text-xs">
              <div className="flex justify-between items-start pb-2 border-b border-[rgba(147,80,115,0.2)]">
                <div>
                  <div className="font-bold text-[#F8F4E9] text-sm">
                    {selectedPreset.docTitle}
                  </div>
                  <div className="text-[rgba(246,219,192,0.65)] text-[11px] mt-0.5">
                    {selectedPreset.company}
                  </div>
                  <div className="text-[rgba(246,219,192,0.5)] text-[10px]">
                    NIF: {selectedPreset.nif}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[#c084fc] font-bold">
                    # {selectedPreset.docId}
                  </div>
                  <div className="text-[rgba(246,219,192,0.65)] text-[10px]">
                    {selectedPreset.date}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] py-1 bg-[rgba(35,23,39,0.5)] p-2 rounded">
                <div>
                  <span className="text-[rgba(246,219,192,0.5)] block">CLIENTE:</span>
                  <span className="text-[#F8F4E9]">{selectedPreset.client}</span>
                </div>
                <div>
                  <span className="text-[rgba(246,219,192,0.5)] block">PAGO:</span>
                  <span className="text-[#F8F4E9]">{selectedPreset.paymentMethod}</span>
                </div>
              </div>

              <div className="py-2 border-t border-b border-[rgba(147,80,115,0.2)] flex justify-between items-center text-[11px]">
                <span className="text-[#F6DBC0]">{selectedPreset.concept}</span>
                <span className="text-[#F8F4E9] font-bold">
                  {selectedPreset.baseAmount}
                </span>
              </div>

              <div className="flex justify-between items-center font-bold text-sm pt-1">
                <span className="text-[#F8F4E9]">TOTAL:</span>
                <span className="text-[#10B981]">{selectedPreset.total}</span>
              </div>
            </div>

            <p className="text-xs text-[rgba(246,219,192,0.6)] font-mono">
              👁 El sistema detecta tablas, importes y metadatos incluso en fotos o documentos arrugados.
            </p>
          </div>

          {/* Right: AI Structured Data for ERP */}
          <div className="flex flex-col justify-between gap-4 p-4 rounded-xl bg-[rgba(15,7,18,0.85)] border border-[rgba(147,80,115,0.3)]">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-[#10B981] flex items-center gap-1 font-semibold">
                ✓ Datos extraídos automáticamente por la IA
              </span>
              <span className="text-xs text-[#c084fc] bg-[#c084fc]/10 px-2 py-0.5 rounded border border-[#c084fc]/20">
                Listo para ERP
              </span>
            </div>

            <div className="flex flex-col gap-2.5 font-mono text-xs">
              <div className="flex justify-between p-2 rounded bg-[rgba(26,15,30,0.8)] border border-[rgba(147,80,115,0.2)]">
                <span className="text-[rgba(246,219,192,0.65)]">Empresa Emisora:</span>
                <span className="text-[#F8F4E9] font-semibold text-right">
                  {selectedPreset.company}
                </span>
              </div>

              <div className="flex justify-between p-2 rounded bg-[rgba(26,15,30,0.8)] border border-[rgba(147,80,115,0.2)]">
                <span className="text-[rgba(246,219,192,0.65)]">Identificación Fiscal:</span>
                <span className="text-[#c084fc] font-bold">{selectedPreset.nif}</span>
              </div>

              <div className="flex justify-between p-2 rounded bg-[rgba(26,15,30,0.8)] border border-[rgba(147,80,115,0.2)]">
                <span className="text-[rgba(246,219,192,0.65)]">Fecha Emisión:</span>
                <span className="text-[#F8F4E9]">{selectedPreset.date}</span>
              </div>

              <div className="flex justify-between p-2 rounded bg-[rgba(26,15,30,0.8)] border border-[rgba(147,80,115,0.2)]">
                <span className="text-[rgba(246,219,192,0.65)]">Base Imponible:</span>
                <span className="text-[#F8F4E9]">{selectedPreset.baseAmount}</span>
              </div>

              <div className="flex justify-between p-2 rounded bg-[rgba(26,15,30,0.8)] border border-[rgba(147,80,115,0.2)]">
                <span className="text-[rgba(246,219,192,0.65)]">Impuestos:</span>
                <span className="text-[#ffafd5]">{selectedPreset.tax}</span>
              </div>

              <div className="flex justify-between p-2.5 rounded bg-[rgba(35,23,39,0.9)] border border-[rgba(192,132,252,0.4)] text-sm">
                <span className="text-[#F8F4E9] font-bold">TOTAL VALIDADO:</span>
                <span className="text-[#10B981] font-bold text-base">
                  {selectedPreset.total}
                </span>
              </div>
            </div>

            {/* Validation Notice & Simulator Button */}
            <div className="flex flex-col gap-3 pt-2">
              <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-xs text-[#10B981] font-mono">
                ✓ {selectedPreset.validationText}
              </div>

              <button
                onClick={simulateProcess}
                disabled={isProcessing}
                className="w-full py-2.5 px-4 rounded-lg bg-[#c084fc] hover:bg-[#D8B4FE] text-[#500989] font-mono text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>⚡</span>
                <span>[ Simular lectura en tiempo real ]</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
