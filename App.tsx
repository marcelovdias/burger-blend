import React, { useState, useMemo, useRef, useEffect } from 'react';
import { extractRecipeFromImage, searchProfessionalBlends } from './services/geminiService';
import { Recipe, CalculationResult, SuggestedBlend, BurgerSize, MeatComponent } from './types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { BURGER_SIZES, BLEND_CATEGORIES } from './src/constants';

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


const IngredientCard = ({label, weight, color, icon, percentage}: any) => (
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
const PanelBase = ({children, onClose, title, icon, color = "text-stone-900", maxWidth = "max-w-2xl"}: any) => (
<div className="fixed inset-x-0 top-[64px] bottom-0 z-[50] flex items-start justify-center p-3 bg-stone-50/95 backdrop-blur-sm overflow-y-auto animate-in slide-in-from-bottom-4 duration-300 no-print">
  <div className={`bg-white w-full ${maxWidth} rounded-3xl shadow-2xl border border-stone-100 flex flex-col mb-16`}>
    <div className="p-4 border-b border-stone-50 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md rounded-t-3xl z-10">
      <div className="flex items-center gap-2">
        {icon && <i className={`${icon} ${color} text-base`}></i>}
        <h3 className={`font-black text-sm italic uppercase ${color}`}>{title}</h3>
      </div>
      <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 hover:bg-stone-200 transition active:scale-90">
        <i className="fas fa-times text-xs"></i>
      </button>
    </div>
    <div className="p-4 sm:p-6">
      {children}
    </div>
  </div>
</div>
);
const MeatEditor = ({recipe, setRecipe, onClose}: any) => {
const [localMeats, setLocalMeats] = useState([...recipe.meats]);
const updateMeat = (index: number, field: keyof MeatComponent, value: any) => {
const newMeats = [...localMeats];
newMeats[index] = {...newMeats[index], [field]: value };
setLocalMeats(newMeats);
};
const addMeat = () => {
  setLocalMeats([...localMeats, { name: 'Nova Carne', ratio: 0.1 }]);
};
const removeMeat = (index: number) => {
const newMeats = localMeats.filter((_: any, i: number) => i !== index);
setLocalMeats(newMeats);
};
const handleSave = () => {
  setRecipe({ ...recipe, meats: localMeats });
onClose();
};
return (
<PanelBase title="Customizar Carnes" icon="fas fa-pen" onClose={onClose} color="text-[#ea580c]" maxWidth="max-w-sm">
  <div className="space-y-5">
    <div className="space-y-3">
      {localMeats.map((m: any, idx: number) => (
        <div key={idx} className="flex gap-3 items-center bg-stone-50 p-3 rounded-xl border border-stone-100 shadow-sm">
          <div className="flex-1 min-w-0">
            <label className="text-[9px] font-black text-stone-500 uppercase mb-1 block tracking-wider">Corte</label>
            <input type="text" value={m.name} onChange={(e) => updateMeat(idx, 'name', e.target.value)} className="w-full bg-white border border-stone-200 rounded-lg p-2 font-bold text-sm text-stone-800 outline-none focus:border-[#ea580c] transition-all" />
          </div>
          <div className="w-20 text-right flex-shrink-0">
            <label className="text-[9px] font-black text-stone-500 uppercase mb-1 block tracking-wider">%</label>
            <div className="flex items-center bg-white border border-stone-200 rounded-lg p-1.5 focus-within:border-[#ea580c] transition-all">
              <input type="number" step="1" value={Math.round(m.ratio * 100)} onChange={(e) => updateMeat(idx, 'ratio', parseFloat(e.target.value) / 100)} className="w-full bg-transparent font-bold text-sm text-stone-900 text-center outline-none" />
              <span className="text-[10px] font-bold text-stone-400 select-none">%</span>
            </div>
          </div>
          <button onClick={() => removeMeat(idx)} className="w-9 h-9 flex-shrink-0 flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all mt-3">
            <i className="fas fa-trash-alt text-sm"></i>
          </button>
        </div>
      ))}
      <button onClick={addMeat} className="w-full py-4 border-2 border-dashed border-stone-300 text-stone-400 rounded-xl font-bold text-[10px] uppercase hover:border-[#ea580c] hover:text-[#ea580c] transition-all hover:bg-orange-50/50">
        <i className="fas fa-plus mr-1.5"></i> Adicionar Carne
      </button>
    </div>
    <div className="grid grid-cols-2 gap-3 pt-5 border-t border-stone-100">
      <button onClick={onClose} className="w-full bg-stone-100 text-stone-500 py-3.5 rounded-xl font-bold uppercase tracking-widest text-[9px] hover:bg-stone-200 transition-colors">Cancelar</button>
      <button onClick={handleSave} className="w-full bg-[#1c1917] text-white py-3.5 rounded-xl font-bold uppercase tracking-widest text-[9px] hover:bg-stone-800 transition-colors shadow-lg hover:shadow-xl translate-y-0 hover:-translate-y-0.5 transform">Salvar</button>
    </div>
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
<PanelBase title="Gestão & Lucro" icon="fas fa-calculator-dollar" onClose={onClose} color="text-emerald-600" maxWidth="max-w-md">
<div className="space-y-6">
<div className="space-y-3">
  <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest italic">Preços de Compra (R$/kg)</p>
  <div className="grid grid-cols-1 gap-2">
    <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all">
      <span className="text-xs font-black uppercase text-stone-900 italic">Gordura Animal</span>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black text-stone-500">R$</span>
        <input type="text" inputMode="decimal" defaultValue={prices['Gordura Animal']?.toString().replace('.', ',')} onBlur={(e) => updatePrice('Gordura Animal', e.target.value)} className="w-20 bg-white border border-stone-200 p-2 rounded-lg font-black text-center text-sm outline-none focus:border-emerald-500 transition-all" />
      </div>
    </div>
    {results.meats.map((m: any, idx: number) => (
      <div key={idx} className="bg-stone-50 p-3 rounded-xl border border-stone-100 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all">
        <span className="text-xs font-black uppercase text-stone-900 italic">{m.name}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-stone-500">R$</span>
          <input type="text" inputMode="decimal" defaultValue={prices[m.name]?.toString().replace('.', ',')} onBlur={(e) => updatePrice(m.name, e.target.value)} className="w-20 bg-white border border-stone-200 p-2 rounded-lg font-black text-center text-sm outline-none focus:border-emerald-500 transition-all" />
        </div>
      </div>
    ))}
  </div>
</div>
<div className="space-y-3 pt-4 border-t border-stone-50">
<p className="text-[10px] font-black text-stone-500 uppercase tracking-widest italic">Simulador de Venda (R$/un.)</p>
<div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center justify-between shadow-sm">
<span className="text-xs font-black uppercase text-emerald-900 italic">Preço de Venda</span>
<div className="flex items-center gap-2">
<span className="text-[10px] font-black text-emerald-500">R$</span>
<input type="text" inputMode="decimal" defaultValue={sellingPrice.toString().replace('.', ',')} onBlur={(e) => {
  const val = parseFloat(e.target.value.replace(',', '.'));
  setSellingPrice(isNaN(val) ? 0 : val);
}} className="w-24 bg-white border border-emerald-200 p-2.5 rounded-lg font-black text-center text-lg text-emerald-600 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all" />
</div>
</div>
</div>
<div className="bg-[#1c1917] text-white p-5 rounded-2xl space-y-4 shadow-xl relative overflow-hidden">
  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full -mr-8 -mt-8 blur-3xl"></div>
  <div className="flex justify-between items-center border-b border-white/10 pb-3">
    <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Custo Unitário</span>
    <span className="text-2xl font-black tabular-nums">{costResults.perUnit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
  </div>
  <div className="flex justify-between items-center">
    <div>
      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 block mb-0.5">Lucro Bruto / un.</span>
      <p className="text-[8px] text-white/30 font-bold uppercase">Margem: {costResults.margin.toFixed(1)}%</p>
    </div>
    <span className="text-3xl font-black text-emerald-400 tabular-nums tracking-tighter">{costResults.profit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
  </div>
</div>
<button onClick={onClose} className="w-full bg-stone-100 text-stone-500 py-4 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-stone-200 transition-all">Fechar</button>
</div>
</PanelBase>
);
};
const Suggestions = ({ suggestions, apply, onClose, isSearching, loadSuggestions, currentCategory, customSearchQuery, setCustomSearchQuery }: any) => {
const allCitations = useMemo(() => {
const unique = new Map();
suggestions.forEach(s => s.citations?.forEach(c => unique.set(c.uri, c)));
return Array.from(unique.values());
}, [suggestions]);
const handleCustomSearch = (e: React.FormEvent) => {
e.preventDefault();
if (customSearchQuery.trim()) loadSuggestions(customSearchQuery);
};
return (
<PanelBase title="Blends Profissionais (IA)" icon="fas fa-robot" onClose={onClose} color="text-[#ea580c]">
<div className="space-y-6">
<div className="space-y-3">
  <form onSubmit={handleCustomSearch} className="relative">
    <input type="text" placeholder="Pesquisar blend específico..." value={customSearchQuery} onChange={(e) => setCustomSearchQuery(e.target.value)} className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-4 pl-5 pr-14 text-[10px] font-bold focus:bg-white focus:ring-4 focus:ring-orange-500/5 outline-none transition-all" />
    <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#ea580c] text-white rounded-xl flex items-center justify-center hover:bg-[#c2410c] transition-all shadow-lg shadow-orange-200">
      <i className="fas fa-search text-xs"></i>
    </button>
  </form>
  <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
    {BLEND_CATEGORIES.map(cat => (
      <button key={cat} onClick={() => loadSuggestions(cat)} className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase flex-shrink-0 transition-all ${currentCategory === cat ? 'bg-[#ea580c] text-white shadow-lg shadow-orange-200' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}>
        {cat}
      </button>
    ))}
  </div>
</div>
<div className="min-h-[200px]">
  {isSearching ? (
    <div className="py-12 flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-orange-100 border-t-[#ea580c] rounded-full animate-spin"></div>
      <p className="text-[9px] font-black uppercase text-stone-500 tracking-widest animate-pulse italic">Consultando Redes Profissionais...</p>
    </div>
  ) : suggestions.length === 0 ? (
    <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
      <i className="fas fa-search-minus text-stone-200 text-4xl mb-1"></i>
      <h4 className="font-black text-[10px] uppercase text-stone-600 italic">Nenhum blend encontrado</h4>
      <button onClick={() => loadSuggestions(currentCategory)} className="text-[#ea580c] font-black uppercase text-[9px] mt-1 underline underline-offset-4">Tentar Novamente</button>
    </div>
  ) : (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {suggestions.map((s: any, idx: number) => (
          <div key={idx} onClick={() => apply(s)} className="group bg-stone-50 p-4 rounded-2xl border border-stone-100 hover:border-[#ea580c] hover:bg-white cursor-pointer transition-all hover:shadow-lg">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-black text-[10px] text-stone-900 group-hover:text-[#ea580c] transition-colors leading-tight">{s.name}</h4>
              <span className="text-[7px] font-black text-[#ea580c] bg-orange-50 px-2 py-0.5 rounded-md">{(s.fatRatio * 100).toFixed(0)}% FAT</span>
            </div>
            <p className="text-[9px] text-stone-500 line-clamp-2 italic font-medium leading-relaxed">"{s.description}"</p>
          </div>
        ))}
      </div>
      {allCitations.length > 0 && (
        <div className="pt-6 border-t border-stone-50">
          <h5 className="text-[8px] font-black text-stone-500 uppercase tracking-widest mb-3 flex items-center gap-1.5 italic">
            <i className="fas fa-link text-[#ea580c]"></i> Fontes e Referências
          </h5>
          <div className="flex flex-wrap gap-1.5">
            {allCitations.map((c, i) => (
              <a key={i} href={c.uri} target="_blank" rel="noopener noreferrer" className="text-[8px] font-bold text-stone-600 bg-stone-50 px-3 py-1.5 rounded-lg hover:bg-stone-100 transition-all flex items-center gap-1.5 border border-stone-100">
                <i className="fas fa-external-link-alt text-[7px] text-stone-400"></i> {c.title}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )}
</div>
</div>
</PanelBase>
);
};
const Manual = ({ onClose }: any) => (
<PanelBase title="Dicas de Elite" icon="fas fa-lightbulb" onClose={onClose} color="text-amber-500">
<div className="space-y-4 text-xs font-medium text-stone-700 leading-relaxed">
<div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 space-y-3">
<p><strong>Gordura:</strong> Use Peito ou Costela. Evite gordura de rim, que derrete muito rápido e altera o sabor.</p>
<p><strong>Temperatura:</strong> Moer carne gelada (próximo a 0°C) evita que a gordura se separe das fibras, mantendo a emulsão.</p>
<p><strong>Manuseio:</strong> Molde rapidamente. Quanto menos contato manual, menos calor você transfere para a gordura.</p>
<p><strong>Descanso:</strong> A carne precisa relaxar após a moagem. Deixe os burgers moldados na geladeira por 30m antes de ir para o fogo.</p>
<p><strong>Sal:</strong> Jamais misture sal no blend antes de moldar (vamonos virar quibe!). Salgue apenas por fora, segundos antes de entrar na chapa.</p>
</div>
</div>
</PanelBase>
);
const HistoryModal = ({ onClose, onOpenCare, onOpenDIY }: any) => (
<PanelBase title="Enciclopédia Burger" icon="fas fa-book-open" onClose={onClose} color="text-[#ea580c]">
<div className="space-y-10 text-stone-700">
<section className="space-y-4">
<h4 className="font-black text-lg text-stone-900 uppercase italic flex items-center gap-2.5"><i className="fas fa-globe-americas text-[#ea580c]"></i> A Jornada Mundial</h4>
<div className="space-y-3 text-xs leading-relaxed font-medium text-justify">
  <p>
    A história do hambúrguer é uma saga de migração e inovação. Tudo começou com as tribos tártaras da Ásia Central, que amaciavam carne crua sob suas selas. Essa técnica chegou ao porto de <strong>Hamburgo, na Alemanha</strong>, onde evoluiu para o "Hamburg Steak" — carne picada, temperada e cozida.
  </p>
  <p>
    No século XIX, imigrantes alemães levaram a receita para os EUA. A grande revolução ocorreu quando essa carne foi colocada entre duas fatias de pão, permitindo que operários comessem enquanto trabalhavam. Marcos como a <strong>Louis' Lunch (1900)</strong> e a <strong>Feira Mundial de St. Louis (1904)</strong> consolidaram o hambúrguer como o ícone do <em>American Way of Life</em>.
  </p>
</div>
</section>
<section className="space-y-4">
<h4 className="font-black text-lg text-stone-900 uppercase italic flex items-center gap-2.5"><i className="fas fa-map-marker-alt text-[#ea580c]"></i> O Hambúrguer no Brasil</h4>
<div className="space-y-3 text-xs leading-relaxed font-medium text-justify">
  <p>
    O hambúrguer chegou ao Brasil em <strong>1952</strong>, pelas mãos do tenista americano-brasileiro <strong>Robert Falkenburg</strong>, que fundou o primeiro <strong>Bob's</strong> em Copacabana, Rio de Janeiro. Ele trouxe o conceito de fast-food, milk-shakes e o clássico sundae.
  </p>
  <p>
    Nas décadas de 70 e 80, o hambúrguer se popularizou com a chegada de grandes redes e a criação das "lanchonetes de bairro", que adaptaram o sanduíche ao paladar brasileiro com o famoso "X-Tudo". Hoje, vivemos a <strong>Revolução Artesanal</strong>, onde o foco voltou para a qualidade do blend, técnicas de moagem e o respeito ao produto.
  </p>
</div>
</section>
<section className="space-y-4">
<h4 className="font-black text-lg text-stone-900 uppercase italic flex items-center gap-2.5"><i className="fas fa-fire text-[#ea580c]"></i> Métodos de Preparo & Tempos</h4>
<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
  <div className="bg-stone-50 p-5 rounded-2xl border border-stone-100 hover:bg-white hover:shadow-lg transition-all">
    <div className="flex justify-between items-start mb-2">
      <h5 className="font-black text-[10px] uppercase text-stone-900 flex items-center gap-1.5"><i className="fas fa-burn text-orange-500"></i> Churrasqueira</h5>
      <span className="text-[8px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-md">8-12 MIN</span>
    </div>
    <p className="text-[10px] leading-relaxed"><strong>Gordura: 20-25%</strong>. Fogo alto (braseiro forte). 4-5 min de cada lado para ponto médio. O descanso de 2 min é obrigatório.</p>
  </div>
  <div className="bg-stone-50 p-5 rounded-2xl border border-stone-100 hover:bg-white hover:shadow-lg transition-all">
    <div className="flex justify-between items-start mb-2">
      <h5 className="font-black text-[10px] uppercase text-stone-900 flex items-center gap-1.5"><i className="fas fa-square text-stone-400"></i> Chapa / Smash</h5>
      <span className="text-[8px] font-black bg-stone-200 text-stone-600 px-2 py-0.5 rounded-md">3-6 MIN</span>
    </div>
    <p className="text-[10px] leading-relaxed"><strong>Gordura: 15-25%</strong>. Chapa tinindo. Para Smash, pressione por 10s. 2 min de um lado, 1 min do outro com queijo.</p>
  </div>
  <div className="bg-stone-50 p-5 rounded-2xl border border-stone-100 hover:bg-white hover:shadow-lg transition-all">
    <div className="flex justify-between items-start mb-2">
      <h5 className="font-black text-[10px] uppercase text-stone-900 flex items-center gap-1.5"><i className="fas fa-wind text-blue-400"></i> Air Fryer</h5>
      <span className="text-[8px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-md">10-15 MIN</span>
    </div>
    <p className="text-[10px] leading-relaxed"><strong>Gordura: 15%</strong>. Pré-aqueça a 200°C. 6 min de um lado, vire e deixe mais 4-6 min. Cuidado para não ressecar.</p>
  </div>
  <div className="bg-stone-50 p-5 rounded-2xl border border-stone-100 hover:bg-white hover:shadow-lg transition-all">
    <div className="flex justify-between items-start mb-2">
      <h5 className="font-black text-[10px] uppercase text-stone-900 flex items-center gap-1.5"><i className="fas fa-door-closed text-stone-600"></i> Forno</h5>
      <span className="text-[8px] font-black bg-stone-200 text-stone-600 px-2 py-0.5 rounded-md">15-20 MIN</span>
    </div>
    <p className="text-[10px] leading-relaxed"><strong>Gordura: 18%</strong>. 220°C em grade suspensa. Ideal para grandes quantidades. Use termômetro: 55°C interno para ponto.</p>
  </div>
</div>
</section>
<section className="space-y-4">
<h4 className="font-black text-lg text-stone-900 uppercase italic flex items-center gap-2.5"><i className="fas fa-utensils text-[#ea580c]"></i> Acompanhamentos de Mestre</h4>
<div className="space-y-3">
  <div className="bg-stone-900 text-white p-5 rounded-2xl shadow-lg">
    <h5 className="font-black text-[10px] uppercase text-[#f97316] mb-2 flex items-center gap-1.5"><i className="fas fa-egg"></i> Maionese Caseira (Base)</h5>
    <p className="text-[10px] leading-relaxed opacity-80">
      No liquidificador: 1 ovo inteiro, 1 colher de chá de mostarda, suco de meio limão e sal. Bata e vá adicionando óleo em fio bem fino até atingir o ponto de creme firme. <strong>Dica:</strong> Use óleo de girassol gelado para mais estabilidade.
    </p>
  </div>
  <div className="bg-[#ea580c] text-white p-5 rounded-2xl shadow-lg">
    <h5 className="font-black text-[10px] uppercase mb-2 flex items-center gap-1.5"><i className="fas fa-seedling"></i> Cebola Caramelizada</h5>
    <p className="text-[10px] leading-relaxed opacity-90">
      Fatie 3 cebolas grandes. Em fogo baixo, derreta manteiga e adicione as cebolas com uma pitada de sal. Cozinhe lentamente por 30-40 min mexendo sempre. Quando estiverem marrons e doces, finalize com um toque de shoyu ou vinagre balsâmico.
    </p>
  </div>
</div>
</section>
<div className="grid grid-cols-2 gap-3 pt-4">
<button onClick={onOpenCare} className="bg-stone-100 text-stone-900 p-4 rounded-xl font-black uppercase text-[8px] tracking-widest flex items-center justify-center gap-2 hover:bg-red-50 hover:text-red-600 transition-all border border-stone-200">
  <i className="fas fa-shield-heart text-sm"></i>
  Segurança
</button>
<button onClick={onOpenDIY} className="bg-stone-100 text-stone-900 p-4 rounded-xl font-black uppercase text-[8px] tracking-widest flex items-center justify-center gap-2 hover:bg-stone-800 hover:text-white transition-all border border-stone-200">
  <i className="fas fa-tools text-sm"></i>
  Equipamentos
</button>
</div>
</div>
</PanelBase>
);
const CareModal = ({ onClose }: any) => (
<PanelBase title="Atenção Sanitária" icon="fas fa-exclamation-triangle" onClose={onClose} color="text-red-600" maxWidth="max-w-md">
<div className="space-y-4 text-xs font-medium text-stone-700 leading-relaxed">
<p className="bg-red-50 p-5 rounded-2xl border border-red-100 text-red-900 font-bold italic">"Zona de Perigo: Entre 5°C e 60°C as bactérias se multiplicam rapidamente. Mantenha a carne sempre refrigerada."</p>
<ul className="space-y-3 list-none">
<li className="flex gap-2.5 items-start"><i className="fas fa-check text-red-500 mt-1"></i> Lave as mãos e utensílios antes e após manipular carne crua.</li>
<li className="flex gap-2.5 items-start"><i className="fas fa-check text-red-500 mt-1"></i> Não utilize a mesma tábua para carne e vegetais (contaminação cruzada).</li>
<li className="flex gap-2.5 items-start"><i className="fas fa-check text-red-500 mt-1"></i> Hambúrgueres de procedência desconhecida devem ser bem passados (71°C interno).</li>
</ul>
<button onClick={onClose} className="w-full bg-stone-100 text-stone-500 py-4 rounded-xl font-black uppercase tracking-widest text-[9px] mt-2">Entendido</button>
</div>
</PanelBase>
);
const DIYModal = ({ onClose }: any) => (
<PanelBase title="Equipamentos DIY" icon="fas fa-tools" onClose={onClose} color="text-stone-900" maxWidth="max-w-md">
<div className="space-y-4 text-xs font-medium text-stone-700 leading-relaxed">
<div className="space-y-3">
<div className="bg-stone-50 p-5 rounded-2xl border border-stone-100 flex gap-3 items-start">
  <i className="fas fa-cog text-stone-500 text-lg mt-0.5"></i>
  <div>
    <h5 className="font-black text-[9px] uppercase text-stone-900 mb-0.5">Moedor Improvisado</h5>
    <p className="text-[10px]">Use o processador em pulsos curtos com a carne quase congelada para não virar pasta.</p>
  </div>
</div>
<div className="bg-stone-50 p-5 rounded-2xl border border-stone-100 flex gap-3 items-start">
  <i className="fas fa-circle text-stone-500 text-lg mt-0.5"></i>
  <div>
    <h5 className="font-black text-[9px] uppercase text-stone-900 mb-0.5">Aro de Moldar</h5>
    <p className="text-[10px]">Use uma tampa de pote de conserva ou um cano de PVC (limpo e atóxico) cortado.</p>
  </div>
</div>
<div className="bg-stone-50 p-5 rounded-2xl border border-stone-100 flex gap-3 items-start">
  <i className="fas fa-compress-arrows-alt text-stone-500 text-lg mt-0.5"></i>
  <div>
    <h5 className="font-black text-[9px] uppercase text-stone-900 mb-0.5">Prensa Smash</h5>
    <p className="text-[10px]">Uma espátula rígida e um peso (como outra panela de fundo reto) funcionam perfeitamente.</p>
  </div>
</div>
</div>
<button onClick={onClose} className="w-full bg-stone-100 text-stone-500 py-4 rounded-xl font-black uppercase tracking-widest text-[9px] mt-2">Fechar</button>
</div>
</PanelBase>
);
const InstallGuide = ({ onClose }: any) => (
<PanelBase title="Instalar App" icon="fas fa-mobile-alt" onClose={onClose} color="text-[#ea580c]" maxWidth="max-w-md">
<div className="space-y-6 text-center">
<div className="w-16 h-16 bg-[#ea580c] rounded-2xl mx-auto flex items-center justify-center text-white text-3xl shadow-2xl shadow-orange-200">
<i className="fas fa-hamburger"></i>
</div>
<div className="space-y-3">
<div className="bg-stone-50 p-5 rounded-2xl border border-stone-100 space-y-3 text-left">
  <p className="text-[10px] font-black text-stone-900 flex items-center gap-2.5 uppercase italic">
    <i className="fab fa-apple text-lg"></i> No iPhone (Safari)
  </p>
  <p className="text-[10px] text-stone-600 leading-relaxed">Toque no ícone de <strong>Compartilhar</strong> e selecione <strong>"Adicionar à Tela de Início"</strong>.</p>
</div>
<div className="bg-stone-50 p-5 rounded-2xl border border-stone-100 space-y-3 text-left">
  <p className="text-[10px] font-black text-stone-900 flex items-center gap-2.5 uppercase italic">
    <i className="fab fa-android text-lg"></i> No Android (Chrome)
  </p>
  <p className="text-[10px] text-stone-600 leading-relaxed">Toque nos <strong>três pontos</strong> e selecione <strong>"Instalar Aplicativo"</strong>.</p>
</div>
</div>
<button onClick={onClose} className="w-full bg-stone-100 text-stone-500 py-4 rounded-xl font-black uppercase tracking-widest text-[9px]">Fechar</button>
</div>
</PanelBase>
);
const ProcessingOverlay = () => (
<div className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-black/90 backdrop-blur-2xl">
<div className="w-12 h-12 border-4 border-[#ea580c]/20 border-t-[#ea580c] rounded-full animate-spin mb-4"></div>
<h2 className="text-sm font-black text-white uppercase italic tracking-[0.3em] animate-pulse">Analisando Blend...</h2>
</div>
);
const CameraOptionsModal = ({ onClose, onUpload, onOpenWebcam }: { onClose: () => void, onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void, onOpenWebcam: () => void }) => (
<div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
<div className="bg-white w-full max-w-xs rounded-[2.5rem] shadow-2xl p-8 space-y-6 animate-in fade-in zoom-in duration-300">
<div className="text-center">
<h3 className="font-black text-lg italic uppercase text-stone-900">Nova Análise</h3>
<p className="text-[9px] text-stone-500 font-black uppercase tracking-widest mt-1.5">Selecione a Origem</p>
</div>
<div className="grid grid-cols-1 gap-3">
<button onClick={onOpenWebcam} className="bg-[#1c1917] hover:bg-stone-800 text-white p-5 rounded-2xl flex flex-col items-center gap-2 transition-all active:scale-95 border-2 border-transparent hover:border-[#ea580c] shadow-xl">
  <i className="fas fa-camera text-2xl text-[#ea580c]"></i>
  <span className="text-[9px] font-black uppercase tracking-widest">Abrir Câmera</span>
</button>
<label className="cursor-pointer bg-stone-50 hover:bg-stone-100 text-stone-900 p-5 rounded-2xl flex flex-col items-center gap-2 transition-all active:scale-95 border border-stone-100">
  <i className="fas fa-images text-2xl text-stone-400"></i>
  <span className="text-[9px] font-black uppercase tracking-widest">Galeria</span>
  <input type="file" accept="image/*" className="hidden" onChange={(e) => { onClose(); onUpload(e); }} />
</label>
</div>
<button onClick={onClose} className="w-full py-1 text-[9px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-600 transition-colors">Cancelar</button>
</div>
</div>
);
const WebcamCaptureModal = ({ onClose, onCapture }: { onClose: () => void, onCapture: (f: File) => void }) => {
const videoRef = useRef<HTMLVideoElement>(null);
const [stream, setStream] = useState<MediaStream | null>(null);
const [error, setError] = useState<string>("");
useEffect(() => {
const startCamera = async () => {
try {
const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
setStream(s);
if (videoRef.current) videoRef.current.srcObject = s;
} catch (err) {
setError("Não foi possível acessar a câmera. Verifique as permissões.");
}
};
startCamera();
return () => {
if (stream) stream.getTracks().forEach(t => t.stop());
};
}, []);
const capture = () => {
if (!videoRef.current) return;
const canvas = document.createElement("canvas");
canvas.width = videoRef.current.videoWidth;
canvas.height = videoRef.current.videoHeight;
canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
canvas.toBlob(blob => {
if (blob) {
const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
if (stream) stream.getTracks().forEach(t => t.stop());
onCapture(file);
onClose();
}
}, "image/jpeg", 0.8);
};
return (
<div className="fixed inset-0 z-[200] bg-black flex flex-col">
<div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
{error ? (
  <p className="text-white text-center px-6 font-black uppercase italic text-xs">{error}</p>
) : (
  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
)}
<button onClick={() => { if (stream) stream.getTracks().forEach(t => t.stop()); onClose(); }} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-xl z-10 border border-white/10">
  <i className="fas fa-times"></i>
</button>
</div>
<div className="h-32 bg-black flex items-center justify-center pb-8">
<button onClick={capture} className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-all shadow-2xl">
  <div className="w-12 h-12 rounded-full bg-white"></div>
</button>
</div>
</div>
);
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
    const margin = (profit / sellingPrice) * 100;
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
    } catch (error) {
      console.error(error);
      alert("Erro na pesquisa. Verifique sua conexão ou tente novamente.");
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
      } catch (error) { alert("Erro na extração."); } finally { setIsProcessing(false); }
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
          body { background: white !important; color: black !important; }
          header, footer, button, input[type="range"], .no-print { display: none !important; }
          .print-only { display: block !important; }
          .max-w-7xl { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
          .grid { display: block !important; }
          .bg-white, .bg-stone-50 { background: transparent !important; border: none !important; box-shadow: none !important; }
          .rounded-[2.5rem], .rounded-3xl { border-radius: 0 !important; }
          .print-header { display: flex !important; justify-content: space-between; align-items: center; border-bottom: 2px solid black; padding-bottom: 20px; margin-bottom: 30px; }
          .print-section { margin-bottom: 40px; page-break-inside: avoid; }
          .print-title { font-size: 24px; font-weight: 900; text-transform: uppercase; }
          .print-grid { display: grid !important; grid-template-columns: 1fr 1fr; gap: 20px; }
          .print-card { border: 1px solid #eee; padding: 15px; border-radius: 8px; }
        }
        .print-only { display: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      <div className="print-only print-container p-8 max-w-[210mm] mx-auto bg-white">
        <div className="flex justify-between items-start border-b-4 border-black pb-6 mb-8">
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-2">Burger Master Pro</h1>
            <div className="flex items-center gap-3">
              <span className="bg-black text-white px-3 py-1 text-sm font-bold uppercase tracking-widest rounded">Relatório de Produção</span>
              <span className="text-sm font-bold text-stone-500 uppercase tracking-widest">ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-stone-900">{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
            <p className="text-sm font-bold uppercase text-stone-500">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="bg-stone-50 p-6 border-2 border-stone-200 rounded-lg">
            <h3 className="text-xs font-black uppercase text-stone-400 tracking-widest mb-2">Produto</h3>
            <p className="text-3xl font-black text-stone-900 uppercase italic leading-none mb-1">{recipe.name}</p>
            <p className="text-sm font-bold text-stone-500 uppercase">{recipe.meats.length} Cortes • {recipe.grindMethod}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-stone-50 p-4 border-2 border-stone-200 rounded-lg text-center">
              <h3 className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1">Unidades</h3>
              <p className="text-4xl font-black text-stone-900">{targetUnits}</p>
            </div>
            <div className="bg-stone-50 p-4 border-2 border-stone-200 rounded-lg text-center">
              <h3 className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1">Peso Un.</h3>
              <p className="text-4xl font-black text-stone-900">{recipe.unitWeight}<span className="text-lg text-stone-400">g</span></p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-black uppercase text-black border-b-2 border-black pb-2 mb-4 tracking-widest">Composição do Blend</h3>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-300">
                <th className="py-2 text-xs font-black uppercase text-stone-500 w-1/2">Ingrediente</th>
                <th className="py-2 text-xs font-black uppercase text-stone-500 text-right">Proporção</th>
                <th className="py-2 text-xs font-black uppercase text-stone-500 text-right">Peso Total</th>
              </tr>
            </thead>
            <tbody className="text-sm font-bold text-stone-800">
              <tr className="border-b border-stone-100">
                <td className="py-3 uppercase flex items-center gap-2"><div className="w-3 h-3 bg-yellow-400 rounded-full"></div> Gordura Animal</td>
                <td className="py-3 text-right">{(recipe.fatRatio * 100).toFixed(0)}%</td>
                <td className="py-3 text-right">{(results.fat < 1000 ? Math.round(results.fat) + 'g' : (results.fat / 1000).toFixed(3) + 'kg')}</td>
              </tr>
              {results.meats.map((m, i) => (
                <tr key={i} className="border-b border-stone-100">
                  <td className="py-3 uppercase flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${i % 2 === 0 ? 'bg-red-500' : 'bg-red-700'}`}></div> {m.name}</td>
                  <td className="py-3 text-right">{(m.ratioInTotal * 100).toFixed(0)}%</td>
                  <td className="py-3 text-right">{(m.weight < 1000 ? Math.round(m.weight) + 'g' : (m.weight / 1000).toFixed(3) + 'kg')}</td>
                </tr>
              ))}
              <tr className="bg-stone-100">
                <td className="py-3 pl-3 font-black uppercase">Massa Total</td>
                <td className="py-3 text-right font-black">100%</td>
                <td className="py-3 text-right font-black pr-3">{(results.total / 1000).toFixed(3)}kg</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-2 gap-8 mt-auto">
          <div>
            <h3 className="text-sm font-black uppercase text-black border-b-2 border-black pb-2 mb-4 tracking-widest">Agendamento</h3>
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-stone-400 block mb-1">Data de Entrega</span>
                <div className="h-10 border-b border-stone-300 border-dashed"></div>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-stone-400 block mb-1">Horário</span>
                <div className="h-10 border-b border-stone-300 border-dashed"></div>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-black uppercase text-black border-b-2 border-black pb-2 mb-4 tracking-widest">Responsável</h3>
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-stone-400 block mb-1">Assinatura</span>
                <div className="h-24 border border-stone-300 rounded bg-stone-50"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

          <header className="bg-[#1c1917] text-white px-4 py-3 shadow-2xl sticky top-0 z-[100] border-b border-stone-800 no-print">
            <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="bg-[#ea580c] p-2 rounded-lg shadow-lg shadow-orange-900/20">
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
                  className="bg-[#262626] text-white px-3 sm:px-4 py-2 rounded-lg text-[9px] font-black uppercase flex items-center gap-1.5 border border-stone-700 hover:bg-stone-800 transition-all active:scale-95 flex-shrink-0"
                >
                  <i className="fas fa-search text-[#f97316]"></i>
                  <span className="hidden xs:inline-block">Explorar</span>
                </button>

                <button
                  onClick={() => setShowCameraOptions(true)}
                  className="bg-[#ea580c] text-white px-3 sm:px-4 py-2 rounded-lg text-[9px] font-black uppercase flex items-center gap-1.5 hover:bg-[#c2410c] transition-all active:scale-95 shadow-lg shadow-orange-900/20 flex-shrink-0"
                >
                  <i className="fas fa-camera"></i>
                  <span className="hidden xs:inline-block">Scan</span>
                </button>

                <button
                  onClick={() => setShowHistory(true)}
                  className="bg-[#1c1917] text-[#f97316] p-2 rounded-lg hover:bg-stone-800 transition-all flex-shrink-0 border border-stone-800 active:scale-95"
                  title="Enciclopédia Burger"
                >
                  <i className="fas fa-book-open text-sm"></i>
                </button>
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto p-3 lg:p-6 space-y-6">
            <section className="space-y-1 no-print">
              <div className="flex justify-between items-center px-1">
                <h3 className="font-black text-stone-900 uppercase text-[9px] tracking-widest flex items-center gap-1.5 italic">
                  <i className="fas fa-caret-right text-[#ea580c]"></i> Pesos do Mercado
                </h3>
              </div>

              <div
                ref={scrollRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                className={`flex overflow-x-auto py-4 gap-3 no-scrollbar snap-x snap-mandatory select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              >
                {BURGER_SIZES.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => !dragMoved && setRecipe({ ...recipe, unitWeight: size.weight })}
                    className={`flex-shrink-0 w-[110px] p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center text-center gap-2 snap-start relative ${recipe.unitWeight === size.weight
                      ? 'bg-white border-[#ea580c] ring-2 ring-[#ea580c]/10 shadow-lg scale-[1.02] z-10'
                      : 'bg-white border-stone-100 text-stone-500 shadow-sm hover:border-stone-200'
                      }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${recipe.unitWeight === size.weight ? 'bg-[#ea580c]/10 text-[#ea580c]' : 'bg-stone-50 text-stone-300'
                      }`}>
                      <i className={size.icon}></i>
                    </div>
                    <div>
                      <p className={`text-[10px] font-black uppercase tracking-tighter ${recipe.unitWeight === size.weight ? 'text-[#ea580c]' : 'text-stone-900'}`}>{size.label}</p>
                      <p className="text-xl font-black text-stone-900 leading-none tabular-nums">{size.weight}g</p>
                    </div>
                  </button>
                ))}
                <div className="flex-shrink-0 w-8"></div>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch no-print">
              <div className="bg-white p-5 rounded-3xl shadow-lg border border-stone-100 space-y-5 flex flex-col">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-stone-900 uppercase tracking-widest italic">Configuração</span>
                  <button onClick={() => setShowEditor(true)} className="text-[8px] font-black text-[#ea580c] border border-orange-100 px-3 py-1.5 rounded-full hover:bg-orange-50 transition-all uppercase">
                    <i className="fas fa-pen mr-1"></i> Customizar
                  </button>
                </div>

                <div className="bg-stone-50/50 p-5 rounded-2xl border border-stone-100 flex-1 flex flex-col justify-center space-y-6">
                  <div className="text-center">
                    <h2 className="text-lg font-black text-stone-900 mb-1 leading-tight uppercase italic">{recipe.name}</h2>
                    <p className="text-[8px] font-black text-stone-500 uppercase tracking-widest">{recipe.meats.length} cortes • Proporções Fixas</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <label className="text-[9px] font-black text-stone-900 uppercase italic">Qtd Unidades</label>
                      <span className="text-3xl font-black text-[#ea580c] tabular-nums tracking-tighter">{targetUnits}</span>
                    </div>
                    <input type="range" min="1" max="250" value={targetUnits} onChange={(e) => setTargetUnits(parseInt(e.target.value))} className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none accent-[#ea580c]" />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[9px] font-black text-stone-900 uppercase tracking-widest italic">Gordura no Blend</h4>
                  <div className="bg-[#1c1917] text-white p-5 rounded-2xl text-center space-y-4 shadow-lg">
                    <div className="text-4xl font-black text-[#f97316] tabular-nums">
                      {(recipe.fatRatio * 100).toFixed(0)}<span className="text-xl text-white/50 ml-0.5">%</span>
                    </div>
                    <input type="range" min="5" max="40" value={recipe.fatRatio * 100} onChange={(e) => setRecipe({ ...recipe, fatRatio: parseFloat(e.target.value) / 100 })} className="w-full h-1 bg-stone-700 rounded-lg appearance-none accent-[#f97316]" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl shadow-lg border border-stone-100 flex flex-col">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-black text-stone-900 uppercase text-[9px] tracking-widest italic">Lista de Compras</h3>
                  <div className="flex gap-1.5">
                    <button onClick={() => window.print()} className="p-2 rounded-lg text-[8px] font-black uppercase transition-all bg-stone-100 text-stone-600 hover:bg-stone-200">
                      <i className="fas fa-print"></i>
                    </button>
                    <button onClick={copyToClipboard} className={`px-3 py-2 rounded-lg text-[8px] font-black uppercase transition-all flex items-center gap-1.5 shadow-sm ${copyFeedback ? 'bg-emerald-500 text-white' : 'bg-stone-100 text-stone-600'}`}>
                      <i className={`fas ${copyFeedback ? 'fa-check' : 'fa-copy'}`}></i> {copyFeedback ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
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

              <div className="bg-white p-5 rounded-3xl shadow-lg border border-stone-100 flex flex-col items-center">
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
                <div className="mt-auto w-full pt-5 border-t border-stone-50 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-stone-900 uppercase italic">Custo Unitário</span>
                    <span className="text-xl font-black text-emerald-600 tabular-nums">
                      {costResults.perUnit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-stone-900 uppercase italic">Margem Bruta</span>
                    <span className={`text-xs font-black tabular-nums ${costResults.margin > 50 ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {costResults.margin.toFixed(1)}%
                    </span>
                  </div>
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
            {showGuide && <Manual onClose={() => setShowGuide(false)} />}
            {showInstallGuide && <InstallGuide onClose={() => setShowInstallGuide(false)} />}

            {showCameraOptions && (
              <CameraOptionsModal
                onClose={() => setShowCameraOptions(false)}
                onUpload={handleFileUpload}
                onOpenWebcam={() => { setShowCameraOptions(false); setShowWebcam(true); }}
              />
            )}

            {showWebcam && (
              <WebcamCaptureModal
                onClose={() => setShowWebcam(false)}
                onCapture={processImage}
              />
            )}

            {showHistory && <HistoryModal onClose={() => setShowHistory(false)} onOpenCare={() => { setShowHistory(false); setShowCare(true) }} onOpenDIY={() => { setShowHistory(false); setShowDIY(true) }} />}
            {showCare && <CareModal onClose={() => setShowCare(false)} />}
            {showDIY && <DIYModal onClose={() => setShowDIY(false)} />}
            {showCosts && <CostsModal results={results} prices={meatPrices} setPrices={setMeatPrices} costResults={costResults} sellingPrice={sellingPrice} setSellingPrice={setSellingPrice} onClose={() => setShowCosts(false)} />}
            {isProcessing && <ProcessingOverlay />}
          </main>

          <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-stone-100 p-3 z-40 no-print">
            <div className="max-w-7xl mx-auto flex justify-around items-center">
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex flex-col items-center gap-0.5 text-[#ea580c]">
                <i className="fas fa-calculator text-base"></i>
                <span className="text-[7px] font-black uppercase tracking-widest">Calculadora</span>
              </button>
              <button onClick={() => setShowGuide(true)} className="flex flex-col items-center gap-0.5 text-stone-500 hover:text-stone-700 transition">
                <i className="fas fa-lightbulb text-base"></i>
                <span className="text-[7px] font-black uppercase tracking-widest">Dicas</span>
              </button>
              <button onClick={() => setShowInstallGuide(true)} className="flex flex-col items-center gap-0.5 text-stone-500 hover:text-stone-700 transition">
                <i className="fas fa-mobile-alt text-base"></i>
                <span className="text-[7px] font-black uppercase tracking-widest">App</span>
              </button>
            </div>
          </footer>

          <footer className="print-none mt-12 py-8 text-center border-t border-stone-200">
            <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400">Burger Master Pro © 2024</p>
          </footer>
        </div>
        );
};

export default App;
