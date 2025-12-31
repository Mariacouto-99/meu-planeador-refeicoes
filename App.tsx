
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Utensils, 
  ShoppingCart, 
  Settings, 
  History, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronLeft,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Share2,
  ArrowRight
} from 'lucide-react';
import { BASE_INGREDIENTS, TARGET_KCALS_DAY, TARGET_PROTEIN_DAY } from './constants';
import { Ingredient, WeeklyPlan, Category, ShoppingItem, DailyPlan } from './types';
import { generateMealPlan } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ingredients' | 'plan' | 'shopping' | 'history'>('dashboard');
  const [ingredients, setIngredients] = useState<Ingredient[]>(() => {
    const saved = localStorage.getItem('app_ingredients');
    return saved ? JSON.parse(saved) : BASE_INGREDIENTS;
  });
  const [selectedIngredientIds, setSelectedIngredientIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('app_selected_ingredients');
    return saved ? JSON.parse(saved) : BASE_INGREDIENTS.map(i => i.id);
  });
  const [currentPlan, setCurrentPlan] = useState<WeeklyPlan | null>(() => {
    const saved = localStorage.getItem('app_current_plan');
    return saved ? JSON.parse(saved) : null;
  });
  const [history, setHistory] = useState<WeeklyPlan[]>(() => {
    const saved = localStorage.getItem('app_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [daysMode, setDaysMode] = useState<3 | 5 | 7>(7);

  // Persistence
  useEffect(() => {
    localStorage.setItem('app_ingredients', JSON.stringify(ingredients));
  }, [ingredients]);

  useEffect(() => {
    localStorage.setItem('app_selected_ingredients', JSON.stringify(selectedIngredientIds));
  }, [selectedIngredientIds]);

  useEffect(() => {
    localStorage.setItem('app_current_plan', JSON.stringify(currentPlan));
  }, [currentPlan]);

  useEffect(() => {
    localStorage.setItem('app_history', JSON.stringify(history));
  }, [history]);

  const selectedIngredients = useMemo(() => 
    ingredients.filter(i => selectedIngredientIds.includes(i.id)),
    [ingredients, selectedIngredientIds]
  );

  const currentDailyPlan: DailyPlan | null = currentPlan?.days[currentDayIndex] || null;

  const dailyStats = useMemo(() => {
    if (!currentDailyPlan) return { kcal: 0, protein: 0 };
    return {
      kcal: currentDailyPlan.meals.reduce((sum, m) => sum + m.kcal, 0),
      protein: currentDailyPlan.meals.reduce((sum, m) => sum + m.protein, 0)
    };
  }, [currentDailyPlan]);

  const shoppingList = useMemo(() => {
    if (!currentPlan) return [];
    const items: Record<string, ShoppingItem> = {};
    currentPlan.days.forEach(day => {
      day.meals.forEach(meal => {
        meal.ingredients.forEach(usage => {
          const ing = ingredients.find(i => i.id === usage.ingredientId);
          if (!ing) return;
          if (!items[ing.id]) {
            items[ing.id] = { ingredient: ing, totalAmount: 0, totalKcal: 0, totalProtein: 0 };
          }
          items[ing.id].totalAmount += usage.amount;
        });
      });
    });
    return Object.values(items);
  }, [currentPlan, ingredients]);

  const handleToggleIngredient = (id: string) => {
    setSelectedIngredientIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleAddIngredient = (newIng: Omit<Ingredient, 'id' | 'isDefault'>) => {
    const ing: Ingredient = { ...newIng, id: crypto.randomUUID(), isDefault: false };
    setIngredients(prev => [...prev, ing]);
    setSelectedIngredientIds(prev => [...prev, ing.id]);
  };

  const handleDeleteIngredient = (id: string) => {
    setIngredients(prev => prev.filter(i => i.id !== id));
    setSelectedIngredientIds(prev => prev.filter(i => i !== id));
  };

  const handleGeneratePlan = async () => {
    if (selectedIngredients.length < 5) {
      alert("Por favor, selecione pelo menos 5 ingredientes.");
      return;
    }
    setIsGenerating(true);
    try {
      const plan = await generateMealPlan(selectedIngredients, daysMode);
      setCurrentPlan(plan);
      setHistory(prev => [plan, ...prev].slice(0, 10));
      setCurrentDayIndex(0);
      setActiveTab('plan');
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar o plano. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const formatAmount = (amount: number, unit: string) => {
    if (unit === 'g') {
      if (amount >= 1000) return `${(amount / 1000).toFixed(2)}kg`;
      return `${Math.ceil(amount)}g`;
    }
    if (unit === 'ml') {
      if (amount >= 1000) return `${(amount / 1000).toFixed(2)}L`;
      return `${Math.ceil(amount)}ml`;
    }
    // For "unidade", if the AI somehow still sends grams (e.g., > 20 for a fruit piece)
    // we could try to guess, but with the new prompt it should be correct.
    const rounded = Math.round(amount * 10) / 10;
    return `${rounded} ${unit}${rounded !== 1 ? 's' : ''}`;
  };

  const exportPlan = () => {
    if (!currentPlan) return;
    let text = `Plano de Refeições - ${new Date(currentPlan.date).toLocaleDateString()}\n\n`;
    currentPlan.days.forEach(day => {
      text += `DIA ${day.day}\n`;
      day.meals.forEach(m => {
        text += `- ${m.type}: ${m.name}\n`;
      });
      text += `\n`;
    });
    navigator.clipboard.writeText(text);
    alert("Copiado!");
  };

  const NavButton = ({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
    <button 
      type="button"
      onClick={(e) => { e.preventDefault(); onClick(); }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all w-full text-left ${
        active 
        ? 'bg-emerald-50 text-emerald-600 shadow-sm ring-1 ring-emerald-500/20' 
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  const MobileNavButton = ({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
    <button 
      type="button"
      onClick={(e) => { e.preventDefault(); onClick(); }}
      className={`flex flex-col items-center gap-1 transition-colors flex-1 ${active ? 'text-emerald-500' : 'text-slate-400'}`}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r sticky top-0 h-screen p-6 shadow-sm flex-shrink-0 z-40">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
            <Utensils size={24} />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">NutriPlan</h1>
        </div>

        <nav className="flex flex-col gap-2">
          <NavButton icon={<Utensils size={20}/>} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavButton icon={<Settings size={20}/>} label="Ingredientes" active={activeTab === 'ingredients'} onClick={() => setActiveTab('ingredients')} />
          <NavButton icon={<Calendar size={20}/>} label="Plano Semanal" active={activeTab === 'plan'} onClick={() => setActiveTab('plan')} />
          <NavButton icon={<ShoppingCart size={20}/>} label="Lista de Compras" active={activeTab === 'shopping'} onClick={() => setActiveTab('shopping')} />
          <NavButton icon={<History size={20}/>} label="Histórico" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
        </nav>

        <div className="mt-auto pt-6 border-t space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Duração</span>
            <div className="flex gap-1">
              {[3, 5, 7].map(d => (
                <button 
                  key={d}
                  onClick={() => setDaysMode(d as any)}
                  className={`px-2 py-1 text-xs rounded-md border font-bold ${daysMode === d ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-500'}`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
          <button 
            type="button"
            onClick={handleGeneratePlan}
            disabled={isGenerating}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {isGenerating ? <RefreshCw className="animate-spin" size={20} /> : <ArrowRight size={20} />}
            Gerar Plano
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 w-full max-w-full overflow-y-auto pb-24 md:pb-8">
        <div className="max-w-5xl mx-auto">
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <header>
                <h2 className="text-3xl font-bold text-slate-800">Bem-vindo!</h2>
                <p className="text-slate-500">Acompanha as tuas metas diárias.</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                   <div className="flex justify-between mb-2">
                     <span className="text-sm font-bold text-slate-600">Calorias</span>
                     <span className="text-sm font-bold">{Math.round(dailyStats.kcal)} / {TARGET_KCALS_DAY}</span>
                   </div>
                   <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-orange-400 transition-all duration-700" style={{ width: `${Math.min(100, (dailyStats.kcal / TARGET_KCALS_DAY) * 100)}%` }}></div>
                   </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                   <div className="flex justify-between mb-2">
                     <span className="text-sm font-bold text-slate-600">Proteína</span>
                     <span className="text-sm font-bold">{Math.round(dailyStats.protein)} / {TARGET_PROTEIN_DAY}g</span>
                   </div>
                   <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${Math.min(100, (dailyStats.protein / TARGET_PROTEIN_DAY) * 100)}%` }}></div>
                   </div>
                </div>
              </div>

              {currentDailyPlan ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-800">Hoje (Dia {currentDayIndex + 1})</h3>
                    <div className="flex gap-2">
                      <button onClick={() => setCurrentDayIndex(p => Math.max(0, p - 1))} className="p-2 bg-white rounded-lg border hover:bg-slate-50"><ChevronLeft size={20}/></button>
                      <button onClick={() => setCurrentDayIndex(p => Math.min((currentPlan?.days.length || 1) - 1, p + 1))} className="p-2 bg-white rounded-lg border hover:bg-slate-50"><ChevronRight size={20}/></button>
                    </div>
                  </div>
                  <div className="grid gap-4">
                    {currentDailyPlan.meals.map((meal) => (
                      <div key={meal.id} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-start gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Utensils size={24} /></div>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-800">{meal.type}: {meal.name}</h4>
                          <p className="text-slate-500 text-sm mb-1">{meal.kcal} kcal | {meal.protein}g P</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-400">Gera um novo plano para começar.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ingredients' && (
            <div className="space-y-6 animate-in fade-in duration-500">
               <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h2 className="text-3xl font-bold text-slate-800">Inventário</h2>
                  <IngredientModal onAdd={handleAddIngredient} />
               </header>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {(['Fruta', 'Proteína', 'Secos', 'Laticínios', 'Outros'] as Category[]).map(cat => (
                    <div key={cat} className="space-y-4">
                      <h3 className="font-bold text-slate-700 border-b pb-2">{cat}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {ingredients.filter(i => i.category === cat).map(ing => (
                          <button
                            key={ing.id}
                            onClick={() => handleToggleIngredient(ing.id)}
                            className={`p-3 rounded-xl border-2 text-left transition-all relative ${selectedIngredientIds.includes(ing.id) ? 'border-emerald-500 bg-emerald-50' : 'border-white bg-white shadow-sm'}`}
                          >
                            <span className="font-semibold text-slate-800 block mb-1">{ing.name}</span>
                            <span className="text-[10px] text-slate-400 uppercase">{ing.kcalPer100} kcal / {ing.proteinPer100}g P</span>
                            {selectedIngredientIds.includes(ing.id) && <CheckCircle2 className="absolute top-2 right-2 text-emerald-500" size={16} />}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'plan' && (
             <div className="space-y-6 animate-in fade-in duration-500">
               {currentPlan ? (
                 <>
                   <header className="flex justify-between items-end">
                     <h2 className="text-3xl font-bold text-slate-800">Plano Ativo</h2>
                     <button onClick={exportPlan} className="p-2 border rounded-xl bg-white"><Share2 size={20}/></button>
                   </header>
                   <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                     {currentPlan.days.map((d, i) => (
                       <button key={i} onClick={() => setCurrentDayIndex(i)} className={`px-4 py-2 rounded-xl font-bold ${currentDayIndex === i ? 'bg-slate-800 text-white' : 'bg-white border'}`}>
                         Dia {d.day}
                       </button>
                     ))}
                   </div>
                   <div className="space-y-4">
                     {currentDailyPlan?.meals.map(m => (
                       <div key={m.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                         <div className="flex justify-between mb-4">
                           <span className="text-xs font-bold text-emerald-600 uppercase">{m.type}</span>
                           <span className="text-xs font-bold text-slate-400">{m.kcal} kcal | {m.protein}g P</span>
                         </div>
                         <h3 className="text-xl font-bold mb-3">{m.name}</h3>
                         <div className="p-4 bg-slate-50 rounded-xl mb-3 text-sm text-slate-700 whitespace-pre-line border border-slate-100">{m.recipe}</div>
                       </div>
                     ))}
                   </div>
                 </>
               ) : <div className="text-center py-20">Nenhum plano ativo.</div>}
             </div>
          )}

          {activeTab === 'shopping' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <h2 className="text-3xl font-bold text-slate-800">Lista de Compras</h2>
              {shoppingList.length > 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 divide-y overflow-hidden shadow-sm">
                  {shoppingList.map(item => (
                    <div key={item.ingredient.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{item.ingredient.name}</span>
                        <span className="text-[10px] text-slate-400 uppercase">{item.ingredient.category}</span>
                      </div>
                      <span className="text-emerald-600 font-bold text-lg">
                        {formatAmount(item.totalAmount, item.ingredient.unit)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-slate-400">Gera um plano para ver a lista.</p>}
            </div>
          )}

          {activeTab === 'history' && (
             <div className="space-y-6 animate-in fade-in duration-500">
                <h2 className="text-3xl font-bold text-slate-800">Histórico</h2>
                <div className="space-y-3">
                  {history.map(p => (
                    <button key={p.id} onClick={() => { setCurrentPlan(p); setActiveTab('plan'); }} className="w-full bg-white p-4 rounded-xl border flex justify-between items-center text-left">
                       <span>Plano de {new Date(p.date).toLocaleDateString()}</span>
                       <ChevronRight size={20}/>
                    </button>
                  ))}
                </div>
             </div>
          )}
        </div>
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-3 pb-6 shadow-2xl z-50">
        <MobileNavButton icon={<Utensils size={24}/>} label="Início" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <MobileNavButton icon={<Settings size={24}/>} label="Itens" active={activeTab === 'ingredients'} onClick={() => setActiveTab('ingredients')} />
        <div className="relative -top-8 px-2">
           <button 
            type="button"
            onClick={handleGeneratePlan}
            disabled={isGenerating}
            className="w-16 h-16 bg-emerald-500 text-white rounded-full shadow-xl flex items-center justify-center border-4 border-white active:scale-90 transition-transform disabled:opacity-50"
           >
            {isGenerating ? <RefreshCw className="animate-spin" /> : <Plus size={32} />}
           </button>
        </div>
        <MobileNavButton icon={<ShoppingCart size={24}/>} label="Lista" active={activeTab === 'shopping'} onClick={() => setActiveTab('shopping')} />
        <MobileNavButton icon={<History size={24}/>} label="Hist." active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
      </nav>
    </div>
  );
};

const IngredientModal = ({ onAdd }: { onAdd: (ing: any) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('Outros');
  const [kcal, setKcal] = useState(0);
  const [protein, setProtein] = useState(0);
  const [unit, setUnit] = useState<'g' | 'ml' | 'unidade'>('g');

  if (!isOpen) return (
    <button onClick={() => setIsOpen(true)} className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold shadow-md hover:bg-emerald-600 transition-colors">
      + Ingrediente
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-xl font-bold mb-6">Novo Ingrediente</h3>
        <div className="space-y-4">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome" className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
          <div className="grid grid-cols-2 gap-4">
            <select value={category} onChange={e => setCategory(e.target.value as any)} className="p-3 bg-slate-50 border rounded-xl outline-none">
               <option>Proteína</option><option>Fruta</option><option>Secos</option><option>Laticínios</option><option>Outros</option>
            </select>
            <select value={unit} onChange={e => setUnit(e.target.value as any)} className="p-3 bg-slate-50 border rounded-xl outline-none">
               <option value="g">Gramas</option><option value="ml">Mililitros</option><option value="unidade">Unidade</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input type="number" placeholder="Kcal" onChange={e => setKcal(Number(e.target.value))} className="p-3 bg-slate-50 border rounded-xl outline-none" />
            <input type="number" placeholder="Proteína (g)" onChange={e => setProtein(Number(e.target.value))} className="p-3 bg-slate-50 border rounded-xl outline-none" />
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={() => setIsOpen(false)} className="flex-1 py-3 border rounded-xl text-slate-500 font-bold hover:bg-slate-50">Cancelar</button>
            <button onClick={() => { onAdd({ name, category, kcalPer100: kcal, proteinPer100: protein, unit }); setIsOpen(false); }} className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600">Adicionar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
