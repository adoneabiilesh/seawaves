
import React, { useState, useEffect } from 'react';
import { Product, ProductCategory, Language } from '../types';
import { ProductCard } from './ProductCard';
import { Search, Globe, Filter, Flame, Star } from 'lucide-react';

interface MenuPageProps {
  products: Product[];
  onAddToCart: (product: Product, quantity: number, modifiers: string[], specialRequest: string) => void;
  currentLang: Language;
  onSetLang: (lang: Language) => void;
  restaurantId?: string;
}

const ALLERGEN_OPTIONS = ['Gluten', 'Dairy', 'Nuts', 'Shellfish', 'Soy', 'Eggs', 'Vegetarian', 'Vegan'];

export const MenuPage: React.FC<MenuPageProps> = ({ products, onAddToCart, currentLang, onSetLang, restaurantId }) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [trendingItems, setTrendingItems] = useState<Product[]>([]);
  const [mostLikedItems, setMostLikedItems] = useState<Product[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(true);

  const toggleAllergen = (allergen: string) => {
    setSelectedAllergens(prev => 
      prev.includes(allergen) ? prev.filter(a => a !== allergen) : [...prev, allergen]
    );
  };

  // Fetch trending and most liked items
  useEffect(() => {
    if (!restaurantId) return;

    const fetchRecommendations = async () => {
      try {
        // Fetch trending items
        const trendingRes = await fetch(`/api/menu/trending?restaurantId=${restaurantId}&limit=4`);
        if (trendingRes.ok) {
          const trendingData = await trendingRes.json();
          // Map API response to Product format (you may need to adjust based on your API structure)
          const trendingProducts = trendingData.trending
            .map((item: any) => products.find(p => p.id === item.id))
            .filter(Boolean) as Product[];
          setTrendingItems(trendingProducts);
        }

        // Fetch most liked items
        const mostLikedRes = await fetch(`/api/menu/most-liked?restaurantId=${restaurantId}&limit=4`);
        if (mostLikedRes.ok) {
          const mostLikedData = await mostLikedRes.json();
          const mostLikedProducts = mostLikedData.mostLiked
            .map((item: any) => products.find(p => p.id === item.id))
            .filter(Boolean) as Product[];
          setMostLikedItems(mostLikedProducts);
        }
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      }
    };

    fetchRecommendations();
  }, [restaurantId, products]);

  const filteredProducts = products.filter(product => {
    // 1. Category Filter
    const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
    
    // 2. Search Filter (searches current language)
    const matchesSearch = product.name[currentLang].toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.description[currentLang].toLowerCase().includes(searchQuery.toLowerCase());
    
    // 3. Allergen/Dietary Filter
    // If "Gluten" is selected, we want to HIDE items that HAVE Gluten.
    // If "Vegetarian" is selected (usually a tag, but handling as exclusion for simplicity or inclusion? 
    // Convention: Allergy filters usually EXCLUDE unsafe items. 
    // Let's assume the data 'allergens' array lists what is IN the food.
    const hasConflict = selectedAllergens.some(selected => {
         // If selected is 'Vegetarian' or 'Vegan', we treat them as requirements (must match tag if we had tags, or check implied).
         // For now, let's assume strict allergen exclusion logic:
         // If I select "Gluten", I want items WITHOUT "Gluten" in their allergens list.
         return product.allergens.map(a => a.toLowerCase()).includes(selected.toLowerCase());
    });

    return matchesCategory && matchesSearch && !hasConflict;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      {/* Header & Controls */}
      <div className="flex flex-col gap-6 mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
                    {currentLang === 'it' ? 'Il Nostro Menù' : 
                     currentLang === 'fr' ? 'Notre Menu' : 
                     currentLang === 'de' ? 'Unsere Speisekarte' : 'Our Menu'}
                </h1>
                <p className="text-gray-500 text-lg">
                    {currentLang === 'it' ? 'Curato appositamente per te' : 
                     currentLang === 'fr' ? 'Spécialement conçu pour vous' : 'Curated specially for you'}
                </p>
            </div>

            <div className="flex items-center gap-3">
                {/* Language Switcher */}
                <div className="relative group z-20">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                        <Globe size={18} className="text-gray-500" />
                        <span className="uppercase font-bold text-gray-700">{currentLang}</span>
                    </button>
                    <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-xl border border-gray-100 hidden group-hover:block overflow-hidden">
                        {(['en', 'it', 'fr', 'de'] as Language[]).map(lang => (
                            <button 
                                key={lang}
                                onClick={() => onSetLang(lang)}
                                className={`w-full text-left px-4 py-3 text-sm hover:bg-brand-50 hover:text-brand-600 font-medium ${currentLang === lang ? 'bg-brand-50 text-brand-600' : 'text-gray-600'}`}
                            >
                                {lang === 'en' ? 'English' : lang === 'it' ? 'Italiano' : lang === 'fr' ? 'Français' : 'Deutsch'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
                    placeholder={currentLang === 'it' ? 'Cerca piatti...' : 'Search for dishes...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            
            <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium border transition-all ${showFilters ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
                <Filter size={18} />
                <span>Filters {selectedAllergens.length > 0 && `(${selectedAllergens.length})`}</span>
            </button>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
            <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm animate-in slide-in-from-top-2">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">I am allergic to... (Exclude items)</h3>
                <div className="flex flex-wrap gap-3">
                    {ALLERGEN_OPTIONS.map(allergen => (
                        <button
                            key={allergen}
                            onClick={() => toggleAllergen(allergen)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                                selectedAllergens.includes(allergen)
                                ? 'bg-red-50 text-red-600 border-red-200 shadow-sm'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            {allergen}
                        </button>
                    ))}
                </div>
            </div>
        )}

        {/* Categories */}
        <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
            <button
                onClick={() => setActiveCategory('All')}
                className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                    activeCategory === 'All' 
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-200' 
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
            >
                All Items
            </button>
            {Object.values(ProductCategory).map((cat) => (
                <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                    activeCategory === cat 
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-200' 
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                >
                    {cat}
                </button>
            ))}
        </div>
      </div>

      {/* Trending & Most Liked Sections */}
      {showRecommendations && (trendingItems.length > 0 || mostLikedItems.length > 0) && (
        <div className="mb-10 space-y-8">
          {trendingItems.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-orange-100 p-2 rounded-xl">
                  <Flame className="text-orange-600" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Trending Now</h2>
                  <p className="text-sm text-gray-500">Popular items based on recent orders and ratings</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {trendingItems.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onAddToCart={onAddToCart}
                    currentLang={currentLang}
                  />
                ))}
              </div>
            </div>
          )}

          {mostLikedItems.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-yellow-100 p-2 rounded-xl">
                  <Star className="text-yellow-600 fill-yellow-600" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Most Liked</h2>
                  <p className="text-sm text-gray-500">Highest rated items by our customers</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {mostLikedItems.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onAddToCart={onAddToCart}
                    currentLang={currentLang}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <p className="text-gray-500 text-lg">No items found matching your criteria.</p>
            <button onClick={() => {setActiveCategory('All'); setSearchQuery(''); setSelectedAllergens([]);}} className="mt-4 text-brand-600 font-medium hover:underline">
                Clear all filters
            </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-20">
            {filteredProducts.map(product => (
            <ProductCard 
                key={product.id} 
                product={product} 
                onAddToCart={onAddToCart}
                currentLang={currentLang}
            />
            ))}
        </div>
      )}
    </div>
  );
};
