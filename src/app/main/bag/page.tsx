"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import { AiFillHeart } from "react-icons/ai";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useFirebaseWishlist } from "@/hooks/useFirebaseWishlist";
import { getFavorites, type Favorite } from "@/lib/firebase/userActivity";
import ProtectedRoute from "@/components/ProtectedRoute";
import { IoArrowBack } from "react-icons/io5";

interface Product {
  id: number;
  name: string;
  image: string;
  category: string;
}

function FavouritesPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { wishlist, toggleWishlist } = useFirebaseWishlist();
  const [favouriteProducts, setFavouriteProducts] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  // Sample products (should match your main page products)
  const allProducts: Product[] = [
    { id: 1, name: "Men Black Shirt", image: "/v3.jpg", category: "Men" },
    { id: 2, name: "Women Grey Jogger", image: "/v2.jpg", category: "Women" },
    { id: 3, name: "Kids Red T-Shirt", image: "/v5.jpg", category: "Kids" },
    { id: 4, name: "Men Formal Coat", image: "/v4.jpg", category: "Men" },
    { id: 5, name: "Women White Dress", image: "/v1.jpg", category: "Women" },
    { id: 6, name: "Kids Blue Shorts", image: "/v6.jpg", category: "Kids" },
  ];

  const loadFavorites = React.useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const favorites = await getFavorites(user.uid);
      setFavouriteProducts(favorites);
    } catch (error) {
      console.error("Error loading favorites:", error);
      // Fallback to local wishlist
      const localFavorites = allProducts.filter((product) =>
        wishlist.includes(product.id)
      );
      setFavouriteProducts(localFavorites as any);
    } finally {
      setLoading(false);
    }
  }, [user, wishlist]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleTryOn = (product: Favorite) => {
    const existing = JSON.parse(localStorage.getItem("tryonProducts") || "[]");
    const alreadyAdded = existing.some((p: Product) => p.id === product.id);
    const updated = alreadyAdded ? existing : [...existing, product];
    localStorage.setItem("tryonProducts", JSON.stringify(updated));
    router.push("/main/tryon");
  };

  const handleRemoveFavorite = async (productId: number, product: Favorite) => {
    await toggleWishlist(productId, product as any);
    // Refresh the list
    await loadFavorites();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative flex items-center justify-center py-4 bg-white shadow-sm mb-4">
        <button
          type="button"
          className="absolute left-3 text-xl"
          onClick={() => router.back()}
        >
          <IoArrowBack />
        </button>
        <h2 className="text-xl font-semibold">My Favourites</h2>
      </div>

      <div className="p-6 pb-24">
        {/* Count */}
        <p className="text-gray-600 text-sm mb-4">
          {favouriteProducts.length} item{favouriteProducts.length !== 1 ? "s" : ""} saved
        </p>

        {/* Favourites Grid */}
        {favouriteProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {favouriteProducts.map((product, index) => (
              <div key={`${product.id}-${index}`} className="flex flex-col items-start">
                <div className="relative bg-[#f4f4f4] w-full h-[300px] rounded-[10px] overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover rounded-[10px]"
                  />
                  
                  {/* Remove from favourites button */}
                  <button
                    onClick={() => handleRemoveFavorite(product.id, product)}
                    className="absolute top-2 right-2 bg-white/90 p-2 rounded-full hover:bg-white transition shadow-md"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>

                {/* Info */}
                <div className="mt-2 w-full">
                  <p className="text-[15px] text-gray-800 font-medium truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-gray-500">{product.category}</p>
                </div>

                {/* Try On Button */}
                <button
                  onClick={() => handleTryOn(product)}
                  className="mt-2 w-full bg-black text-white text-sm py-2 rounded-lg hover:bg-gray-800 transition"
                >
                  Try On
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <AiFillHeart className="text-gray-300 text-6xl mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              No Favourites Yet
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Start adding products to your favourites
              <br />
              to see them here
            </p>
            <button
              onClick={() => router.push("/main")}
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition"
            >
              Browse Products
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FavouritesPage() {
  return (
    <ProtectedRoute>
      <FavouritesPageContent />
    </ProtectedRoute>
  );
}

