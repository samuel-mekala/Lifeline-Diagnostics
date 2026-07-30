import React, { useState, useEffect } from 'react';
import AdminDataStore from '../../admin/services/adminData';
import InteractiveSearchBar from '../../../components/common/InteractiveSearchBar';
import {
  Package,
  AlertTriangle,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  X,
  History,
  Tag,
  Building,
  Layers,
} from 'lucide-react';

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [stockLogs, setStockLogs] = useState([]);
  const [branches, setBranches] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Modals
  const [selectedItemForStockLog, setSelectedItemForStockLog] = useState(null);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Stock Adjustment Form State
  const [stockForm, setStockForm] = useState({
    logType: 'USAGE',
    quantity: 10,
    reason: '',
    batchNumber: '',
  });

  // Create Item Form State
  const [newItemForm, setNewItemForm] = useState({
    item_code: '',
    name: '',
    category: 'REAGENT_KIT',
    branch_code: 'HYD-MAIN',
    current_quantity: 100,
    min_threshold: 20,
    unit: 'Units',
    unit_price: 1500,
    supplier: 'Roche Diagnostics India',
    batch_number: 'RCH-2026-001',
    expiry_date: '2027-01-01',
    location_slot: 'Cold Storage Unit #1',
  });

  const refreshData = () => {
    setInventory(AdminDataStore.getInventory());
    setStockLogs(AdminDataStore.getStockLogs());
    setBranches(AdminDataStore.getBranches());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.item_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.batch_number.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBranch = selectedBranchFilter === 'ALL' || item.branch_code === selectedBranchFilter;
    const matchesCategory = selectedCategoryFilter === 'ALL' || item.category === selectedCategoryFilter;
    const matchesLowStock = !showLowStockOnly || item.status === 'LOW_STOCK';

    return matchesSearch && matchesBranch && matchesCategory && matchesLowStock;
  });

  const lowStockCount = inventory.filter((item) => item.status === 'LOW_STOCK').length;

  const handleOpenStockLogModal = (item) => {
    setSelectedItemForStockLog(item);
    setStockForm({
      logType: 'USAGE',
      quantity: 10,
      reason: 'Routine daily analyzer batch run',
      batchNumber: item.batch_number || '',
    });
  };

  const handleSaveStockLog = (e) => {
    e.preventDefault();
    if (!selectedItemForStockLog) return;

    AdminDataStore.recordStockMovement({
      itemId: selectedItemForStockLog.id,
      logType: stockForm.logType,
      quantity: stockForm.quantity,
      reason: stockForm.reason,
      batchNumber: stockForm.batchNumber,
      actorName: 'Anil Kumar (Lab Tech)',
    });

    refreshData();
    setSelectedItemForStockLog(null);
  };

  const handleCreateNewItem = (e) => {
    e.preventDefault();
    if (!newItemForm.name) {
      alert('Please enter item name.');
      return;
    }

    const branchObj = branches.find((b) => b.code === newItemForm.branch_code);

    AdminDataStore.createInventoryItem(
      {
        ...newItemForm,
        branch_name: branchObj ? branchObj.name : 'Main Branch',
      },
      'Inventory Manager'
    );

    refreshData();
    setShowAddItemModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
              <Package className="w-3.5 h-3.5" /> REAGENT & RECEPTACLE STOCK HUB
            </span>
            <span className="text-xs text-slate-400">Total Items Tracked: {inventory.length}</span>
          </div>
          <h1 className="text-2xl font-bold mt-2">Laboratory Inventory & Re-Order Operations</h1>
          <p className="text-sm text-slate-400 mt-1">
            Track analyzer reagents, vacuum tubes, swabs, and calibration reagents across branches with real-time minimum threshold alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHistoryModal(true)}
            className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 transition flex items-center gap-2"
          >
            <History className="w-4 h-4 text-amber-400" /> Audit Stock Logs
          </button>

          <button
            onClick={() => setShowAddItemModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Catalog Item
          </button>
        </div>
      </div>

      {/* Alert Banner for Low Stock */}
      {lowStockCount > 0 && (
        <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-4 flex items-center justify-between gap-4 text-amber-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm">
                {lowStockCount} Item{lowStockCount > 1 ? 's' : ''} Below Minimum Re-order Threshold!
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                Immediate vendor purchase order recommended to prevent analyzer downtime.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`px-4 py-2 text-xs font-black rounded-xl border transition ${
              showLowStockOnly
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-50'
            }`}
          >
            {showLowStockOnly ? 'Show All Items' : 'Filter Low Stock Items'}
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full md:w-auto">
          <InteractiveSearchBar
            placeholder="Search reagent name, barcode, or batch no..."
            value={searchQuery}
            onChange={setSearchQuery}
            suggestions={[
              'CBC Reagent Kit',
              'Vacutainer EDTA Purple',
              'Sodium Fluoride Tube',
              'RCH-2026-001',
            ]}
            resultCount={filteredInventory.length}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto text-xs">
          <div className="flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedBranchFilter}
              onChange={(e) => setSelectedBranchFilter(e.target.value)}
              className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 font-bold focus:outline-none"
            >
              <option value="ALL">All Branch Hubs</option>
              {branches.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.code} - {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 font-bold focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="REAGENT_KIT">Reagent Kits</option>
              <option value="COLLECTION_TUBES">Collection Tubes</option>
              <option value="CONSUMABLES">Consumables & Swabs</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Item Code & Description</th>
                <th className="p-4">Category & Branch</th>
                <th className="p-4">Current Stock / Min Threshold</th>
                <th className="p-4">Batch & Expiry</th>
                <th className="p-4">Storage Location</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                    No matching inventory items found.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const isLow = item.status === 'LOW_STOCK';
                  const percentage = Math.min(100, Math.round((item.current_quantity / (item.min_threshold * 2)) * 100));

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="p-4">
                        <div className="font-mono font-bold text-blue-600 text-xs">{item.item_code}</div>
                        <div className="font-extrabold text-slate-900 text-sm mt-0.5">{item.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Supplier: {item.supplier}</div>
                      </td>

                      <td className="p-4">
                        <span className="bg-slate-100 text-slate-800 text-[10px] font-extrabold px-2 py-0.5 rounded border border-slate-200 uppercase">
                          {item.category}
                        </span>
                        <div className="text-[11px] text-slate-600 font-bold mt-1.5">{item.branch_name}</div>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-slate-900">{item.current_quantity}</span>
                          <span className="text-xs text-slate-500 font-bold">/ {item.min_threshold} {item.unit} min</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-36 h-2 bg-slate-100 rounded-full overflow-hidden mt-1 border border-slate-200">
                          <div
                            className={`h-full ${isLow ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </td>

                      <td className="p-4 font-mono text-xs">
                        <div className="text-slate-900 font-bold">Batch: {item.batch_number}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Exp: {item.expiry_date}</div>
                      </td>

                      <td className="p-4 text-xs text-slate-700 font-medium">
                        <div>{item.location_slot}</div>
                      </td>

                      <td className="p-4 text-center">
                        {isLow ? (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-1 rounded-md border border-amber-300 uppercase inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> LOW STOCK
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-md border border-emerald-300 uppercase inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> SUFFICIENT
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleOpenStockLogModal(item)}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition inline-flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" /> Log Stock
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: RECORD STOCK MOVEMENT (RECEIPT, USAGE, WASTAGE) */}
      {selectedItemForStockLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Adjust Stock Level</h3>
                <p className="text-xs text-blue-600 font-mono font-bold">{selectedItemForStockLog.name}</p>
              </div>
              <button
                onClick={() => setSelectedItemForStockLog(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStockLog} className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between text-xs">
                <div>
                  <span className="text-slate-400">Current Qty:</span>{' '}
                  <strong className="text-slate-900 font-black text-sm">
                    {selectedItemForStockLog.current_quantity} {selectedItemForStockLog.unit}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400">Min Threshold:</span>{' '}
                  <strong className="text-slate-900 font-bold">{selectedItemForStockLog.min_threshold}</strong>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Movement Type *</label>
                <select
                  value={stockForm.logType}
                  onChange={(e) => setStockForm({ ...stockForm, logType: e.target.value })}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-bold focus:outline-none focus:border-blue-500 mt-1"
                >
                  <option value="RECEIPT">RECEIPT (+ New Vendor Delivery)</option>
                  <option value="USAGE">USAGE (- Lab Analyzer Consumption)</option>
                  <option value="WASTAGE">WASTAGE (- Damaged or Expired)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={stockForm.quantity}
                    onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 mt-1 font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Batch Number</label>
                  <input
                    type="text"
                    value={stockForm.batchNumber}
                    onChange={(e) => setStockForm({ ...stockForm, batchNumber: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 mt-1 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Reason / Reference Note</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Received PO #901, or Analyzer run consumption..."
                  value={stockForm.reason}
                  onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 mt-1"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedItemForStockLog(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md"
                >
                  Confirm Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD NEW CATALOG ITEM MODAL */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Add New Item to Inventory Catalog</h3>
              <button onClick={() => setShowAddItemModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewItem} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vitamin D Chemiluminescence Pack"
                  value={newItemForm.name}
                  onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 mt-1 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Category</label>
                  <select
                    value={newItemForm.category}
                    onChange={(e) => setNewItemForm({ ...newItemForm, category: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 mt-1 font-bold"
                  >
                    <option value="REAGENT_KIT">REAGENT_KIT</option>
                    <option value="COLLECTION_TUBES">COLLECTION_TUBES</option>
                    <option value="CONSUMABLES">CONSUMABLES</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700">Branch Hub</label>
                  <select
                    value={newItemForm.branch_code}
                    onChange={(e) => setNewItemForm({ ...newItemForm, branch_code: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 mt-1 font-bold"
                  >
                    {branches.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Initial Stock</label>
                  <input
                    type="number"
                    value={newItemForm.current_quantity}
                    onChange={(e) => setNewItemForm({ ...newItemForm, current_quantity: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 mt-1"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Min Threshold</label>
                  <input
                    type="number"
                    value={newItemForm.min_threshold}
                    onChange={(e) => setNewItemForm({ ...newItemForm, min_threshold: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 mt-1"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Unit Type</label>
                  <input
                    type="text"
                    value={newItemForm.unit}
                    onChange={(e) => setNewItemForm({ ...newItemForm, unit: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Batch Number</label>
                  <input
                    type="text"
                    value={newItemForm.batch_number}
                    onChange={(e) => setNewItemForm({ ...newItemForm, batch_number: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 mt-1 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Expiry Date</label>
                  <input
                    type="date"
                    value={newItemForm.expiry_date}
                    onChange={(e) => setNewItemForm({ ...newItemForm, expiry_date: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 mt-1 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: STOCK LOGS HISTORY */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <History className="w-5 h-5 text-amber-500" />
                Inventory Stock Logs & Movement Trail
              </h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {stockLogs.map((log) => (
                <div key={log.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{log.item_name}</span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded ${
                        log.type === 'RECEIPT'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.type === 'USAGE'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {log.type} ({log.quantity_changed > 0 ? `+${log.quantity_changed}` : log.quantity_changed})
                    </span>
                  </div>

                  <div className="text-slate-600 text-[11px]">{log.reason}</div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-mono">
                    <span>
                      Recorded by: <strong>{log.recorded_by}</strong> • Batch: {log.batch_number}
                    </span>
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
