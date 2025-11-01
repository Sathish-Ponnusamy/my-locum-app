import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Archive, Plus, ChevronDown, CheckCircle, Clock, DollarSign, Calendar, MapPin, X, AlertTriangle, Loader, RefreshCw, Edit2, Trash2 } from 'lucide-react';

// --- Utility Functions ---

/**
 * Converts a string date (YYYY-MM-DD or DD/MM/YYYY) to a Date object.
 * Returns null if the date is invalid.
 */
const parseDate = (dateString) => {
  if (!dateString) return null;
  // Handle YYYY-MM-DD format (used by date input)
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return new Date(dateString);
  }
  // Handle DD/MM/YYYY format (often stored in sheets/DB)
  if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    const [day, month, year] = dateString.split('/').map(Number);
    // Note: Month in Date constructor is 0-indexed (Jan=0, Dec=11)
    const date = new Date(year, month - 1, day);
    // Basic validation to ensure the components made a valid date
    if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
        return date;
    }
    return null;
  }
  return null;
};

/**
 * Formats a Date object or date string into DD/MM/YYYY.
 * Fallback to dateString if the input is not convertible.
 */
const formatDate = (input) => {
  const date = input instanceof Date ? input : parseDate(input);
  if (!date || isNaN(date)) return input || 'N/A';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // +1 because months are 0-indexed
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Parses the raw data object received from the Google Sheet API.
 * Ensures numeric fields are numbers and applies date formatting.
 */
const cleanShiftData = (rawShift) => {
  if (!rawShift) return null;
  
  // Ensure we can uniquely identify the shift
  const id = rawShift.id || crypto.randomUUID();

  // Handle date parsing (assuming API returns standard YYYY-MM-DD or DD/MM/YYYY)
  const dateObj = parseDate(rawShift.date);

  return {
    id: String(id),
    date: dateObj ? dateObj.toISOString().substring(0, 10) : rawShift.date || '', // Store as YYYY-MM-DD for date input
    displayDate: formatDate(rawShift.date), // Store DD/MM/YYYY for display
    agency: rawShift.agency || 'Private',
    location: rawShift.location || 'Unknown Location',
    hours: parseFloat(rawShift.hours) || 0,
    rate: parseFloat(rawShift.rate) || 0,
    daySalary: parseFloat(rawShift.daySalary) || 0,
    paymentStatus: rawShift.paymentStatus || 'Pending',
    amountReceived: parseFloat(rawShift.amountReceived) || 0,
    receivedDate: rawShift.receivedDate || '',
    taxStatus: rawShift.taxStatus || 'Pending',
    // Calculate Day Salary if it's missing (though it should be provided by the script)
    calculatedSalary: (parseFloat(rawShift.hours) || 0) * (parseFloat(rawShift.rate) || 0)
  };
};

/**
 * Simple utility for handling API retries with exponential backoff.
 */
const fetchWithRetry = async (url, options = {}, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        // Throw an error to trigger the catch block and retry
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response;
    } catch (error) {
      if (i < retries - 1) {
        // Wait exponentially longer before the next retry
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // Last attempt failed
        throw new Error(`Failed to fetch from API after ${retries} attempts: ${error.message}`);
      }
    }
  }
};


// --- Components ---

const ShiftItem = React.memo(({ shift, onEdit, onDelete }) => {
  const isPaid = shift.paymentStatus === 'Received';
  const paymentColor = isPaid ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300';
  const paymentIcon = isPaid ? <CheckCircle size={14} /> : <Clock size={14} />;

  const salaryDisplay = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(shift.daySalary);

  return (
    <div className={`flex items-center p-4 border rounded-xl shadow-sm transition duration-150 ${isPaid ? 'border-emerald-200 hover:shadow-lg' : 'border-slate-200 hover:shadow-md'}`}>
      <div className="flex-grow space-y-2 md:space-y-0 md:flex md:items-center md:gap-4">

        {/* Date & Location */}
        <div className="flex-shrink-0 w-full md:w-1/4">
          <p className="text-lg font-semibold flex items-center gap-2 text-slate-700">
            <Calendar size={18} className="text-indigo-500" />
            {shift.displayDate}
          </p>
          <p className="text-sm text-slate-500 flex items-center gap-1">
            <MapPin size={14} />
            {shift.location}
          </p>
        </div>

        {/* Financials */}
        <div className="flex-shrink-0 w-full md:w-1/4">
          <p className="text-xl font-bold text-indigo-700">{salaryDisplay}</p>
          <p className="text-sm text-slate-500">{shift.hours} hrs @ £{shift.rate.toFixed(2)}/hr</p>
        </div>

        {/* Agency & Status */}
        <div className="flex-shrink-0 w-full md:w-1/4 space-y-1">
          <span className="text-sm font-medium text-slate-600">Agency: {shift.agency}</span>
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium w-fit ${paymentColor}`}>
            {paymentIcon}
            {shift.paymentStatus}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-2 flex-shrink-0">
        <button
          onClick={() => onEdit(shift)}
          className="p-2 rounded-full text-indigo-600 hover:bg-indigo-100 transition duration-150 group"
          title="Edit Shift"
        >
          <Edit2 size={18} className="group-hover:scale-105" />
        </button>
        <button
          onClick={() => onDelete(shift.id)}
          className="p-2 rounded-full text-red-600 hover:bg-red-100 transition duration-150 group"
          title="Delete Shift"
        >
          <Trash2 size={18} className="group-hover:scale-105" />
        </button>
      </div>
    </div>
  );
});

const AddEditShiftModal = ({ isOpen, onClose, onSave, initialShift }) => {
  const isEditing = !!initialShift;
  const [shift, setShift] = useState(() => ({
    date: '', agency: '', location: '', hours: '', rate: '', paymentStatus: 'Pending',
    amountReceived: '', receivedDate: '', taxStatus: 'Pending', id: crypto.randomUUID(),
    ...(initialShift ? { ...initialShift, date: initialShift.date.substring(0, 10) } : {})
  }));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (initialShift) {
        // When editing, ensure the date is in YYYY-MM-DD format for the input field
        setShift({ ...initialShift, date: initialShift.date.substring(0, 10) });
      } else {
        // When adding, reset to default state
        setShift({
          date: new Date().toISOString().substring(0, 10), agency: 'Private', location: '', hours: '', rate: '',
          paymentStatus: 'Pending', amountReceived: '', receivedDate: '', taxStatus: 'Pending', id: crypto.randomUUID()
        });
      }
      setError(null);
    }
  }, [isOpen, initialShift]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let newValue = value;

    // Handle numeric inputs
    if (type === 'number') {
      newValue = parseFloat(value) >= 0 ? value : '';
    }

    setShift(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const calculateSalary = () => {
    const hours = parseFloat(shift.hours) || 0;
    const rate = parseFloat(shift.rate) || 0;
    return (hours * rate).toFixed(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!shift.date || !shift.location || !shift.hours || !shift.rate) {
      setError("Please fill in Date, Location, Hours, and Rate.");
      return;
    }

    const daySalary = calculateSalary();
    const shiftToSave = {
        ...shift,
        daySalary: parseFloat(daySalary),
        hours: parseFloat(shift.hours),
        rate: parseFloat(shift.rate),
        amountReceived: parseFloat(shift.amountReceived) || 0,
        // The script will convert the YYYY-MM-DD date to DD/MM/YYYY for the sheet
        date: shift.date,
        // Ensure ID is a string for the API
        id: String(shift.id)
    };

    onSave(shiftToSave);
    onClose();
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold text-indigo-800">{isEditing ? 'Edit Shift' : 'Add New Shift'}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-red-500 p-2 rounded-full transition"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-100 text-red-800 p-3 rounded-lg flex items-center gap-2">
              <AlertTriangle size={18} /> {error}
            </div>
          )}

          {/* Core Shift Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="date">Date</label>
              <input type="date" name="date" id="date" value={shift.date} onChange={handleChange}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="location">Location</label>
              <input type="text" name="location" id="location" value={shift.location} onChange={handleChange}
                placeholder="Hospital / Surgery Name"
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="agency">Agency</label>
            <input type="text" name="agency" id="agency" value={shift.agency} onChange={handleChange}
              placeholder="e.g., Pulse, Medics24, Private"
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" required />
          </div>

          {/* Financials */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="hours">Hours Worked</label>
              <input type="number" step="0.5" name="hours" id="hours" value={shift.hours} onChange={handleChange}
                placeholder="e.g., 8.5"
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="rate">Rate (£/hr)</label>
              <input type="number" step="0.01" name="rate" id="rate" value={shift.rate} onChange={handleChange}
                placeholder="e.g., 85.00"
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" required />
            </div>
          </div>

          <div className="bg-indigo-50 p-3 rounded-lg text-center">
            <h3 className="text-md font-semibold text-indigo-800">
              Total Salary: £{calculateSalary()}
            </h3>
          </div>

          {/* Payment Status */}
          <div className="pt-2 border-t mt-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Payment Tracking</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="paymentStatus">Status</label>
                <select name="paymentStatus" id="paymentStatus" value={shift.paymentStatus} onChange={handleChange}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="Pending">Pending</option>
                  <option value="Received">Received</option>
                </select>
              </div>

              {shift.paymentStatus === 'Received' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="amountReceived">Amount Received</label>
                    <input type="number" step="0.01" name="amountReceived" id="amountReceived" value={shift.amountReceived} onChange={handleChange}
                      placeholder="e.g., 680.00"
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="receivedDate">Received Date</label>
                    <input type="date" name="receivedDate" id="receivedDate" value={shift.receivedDate} onChange={handleChange}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="taxStatus">Tax Status</label>
                <select name="taxStatus" id="taxStatus" value={shift.taxStatus} onChange={handleChange}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Exempt">Exempt</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150"
            >
              {isEditing ? 'Update Shift' : 'Add Shift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DashboardCard = ({ title, value, icon, color }) => (
  <div className={`p-4 bg-white rounded-xl shadow-lg border-l-4 ${color}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-full text-white bg-opacity-90 ${color.replace('border-', 'bg-')}`}>
        {icon}
      </div>
    </div>
  </div>
);


// --- Main Application Component ---

const App = () => {
  // !!! PASTE THE URL YOU GOT FROM DEPLOYING YOUR APPS SCRIPT HERE !!!
  // e.g., "https://script.google.com/macros/s/AKfyc.../exec"
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyW9_BqE8_e0SbcNjUsDD5Oqdw-oQBRIuadHGkS4a45ugOd0LAF0_XnAWbwK2fgb_ZNVg/exec";

  const [shifts, setShifts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [filter, setFilter] = useState('All'); // 'All', 'Pending', 'Received'

  // --- API Handlers ---

  const fetchShifts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (GOOGLE_SCRIPT_URL === "PASTE_YOUR_APPS_SCRIPT_URL_HERE") {
      setError("API Error: You must paste your Google Apps Script URL into App.jsx.");
      setIsLoading(false);
      return;
    }

    const url = `${GOOGLE_SCRIPT_URL}?action=getShifts`;

    try {
      const response = await fetchWithRetry(url);
      const data = await response.json();

      if (data.status === 'success' && Array.isArray(data.data)) {
        // Data comes as an array of objects. Clean and set state.
        const cleanedShifts = data.data.map(cleanShiftData).filter(s => s !== null);
        setShifts(cleanedShifts);
      } else {
        setError(data.message || "Failed to load shifts from Google Sheet.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Could not connect to the Google Sheet API. Please check the URL and deployment.");
    } finally {
      setIsLoading(false);
    }
  }, [GOOGLE_SCRIPT_URL]);

  const saveShift = useCallback(async (shiftData) => {
    setIsLoading(true);
    setError(null);

    const isNew = !shifts.some(s => s.id === shiftData.id);

    const url = `${GOOGLE_SCRIPT_URL}?action=${isNew ? 'addShift' : 'updateShift'}`;

    try {
      const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shiftData)
      });
      const data = await response.json();

      if (data.status === 'success') {
        // Refresh the data after successful save
        fetchShifts();
      } else {
        setError(data.message || `Failed to ${isNew ? 'add' : 'update'} shift.`);
      }
    } catch (err) {
      console.error("Save error:", err);
      setError(`Error communicating with API during save: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [GOOGLE_SCRIPT_URL, shifts, fetchShifts]);

  const deleteShift = useCallback(async (shiftId) => {
    if (!window.confirm("Are you sure you want to delete this shift? This cannot be undone.")) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const url = `${GOOGLE_SCRIPT_URL}?action=deleteShift`;

    try {
      const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: shiftId })
      });
      const data = await response.json();

      if (data.status === 'success') {
        // Optimistically remove from UI or refresh
        fetchShifts();
      } else {
        setError(data.message || "Failed to delete shift.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      setError(`Error communicating with API during delete: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [GOOGLE_SCRIPT_URL, fetchShifts]);


  // --- Effects and Handlers ---

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  const handleOpenModal = (shift = null) => {
    setEditingShift(shift);
    setIsModalOpen(true);
  };

  const handleDeleteShift = (id) => {
    deleteShift(id);
  };

  // --- Filtering and Calculations ---

  const filteredShifts = useMemo(() => {
    let sortedShifts = [...shifts].sort((a, b) => {
      // Sort by date descending
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });

    if (filter === 'Pending') {
      return sortedShifts.filter(s => s.paymentStatus === 'Pending');
    }
    if (filter === 'Received') {
      return sortedShifts.filter(s => s.paymentStatus === 'Received');
    }
    return sortedShifts;
  }, [shifts, filter]);

  const metrics = useMemo(() => {
    const totalShifts = shifts.length;
    const totalEarnings = shifts.reduce((sum, s) => sum + (s.daySalary || 0), 0);
    const pendingEarnings = shifts
      .filter(s => s.paymentStatus === 'Pending')
      .reduce((sum, s) => sum + (s.daySalary || 0), 0);
    const receivedEarnings = totalEarnings - pendingEarnings;

    const formatCurrency = (amount) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2 }).format(amount);

    return {
      totalShifts,
      totalEarnings: formatCurrency(totalEarnings),
      receivedEarnings: formatCurrency(receivedEarnings),
      pendingEarnings: formatCurrency(pendingEarnings),
    };
  }, [shifts]);


  return (
    <div className="min-h-screen bg-slate-50 font-[Inter] p-4 sm:p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <header className="py-6 border-b-2 border-indigo-100">
          <h1 className="text-3xl font-extrabold text-indigo-800 flex items-center gap-2">
            <Archive size={30} />
            GP Locum Shift Tracker
          </h1>
          <p className="text-slate-600 mt-1">Manage your shifts and payment status, powered by Google Sheets.</p>
        </header>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 my-8">
          <DashboardCard
            title="Total Shifts"
            value={metrics.totalShifts}
            icon={<Archive size={24} />}
            color="border-indigo-400"
          />
          <DashboardCard
            title="Total Gross Earnings"
            value={metrics.totalEarnings}
            icon={<DollarSign size={24} />}
            color="border-green-400"
          />
          <DashboardCard
            title="Pending Payments"
            value={metrics.pendingEarnings}
            icon={<Clock size={24} />}
            color="border-amber-400"
          />
        </div>

        {/* Control Bar & Status */}
        <div className="flex flex-col sm:flex-row justify-between items-center py-4 gap-4">
          <div className="flex space-x-3">
            <button
              onClick={() => handleOpenModal(null)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150"
            >
              <Plus size={20} /> Add New Shift
            </button>
            <button
              onClick={fetchShifts}
              className={`p-3 rounded-full text-indigo-600 bg-indigo-100 hover:bg-indigo-200 transition duration-150 ${isLoading ? 'animate-spin' : ''}`}
              title="Refresh Data"
            >
              <RefreshCw size={20} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Filter Dropdown */}
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="appearance-none bg-white border border-slate-300 text-slate-700 py-2 pl-3 pr-8 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
              >
                <option value="All">All Shifts</option>
                <option value="Pending">Pending Payments</option>
                <option value="Received">Payments Received</option>
              </select>
              <ChevronDown size={18} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
            </div>
          </div>
        </div>

        {/* Loading / Error States */}
        {isLoading && (
          <div className="text-center py-10 flex flex-col items-center justify-center text-indigo-600">
            <Loader size={48} className="animate-spin" />
            <p className="mt-4 text-lg font-medium">Loading shifts from Google Sheet...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded-xl my-4 flex items-center gap-3">
            <AlertTriangle size={24} />
            <div>
              <p className="font-bold">Error:</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Shift List */}
        {!isLoading && !error && (
          <div className="space-y-4 pt-4">
            {filteredShifts.length > 0 ? (
              filteredShifts.map(shift => (
                <ShiftItem
                  key={shift.id}
                  shift={shift}
                  onEdit={handleOpenModal}
                  onDelete={handleDeleteShift}
                />
              ))
            ) : (
              <div className="text-center py-10 bg-white rounded-xl shadow-inner text-slate-500">
                <p className="text-xl font-semibold">No shifts found.</p>
                <p className="mt-2">Use the "Add New Shift" button to get started.</p>
              </div>
            )}
          </div>
        )}

        {/* Modal */}
        <AddEditShiftModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={saveShift}
          initialShift={editingShift}
        />
      </div>
    </div>
  );
};

export default App;