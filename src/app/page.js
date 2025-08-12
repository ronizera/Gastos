'use client';

import { useState, useEffect } from "react";
import { Chart } from "chart.js/auto";
import {collection, addDoc, query, where, onSnapshot, deleteDoc, doc} from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import {db, auth} from '../../lib/firebase';

export default function Home(){
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [ formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Alimentacao',
    type: 'expense',
    date: new Date().toISOString().split('T')[0]
  });

  //login para teste

  const loginDemo = async () => {
    await signInWithEmailAndPassword(auth, 'demo@example.com', '123456');
  };

  const [chartInstance, setChartInstance] = useState(null);
  const [loading, setLoading] = useState(true);

  //Para carregar as transacoes do usuario

  const loadTransactions = (userId) => {
    const q = query(collection(db, "transactions"), where("userId", "==", userId));

    return onSnapshot(q, (snapshot) => {
      const transactionsData = [];
      snapshot.forEach((doc) => {
        transactionsData.push({id : doc.id, ...doc.data()});
      });

      setTransactions(transactionsData);
      updateChart(transactionsData);
      setLoading(false);
    });
  };

  //Para atualizar o grafico

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

  //Para calcular o saldo

  const balance = transactions.reduce((sum,transactions) => {
    return transactions.type === 'income'
    ? sum + parseFloat(transactions.amount)
    : sum - parseFloat(transactions.amount);
  }, 0);

  //Para monitorar a autenticacao

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        const unsubscribeTransactions = loadTransactions(user.uid);
        return() => unsubscribeTransactions();
      } else {
        setTransactions([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  //Para adicionar transacao

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    try{
      await addDoc(collection(db, "transactions"), {
        ...formData,
        amount: parseFloat(formData.amount),
        userId: user.uid,
        createdAt: new Date()
      });
      setFormData({
        description: '',
        amount: '',
        category: 'expense',
        date: new Date().toISOString().split('T') [0]
      });
    } catch (error) {
      console.error("Erro ao adicionar transacao:", error);
    }
  };

  // Para remover a transacao

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "transactions", id));
    }catch (error) {
      console.error("Erro ao deletar transacao::", error);
    }
  }

  return (
    <div>
      
    </div>
  )
}

