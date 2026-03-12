import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { DollarSign, Plane, Hotel, Coffee, Compass, Plus, MoreHorizontal } from "lucide-react";

export default function BudgetTracker() {
  const totalBudget = 6000;
  const spent = 4500;
  
  const data = [
    { name: "Flights", value: 1200, color: "#2563EB" },
    { name: "Accommodation", value: 1800, color: "#2A9D8F" },
    { name: "Food & Drinks", value: 800, color: "#E9C46A" },
    { name: "Activities", value: 500, color: "#F4A261" },
    { name: "Transport", value: 200, color: "#E76F51" },
  ];

  const recentExpenses = [
    { id: 1, name: "Garuda Indonesia Flights", category: "Flights", date: "Oct 1", amount: 1200, paidBy: "John" },
    { id: 2, name: "Alila Villas Uluwatu", category: "Accommodation", date: "Oct 2", amount: 1800, paidBy: "Sarah" },
    { id: 3, name: "Locavore Dinner Deposit", category: "Food & Drinks", date: "Oct 5", amount: 150, paidBy: "John" },
    { id: 4, name: "Nusa Penida Boat Tour", category: "Activities", date: "Oct 6", amount: 200, paidBy: "Alex" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-[1.25rem] shadow-sm border border-gray-100">
        <div>
          <h2 className="font-heading font-bold text-2xl text-gray-900 flex items-center gap-2">
            <DollarSign className="text-blue-600" size={28} /> Budget Overview
          </h2>
          <p className="text-gray-500 mt-1">Track your expenses and stay within limits.</p>
        </div>
        <button className="bg-blue-600 text-white px-5 py-2.5 rounded-full font-medium hover:bg-blue-700 transition-all shadow-md flex items-center gap-2">
          <Plus size={18} /> Add Expense
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Summary & Chart */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white p-6 rounded-[1.25rem] shadow-sm border border-gray-100">
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2 text-gray-600 font-medium">
                <span>Total Budget</span>
                <span className="text-gray-900 font-bold">${totalBudget.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm mb-4">
                <span className="text-gray-500">Total Spent</span>
                <span className="text-[#2A9D8F] font-bold">${spent.toLocaleString()}</span>
              </div>
              
              <div className="relative h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="absolute left-0 top-0 h-full bg-[#2A9D8F] rounded-full transition-all duration-1000" 
                  style={{ width: `${(spent / totalBudget) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-right mt-2 font-medium text-gray-500">
                ${(totalBudget - spent).toLocaleString()} remaining
              </p>
            </div>

            <h3 className="font-heading font-bold text-lg mb-4 text-gray-900 border-t border-gray-100 pt-4">Expenses by Category</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `$${value}`}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-3">
              {data.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-gray-700">{item.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900">${item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Expenses List */}
        <div className="lg:col-span-2 bg-white rounded-[1.25rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
            <h3 className="font-heading font-bold text-lg text-gray-900">Recent Transactions</h3>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">All</button>
              <button className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Pending</button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto p-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-sm text-gray-500 font-medium">
                  <th className="py-4 px-6 font-medium">Description</th>
                  <th className="py-4 px-6 font-medium">Category</th>
                  <th className="py-4 px-6 font-medium">Date</th>
                  <th className="py-4 px-6 font-medium">Paid By</th>
                  <th className="py-4 px-6 font-medium text-right">Amount</th>
                  <th className="py-4 px-6"></th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentExpenses.map((expense) => {
                  let Icon = DollarSign;
                  if (expense.category === "Flights") Icon = Plane;
                  if (expense.category === "Accommodation") Icon = Hotel;
                  if (expense.category === "Food & Drinks") Icon = Coffee;
                  if (expense.category === "Activities") Icon = Compass;
                  
                  return (
                    <tr key={expense.id} className="border-b border-gray-50 hover:bg-blue-50/50 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:shadow-sm transition-all">
                            <Icon size={18} />
                          </div>
                          <span className="font-semibold text-gray-900">{expense.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        <span className="bg-gray-100 px-2.5 py-1 rounded-md text-xs font-medium">{expense.category}</span>
                      </td>
                      <td className="py-4 px-6 text-gray-500">{expense.date}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                            {expense.paidBy.charAt(0)}
                          </div>
                          <span className="text-gray-700">{expense.paidBy}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-bold text-gray-900 text-right">${expense.amount.toLocaleString()}</td>
                      <td className="py-4 px-6 text-right">
                        <button className="text-gray-400 hover:text-gray-600 p-1">
                          <MoreHorizontal size={18} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
