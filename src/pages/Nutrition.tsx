import { useState } from "react";
import { ArrowLeft, Filter, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import healthyMeal from "@/assets/healthy-meal.jpg";

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

  const filteredMeals = meals.filter((meal) => {
    const matchesFilter = activeFilter === "All" || meal.category === activeFilter;
    const matchesSearch = meal.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-coral px-6 pt-12 pb-20 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/dashboard"
            className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center text-primary-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-primary-foreground">Nutrition</h1>
            <p className="text-primary-foreground/80 text-sm">Personalized meal recommendations</p>
          </div>
        </div>

        {/* Daily Summary Card */}
        <div className="bg-primary-foreground/10 backdrop-blur-xl rounded-2xl p-5">
          <h3 className="text-primary-foreground/80 text-sm mb-3">Today's Recommended Intake</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-xl font-bold text-primary-foreground">2,000</p>
              <p className="text-xs text-primary-foreground/70">Calories</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-primary-foreground">150g</p>
              <p className="text-xs text-primary-foreground/70">Protein</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-primary-foreground">200g</p>
              <p className="text-xs text-primary-foreground/70">Carbs</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-primary-foreground">65g</p>
              <p className="text-xs text-primary-foreground/70">Fat</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-8 relative z-10">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search meals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 bg-background shadow-md"
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
                  ? "gradient-coral text-primary-foreground shadow-coral"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
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
              className="card-elevated overflow-hidden animate-fade-in"
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
                    <span className="text-xs px-2 py-1 rounded-full bg-coral-light text-primary">
                      {meal.calories} kcal
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {meal.description}
                  </p>
                  <div className="flex gap-3 text-xs">
                    <span className="text-nature">P: {meal.protein}g</span>
                    <span className="text-energy">C: {meal.carbs}g</span>
                    <span className="text-calm">F: {meal.fat}g</span>
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