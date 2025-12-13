import { useState } from "react";
import { ArrowLeft, Filter, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import healthyMeal from "@/assets/healthy-meal.jpg";
import { useTheme } from "@/contexts/ThemeContext";

const mealFilters = ["All", "Breakfast", "Lunch", "Dinner", "Snacks"];

const meals = [
  {
    id: 1,
    name: "Grilled Chicken Bowl",
    category: "Lunch",
    calories: 450,
    protein: 35,
    carbs: 40,
    fat: 15,
    image: healthyMeal,
    description: "High protein, low fat - perfect for muscle recovery after workouts.",
  },
  {
    id: 2,
    name: "Oatmeal & Berries",
    category: "Breakfast",
    calories: 320,
    protein: 12,
    carbs: 55,
    fat: 8,
    image: "https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=400",
    description: "Complex carbs for sustained energy throughout your morning.",
  },
  {
    id: 3,
    name: "Salmon & Veggies",
    category: "Dinner",
    calories: 520,
    protein: 42,
    carbs: 25,
    fat: 28,
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400",
    description: "Rich in omega-3s for heart health and reduced inflammation.",
  },
  {
    id: 4,
    name: "Greek Yogurt Parfait",
    category: "Snacks",
    calories: 220,
    protein: 18,
    carbs: 28,
    fat: 6,
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400",
    description: "Probiotics for gut health with a sweet, satisfying taste.",
  },
  {
    id: 5,
    name: "Quinoa Salad",
    category: "Lunch",
    calories: 380,
    protein: 14,
    carbs: 52,
    fat: 12,
    image: "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=400",
    description: "Complete protein source with all essential amino acids.",
  },
  {
    id: 6,
    name: "Protein Smoothie",
    category: "Snacks",
    calories: 280,
    protein: 25,
    carbs: 30,
    fat: 5,
    image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400",
    description: "Quick post-workout fuel to maximize your gains.",
  },
];

export default function Nutrition() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const filteredMeals = meals.filter((meal) => {
    const matchesFilter = activeFilter === "All" || meal.category === activeFilter;
    const matchesSearch = meal.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className={cn(
      "min-h-screen pb-24",
      isDark ? "bg-black text-white" : "bg-gray-50 text-gray-900"
    )}>
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80"
            alt="Nutrition"
            className="w-full h-full object-cover"
          />
          <div className={cn(
            "absolute inset-0",
            isDark 
              ? "bg-gradient-to-b from-black/60 via-black/80 to-black" 
              : "bg-gradient-to-b from-primary/80 via-primary/90 to-gray-50"
          )} />
        </div>
        <div className="relative px-6 pt-12 pb-24">
          <div className="flex items-center gap-4 mb-6">
            <Link
              to="/dashboard"
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                isDark 
                  ? "bg-white/10 hover:bg-white/20 text-white" 
                  : "bg-white/20 hover:bg-white/30 text-white"
              )}
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Nutrition</h1>
              <p className="text-white/80 text-sm">Personalized meal recommendations</p>
            </div>
          </div>

          {/* Daily Summary Card */}
          <div className={cn(
            "rounded-2xl p-5 backdrop-blur",
            isDark ? "bg-white/10" : "bg-white/20"
          )}>
            <h3 className="text-white/80 text-sm mb-3">Today's Recommended Intake</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-xl font-bold text-white">2,000</p>
                <p className="text-xs text-white/70">Calories</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-white">150g</p>
                <p className="text-xs text-white/70">Protein</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-white">200g</p>
                <p className="text-xs text-white/70">Carbs</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-white">65g</p>
                <p className="text-xs text-white/70">Fat</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-8 relative z-10">
        {/* Search */}
        <div className="relative mb-4">
          <Search className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5",
            isDark ? "text-gray-400" : "text-gray-500"
          )} />
          <Input
            placeholder="Search meals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "pl-12",
              isDark 
                ? "bg-white/5 border-white/10 text-white placeholder:text-gray-500" 
                : "bg-white border-gray-200 shadow-md"
            )}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide">
          {mealFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
                activeFilter === filter
                  ? "bg-gradient-to-r from-primary to-orange-500 text-white shadow-lg shadow-primary/30"
                  : isDark 
                    ? "bg-white/10 text-gray-300 hover:bg-white/20"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Meals Grid */}
        <div className="space-y-4">
          {filteredMeals.map((meal, index) => (
            <div
              key={meal.id}
              className={cn(
                "overflow-hidden rounded-2xl border animate-fade-in",
                isDark 
                  ? "bg-white/5 border-white/10" 
                  : "bg-white border-gray-200 shadow-sm"
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex">
                <img
                  src={meal.image}
                  alt={meal.name}
                  className="w-28 h-28 object-cover"
                />
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold">{meal.name}</h3>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full",
                      isDark 
                        ? "bg-primary/20 text-primary" 
                        : "bg-coral-light text-primary"
                    )}>
                      {meal.calories} kcal
                    </span>
                  </div>
                  <p className={cn(
                    "text-xs mb-3 line-clamp-2",
                    isDark ? "text-gray-400" : "text-gray-500"
                  )}>
                    {meal.description}
                  </p>
                  <div className="flex gap-3 text-xs">
                    <span className="text-green-500">P: {meal.protein}g</span>
                    <span className="text-yellow-500">C: {meal.carbs}g</span>
                    <span className="text-blue-500">F: {meal.fat}g</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}