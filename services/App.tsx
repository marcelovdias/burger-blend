
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { extractRecipeFromImage, searchProfessionalBlends } from './services/geminiService';
import { Recipe, CalculationResult, SuggestedBlend, BurgerSize, MeatComponent } from './types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { BURGER_SIZES, BLEND_CATEGORIES } from './constants';

const DEFAULT_RECIPE: Recipe = {
  name: 'Alamo Blend Original',
  fatRatio: 0.25,
  meats: [
    { name: 'Peito Limpo', ratio: 0.5 },
    { name: 'Acém Limpo', ratio: 0.5 }
  ],
  unitWeight: 140,
  grindMethod: 'Moído 2x no disco médio'
};

const App: React.FC = () => {
  const [recipe, setRecipe] = useState<Recipe>(DEFAULT_RECIPE);
  const [targetUnits, setTargetUnits] = useState<number>(30);
  const [targetWeight, setTargetWeight] = useState<number>(4200);
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedBlend[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [currentCategory, setCurrentCategory] = useState("Clássicos");
  const [showCameraOptions, setShowCameraOptions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showCare, setShowCare] = useState(false);
  const [showDIY, setShowDIY] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const [customSearchQuery, setCustomSearchQuery] = useState("");
  const [showCosts, setShowCosts] = useState(false);
  const [meatPrices, setMeatPrices] = useState<Record<string, number>>({ 'Gordura Animal': 15.00 });
  const [sellingPrice, setSellingPrice] = useState<number>(35.00);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [dragMoved, setDragMoved] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setDragMoved(false);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => {
    setTimeout(() => {
      setIsDragging(false);
    }, 10);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    if (Math.abs(walk) > 5) setDragMoved(true);
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  useEffect(() => {
    const savedRecipe = localStorage.getItem('burger-master-recipe');
    const savedUnits = localStorage.getItem('burger-master-units');
    const savedPrices = localStorage.getItem('burger-master-prices');
    const savedSellingPrice = localStorage.getItem('burger-master-selling-price');
    if (savedRecipe) setRecipe(JSON.parse(savedRecipe));
    if (savedUnits) setTargetUnits(parseInt(savedUnits));
    if (savedPrices) setMeatPrices(JSON.parse(savedPrices));
    if (savedSellingPrice) setSellingPrice(parseFloat(savedSellingPrice));
  }, []);

  useEffect(() => {
    localStorage.setItem('burger-master-recipe', JSON.stringify(recipe));
    localStorage.setItem('burger-master-units', targetUnits.toString());
    localStorage.setItem('burger-master-prices', JSON.stringify(meatPrices));
    localStorage.setItem('burger-master-selling-price', sellingPrice.toString());
    setTargetWeight(targetUnits * recipe.unitWeight);
  }, [recipe, targetUnits, meatPrices, sellingPrice]);

  const results = useMemo((): CalculationResult => {
    const fatWeight = targetWeight * recipe.fatRatio;
    const remainingWeight = targetWeight - fatWeight;
    const meatResults = recipe.meats.map(m => ({
      name: m.name,
      weight: remainingWeight * m.ratio,
      ratioInTotal: (remainingWeight * m.ratio) / targetWeight
    }));
    return { fat: fatWeight, meats: meatResults, total: targetWeight, units: targetUnits };
  }, [targetWeight, targetUnits, recipe]);

  const costResults = useMemo(() => {
    const fatCost = (results.fat / 1000) * (meatPrices['Gordura Animal'] || 0);
    const meatsCost = results.meats.reduce((acc, m) => {
      return acc + (m.weight / 1000) * (meatPrices[m.name] || 0);
    }, 0);
    const totalCost = fatCost + meatsCost;
    const perUnit = totalCost / targetUnits;
    const profit = sellingPrice - perUnit;
    const margin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
    return {
      total: totalCost,
      perUnit,
      fatCost,
      meatsCost,
      profit,
      margin
    };
  }, [results, meatPrices, targetUnits, sellingPrice]);

  const chartData = useMemo(() => [
    { name: 'Gordura', value: results.fat, color: '#FACC15' },
    ...results.meats.map((m, idx) => ({
      name: m.name,
      value: m.weight,
      color: idx % 2 === 0 ? '#EF4444' : '#BE123C'
    }))
  ], [results]);

  const copyToClipboard = () => {
    const formatWeight = (w: number) => w >= 1000 ? `${(w / 1000).toFixed(2)}kg` : `${Math.round(w)}g`;
    const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    let text = `🍔 *LISTA DE COMPRAS - ${recipe.name.toUpperCase()}*\n\n`;
    text += `Para ${targetUnits} hambúrgueres de ${recipe.unitWeight}g:\n`;
    results.meats.forEach(m => text += `🥩 *${m.name.toUpperCase()}:* ${formatWeight(m.weight)}\n`);
    text += `🥩 *GORDURA:* ${formatWeight(results.fat)}\n`;
    text += `✅ *TOTAL:* ${formatWeight(results.total)}\n\n`;
    text += `💰 *ESTIMATIVA DE CUSTO:*\n`;
    text += `Total: ${formatCurrency(costResults.total)}\n`;
    text += `Por Unidade: ${formatCurrency(costResults.perUnit)}`;

    navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const loadSuggestions = async (cat: string) => {
    setIsSearching(true);
    setShowSuggestions(true);
    setCurrentCategory(cat);
    try {
      const data = await searchProfessionalBlends(cat);
      setSuggestions(data);
    } catch (error: any) {
      console.error(error);
      if (error.message === "API_KEY_INVALID" || error.message?.includes("API key not valid")) {
        alert("CHAVE INVÁLIDA NO VERCEL:\n\n1. Verifique se adicionou 'API_KEY' nas Settings do Vercel.\n2. É necessário fazer um 'Redeploy' para a chave funcionar.");
      } else if (error.message === "API_KEY_MISSING") {
        alert("CHAVE AUSENTE: Adicione a variável 'API_KEY' no painel do Vercel e faça um Redeploy.");
      } else {
        alert("Erro na conexão com a IA. Tente novamente.");
      }
    } finally { setIsSearching(false); }
  };

  const applySuggestion = (suggestion: SuggestedBlend) => {
    setRecipe(prev => ({
      ...prev,
      name: suggestion.name,
      fatRatio: suggestion.fatRatio,
      meats: suggestion.meats,
    }));
    setShowSuggestions(false);
  };

  const processImage = async (file: File) => {
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const extracted = await extractRecipeFromImage(reader.result as string);
        setRecipe(extracted);
      } catch (error: any) { 
        alert("Erro ao processar imagem. Verifique sua Chave de API no Vercel.");
      } finally { setIsProcessing(false); }
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          body { background: white !important; color: black !important; -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-only { display: block !important; width: 100%; height: 100%; }
        }
        .print-only { display: none; }
      `}} />

      <header className="bg-[#1c1917] text-white px-4 py-3 shadow-2xl sticky top-0 z-[100] border-b border-stone-800 no-print">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="bg-[#ea580c] p-2 rounded-lg shadow-lg">
              <i className="fas fa-hamburger text-lg sm:text-xl"></i>
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-lg font-black uppercase italic leading-none tracking-tighter truncate">
                Burger Master Pro
              </h1>
              <p className="text-[6px] sm:text-[8px] text-[#f97316] font-black uppercase tracking-[0.2em] mt-0.5">IA-Powered</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => loadSuggestions("Clássicos")}
              className="bg-[#262626] text-white px-3 sm:px-4 py-2 rounded-lg text-[9px] font-black uppercase flex items-center gap-1.5 border border-stone-700 hover:bg-stone-800 transition-all active:scale-95"
            >
              <i className="fas fa-search text-[#f97316]"></i>
              <span>Explorar</span>
            </button>

            <button
              onClick={() => setShowCameraOptions(true)}
              className="bg-[#ea580c] text-white px-3 sm:px-4 py-2 rounded-lg text-[9px] font-black uppercase flex items-center gap-1.5 hover:bg-[#c2410c] transition-all active:scale-95 shadow-lg shadow-orange-900/20"
            >
              <i className="fas fa-camera"></i>
              <span className="hidden xs:inline-block">Scan</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-3 lg:p-6 space-y-6">
        <section className="space-y-1 no-print">
          <h3 className="font-black text-stone-900 uppercase text-[9px] tracking-widest flex items-center gap-1.5 italic px-1">
            <i className="fas fa-caret-right text-[#ea580c]"></i> Pesos do Mercado
          </h3>
          <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className={`flex overflow-x-auto py-4 gap-3 no-scrollbar snap-x snap-mandatory px-2 -mx-2 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          >
            {BURGER_SIZES.map((size) => (
              <button
                key={size.id}
                onClick={() => !dragMoved && setRecipe({ ...recipe, unitWeight: size.weight })}
                className={`flex-shrink-0 w-[85px] p-3 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center text-center gap-2 snap-start relative ${recipe.unitWeight === size.weight
                  ? 'bg-white border-[#ea580c] ring-2 ring-[#ea580c]/10 shadow-lg scale-[1.02] z-10'
                  : 'bg-white border-stone-100 text-stone-500 shadow-sm hover:border-stone-200'
                  }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${recipe.unitWeight === size.weight ? 'bg-[#ea580c]/10 text-[#ea580c]' : 'bg-stone-50 text-stone-300'
                  }`}>
                  <i className={size.icon}></i>
                </div>
                <div>
                  <p className={`text-[11px] font-black uppercase tracking-tighter ${recipe.unitWeight === size.weight ? 'text-[#ea580c]' : 'text-stone-900'}`}>{size.label}</p>
                  <p className="text-lg font-black text-stone-900 leading-none tabular-nums">{size.weight}g</p>
                </div>
              </button>
            ))}
            <div className="flex-shrink-0 w-8"></div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-stretch no-print">
          <div className="bg-white p-4 rounded-3xl shadow-lg border border-stone-100 space-y-3 flex flex-col">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-stone-900 uppercase tracking-widest italic">Configuração</span>
              <button onClick={() => setShowEditor(true)} className="text-[8px] font-black text-[#ea580c] border border-orange-100 px-3 py-1.5 rounded-full hover:bg-orange-50 transition-all uppercase">
                <i className="fas fa-pen mr-1"></i> Customizar
              </button>
            </div>
            <div className="bg-stone-50/50 p-3 rounded-2xl border border-stone-100 flex-1 flex flex-col justify-center space-y-4">
              <div className="text-center">
                <h2 className="text-lg font-black text-stone-900 mb-1 leading-tight uppercase italic">{recipe.name}</h2>
                <p className="text-[8px] font-black text-stone-500 uppercase tracking-widest">{recipe.meats.length} cortes</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="text-[9px] font-black text-stone-900 uppercase italic">Qtd Unidades</label>
                  <span className="text-3xl font-black text-[#ea580c] tabular-nums tracking-tighter">{targetUnits}</span>
                </div>
                <input type="range" min="1" max="250" value={targetUnits} onChange={(e) => setTargetUnits(parseInt(e.target.value))} className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none accent-[#ea580c]" />
              </div>
            </div>
            <div className="bg-[#1c1917] text-white p-5 rounded-2xl text-center space-y-4">
              <div className="text-4xl font-black text-[#f97316] tabular-nums">
                {(recipe.fatRatio * 100).toFixed(0)}<span className="text-xl text-white/50 ml-0.5">%</span>
              </div>
              <input type="range" min="5" max="40" value={recipe.fatRatio * 100} onChange={(e) => setRecipe({ ...recipe, fatRatio: parseFloat(e.target.value) / 100 })} className="w-full h-1 bg-stone-700 rounded-lg appearance-none accent-[#f97316]" />
              <p className="text-[7px] font-black text-white/40 uppercase tracking-widest">Gordura no Blend</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-3xl shadow-lg border border-stone-100 flex flex-col">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-black text-stone-900 uppercase text-[9px] tracking-widest italic">Compras</h3>
              <button onClick={copyToClipboard} className={`px-3 py-2 rounded-lg text-[8px] font-black uppercase transition-all flex items-center gap-1.5 shadow-sm ${copyFeedback ? 'bg-emerald-500 text-white' : 'bg-stone-100 text-stone-600'}`}>
                <i className={`fas ${copyFeedback ? 'fa-check' : 'fa-copy'}`}></i> {copyFeedback ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <div className="space-y-2.5 flex-1">
              <IngredientCard label="Gordura Animal" weight={results.fat} color="bg-yellow-400" icon="fas fa-burn" percentage={recipe.fatRatio * 100} />
              {results.meats.map((m, idx) => (
                <IngredientCard key={idx} label={m.name} weight={m.weight} color={idx % 2 === 0 ? "bg-red-500" : "bg-rose-700"} icon="fas fa-drumstick-bite" percentage={m.ratioInTotal * 100} />
              ))}
            </div>
            <div className="mt-6 pt-5 border-t border-stone-50 grid grid-cols-2 gap-4">
              <div>
                <span className="text-[8px] font-black text-stone-500 uppercase block mb-0.5">Massa Total</span>
                <span className="text-2xl font-black text-stone-900 tracking-tighter tabular-nums">{(results.total / 1000).toFixed(2)}<span className="text-xs ml-0.5 uppercase">kg</span></span>
              </div>
              <div className="text-right">
                <span className="text-[8px] font-black text-stone-500 uppercase block mb-0.5">Rendimento</span>
                <span className="text-2xl font-black text-[#ea580c] tracking-tighter tabular-nums">{results.units}<span className="text-xs ml-0.5 uppercase text-stone-400">un.</span></span>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-3xl shadow-lg border border-stone-100 flex flex-col">
            <div className="w-full flex justify-between items-center mb-6">
              <h3 className="font-black text-stone-900 uppercase text-[9px] tracking-widest italic">Equilíbrio</h3>
              <button onClick={() => setShowCosts(true)} className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-[8px] font-black uppercase flex items-center gap-1.5 hover:bg-emerald-100 transition-all">
                <i className="fas fa-dollar-sign"></i> Custos
              </button>
            </div>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={6} dataKey="value" stroke="none">
                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', fontSize: '10px', fontWeight: 'bold' }} />
                  <Legend verticalAlign="bottom" height={30} iconType="circle" wrapperStyle={{ fontSize: '8px', fontWeight: '900', textTransform: 'uppercase' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {showEditor && <MeatEditor recipe={recipe} setRecipe={setRecipe} onClose={() => setShowEditor(false)} />}
        {showSuggestions && (
          <Suggestions
            suggestions={suggestions}
            apply={applySuggestion}
            onClose={() => setShowSuggestions(false)}
            isSearching={isSearching}
            loadSuggestions={loadSuggestions}
            currentCategory={currentCategory}
            customSearchQuery={customSearchQuery}
            setCustomSearchQuery={setCustomSearchQuery}
          />
        )}
        {showCameraOptions && (
          <CameraOptionsModal
            onClose={() => setShowCameraOptions(false)}
            onUpload={handleFileUpload}
            onOpenWebcam={() => { setShowCameraOptions(false); setShowWebcam(true); }}
          />
        )}
        {showWebcam && <WebcamCaptureModal onClose={() => setShowWebcam(false)} onCapture={processImage} />}
        {showCosts && <CostsModal results={results} prices={meatPrices} setPrices={setMeatPrices} costResults={costResults} sellingPrice={sellingPrice} setSellingPrice={setSellingPrice} onClose={() => setShowCosts(false)} />}
        {isProcessing && <ProcessingOverlay />}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-stone-100 p-3 z-40 no-print">
        <div className="max-w-7xl mx-auto flex justify-around items-center">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex flex-col items-center gap-0.5 text-[#ea580c]">
            <i className="fas fa-calculator text-base"></i>
            <span className="text-[7px] font-black uppercase tracking-widest">Calculadora</span>
          </button>
          <button onClick={() => loadSuggestions("Clássicos")} className="w-12 h-12 bg-[#1c1917] text-white rounded-2xl flex items-center justify-center shadow-2xl -mt-8 border-4 border-white">
            <i className="fas fa-search text-xs text-[#f97316]"></i>
          </button>
          <button onClick={() => setShowInstallGuide(true)} className="flex flex-col items-center gap-0.5 text-stone-500">
            <i className="fas fa-mobile-alt text-base"></i>
            <span className="text-[7px] font-black uppercase tracking-widest">App</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

const IngredientCard = ({ label, weight, color, icon, percentage }: any) => (
  <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100 flex items-center gap-3 group hover:bg-white hover:shadow-md transition-all">
    <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center text-white shadow-md`}>
      <i className={icon + " text-sm"}></i>
    </div>
    <div className="flex-1">
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-[10px] font-black text-stone-900 uppercase italic">{label}</span>
        <span className="text-[8px] font-black text-stone-500 tabular-nums">{percentage.toFixed(0)}%</span>
      </div>
      <div className="text-lg font-black text-stone-900 tabular-nums tracking-tighter">
        {weight >= 1000 ? (weight / 1000).toFixed(2) : Math.round(weight)}
        <span className="text-[10px] ml-0.5 uppercase text-stone-500">{weight >= 1000 ? 'kg' : 'g'}</span>
      </div>
    </div>
  </div>
);

const PanelBase = ({ children, onClose, title, icon, color = "text-stone-900", maxWidth = "max-w-2xl" }: any) => (
  <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 bg-stone-900/60 backdrop-blur-sm overflow-y-auto no-print">
    <div className={`bg-white w-full ${maxWidth} rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden`}>
      <div className="p-4 border-b border-stone-50 flex justify-between items-center bg-white z-10">
        <div className="flex items-center gap-2">
          {icon && <i className={`${icon} ${color} text-base`}></i>}
          <h3 className={`font-black text-sm italic uppercase ${color}`}>{title}</h3>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 hover:bg-stone-200 transition active:scale-90">
          <i className="fas fa-times text-xs"></i>
        </button>
      </div>
      <div className="p-4 sm:p-6 overflow-y-auto">
        {children}
      </div>
    </div>
  </div>
);

const MeatEditor = ({ recipe, setRecipe, onClose }: any) => {
  const [localMeats, setLocalMeats] = useState([...recipe.meats]);
  const updateMeat = (index: number, field: keyof MeatComponent, value: any) => {
    const newMeats = [...localMeats];
    newMeats[index] = { ...newMeats[index], [field]: value };
    setLocalMeats(newMeats);
  };
  const addMeat = () => setLocalMeats([...localMeats, { name: 'Nova Carne', ratio: 0.1 }]);
  const removeMeat = (index: number) => setLocalMeats(localMeats.filter((_, i) => i !== index));
  const handleSave = () => {
    setRecipe({ ...recipe, meats: localMeats });
    onClose();
  };
  return (
    <PanelBase title="Customizar Carnes" icon="fas fa-pen" onClose={onClose} color="text-[#ea580c]" maxWidth="max-w-md">
      <div className="space-y-3">
        {localMeats.map((m, idx) => (
          <div key={idx} className="flex gap-2 items-center bg-stone-50 p-3 rounded-xl border border-stone-100">
            <div className="flex-1 min-w-0">
              <input type="text" value={m.name} onChange={(e) => updateMeat(idx, 'name', e.target.value)} className="w-full bg-transparent font-bold text-[11px] text-stone-900 outline-none" />
            </div>
            <div className="flex items-center gap-1.5 shrink-0 px-2 border-l border-stone-200">
              <input type="number" value={Math.round(m.ratio * 100)} onChange={(e) => updateMeat(idx, 'ratio', parseFloat(e.target.value) / 100)} className="w-8 bg-transparent font-black text-[11px] text-stone-900 text-right outline-none" />
              <span className="text-[9px] font-black text-stone-400">%</span>
            </div>
            <button onClick={() => removeMeat(idx)} className="text-red-400 p-1.5 hover:bg-red-50 rounded-lg"><i className="fas fa-trash-alt text-[10px]"></i></button>
          </div>
        ))}
        <button onClick={addMeat} className="w-full py-3 border-2 border-dashed border-stone-100 text-stone-400 rounded-xl font-black text-[8px] uppercase">ADICIONAR</button>
        <button onClick={handleSave} className="w-full bg-[#1c1917] text-white py-3 rounded-xl font-black uppercase text-[10px] mt-4">SALVAR</button>
      </div>
    </PanelBase>
  );
};

const CostsModal = ({ results, prices, setPrices, costResults, sellingPrice, setSellingPrice, onClose }: any) => {
  const updatePrice = (name: string, price: string) => {
    const val = parseFloat(price.replace(',', '.'));
    setPrices((prev: any) => ({ ...prev, [name]: isNaN(val) ? 0 : val }));
  };
  return (
    <PanelBase title="Gestão & Lucro" icon="fas fa-calculator" onClose={onClose} color="text-emerald-600" maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
          <p className="text-[7px] font-black text-stone-400 uppercase mb-2">Preço de Venda Sugerido</p>
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 font-black">R$</span>
            <input type="number" step="0.5" defaultValue={sellingPrice} onBlur={(e) => setSellingPrice(parseFloat(e.target.value))} className="w-full bg-transparent font-black text-xl text-emerald-600 outline-none" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-[8px] font-black text-stone-500 uppercase">Preços por KG</p>
          <div className="bg-stone-50 p-3 rounded-xl flex justify-between">
            <span className="text-[10px] font-bold">Gordura Animal</span>
            <input type="number" defaultValue={prices['Gordura Animal']} onBlur={(e) => updatePrice('Gordura Animal', e.target.value)} className="w-16 bg-white border rounded text-center text-xs" />
          </div>
          {results.meats.map((m: any, i: number) => (
            <div key={i} className="bg-stone-50 p-3 rounded-xl flex justify-between">
              <span className="text-[10px] font-bold">{m.name}</span>
              <input type="number" defaultValue={prices[m.name] || 0} onBlur={(e) => updatePrice(m.name, e.target.value)} className="w-16 bg-white border rounded text-center text-xs" />
            </div>
          ))}
        </div>
        <div className="bg-emerald-600 text-white p-5 rounded-3xl text-center space-y-1">
          <p className="text-[10px] font-black uppercase opacity-60">Margem Bruta por Unidade</p>
          <p className="text-3xl font-black">R$ {costResults.profit.toFixed(2)}</p>
          <p className="text-[9px] font-bold">Custo de Produção: R$ {costResults.perUnit.toFixed(2)}</p>
        </div>
      </div>
    </PanelBase>
  );
};

const Suggestions = ({ suggestions, apply, onClose, isSearching, loadSuggestions, currentCategory, customSearchQuery, setCustomSearchQuery }: any) => {
  return (
    <PanelBase title="Blends Profissionais (IA)" icon="fas fa-robot" onClose={onClose} color="text-[#ea580c]">
      <div className="space-y-6">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {BLEND_CATEGORIES.map(cat => (
            <button key={cat} onClick={() => loadSuggestions(cat)} className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase flex-shrink-0 transition-all ${currentCategory === cat ? 'bg-[#ea580c] text-white shadow-lg' : 'bg-stone-100 text-stone-500'}`}>
              {cat}
            </button>
          ))}
        </div>

        {isSearching ? (
          <div className="py-12 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-orange-100 border-t-[#ea580c] rounded-full animate-spin"></div>
            <p className="text-[9px] font-black uppercase text-stone-500 italic">Consultando Redes Profissionais...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestions.map((s: any, idx: number) => (
              <div key={idx} onClick={() => apply(s)} className="group bg-stone-50 p-4 rounded-2xl border border-stone-100 hover:border-[#ea580c] hover:bg-white cursor-pointer transition-all">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-black text-[10px] text-stone-900 group-hover:text-[#ea580c] transition-colors">{s.name}</h4>
                  <span className="text-[7px] font-black text-[#ea580c] bg-orange-50 px-2 py-0.5 rounded-md">{(s.fatRatio * 100).toFixed(0)}% FAT</span>
                </div>
                <p className="text-[9px] text-stone-500 line-clamp-2 italic leading-relaxed">"{s.description}"</p>
                {s.citations && (
                  <div className="mt-2 flex gap-1">
                    {s.citations.map((c: any, i: number) => (
                      <a key={i} href={c.uri} target="_blank" rel="noopener noreferrer" className="text-[6px] text-[#ea580c] hover:underline" onClick={(e) => e.stopPropagation()}>
                        <i className="fas fa-link mr-0.5"></i> {c.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PanelBase>
  );
};

const CameraOptionsModal = ({ onClose, onUpload, onOpenWebcam }: any) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
    <div className="bg-white w-full max-w-xs rounded-[2.5rem] p-8 space-y-4">
      <h3 className="text-center font-black uppercase italic text-xs">Nova Análise</h3>
      <div className="grid grid-cols-1 gap-2">
        <button onClick={onOpenWebcam} className="bg-[#1c1917] text-white p-5 rounded-3xl flex flex-col items-center gap-2">
          <i className="fas fa-camera text-xl text-[#ea580c]"></i>
          <span className="text-[8px] font-black uppercase tracking-widest">Câmera ao Vivo</span>
        </button>
        <label className="cursor-pointer bg-stone-50 p-5 rounded-3xl flex flex-col items-center gap-2 border border-stone-100">
          <i className="fas fa-images text-xl text-stone-400"></i>
          <span className="text-[8px] font-black uppercase tracking-widest">Galeria</span>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { onClose(); onUpload(e); }} />
        </label>
      </div>
      <button onClick={onClose} className="w-full text-stone-400 font-black uppercase text-[8px] mt-2">Cancelar</button>
    </div>
  </div>
);

const WebcamCaptureModal = ({ onClose, onCapture }: any) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(s => {
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    });
    return () => stream?.getTracks().forEach(t => t.stop());
  }, []);
  const capture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    canvas.toBlob(blob => {
      if (blob) onCapture(new File([blob], "capture.jpg", { type: "image/jpeg" }));
      onClose();
    }, "image/jpeg");
  };
  return (
    <div className="fixed inset-0 z-[300] bg-black flex flex-col">
      <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover" />
      <div className="p-8 flex justify-center bg-black">
        <button onClick={capture} className="w-14 h-14 rounded-full border-4 border-white flex items-center justify-center">
          <div className="w-10 h-10 bg-white rounded-full"></div>
        </button>
      </div>
      <button onClick={onClose} className="absolute top-6 right-6 text-white text-xl"><i className="fas fa-times"></i></button>
    </div>
  );
};

const ProcessingOverlay = () => (
  <div className="fixed inset-0 z-[400] flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl">
    <div className="w-10 h-10 border-4 border-[#ea580c]/20 border-t-[#ea580c] rounded-full animate-spin mb-4"></div>
    <h2 className="text-xs font-black text-white uppercase italic tracking-widest animate-pulse">Analisando Blend...</h2>
  </div>
);

export default App;
