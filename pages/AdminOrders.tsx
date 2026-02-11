import React, { useState, useRef } from 'react';
import { useShop } from '../context/ShopContext';
import { Order } from '../types';
import { Printer, ChevronDown, CheckCircle, XCircle, Search } from 'lucide-react';
import { CURRENCY } from '../constants';

const AdminOrders: React.FC = () => {
  const { orders, updateOrder } = useShop();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filter, setFilter] = useState('All');
  
  const printRef = useRef<HTMLDivElement>(null);

  const filteredOrders = orders.filter(o => filter === 'All' ? true : o.paymentStatus === filter);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (printContent) {
      const originalContents = document.body.innerHTML;
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload(); // Quick fix to restore state after print
    }
  };

  const statusOptions = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
       {/* List */}
       <div className="w-1/3 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <div className="p-4 border-b">
             <h2 className="font-bold text-lg mb-4">Orders</h2>
             <div className="flex gap-2">
                {['All', 'Paid', 'Unpaid'].map(f => (
                   <button 
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`flex-1 py-2 text-sm font-medium rounded ${filter === f ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}
                   >
                      {f}
                   </button>
                ))}
             </div>
          </div>
          <div className="flex-1 overflow-y-auto">
             {filteredOrders.map(order => (
                <div 
                   key={order.id}
                   onClick={() => setSelectedOrder(order)}
                   className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${selectedOrder?.id === order.id ? 'bg-orange-50 border-l-4 border-l-accent' : ''}`}
                >
                   <div className="flex justify-between mb-1">
                      <span className="font-bold text-sm text-gray-800">#{order.id}</span>
                      <span className="text-xs text-gray-500">{order.date}</span>
                   </div>
                   <h3 className="text-sm font-medium text-gray-700">{order.customerName}</h3>
                   <div className="flex justify-between items-center mt-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{order.status}</span>
                      <span className="font-bold text-sm">{CURRENCY}{order.total}</span>
                   </div>
                </div>
             ))}
          </div>
       </div>

       {/* Details */}
       <div className="w-2/3 bg-white rounded-xl shadow-sm border border-gray-200 overflow-y-auto p-8 relative">
          {selectedOrder ? (
             <div>
                <div className="flex justify-between items-start mb-8 border-b pb-6">
                   <div>
                      <h1 className="text-2xl font-bold mb-2">Order #{selectedOrder.id}</h1>
                      <div className="flex items-center gap-4">
                         <select 
                            className="border p-2 rounded text-sm font-medium"
                            value={selectedOrder.status}
                            onChange={e => {
                               const updated = { ...selectedOrder, status: e.target.value as any };
                               updateOrder(updated);
                               setSelectedOrder(updated);
                            }}
                         >
                            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                         </select>
                         <select 
                            className={`border p-2 rounded text-sm font-medium ${selectedOrder.paymentStatus === 'Paid' ? 'text-green-600 border-green-200 bg-green-50' : 'text-red-600 border-red-200 bg-red-50'}`}
                            value={selectedOrder.paymentStatus}
                            onChange={e => {
                               const updated = { ...selectedOrder, paymentStatus: e.target.value as any };
                               updateOrder(updated);
                               setSelectedOrder(updated);
                            }}
                         >
                            <option value="Paid">Paid</option>
                            <option value="Unpaid">Unpaid</option>
                         </select>
                      </div>
                   </div>
                   <button 
                      onClick={handlePrint} 
                      className="bg-gray-800 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-black"
                   >
                      <Printer size={16} /> Print Label
                   </button>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8">
                   <div>
                      <h3 className="font-bold text-gray-500 text-xs uppercase tracking-wider mb-3">Customer</h3>
                      <p className="font-bold">{selectedOrder.customerName}</p>
                      <p>{selectedOrder.customerEmail}</p>
                      <p>{selectedOrder.customerPhone}</p>
                   </div>
                   <div>
                      <h3 className="font-bold text-gray-500 text-xs uppercase tracking-wider mb-3">Shipping Address</h3>
                      <p className="whitespace-pre-line text-gray-700">{selectedOrder.shippingAddress}</p>
                   </div>
                </div>

                <div className="border rounded-lg overflow-hidden mb-8">
                   <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 border-b">
                         <tr>
                            <th className="p-3">Item</th>
                            <th className="p-3">Qty</th>
                            <th className="p-3 text-right">Price</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y">
                         {selectedOrder.items.map((item, idx) => (
                            <tr key={idx}>
                               <td className="p-3">
                                  <div className="font-medium">{item.name}</div>
                                  <div className="text-xs text-gray-500">
                                     {item.selectedVariation && `${item.selectedVariation.type}: ${item.selectedVariation.value}`}
                                  </div>
                               </td>
                               <td className="p-3">{item.quantity}</td>
                               <td className="p-3 text-right">{CURRENCY}{item.price * item.quantity}</td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                   <div className="bg-gray-50 p-4 border-t">
                      <div className="flex justify-between mb-1"><span>Subtotal:</span><span>{CURRENCY}{selectedOrder.subtotal}</span></div>
                      <div className="flex justify-between mb-1"><span>Shipping:</span><span>{CURRENCY}{selectedOrder.shippingCost}</span></div>
                      <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Total:</span><span>{CURRENCY}{selectedOrder.total}</span></div>
                   </div>
                </div>

                {/* Hidden Print Template */}
                <div className="hidden">
                   <div ref={printRef} className="p-8 border-2 border-black max-w-[500px] mx-auto font-sans">
                      <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-4">
                         <img src="/Logo/logo black.png" alt="Logo" className="h-12 object-contain" />
                         <div className="text-right">
                            <h2 className="font-bold text-xl uppercase">Shipping Label</h2>
                            <p className="font-mono">#{selectedOrder.id}</p>
                            <p className="text-sm">{selectedOrder.date}</p>
                         </div>
                      </div>
                      
                      <div className="mb-8">
                         <p className="text-xs font-bold uppercase text-gray-500 mb-1">Ship To:</p>
                         <h1 className="text-2xl font-bold">{selectedOrder.customerName}</h1>
                         <p className="text-lg">{selectedOrder.customerPhone}</p>
                         <p className="text-lg mt-2">{selectedOrder.shippingAddress}</p>
                      </div>

                      <div className="border-t-2 border-black pt-4 flex justify-between items-center">
                         <div>
                            <p className="font-bold">Total Weight:</p>
                            <p>{selectedOrder.items.reduce((sum, i) => sum + ((i.weight || 0) * i.quantity), 0)} kg</p>
                         </div>
                         <div>
                            <p className="font-bold">COD Amount:</p>
                            <p className="text-xl font-bold">{selectedOrder.paymentStatus === 'Unpaid' ? `${CURRENCY}${selectedOrder.total}` : 'PAID'}</p>
                         </div>
                      </div>
                      <div className="mt-8 text-center text-xs">
                         <p>Leading Edge Furniture | Dhaka, Bangladesh | +880 1700 000000</p>
                      </div>
                   </div>
                </div>
             </div>
          ) : (
             <div className="h-full flex items-center justify-center text-gray-400">Select an order to view details</div>
          )}
       </div>
    </div>
  );
};

export default AdminOrders;
