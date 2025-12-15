
import React, { forwardRef } from 'react';
import { ALCApplication } from '../types';

interface Props {
  data: ALCApplication;
  currentNotarySignature?: string | null;
}

const LifeCertificateTemplate: React.ForwardRefRenderFunction<HTMLDivElement, Props> = ({ data, currentNotarySignature }, ref) => {
  const dateStr = data.attestationDate 
    ? new Date(data.attestationDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div ref={ref} className="bg-white text-gray-900 font-sans p-8 md:p-10 shadow-lg border border-gray-200 max-w-[210mm] mx-auto relative min-h-[297mm] flex flex-col">
      
      <div className="flex flex-col items-center justify-center pt-2 mb-6">
        <img 
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/240px-Emblem_of_India.svg.png" 
            alt="National Emblem of India" 
            className="h-24 object-contain mb-2"
        />
        <span className="font-bold text-lg text-gray-800 tracking-wider">सत्यमेव जयते</span>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold uppercase text-primary tracking-wide mb-2">Life Certificate</h2>
        <p className="text-sm text-gray-500 italic border-b border-gray-200 pb-4 inline-block px-8">
          (This certificate is for the purpose of pension benefits only)
        </p>
      </div>

      <div className="mb-8 text-justify leading-relaxed text-base px-2">
        <p>
          This is to certify that the person, whose particulars are given below, is alive on this 
          <span className="font-bold mx-2 border-b-2 border-gray-300 inline-block min-w-[120px] text-center text-primary">{dateStr}</span>
          and has signed/ affixed thumb impression before me.
        </p>
      </div>

      <div className="space-y-3 mb-8 flex-grow">
        <div className="flex items-baseline group">
            <span className="w-8 font-bold text-gray-500 text-sm">1.</span>
            <span className="w-48 font-semibold text-gray-700">Name</span>
            <span className="flex-1 border-b border-gray-300 pb-1 px-2 font-medium text-gray-900 uppercase">{data.pensionerName}</span>
        </div>

        <div className="flex items-baseline group">
            <span className="w-8 font-bold text-gray-500 text-sm">2.</span>
            <span className="w-48 font-semibold text-gray-700">Date & Place of Birth</span>
            <span className="flex-1 border-b border-gray-300 pb-1 px-2 font-medium text-gray-900">
                {data.dateOfBirth} {data.placeOfBirth ? `, ${data.placeOfBirth}` : ''}
            </span>
        </div>
        
        <div className="flex items-baseline group">
            <span className="w-8 font-bold text-gray-500 text-sm">3.</span>
            <span className="w-48 font-semibold text-gray-700">Father's/Spouse's Name</span>
            <span className="flex-1 border-b border-gray-300 pb-1 px-2 font-medium text-gray-900">{data.fatherHusbandName || 'N/A'}</span>
        </div>

        <div className="flex items-baseline group">
            <span className="w-8 font-bold text-gray-500 text-sm">4.</span>
            <span className="w-48 font-semibold text-gray-700">Address (Overseas)</span>
            <span className="flex-1 border-b border-gray-300 pb-1 px-2 font-medium text-gray-900">{data.overseasAddress}</span>
        </div>

        <div className="flex items-baseline group">
            <span className="w-8 font-bold text-gray-500 text-sm">5.</span>
            <span className="w-48 font-semibold text-gray-700">Contact No.</span>
            <span className="flex-1 border-b border-gray-300 pb-1 px-2 font-medium text-gray-900">{data.phoneNumber}</span>
        </div>

        <div className="flex items-baseline group">
            <span className="w-8 font-bold text-gray-500 text-sm">6.</span>
            <span className="w-48 font-semibold text-gray-700">Email ID</span>
            <span className="flex-1 border-b border-gray-300 pb-1 px-2 font-medium text-gray-900">{data.email}</span>
        </div>

        <div className="flex items-baseline group">
            <span className="w-8 font-bold text-gray-500 text-sm">7.</span>
            <span className="w-48 font-semibold text-gray-700">Nationality</span>
            <span className="flex-1 border-b border-gray-300 pb-1 px-2 font-medium text-gray-900">{data.nationality}</span>
        </div>

        <div className="mt-6">
            <div className="flex items-baseline mb-2">
                <span className="w-8 font-bold text-gray-500 text-sm">8.</span>
                <span className="font-semibold text-gray-900 underline decoration-gray-300 underline-offset-4">Passport Particulars:</span>
            </div>
            <div className="pl-8 grid grid-cols-2 gap-x-8 gap-y-3">
                <div className="flex items-baseline">
                    <span className="w-40 text-sm text-gray-600">a) Passport Number :</span>
                    <span className="flex-1 border-b border-gray-300 pb-1 px-2 font-medium text-gray-900">{data.passportNumber}</span>
                </div>
                 <div className="flex items-baseline">
                    <span className="w-40 text-sm text-gray-600">b) Date of Issue :</span>
                    <span className="flex-1 border-b border-gray-300 pb-1 px-2 font-medium text-gray-900">{data.passportIssueDate}</span>
                </div>
                 <div className="flex items-baseline">
                    <span className="w-40 text-sm text-gray-600">c) Date of Expiry :</span>
                    <span className="flex-1 border-b border-gray-300 pb-1 px-2 font-medium text-gray-900">{data.passportExpiryDate}</span>
                </div>
                 <div className="flex items-baseline">
                    <span className="w-40 text-sm text-gray-600">d) Place of Issue :</span>
                    <span className="flex-1 border-b border-gray-300 pb-1 px-2 font-medium text-gray-900">{data.passportAuthority}</span>
                </div>
            </div>
        </div>

        <div className="flex items-baseline mt-4 group">
            <span className="w-8 font-bold text-gray-500 text-sm">9.</span>
            <span className="w-48 font-semibold text-gray-700">P.P.O. Number</span>
            <span className="flex-1 border-b border-gray-300 pb-1 px-2 font-medium text-gray-900">{data.ppoNumber}</span>
        </div>
         <div className="flex items-baseline group">
            <span className="w-8 font-bold text-gray-500 text-sm">10.</span>
            <span className="w-48 font-semibold text-gray-700">Service Number</span>
            <span className="flex-1 border-b border-gray-300 pb-1 px-2 font-medium text-gray-900">{data.serviceNumber}</span>
        </div>
      </div>

      <div className="mt-12 flex flex-row justify-between items-end gap-8 pb-8">
        <div className="flex flex-col items-center justify-end w-5/12">
            <div className="h-20 p-2 rounded bg-gray-50 mb-2 w-full flex items-center justify-center">
                {data.pensionerSignature && (
                    <img src={data.pensionerSignature} alt="Applicant Signature" className="h-16 object-contain" />
                )}
            </div>
            <div className="border-t border-gray-400 w-full text-center pt-2 font-semibold text-sm text-gray-700">
                Signature of Applicant
            </div>
        </div>

        <div className="flex flex-col items-center justify-end w-5/12">
            <div className="h-24 p-2 rounded bg-gray-50 mb-2 w-full flex items-center justify-center">
                {(data.notarySignature || currentNotarySignature) ? (
                    <img src={data.notarySignature || currentNotarySignature || ''} alt="Notary Seal" className="h-full object-contain" />
                ) : (
                    <span className="text-gray-400 text-xs">[Official Seal & Signature]</span>
                )}
            </div>
            <div className="border-t border-gray-400 w-full text-center pt-2 font-semibold text-sm text-gray-700">
                Authorised Official / Notary
            </div>
             {data.notaryName && (
                <p className="text-xs mt-1 text-gray-600 font-medium">{data.notaryName}</p>
            )}
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-[10px] text-gray-400 uppercase tracking-wider">
            <span>Sparsh Overseas System</span>
            <span>App Ref: {data.id}</span>
        </div>
      </div>

    </div>
  );
};

export default forwardRef(LifeCertificateTemplate);