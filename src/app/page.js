'use client';

import { useState, useEffect } from "react";
import { Chart } from "chart.js/auto";
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { db, auth } from '../../lib/firebase';

export default function Home() {
  const [user, setUser ] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Alimentacao',
    type: 'expense',
    date: new Date().toISOString().split('T')[0]
  });

  const loginDemo = async () => {
    try {
      await signInWithEmailAndPassword(auth, 'demo@example.com', '123456');
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      alert("Erro ao fazer login: " + error.message);
    }
  };

  const [chartInstance, setChartInstance] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadTransactions = (userId) => {
    const q = query(collection(db, "transactions"), where("userId", "==", userId));

    return onSnapshot(q, (snapshot) => {
      const transactionsData = [];
      snapshot.forEach((doc) => {
        transactionsData.push({ id: doc.id, ...doc.data() });
      });

      setTransactions(transactionsData);
      updateChart(transactionsData);
      setLoading(false);
    });
  };

  const updateChart = (transactions) => {
    const ctx = document.getElementById('financeChart');
    if (!ctx) return;

    if (chartInstance) {
      chartInstance.destroy();
    }

    const categories = [
      'Alimentacao', 'Transporte', 'Moradia',
      'Lazer', 'Saúde', 'Educacao', 'Outros'
    ];

    const data = categories.map(category => {
      return transactions
        .filter(t => t.category === category && t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    });

    const newChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categories,
        datasets: [{
          data: data,
          backgroundColor: [
            '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#6366F1', '#64748B'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw || 0;
                return `${context.label}: ${value.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                })}`;
              }
            }
          }
        }
      }
    });

    setChartInstance(newChart);
  };

  const balance = transactions.reduce((sum, transaction) => {
    return transaction.type === 'income'
      ? sum + parseFloat(transaction.amount)
      : sum - parseFloat(transaction.amount);
  }, 0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser (user);
      if (user) {
        const unsubscribeTransactions = loadTransactions(user.uid);
        return () => unsubscribeTransactions();
      } else {
        setTransactions([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      await addDoc(collection(db, "transactions"), {
        ...formData,
        amount: parseFloat(formData.amount),
        userId: user.uid,
        createdAt: new Date()
      });
      setFormData({
        description: '',
        amount: '',
        category: 'Alimentacao',
        type: 'expense',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error("Erro ao adicionar transacao:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "transactions", id));
    } catch (error) {
      console.error("Erro ao deletar transacao:", error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between item-center">
          <h1 className="text-xl font-bold text-gray-900">Controle de Gastos</h1>
          {user && (
            <button onClick={() => signOut(auth)}
              className="text-sm text-gray-600 hover:text-gray-900">
              Sair
            </button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {!user ? (
          <div className="mx-w-md mx-auto bg-white p-8 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-6">Acesse sua conta</h2>
            <button onClick={loginDemo}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition">
              Entrar como Demo
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Saldo Atual</h3>
                <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm font-medium text-gray-500">Receitas</p>
                <p className="text-3xl font-bold text-green-600">
                  {transactions
                    .filter(t => t.type === 'income')
                    .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                    .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {transactions.filter(t => t.type === 'income').length} transações
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm font-medium text-gray-500">Despesas</p>
                <p className="text-3xl font-bold text-red-600">
                  {transactions
                    .filter(t => t.type === 'expense')
                    .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                    .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {transactions.filter(t => t.type === 'expense').length} transações
                </p>
              </div>
            </div>
            {/* Lista de Transações */}
            <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {transaction.description}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {parseFloat(transaction.amount).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
