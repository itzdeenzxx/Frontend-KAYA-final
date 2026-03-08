import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft, Camera, Upload, X, Loader2, Flame, Apple, Beef,
  ChevronDown, ChevronUp, Clock, ScanLine, History, ImageIcon,
  Search, TrendingUp, Sparkles, ChevronRight, Zap, Heart, Star, Bot,
  Trash2, Bookmark, BookmarkCheck, Lightbulb, Droplets, Target,
  ChefHat, UtensilsCrossed, BookOpen, Save, MessageSquare, RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  saveNutritionScan,
  getUserNutritionScans,
  deleteNutritionScan,
  saveFoodItem,
  getPopularFoods,
  getRecentFoods,
  getHealthyFoodCategories,
  saveHealthyFoodCategory,
  saveRecipe,
  getUserSavedRecipes,
  deleteRecipe,
  saveUserFood,
  getUserSavedFoods,
  deleteUserSavedFood,
  getHealthData,
  getUserWorkoutStats,
  type FirestoreNutritionScan,
  type FirestoreFoodItem,
  type FirestoreHealthyFood,
  type FirestoreSavedRecipe,
  type FirestoreSavedFood,
} from "@/lib/firestore";

const NUTRITION_API_URL = "https://nutrition-api-kaya-production.up.railway.app";

interface NutritionPredictions {
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
  total_mass: number;
}

interface IngredientAnalysis {
  food_name: string;
  food_name_en: string;
  description: string;
  ingredients: Array<{
    name: string;
    estimated_grams: number;
    calories: number;
    protein: number;
    fat: number;
    carbohydrates: number;
  }>;
  health_tips: string;
}

type ScanStep = "idle" | "predicting" | "analyzing" | "done" | "error";

interface SearchFoodResult {
  fdcId: number;
  name: string;
  category: string;
  brandName: string;
  servingSize: number;
  servingSizeUnit: string;
  imageUrl: string;
  imageCredit: string;
  nutrients: {
    calories: number; protein: number; fat: number; carbohydrates: number;
    fiber: number; sugar: number; sodium: number; cholesterol: number;
    calcium: number; iron: number; potassium: number; vitaminC: number; vitaminA: number;
  };
}

interface AIMenuRecommendation {
  name: string;
  nameEn: string;
  description: string;
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
  healthBenefits: string;
  ingredients: string[];
  difficulty: string;
  prepTime: number;
}

interface Recipe {
  title: string;
  titleEn: string;
  servings: number;
  prepTime: number;
  cookTime: number;
  difficulty: string;
  ingredients: Array<{ name: string; amount: string }>;
  steps: string[];
  tips: string[];
  nutritionPerServing: { calories: number; protein: number; fat: number; carbohydrates: number };
}

type ActiveTab = "feed" | "scan" | "saved";

export default function Nutrition() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { lineProfile, healthData } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [isDesktop, setIsDesktop] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("feed");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchFoodResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<SearchFoodResult | null>(null);
  const [popularFoods, setPopularFoods] = useState<FirestoreFoodItem[]>([]);
  const [recentFoods, setRecentFoods] = useState<FirestoreFoodItem[]>([]);
  const [recommendLoading, setRecommendLoading] = useState(true);
  const [aiSearchStep, setAiSearchStep] = useState<"" | "ai" | "searching">("");

  // AI menu recommendations (when USDA returns nothing)
  const [aiMenus, setAiMenus] = useState<AIMenuRecommendation[]>([]);
  const [aiMenusLoading, setAiMenusLoading] = useState(false);

  // Healthy categories (feed)
  const [healthyCategories, setHealthyCategories] = useState<FirestoreHealthyFood[]>([]);
  const [healthyCategoriesLoading, setHealthyCategoriesLoading] = useState(true);

  // Personalized AI recommendations
  const [personalizedFoods, setPersonalizedFoods] = useState<SearchFoodResult[]>([]);
  const [personalizedReason, setPersonalizedReason] = useState("");
  const [personalizedLoading, setPersonalizedLoading] = useState(false);

  // Recipe state
  const [recipeOverlay, setRecipeOverlay] = useState(false);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [recipeSaved, setRecipeSaved] = useState(false);
  const [recipeFoodName, setRecipeFoodName] = useState("");
  const [recipeFoodImage, setRecipeFoodImage] = useState("");

  // Saved state
  const [savedFoods, setSavedFoods] = useState<FirestoreSavedFood[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<FirestoreSavedRecipe[]>([]);
  const [savedFoodsLoading, setSavedFoodsLoading] = useState(false);
  const [savedFoodIds, setSavedFoodIds] = useState<Set<number>>(new Set());

  // Scan state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanStep, setScanStep] = useState<ScanStep>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [predictions, setPredictions] = useState<NutritionPredictions | null>(null);
  const [analysis, setAnalysis] = useState<IngredientAnalysis | null>(null);
  const [expandedIngredient, setExpandedIngredient] = useState<number | null>(null);
  const [scanSaved, setScanSaved] = useState(false);
  const [savingScan, setSavingScan] = useState(false);

  // History state
  const [scanHistory, setScanHistory] = useState<FirestoreNutritionScan[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<FirestoreNutritionScan | null>(null);
  const [deletingHistoryId, setDeletingHistoryId] = useState<string | null>(null);
  const [savedSubTab, setSavedSubTab] = useState<"foods" | "scans" | "recipes">("foods");

  // Animated placeholder
  const placeholderSuggestions = [
    "อาหารที่ช่วยลดน้ำหนัก", "high protein meals", "อาหารสำหรับคนออกกำลังกาย",
    "pizza calories", "อาหารโปรตีนสูงไขมันต่ำ", "healthy breakfast ideas",
    "ข้าวผัดกุ้ง", "low carb Thai food", "ผลไม้ที่มีวิตามินซีสูง",
  ];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholderText, setPlaceholderText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    const currentSuggestion = placeholderSuggestions[placeholderIndex];
    let charIndex = 0;
    let timeout: ReturnType<typeof setTimeout>;
    if (isTyping) {
      timeout = setTimeout(function type() {
        if (charIndex <= currentSuggestion.length) {
          setPlaceholderText(currentSuggestion.slice(0, charIndex));
          charIndex++;
          timeout = setTimeout(type, 50 + Math.random() * 30);
        } else {
          timeout = setTimeout(() => setIsTyping(false), 2000);
        }
      }, 100);
    } else {
      let delIndex = currentSuggestion.length;
      timeout = setTimeout(function erase() {
        if (delIndex >= 0) {
          setPlaceholderText(currentSuggestion.slice(0, delIndex));
          delIndex--;
          timeout = setTimeout(erase, 25);
        } else {
          setPlaceholderIndex((prev) => (prev + 1) % placeholderSuggestions.length);
          setIsTyping(true);
        }
      }, 30);
    }
    return () => clearTimeout(timeout);
  }, [placeholderIndex, isTyping]);

  useEffect(() => {
    const checkScreenSize = () => setIsDesktop(window.innerWidth >= 1024);
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Cache constants — 3 days for all feed data
  const FEED_CACHE_KEY = "kaya_feed_cache";
  const PERSONALIZED_CACHE_KEY = "kaya_personalized_cache";
  const CACHE_TTL = 3 * 24 * 60 * 60 * 1000; // 3 days

  // Load feed data on mount with 3-day cache
  useEffect(() => {
    const loadFeedData = async () => {
      // Check cache first
      try {
        const cached = localStorage.getItem(FEED_CACHE_KEY);
        if (cached) {
          const { popular, recent, categories, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL && popular?.length > 0) {
            setPopularFoods(popular);
            setRecentFoods(recent || []);
            setHealthyCategories(categories || []);
            setRecommendLoading(false);
            setHealthyCategoriesLoading(false);
            return;
          }
        }
      } catch { /* ignore invalid cache */ }

      setRecommendLoading(true);
      setHealthyCategoriesLoading(true);
      try {
        const [popular, recent, categories] = await Promise.all([
          getPopularFoods(8),
          getRecentFoods(8),
          getHealthyFoodCategories(),
        ]);
        setPopularFoods(popular);
        setRecentFoods(recent);
        setHealthyCategories(categories);

        // Save to cache
        try {
          localStorage.setItem(FEED_CACHE_KEY, JSON.stringify({
            popular, recent, categories, timestamp: Date.now(),
          }));
        } catch { /* storage full, ignore */ }
      } catch (err) {
        console.error("Failed to load feed data:", err);
      } finally {
        setRecommendLoading(false);
        setHealthyCategoriesLoading(false);
      }
    };
    loadFeedData();
  }, []);

  const loadPersonalized = useCallback(async (skipCache = false) => {
    if (!lineProfile?.userId) return;

    // Check cache first
    if (!skipCache) {
      try {
        const cached = localStorage.getItem(`${PERSONALIZED_CACHE_KEY}_${lineProfile.userId}`);
        if (cached) {
          const { foods, reason, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL && foods?.length > 0) {
            setPersonalizedFoods(foods);
            setPersonalizedReason(reason || "");
            return;
          }
        }
      } catch { /* ignore invalid cache */ }
    }

    setPersonalizedLoading(true);
    try {
      const [hd, ws] = await Promise.all([
        healthData ? Promise.resolve(healthData) : getHealthData(lineProfile.userId),
        getUserWorkoutStats(lineProfile.userId).catch(() => null),
      ]);

      const res = await fetch("/api/gemma/personalized-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          healthData: hd ? {
            weight: hd.weight, height: hd.height, age: hd.age,
            gender: hd.gender, bmi: hd.bmi, activityLevel: hd.activityLevel,
            healthGoals: hd.healthGoals,
          } : undefined,
          workoutStats: ws ? {
            totalWorkouts: ws.totalWorkouts,
            totalCaloriesBurned: ws.totalCalories,
          } : undefined,
        }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setPersonalizedReason(data.reason || "");

      // Search USDA for top 4 tags
      const tags = (data.tags || []).slice(0, 4);
      const searchPromises = tags.map(async (tag: string) => {
        try {
          const r = await fetch(`/api/nutrition/search?q=${encodeURIComponent(tag)}`);
          if (!r.ok) return [];
          const d = await r.json();
          return (d.foods || []).slice(0, 1) as SearchFoodResult[];
        } catch { return []; }
      });
      const results = await Promise.all(searchPromises);
      const foods = results.flat().filter((f, i, arr) => arr.findIndex(x => x.fdcId === f.fdcId) === i);
      setPersonalizedFoods(foods);

      // Save to cache
      try {
        localStorage.setItem(`${PERSONALIZED_CACHE_KEY}_${lineProfile.userId}`, JSON.stringify({
          foods, reason: data.reason || "", timestamp: Date.now(),
        }));
      } catch { /* storage full, ignore */ }
    } catch (err) {
      console.error("Failed to load personalized:", err);
    } finally {
      setPersonalizedLoading(false);
    }
  }, [lineProfile?.userId, healthData]);

  useEffect(() => {
    loadPersonalized();
  }, [loadPersonalized]);

  // Seed healthy foods if empty
  useEffect(() => {
    if (healthyCategories.length > 0) return;
    const seed = async () => {
      try {
        const res = await fetch("/api/nutrition/seed-healthy", { method: "POST" });
        if (!res.ok) return;
        const data = await res.json();
        if (data.categories) {
          for (const cat of data.categories) {
            await saveHealthyFoodCategory({ category: cat.category, categoryEn: cat.categoryEn, foods: cat.foods });
          }
          const cats = await getHealthyFoodCategories();
          setHealthyCategories(cats);
          // Update feed cache with new categories
          try {
            const cached = localStorage.getItem(FEED_CACHE_KEY);
            if (cached) {
              const prev = JSON.parse(cached);
              localStorage.setItem(FEED_CACHE_KEY, JSON.stringify({ ...prev, categories: cats }));
            }
          } catch { /* ignore */ }
        }
      } catch (err) {
        console.error("Seed error:", err);
      }
    };
    if (!healthyCategoriesLoading) seed();
  }, [healthyCategories.length, healthyCategoriesLoading]);

  // Load history / saved
  const loadHistory = useCallback(async () => {
    if (!lineProfile?.userId) return;
    setHistoryLoading(true);
    try {
      const scans = await getUserNutritionScans(lineProfile.userId);
      setScanHistory(scans);
    } catch (err) {
      console.error("Failed to load scan history:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, [lineProfile?.userId]);

  const loadSaved = useCallback(async () => {
    if (!lineProfile?.userId) return;
    setSavedFoodsLoading(true);
    try {
      const [foods, recipes, scans] = await Promise.all([
        getUserSavedFoods(lineProfile.userId),
        getUserSavedRecipes(lineProfile.userId),
        getUserNutritionScans(lineProfile.userId),
      ]);
      setSavedFoods(foods);
      setSavedRecipes(recipes);
      setScanHistory(scans);
      setSavedFoodIds(new Set(foods.filter(f => f.fdcId).map(f => f.fdcId!)));
    } catch (err) {
      console.error("Failed to load saved:", err);
    } finally {
      setSavedFoodsLoading(false);
    }
  }, [lineProfile?.userId]);

  useEffect(() => {
    if (activeTab === "saved") loadSaved();
  }, [activeTab, loadSaved]);

  // === Search ===
  const handleSearch = async (e?: React.FormEvent, directQuery?: string) => {
    e?.preventDefault();
    const q = (directQuery || searchQuery).trim();
    if (!q) return;
    if (directQuery) setSearchQuery(directQuery);
    setSearchLoading(true);
    setSelectedFood(null);
    setSearchResults([]);
    setAiMenus([]);
    setAiSearchStep("ai");

    try {
      const aiRes = await fetch("/api/gemma/food-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      let tags: string[] = [q];
      if (aiRes.ok) {
        const aiData = await aiRes.json();
        if (aiData.foodTags?.length) tags = aiData.foodTags;
      }
      console.log("[AI Search] query:", q, "→ tags:", tags);
      setAiSearchStep("searching");

      const allResults: SearchFoodResult[] = [];
      const seenIds = new Set<number>();
      const searchPromises = tags.map(async (tag) => {
        try {
          const res = await fetch(`/api/nutrition/search?q=${encodeURIComponent(tag)}`);
          if (!res.ok) return [];
          const data = await res.json();
          return (data.foods || []) as SearchFoodResult[];
        } catch { return [] as SearchFoodResult[]; }
      });
      const results = await Promise.all(searchPromises);
      for (const foods of results) {
        for (const food of foods) {
          if (!seenIds.has(food.fdcId)) {
            seenIds.add(food.fdcId);
            allResults.push(food);
          }
        }
      }
      setSearchResults(allResults);

      // If no USDA results, get AI menu recommendations
      if (allResults.length === 0) {
        setAiMenusLoading(true);
        try {
          const menuRes = await fetch("/api/gemma/menu-recommend", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: q }),
          });
          if (menuRes.ok) {
            const menuData = await menuRes.json();
            setAiMenus(menuData.menus || []);
          }
        } catch { /* ignore */ }
        finally { setAiMenusLoading(false); }
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setSearchLoading(false);
      setAiSearchStep("");
    }
  };

  const handleSelectFood = (food: SearchFoodResult) => setSelectedFood(food);

  const handleSelectFirestoreFood = (food: FirestoreFoodItem) => {
    setSelectedFood({
      fdcId: food.fdcId, name: food.name, category: food.category, brandName: "",
      servingSize: food.servingSize, servingSizeUnit: food.servingSizeUnit,
      imageUrl: food.imageUrl, imageCredit: food.imageCredit, nutrients: food.nutrients,
    });
  };

  // === Save / Delete ===
  const handleSaveScan = async () => {
    if (!selectedImage || !lineProfile?.userId || !predictions || !analysis) return;
    setSavingScan(true);
    try {
      const ext = selectedImage.name.split(".").pop() || "jpg";
      const storagePath = `nutrition-scans/${lineProfile.userId}/${Date.now()}.${ext}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, selectedImage);
      const imageUrl = await getDownloadURL(storageRef);
      await saveNutritionScan({ userId: lineProfile.userId, imageUrl, predictions, analysis });
      setScanSaved(true);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSavingScan(false);
    }
  };

  const handleSaveFood = async (food: SearchFoodResult) => {
    if (!lineProfile?.userId) return;
    try {
      await saveFoodItem({
        fdcId: food.fdcId, name: food.name, category: food.category,
        imageUrl: food.imageUrl, imageCredit: food.imageCredit,
        servingSize: food.servingSize, servingSizeUnit: food.servingSizeUnit,
        nutrients: food.nutrients,
      });
      await saveUserFood({
        userId: lineProfile.userId, fdcId: food.fdcId, name: food.name,
        nameEn: food.name, category: food.category, imageUrl: food.imageUrl,
        imageCredit: food.imageCredit, servingSize: food.servingSize,
        servingSizeUnit: food.servingSizeUnit, nutrients: food.nutrients, source: "search",
      });
      setSavedFoodIds(prev => new Set(prev).add(food.fdcId));
    } catch (err) {
      console.error("Failed to save food:", err);
    }
  };

  const handleDeleteScan = async (e: React.MouseEvent, scanId: string) => {
    e.stopPropagation();
    setDeletingHistoryId(scanId);
    try {
      await deleteNutritionScan(scanId);
      setScanHistory(prev => prev.filter(s => s.id !== scanId));
    } catch (err) {
      console.error("Failed to delete scan:", err);
    } finally {
      setDeletingHistoryId(null);
    }
  };

  const handleDeleteSavedFood = async (foodId: string) => {
    try {
      await deleteUserSavedFood(foodId);
      setSavedFoods(prev => prev.filter(f => f.id !== foodId));
    } catch (err) {
      console.error("Failed to delete saved food:", err);
    }
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    try {
      await deleteRecipe(recipeId);
      setSavedRecipes(prev => prev.filter(r => r.id !== recipeId));
    } catch (err) {
      console.error("Failed to delete recipe:", err);
    }
  };

  // === Recipe ===
  const handleAskRecipe = async (foodName: string, foodNameEn?: string, nutrients?: { calories?: number; protein?: number; fat?: number; carbohydrates?: number }, imageUrl?: string) => {
    setRecipeOverlay(true);
    setRecipeLoading(true);
    setCurrentRecipe(null);
    setRecipeSaved(false);
    setRecipeFoodName(foodName);
    setRecipeFoodImage(imageUrl || "");
    try {
      const res = await fetch("/api/gemma/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodName, foodNameEn, nutrients }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setCurrentRecipe(data.recipe);
    } catch (err) {
      console.error("Recipe error:", err);
    } finally {
      setRecipeLoading(false);
    }
  };

  const handleSaveRecipe = async () => {
    if (!lineProfile?.userId || !currentRecipe) return;
    try {
      await saveRecipe({
        userId: lineProfile.userId,
        foodName: recipeFoodName,
        imageUrl: recipeFoodImage,
        recipe: currentRecipe,
      });
      setRecipeSaved(true);
    } catch (err) {
      console.error("Failed to save recipe:", err);
    }
  };

  // === Scan ===
  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith("image/")) { setErrorMessage("กรุณาเลือกไฟล์รูปภาพ"); return; }
    if (file.size > 10 * 1024 * 1024) { setErrorMessage("ไฟล์ต้องมีขนาดไม่เกิน 10 MB"); return; }
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setPredictions(null);
    setAnalysis(null);
    setScanStep("idle");
    setErrorMessage("");
    setSelectedHistoryItem(null);
    setScanSaved(false);
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleScan = async () => {
    if (!selectedImage || !lineProfile?.userId) return;
    setErrorMessage(""); setPredictions(null); setAnalysis(null);

    setScanStep("predicting");
    let nutritionResult: NutritionPredictions;
    try {
      const formData = new FormData();
      formData.append("file", selectedImage);
      const predRes = await fetch(`${NUTRITION_API_URL}/predict`, { method: "POST", body: formData });
      if (!predRes.ok) throw new Error((await predRes.json()).detail || "Prediction failed");
      nutritionResult = (await predRes.json()).predictions;
      setPredictions(nutritionResult);
    } catch (err) {
      setScanStep("error");
      setErrorMessage(err instanceof Error ? err.message : "ไม่สามารถวิเคราะห์ได้");
      return;
    }

    setScanStep("analyzing");
    try {
      const imageBase64 = await fileToBase64(selectedImage);
      const analyzeRes = await fetch("/api/gemma/nutrition-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, predictions: nutritionResult }),
      });
      if (!analyzeRes.ok) throw new Error("Analysis failed");
      const analyzeData = await analyzeRes.json();
      setAnalysis(analyzeData.analysis);
    } catch (err) {
      setScanStep("error");
      setErrorMessage(err instanceof Error ? err.message : "ไม่สามารถวิเคราะห์วัตถุดิบได้");
      return;
    }

    setScanStep("done");
    setScanSaved(false);
  };

  const resetScan = () => {
    setSelectedImage(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null); setPredictions(null); setAnalysis(null);
    setScanStep("idle"); setErrorMessage(""); setSelectedHistoryItem(null); setScanSaved(false);
  };

  const stepLabels: Record<ScanStep, string> = {
    idle: "", predicting: "กำลังวิเคราะห์คุณค่าโภชนาการ...",
    analyzing: "กำลังระบุวัตถุดิบด้วย AI...", done: "วิเคราะห์เสร็จสิ้น!", error: "เกิดข้อผิดพลาด",
  };

  const viewHistoryItem = (item: FirestoreNutritionScan) => {
    setSelectedHistoryItem(item);
    setImagePreview(item.imageUrl);
    setPredictions(item.predictions);
    setAnalysis(item.analysis);
    setScanStep("done");
    setActiveTab("scan");
    setSelectedImage(null);
  };

  const formatDate = (timestamp: unknown) => {
    if (!timestamp) return "";
    const t = timestamp as { toDate?: () => Date; seconds?: number };
    const date = t.toDate ? t.toDate() : new Date(t.seconds ? t.seconds * 1000 : 0);
    return date.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  // ===== Reusable Components =====
  const MacroPill = ({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) => (
    <div className={cn("rounded-xl px-3 py-2 text-center", color)}>
      <p className="text-sm font-bold">{value.toFixed(1)}</p>
      <p className="text-[10px] opacity-70">{label} ({unit})</p>
    </div>
  );

  const MacroBar = ({ label, value, unit, color, max }: { label: string; value: number; unit: string; color: string; max: number }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className={isDark ? "text-gray-400" : "text-gray-500"}>{label}</span>
        <span className="font-semibold">{value.toFixed(1)} {unit}</span>
      </div>
      <div className={cn("h-2 rounded-full overflow-hidden", isDark ? "bg-white/10" : "bg-gray-200")}>
        <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${Math.min((value / max) * 100, 100)}%` }} />
      </div>
    </div>
  );

  // ===== Food Detail Overlay =====
  const renderFoodDetailOverlay = () => {
    if (!selectedFood) return null;
    const n = selectedFood.nutrients;
    return (
      <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedFood(null)} />
        <div className={cn("relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl lg:rounded-3xl", isDark ? "bg-[#141420]" : "bg-white")}>
          {selectedFood.imageUrl && (
            <div className="relative h-56 overflow-hidden rounded-t-3xl">
              <img src={selectedFood.imageUrl} alt={selectedFood.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <button onClick={() => setSelectedFood(null)} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white hover:bg-black/60">
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-5 right-5">
                <h2 className="text-white font-bold text-xl leading-tight">{selectedFood.name}</h2>
                {selectedFood.category && <p className="text-white/60 text-sm mt-1">{selectedFood.category}</p>}
              </div>
            </div>
          )}
          <div className="p-5 space-y-5">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/20">
                <Flame className="w-6 h-6 text-orange-500" />
                <span className="text-3xl font-black text-orange-500">{n.calories.toFixed(1)}</span>
                <span className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>kcal</span>
              </div>
              <p className={cn("text-xs mt-2", isDark ? "text-gray-500" : "text-gray-400")}>ต่อ {selectedFood.servingSize}{selectedFood.servingSizeUnit}</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <MacroPill label="โปรตีน" value={n.protein} unit="g" color={isDark ? "bg-green-500/15 text-green-400" : "bg-green-50 text-green-700"} />
              <MacroPill label="ไขมัน" value={n.fat} unit="g" color={isDark ? "bg-blue-500/15 text-blue-400" : "bg-blue-50 text-blue-700"} />
              <MacroPill label="คาร์โบฯ" value={n.carbohydrates} unit="g" color={isDark ? "bg-yellow-500/15 text-yellow-400" : "bg-yellow-50 text-yellow-700"} />
            </div>
            <div className={cn("rounded-2xl p-4 space-y-3", isDark ? "bg-white/5" : "bg-gray-50")}>
              <h4 className="font-semibold text-sm flex items-center gap-2"><Heart className="w-4 h-4 text-pink-500" />สารอาหารเพิ่มเติม</h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {[{ label: "ไฟเบอร์", value: n.fiber, unit: "g" }, { label: "น้ำตาล", value: n.sugar, unit: "g" }, { label: "โซเดียม", value: n.sodium, unit: "mg" }, { label: "โคเลสเตอรอล", value: n.cholesterol, unit: "mg" }, { label: "แคลเซียม", value: n.calcium, unit: "mg" }, { label: "เหล็ก", value: n.iron, unit: "mg" }, { label: "โพแทสเซียม", value: n.potassium, unit: "mg" }, { label: "วิตามิน C", value: n.vitaminC, unit: "mg" }, { label: "วิตามิน A", value: n.vitaminA, unit: "µg" }].map((item) => (
                  <div key={item.label} className="flex justify-between py-1.5 border-b border-dashed last:border-0" style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                    <span className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>{item.label}</span>
                    <span className="text-xs font-semibold">{item.value.toFixed(1)} {item.unit}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => handleSaveFood(selectedFood)}
                disabled={savedFoodIds.has(selectedFood.fdcId)}
                className={cn("flex-1 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2",
                  savedFoodIds.has(selectedFood.fdcId)
                    ? "bg-green-500/20 text-green-500 border border-green-500/30"
                    : "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg"
                )}
              >
                {savedFoodIds.has(selectedFood.fdcId) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                {savedFoodIds.has(selectedFood.fdcId) ? "บันทึกแล้ว" : "บันทึก"}
              </button>
              <button
                onClick={() => {
                  setSelectedFood(null);
                  handleAskRecipe(selectedFood.name, selectedFood.name, { calories: n.calories, protein: n.protein, fat: n.fat, carbohydrates: n.carbohydrates }, selectedFood.imageUrl);
                }}
                className={cn("flex-1 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2",
                  "bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:shadow-lg"
                )}
              >
                <ChefHat className="w-4 h-4" />
                ถามสูตร AI
              </button>
            </div>
            {selectedFood.imageCredit && <p className={cn("text-[10px] text-center", isDark ? "text-gray-600" : "text-gray-300")}>Photo by {selectedFood.imageCredit} on Unsplash</p>}
          </div>
        </div>
      </div>
    );
  };

  // ===== Recipe Overlay =====
  const renderRecipeOverlay = () => {
    if (!recipeOverlay) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRecipeOverlay(false)} />
        <div className={cn("relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl lg:rounded-3xl", isDark ? "bg-[#141420]" : "bg-white")}>
          {/* Header image */}
          {recipeFoodImage && (
            <div className="relative h-40 overflow-hidden rounded-t-3xl">
              <img src={recipeFoodImage} alt={recipeFoodName} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <button onClick={() => setRecipeOverlay(false)} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white hover:bg-black/60">
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-5 right-5">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-purple-300" />
                  <span className="text-white/70 text-sm">สูตรจากน้องกาย AI</span>
                </div>
              </div>
            </div>
          )}
          {!recipeFoodImage && (
            <div className="flex items-center justify-between p-5 pb-0">
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-purple-500" />
                <span className="font-bold">สูตรจากน้องกาย AI</span>
              </div>
              <button onClick={() => setRecipeOverlay(false)} className={cn("w-8 h-8 rounded-full flex items-center justify-center", isDark ? "bg-white/10" : "bg-gray-100")}><X className="w-4 h-4" /></button>
            </div>
          )}

          <div className="p-5 space-y-5">
            {recipeLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-4" />
                <p className="text-sm font-medium">น้องกาย AI กำลังเขียนสูตร...</p>
                <p className={cn("text-xs mt-1", isDark ? "text-gray-500" : "text-gray-400")}>"{recipeFoodName}"</p>
              </div>
            ) : currentRecipe ? (
              <>
                <div>
                  <h2 className="text-xl font-black">{currentRecipe.title}</h2>
                  <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>{currentRecipe.titleEn}</p>
                </div>
                {/* Quick info */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "เสิร์ฟ", value: `${currentRecipe.servings} ที่`, icon: <UtensilsCrossed className="w-3.5 h-3.5" /> },
                    { label: "เตรียม", value: `${currentRecipe.prepTime} นาที`, icon: <Clock className="w-3.5 h-3.5" /> },
                    { label: "ทำ", value: `${currentRecipe.cookTime} นาที`, icon: <Flame className="w-3.5 h-3.5" /> },
                    { label: "ระดับ", value: currentRecipe.difficulty, icon: <Star className="w-3.5 h-3.5" /> },
                  ].map(item => (
                    <div key={item.label} className={cn("rounded-xl p-2.5 text-center", isDark ? "bg-white/5" : "bg-gray-50")}>
                      <div className="flex items-center justify-center text-purple-500 mb-1">{item.icon}</div>
                      <p className="text-xs font-bold">{item.value}</p>
                      <p className="text-[10px] opacity-50">{item.label}</p>
                    </div>
                  ))}
                </div>
                {/* Nutrition */}
                {currentRecipe.nutritionPerServing && (
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center p-2 rounded-lg bg-orange-500/10"><p className="text-xs font-bold text-orange-500">{currentRecipe.nutritionPerServing.calories}</p><p className="text-[10px] opacity-50">kcal</p></div>
                    <div className="text-center p-2 rounded-lg bg-green-500/10"><p className="text-xs font-bold text-green-500">{currentRecipe.nutritionPerServing.protein}g</p><p className="text-[10px] opacity-50">โปรตีน</p></div>
                    <div className="text-center p-2 rounded-lg bg-blue-500/10"><p className="text-xs font-bold text-blue-500">{currentRecipe.nutritionPerServing.fat}g</p><p className="text-[10px] opacity-50">ไขมัน</p></div>
                    <div className="text-center p-2 rounded-lg bg-yellow-500/10"><p className="text-xs font-bold text-yellow-500">{currentRecipe.nutritionPerServing.carbohydrates}g</p><p className="text-[10px] opacity-50">คาร์โบฯ</p></div>
                  </div>
                )}
                {/* Ingredients */}
                <div>
                  <h4 className="font-bold text-sm flex items-center gap-2 mb-3"><Apple className="w-4 h-4 text-green-500" />วัตถุดิบ ({currentRecipe.ingredients.length} รายการ)</h4>
                  <div className={cn("rounded-xl overflow-hidden divide-y", isDark ? "bg-white/5 divide-white/5" : "bg-gray-50 divide-gray-100")}>
                    {currentRecipe.ingredients.map((ing, i) => (
                      <div key={i} className="flex justify-between px-4 py-2.5">
                        <span className="text-sm">{ing.name}</span>
                        <span className={cn("text-sm font-medium", isDark ? "text-gray-400" : "text-gray-500")}>{ing.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Steps */}
                <div>
                  <h4 className="font-bold text-sm flex items-center gap-2 mb-3"><BookOpen className="w-4 h-4 text-blue-500" />ขั้นตอน</h4>
                  <div className="space-y-3">
                    {currentRecipe.steps.map((step, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">{i + 1}</div>
                        <p className={cn("text-sm leading-relaxed pt-1", isDark ? "text-gray-300" : "text-gray-700")}>{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Tips */}
                {currentRecipe.tips?.length > 0 && (
                  <div className={cn("rounded-xl p-4 space-y-2", isDark ? "bg-yellow-500/10 border border-yellow-500/20" : "bg-yellow-50 border border-yellow-100")}>
                    <h4 className="font-bold text-sm flex items-center gap-2"><Lightbulb className="w-4 h-4 text-yellow-500" />เคล็ดลับ</h4>
                    {currentRecipe.tips.map((tip, i) => (
                      <p key={i} className={cn("text-sm", isDark ? "text-yellow-300/80" : "text-yellow-700")}>• {tip}</p>
                    ))}
                  </div>
                )}
                {/* Save recipe button */}
                <button
                  onClick={handleSaveRecipe}
                  disabled={recipeSaved}
                  className={cn("w-full py-3.5 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all",
                    recipeSaved ? "bg-purple-500/20 text-purple-500 border border-purple-500/30" : "bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:shadow-lg"
                  )}
                >
                  {recipeSaved ? <BookmarkCheck className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                  {recipeSaved ? "บันทึกสูตรแล้ว" : "บันทึกสูตร"}
                </button>
              </>
            ) : (
              <div className="text-center py-8">
                <X className="w-10 h-10 mx-auto mb-3 text-red-400" />
                <p className="text-sm">ไม่สามารถสร้างสูตรได้ ลองใหม่อีกครั้ง</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ===== FoodCard =====
  const FoodCard = ({ food, onClick }: { food: SearchFoodResult | FirestoreFoodItem; onClick: () => void }) => {
    const n = food.nutrients;
    return (
      <button onClick={onClick} className={cn("group relative rounded-2xl overflow-hidden text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-xl", isDark ? "bg-white/5 border border-white/10 hover:border-white/20" : "bg-white border border-gray-100 shadow-md hover:shadow-xl")}>
        <div className="relative h-36 overflow-hidden">
          {food.imageUrl ? (
            <img src={food.imageUrl} alt={food.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          ) : (
            <div className={cn("w-full h-full flex items-center justify-center", isDark ? "bg-white/5" : "bg-gray-100")}><Apple className={cn("w-10 h-10", isDark ? "text-gray-600" : "text-gray-300")} /></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute bottom-2 left-3 right-3">
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-white text-sm font-bold">{n.calories.toFixed(0)} kcal</span>
            </div>
          </div>
        </div>
        <div className="p-3">
          <p className="font-semibold text-sm leading-tight line-clamp-2 min-h-[2.5rem]">{food.name}</p>
          {food.category && <p className={cn("text-[10px] mt-1 truncate", isDark ? "text-gray-500" : "text-gray-400")}>{food.category}</p>}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-medium text-green-500">P {n.protein.toFixed(1)}g</span>
            <span className="text-[10px] font-medium text-blue-500">F {n.fat.toFixed(1)}g</span>
            <span className="text-[10px] font-medium text-yellow-500">C {n.carbohydrates.toFixed(1)}g</span>
          </div>
        </div>
      </button>
    );
  };

  // ===== Feed Section =====
  const renderFeedSection = () => (
    <div className="space-y-6">
      {/* Search Bar + Scan shortcut */}
      <div className="space-y-3">
        <form onSubmit={handleSearch}>
          <div className="ai-search-wrapper">
            <div className={cn("ai-search-inner flex items-center gap-3 px-4 py-3.5", isDark ? "bg-gray-900" : "bg-white")}>
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-purple-500/20 to-indigo-500/20")}>
                <Sparkles className={cn("w-4 h-4", isDark ? "text-purple-400" : "text-purple-500")} />
              </div>
              <div className="flex-1 relative">
                <input ref={searchInputRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={cn("w-full bg-transparent outline-none text-sm font-medium relative z-10", isDark ? "text-white" : "text-gray-900")} />
                {!searchQuery && (
                  <div className={cn("absolute inset-0 flex items-center pointer-events-none text-sm", isDark ? "text-gray-500" : "text-gray-400")}>
                    <span>{placeholderText}</span>
                    <span className={cn("inline-block w-[2px] h-4 ml-0.5 rounded-full animate-pulse", isDark ? "bg-purple-400" : "bg-purple-500")} />
                  </div>
                )}
              </div>
              {searchQuery && <button type="button" onClick={() => { setSearchQuery(""); setSearchResults([]); setAiMenus([]); }} className="p-1"><X className={cn("w-4 h-4", isDark ? "text-gray-500" : "text-gray-400")} /></button>}
              <button type="submit" disabled={searchLoading || !searchQuery.trim()} className={cn("px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-50 bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 hover:shadow-lg hover:shadow-purple-500/30")}>
                {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="flex items-center gap-1.5"><Bot className="w-4 h-4" />ค้นหา</span>}
              </button>
            </div>
          </div>
        </form>
        {/* Quick action row */}
        <div className="flex gap-2">
          <button onClick={() => setActiveTab("scan")} className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]", isDark ? "bg-gradient-to-r from-purple-500/15 to-indigo-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20" : "bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/60 text-purple-700 hover:shadow-md")}>
            <Camera className="w-4 h-4" />แสกนอาหาร
          </button>
          {!searchQuery && (
            <div className="flex gap-2 overflow-x-auto flex-1">
              {[{ label: "โปรตีนสูง", q: "อาหารโปรตีนสูง" }, { label: "ลดน้ำหนัก", q: "อาหารลดน้ำหนัก" }, { label: "Pizza", q: "pizza" }, { label: "Sushi", q: "sushi" }, { label: "ข้าวผัด", q: "ข้าวผัด" }].map(item => (
                <button key={item.q} onClick={() => { setSearchQuery(item.q); handleSearch(undefined, item.q); }} className={cn("flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105 border", isDark ? "bg-white/5 border-white/10 text-gray-300 hover:bg-purple-500/20 hover:border-purple-500/30" : "bg-white border-gray-200 text-gray-600 hover:bg-purple-50 hover:border-purple-300 shadow-sm")}>
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Search Progress (inline in feed) */}
      {searchLoading && (
        <div className={cn("rounded-2xl p-4 space-y-3 border-2", isDark ? "bg-purple-500/5 border-purple-500/20" : "bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200/50 shadow-lg shadow-purple-500/10")}>
          <div className="flex items-center gap-3">
            <div className="relative"><div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-500")}><Bot className="w-5 h-5 text-white animate-pulse" /></div></div>
            <div className="flex-1">
              <p className="text-sm font-bold"><span className="ai-shimmer-text">{aiSearchStep === "ai" ? "AI กำลังวิเคราะห์คำค้นหา..." : "กำลังค้นหาข้อมูลโภชนาการ..."}</span></p>
              <div className={cn("h-2 rounded-full mt-2 overflow-hidden", isDark ? "bg-white/10" : "bg-purple-100")}>
                <div className="h-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 transition-all duration-700" style={{ width: aiSearchStep === "ai" ? "40%" : "80%" }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USDA Search Results (inline in feed) */}
      {!searchLoading && searchResults.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-green-500" />
              <h3 className="font-bold text-sm">ผลการค้นหา</h3>
              <span className={cn("text-xs px-2 py-0.5 rounded-full", isDark ? "bg-green-500/20 text-green-400" : "bg-green-100 text-green-700")}>{searchResults.length} รายการ</span>
            </div>
            <button onClick={() => { setSearchQuery(""); setSearchResults([]); setAiMenus([]); }} className={cn("text-xs font-medium px-2 py-1 rounded-lg", isDark ? "text-gray-400 hover:text-white hover:bg-white/10" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100")}>ล้าง</button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {searchResults.map(food => <FoodCard key={food.fdcId} food={food} onClick={() => handleSelectFood(food)} />)}
          </div>
        </div>
      )}

      {/* AI Menu Recommendations when USDA empty (inline in feed) */}
      {!searchLoading && searchResults.length === 0 && (aiMenusLoading || aiMenus.length > 0) && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-5 h-5 text-purple-500" />
            <h3 className="font-bold text-sm">น้องกาย AI แนะนำเมนู</h3>
            <span className={cn("text-[10px] px-2 py-0.5 rounded-full", isDark ? "bg-purple-500/20 text-purple-400" : "bg-purple-100 text-purple-700")}>AI Generated</span>
          </div>
          {aiMenusLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-purple-500" /></div>
          ) : (
            <div className="space-y-3">
              {aiMenus.map((menu, i) => (
                <div key={i} className={cn("rounded-2xl p-4 border transition-all", isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-100 shadow-sm")}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-bold">{menu.name}</h4>
                      <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>{menu.nameEn}</p>
                      <p className={cn("text-sm mt-1", isDark ? "text-gray-300" : "text-gray-600")}>{menu.description}</p>
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <p className="text-lg font-black text-orange-500">{menu.calories}</p>
                      <p className="text-[10px] text-gray-400">kcal</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-[10px] font-medium text-green-500">P {menu.protein}g</span>
                    <span className="text-[10px] font-medium text-blue-500">F {menu.fat}g</span>
                    <span className="text-[10px] font-medium text-yellow-500">C {menu.carbohydrates}g</span>
                    <span className={cn("text-[10px] ml-auto", isDark ? "text-gray-500" : "text-gray-400")}>{menu.prepTime} นาที • {menu.difficulty}</span>
                  </div>
                  {menu.healthBenefits && <p className={cn("text-xs mt-2", isDark ? "text-emerald-400/80" : "text-emerald-600")}>💡 {menu.healthBenefits}</p>}
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleAskRecipe(menu.name, menu.nameEn, { calories: menu.calories, protein: menu.protein, fat: menu.fat, carbohydrates: menu.carbohydrates })} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-semibold hover:shadow-lg transition-all">
                      <ChefHat className="w-3.5 h-3.5" />ดูสูตร
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty search state */}
      {!searchLoading && searchResults.length === 0 && aiMenus.length === 0 && searchQuery && !aiSearchStep && !aiMenusLoading && (
        <div className="text-center py-6">
          <Search className={cn("w-8 h-8 mx-auto mb-2", isDark ? "text-gray-600" : "text-gray-300")} />
          <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>ไม่พบผลลัพธ์สำหรับ "{searchQuery}"</p>
        </div>
      )}

      {/* Personalized AI Recommendations */}
      {(personalizedLoading || personalizedFoods.length > 0) && (
        <div className={cn("rounded-2xl border p-4", isDark ? "bg-[#0e0e1a] border-purple-500/20" : "bg-white border-purple-200/60")}>
          {/* Header */}
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Bot className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm flex items-center gap-2">
                น้องกาย AI แนะนำเฉพาะคุณ
                <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-semibold", isDark ? "bg-purple-500/20 text-purple-300" : "bg-purple-100 text-purple-600")}>AI</span>
              </h3>
              <p className={cn("text-[11px]", isDark ? "text-gray-500" : "text-gray-400")}>วิเคราะห์จากข้อมูลสุขภาพของคุณ</p>
            </div>
            {!personalizedLoading && personalizedFoods.length > 0 && (
              <button
                onClick={() => loadPersonalized(true)}
                className={cn("p-1.5 rounded-lg transition-colors", isDark ? "hover:bg-white/10 text-gray-400 hover:text-purple-400" : "hover:bg-purple-50 text-gray-400 hover:text-purple-500")}
                title="รีเฟรชคำแนะนำ"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {personalizedLoading ? (
            <div className={cn("rounded-xl p-5 flex flex-col items-center gap-2", isDark ? "bg-purple-500/5" : "bg-purple-50/60")}>
              <Loader2 className={cn("w-6 h-6 animate-spin", isDark ? "text-purple-400" : "text-purple-500")} />
              <p className={cn("text-xs font-medium", isDark ? "text-gray-400" : "text-gray-500")}>AI กำลังวิเคราะห์ข้อมูลของคุณ...</p>
            </div>
          ) : (
            <>
              {personalizedReason && (
                <div className={cn("rounded-xl px-3.5 py-2.5 flex items-start gap-2 mb-3", isDark ? "bg-purple-500/10" : "bg-purple-50")}>
                  <MessageSquare className={cn("w-3.5 h-3.5 mt-0.5 flex-shrink-0", isDark ? "text-purple-400" : "text-purple-500")} />
                  <p className={cn("text-xs leading-relaxed", isDark ? "text-gray-300" : "text-gray-600")}>{personalizedReason}</p>
                </div>
              )}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {personalizedFoods.map(food => <FoodCard key={food.fdcId} food={food} onClick={() => handleSelectFood(food)} />)}
              </div>
            </>
          )}
        </div>
      )}

      {/* Nutrition Tips */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className={cn("w-4 h-4", isDark ? "text-yellow-400" : "text-yellow-500")} />
          <h3 className="font-bold text-sm">เกร็ดความรู้โภชนาการ</h3>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
          {[
            { title: "โปรตีนสร้างกล้ามเนื้อ", desc: "ควรได้รับ 1.6-2.2g ต่อน้ำหนักตัว 1kg สำหรับผู้ออกกำลังกาย", icon: <Beef className="w-5 h-5" />, from: "from-green-500", to: "to-emerald-600" },
            { title: "ดื่มน้ำให้เพียงพอ", desc: "ดื่มน้ำอย่างน้อย 8-10 แก้วต่อวัน ช่วยเผาผลาญและลดน้ำหนัก", icon: <Droplets className="w-5 h-5" />, from: "from-blue-500", to: "to-cyan-600" },
            { title: "ผักผลไม้ 5 ส่วน", desc: "ทานผักผลไม้ 5 ส่วนต่อวัน เพื่อรับวิตามินและแร่ธาตุเพียงพอ", icon: <Apple className="w-5 h-5" />, from: "from-orange-500", to: "to-red-600" },
            { title: "พักผ่อนให้เพียงพอ", desc: "นอนหลับ 7-9 ชม. ช่วยควบคุมฮอร์โมนความหิวและการเผาผลาญ", icon: <Heart className="w-5 h-5" />, from: "from-purple-500", to: "to-pink-600" },
          ].map((tip, i) => (
            <div key={i} className={cn("flex-shrink-0 w-60 rounded-2xl p-4 space-y-2", isDark ? "bg-white/5 border border-white/10" : "bg-white border border-gray-100 shadow-sm")}>
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center text-white bg-gradient-to-br", tip.from, tip.to)}>{tip.icon}</div>
              <p className="font-bold text-sm">{tip.title}</p>
              <p className={cn("text-xs leading-relaxed", isDark ? "text-gray-400" : "text-gray-500")}>{tip.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Healthy Food Categories */}
      {healthyCategories.map((cat) => (
        cat.foods?.length > 0 && (
          <div key={cat.categoryEn}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-green-500" />
                <h3 className="font-bold text-sm">{cat.category}</h3>
              </div>
              <ChevronRight className={cn("w-4 h-4", isDark ? "text-gray-600" : "text-gray-400")} />
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {cat.foods.map((food) => (
                <button key={food.fdcId} onClick={() => handleSelectFood({ fdcId: food.fdcId, name: food.name, category: "", brandName: "", servingSize: 100, servingSizeUnit: "g", imageUrl: food.imageUrl, imageCredit: food.imageCredit || "", nutrients: { ...food.nutrients, fiber: 0, sugar: 0, sodium: 0, cholesterol: 0, calcium: 0, iron: 0, potassium: 0, vitaminC: 0, vitaminA: 0 } })} className={cn("flex-shrink-0 w-40 rounded-2xl overflow-hidden text-left transition-all hover:scale-[1.02]", isDark ? "bg-white/5 border border-white/10" : "bg-white border border-gray-100 shadow-sm")}>
                  <div className="relative h-24 overflow-hidden">
                    {food.imageUrl ? <img src={food.imageUrl} alt={food.name} className="w-full h-full object-cover" /> : <div className={cn("w-full h-full flex items-center justify-center", isDark ? "bg-white/5" : "bg-gray-100")}><Apple className="w-8 h-8 text-gray-300" /></div>}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-1.5 left-2"><span className="text-white text-[10px] font-bold">{food.nutrients.calories.toFixed(0)} kcal</span></div>
                  </div>
                  <div className="p-2">
                    <p className="font-semibold text-xs line-clamp-2">{food.name}</p>
                    <div className="flex gap-1.5 mt-1">
                      <span className="text-[9px] text-green-500">P{food.nutrients.protein.toFixed(0)}g</span>
                      <span className="text-[9px] text-blue-500">F{food.nutrients.fat.toFixed(0)}g</span>
                      <span className="text-[9px] text-yellow-500">C{food.nutrients.carbohydrates.toFixed(0)}g</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )
      ))}

      {/* Popular Foods */}
      {!recommendLoading && popularFoods.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3"><TrendingUp className="w-4 h-4 text-orange-500" /><h3 className="font-bold text-sm">อาหารยอดนิยม</h3></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {popularFoods.map(food => <FoodCard key={food.fdcId} food={food} onClick={() => handleSelectFirestoreFood(food)} />)}
          </div>
        </div>
      )}

      {/* Recent Foods */}
      {!recommendLoading && recentFoods.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3"><Clock className="w-4 h-4 text-blue-500" /><h3 className="font-bold text-sm">เพิ่มล่าสุด</h3></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {recentFoods.map(food => <FoodCard key={food.fdcId} food={food} onClick={() => handleSelectFirestoreFood(food)} />)}
          </div>
        </div>
      )}
    </div>
  );

  // ===== Scanner Related =====
  const renderNutritionResultCard = () => {
    if (!predictions) return null;
    return (
      <div className={cn("rounded-2xl p-5 space-y-4", isDark ? "bg-white/5 border border-white/10" : "bg-white shadow-lg border border-gray-100")}>
        <div className="flex items-center gap-2 mb-2"><Flame className="w-5 h-5 text-orange-500" /><h3 className="font-bold text-lg">คุณค่าโภชนาการ</h3></div>
        <div className="text-center py-3">
          <p className="text-4xl font-black text-orange-500">{predictions.calories.toFixed(1)}</p>
          <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>แคลอรี่ (kcal)</p>
        </div>
        <div className="space-y-3">
          <MacroBar label="โปรตีน" value={predictions.protein} unit="g" color="bg-green-500" max={100} />
          <MacroBar label="ไขมัน" value={predictions.fat} unit="g" color="bg-blue-500" max={80} />
          <MacroBar label="คาร์โบไฮเดรต" value={predictions.carbohydrates} unit="g" color="bg-yellow-500" max={200} />
        </div>
        <div className={cn("pt-3 border-t flex justify-between text-sm", isDark ? "border-white/10" : "border-gray-100")}>
          <span className={isDark ? "text-gray-400" : "text-gray-500"}>น้ำหนักรวม</span>
          <span className="font-semibold">{predictions.total_mass.toFixed(1)} g</span>
        </div>
      </div>
    );
  };

  const renderIngredientResultCard = () => {
    if (!analysis) return null;
    return (
      <div className={cn("rounded-2xl p-5 space-y-4", isDark ? "bg-white/5 border border-white/10" : "bg-white shadow-lg border border-gray-100")}>
        <div>
          <h3 className="font-bold text-xl">{analysis.food_name}</h3>
          <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>{analysis.food_name_en}</p>
          {analysis.description && <p className={cn("text-sm mt-1", isDark ? "text-gray-300" : "text-gray-600")}>{analysis.description}</p>}
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2"><Apple className="w-4 h-4 text-green-500" />วัตถุดิบ ({analysis.ingredients.length} รายการ)</h4>
          <div className="space-y-2">
            {analysis.ingredients.map((ing, i) => (
              <div key={i} className={cn("rounded-xl overflow-hidden border transition-all", isDark ? "border-white/10 bg-white/5" : "border-gray-100 bg-gray-50")}>
                <button onClick={() => setExpandedIngredient(expandedIngredient === i ? null : i)} className="w-full flex items-center justify-between p-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500 font-bold text-xs">{i + 1}</div>
                    <div><span className="font-medium text-sm">{ing.name}</span><span className={cn("text-xs ml-2", isDark ? "text-gray-500" : "text-gray-400")}>~{ing.estimated_grams}g</span></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-orange-500">{ing.calories.toFixed(1)} kcal</span>
                    {expandedIngredient === i ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>
                {expandedIngredient === i && (
                  <div className={cn("px-3 pb-3 pt-0 border-t", isDark ? "border-white/5" : "border-gray-100")}>
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <div className="text-center p-2 rounded-lg bg-green-500/10"><p className="text-xs text-green-500 font-semibold">{ing.protein.toFixed(1)}g</p><p className={cn("text-[10px]", isDark ? "text-gray-500" : "text-gray-400")}>โปรตีน</p></div>
                      <div className="text-center p-2 rounded-lg bg-blue-500/10"><p className="text-xs text-blue-500 font-semibold">{ing.fat.toFixed(1)}g</p><p className={cn("text-[10px]", isDark ? "text-gray-500" : "text-gray-400")}>ไขมัน</p></div>
                      <div className="text-center p-2 rounded-lg bg-yellow-500/10"><p className="text-xs text-yellow-500 font-semibold">{ing.carbohydrates.toFixed(1)}g</p><p className={cn("text-[10px]", isDark ? "text-gray-500" : "text-gray-400")}>คาร์โบฯ</p></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        {analysis.health_tips && <div className={cn("rounded-xl p-3", isDark ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-emerald-50 border border-emerald-100")}><p className="text-sm text-emerald-600 dark:text-emerald-400">💡 {analysis.health_tips}</p></div>}
        {/* Ask recipe button */}
        <button onClick={() => handleAskRecipe(analysis.food_name, analysis.food_name_en, predictions ? { calories: predictions.calories, protein: predictions.protein, fat: predictions.fat, carbohydrates: predictions.carbohydrates } : undefined, imagePreview || undefined)} className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-purple-500 to-indigo-600 text-white flex items-center justify-center gap-2 hover:shadow-lg transition-all">
          <ChefHat className="w-4 h-4" />ถามสูตรกับน้องกาย AI
        </button>
      </div>
    );
  };

  const renderScannerSection = () => (
    <div className="space-y-4">
      {!imagePreview ? (
        <div className={cn("rounded-2xl border-2 border-dashed p-8 flex flex-col items-center justify-center gap-4 transition-colors cursor-pointer min-h-[200px]", isDark ? "border-white/20 hover:border-green-500/50 bg-white/5" : "border-gray-300 hover:border-green-500 bg-gray-50")} onClick={() => fileInputRef.current?.click()}>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/10 flex items-center justify-center"><ScanLine className="w-8 h-8 text-green-500" /></div>
          <div className="text-center">
            <p className="font-semibold">แสกนอาหารของคุณ</p>
            <p className={cn("text-sm mt-1", isDark ? "text-gray-400" : "text-gray-500")}>ถ่ายรูปหรืออัปโหลดรูปอาหารเพื่อวิเคราะห์คุณค่าโภชนาการ</p>
          </div>
          <div className="flex gap-3">
            <button onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium"><Camera className="w-4 h-4" />ถ่ายรูป</button>
            <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium", isDark ? "bg-white/10 hover:bg-white/20" : "bg-gray-200 hover:bg-gray-300")}><Upload className="w-4 h-4" />อัปโหลด</button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden">
            <img src={imagePreview} alt="Food preview" className="w-full max-h-72 object-cover" />
            {scanStep === "idle" && !selectedHistoryItem && <button onClick={resetScan} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white"><X className="w-4 h-4" /></button>}
            {analysis && <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4"><p className="text-white font-bold text-lg">{analysis.food_name}</p><p className="text-white/70 text-sm">{analysis.food_name_en}</p></div>}
          </div>
          {scanStep !== "idle" && scanStep !== "done" && scanStep !== "error" && (
            <div className={cn("rounded-2xl p-4 flex items-center gap-3", isDark ? "bg-white/5" : "bg-gray-50")}>
              <Loader2 className="w-5 h-5 animate-spin text-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">{stepLabels[scanStep]}</p>
                <div className={cn("h-1.5 rounded-full mt-2 overflow-hidden", isDark ? "bg-white/10" : "bg-gray-200")}><div className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500" style={{ width: scanStep === "predicting" ? "33%" : "66%" }} /></div>
              </div>
            </div>
          )}
          {scanStep === "error" && <div className="rounded-2xl p-4 bg-red-500/10 border border-red-500/20"><p className="text-sm text-red-500">{errorMessage}</p><button onClick={() => { setScanStep("idle"); setErrorMessage(""); }} className="text-sm text-red-400 underline mt-2">ลองใหม่</button></div>}
          {scanStep === "idle" && !selectedHistoryItem && <button onClick={handleScan} disabled={!selectedImage} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold text-base disabled:opacity-50"><span className="flex items-center justify-center gap-2"><ScanLine className="w-5 h-5" />เริ่มแสกน</span></button>}
          {scanStep === "done" && !isDesktop && (
            <div className="space-y-4">
              {renderNutritionResultCard()}
              {renderIngredientResultCard()}
              {!selectedHistoryItem && selectedImage && (
                <button onClick={handleSaveScan} disabled={scanSaved || savingScan} className={cn("w-full py-3.5 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all", scanSaved ? "bg-green-500/20 text-green-500 border border-green-500/30" : "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg")}>
                  {savingScan ? <Loader2 className="w-5 h-5 animate-spin" /> : scanSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                  {savingScan ? "กำลังบันทึก..." : scanSaved ? "บันทึกแล้ว" : "บันทึกผลแสกน"}
                </button>
              )}
              <button onClick={resetScan} className={cn("w-full py-3 rounded-xl font-medium", isDark ? "bg-white/10 hover:bg-white/20" : "bg-gray-100 hover:bg-gray-200")}>{selectedHistoryItem ? "กลับไปแสกน" : "แสกนอาหารใหม่"}</button>
            </div>
          )}
          {scanStep === "done" && isDesktop && (
            <div className="space-y-3">
              {!selectedHistoryItem && selectedImage && (
                <button onClick={handleSaveScan} disabled={scanSaved || savingScan} className={cn("w-full py-3.5 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all", scanSaved ? "bg-green-500/20 text-green-500 border border-green-500/30" : "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg")}>
                  {savingScan ? <Loader2 className="w-5 h-5 animate-spin" /> : scanSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                  {savingScan ? "กำลังบันทึก..." : scanSaved ? "บันทึกแล้ว" : "บันทึกผลแสกน"}
                </button>
              )}
              <button onClick={resetScan} className={cn("w-full py-3 rounded-xl font-medium", isDark ? "bg-white/10 hover:bg-white/20" : "bg-gray-100 hover:bg-gray-200")}>{selectedHistoryItem ? "กลับไปแสกน" : "แสกนอาหารใหม่"}</button>
            </div>
          )}
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageSelect(file); e.target.value = ""; }} />
      <input ref={cameraInputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageSelect(file); e.target.value = ""; }} />
    </div>
  );

  // ===== Saved Section =====
  const renderSavedSection = () => (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className={cn("flex rounded-xl overflow-hidden border", isDark ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50")}>
        {([["foods", "อาหาร", <Bookmark className="w-3.5 h-3.5" key="f" />], ["scans", "แสกน", <ScanLine className="w-3.5 h-3.5" key="s" />], ["recipes", "สูตร", <ChefHat className="w-3.5 h-3.5" key="r" />]] as [typeof savedSubTab, string, React.ReactNode][]).map(([tab, label, icon]) => (
          <button key={tab} onClick={() => setSavedSubTab(tab)} className={cn("flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all", savedSubTab === tab ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white" : isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900")}>
            {icon}{label}
          </button>
        ))}
      </div>

      {savedFoodsLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-green-500" /></div>
      ) : (
        <>
          {/* Saved Foods */}
          {savedSubTab === "foods" && (
            savedFoods.length === 0 ? (
              <div className="text-center py-12"><Bookmark className={cn("w-12 h-12 mx-auto mb-3", isDark ? "text-gray-600" : "text-gray-300")} /><p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>ยังไม่มีอาหารที่บันทึก</p></div>
            ) : (
              <div className="space-y-3">
                {savedFoods.map((food) => (
                  <div key={food.id} className={cn("relative rounded-2xl overflow-hidden border", isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-100 shadow-sm")}>
                    <div className="flex">
                      {food.imageUrl && <img src={food.imageUrl} alt={food.name} className="w-24 h-24 object-cover flex-shrink-0" />}
                      <div className="flex-1 p-3 pr-12 min-w-0">
                        <p className="font-semibold text-sm truncate">{food.name}</p>
                        <div className="flex gap-3 mt-1.5">
                          <span className="text-xs font-semibold text-orange-500">{food.nutrients.calories.toFixed(0)} kcal</span>
                          <span className="text-[10px] text-green-500">P{food.nutrients.protein.toFixed(1)}g</span>
                          <span className="text-[10px] text-blue-500">F{food.nutrients.fat.toFixed(1)}g</span>
                          <span className="text-[10px] text-yellow-500">C{food.nutrients.carbohydrates.toFixed(1)}g</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={cn("text-[10px] px-2 py-0.5 rounded-full", isDark ? "bg-white/10 text-gray-400" : "bg-gray-100 text-gray-500")}>{food.source === "search" ? "ค้นหา" : food.source === "scan" ? "แสกน" : "AI"}</span>
                          <span className={cn("text-[10px]", isDark ? "text-gray-500" : "text-gray-400")}>{formatDate(food.savedAt)}</span>
                        </div>
                        <button onClick={() => handleAskRecipe(food.name, food.nameEn, { calories: food.nutrients.calories, protein: food.nutrients.protein, fat: food.nutrients.fat, carbohydrates: food.nutrients.carbohydrates }, food.imageUrl)} className="mt-2 flex items-center gap-1 text-xs font-semibold text-purple-500 hover:text-purple-400 transition-colors">
                          <ChefHat className="w-3 h-3" />ถามสูตร AI
                        </button>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteSavedFood(food.id!)} className={cn("absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center", isDark ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-500")}><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Scan History */}
          {savedSubTab === "scans" && (
            scanHistory.length === 0 ? (
              <div className="text-center py-12"><ScanLine className={cn("w-12 h-12 mx-auto mb-3", isDark ? "text-gray-600" : "text-gray-300")} /><p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>ยังไม่มีประวัติการแสกน</p></div>
            ) : (
              <div className="space-y-3">
                {scanHistory.map((scan) => (
                  <div key={scan.id} className={cn("relative rounded-2xl overflow-hidden border transition-all", isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-100 shadow-sm")}>
                    <button onClick={() => viewHistoryItem(scan)} className="w-full text-left">
                      <div className="flex">
                        <img src={scan.imageUrl} alt={scan.analysis?.food_name || "Food"} className="w-28 h-28 object-cover flex-shrink-0 rounded-l-2xl" />
                        <div className="flex-1 p-3 pr-12 min-w-0">
                          <p className="font-bold text-sm">{scan.analysis?.food_name || "อาหาร"}</p>
                          <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>{scan.analysis?.food_name_en}</p>
                          <div className="grid grid-cols-4 gap-1.5 mt-2">
                            <div className={cn("rounded-lg p-1.5 text-center", isDark ? "bg-orange-500/10" : "bg-orange-50")}>
                              <p className="text-[10px] font-bold text-orange-500">{scan.predictions.calories.toFixed(0)}</p><p className="text-[8px] opacity-50">kcal</p>
                            </div>
                            <div className={cn("rounded-lg p-1.5 text-center", isDark ? "bg-green-500/10" : "bg-green-50")}>
                              <p className="text-[10px] font-bold text-green-500">{scan.predictions.protein.toFixed(1)}g</p><p className="text-[8px] opacity-50">โปรตีน</p>
                            </div>
                            <div className={cn("rounded-lg p-1.5 text-center", isDark ? "bg-blue-500/10" : "bg-blue-50")}>
                              <p className="text-[10px] font-bold text-blue-500">{scan.predictions.fat.toFixed(1)}g</p><p className="text-[8px] opacity-50">ไขมัน</p>
                            </div>
                            <div className={cn("rounded-lg p-1.5 text-center", isDark ? "bg-yellow-500/10" : "bg-yellow-50")}>
                              <p className="text-[10px] font-bold text-yellow-500">{scan.predictions.carbohydrates.toFixed(1)}g</p><p className="text-[8px] opacity-50">คาร์โบฯ</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 mt-2">
                            <Clock className="w-3 h-3 text-gray-400" /><span className={cn("text-[10px]", isDark ? "text-gray-500" : "text-gray-400")}>{formatDate(scan.scannedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                    <button onClick={(e) => handleDeleteScan(e, scan.id!)} disabled={deletingHistoryId === scan.id} className={cn("absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center", isDark ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-500")}>
                      {deletingHistoryId === scan.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Saved Recipes */}
          {savedSubTab === "recipes" && (
            savedRecipes.length === 0 ? (
              <div className="text-center py-12"><ChefHat className={cn("w-12 h-12 mx-auto mb-3", isDark ? "text-gray-600" : "text-gray-300")} /><p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>ยังไม่มีสูตรที่บันทึก</p></div>
            ) : (
              <div className="space-y-3">
                {savedRecipes.map((item) => (
                  <div key={item.id} className={cn("relative rounded-2xl overflow-hidden border", isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-100 shadow-sm")}>
                    <button onClick={() => { setRecipeFoodName(item.foodName); setRecipeFoodImage(item.imageUrl || ""); setCurrentRecipe(item.recipe); setRecipeSaved(true); setRecipeLoading(false); setRecipeOverlay(true); }} className="w-full text-left">
                      <div className="flex">
                        {item.imageUrl && <img src={item.imageUrl} alt={item.foodName} className="w-24 h-24 object-cover flex-shrink-0" />}
                        <div className="flex-1 p-3 pr-12 min-w-0">
                          <div className="flex items-center gap-2">
                            <ChefHat className="w-4 h-4 text-purple-500 flex-shrink-0" />
                            <p className="font-bold text-sm truncate">{item.recipe.title}</p>
                          </div>
                          <p className={cn("text-xs truncate", isDark ? "text-gray-400" : "text-gray-500")}>{item.recipe.titleEn}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[10px] text-orange-500 font-semibold">{item.recipe.nutritionPerServing?.calories || 0} kcal</span>
                            <span className={cn("text-[10px]", isDark ? "text-gray-500" : "text-gray-400")}>{item.recipe.prepTime + item.recipe.cookTime} นาที</span>
                            <span className={cn("text-[10px]", isDark ? "text-gray-500" : "text-gray-400")}>{item.recipe.difficulty}</span>
                          </div>
                          <span className={cn("mt-1 text-[10px]", isDark ? "text-gray-500" : "text-gray-400")}>{formatDate(item.savedAt)}</span>
                        </div>
                      </div>
                    </button>
                    <button onClick={() => handleDeleteRecipe(item.id!)} className={cn("absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center", isDark ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-500")}><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}
    </div>
  );

  // ===== Tab buttons =====
  const TabButton = ({ tab, icon, label }: { tab: ActiveTab; icon: React.ReactNode; label: string }) => (
    <button onClick={() => setActiveTab(tab)} className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all", activeTab === tab ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/20" : isDark ? "bg-white/5 text-gray-400 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
      {icon}{label}
    </button>
  );

  const TabButtonMobile = ({ tab, icon, label }: { tab: ActiveTab; icon: React.ReactNode; label: string }) => (
    <button onClick={() => setActiveTab(tab)} className={cn("flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all", activeTab === tab ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30" : isDark ? "bg-white/10 text-gray-300" : "bg-gray-100 text-gray-600")}>
      {icon}{label}
    </button>
  );

  // ===== Desktop Layout =====
  const renderDesktopLayout = () => (
    <div className={cn("min-h-screen", isDark ? "bg-[#0a0a0f] text-white" : "bg-slate-50 text-gray-900")}>
      <div className="min-h-screen overflow-y-auto">
        <div className="relative h-56 overflow-hidden">
          <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1400&q=80" alt="Nutrition" className="w-full h-full object-cover" />
          <div className={cn("absolute inset-0", isDark ? "bg-gradient-to-r from-[#0a0a0f] via-[#0a0a0f]/85 to-[#0a0a0f]/40" : "bg-gradient-to-r from-white via-white/90 to-white/30")} />
          <div className="absolute inset-0 p-8 flex items-center">
            <div className="max-w-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center"><Zap className="w-5 h-5 text-white" /></div>
                <span className={cn("text-sm font-medium px-3 py-1 rounded-full", isDark ? "bg-green-500/20 text-green-400" : "bg-green-100 text-green-700")}>AI-Powered</span>
              </div>
              <h1 className="text-4xl font-black mb-2">Nutrition <span className="bg-gradient-to-r from-green-500 to-emerald-400 bg-clip-text text-transparent">Hub</span></h1>
              <p className={cn("text-base", isDark ? "text-gray-400" : "text-gray-600")}>ค้นหาอาหาร วิเคราะห์คุณค่าโภชนาการ และแสกนอาหารด้วย AI</p>
            </div>
          </div>
        </div>
        <div className="p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <TabButton tab="feed" icon={<Zap className="w-4 h-4" />} label="ฟีด" />
              <TabButton tab="scan" icon={<ScanLine className="w-4 h-4" />} label="แสกนอาหาร" />
              <TabButton tab="saved" icon={<Bookmark className="w-4 h-4" />} label="บันทึก" />
            </div>
            {activeTab === "feed" && renderFeedSection()}
            {activeTab === "scan" && (
              <div className="grid grid-cols-2 gap-6">
                <div>{renderScannerSection()}</div>
                <div className="space-y-4">
                  {scanStep === "done" ? (<>{renderNutritionResultCard()}{renderIngredientResultCard()}</>) : (
                    <div className={cn("rounded-2xl p-8 flex flex-col items-center justify-center min-h-[400px]", isDark ? "bg-white/5 border border-white/10" : "bg-white shadow-lg")}>
                      <Beef className={cn("w-16 h-16 mb-4", isDark ? "text-gray-600" : "text-gray-300")} />
                      <p className={cn("text-lg font-medium", isDark ? "text-gray-500" : "text-gray-400")}>ผลวิเคราะห์จะแสดงที่นี่</p>
                      <p className={cn("text-sm mt-1", isDark ? "text-gray-600" : "text-gray-400")}>อัปโหลดรูปอาหารแล้วกด "เริ่มแสกน"</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === "saved" && <div className="max-w-2xl">{renderSavedSection()}</div>}
          </div>
        </div>
      </div>
      {renderFoodDetailOverlay()}
      {renderRecipeOverlay()}
    </div>
  );

  // ===== Mobile Layout =====
  const renderMobileLayout = () => (
    <div className={cn("min-h-screen pb-24", isDark ? "bg-black text-white" : "bg-gray-50 text-gray-900")}>
      <div className="relative">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80" alt="Nutrition" className="w-full h-full object-cover" />
          <div className={cn("absolute inset-0", isDark ? "bg-gradient-to-b from-black/60 via-black/80 to-black" : "bg-gradient-to-b from-green-900/70 via-green-900/80 to-gray-50")} />
        </div>
        <div className="relative px-5 pt-12 pb-14">
          <div className="flex items-center gap-3 mb-3">
            <Link to="/dashboard" className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20"><ArrowLeft className="w-5 h-5" /></Link>
            <div className="flex-1">
              <div className="flex items-center gap-2"><h1 className="text-2xl font-black text-white">Nutrition Hub</h1><Star className="w-5 h-5 text-yellow-400 fill-yellow-400" /></div>
              <p className="text-white/70 text-xs">ค้นหาและวิเคราะห์คุณค่าโภชนาการ</p>
            </div>
          </div>
          {predictions && scanStep === "done" && activeTab === "scan" && (
            <div className="rounded-2xl p-4 backdrop-blur bg-white/10">
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center"><p className="text-lg font-bold text-white">{predictions.calories.toFixed(0)}</p><p className="text-[10px] text-white/70">kcal</p></div>
                <div className="text-center"><p className="text-lg font-bold text-white">{predictions.protein.toFixed(1)}g</p><p className="text-[10px] text-white/70">โปรตีน</p></div>
                <div className="text-center"><p className="text-lg font-bold text-white">{predictions.carbohydrates.toFixed(1)}g</p><p className="text-[10px] text-white/70">คาร์โบฯ</p></div>
                <div className="text-center"><p className="text-lg font-bold text-white">{predictions.fat.toFixed(1)}g</p><p className="text-[10px] text-white/70">ไขมัน</p></div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="px-5 -mt-4 relative z-10">
        <div className="flex gap-2 mb-4">
          <TabButtonMobile tab="feed" icon={<Zap className="w-3.5 h-3.5" />} label="ฟีด" />
          <TabButtonMobile tab="scan" icon={<ScanLine className="w-3.5 h-3.5" />} label="แสกน" />
          <TabButtonMobile tab="saved" icon={<Bookmark className="w-3.5 h-3.5" />} label="บันทึก" />
        </div>
        {activeTab === "feed" && renderFeedSection()}
        {activeTab === "scan" && renderScannerSection()}
        {activeTab === "saved" && renderSavedSection()}
      </div>
      {renderFoodDetailOverlay()}
      {renderRecipeOverlay()}
    </div>
  );

  return isDesktop ? renderDesktopLayout() : renderMobileLayout();
}
