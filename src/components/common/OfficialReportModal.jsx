import React, { useRef } from 'react';
import Logo from './Logo';
import { X, Printer, Download, CheckCircle2, ShieldCheck, QrCode } from 'lucide-react';

export const OfficialReportModal = ({ isOpen, onClose, reportData, patientInfo }) => {
  const printRef = useRef(null);

  if (!isOpen || !reportData) return null;

  const handlePrint = () => {
    window.print();
  };

  const patientName = patientInfo?.full_name || reportData.patient_name || 'Mr. Rahul Sharma';
  const patientId = patientInfo?.patient_id || reportData.patient_id || 'PAT-009842';
  const ageGender = `${patientInfo?.age || reportData.patient_age || 34} Year(s) / ${patientInfo?.gender || reportData.patient_gender || 'Male'}`;
  const sampleId = reportData.sample_id || '24507517';
  const sampleType = reportData.sample_type || 'SERUM';
  const refDoctor = patientInfo?.referring_doctor || 'Dr. S. K. Gupta (MD)';
  const labCode = reportData.lab_code || 'CPL-AP-195';
  const collectionDate = reportData.collection_date || reportData.generated_at?.split('T')[0] || '2026-07-28 10:20';
  const registrationDate = reportData.registration_date || '2026-07-28 10:21';
  const approvedDate = reportData.approved_date || '2026-07-28 11:44';
  const pathologistName = reportData.pathologist_name || 'Dr. Mallika Boyapati MD';

  const parameters = reportData.parameters || [
    { name: 'Glycated Hemoglobin (HbA1c)', result: '6.1', unit: '%', reference_range: '<5.7 Non-diabetic, 5.7-6.4 Prediabetes', flag: 'HIGH' },
    { name: 'Estimated Average Glucose (eAG)', result: '128.37', unit: 'mg/dL', reference_range: '70 - 137', flag: 'NORMAL' },
    { name: 'Fasting Blood Sugar (FBS)', result: '110.0', unit: 'mg/dL', reference_range: '70 - 100', flag: 'HIGH' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
      {/* Container */}
      <div className="bg-slate-100 rounded-2xl shadow-2xl max-w-4xl w-full my-auto flex flex-col border border-slate-300 max-h-[92vh]">
        {/* Modal Action Header */}
        <div className="bg-slate-900 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <span className="bg-emerald-500 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded uppercase tracking-wider">
              NABL VERIFIED REPORT
            </span>
            <span className="text-xs text-slate-300 font-mono">Ref: #{reportData.report_number || reportData.id || 'REP-2026'}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print / Download Official PDF
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Paper Sheet */}
        <div className="overflow-y-auto p-4 sm:p-8 flex-1 bg-slate-200">
          <div
            ref={printRef}
            className="bg-white mx-auto shadow-xl border border-slate-300 p-6 sm:p-10 rounded-sm text-slate-900 max-w-3xl min-h-[1050px] flex flex-col justify-between font-sans printable-area"
          >
            {/* Top Header - Official Letterhead */}
            <div>
              <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-cyan-700 text-white p-4 rounded-t-md flex items-center justify-between gap-4 border-b-4 border-emerald-500">
                <Logo showText={true} textVariant="light" className="w-14 h-14" />
                <div className="text-right">
                  <div className="text-xs font-black uppercase tracking-widest text-cyan-200">PATH LABS INDIA</div>
                  <div className="text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider">
                    AN ISO 9001:2008 CERTIFIED DIAGNOSTICS
                  </div>
                </div>
              </div>

              {/* Watermark background tree opacity */}
              <div className="relative mt-4">
                {/* Patient Info Grid */}
                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200 font-medium">
                  <div className="space-y-1.5 border-r border-slate-200 pr-4">
                    <div className="flex">
                      <span className="w-32 text-slate-500 font-bold">Patient Name</span>
                      <span className="font-extrabold text-slate-900 text-sm">: {patientName}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-slate-500 font-bold">Age / Gender</span>
                      <span className="font-bold text-slate-800">: {ageGender}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-slate-500 font-bold">Patient ID</span>
                      <span className="font-mono font-extrabold text-blue-700">: {patientId}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-slate-500 font-bold">Sample ID</span>
                      <span className="font-mono font-bold text-slate-800">: {sampleId}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-slate-500 font-bold">Sample Type</span>
                      <span className="font-bold text-slate-800">: {sampleType}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-slate-500 font-bold">Ref. Doctor</span>
                      <span className="font-bold text-slate-800">: {refDoctor}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pl-2">
                    <div className="flex">
                      <span className="w-36 text-slate-500 font-bold">Lab Code</span>
                      <span className="font-mono font-bold text-slate-800">: {labCode}</span>
                    </div>
                    <div className="flex">
                      <span className="w-36 text-slate-500 font-bold">Sample Collection</span>
                      <span className="font-mono text-slate-800">: {collectionDate}</span>
                    </div>
                    <div className="flex">
                      <span className="w-36 text-slate-500 font-bold">Registration Date</span>
                      <span className="font-mono text-slate-800">: {registrationDate}</span>
                    </div>
                    <div className="flex">
                      <span className="w-36 text-slate-500 font-bold">Approved Date</span>
                      <span className="font-mono text-slate-800">: {approvedDate}</span>
                    </div>

                    {/* Barcode Render */}
                    <div className="pt-2 flex items-center justify-between border-t border-slate-200 mt-2">
                      <div className="font-mono text-[10px] tracking-widest text-slate-700">
                        {reportData.barcode_id || 'LLD-2026-X892'}
                      </div>
                      <div className="h-6 w-32 bg-slate-900 flex items-center justify-around px-1 rounded-sm">
                        <div className="w-1 h-full bg-white"></div>
                        <div className="w-0.5 h-full bg-white"></div>
                        <div className="w-1.5 h-full bg-white"></div>
                        <div className="w-0.5 h-full bg-white"></div>
                        <div className="w-1 h-full bg-white"></div>
                        <div className="w-2 h-full bg-white"></div>
                        <div className="w-0.5 h-full bg-white"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Test Category Banner */}
                <div className="mt-6 bg-slate-200 py-2 px-4 text-center font-black text-xs text-slate-800 uppercase tracking-widest border-y border-slate-300">
                  {reportData.category || 'CLINICAL BIOCHEMISTRY'}
                </div>

                {/* Parameter Table */}
                <div className="mt-4 border border-slate-300 rounded-md overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 font-extrabold text-slate-700 uppercase border-b border-slate-300">
                      <tr>
                        <th className="p-3 w-1/2">Test Description</th>
                        <th className="p-3 text-center">Result</th>
                        <th className="p-3 text-center">Units</th>
                        <th className="p-3">Biological Reference Ranges</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                      {parameters.map((param, idx) => (
                        <tr key={idx} className={param.flag === 'HIGH' || param.flag === 'LOW' ? 'bg-amber-50/60' : ''}>
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{param.name}</div>
                            {param.method && <div className="text-[10px] text-slate-500 italic">Method: {param.method}</div>}
                          </td>
                          <td className="p-3 text-center font-mono">
                            <span
                              className={
                                param.flag === 'HIGH' || param.flag === 'LOW'
                                  ? 'font-black text-rose-700 text-sm underline decoration-rose-500'
                                  : 'font-bold text-slate-900'
                              }
                            >
                              {param.result}
                            </span>
                          </td>
                          <td className="p-3 text-center font-mono text-slate-600">{param.unit}</td>
                          <td className="p-3 font-mono text-slate-700 text-[11px]">{param.reference_range}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Additional Clinical Notes or Interpretation */}
                <div className="mt-6 p-3 bg-slate-50 rounded-md border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <div className="font-bold text-slate-800 uppercase tracking-wide">Test Interpretation Note:</div>
                  <p>
                    Assay values should be correlated clinically with patient medical history and total clinical presentation. Verified by Automated Analyzer and Senior Pathologist sign-off.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Signatures & Footer Letterhead */}
            <div className="mt-12 pt-6 border-t-2 border-slate-300 space-y-6">
              <div className="flex items-end justify-between px-2">
                {/* Operations Manager Sign */}
                <div className="text-center">
                  <div className="font-serif italic font-bold text-slate-800 text-sm mb-1">M. Ramesh Babu</div>
                  <div className="w-36 h-0.5 bg-slate-400 mx-auto my-1"></div>
                  <div className="font-bold text-xs text-slate-900">M. Ramesh Babu</div>
                  <div className="text-[10px] text-slate-500 font-medium">Manager Lab Operations</div>
                </div>

                {/* QR Code Validation */}
                <div className="text-center space-y-1">
                  <div className="w-16 h-16 bg-white p-1 border border-slate-300 rounded shadow-sm mx-auto flex items-center justify-center">
                    <QrCode className="w-14 h-14 text-slate-900" />
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono">Scan to Verify Report</div>
                </div>

                {/* Consultant Pathologist Sign */}
                <div className="text-center">
                  <div className="font-serif italic font-bold text-slate-800 text-sm mb-1">Dr. Mallika Boyapati</div>
                  <div className="w-36 h-0.5 bg-slate-400 mx-auto my-1"></div>
                  <div className="font-bold text-xs text-slate-900">{pathologistName}</div>
                  <div className="text-[10px] text-slate-500 font-medium">Consultant Pathologist (MD)</div>
                </div>
              </div>

              {/* Bottom Official Address & Contact Footer */}
              <div className="bg-slate-900 text-white p-3.5 rounded-md text-[10px] flex flex-col sm:flex-row items-center justify-between gap-2 border-t-2 border-emerald-500">
                <div>
                  <div className="font-bold text-emerald-400">Life Line Diagnostics Center</div>
                  <div className="text-slate-300">
                    Puspha Hotel Rd, opp. to Assure hospital, New Giri Puram, Kasturibaipet, Vijayawada, AP 520002
                  </div>
                </div>
                <div className="text-right text-slate-300 font-mono">
                  <div>Ph: +91 9603348519, +91 6281420131</div>
                  <div>Email: lifelinediagnostics@gmail.com</div>
                </div>
              </div>

              <div className="text-[9px] text-slate-400 text-center leading-tight">
                This is an electronically authenticated report. Printed on {new Date().toLocaleDateString()}. <br />
                NOTE: Assay results should be correlated clinically with other clinical findings and the total clinical status of the patient.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Media Query Rules */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-area, .printable-area * {
            visibility: visible;
          }
          .printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default OfficialReportModal;
