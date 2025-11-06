"use client";

import Image from "next/image";
import { Search, ShoppingBag } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin } from "@/lib/firebase/products";
import { useFirebaseWishlist } from "@/hooks/useFirebaseWishlist";
import { toast } from "react-hot-toast";

interface Product {
  id: number;
  name: string;
  image: string;
  category: string;
}

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { wishlist, toggleWishlist } = useFirebaseWishlist();
  const [products, setProducts] = useState<Product[]>([]);

  // ✅ Fetch products dynamically
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/sample-products.json");
        if (!res.ok) throw new Error("Failed to load products");
        const data = await res.json();
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
      }
    };
    fetchProducts();
  }, []);

  const isAdminUser = user && isAdmin(user.email);

  const handleWishlistToggle = async (product: Product) => {
    if (!user) {
      toast.error("Please login to add favorites");
      return;
    }
    try {
      await toggleWishlist(product.id, product);
      const isAdding = !wishlist.includes(product.id);
      toast.success(isAdding ? "Added to favorites!" : "Removed from favorites");
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      toast.error("Failed to update favorites");
    }
  };

  const [originTab, setOriginTab] = useState("single");
  useEffect(() => {
    const tabFromURL = searchParams.get("tab");
    if (tabFromURL === "multiple" || tabFromURL === "single") {
      setOriginTab(tabFromURL);
      localStorage.setItem("originTab", tabFromURL);
    } else {
      const saved = localStorage.getItem("originTab");
      if (saved) setOriginTab(saved);
    }
  }, [searchParams]);

  const categories = ["All", "Men", "Women", "Kids"];

  // ✅ Filter logic
  const filteredProducts = products.filter((p) => {
    const productName = p.name?.toLowerCase() || "";
    const productCategory = p.category?.toLowerCase() || "";

    const matchesCategory =
      selectedCategory === "All"
        ? true
        : productCategory === selectedCategory.toLowerCase();

    return matchesCategory;
  });

  const handleTryOn = (product: Product) => {
    const existing = JSON.parse(localStorage.getItem("tryonProducts") || "[]");
    const alreadyAdded = existing.some((p: Product) => p.id === product.id);
    const updated = alreadyAdded ? existing : [...existing, product];
    localStorage.setItem("tryonProducts", JSON.stringify(updated));
    localStorage.setItem("originTab", originTab);
    router.push(`/main/tryon?tab=${originTab}`);
  };

  // ✅ Back button confirmation toast
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();

      // Custom centered toast
      toast.custom(
        (t) => (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-[9999]">
            <div className="flex flex-col items-center justify-center bg-white shadow-2xl p-6 rounded-2xl text-center w-[90%] max-w-sm border border-gray-200">
              <h2 className="text-lg font-semibold mb-3">
                Are you sure you want to exit?
              </h2>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    router.back();
                  }}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
                >
                  Yes
                </button>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                >
                  No
                </button>
              </div>
            </div>
          </div>
        ),
        { duration: 4000, position: "top-center" }
      );
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen bg-white overflow-y-auto pb-24 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
      {/* Video Carousel */}
      <div className="relative w-full h-64 overflow-x-auto flex snap-x snap-mandatory scroll-smooth scrollbar-none">
        {["/BV1.mp4", "/BV2.mp4"].map((videoSrc, index) => (
          <div key={index} className="relative flex-shrink-0 w-full h-64 snap-center">
            <video
              src={videoSrc}
              autoPlay
              loop
              muted
              playsInline
              className="object-cover brightness-90 w-full h-full"
            />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute bottom-5 left-5 text-white">
              <h1 className="text-2xl font-semibold">
                {index === 0 ? "Discover your Style" : "New Arrivals"}
              </h1>
              <p className="text-sm opacity-90">
                {index === 0
                  ? "Try fashion that fits you best"
                  : "Explore the latest trends"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Admin Button */}
      {isAdminUser && (
        <div className="px-4 mt-4">
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all font-medium"
          >
            <ShoppingBag className="w-5 h-5" />
            Manage Products (Admin)
          </button>
        </div>
      )}

      {/* Categories */}
      <div className="px-4 mt-4">
        <h2 className="text-lg font-semibold mb-3">Categories</h2>
        <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2">
          {categories.map((cat) => (
            <div
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center justify-center min-w-[90px] px-4 py-2 rounded-full cursor-pointer transition-all text-sm font-medium ${
                selectedCategory === cat
                  ? "bg-black text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-800"
              }`}
            >
              {cat}
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 mt-3">
        <div className="flex items-center gap-2 w-full bg-white border border-gray-300 rounded-full px-4 py-2 shadow-md">
          <Search className="w-5 h-5 text-gray-600" />
          <input
            type="text"
            placeholder="Search with my product"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent outline-none text-sm w-full text-gray-800 placeholder-gray-500"
          />
        </div>
      </div>

      {/* Product List */}
      <div className="grid grid-cols-2 gap-4 p-4">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <div key={product.id} className="flex flex-col items-start">
              <div className="relative bg-[#f4f4f4] w-full h-[300px] rounded-[10px] overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover rounded-[10px]"
                />
              </div>
              <div className="mt-2 flex items-center justify-between w-full">
                <p className="text-[15px] text-gray-800 font-medium truncate">
                  {product.name}
                </p>
                <button
                  onClick={() => handleWishlistToggle(product)}
                  className="text-gray-600 hover:scale-110 transition-all"
                  title={
                    wishlist.includes(product.id)
                      ? "Remove from favorites"
                      : "Add to favorites"
                  }
                >
                  {wishlist.includes(product.id) ? (
                    <AiFillHeart className="text-red-500 text-[22px]" />
                  ) : (
                    <AiOutlineHeart className="text-gray-600 text-[22px]" />
                  )}
                </button>
              </div>
              <button
                onClick={() => handleTryOn(product)}
                className="mt-2 w-full bg-black text-white text-sm py-2 rounded-lg hover:bg-gray-800 transition"
              >
                Try On
              </button>
            </div>
          ))
        ) : (
          <p className="col-span-2 text-center text-gray-500 py-10">
            No products found for “{searchTerm || selectedCategory}”
          </p>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          Loading...
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
