import React, { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

// ─── USDA API ───────────────────────────────────────────────────────────────
const USDA_API_KEY = "DEMO_KEY"; // Replace with free key from fdc.nal.usda.gov
const searchUSDA = async (query) => {
  try {
    const res = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=8&api_key=${USDA_API_KEY}`
    );
    const data = await res.json();
    return (data.foods || []).map((f) => ({
      id: f.fdcId,
      name: f.description,
      calories: Math.round(getNutrient(f.foodNutrients, "Energy") || 0),
      protein: Math.round(getNutrient(f.foodNutrients, "Protein") * 10) / 10 || 0,
      carbs: Math.round(getNutrient(f.foodNutrients, "Carbohydrate, by difference") * 10) / 10 || 0,
      fat: Math.round(getNutrient(f.foodNutrients, "Total lipid (fat)") * 10) / 10 || 0,
      per100g: true,
    }));
  } catch {
    return [];
  }
};

const getNutrient = (nutrients, name) => {
  const n = (nutrients || []).find((x) => x.nutrientName?.includes(name));
  return n?.value || 0;
};

// ─── DEFAULT INDIAN FOOD LIBRARY ────────────────────────────────────────────
const DEFAULT_INDIAN_FOODS = [
  { id: "ind_1",  name: "Roti (1 piece)",             calories: 71,  protein: 2.7, carbs: 14.7, fat: 0.4,  per100g: false },
  { id: "ind_2",  name: "Moong Dal Chilla (1 piece)", calories: 120, protein: 7,   carbs: 16,   fat: 3,    per100g: false },
  { id: "ind_3",  name: "Dal Tadka (1 bowl)",         calories: 180, protein: 10,  carbs: 28,   fat: 4,    per100g: false },
  { id: "ind_4",  name: "Paneer Bhurji (100g)",       calories: 265, protein: 18,  carbs: 5,    fat: 20,   per100g: true  },
  { id: "ind_5",  name: "Rajma (1 bowl)",             calories: 210, protein: 12,  carbs: 35,   fat: 2,    per100g: false },
  { id: "ind_6",  name: "Chole (1 bowl)",             calories: 270, protein: 14,  carbs: 40,   fat: 6,    per100g: false },
  { id: "ind_7",  name: "Aloo Sabzi (1 bowl)",        calories: 150, protein: 3,   carbs: 28,   fat: 4,    per100g: false },
  { id: "ind_8",  name: "Idli (1 piece)",             calories: 39,  protein: 1.9, carbs: 7.9,  fat: 0.2,  per100g: false },
  { id: "ind_9",  name: "Dosa (1 piece)",             calories: 133, protein: 3.4, carbs: 25,   fat: 2.5,  per100g: false },
  { id: "ind_10", name: "Upma (1 bowl)",              calories: 200, protein: 5,   carbs: 32,   fat: 6,    per100g: false },
  { id: "ind_11", name: "Poha (1 bowl)",              calories: 180, protein: 3,   carbs: 35,   fat: 3,    per100g: false },
  { id: "ind_12", name: "Khichdi (1 bowl)",           calories: 220, protein: 8,   carbs: 40,   fat: 3,    per100g: false },
  { id: "ind_13", name: "Paratha (1 piece)",          calories: 200, protein: 4,   carbs: 30,   fat: 7,    per100g: false },
  { id: "ind_14", name: "Methi Paratha (1 piece)",    calories: 190, protein: 5,   carbs: 28,   fat: 7,    per100g: false },
  { id: "ind_15", name: "Palak Paneer (1 bowl)",      calories: 280, protein: 16,  carbs: 12,   fat: 18,   per100g: false },
  { id: "ind_16", name: "Chicken Curry (1 bowl)",     calories: 320, protein: 28,  carbs: 8,    fat: 18,   per100g: false },
  { id: "ind_17", name: "Egg Bhurji (2 eggs)",        calories: 200, protein: 14,  carbs: 4,    fat: 14,   per100g: false },
  { id: "ind_18", name: "Sambar (1 bowl)",            calories: 120, protein: 6,   carbs: 18,   fat: 3,    per100g: false },
  { id: "ind_19", name: "Raita (1 bowl)",             calories: 80,  protein: 4,   carbs: 8,    fat: 3,    per100g: false },
  { id: "ind_20", name: "Steamed Rice (1 bowl)",      calories: 240, protein: 4,   carbs: 52,   fat: 0.5,  per100g: false },
];

const MEALS = ["Breakfast", "Lunch", "Dinner", "Snacks"];

const getLocalDate = (date) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
};

export default function Nutrition({ user, otherUser }) {
  const [tab, setTab] = useState("log");
  const [myData, setMyData] = useState({});
  const [theirData, setTheirData] = useState({});
  const [date, setDate] = useState(getLocalDate(new Date()));
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [activeMeal, setActiveMeal] = useState("Breakfast");
  const [showGoals, setShowGoals] = useState(false);
  const [goals, setGoals] = useState({ calories: 2000, protein: 150, carbs: 250, fat: 65 });
  const [customLibrary, setCustomLibrary] = useState([]);
  const [newCustomFood, setNewCustomFood] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "" });
  const searchTimeout = useRef();

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "nutrition", user), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setMyData(d.logs || {});
        setGoals(d.goals || { calories: 2000, protein: 150, carbs: 250, fat: 65 });
        setCustomLibrary(d.customFoods || []);
      }
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!otherUser) return;
    const unsub = onSnapshot(doc(db, "nutrition", otherUser), (snap) => {
      setTheirData(snap.exists() ? snap.data().logs || {} : {});
    });
    return () => unsub();
  }, [otherUser]);

  const saveAll = (updatedLogs, updatedGoals, updatedCustomFoods) => {
    setDoc(doc(db, "nutrition", user), {
      logs: updatedLogs ?? myData,
      goals: updatedGoals ?? goals,
      customFoods: updatedCustomFoods ?? customLibrary,
    }, { merge: true });
  };

  const handleSearch = (q) => {
    setSearchQuery(q);
    clearTimeout(searchTimeout.current);
    if (!q.trim()) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      const local = [...DEFAULT_INDIAN_FOODS, ...customLibrary].filter((f) =>
        f.name.toLowerCase().includes(q.toLowerCase())
      );
      const usda = await searchUSDA(q);
      setSearchResults([...local, ...usda].slice(0, 12));
      setSearching(false);
    }, 500);
  };

  const addFoodToLog = (food, grams = 100) => {
    const multiplier = food.per100g ? grams / 100 : 1;
    const entry = {
      id: Date.now(),
      name: food.name,
      calories: Math.round(food.calories * multiplier),
      protein: Math.round(food.protein * multiplier * 10) / 10,
      carbs: Math.round(food.carbs * multiplier * 10) / 10,
      fat: Math.round(food.fat * multiplier * 10) / 10,
    };
    const dayLog = myData[date] || {};
    const updated = { ...myData, [date]: { ...dayLog, [activeMeal]: [...(dayLog[activeMeal] || []), entry] } };
    setMyData(updated);
    saveAll(updated, null, null);
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeFoodFromLog = (meal, entryId) => {
    const dayLog = myData[date] || {};
    const updated = { ...myData, [date]: { ...dayLog, [meal]: (dayLog[meal] || []).filter((e) => e.id !== entryId) } };
    setMyData(updated);
    saveAll(updated, null, null);
  };

  const getDayTotals = (data, d) => {
    let cal = 0, prot = 0, carb = 0, fat = 0;
    MEALS.forEach((m) => {
      (data[d]?.[m] || []).forEach((e) => { cal += e.calories || 0; prot += e.protein || 0; carb += e.carbs || 0; fat += e.fat || 0; });
    });
    return { calories: Math.round(cal), protein: Math.round(prot * 10) / 10, carbs: Math.round(carb * 10) / 10, fat: Math.round(fat * 10) / 10 };
  };

  const myTotals    = getDayTotals(myData,    date);
  const theirTotals = getDayTotals(theirData, date);

  const saveGoals = (g) => { setGoals(g); saveAll(null, g, null); setShowGoals(false); };

  const addToCustomLibrary = () => {
    if (!newCustomFood.name || !newCustomFood.calories) return;
    const food = { id: `custom_${Date.now()}`, name: newCustomFood.name, calories: parseFloat(newCustomFood.calories) || 0, protein: parseFloat(newCustomFood.protein) || 0, carbs: parseFloat(newCustomFood.carbs) || 0, fat: parseFloat(newCustomFood.fat) || 0, per100g: false };
    const updated = [...customLibrary, food];
    setCustomLibrary(updated);
    saveAll(null, null, updated);
    setNewCustomFood({ name: "", calories: "", protein: "", carbs: "", fat: "" });
  };

  const MacroBar = ({ label, val, goal, color }) => {
    const pct = Math.min(100, goal > 0 ? Math.round((val / goal) * 100) : 0);
    return (
      <div className="macro-bar-item">
        <div className="macro-bar-top">
          <span className="macro-label">{label}</span>
          <span className="macro-val">{val}g <span className="macro-goal">/ {goal}g</span></span>
        </div>
        <div className="macro-track"><div className="macro-fill" style={{ width: `${pct}%`, background: color }} /></div>
        <div className="macro-pct">{pct}%</div>
      </div>
    );
  };

  return (
    <div className="nutrition-page">
      <div className="nutrition-tabs">
        {[["log", "📋 Log"], ["library", "🍱 My Foods"], ["vs", "⚔️ VS"]].map(([key, label]) => (
          <button key={key} className={`ntab-btn ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {/* ── LOG TAB ── */}
      {tab === "log" && (
        <div className="nutrition-log">
          <div className="log-top-row">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="n-date-input" />
            <button className="goals-btn" onClick={() => setShowGoals(true)}>🎯 Goals</button>
          </div>

          {showGoals && <GoalsModal goals={goals} onSave={saveGoals} onClose={() => setShowGoals(false)} />}

          <div className="daily-summary">
            <div className="calorie-ring-wrap">
              <div className="calorie-ring">
                <svg viewBox="0 0 100 100" className="ring-svg">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                  <circle cx="50" cy="50" r="40" fill="none"
                    stroke={myTotals.calories > goals.calories ? "#ef4444" : "#6366f1"}
                    strokeWidth="10"
                    strokeDasharray={`${Math.min(100, (myTotals.calories / goals.calories) * 251.2)} 251.2`}
                    strokeLinecap="round" transform="rotate(-90 50 50)"
                    style={{ transition: "stroke-dasharray 0.8s ease" }}
                  />
                </svg>
                <div className="ring-text">
                  <div className="ring-cal">{myTotals.calories}</div>
                  <div className="ring-label">/ {goals.calories} kcal</div>
                </div>
              </div>
              <div className="remaining-label">
                {goals.calories - myTotals.calories > 0 ? `${goals.calories - myTotals.calories} kcal left` : `${myTotals.calories - goals.calories} kcal over!`}
              </div>
            </div>
            <div className="macro-bars">
              <MacroBar label="Protein" val={myTotals.protein} goal={goals.protein} color="#6366f1" />
              <MacroBar label="Carbs"   val={myTotals.carbs}   goal={goals.carbs}   color="#f97316" />
              <MacroBar label="Fat"     val={myTotals.fat}     goal={goals.fat}     color="#22c55e" />
            </div>
          </div>

          <div className="meal-selector">
            {MEALS.map((m) => {
              const mealCal = (myData[date]?.[m] || []).reduce((a, e) => a + (e.calories || 0), 0);
              return (
                <button key={m} className={`meal-tab ${activeMeal === m ? "active" : ""}`} onClick={() => setActiveMeal(m)}>
                  <span>{m}</span>
                  {mealCal > 0 && <span className="meal-cal-badge">{mealCal}</span>}
                </button>
              );
            })}
          </div>

          <div className="food-search-wrap">
            <input className="food-search-input" placeholder="🔍 Search food (e.g. roti, dal, chicken...)" value={searchQuery} onChange={(e) => handleSearch(e.target.value)} />
            {searching && <div className="search-spinner">Searching...</div>}
            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((food) => <FoodResultRow key={food.id} food={food} onAdd={addFoodToLog} />)}
              </div>
            )}
          </div>

          <div className="meal-log-section">
            <div className="meal-log-header"><h3>{activeMeal}</h3></div>
            {(myData[date]?.[activeMeal] || []).length === 0 ? (
              <div className="empty-meal">Nothing logged yet · Search above to add 👆</div>
            ) : (
              <div className="food-entries">
                {(myData[date][activeMeal] || []).map((entry) => (
                  <div key={entry.id} className="food-entry">
                    <div className="entry-info">
                      <span className="entry-name">{entry.name}</span>
                      <span className="entry-macros">P: {entry.protein}g · C: {entry.carbs}g · F: {entry.fat}g</span>
                    </div>
                    <div className="entry-right">
                      <span className="entry-cal">{entry.calories} kcal</span>
                      <button className="entry-delete" onClick={() => removeFoodFromLog(activeMeal, entry.id)}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── LIBRARY TAB ── */}
      {tab === "library" && (
        <div className="food-library">
          <h2>🍱 My Food Library</h2>
          <p className="lib-sub">Add your own Indian meals once — reuse forever</p>
          <div className="add-food-form">
            <h3>➕ Add Custom Food</h3>
            <input placeholder="Food name (e.g. Moong Dal Chilla)" value={newCustomFood.name} onChange={(e) => setNewCustomFood({ ...newCustomFood, name: e.target.value })} className="lib-input" />
            <div className="lib-grid">
              {[{ key: "calories", label: "Calories (kcal)", ph: "120" }, { key: "protein", label: "Protein (g)", ph: "7" }, { key: "carbs", label: "Carbs (g)", ph: "16" }, { key: "fat", label: "Fat (g)", ph: "3" }].map(({ key, label, ph }) => (
                <div key={key} className="lib-field">
                  <label>{label}</label>
                  <input type="number" placeholder={ph} value={newCustomFood[key]} onChange={(e) => setNewCustomFood({ ...newCustomFood, [key]: e.target.value })} className="lib-input" />
                </div>
              ))}
            </div>
            <button className="lib-add-btn" onClick={addToCustomLibrary}>Save to My Library</button>
          </div>
          {customLibrary.length > 0 && (
            <div className="lib-section">
              <h3>⭐ My Custom Foods</h3>
              {customLibrary.map((food) => <FoodLibraryRow key={food.id} food={food} onAdd={() => { addFoodToLog(food); setTab("log"); }} onDelete={() => { const u = customLibrary.filter(f => f.id !== food.id); setCustomLibrary(u); saveAll(null, null, u); }} />)}
            </div>
          )}
          <div className="lib-section">
            <h3>🇮🇳 Indian Food Presets</h3>
            {DEFAULT_INDIAN_FOODS.map((food) => <FoodLibraryRow key={food.id} food={food} onAdd={() => { addFoodToLog(food); setTab("log"); }} />)}
          </div>
        </div>
      )}

      {/* ── VS TAB ── */}
      {tab === "vs" && (
        <div className="nutrition-vs">
          <h2>⚔️ Today's Nutrition Battle</h2>
          <p className="lib-sub">{date}</p>
          {[
            { label: "Calories", myVal: myTotals.calories, theirVal: theirTotals.calories, goal: goals.calories, unit: "kcal", color: "#6366f1" },
            { label: "Protein",  myVal: myTotals.protein,  theirVal: theirTotals.protein,  goal: goals.protein,  unit: "g",    color: "#22c55e" },
            { label: "Carbs",    myVal: myTotals.carbs,    theirVal: theirTotals.carbs,    goal: goals.carbs,    unit: "g",    color: "#f97316" },
            { label: "Fat",      myVal: myTotals.fat,      theirVal: theirTotals.fat,      goal: goals.fat,      unit: "g",    color: "#fbbf24" },
          ].map((item) => (
            <div key={item.label} className="vs-macro-card">
              <div className="vs-macro-label">{item.label}</div>
              <div className="vs-bars">
                {[{ name: user, val: item.myVal, op: 1 }, { name: otherUser, val: item.theirVal, op: 0.5 }].map((p) => (
                  <div key={p.name} className="vs-bar-row">
                    <span className="vs-name">{p.name}</span>
                    <div className="vs-track"><div className="vs-fill" style={{ width: `${Math.min(100, item.goal > 0 ? (p.val / item.goal) * 100 : 0)}%`, background: item.color, opacity: p.op }} /></div>
                    <span className="vs-val">{p.val}{item.unit}</span>
                  </div>
                ))}
              </div>
              <div className="vs-goal-line">Goal: {item.goal}{item.unit}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FoodResultRow({ food, onAdd }) {
  const [grams, setGrams] = useState(100);
  return (
    <div className="food-result-row">
      <div className="result-info">
        <span className="result-name">{food.name}</span>
        <span className="result-macros">
          {food.per100g
            ? `${Math.round(food.calories * grams / 100)} kcal · P${Math.round(food.protein * grams / 100)}g · C${Math.round(food.carbs * grams / 100)}g · F${Math.round(food.fat * grams / 100)}g per ${grams}g`
            : `${food.calories} kcal · P${food.protein}g · C${food.carbs}g · F${food.fat}g`}
        </span>
      </div>
      <div className="result-actions">
        {food.per100g && <input type="number" value={grams} onChange={(e) => setGrams(parseInt(e.target.value) || 100)} className="grams-input" placeholder="g" />}
        <button className="add-food-btn" onClick={() => onAdd(food, grams)}>+ Add</button>
      </div>
    </div>
  );
}

function FoodLibraryRow({ food, onAdd, onDelete }) {
  return (
    <div className="lib-food-row">
      <div className="lib-food-info">
        <span className="lib-food-name">{food.name}</span>
        <span className="lib-food-macros">{food.calories} kcal · P{food.protein}g · C{food.carbs}g · F{food.fat}g</span>
      </div>
      <div className="lib-food-actions">
        <button className="lib-use-btn" onClick={onAdd}>+ Log</button>
        {onDelete && <button className="lib-del-btn" onClick={onDelete}>🗑</button>}
      </div>
    </div>
  );
}

function GoalsModal({ goals, onSave, onClose }) {
  const [g, setG] = useState({ ...goals });
  return (
    <div className="goals-overlay" onClick={onClose}>
      <div className="goals-modal" onClick={(e) => e.stopPropagation()}>
        <h3>🎯 Daily Nutrition Goals</h3>
        {[{ key: "calories", label: "Calories (kcal)" }, { key: "protein", label: "Protein (g)" }, { key: "carbs", label: "Carbs (g)" }, { key: "fat", label: "Fat (g)" }].map(({ key, label }) => (
          <div key={key} className="goal-field">
            <label>{label}</label>
            <input type="number" value={g[key]} onChange={(e) => setG({ ...g, [key]: parseInt(e.target.value) || 0 })} className="goal-input" />
          </div>
        ))}
        <div className="goal-actions">
          <button className="goal-save-btn" onClick={() => onSave(g)}>Save Goals</button>
          <button className="goal-cancel-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}