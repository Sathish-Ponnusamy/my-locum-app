import React, { useState, useEffect, useMemo, useCallback } from 'react';
// --- REMOVED ALL FIREBASE IMPORTS ---

// --- Utility Functions and Icons (Inline SVGs) ---

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
};

// SVG Icons
const GaugeIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19.5A7.5 7.5 0 0 0 19.5 12a7.5 7.5 0 0 0-7.5-7.5V12a7.5 7.5 0 0 0 7.5 7.5"></path><path d="M10.83 8.65l-1.92 1.92-2.12 2.12"></path></svg>
);
const DollarIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
);
const ClockIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);
const FileTextIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg>
);

// --- Default Data and Roles ---

const defaultShift = {
  date: new Date().toISOString().substring(0, 10),
  agency: 'Locum Agency 1',
  location: 'City Hospital',
  hours: 8.0,
  rate: 55.00,
  daySalary: 440.00,
  paymentStatus: 'Unpaid',
  amountReceived: 0.00,
  receivedDate: '',
  taxStatus: 'Self-Employed',
};

// --- View Components ---

// Simple Responsive SVG Line Chart for Monthly Trends
const MonthlyTrendGraph = ({ shifts }) => {
  const data = useMemo(() => {
    const monthlyData = shifts.reduce((acc, shift) => {
      if (shift.paymentStatus === 'Received' && shift.amountReceived > 0) {
        const monthYear = shift.receivedDate.substring(0, 7); // YYYY-MM
        acc[monthYear] = (acc[monthYear] || 0) + shift.amountReceived;
      }
      return acc;
    }, {});

    const sortedMonths = Object.keys(monthlyData).sort();
    const processedData = sortedMonths.map(month => ({
      month: month,
      amount: monthlyData[month]
    }));

    return processedData;
  }, [shifts]);

  if (data.length === 0) {
    return <div className="text-center py-8 text-gray-500">No received payments data available for trend analysis.</div>;
  }

  const chartWidth = 700;
  const chartHeight = 300;
  const padding = 40;
  
  const amounts = data.map(d => d.amount);
  const maxAmount = Math.max(...amounts);
  const minAmount = Math.min(...amounts, 0); 
  const yRange = maxAmount - minAmount;

  const getX = (index) => {
    if (data.length === 1) {
      return padding + (chartWidth - 2 * padding) / 2; // Center horizontally
    }
    // Prevent division by zero if data.length is 1 (which should be caught above, but as a safeguard)
    const divisor = data.length - 1;
    if (divisor === 0) return padding; 
    return padding + (index / divisor) * (chartWidth - 2 * padding);
  };
  
  const getY = (amount) => {
    if (yRange === 0) {
      return chartHeight - padding - (chartHeight - 2 * padding) / 2; // Center vertically
    }
    return chartHeight - padding - ((amount - minAmount) / yRange) * (chartHeight - 2 * padding);
  };
  
  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.amount)}`).join(' ');

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height={chartHeight} className="bg-white rounded-lg shadow-inner">
        {/* Y-Axis */}
        <line x1={padding} y1={chartHeight - padding} x2={padding} y2={padding} stroke="#E5E7EB" />
        {/* X-Axis */}
        <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#E5E7EB" />
        
        {/* Grid Lines and Labels (Simplified) */}
        {[0, 0.5, 1].map((ratio, i) => {
          const y = chartHeight - padding - ratio * (chartHeight - 2 * padding);
          const value = (minAmount + ratio * yRange).toFixed(0);
          return (
            <g key={i}>
              <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="#F3F4F6" strokeDasharray="4 4" />
              <text x={padding - 5} y={y + 5} textAnchor="end" className="text-xs fill-gray-500">${value}</text>
            </g>
          );
        })}

        {/* X-Axis Labels */}
        {data.map((d, i) => (
          <text key={i} x={getX(i)} y={chartHeight - padding + 20} textAnchor="middle" className="text-xs fill-gray-500">
            {d.month.substring(2)}
          </text>
        ))}

        {/* Data Line */}
        <path d={linePath} fill="none" stroke="#3B82F6" strokeWidth="3" />
        
        {/* Data Points */}
        {data.map((d, i) => (
          <circle key={i} cx={getX(i)} cy={getY(d.amount)} r="4" fill="#1D4ED8" />
        ))}
      </svg>
    </div>
  );
};


const DashboardPage = ({ shifts }) => {
  const stats = useMemo(() => {
    let totalReceived = 0;
    let totalShifts = shifts.length;
    let payeTotal = 0;
    let selfEmployedTotal = 0;
    let agencyTotals = {};
    let totalUnpaid = 0;
    let totalHours = 0;

    shifts.forEach(shift => {
      totalHours += shift.hours;

      if (shift.paymentStatus === 'Received') {
        totalReceived += shift.amountReceived;
      } else if (shift.paymentStatus === 'Unpaid') {
        totalUnpaid += shift.daySalary;
      }

      if (shift.taxStatus === 'PAYE') {
        payeTotal += shift.daySalary;
      } else {
        selfEmployedTotal += shift.daySalary;
      }

      agencyTotals[shift.agency] = agencyTotals[shift.agency] || { shifts: 0, salary: 0 };
      agencyTotals[shift.agency].shifts += 1;
      agencyTotals[shift.agency].salary += shift.daySalary;
    });

    const taxBreakdown = [
      { status: 'Self-Employed', amount: selfEmployedTotal },
      { status: 'PAYE', amount: payeTotal },
    ];

    const sortedAgencies = Object.entries(agencyTotals)
      .sort(([, a], [, b]) => b.salary - a.salary)
      .map(([name, data]) => ({ name, ...data }));

    return { totalReceived, totalShifts, taxBreakdown, sortedAgencies, totalUnpaid, totalHours };
  }, [shifts]);

  const currencyFormatter = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stat Card 1: Total Received */}
        <div className="p-6 bg-white rounded-xl shadow-lg border-b-4 border-green-500 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Received</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{currencyFormatter.format(stats.totalReceived)}</p>
          </div>
          <DollarIcon className="w-8 h-8 text-green-500 opacity-70" />
        </div>
        
        {/* Stat Card 2: Total Unpaid/Owed */}
        <div className="p-6 bg-white rounded-xl shadow-lg border-b-4 border-yellow-500 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Outstanding Salary</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{currencyFormatter.format(stats.totalUnpaid)}</p>
          </div>
          <ClockIcon className="w-8 h-8 text-yellow-500 opacity-70" />
        </div>

        {/* Stat Card 3: Total Shifts */}
        <div className="p-6 bg-white rounded-xl shadow-lg border-b-4 border-blue-500 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Shifts Logged</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalShifts}</p>
          </div>
          <GaugeIcon className="w-8 h-8 text-blue-500 opacity-70" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tax Status Breakdown */}
        <div className="bg-white p-6 rounded-xl shadow-2xl">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Salary Breakdown by Tax Status</h3>
          <div className="space-y-3">
            {stats.taxBreakdown.map(b => (
              <div key={b.status} className="flex justify-between items-center py-2 border-b last:border-b-0">
                <span className="font-medium text-gray-600">{b.status} Shifts Salary</span>
                <span className={`text-lg font-bold ${b.status === 'PAYE' ? 'text-blue-600' : 'text-purple-600'}`}>
                  {currencyFormatter.format(b.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Agency Totals */}
        <div className="bg-white p-6 rounded-xl shadow-2xl">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Top Agencies by Salary</h3>
          <div className="space-y-3">
            {stats.sortedAgencies.slice(0, 5).map(agency => (
              <div key={agency.name} className="flex justify-between items-center py-2 border-b last:border-b-0">
                <div>
                  <span className="font-medium text-gray-700">{agency.name}</span>
                  <p className="text-xs text-gray-500">{agency.shifts} shifts</p>
                </div>
                <span className="font-bold text-lg text-gray-800">
                  {currencyFormatter.format(agency.salary)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Trend Graph */}
      <div className="bg-white p-6 rounded-xl shadow-2xl">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Monthly Received Payments Trend</h3>
        <MonthlyTrendGraph shifts={shifts} />
      </div>
    </div>
  );
};


const ShiftInputPage = ({ newShift, handleChange, handleSubmit, isLoading }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-2xl max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">Log New Locum Shift</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Row 1: Date & Agency */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
            <input type="date" id="date" name="date" value={newShift.date} onChange={handleChange} required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2" />
          </div>
          <div>
            <label htmlFor="agency" className="block text-sm font-medium text-gray-700">Agency</label>
            <input type="text" id="agency" name="agency" value={newShift.agency} onChange={handleChange} required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2" />
          </div>
        </div>
        
        {/* Row 2: Location & Hours */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
            <input type="text" id="location" name="location" value={newShift.location} onChange={handleChange} required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2" />
          </div>
          <div>
            <label htmlFor="hours" className="block text-sm font-medium text-gray-700">Hours</label>
            <input type="number" step="0.5" id="hours" name="hours" value={newShift.hours} onChange={handleChange} required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2" />
          </div>
        </div>

        {/* Row 3: Rate, Salary, Tax Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="rate" className="block text-sm font-medium text-gray-700">Rate (£/hr)</label>
            <input type="number" step="0.01" id="rate" name="rate" value={newShift.rate} onChange={handleChange} required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2" />
          </div>
          <div>
            <label htmlFor="daySalary" className="block text-sm font-medium text-gray-700">Day Salary (£)</label>
            <input type="number" id="daySalary" name="daySalary" value={newShift.daySalary.toFixed(2)} readOnly className="mt-1 block w-full rounded-lg border-gray-300 bg-gray-50 shadow-sm p-2" />
          </div>
          <div>
            <label htmlFor="taxStatus" className="block text-sm font-medium text-gray-700">Tax Status</label>
            <select id="taxStatus" name="taxStatus" value={newShift.taxStatus} onChange={handleChange} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2">
              <option value="Self-Employed">Self-Employed</option>
              <option value="PAYE">PAYE</option>
            </select>
          </div>
        </div>

        {/* Row 4: Payment Status & Amount Received */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4 mt-4 border-gray-200">
          <div>
            <label htmlFor="paymentStatus" className="block text-sm font-medium text-gray-700">Payment Status</label>
            <select id="paymentStatus" name="paymentStatus" value={newShift.paymentStatus} onChange={handleChange} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2">
              <option value="Unpaid">Unpaid</option>
              <option value="Pending">Pending</option>
              <option value="Received">Received</option>
            </select>
          </div>
          <div>
            <label htmlFor="amountReceived" className="block text-sm font-medium text-gray-700">Amount Received (£)</label>
            <input type="number" step="0.01" id="amountReceived" name="amountReceived" value={newShift.amountReceived} onChange={handleChange} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2" disabled={newShift.paymentStatus !== 'Received'} />
          </div>
          <div>
            <label htmlFor="receivedDate" className="block text-sm font-medium text-gray-700">Received Date</label>
            <input type="date" id="receivedDate" name="receivedDate" value={newShift.receivedDate} onChange={handleChange} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2" disabled={newShift.paymentStatus !== 'Received'} />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" disabled={isLoading} className="px-6 py-3 text-lg font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 transition duration-150 shadow-md">
            {isLoading ? 'Saving...' : 'Save Shift'}
          </button>
        </div>
      </form>
    </div>
  );
};


const InvoiceGeneratorPage = ({ shifts, scriptsLoaded }) => {
  const [selectedShifts, setSelectedShifts] = useState([]);
  const [isInvoiceVisible, setIsInvoiceVisible] = useState(false); // Used to render invoice for PDF generation
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [invoiceDetails, setInvoiceDetails] = useState({
    invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
    clientName: 'NHS Trust / Agency Name',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10), // 7 days from now
  });

  const unpaidShifts = useMemo(() => 
    shifts.filter(s => s.paymentStatus === 'Unpaid' && s.taxStatus === 'Self-Employed')
  , [shifts]);

  const toggleShift = (shiftId) => {
    setSelectedShifts(prev => 
      prev.includes(shiftId) ? prev.filter(id => id !== shiftId) : [...prev, shiftId]
    );
  };

  const invoiceShifts = useMemo(() => 
    unpaidShifts.filter(s => selectedShifts.includes(s.id))
  , [unpaidShifts, selectedShifts]);

  const invoiceTotal = invoiceShifts.reduce((sum, shift) => sum + shift.daySalary, 0);

  const handleGeneratePdf = async () => {
    if (!scriptsLoaded || isGeneratingPdf) {
      console.error("Scripts not loaded or PDF generation in progress.");
      return;
    }
    
    if (!window.jspdf || !window.html2canvas) {
       console.error("PDF libraries not found on window object.");
       // TODO: Set a user-facing error
       return;
    }

    setIsGeneratingPdf(true);
    setIsInvoiceVisible(true); // Render the invoice element off-screen

    // Wait for next tick for React to render the invoice
    setTimeout(async () => {
      const elementToCapture = document.getElementById('invoice-to-print');
      if (!elementToCapture) {
        console.error("Could not find invoice element to capture.");
        setIsGeneratingPdf(false);
        setIsInvoiceVisible(false);
        return;
      }

      try {
        const { jsPDF } = window.jspdf;
        const canvas = await window.html2canvas(elementToCapture, {
          scale: 2, // Higher resolution
          useCORS: true // For any potential images
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4'); // A4 in portrait, units in mm
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

        let heightLeft = imgHeight;
        let position = 0; // Top margin

        // Add first page
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add new pages if content overflows
        while (heightLeft > 0) {
          position = -heightLeft; // Y-position of the image on the new page
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save(`${invoiceDetails.invoiceNumber}.pdf`);

      } catch (err) {
        console.error("Error generating PDF:", err);
        // TODO: Set a user-facing error
      } finally {
        setIsInvoiceVisible(false); // Hide the invoice element again
        setIsGeneratingPdf(false);
      }
    }, 200); // Give React 200ms to render the invoice
  };


  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800">Invoice Generator</h2>
      
      {/* Invoice Details and Action Panel */}
      <div className="bg-white p-6 rounded-xl shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-end space-y-4 md:space-y-0 print:hidden">
        <div className="space-y-2 w-full md:w-auto">
          <div className="flex space-x-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Invoice No.</label>
              <input type="text" value={invoiceDetails.invoiceNumber} onChange={(e) => setInvoiceDetails({...invoiceDetails, invoiceNumber: e.target.value})} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Due Date</label>
              <input type="date" value={invoiceDetails.dueDate} onChange={(e) => setInvoiceDetails({...invoiceDetails, dueDate: e.target.value})} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2 text-sm" />
            </div>
          </div>
          <label className="text-sm font-medium text-gray-700 block">Client Name</label>
          <input type="text" value={invoiceDetails.clientName} onChange={(e) => setInvoiceDetails({...invoiceDetails, clientName: e.target.value})} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2 text-sm" />
        </div>

        <button 
          onClick={handleGeneratePdf} 
          disabled={invoiceShifts.length === 0 || isGeneratingPdf || !scriptsLoaded}
          className="px-6 py-3 text-lg font-semibold rounded-xl text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 transition duration-150 shadow-md flex items-center print:hidden"
        >
          <FileTextIcon className="w-5 h-5 mr-2" />
          {isGeneratingPdf ? 'Generating...' : (scriptsLoaded ? 'Download PDF' : 'Loading Libs...')}
        </button>
      </div>

      {/* Unpaid Shifts Selector */}
      <div className="bg-white p-6 rounded-xl shadow-2xl print:hidden">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Select Shifts for Invoice ({invoiceShifts.length} selected)</h3>
        {unpaidShifts.length === 0 ? (
          <p className="text-gray-500">No self-employed shifts marked as 'Unpaid' to invoice.</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {unpaidShifts.map(shift => (
              <div key={shift.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition duration-150">
                <label className="flex items-center space-x-3 cursor-pointer flex-grow">
                  <input 
                    type="checkbox" 
                    checked={selectedShifts.includes(shift.id)}
                    onChange={() => toggleShift(shift.id)}
                    className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <p className="font-medium text-gray-800">{shift.agency} - {shift.location}</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(shift.date)} ({shift.hours} hrs @ £{shift.rate.toFixed(2)})
                    </p>
                  </div>
                </label>
                <span className="font-bold text-lg text-blue-600">£{shift.daySalary.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Printable Invoice View (Conditionally Rendered for PDF generation, but off-screen) */}
      {isInvoiceVisible && (
        <div className="fixed -top-full left-0 w-full p-8 bg-white invoice-print-area">
          {/* This wrapper is positioned off-screen */}
          <div id="invoice-to-print" className="max-w-3xl mx-auto p-8 border border-gray-300 bg-white">
            {/* This is the content that will be captured */}
            <header className="flex justify-between items-center border-b pb-4 mb-6">
              <h1 className="text-4xl font-extrabold text-blue-700">INVOICE</h1>
              <div className="text-right">
                <p className="font-semibold text-gray-800">Dr. Locum M.D.</p>
                <p className="text-sm text-gray-600">123 Locum Lane, London</p>
              </div>
            </header>

            <section className="flex justify-between mb-8 text-sm">
              <div>
                <h2 className="font-bold mb-2">BILLED TO:</h2>
                <p className="font-semibold">{invoiceDetails.clientName}</p>
                <p>Accounts Payable Department</p>
              </div>
              <div className="text-right">
                <p>Invoice No: <span className="font-semibold text-blue-700">{invoiceDetails.invoiceNumber}</span></p>
                <p>Invoice Date: {formatDate(new Date().toISOString().substring(0, 10))}</p>
                <p>Due Date: {formatDate(invoiceDetails.dueDate)}</p>
              </div>
            </section>

            <table className="w-full border-collapse mb-8">
              <thead>
                <tr className="bg-gray-100 text-left text-sm font-semibold text-gray-700">
                  <th className="p-3 border">Date</th>
                  <th className="p-3 border">Description (Agency / Location)</th>
                  <th className="p-3 border text-right">Hours</th>
                  <th className="p-3 border text-right">Rate</th>
                  <th className="p-3 border text-right">Amount (£)</th>
                </tr>
              </thead>
              <tbody>
                {invoiceShifts.map(shift => (
                  <tr key={shift.id} className="text-sm text-gray-700">
                    <td className="p-3 border">{formatDate(shift.date)}</td>
                    <td className="p-3 border">{shift.agency} at {shift.location}</td>
                    <td className="p-3 border text-right">{shift.hours.toFixed(1)}</td>
                    <td className="p-3 border text-right">£{shift.rate.toFixed(2)}</td>
                    <td className="p-3 border text-right font-semibold">£{shift.daySalary.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end">
              <div className="w-full md:w-1/2 space-y-2 text-lg">
                <div className="flex justify-between font-semibold">
                  <span>SUBTOTAL:</span>
                  <span>£{invoiceTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-xl text-blue-700 border-t pt-2">
                  <span>TOTAL DUE:</span>
                  <span>£{invoiceTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <footer className="mt-12 pt-4 border-t text-center text-sm text-gray-600">
              <p>Please make payment by {formatDate(invoiceDetails.dueDate)}. Thank you for your business.</p>
              <p>Bank Details: Sort Code: XX-XX-XX | Account No: XXXXXXXX</p>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};


// --- Main Application Component ---

// Helper function to load scripts dynamically
const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    // Check if script already exists
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script ${src}`));
    document.body.appendChild(script);
  });
};

const App = () => {
  // --- Google Sheets API URL ---
  // !!! PASTE THE URL YOU GOT FROM DEPLOYING YOUR APPS SCRIPT HERE !!!
  const GOOGLE_SCRIPT_URL = "Phttps://script.google.com/macros/s/AKfycbyW9_BqE8_e0SbcNjUsDD5Oqdw-oQBRIuadHGkS4a45ugOd0LAF0_XnAWbwK2fgb_ZNVg/exec";

  // --- SIMPLIFIED STATE ---
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // App Data State
  const [shifts, setShifts] = useState([]);
  const [page, setPage] = useState('dashboard'); // 'dashboard', 'input', 'trend', 'invoice'
  const [scriptsLoaded, setScriptsLoaded] = useState(false); // For PDF libs

  // Form State
  const [newShift, setNewShift] = useState(defaultShift);
  const [isSaving, setIsSaving] = useState(false);

  // --- Script Loading Effect ---
  useEffect(() => {
    Promise.all([
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'),
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js')
    ])
    .then(() => {
      setScriptsLoaded(true);
    })
    .catch(err => {
      console.error(err);
      setError("Failed to load PDF generation libraries. Please refresh.");
    });
  }, []);


  // --- Google Sheets Fetch Function ---
  const fetchShifts = useCallback(async () => {
    if (GOOGLE_SCRIPT_URL === "PASTE_YOUR_APPS_SCRIPT_URL_HERE") {
      setError("API Error: You must paste your Google Apps Script URL into App.jsx.");
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      
      if (result.status === 'success') {
        // Ensure numeric types are correctly cast from the sheet
        const loadedShifts = result.data.map(shift => ({
          ...shift,
          hours: Number(shift.hours || 0),
          rate: Number(shift.rate || 0),
          daySalary: Number(shift.daySalary || 0),
          amountReceived: Number(shift.amountReceived || 0),
        }));
        setShifts(loadedShifts);
        setError(null);
      } else {
        throw new Error(result.message || "Failed to parse data from Google Sheets.");
      }
    } catch (err) {
      console.error("[Google Sheets read failed]: ", err);
      setError(`Failed to load shifts from Google Sheets. Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [GOOGLE_SCRIPT_URL]);

  // Load data on initial component mount
  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);


  // --- Shift Form Handlers ---

  const calculateSalary = useCallback((hours, rate) => {
    return (Number(hours) * Number(rate)) || 0;
  }, []);

  const handleChange = useCallback((e) => {
    let { name, value } = e.target;
    
    // Type conversion for numeric inputs
    if (['hours', 'rate', 'amountReceived'].includes(name)) {
      value = parseFloat(value) || 0;
    }
    
    setNewShift(prev => {
      let updatedShift = { ...prev, [name]: value };

      // Recalculate Day Salary if hours or rate changes
      if (name === 'hours' || name === 'rate') {
        updatedShift.daySalary = calculateSalary(updatedShift.hours, updatedShift.rate);
      }

      // Clear receivedDate/amount if status changes away from Received
      if (name === 'paymentStatus' && value !== 'Received') {
        updatedShift.amountReceived = 0.00;
        updatedShift.receivedDate = '';
      }
      
      return updatedShift;
    });
  }, [calculateSalary]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;

    if (GOOGLE_SCRIPT_URL === "PASTE_YOUR_APPS_SCRIPT_URL_HERE") {
      setError("API Error: You must paste your Google Apps Script URL into App.jsx to save data.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const shiftToSave = {
      ...newShift,
      daySalary: calculateSalary(newShift.hours, newShift.rate),
      // The Apps Script generates the 'id'
    };
    
    try {
      // We send as 'text/plain' to avoid a CORS preflight OPTIONS request
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain', // Key to avoid CORS preflight
        },
        body: JSON.stringify(shiftToSave),
      });

      const result = await response.json();

      if (result.status === 'success') {
        setNewShift(defaultShift); // Reset form
        setPage('dashboard'); // Redirect after save
        fetchShifts(); // Refetch all data to show the new shift
      } else {
        throw new Error(result.message || "Failed to save shift.");
      }
    } catch (e) {
      console.error("Error adding document: ", e);
      setError(`Failed to save the new shift. Error: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Function to render the current page based on state
  const renderPage = () => {
    // Simplified loading check
    if (isLoading) {
      return (
        <div className="text-center p-12 bg-white rounded-xl shadow-2xl max-w-md mx-auto mt-16">
          <h2 className="text-2xl font-bold text-blue-600 mb-4">Loading Data...</h2>
          <p className="text-gray-700">Connecting to Google Sheets...</p>
        </div>
      );
    }
    
    switch (page) {
      case 'input':
        return <ShiftInputPage newShift={newShift} handleChange={handleChange} handleSubmit={handleSubmit} isLoading={isSaving} />;
      case 'dashboard':
        return <DashboardPage shifts={shifts} />;
      case 'trend':
        return <DashboardPage shifts={shifts} />; // Dashboard includes the trend graph
      case 'invoice':
        return <InvoiceGeneratorPage shifts={shifts} scriptsLoaded={scriptsLoaded} />;
      default:
        return <DashboardPage shifts={shifts} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      
      {/* Navigation Bar */}
      <nav className="bg-white shadow-lg sticky top-0 z-10 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold text-blue-600">GP Locum Tracker</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {/* Navigation Links */}
                {[
                  { id: 'dashboard', name: 'Dashboard', icon: GaugeIcon },
                  { id: 'input', name: 'Log Shift', icon: ClockIcon },
                  { id: 'invoice', name: 'Invoice Generator', icon: FileTextIcon },
                ].map(item => (
                  <button 
                    key={item.id} 
                    onClick={() => setPage(item.id)}
                    className={`inline-flex items-center px-1 pt-1 border-b-4 text-sm font-medium transition duration-150 ease-in-out ${
                      page === item.id 
                        ? 'border-blue-500 text-blue-600' 
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-2" />
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-500">Powered by Google Sheets</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Global Error Display */}
        {error && (
          <div className="p-4 mb-6 text-sm text-red-800 rounded-lg bg-red-50 font-medium break-words">
            {error}
          </div>
        )}

        {/* Render Current Page */}
        {renderPage()}
      </main>

      {/* Tailwind Print Styles for Invoice */}
      <style>{`
        @media print {
          /* This style is for browser printing, which is no longer the primary function */
          body > #root > div > main > * {
            display: none !important;
          }
          .invoice-print-area {
            display: block !important;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            padding: 0;
            margin: 0;
            background: white;
            z-index: 10000;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default App;