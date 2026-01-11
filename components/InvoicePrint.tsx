
import React from 'react';
import { SHOP_INFO, BANK_INFO } from '../constants';

interface InvoicePrintProps {
    order: {
        id: string;
        total_amount: number;
        payment_method: 'cash' | 'transfer' | 'debt';
        created_at: string;
        customer_name?: string;
        discount?: number;
        subTotal?: number;
        items: {
            product_name: string;
            quantity: number;
            price: number;
        }[];
    } | null;
    mode?: 'print' | 'preview';
}

const InvoicePrint: React.FC<InvoicePrintProps> = ({ order, mode = 'print' }) => {
    if (!order) return null;

    const containerClasses = mode === 'print'
        ? "hidden print:block fixed top-0 left-0 w-full h-auto bg-white z-[9999] p-2 text-black font-mono text-sm leading-tight"
        : "w-[80mm] h-auto bg-white p-4 text-black font-mono text-sm leading-tight mx-auto shadow-md"; // Preview style

    return (
        <div className={containerClasses}>
            {/* Store Header */}
            <div className="text-center mb-4 border-b border-black pb-2 border-dashed">
                <h1 className="text-xl font-bold uppercase mb-1">{SHOP_INFO.name}</h1>
                <p className="text-xs">{SHOP_INFO.address}</p>
                <p className="text-xs">Hotline: {SHOP_INFO.phone}</p>
            </div>

            {/* Invoice Details */}
            <div className="mb-4 text-xs">
                <div className="flex justify-between">
                    <span>HĐ:</span>
                    <span>#{order.id.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Ngày:</span>
                    <span>{new Date(order.created_at).toLocaleString('vi-VN')}</span>
                </div>
                {order.customer_name && (
                    <div className="flex justify-between">
                        <span>Khách:</span>
                        <span className="font-bold">{order.customer_name}</span>
                    </div>
                )}
            </div>

            {/* Items Table */}
            <table className="w-full mb-4 text-xs">
                <thead>
                    <tr className="border-b border-black border-dashed text-left">
                        <th className="py-1">Món</th>
                        <th className="py-1 text-center">SL</th>
                        <th className="py-1 text-right">Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
                    {order.items.map((item, index) => (
                        <tr key={index}>
                            <td className="py-1 pr-2">{item.product_name}</td>
                            <td className="py-1 text-center whitespace-nowrap">x{item.quantity}</td>
                            <td className="py-1 text-right whitespace-nowrap">{(item.price * item.quantity).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="border-t border-black border-dashed pt-2 mb-6">
                {order.subTotal !== undefined && order.subTotal !== order.total_amount && (
                    <div className="flex justify-between mb-1 text-xs">
                        <span>Tạm tính:</span>
                        <span>{order.subTotal.toLocaleString()}đ</span>
                    </div>
                )}
                {order.discount ? (
                    <div className="flex justify-between mb-1 text-xs">
                        <span>Chiết khấu ({order.discount}%):</span>
                        <span>-{((order.subTotal || 0) * order.discount / 100).toLocaleString()}đ</span>
                    </div>
                ) : null}
                <div className="flex justify-between font-bold text-lg mt-2">
                    <span>TỔNG CỘNG:</span>
                    <span>{order.total_amount.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between text-xs mt-1 italic text-right">
                    <span>({order.payment_method === 'debt' ? 'Ghi nợ' : 'Tiền mặt'})</span>
                </div>
            </div>

            {/* QR Code Section */}
            <div className="flex flex-col items-center mb-4">
                <p className="text-[10px] uppercase font-bold mb-1">Quét mã để thanh toán</p>
                <img
                    src={`https://img.vietqr.io/image/${BANK_INFO.bankId}-${BANK_INFO.accountNo}-${BANK_INFO.template}.png?amount=${order.total_amount}&addInfo=${order.id.slice(0, 15)}&accountName=${encodeURIComponent(BANK_INFO.accountName)}`}
                    alt="VietQR"
                    className="w-32 h-32 object-contain"
                />
                <p className="text-[10px] mt-1">{BANK_INFO.bankId} - {BANK_INFO.accountNo}</p>
                <p className="text-[10px] font-bold">{BANK_INFO.accountName}</p>
            </div>

            {/* Footer */}
            <div className="text-center text-xs mt-4">
                <p>Cảm ơn quý khách!</p>
                <p>Hẹn gặp lại</p>
            </div>
        </div>
    );
};

export default InvoicePrint;
