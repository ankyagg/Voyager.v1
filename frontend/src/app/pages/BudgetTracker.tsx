import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Plus, Trash2, DollarSign, X } from "lucide-react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

interface Expense {
  id: string;
  name: string;
  category: string;
  date: string;
  amount: number;
  paidBy: string;
}

export default function BudgetTracker() {
  const { tripId } = useParams();
  const [totalBudget, setTotalBudget] = useState(6000);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({ name: "", category: "Food & Drinks", amount: "" });

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  useEffect(() => {
    if (!tripId) return;

    // Listen to trip document for budget and expenses
    const unsub = onSnapshot(doc(db, "trips", tripId), (snapshot) => {
      const data = snapshot.data();
      if (data) {
        if (data.expenses) {
          setExpenses(data.expenses);
        }
        if (data.budget?.total) {
          setTotalBudget(data.budget.total);
        }
      }
    });

    return () => unsub();
  }, [tripId]);

  const addExpense = async () => {
    if (!newExpense.name || !newExpense.amount || !tripId) return;
    const expense: Expense = {
      id: Date.now().toString(),
      name: newExpense.name,
      category: newExpense.category,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      amount: parseFloat(newExpense.amount),
      paidBy: "Me"
    };
    
    const updatedExpenses = [...expenses, expense];
    try {
      await updateDoc(doc(db, "trips", tripId), {
        expenses: updatedExpenses,
        "budget.spent": totalSpent + expense.amount
      });
      setIsModalOpen(false);
      setNewExpense({ name: "", category: "Food & Drinks", amount: "" });
    } catch (err) {
      console.error("Failed to add expense:", err);
    }
  };

  const removeExpense = async (id: string) => {
    if (!tripId) return;
    const expenseToRemove = expenses.find(e => e.id === id);
    if (!expenseToRemove) return;

    const updatedExpenses = expenses.filter(e => e.id !== id);
    try {
      await updateDoc(doc(db, "trips", tripId), {
        expenses: updatedExpenses,
        "budget.spent": Math.max(0, totalSpent - expenseToRemove.amount)
      });
    } catch (err) {
      console.error("Failed to remove expense:", err);
    }
  };

  const categoryTotals = expenses.reduce((acc: any, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {});

  const chartData = Object.keys(categoryTotals).map(cat => ({
    name: cat,
    value: categoryTotals[cat],
    color: cat === "Transport" ? "#E76F51" : cat === "Accommodation" ? "#2A9D8F" : cat === "Food & Drinks" ? "#E9C46A" : "#2563EB"
  }));

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-[1.25rem] shadow-sm border border-gray-100">
        <div>
          <h2 className="font-heading font-bold text-2xl text-gray-900 flex items-center gap-2">
            <DollarSign className="text-blue-600" size={28} /> Budget Overview
          </h2>
          <p className="text-gray-500 mt-1">Real-time collaborative tracking enabled.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-full font-bold hover:bg-blue-700 transition-all shadow-md flex items-center gap-2 active:scale-95"
        >
          <Plus size={18} /> Add Expense
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Chart & Progress */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white p-6 rounded-[1.25rem] shadow-sm border border-gray-100">
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2 text-gray-400 font-bold uppercase tracking-wider">
                <span>Total Budget</span>
                <span className="text-gray-900">${totalBudget.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-end mb-4">
                <span className="text-4xl font-bold text-gray-900">${totalSpent.toLocaleString()}</span>
                <span className="text-sm font-medium text-gray-400 mb-1">{(totalBudget - totalSpent).toLocaleString()} left</span>
              </div>
              
              <div className="relative h-4 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ${
                    (totalSpent / totalBudget) > 0.9 ? "bg-red-500" : "bg-[#2A9D8F]"
                  }`} 
                  style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.length > 0 ? chartData : [{ name: "None", value: 1, color: "#f3f4f6" }]}
                    cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => `$${val}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Col: Transactions */}
        <div className="lg:col-span-2 bg-white rounded-[1.25rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
            <h3 className="font-heading font-bold text-lg text-gray-900">Recent Transactions</h3>
          </div>
          
          <div className="flex-1 overflow-auto">
            {expenses.length === 0 ? (
              <div className="p-20 text-center text-gray-400 font-medium">No expenses yet. Add your first one!</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <tbody className="text-sm">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            {expense.category.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{expense.name}</p>
                            <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">{expense.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-400 font-medium">{expense.date}</td>
                      <td className="py-4 px-6 font-bold text-gray-900 text-right">${expense.amount.toLocaleString()}</td>
                      <td className="py-4 px-6 text-right">
                        <button 
                          onClick={() => removeExpense(expense.id)}
                          className="text-gray-200 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 border border-gray-100 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Add New Expense</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Expense Name</label>
                <input 
                  type="text" 
                  value={newExpense.name}
                  onChange={(e) => setNewExpense({...newExpense, name: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="e.g. Flight to Mumbai"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Category</label>
                  <select 
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option>Food & Drinks</option>
                    <option>Accommodation</option>
                    <option>Transport</option>
                    <option>Activities</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Amount ($)</label>
                  <input 
                    type="number" 
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <button 
                onClick={addExpense}
                className="w-full bg-blue-600 text-white rounded-xl py-4 font-bold text-lg hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all mt-6 active:scale-[0.98]"
              >
                Save Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
