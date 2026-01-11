import React from 'react';
import InvoicePrint from './InvoicePrint';

interface InvoicePreviewModalProps {
    order: any;
    onClose: () => void;
    onPrint: () => void;
}

const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({ order, onClose, onPrint }) => {
    if (!order) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
            <div className="bg-gray-100 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-gray-800 text-white p-4 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-lg">Xem trước hóa đơn</h3>
                    <button onClick={onClose} className="hover:text-red-400 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Preview Content (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-4 flex justify-center bg-gray-200">
                    <InvoicePrint order={order} mode="preview" />
                </div>

                {/* Actions Footer */}
                <div className="bg-white p-4 border-t border-gray-200 grid grid-cols-2 gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="py-3 px-4 rounded-xl border border-gray-300 font-bold text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
                    >
                        Thoát
                    </button>
                    <button
                        onClick={onPrint}
                        className="py-3 px-4 rounded-xl bg-primary text-white font-bold shadow-lg hover:bg-primary-dark active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined">print</span>
                        In hóa đơn
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InvoicePreviewModal;
